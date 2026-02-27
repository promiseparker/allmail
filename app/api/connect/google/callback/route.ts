import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { encryptToken } from "@/lib/crypto";
import { cache, cacheKey } from "@/lib/redis";
import { enqueueSetupCalendars } from "@/lib/queue/jobs";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login`);
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/accounts?error=oauth_cancelled`
    );
  }

  // Validate state (CSRF prevention)
  const stateData = await cache.get<{ codeVerifier: string; userId: string }>(
    cacheKey.oauthState(state)
  );

  if (!stateData || stateData.userId !== session.user.id) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/accounts?error=invalid_state`
    );
  }

  await cache.del(cacheKey.oauthState(state));

  // Exchange code for tokens
  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/connect/google/callback`,
      grant_type: "authorization_code",
      code_verifier: stateData.codeVerifier,
    }),
  });

  if (!tokenResponse.ok) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/accounts?error=token_exchange_failed`
    );
  }

  const tokens = await tokenResponse.json() as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    id_token?: string;
  };

  if (!tokens.refresh_token) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/accounts?error=no_refresh_token`
    );
  }

  // Fetch user info
  const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  const userInfo = await userInfoResponse.json() as {
    id: string;
    email: string;
    name: string;
    picture: string;
  };

  // Encrypt tokens
  const { ciphertext: accessEnc, iv } = encryptToken(
    tokens.access_token,
    session.user.id
  );
  const { ciphertext: refreshEnc } = encryptToken(
    tokens.refresh_token,
    session.user.id
  );

  // Upsert connected account + tokens in a transaction
  const account = await db.$transaction(async (tx) => {
    const connectedAccount = await tx.connectedAccount.upsert({
      where: {
        userId_provider_providerAccountId: {
          userId: session.user.id,
          provider: "google",
          providerAccountId: userInfo.id,
        },
      },
      create: {
        userId: session.user.id,
        provider: "google",
        providerAccountId: userInfo.id,
        email: userInfo.email,
        displayName: userInfo.name,
        avatarUrl: userInfo.picture,
        scopes: ["calendar.readonly"],
        isActive: true,
        syncStatus: "pending",
      },
      update: {
        isActive: true,
        email: userInfo.email,
        displayName: userInfo.name,
        syncStatus: "pending",
        errorMessage: null,
      },
    });

    await tx.oAuthToken.upsert({
      where: { connectedAccountId: connectedAccount.id },
      create: {
        connectedAccountId: connectedAccount.id,
        accessTokenEnc: accessEnc,
        refreshTokenEnc: refreshEnc,
        tokenType: "Bearer",
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        iv,
      },
      update: {
        accessTokenEnc: accessEnc,
        refreshTokenEnc: refreshEnc,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        iv,
        updatedAt: new Date(),
      },
    });

    return connectedAccount;
  });

  // Kick off calendar discovery + initial sync
  await enqueueSetupCalendars(account.id, session.user.id);

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/accounts?connected=google`
  );
}

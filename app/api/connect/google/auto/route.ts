import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { encryptToken } from "@/lib/crypto";
import { enqueueSetupCalendars } from "@/lib/queue/jobs";

const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

// POST /api/connect/google/auto
// Connects Google Calendar using the tokens already stored by NextAuth on sign-in.
// No extra OAuth redirect needed.
export async function POST() {
  const session = await requireAuth();

  // Get the Google tokens NextAuth saved in auth_accounts during sign-in
  const authAccount = await db.account.findFirst({
    where: { userId: session.user.id, provider: "google" },
    select: {
      access_token: true,
      refresh_token: true,
      expires_at: true,
      providerAccountId: true,
    },
  });

  if (!authAccount?.access_token) {
    return NextResponse.json(
      { error: "No Google account found. Please sign out and sign in again with Google." },
      { status: 400 }
    );
  }

  if (!authAccount.refresh_token) {
    return NextResponse.json(
      { error: "No refresh token available. Please sign out and sign in again to grant offline access." },
      { status: 400 }
    );
  }

  // Fetch user profile from Google
  const userInfoRes = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${authAccount.access_token}` },
  });

  let userInfo: { id: string; email: string; name: string; picture: string } | null = null;
  if (userInfoRes.ok) {
    userInfo = await userInfoRes.json();
  }

  // Encrypt tokens for storage
  const expiresAt = authAccount.expires_at
    ? new Date(authAccount.expires_at * 1000)
    : new Date(Date.now() + 3600 * 1000);

  // Encrypt tokens — each call embeds its own IV in the returned buffer
  const accessEnc  = encryptToken(authAccount.access_token, session.user.id);
  const refreshEnc = encryptToken(authAccount.refresh_token, session.user.id);

  // Upsert connected account + tokens
  const account = await db.$transaction(async (tx) => {
    const connectedAccount = await tx.connectedAccount.upsert({
      where: {
        userId_provider_providerAccountId: {
          userId: session.user.id,
          provider: "google",
          providerAccountId: authAccount.providerAccountId,
        },
      },
      create: {
        userId: session.user.id,
        provider: "google",
        providerAccountId: authAccount.providerAccountId,
        email: userInfo?.email ?? session.user.email ?? "",
        displayName: userInfo?.name ?? session.user.name ?? "",
        avatarUrl: userInfo?.picture ?? null,
        scopes: ["calendar.readonly"],
        isActive: true,
        syncStatus: "pending",
      },
      update: {
        isActive: true,
        email: userInfo?.email ?? session.user.email ?? "",
        displayName: userInfo?.name ?? session.user.name ?? "",
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
        expiresAt,
      },
      update: {
        accessTokenEnc: accessEnc,
        refreshTokenEnc: refreshEnc,
        expiresAt,
        updatedAt: new Date(),
      },
    });

    return connectedAccount;
  });

  // Fire sync in background — don't block the response
  enqueueSetupCalendars(account.id, session.user.id).catch(console.error);

  return NextResponse.json({ success: true });
}

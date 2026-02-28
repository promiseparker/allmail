import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { encryptToken } from "@/lib/crypto";
import { cache, cacheKey } from "@/lib/redis";
import { enqueueSetupCalendars } from "@/lib/queue/jobs";

const MS_TENANT = process.env.MICROSOFT_TENANT_ID ?? "common";
const MS_TOKEN_URL = `https://login.microsoftonline.com/${MS_TENANT}/oauth2/v2.0/token`;

// Claims present in the Microsoft id_token payload
interface MicrosoftIdTokenClaims {
  // oid: immutable object ID — the correct stable key for work/school accounts.
  // sub changes per-application; oid is consistent across the tenant.
  oid?: string;
  // Personal MSA accounts use sub when oid is absent (rare on /common endpoint)
  sub?: string;
  email?: string;
  // preferred_username is the UPN (user@tenant.com) for work/school accounts
  preferred_username?: string;
  name?: string;
  // tid: tenant ID — useful for distinguishing personal vs work accounts
  tid?: string;
}

// GET /api/connect/microsoft/callback
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login`);
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  // Microsoft sends error + error_description on denial/failure
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/accounts?error=oauth_cancelled`
    );
  }

  // ── CSRF validation ──────────────────────────────────────────────────────
  // Consume the state value exactly once — any replay or forgery returns 400
  const stateData = await cache.get<{ codeVerifier: string; userId: string }>(
    cacheKey.oauthState(state)
  );

  if (!stateData || stateData.userId !== session.user.id) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/accounts?error=invalid_state`
    );
  }

  // Delete immediately — one-time use
  await cache.del(cacheKey.oauthState(state));

  // ── Token exchange ───────────────────────────────────────────────────────
  const tokenResponse = await fetch(MS_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID!,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/connect/microsoft/callback`,
      grant_type: "authorization_code",
      // PKCE verifier — Microsoft validates this matches the challenge from step 1
      code_verifier: stateData.codeVerifier,
    }),
  });

  if (!tokenResponse.ok) {
    const detail = await tokenResponse.text();
    console.error("Microsoft token exchange failed:", detail);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/accounts?error=token_exchange_failed`
    );
  }

  const tokens = await tokenResponse.json() as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    id_token?: string;
    token_type: string;
    scope: string;
  };

  // Microsoft only issues a refresh token when offline_access is in the scope.
  // If it's missing the user either denied it or the app isn't configured correctly.
  if (!tokens.refresh_token) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/accounts?error=no_refresh_token`
    );
  }

  // ── Decode id_token claims ───────────────────────────────────────────────
  // The id_token is a JWT we received directly from Microsoft's HTTPS token
  // endpoint, so decoding the payload without re-verifying the signature is
  // acceptable here. For defence-in-depth, signature verification via the
  // JWKS endpoint (https://login.microsoftonline.com/{tenant}/discovery/v2.0/keys)
  // can be layered on using the `jose` library.
  let claims: MicrosoftIdTokenClaims = {};
  if (tokens.id_token) {
    claims = decodeIdTokenPayload(tokens.id_token);
  }

  // oid is the stable, immutable identifier for a Microsoft identity.
  // Fall back to sub for personal MSA accounts where oid may be absent.
  const providerAccountId = claims.oid ?? claims.sub;
  if (!providerAccountId) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/accounts?error=missing_user_id`
    );
  }

  // email > preferred_username (UPN) — both uniquely identify the user
  const email = claims.email ?? claims.preferred_username;
  if (!email) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/accounts?error=missing_email`
    );
  }

  // ── Fetch display name + avatar from Graph /me ───────────────────────────
  // The id_token `name` claim is sufficient for most accounts, but the Graph
  // /me endpoint returns the canonical displayName and can supply a photo URL
  // (avatar fetched separately as it requires an extra binary request).
  const { displayName, avatarUrl } = await fetchMicrosoftProfile(
    tokens.access_token,
    claims.name
  );

  // ── Encrypt tokens ───────────────────────────────────────────────────────
  // Each call embeds its own IV in the returned buffer
  const accessEnc  = encryptToken(tokens.access_token, session.user.id);
  const refreshEnc = encryptToken(tokens.refresh_token, session.user.id);

  // Microsoft refresh tokens follow a 90-day sliding window: each successful
  // refresh issues a new refresh token that resets the 90-day clock.
  // Personal MSA accounts have a 14-day expiry without sliding window, so
  // 90 days is a safe conservative upper bound for enterprise accounts.
  const refreshExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

  // ── Persist account + tokens in a single transaction ────────────────────
  const account = await db.$transaction(async (tx) => {
    const connectedAccount = await tx.connectedAccount.upsert({
      where: {
        userId_provider_providerAccountId: {
          userId: session.user.id,
          provider: "microsoft",
          providerAccountId,
        },
      },
      create: {
        userId: session.user.id,
        provider: "microsoft",
        providerAccountId,
        email,
        displayName,
        avatarUrl,
        scopes: ["Calendars.Read", "offline_access"],
        isActive: true,
        syncStatus: "pending",
      },
      update: {
        // Reconnecting an existing account reactivates it and refreshes metadata
        isActive: true,
        email,
        displayName,
        avatarUrl,
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
        tokenType: tokens.token_type ?? "Bearer",
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        refreshExpiresAt,
      },
      update: {
        accessTokenEnc: accessEnc,
        refreshTokenEnc: refreshEnc,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        refreshExpiresAt,
        updatedAt: new Date(),
      },
    });

    return connectedAccount;
  });

  // ── Kick off calendar discovery + initial sync in the background ─────────
  enqueueSetupCalendars(account.id, session.user.id).catch(console.error);

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/accounts?connected=microsoft`
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Base64url-decode the payload section of a JWT and parse the JSON claims.
 * This is safe for tokens received directly from Microsoft's HTTPS token endpoint.
 */
function decodeIdTokenPayload(idToken: string): MicrosoftIdTokenClaims {
  const parts = idToken.split(".");
  if (parts.length !== 3 || !parts[1]) {
    throw new Error("Malformed id_token: expected 3 dot-separated segments");
  }

  // base64url → base64 (re-pad and replace URL-safe chars)
  const base64 = parts[1]
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(parts[1].length + ((4 - (parts[1].length % 4)) % 4), "=");

  const json = Buffer.from(base64, "base64").toString("utf-8");

  return JSON.parse(json) as MicrosoftIdTokenClaims;
}

/**
 * Fetch the user's display name and avatar from Microsoft Graph /me.
 *
 * Falls back gracefully:
 * - displayName falls back to the `name` claim from the id_token
 * - avatarUrl is null when the photo endpoint returns 404 (no photo set) or
 *   when User.Read scope was not granted
 */
async function fetchMicrosoftProfile(
  accessToken: string,
  idTokenName: string | undefined
): Promise<{ displayName: string | null; avatarUrl: string | null }> {
  let displayName: string | null = idTokenName ?? null;
  let avatarUrl: string | null = null;

  try {
    // /me returns displayName, mail, userPrincipalName, etc.
    const meResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (meResponse.ok) {
      const me = await meResponse.json() as {
        displayName?: string;
        mail?: string;
        userPrincipalName?: string;
      };
      displayName = me.displayName ?? displayName;
    }
  } catch {
    // Non-fatal — name from id_token is sufficient
  }

  try {
    // /me/photo/$value returns the profile photo as image bytes.
    // We request a small size (48x48) to avoid large payloads.
    const photoMetaResponse = await fetch(
      "https://graph.microsoft.com/v1.0/me/photos/48x48/$value",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "image/jpeg",
        },
      }
    );

    if (photoMetaResponse.ok) {
      // Convert the binary image to a base64 data URL so it can be stored
      // and rendered without an additional authenticated fetch later.
      const photoBuffer = await photoMetaResponse.arrayBuffer();
      const base64 = Buffer.from(photoBuffer).toString("base64");
      avatarUrl = `data:image/jpeg;base64,${base64}`;
    }
    // 404 = no photo set; 403 = User.Read.All not granted — both are fine
  } catch {
    // Non-fatal — avatar is optional
  }

  return { displayName, avatarUrl };
}

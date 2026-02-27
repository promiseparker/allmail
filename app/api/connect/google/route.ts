import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { encryptToken, generateSecureState, generateCodeVerifier, generateCodeChallenge } from "@/lib/crypto";
import { cache, cacheKey, CACHE_TTL } from "@/lib/redis";
import { PLAN_LIMITS } from "@/types/api";
import type { Plan } from "@/types/api";

// GET /api/connect/google — initiate OAuth flow
export async function GET(req: NextRequest) {
  const session = await requireAuth();

  // Check plan limits
  const accountCount = await db.connectedAccount.count({
    where: { userId: session.user.id, isActive: true },
  });

  const plan = session.user.plan as Plan;
  const limit = PLAN_LIMITS[plan].connectedAccounts;

  if (accountCount >= limit) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/accounts?error=plan_limit`
    );
  }

  const state = generateSecureState();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Store state + verifier in Redis for callback verification
  await cache.set(
    cacheKey.oauthState(state),
    { codeVerifier, userId: session.user.id },
    CACHE_TTL.OAUTH_STATE
  );

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/connect/google/callback`,
    response_type: "code",
    scope: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/calendar.readonly",
    ].join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  );
}

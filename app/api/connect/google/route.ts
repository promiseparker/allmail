import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { generateSecureState, generateCodeVerifier, generateCodeChallenge } from "@/lib/crypto";
import { cache, cacheKey, CACHE_TTL } from "@/lib/redis";
import { PLAN_LIMITS } from "@/types/api";
import type { Plan } from "@/types/api";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

const GOOGLE_SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
].join(" ");

// GET /api/connect/google — initiate Google Calendar OAuth flow with explicit write scope
export async function GET() {
  const session = await requireAuth();

  // Check plan limits before starting the flow
  const accountCount = await db.connectedAccount.count({
    where: { userId: session.user.id, isActive: true },
  });

  const plan = session.user.plan as Plan;
  const limit = PLAN_LIMITS[plan].connectedAccounts;

  if (accountCount >= limit) {
    return NextResponse.redirect(`${APP_URL}/accounts?error=plan_limit`);
  }

  const state = generateSecureState();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Persist state + verifier in cache — consumed once in the callback
  await cache.set(
    cacheKey.oauthState(state),
    { codeVerifier, userId: session.user.id },
    CACHE_TTL.OAUTH_STATE
  );

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${APP_URL}/api/connect/google/callback`,
    response_type: "code",
    scope: GOOGLE_SCOPES,
    access_type: "offline",
    prompt: "consent",          // Always show consent so Google issues a fresh refresh token
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return NextResponse.redirect(`${GOOGLE_AUTH_URL}?${params}`);
}

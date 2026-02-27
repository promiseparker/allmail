import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { generateSecureState, generateCodeVerifier, generateCodeChallenge } from "@/lib/crypto";
import { cache, cacheKey, CACHE_TTL } from "@/lib/redis";
import { PLAN_LIMITS } from "@/types/api";
import type { Plan } from "@/types/api";

const MS_TENANT = process.env.MICROSOFT_TENANT_ID ?? "common";
const MS_AUTH_URL = `https://login.microsoftonline.com/${MS_TENANT}/oauth2/v2.0/authorize`;

// GET /api/connect/microsoft — initiate Microsoft OAuth flow
export async function GET(req: NextRequest) {
  const session = await requireAuth();

  // Enforce plan account limit before starting the flow
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

  // Persist state + verifier in Redis — consumed once in the callback
  await cache.set(
    cacheKey.oauthState(state),
    { codeVerifier, userId: session.user.id },
    CACHE_TTL.OAUTH_STATE
  );

  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/connect/microsoft/callback`,
    response_type: "code",
    // offline_access is how Microsoft requests a refresh token (no access_type=offline)
    scope: "openid email profile offline_access Calendars.Read",
    // select_account lets multi-account users choose which identity to connect
    prompt: "select_account",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return NextResponse.redirect(`${MS_AUTH_URL}?${params}`);
}

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { encryptToken } from "@/lib/crypto";
import { enqueueSetupCalendars } from "@/lib/queue/jobs";
import { testCaldavConnection } from "@/lib/providers/caldav/client";
import { PLAN_LIMITS } from "@/types/api";
import type { Plan } from "@/types/api";

export async function POST(req: NextRequest) {
  const session = await requireAuth();

  const body = await req.json() as {
    serverUrl: string;
    username:  string;
    password:  string;
    platform?: string; // "apple" | "fastmail" | "yahoo" | "nextcloud" | "caldav"
  };

  const { serverUrl, username, password, platform = "caldav" } = body;

  if (!serverUrl || !username || !password) {
    return NextResponse.json(
      { error: "serverUrl, username and password are required" },
      { status: 400 }
    );
  }

  // Plan limit check
  const plan  = session.user.plan as Plan;
  const limit = PLAN_LIMITS[plan].connectedAccounts;
  const count = await db.connectedAccount.count({
    where: { userId: session.user.id, isActive: true },
  });
  if (limit !== Infinity && count >= limit) {
    return NextResponse.json({ error: "Account limit reached for your plan" }, { status: 403 });
  }

  // Test the CalDAV credentials before storing anything
  const test = await testCaldavConnection(serverUrl, username, password);
  if (!test.ok) {
    return NextResponse.json(
      { error: test.error ?? "Could not connect to CalDAV server. Check your credentials." },
      { status: 400 }
    );
  }

  // Encrypt credentials
  // accessTokenEnc  = password (the permanent CalDAV credential)
  // refreshTokenEnc = server URL (needed to reconnect on each sync)
  const accessEnc  = encryptToken(password,   session.user.id);
  const serverEnc  = encryptToken(serverUrl,  session.user.id);

  // providerAccountId = platform + ":" + username (stable unique key per account)
  const providerAccountId = `${platform}:${username}`;

  const account = await db.$transaction(async (tx) => {
    const connectedAccount = await tx.connectedAccount.upsert({
      where: {
        userId_provider_providerAccountId: {
          userId:            session.user.id,
          provider:          "caldav",
          providerAccountId,
        },
      },
      create: {
        userId:            session.user.id,
        provider:          "caldav",
        providerAccountId,
        email:             username,
        displayName:       username,
        scopes:            ["calendar.readonly"],
        isActive:          true,
        syncStatus:        "pending",
      },
      update: {
        isActive:      true,
        email:         username,
        syncStatus:    "pending",
        errorMessage:  null,
      },
    });

    await tx.oAuthToken.upsert({
      where: { connectedAccountId: connectedAccount.id },
      create: {
        connectedAccountId: connectedAccount.id,
        accessTokenEnc:     accessEnc,
        refreshTokenEnc:    serverEnc,
        tokenType:          "CalDAV",
        // CalDAV credentials don't expire — set far-future date
        expiresAt:          new Date("2099-01-01"),
      },
      update: {
        accessTokenEnc:  accessEnc,
        refreshTokenEnc: serverEnc,
        expiresAt:       new Date("2099-01-01"),
        updatedAt:       new Date(),
      },
    });

    return connectedAccount;
  });

  // Kick off calendar discovery + initial sync in the background
  enqueueSetupCalendars(account.id, session.user.id).catch(console.error);

  return NextResponse.json({ success: true, accountId: account.id });
}

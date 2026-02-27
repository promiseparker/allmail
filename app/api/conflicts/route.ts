import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { cache, cacheKey, CACHE_TTL } from "@/lib/redis";
import { detectAndSaveConflicts } from "@/lib/conflicts/detector";
import { z } from "zod";

const INCLUDE_EVENTS = {
  eventA: {
    select: {
      id: true, title: true, startsAt: true, endsAt: true,
      calendar: { select: { name: true, color: true } },
    },
  },
  eventB: {
    select: {
      id: true, title: true, startsAt: true, endsAt: true,
      calendar: { select: { name: true, color: true } },
    },
  },
} as const;

// GET /api/conflicts?status=active|acknowledged
export async function GET(req: NextRequest) {
  const session = await requireAuth();

  const statusParam = req.nextUrl.searchParams.get("status");
  const status =
    statusParam === "acknowledged" ? "acknowledged"
    : statusParam === "resolved"    ? "resolved"
    : "active";

  // Only cache the default "active" view
  if (status === "active") {
    const ck = cacheKey.conflicts(session.user.id);
    const cached = await cache.get(ck);
    if (cached) return NextResponse.json({ data: cached });

    const conflicts = await db.conflictFlag.findMany({
      where: { userId: session.user.id, status: "active" },
      include: INCLUDE_EVENTS,
      orderBy: [{ severity: "asc" }, { overlapStart: "asc" }],
    });

    await cache.set(ck, conflicts, CACHE_TTL.CONFLICTS);
    return NextResponse.json({ data: conflicts });
  }

  const conflicts = await db.conflictFlag.findMany({
    where: { userId: session.user.id, status },
    include: INCLUDE_EVENTS,
    orderBy: [{ severity: "asc" }, { overlapStart: "asc" }],
  });

  return NextResponse.json({ data: conflicts });
}

// POST /api/conflicts — trigger a conflict rescan for the current user
export async function POST() {
  const session = await requireAuth();

  await detectAndSaveConflicts(session.user.id);
  await cache.del(cacheKey.conflicts(session.user.id));

  return NextResponse.json({ data: { rescanned: true } });
}

// PATCH /api/conflicts — acknowledge or resolve a single conflict
const patchSchema = z.object({
  conflictId: z.string(),
  action: z.enum(["acknowledge", "resolve", "reopen"]),
});

export async function PATCH(req: NextRequest) {
  const session = await requireAuth();
  const body = patchSchema.safeParse(await req.json());

  if (!body.success) {
    return NextResponse.json(
      { error: { code: "validation_error", message: "Invalid body" } },
      { status: 400 }
    );
  }

  const { conflictId, action } = body.data;

  const conflict = await db.conflictFlag.findFirst({
    where: { id: conflictId, userId: session.user.id },
  });

  if (!conflict) {
    return NextResponse.json({ error: { code: "not_found" } }, { status: 404 });
  }

  await db.conflictFlag.update({
    where: { id: conflictId },
    data: {
      status:     action === "resolve"    ? "resolved"
                : action === "acknowledge" ? "acknowledged"
                : "active",
      resolvedAt: action === "resolve" ? new Date() : null,
    },
  });

  await cache.del(cacheKey.conflicts(session.user.id));
  return NextResponse.json({ data: { success: true } });
}

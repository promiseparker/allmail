import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { cache, cacheKey, CACHE_TTL } from "@/lib/redis";
import type { CalendarEvent } from "@/types/events";
import { z } from "zod";

const querySchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
  calendarIds: z.string().optional(), // comma-separated
});

// GET /api/events?start=...&end=...
export async function GET(req: NextRequest) {
  const session = await requireAuth();

  const parsed = querySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams)
  );

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "validation_error", message: "Invalid query params" } },
      { status: 400 }
    );
  }

  const { start, end, calendarIds } = parsed.data;

  // Check cache
  const ck = cacheKey.events(session.user.id, start, end);
  const cached = await cache.get<CalendarEvent[]>(ck);
  if (cached) {
    return NextResponse.json({ data: cached });
  }

  const calendarFilter = calendarIds ? calendarIds.split(",") : undefined;

  const events = await db.event.findMany({
    where: {
      userId: session.user.id,
      deletedAt: null,
      status: { not: "cancelled" },
      startsAt: { gte: new Date(start) },
      endsAt: { lte: new Date(end) },
      ...(calendarFilter ? { calendarId: { in: calendarFilter } } : {}),
    },
    include: {
      calendar: {
        select: { name: true, color: true },
      },
    },
    orderBy: { startsAt: "asc" },
  });

  // Fetch active conflicts for this window
  const conflicts = await db.conflictFlag.findMany({
    where: { userId: session.user.id, status: "active" },
    select: { eventIdA: true, eventIdB: true, severity: true },
  });

  const conflictMap = new Map<string, "hard" | "soft">();
  for (const c of conflicts) {
    if (!conflictMap.has(c.eventIdA) || c.severity === "hard") {
      conflictMap.set(c.eventIdA, c.severity);
    }
    if (!conflictMap.has(c.eventIdB) || c.severity === "hard") {
      conflictMap.set(c.eventIdB, c.severity);
    }
  }

  const normalized: CalendarEvent[] = events.map((e) => ({
    id: e.id,
    userId: e.userId,
    calendarId: e.calendarId,
    calendarName: e.calendar.name,
    calendarColor: e.calendar.color ?? "#6B7280",
    provider: e.provider,
    providerEventId: e.providerEventId,
    title: e.title,
    description: e.description,
    location: e.location,
    url: e.url,
    startsAt: e.startsAt,
    endsAt: e.endsAt,
    isAllDay: e.isAllDay,
    timezone: e.timezone,
    isRecurring: e.isRecurring,
    recurrenceRule: e.recurrenceRule,
    status: e.status,
    visibility: e.visibility,
    organizer: e.organizer as any,
    attendees: e.attendees as any,
    attendeeCount: e.attendeeCount,
    hasConflict: conflictMap.has(e.id),
    conflictSeverity: conflictMap.get(e.id) ?? null,
  }));

  await cache.set(ck, normalized, CACHE_TTL.EVENT_LIST);

  return NextResponse.json({ data: normalized });
}

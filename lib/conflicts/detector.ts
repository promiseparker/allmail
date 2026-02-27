import { db } from "@/lib/db";
import type { TimeSlot } from "@/types/events";
import type { ConflictFlag } from "@prisma/client";

const MIN_OVERLAP_MINUTES = 5;

interface ConflictResult {
  eventIdA: string;
  eventIdB: string;
  overlapStart: Date;
  overlapEnd: Date;
  overlapMinutes: number;
  severity: "hard" | "soft";
}

// ============================================================
// DETECT & PERSIST CONFLICTS FOR A USER
// ============================================================

export async function detectAndSaveConflicts(userId: string): Promise<void> {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  // Fetch all non-all-day, non-cancelled events in window
  const events = await db.event.findMany({
    where: {
      userId,
      isAllDay: false,
      status: { not: "cancelled" },
      deletedAt: null,
      startsAt: { gte: now },
      endsAt: { lte: windowEnd },
    },
    select: {
      id: true,
      calendarId: true,
      title: true,
      startsAt: true,
      endsAt: true,
    },
    orderBy: { startsAt: "asc" },
  });

  const conflicts = detectConflicts(
    events.map((e) => ({
      eventId: e.id,
      calendarId: e.calendarId,
      calendarColor: "",
      provider: "google", // unused in detection
      title: e.title,
      startsAt: e.startsAt,
      endsAt: e.endsAt,
    }))
  );

  // Resolve conflicts that no longer exist
  const conflictPairs = new Set(
    conflicts.map((c) => `${c.eventIdA}:${c.eventIdB}`)
  );

  const activeConflicts = await db.conflictFlag.findMany({
    where: { userId, status: "active" },
    select: { id: true, eventIdA: true, eventIdB: true },
  });

  const toResolve = activeConflicts
    .filter((c) => !conflictPairs.has(`${c.eventIdA}:${c.eventIdB}`))
    .map((c) => c.id);

  if (toResolve.length > 0) {
    await db.conflictFlag.updateMany({
      where: { id: { in: toResolve } },
      data: { status: "resolved", resolvedAt: new Date() },
    });
  }

  // Upsert new conflicts
  for (const conflict of conflicts) {
    await db.conflictFlag.upsert({
      where: {
        eventIdA_eventIdB: {
          eventIdA: conflict.eventIdA,
          eventIdB: conflict.eventIdB,
        },
      },
      create: {
        userId,
        eventIdA: conflict.eventIdA,
        eventIdB: conflict.eventIdB,
        overlapStart: conflict.overlapStart,
        overlapEnd: conflict.overlapEnd,
        overlapMinutes: conflict.overlapMinutes,
        severity: conflict.severity,
        status: "active",
      },
      update: {
        overlapStart: conflict.overlapStart,
        overlapEnd: conflict.overlapEnd,
        overlapMinutes: conflict.overlapMinutes,
        severity: conflict.severity,
        status: "active",
        resolvedAt: null,
      },
    });
  }
}

// ============================================================
// SWEEP LINE ALGORITHM — O(n log n)
// ============================================================

export function detectConflicts(events: TimeSlot[]): ConflictResult[] {
  const sorted = [...events].sort(
    (a, b) => a.startsAt.getTime() - b.startsAt.getTime()
  );

  const conflicts: ConflictResult[] = [];
  const active: TimeSlot[] = [];

  for (const event of sorted) {
    // Evict events that have ended
    const stillActive = active.filter((e) => e.endsAt > event.startsAt);
    active.length = 0;
    active.push(...stillActive);

    // Every remaining active event overlaps with current
    for (const other of active) {
      const overlapStart = event.startsAt;
      const overlapEnd = new Date(
        Math.min(other.endsAt.getTime(), event.endsAt.getTime())
      );
      const overlapMinutes = Math.round(
        (overlapEnd.getTime() - overlapStart.getTime()) / 60_000
      );

      if (overlapMinutes >= MIN_OVERLAP_MINUTES) {
        // Ensure consistent ordering (A < B by ID for unique constraint)
        const [idA, idB] =
          other.eventId < event.eventId
            ? [other.eventId, event.eventId]
            : [event.eventId, other.eventId];

        conflicts.push({
          eventIdA: idA,
          eventIdB: idB,
          overlapStart,
          overlapEnd,
          overlapMinutes,
          // Hard = same calendar, Soft = cross-calendar
          severity: other.calendarId === event.calendarId ? "hard" : "soft",
        });
      }
    }

    active.push(event);
  }

  return conflicts;
}

// ============================================================
// FREE SLOT SUGGESTIONS
// ============================================================

interface FreeSlotOptions {
  durationMinutes: number;
  windowStart: Date;
  windowEnd: Date;
  workingHoursStart?: number; // 0-23, default 9
  workingHoursEnd?: number;   // 0-23, default 18
  userTimezone?: string;
}

export function suggestFreeSlots(
  busyEvents: Array<{ startsAt: Date; endsAt: Date }>,
  options: FreeSlotOptions
): Array<{ startsAt: Date; endsAt: Date; score: number; label: string }> {
  const {
    durationMinutes,
    windowStart,
    windowEnd,
    workingHoursStart = 9,
    workingHoursEnd = 18,
  } = options;

  const durationMs = durationMinutes * 60_000;
  const merged = mergePeriods(busyEvents);
  const slots: Array<{ startsAt: Date; endsAt: Date; score: number; label: string }> = [];

  let cursor = windowStart;

  for (const busy of merged) {
    if (cursor < busy.startsAt) {
      collectSlots(cursor, busy.startsAt, durationMs, workingHoursStart, workingHoursEnd, slots);
    }
    cursor = new Date(Math.max(cursor.getTime(), busy.endsAt.getTime()));
  }

  if (cursor < windowEnd) {
    collectSlots(cursor, windowEnd, durationMs, workingHoursStart, workingHoursEnd, slots);
  }

  return slots
    .map((slot) => ({
      ...slot,
      score: scoreSlot(slot.startsAt, merged),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

function mergePeriods(
  periods: Array<{ startsAt: Date; endsAt: Date }>
): Array<{ startsAt: Date; endsAt: Date }> {
  if (periods.length === 0) return [];

  const sorted = [...periods].sort(
    (a, b) => a.startsAt.getTime() - b.startsAt.getTime()
  );

  const merged = [{ ...sorted[0]! }];

  for (const period of sorted.slice(1)) {
    const last = merged[merged.length - 1]!;
    if (period.startsAt <= last.endsAt) {
      last.endsAt = new Date(Math.max(last.endsAt.getTime(), period.endsAt.getTime()));
    } else {
      merged.push({ ...period });
    }
  }

  return merged;
}

function collectSlots(
  gapStart: Date,
  gapEnd: Date,
  durationMs: number,
  workStart: number,
  workEnd: number,
  output: Array<{ startsAt: Date; endsAt: Date; score: number; label: string }>
): void {
  let t = new Date(gapStart);

  while (t.getTime() + durationMs <= gapEnd.getTime()) {
    const hour = t.getHours();
    if (hour >= workStart && hour + durationMs / 3_600_000 <= workEnd) {
      const slotEnd = new Date(t.getTime() + durationMs);
      output.push({
        startsAt: new Date(t),
        endsAt: slotEnd,
        score: 0,
        label: labelSlot(t),
      });
    }
    t = new Date(t.getTime() + 30 * 60_000); // 30-min grid
  }
}

function scoreSlot(
  startsAt: Date,
  busy: Array<{ startsAt: Date; endsAt: Date }>
): number {
  const hour = startsAt.getHours();
  let score = 50;

  // Prefer morning slots (9-11)
  if (hour >= 9 && hour < 11) score += 30;
  // Decent afternoon (13-15)
  else if (hour >= 13 && hour < 15) score += 20;
  // Late afternoon penalty
  else if (hour >= 16) score -= 10;

  // Penalise slots immediately adjacent to busy periods
  const bufferMs = 15 * 60_000;
  for (const b of busy) {
    if (
      Math.abs(startsAt.getTime() - b.endsAt.getTime()) < bufferMs ||
      Math.abs(startsAt.getTime() - b.startsAt.getTime()) < bufferMs
    ) {
      score -= 15;
    }
  }

  return Math.max(0, score);
}

function labelSlot(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return "Morning slot";
  if (hour < 13) return "Late morning";
  if (hour < 14) return "Lunchtime";
  if (hour < 17) return "Afternoon slot";
  return "End of day";
}

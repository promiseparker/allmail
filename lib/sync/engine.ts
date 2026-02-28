import { db } from "@/lib/db";
import { GoogleCalendarClient } from "@/lib/providers/google/client";
import { MicrosoftCalendarClient } from "@/lib/providers/microsoft/client";
import { CaldavCalendarClient } from "@/lib/providers/caldav/client";
import { mapGoogleEvent } from "@/lib/providers/google/mapper";
import { mapMicrosoftEvent } from "@/lib/providers/microsoft/mapper";
import { mapCaldavEvents } from "@/lib/providers/caldav/mapper";
import { detectAndSaveConflicts } from "@/lib/conflicts/detector";
import { cache, cacheKey } from "@/lib/redis";
import type { NormalizedEvent } from "@/types/events";
import type { SyncResult } from "@/types/providers";

const BATCH_SIZE = 500;

// ============================================================
// FULL SYNC — fetch all events from scratch
// ============================================================

export async function fullSync(connectedAccountId: string): Promise<void> {
  const account = await db.connectedAccount.findUnique({
    where: { id: connectedAccountId },
    include: { user: true },
  });
  if (!account) throw new Error("Account not found");

  const startLog = await db.syncLog.create({
    data: {
      connectedAccountId,
      syncType: "full",
      status: "started",
    },
  });

  let totalCreated = 0;
  let totalUpdated = 0;
  let totalDeleted = 0;
  const errors: string[] = [];

  try {
    await db.connectedAccount.update({
      where: { id: connectedAccountId },
      data: { syncStatus: "syncing" },
    });

    const calendars = await db.calendar.findMany({
      where: { connectedAccountId, isEnabled: true },
    });

    // Process each calendar
    await Promise.allSettled(
      calendars.map(async (calendar) => {
        try {
          const result = await syncCalendar(calendar.id, account.userId, "full");
          totalCreated += result.created;
          totalUpdated += result.updated;
          totalDeleted += result.deleted;
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          errors.push(`Calendar ${calendar.name}: ${msg}`);
        }
      })
    );

    // Trigger conflict detection after sync
    await detectAndSaveConflicts(account.userId);

    // Invalidate user's event cache
    await cache.delPattern(`events:${account.userId}:*`);
    await cache.del(cacheKey.conflicts(account.userId));
    await cache.del(cacheKey.todayAgenda(account.userId));

    await db.connectedAccount.update({
      where: { id: connectedAccountId },
      data: {
        syncStatus: errors.length === 0 ? "synced" : "error",
        lastSyncedAt: new Date(),
        errorMessage: errors.length > 0 ? errors.join("; ") : null,
      },
    });

    await db.syncLog.update({
      where: { id: startLog.id },
      data: {
        status: errors.length === 0 ? "completed" : "partial",
        eventsCreated: totalCreated,
        eventsUpdated: totalUpdated,
        eventsDeleted: totalDeleted,
        errorMessage: errors.length > 0 ? errors.join("; ") : null,
        completedAt: new Date(),
        durationMs: Date.now() - startLog.startedAt.getTime(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await db.connectedAccount.update({
      where: { id: connectedAccountId },
      data: { syncStatus: "error", errorMessage: message },
    });
    await db.syncLog.update({
      where: { id: startLog.id },
      data: {
        status: "failed",
        errorMessage: message,
        completedAt: new Date(),
      },
    });
    throw error;
  }
}

// ============================================================
// DELTA SYNC — only fetch changes since last sync
// ============================================================

export async function deltaSync(calendarId: string, userId: string): Promise<SyncResult> {
  return syncCalendar(calendarId, userId, "delta");
}

// ============================================================
// CALENDAR-LEVEL SYNC
// ============================================================

async function syncCalendar(
  calendarId: string,
  userId: string,
  type: "full" | "delta"
): Promise<SyncResult> {
  const calendar = await db.calendar.findUnique({
    where: { id: calendarId },
    include: { connectedAccount: true },
  });
  if (!calendar) throw new Error("Calendar not found");

  const { connectedAccount } = calendar;
  const result: SyncResult = { created: 0, updated: 0, deleted: 0, errors: [] };

  if (connectedAccount.provider === "google") {
    await syncGoogleCalendar(calendar, connectedAccount.id, userId, type, result);
  } else if (connectedAccount.provider === "microsoft") {
    await syncMicrosoftCalendar(calendar, connectedAccount.id, userId, type, result);
  } else if (connectedAccount.provider === "caldav") {
    await syncCaldavCalendar(calendar, connectedAccount.id, userId, result);
  }

  return result;
}

async function syncGoogleCalendar(
  calendar: { id: string; providerCalendarId: string; syncToken: string | null },
  connectedAccountId: string,
  userId: string,
  type: "full" | "delta",
  result: SyncResult
): Promise<void> {
  const client = new GoogleCalendarClient(connectedAccountId, userId);
  let pageToken: string | undefined;

  do {
    const { events, nextSyncToken, nextPageToken } = await client.listEvents(
      calendar.providerCalendarId,
      {
        syncToken: type === "delta" ? (calendar.syncToken ?? undefined) : undefined,
      }
    );

    pageToken = nextPageToken;

    if (events.length > 0) {
      const normalized = events.map(mapGoogleEvent);
      const batchResult = await upsertEvents(normalized, calendar.id, userId, "google");
      result.created += batchResult.created;
      result.updated += batchResult.updated;
      result.deleted += batchResult.deleted;
    }

    if (nextSyncToken) {
      await db.calendar.update({
        where: { id: calendar.id },
        data: { syncToken: nextSyncToken },
      });
    }
  } while (pageToken);
}

async function syncMicrosoftCalendar(
  calendar: { id: string; providerCalendarId: string; syncToken: string | null },
  connectedAccountId: string,
  userId: string,
  type: "full" | "delta",
  result: SyncResult
): Promise<void> {
  const client = new MicrosoftCalendarClient(connectedAccountId, userId);

  const { events, nextDeltaLink } = await client.listEvents(
    calendar.providerCalendarId,
    {
      deltaLink: type === "delta" ? (calendar.syncToken ?? undefined) : undefined,
    }
  );

  if (events.length > 0) {
    const normalized = events.map(mapMicrosoftEvent);
    const batchResult = await upsertEvents(normalized, calendar.id, userId, "microsoft");
    result.created += batchResult.created;
    result.updated += batchResult.updated;
    result.deleted += batchResult.deleted;
  }

  if (nextDeltaLink) {
    await db.calendar.update({
      where: { id: calendar.id },
      data: { syncToken: nextDeltaLink },
    });
  }

  result.nextDeltaLink = nextDeltaLink;
}

async function syncCaldavCalendar(
  calendar: { id: string; providerCalendarId: string },
  connectedAccountId: string,
  userId: string,
  result: SyncResult
): Promise<void> {
  const client = new CaldavCalendarClient(connectedAccountId, userId);

  const objects = await client.listEvents(calendar.providerCalendarId);

  const normalized = objects.flatMap((obj) =>
    mapCaldavEvents(obj.data ?? "", obj.url ?? "", obj.etag ?? undefined)
  );

  if (normalized.length > 0) {
    const batchResult = await upsertEvents(normalized, calendar.id, userId, "caldav");
    result.created += batchResult.created;
    result.updated += batchResult.updated;
    result.deleted += batchResult.deleted;
  }
}

// ============================================================
// UPSERT EVENTS IN BATCHES
// ============================================================

async function upsertEvents(
  events: NormalizedEvent[],
  calendarId: string,
  userId: string,
  provider: "google" | "microsoft" | "caldav"
): Promise<{ created: number; updated: number; deleted: number }> {
  let created = 0;
  let updated = 0;
  let deleted = 0;

  // Process in batches
  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    const batch = events.slice(i, i + BATCH_SIZE);

    for (const event of batch) {
      if (event.status === "cancelled") {
        // Soft delete
        const result = await db.event.updateMany({
          where: {
            calendarId,
            providerEventId: event.providerEventId,
            deletedAt: null,
          },
          data: { deletedAt: new Date(), status: "cancelled" },
        });
        if (result.count > 0) deleted++;
        continue;
      }

      const existing = await db.event.findUnique({
        where: { calendarId_providerEventId: { calendarId, providerEventId: event.providerEventId } },
        select: { id: true, providerEtag: true },
      });

      const eventData = {
        userId,
        calendarId,
        providerEventId: event.providerEventId,
        providerIcalUid: event.providerIcalUid,
        title: event.title,
        description: event.description,
        location: event.location,
        url: event.url,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        isAllDay: event.isAllDay,
        timezone: event.timezone,
        isRecurring: event.isRecurring,
        recurrenceRule: event.recurrenceRule,
        recurringEventId: event.recurringEventId,
        originalStartTime: event.originalStartTime,
        status: event.status,
        visibility: event.visibility,
        organizer: event.organizer ?? undefined,
        attendees: event.attendees ?? undefined,
        attendeeCount: event.attendeeCount ?? 0,
        provider,
        providerEtag: event.providerEtag,
        providerRaw: event.providerRaw,
        syncedAt: new Date(),
        deletedAt: null,
      };

      if (!existing) {
        await db.event.create({ data: eventData });
        created++;
      } else if (existing.providerEtag !== event.providerEtag) {
        await db.event.update({
          where: { id: existing.id },
          data: eventData,
        });
        updated++;
      }
      // If etag matches, skip — no changes
    }
  }

  return { created, updated, deleted };
}

// ============================================================
// INITIAL CALENDAR SETUP (discover + register calendars)
// ============================================================

export async function setupCalendars(connectedAccountId: string, userId: string): Promise<void> {
  const account = await db.connectedAccount.findUnique({
    where: { id: connectedAccountId },
  });
  if (!account) throw new Error("Account not found");

  if (account.provider === "google") {
    const client = new GoogleCalendarClient(connectedAccountId, userId);
    const gCalendars = await client.listCalendars();

    for (const cal of gCalendars) {
      await db.calendar.upsert({
        where: {
          connectedAccountId_providerCalendarId: {
            connectedAccountId,
            providerCalendarId: cal.id!,
          },
        },
        create: {
          connectedAccountId,
          providerCalendarId: cal.id!,
          name: cal.summary!,
          color: cal.backgroundColor ?? "#4285F4",
          isPrimary: !!cal.primary,
          accessRole: cal.accessRole ?? "reader",
          timezone: cal.timeZone,
        },
        update: {
          name: cal.summary!,
          color: cal.backgroundColor ?? "#4285F4",
        },
      });
    }
  } else if (account.provider === "microsoft") {
    const client = new MicrosoftCalendarClient(connectedAccountId, userId);
    const msCalendars = await client.listCalendars();

    for (const cal of msCalendars) {
      await db.calendar.upsert({
        where: {
          connectedAccountId_providerCalendarId: {
            connectedAccountId,
            providerCalendarId: cal.id,
          },
        },
        create: {
          connectedAccountId,
          providerCalendarId: cal.id,
          name: cal.name,
          color: "#00A4EF",
          isPrimary: cal.isDefaultCalendar ?? false,
          accessRole: cal.canEdit ? "writer" : "reader",
        },
        update: {
          name: cal.name,
        },
      });
    }
  } else if (account.provider === "caldav") {
    const client = new CaldavCalendarClient(connectedAccountId, userId);
    const davCalendars = await client.listCalendars();

    for (const cal of davCalendars) {
      if (!cal.url) continue;
      // Only include VEVENT calendars (skip VTODO / VJOURNAL)
      const components = cal.components ?? [];
      if (components.length > 0 && !components.includes("VEVENT")) continue;

      await db.calendar.upsert({
        where: {
          connectedAccountId_providerCalendarId: {
            connectedAccountId,
            providerCalendarId: cal.url,
          },
        },
        create: {
          connectedAccountId,
          providerCalendarId: cal.url,
          name: (cal.displayName as string | undefined) ?? cal.url,
          color: "#6B7280",
          isPrimary: false,
          accessRole: "reader",
          timezone: (cal.timezone as string | undefined) ?? null,
        },
        update: {
          name: (cal.displayName as string | undefined) ?? cal.url,
        },
      });
    }
  }
}

import type { calendar_v3 } from "googleapis";
import type { NormalizedEvent } from "@/types/events";

export function mapGoogleEvent(raw: calendar_v3.Schema$Event): NormalizedEvent {
  const isAllDay = !!raw.start?.date;

  const startsAt = isAllDay
    ? new Date(raw.start!.date! + "T00:00:00Z")
    : new Date(raw.start!.dateTime!);

  const endsAt = isAllDay
    ? new Date(raw.end!.date! + "T00:00:00Z")
    : new Date(raw.end!.dateTime!);

  return {
    providerEventId: raw.id!,
    providerIcalUid: raw.iCalUID ?? undefined,
    provider: "google",

    title: raw.summary ?? "(No title)",
    description: raw.description ?? undefined,
    location: raw.location ?? undefined,
    url: raw.htmlLink ?? undefined,

    startsAt,
    endsAt,
    isAllDay,
    timezone: raw.start?.timeZone ?? undefined,

    isRecurring: !!(raw.recurrence?.length || raw.recurringEventId),
    recurrenceRule: raw.recurrence?.[0] ?? undefined,
    recurringEventId: raw.recurringEventId ?? undefined,
    originalStartTime: raw.originalStartTime?.dateTime
      ? new Date(raw.originalStartTime.dateTime)
      : undefined,

    status: mapGoogleStatus(raw.status),
    visibility: mapGoogleVisibility(raw.visibility),

    organizer: raw.organizer?.email
      ? {
          email: raw.organizer.email,
          name: raw.organizer.displayName ?? undefined,
        }
      : undefined,

    attendees: raw.attendees?.map((a) => ({
      email: a.email!,
      name: a.displayName ?? undefined,
      status: mapGoogleAttendeeStatus(a.responseStatus),
      self: a.self ?? false,
    })),

    attendeeCount: raw.attendees?.length ?? 0,
    providerEtag: raw.etag ?? undefined,
    providerRaw: raw as Record<string, unknown>,
  };
}

function mapGoogleStatus(
  status: string | null | undefined
): NormalizedEvent["status"] {
  switch (status) {
    case "tentative":
      return "tentative";
    case "cancelled":
      return "cancelled";
    default:
      return "confirmed";
  }
}

function mapGoogleVisibility(
  visibility: string | null | undefined
): NormalizedEvent["visibility"] {
  switch (visibility) {
    case "public":
      return "public";
    case "private":
      return "private";
    case "confidential":
      return "confidential";
    default:
      return "default";
  }
}

function mapGoogleAttendeeStatus(
  status: string | null | undefined
): "accepted" | "declined" | "tentative" | "needsAction" {
  switch (status) {
    case "accepted":
      return "accepted";
    case "declined":
      return "declined";
    case "tentative":
      return "tentative";
    default:
      return "needsAction";
  }
}

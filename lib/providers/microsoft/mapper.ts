import type { MicrosoftEvent } from "@/types/providers";
import type { NormalizedEvent } from "@/types/events";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";

// Windows timezone → IANA map (partial — extend as needed)
const WINDOWS_TO_IANA: Record<string, string> = {
  "Eastern Standard Time": "America/New_York",
  "Central Standard Time": "America/Chicago",
  "Mountain Standard Time": "America/Denver",
  "Pacific Standard Time": "America/Los_Angeles",
  "UTC": "UTC",
  "GMT Standard Time": "Europe/London",
  "Romance Standard Time": "Europe/Paris",
  "Central Europe Standard Time": "Europe/Berlin",
};

function resolveTimezone(windowsTz: string): string {
  return WINDOWS_TO_IANA[windowsTz] ?? windowsTz;
}

function parseWindowsDateTime(dateTime: string, timeZone: string): Date {
  const iana = resolveTimezone(timeZone);
  // dateTime from Microsoft is like "2024-03-15T09:00:00.0000000"
  // We need to interpret it in the given timezone
  const cleanDt = dateTime.replace(/\.\d+$/, ""); // strip microseconds
  const zoned = toZonedTime(new Date(cleanDt + "Z"), iana);
  return new Date(
    formatInTimeZone(zoned, iana, "yyyy-MM-dd'T'HH:mm:ssxxx")
  );
}

export function mapMicrosoftEvent(raw: MicrosoftEvent): NormalizedEvent {
  const startsAt = raw.isAllDay
    ? new Date(raw.start.dateTime.split("T")[0] + "T00:00:00Z")
    : parseWindowsDateTime(raw.start.dateTime, raw.start.timeZone);

  const endsAt = raw.isAllDay
    ? new Date(raw.end.dateTime.split("T")[0] + "T00:00:00Z")
    : parseWindowsDateTime(raw.end.dateTime, raw.end.timeZone);

  return {
    providerEventId: raw.id,
    providerIcalUid: raw.iCalUId,
    provider: "microsoft",

    title: raw.subject ?? "(No title)",
    description: raw.body?.content
      ? stripHtml(raw.body.content)
      : undefined,
    location: raw.location?.displayName ?? undefined,
    url: raw.webLink ?? undefined,

    startsAt,
    endsAt,
    isAllDay: raw.isAllDay,
    timezone: resolveTimezone(raw.start.timeZone),

    isRecurring: !!(raw.recurrence || raw.seriesMasterId),
    recurrenceRule: raw.recurrence
      ? buildRRule(raw.recurrence.pattern, raw.recurrence.range)
      : undefined,
    recurringEventId: raw.seriesMasterId ?? undefined,

    status: mapMicrosoftStatus(raw.showAs, raw.isCancelled),
    visibility: mapMicrosoftVisibility(raw.sensitivity),

    organizer: {
      email: raw.organizer.emailAddress.address,
      name: raw.organizer.emailAddress.name ?? undefined,
    },

    attendees: raw.attendees?.map((a) => ({
      email: a.emailAddress.address,
      name: a.emailAddress.name ?? undefined,
      status: mapMicrosoftAttendeeStatus(a.status.response),
      self: false,
    })),

    attendeeCount: raw.attendees?.length ?? 0,
    providerRaw: raw as unknown as Record<string, unknown>,
  };
}

function mapMicrosoftStatus(
  showAs?: string,
  isCancelled?: boolean
): NormalizedEvent["status"] {
  if (isCancelled) return "cancelled";
  if (showAs === "tentative") return "tentative";
  return "confirmed";
}

function mapMicrosoftVisibility(
  sensitivity?: string
): NormalizedEvent["visibility"] {
  switch (sensitivity) {
    case "private":
      return "private";
    case "confidential":
      return "confidential";
    default:
      return "default";
  }
}

function mapMicrosoftAttendeeStatus(
  response: string
): "accepted" | "declined" | "tentative" | "needsAction" {
  switch (response?.toLowerCase()) {
    case "accepted":
      return "accepted";
    case "declined":
      return "declined";
    case "tentativelyaccepted":
      return "tentative";
    default:
      return "needsAction";
  }
}

function buildRRule(pattern: any, range: any): string {
  // Simplified RRULE builder from Microsoft recurrence objects
  const parts: string[] = ["RRULE:"];
  const freq = {
    daily: "DAILY",
    weekly: "WEEKLY",
    absoluteMonthly: "MONTHLY",
    absoluteYearly: "YEARLY",
  }[pattern.type as string] ?? "WEEKLY";

  parts.push(`FREQ=${freq}`);
  if (pattern.interval > 1) parts.push(`;INTERVAL=${pattern.interval}`);
  if (pattern.daysOfWeek?.length) {
    const days = pattern.daysOfWeek
      .map((d: string) => d.substring(0, 2).toUpperCase())
      .join(",");
    parts.push(`;BYDAY=${days}`);
  }
  if (range.type === "endDate" && range.endDate) {
    parts.push(`;UNTIL=${range.endDate.replace(/-/g, "")}T000000Z`);
  }
  if (range.type === "numbered" && range.numberOfOccurrences) {
    parts.push(`;COUNT=${range.numberOfOccurrences}`);
  }

  return parts.join("");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

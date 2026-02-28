import type { NormalizedEvent } from "@/types/events";

// ── ICS helpers ───────────────────────────────────────────────────────────────

/** Unfold RFC 5545 folded lines (CRLF/LF + whitespace → nothing) */
function unfold(ics: string): string {
  return ics.replace(/\r?\n[ \t]/g, "");
}

/** Get the first value of a property (handles param syntax like DTSTART;TZID=...:value) */
function getProp(block: string, prop: string): string | undefined {
  const regex = new RegExp(`^${prop}(?:;[^:\r\n]*)?:([^\r\n]*)`, "mi");
  const m     = block.match(regex);
  if (!m?.[1]) return undefined;
  return m[1]
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();
}

/** Parse an iCal date/datetime string to a JS Date */
function parseDate(raw: string | undefined): Date | undefined {
  if (!raw) return undefined;
  const v = raw.replace(/TZID=[^:]+:/i, "").trim();

  if (/^\d{8}$/.test(v)) {
    // All-day: YYYYMMDD
    return new Date(`${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}T00:00:00Z`);
  }
  if (/^\d{8}T\d{6}Z?$/i.test(v)) {
    const y  = v.slice(0, 4);
    const mo = v.slice(4, 6);
    const d  = v.slice(6, 8);
    const h  = v.slice(9, 11);
    const mi = v.slice(11, 13);
    const s  = v.slice(13, 15);
    const z  = v.toUpperCase().endsWith("Z") ? "Z" : "";
    return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}${z}`);
  }
  return undefined;
}

/** Extract all VEVENT blocks from a VCALENDAR string */
function extractVEvents(ics: string): string[] {
  const unfolded = unfold(ics);
  const results: string[] = [];
  const matches = unfolded.matchAll(/BEGIN:VEVENT([\s\S]*?)END:VEVENT/gi);
  for (const m of matches) {
    if (m[1]) results.push(m[1]);
  }
  return results;
}

// ── Public mapper ─────────────────────────────────────────────────────────────

export function mapCaldavEvents(
  icsData: string,
  objectUrl: string,
  etag: string | undefined
): NormalizedEvent[] {
  const events: NormalizedEvent[] = [];

  for (const block of extractVEvents(icsData)) {
    const uid     = getProp(block, "UID");
    const summary = getProp(block, "SUMMARY");
    if (!uid) continue;

    const dtstart  = getProp(block, "DTSTART");
    const dtend    = getProp(block, "DTEND");
    const startsAt = parseDate(dtstart);
    if (!startsAt) continue;

    const endsAt   = parseDate(dtend) ?? new Date(startsAt.getTime() + 60 * 60 * 1000);
    const isAllDay = !!dtstart && /^\d{8}$/.test(dtstart.replace(/TZID=[^:]+:/i, "").trim());

    const statusRaw = getProp(block, "STATUS")?.toUpperCase();
    const status    =
      statusRaw === "CANCELLED" ? "cancelled"
      : statusRaw === "TENTATIVE" ? "tentative"
      : "confirmed";

    // Timezone from DTSTART;TZID=... property parameter
    const tzMatch  = block.match(/DTSTART;TZID=([^:]+):/i);
    const timezone = tzMatch?.[1];

    const rrule      = getProp(block, "RRULE");
    const recurringId = getProp(block, "RECURRENCE-ID");
    const organizer  = getProp(block, "ORGANIZER");

    events.push({
      provider:          "caldav",
      providerEventId:   uid,
      providerIcalUid:   uid,
      title:             summary ?? "(No title)",
      description:       getProp(block, "DESCRIPTION"),
      location:          getProp(block, "LOCATION"),
      url:               objectUrl,
      startsAt,
      endsAt,
      isAllDay,
      timezone,
      isRecurring:       !!(rrule ?? recurringId),
      recurrenceRule:    rrule,
      recurringEventId:  recurringId,
      originalStartTime: recurringId ? parseDate(recurringId) : undefined,
      status:            status as "confirmed" | "tentative" | "cancelled",
      visibility:        "default",
      organizer:         organizer
        ? { email: organizer.replace(/^mailto:/i, "") }
        : undefined,
      attendeeCount:     0,
      providerEtag:      etag,
      providerRaw:       { ics: icsData },
    });
  }

  return events;
}

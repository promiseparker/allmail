import type { Provider, EventStatus, EventVisibility, ConflictSeverity } from "@prisma/client";

// ============================================================
// NORMALIZED EVENT MODEL
// ============================================================

export interface NormalizedEvent {
  // Identity
  providerEventId: string;
  providerIcalUid?: string;
  provider: Provider;

  // Core
  title: string;
  description?: string;
  location?: string;
  url?: string;

  // Timing
  startsAt: Date;
  endsAt: Date;
  isAllDay: boolean;
  timezone?: string;

  // Recurrence
  isRecurring: boolean;
  recurrenceRule?: string;
  recurringEventId?: string;
  originalStartTime?: Date;

  // Status
  status: EventStatus;
  visibility: EventVisibility;

  // People
  organizer?: EventPerson;
  attendees?: EventAttendee[];
  attendeeCount?: number;

  // Provider metadata
  providerEtag?: string;
  providerRaw?: Record<string, unknown>;
}

export interface EventPerson {
  email: string;
  name?: string;
}

export interface EventAttendee extends EventPerson {
  status: "accepted" | "declined" | "tentative" | "needsAction";
  self: boolean;
}

// ============================================================
// CALENDAR EVENT (DB shape + calendar context)
// ============================================================

export interface CalendarEvent {
  id: string;
  userId: string;
  calendarId: string;
  calendarName: string;
  calendarColor: string;
  provider: Provider;
  providerEventId: string;

  title: string;
  description?: string | null;
  location?: string | null;
  url?: string | null;

  startsAt: Date;
  endsAt: Date;
  isAllDay: boolean;
  timezone?: string | null;

  isRecurring: boolean;
  recurrenceRule?: string | null;

  status: EventStatus;
  visibility: EventVisibility;

  organizer?: EventPerson | null;
  attendees?: EventAttendee[] | null;
  attendeeCount: number;

  hasConflict?: boolean;
  conflictSeverity?: ConflictSeverity | null;
}

// ============================================================
// TIME SLOT
// ============================================================

export interface TimeSlot {
  eventId: string;
  calendarId: string;
  calendarColor: string;
  provider: Provider;
  title: string;
  startsAt: Date;
  endsAt: Date;
}

// ============================================================
// FREE SLOT SUGGESTION
// ============================================================

export interface FreeSlotSuggestion {
  startsAt: Date;
  endsAt: Date;
  durationMinutes: number;
  score: number;
  label: string; // "Morning slot", "After lunch", etc.
}

// ============================================================
// CALENDAR VIEW TYPES
// ============================================================

export type CalendarView = "day" | "week" | "month";

export interface CalendarRange {
  start: Date;
  end: Date;
}

export interface EventsByDay {
  [dateKey: string]: CalendarEvent[]; // key: "2024-03-15"
}

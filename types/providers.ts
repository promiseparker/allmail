// ============================================================
// GOOGLE CALENDAR API TYPES (simplified)
// ============================================================

export interface GoogleEventDateTime {
  date?: string;       // "2024-03-15" for all-day
  dateTime?: string;   // "2024-03-15T09:00:00-07:00"
  timeZone?: string;
}

export interface GoogleAttendee {
  email?: string;
  displayName?: string;
  organizer?: boolean;
  self?: boolean;
  responseStatus?: "needsAction" | "declined" | "tentative" | "accepted";
}

export interface GoogleEvent {
  id?: string;
  iCalUID?: string;
  summary?: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  start?: GoogleEventDateTime;
  end?: GoogleEventDateTime;
  recurrence?: string[];
  recurringEventId?: string;
  originalStartTime?: GoogleEventDateTime;
  status?: "confirmed" | "tentative" | "cancelled";
  visibility?: "default" | "public" | "private" | "confidential";
  organizer?: { email?: string; displayName?: string };
  attendees?: GoogleAttendee[];
  etag?: string;
}

export interface GoogleCalendar {
  id?: string;
  summary?: string;
  description?: string;
  backgroundColor?: string;
  primary?: boolean;
  accessRole?: string;
  timeZone?: string;
}

// ============================================================
// MICROSOFT GRAPH API TYPES (simplified)
// ============================================================

export interface MicrosoftDateTime {
  dateTime: string;
  timeZone: string;
}

export interface MicrosoftEmailAddress {
  name?: string;
  address: string;
}

export interface MicrosoftAttendee {
  emailAddress: MicrosoftEmailAddress;
  status: { response: string; time: string };
  type: "required" | "optional" | "resource";
}

export interface MicrosoftRecurrencePattern {
  type: string;
  interval: number;
  daysOfWeek?: string[];
  dayOfMonth?: number;
  month?: number;
  firstDayOfWeek?: string;
  index?: string;
}

export interface MicrosoftRecurrenceRange {
  type: string;
  startDate: string;
  endDate?: string;
  numberOfOccurrences?: number;
}

export interface MicrosoftEvent {
  id: string;
  iCalUId?: string;
  subject?: string;
  body?: { contentType: string; content: string };
  start: MicrosoftDateTime;
  end: MicrosoftDateTime;
  isAllDay: boolean;
  isCancelled: boolean;
  showAs?: string;
  sensitivity?: string;
  location?: { displayName?: string };
  organizer: { emailAddress: MicrosoftEmailAddress };
  attendees?: MicrosoftAttendee[];
  recurrence?: {
    pattern: MicrosoftRecurrencePattern;
    range: MicrosoftRecurrenceRange;
  };
  seriesMasterId?: string;
  webLink?: string;
}

export interface MicrosoftCalendar {
  id: string;
  name: string;
  color?: string;
  isDefaultCalendar?: boolean;
  canEdit?: boolean;
  owner?: { name: string; address: string };
}

// ============================================================
// SYNC RESULT
// ============================================================

export interface SyncResult {
  created: number;
  updated: number;
  deleted: number;
  errors: string[];
  nextSyncToken?: string;
  nextDeltaLink?: string;
}

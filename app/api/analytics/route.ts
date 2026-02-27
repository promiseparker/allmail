import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { cache, cacheKey, CACHE_TTL } from "@/lib/redis";
import { PLAN_LIMITS } from "@/types/api";
import type { Plan } from "@/types/api";
import {
  subDays, format, getHours, getDay,
  startOfISOWeek, getISOWeek, getISOWeekYear,
} from "date-fns";

export interface CalendarStat {
  calendarId: string;
  name: string;
  color: string;
  provider: string;
  hours: number;
  eventCount: number;
}

export interface WeekStat {
  weekKey: string;    // "2024-W11"
  weekLabel: string;  // "Mar 11"
  hours: number;
}

export interface BurnoutAlert {
  type: "overload_streak" | "heavy_week" | "no_breaks" | "meeting_heavy";
  severity: "high" | "medium";
  description: string;
  date?: string;
  weekLabel?: string;
  hours?: number;
}

export interface ComparisonStats {
  totalScheduledHours: number;
  meetingHours: number;
  focusHours: number;
  totalEvents: number;
  totalMeetings: number;
  activeDays: number;
}

export interface AnalyticsData {
  period: number;
  // Summary
  totalScheduledHours: number;
  averageDailyHours: number;
  meetingHours: number;
  focusHours: number;
  totalEvents: number;
  totalMeetings: number;
  activeDays: number;
  // Distributions
  dailyLoad: Record<string, number>;
  hourLoad: Record<string, number>;
  weekdayAvg: Record<string, number>;
  // Breakdown
  calendarBreakdown: CalendarStat[];
  // Trend
  weeklyTrend: WeekStat[];
  // Burnout
  burnoutAlerts: BurnoutAlert[];
  // Peaks
  busiestDate: string | null;
  busiestDateHours: number;
  busiestHour: number | null;
  // Comparison (previous equal-length period)
  comparison: ComparisonStats;
}

// Day-of-week label mapping: getDay() returns 0=Sun, 1=Mon...
const DOW_LABELS: Record<number, string> = {
  0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat",
};
// Ordered Mon→Sun for display
const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0];

// GET /api/analytics?period=30
export async function GET(req: NextRequest) {
  const session = await requireAuth();
  const plan = session.user.plan as Plan;

  if (!PLAN_LIMITS[plan].analyticsEnabled) {
    return NextResponse.json(
      { error: { code: "plan_required", message: "Analytics requires Pro" } },
      { status: 403 }
    );
  }

  const period = Math.min(parseInt(req.nextUrl.searchParams.get("period") ?? "30"), 365);
  const ck = cacheKey.analytics(session.user.id, String(period));

  const cached = await cache.get(ck);
  if (cached) return NextResponse.json({ data: cached });

  const since    = subDays(new Date(), period);
  const prevSince = subDays(new Date(), period * 2);

  const [events, prevEvents] = await Promise.all([
  db.event.findMany({
    where: {
      userId: session.user.id,
      isAllDay: false,
      status: "confirmed",
      deletedAt: null,
      startsAt: { gte: since },
    },
    select: {
      startsAt: true,
      endsAt: true,
      calendarId: true,
      attendeeCount: true,
      calendar: {
        select: {
          name: true,
          color: true,
          connectedAccount: { select: { provider: true } },
        },
      },
    },
    orderBy: { startsAt: "asc" },
  }),
  db.event.findMany({
    where: {
      userId:    session.user.id,
      isAllDay:  false,
      status:    "confirmed",
      deletedAt: null,
      startsAt:  { gte: prevSince, lt: since },
    },
    select: { startsAt: true, endsAt: true, attendeeCount: true },
  }),
  ]);

  // ── Accumulators ──────────────────────────────────────────────────────────
  const dailyLoad: Record<string, number> = {};
  const hourLoad: Record<string, number> = {};
  const dowTotal: Record<number, number> = {};    // sum per day-of-week
  const dowCount: Record<number, number> = {};    // occurrences of that DOW in period
  const weekLoad: Record<string, { label: string; hours: number }> = {};
  const calMap: Record<string, CalendarStat> = {};

  let totalHours = 0;
  let meetingHours = 0;
  let focusHours = 0;
  let totalMeetings = 0;

  for (const event of events) {
    const dur = (event.endsAt.getTime() - event.startsAt.getTime()) / 3_600_000;
    totalHours += dur;

    const isMeeting = (event.attendeeCount ?? 0) > 1;
    if (isMeeting) { meetingHours += dur; totalMeetings++; }
    else focusHours += dur;

    // Daily
    const dateKey = format(event.startsAt, "yyyy-MM-dd");
    dailyLoad[dateKey] = (dailyLoad[dateKey] ?? 0) + dur;

    // Hourly (0–23 → store as string key for JSON safety)
    const h = String(getHours(event.startsAt));
    hourLoad[h] = (hourLoad[h] ?? 0) + dur;

    // Day-of-week (0=Sun...6=Sat)
    const dow = getDay(event.startsAt);
    dowTotal[dow] = (dowTotal[dow] ?? 0) + dur;

    // ISO week key e.g. "2024-W11"
    const wk = `${getISOWeekYear(event.startsAt)}-W${String(getISOWeek(event.startsAt)).padStart(2, "0")}`;
    const weekDate = startOfISOWeek(event.startsAt);
    if (!weekLoad[wk]) weekLoad[wk] = { label: format(weekDate, "MMM d"), hours: 0 };
    weekLoad[wk]!.hours += dur;

    // Calendar breakdown
    if (!calMap[event.calendarId]) {
      calMap[event.calendarId] = {
        calendarId: event.calendarId,
        name: event.calendar.name,
        color: event.calendar.color ?? "#6B7280",
        provider: event.calendar.connectedAccount.provider,
        hours: 0,
        eventCount: 0,
      };
    }
    calMap[event.calendarId]!.hours += dur;
    calMap[event.calendarId]!.eventCount += 1;
  }

  // ── DOW: compute how many times each day-of-week fell in the period ───────
  for (let i = 0; i <= period; i++) {
    const d = subDays(new Date(), i);
    const dow = getDay(d);
    dowCount[dow] = (dowCount[dow] ?? 0) + 1;
  }
  const weekdayAvg: Record<string, number> = {};
  for (const dow of DOW_ORDER) {
    const label = DOW_LABELS[dow]!;
    const count = dowCount[dow] ?? 1;
    weekdayAvg[label] = round2((dowTotal[dow] ?? 0) / count);
  }

  // ── Summary stats ─────────────────────────────────────────────────────────
  const activeDays = Object.keys(dailyLoad).length;
  const averageDailyHours = activeDays > 0 ? round2(totalHours / activeDays) : 0;

  const sortedDaily = Object.entries(dailyLoad).sort(([, a], [, b]) => b - a);
  const busiestDate = sortedDaily[0]?.[0] ?? null;
  const busiestDateHours = round2(sortedDaily[0]?.[1] ?? 0);
  const sortedHour = Object.entries(hourLoad).sort(([, a], [, b]) => b - a);
  const busiestHour = sortedHour[0] ? parseInt(sortedHour[0][0]) : null;

  // ── Burnout signals ───────────────────────────────────────────────────────
  const burnoutAlerts: BurnoutAlert[] = [];
  const dailyEntries = Object.entries(dailyLoad).sort(([a], [b]) => a.localeCompare(b));

  // 1. Overload streak: 5+ consecutive days >9h
  let streak = 0;
  let streakStart = "";
  for (const [date, hours] of dailyEntries) {
    if (hours > 9) {
      if (streak === 0) streakStart = date;
      streak++;
      if (streak === 5) {
        burnoutAlerts.push({
          type: "overload_streak",
          severity: "high",
          description: `5+ consecutive days with over 9 hours scheduled, starting ${format(new Date(streakStart), "MMM d")}`,
          date: streakStart,
          hours: round2(hours),
        });
      }
    } else {
      streak = 0;
    }
  }

  // 2. Heavy week: any ISO week with >50h
  for (const [wk, data] of Object.entries(weekLoad)) {
    if (data.hours > 50) {
      burnoutAlerts.push({
        type: "heavy_week",
        severity: "high",
        description: `${round2(data.hours)}h scheduled the week of ${data.label} — exceeds the 50h threshold`,
        weekLabel: data.label,
        hours: round2(data.hours),
      });
    }
  }

  // 3. No rest: 7+ consecutive days with any events
  let restStreak = 0;
  let restStreakStart = "";
  for (const [date] of dailyEntries) {
    if (restStreak === 0) restStreakStart = date;
    restStreak++;
    if (restStreak >= 7) {
      burnoutAlerts.push({
        type: "no_breaks",
        severity: "medium",
        description: `No clear days detected — events scheduled every day since ${format(new Date(restStreakStart), "MMM d")}`,
        date: restStreakStart,
      });
      restStreak = 0; // Reset to avoid spamming the same signal
    }
  }

  // 4. Meeting-heavy day: >6h of meetings in a single day
  const meetingByDay: Record<string, number> = {};
  for (const event of events) {
    if ((event.attendeeCount ?? 0) > 1) {
      const dur = (event.endsAt.getTime() - event.startsAt.getTime()) / 3_600_000;
      const d = format(event.startsAt, "yyyy-MM-dd");
      meetingByDay[d] = (meetingByDay[d] ?? 0) + dur;
    }
  }
  for (const [date, hrs] of Object.entries(meetingByDay)) {
    if (hrs > 6) {
      burnoutAlerts.push({
        type: "meeting_heavy",
        severity: "medium",
        description: `${round2(hrs)}h of meetings on ${format(new Date(date), "EEE, MMM d")} — little time left for focused work`,
        date,
        hours: round2(hrs),
      });
    }
  }

  // ── Comparison period stats ───────────────────────────────────────────────
  const prevDailyLoad: Record<string, boolean> = {};
  let prevTotalHours   = 0;
  let prevMeetingHours = 0;
  let prevFocusHours   = 0;
  let prevMeetings     = 0;

  for (const e of prevEvents) {
    const dur      = (e.endsAt.getTime() - e.startsAt.getTime()) / 3_600_000;
    const isMeeting = (e.attendeeCount ?? 0) > 1;
    prevTotalHours += dur;
    if (isMeeting) { prevMeetingHours += dur; prevMeetings++; }
    else prevFocusHours += dur;
    prevDailyLoad[format(e.startsAt, "yyyy-MM-dd")] = true;
  }

  const comparison: ComparisonStats = {
    totalScheduledHours: round2(prevTotalHours),
    meetingHours:        round2(prevMeetingHours),
    focusHours:          round2(prevFocusHours),
    totalEvents:         prevEvents.length,
    totalMeetings:       prevMeetings,
    activeDays:          Object.keys(prevDailyLoad).length,
  };

  // ── Assemble response ─────────────────────────────────────────────────────
  const analytics: AnalyticsData = {
    period,
    totalScheduledHours: round2(totalHours),
    averageDailyHours,
    meetingHours: round2(meetingHours),
    focusHours: round2(focusHours),
    totalEvents: events.length,
    totalMeetings,
    activeDays,
    dailyLoad: Object.fromEntries(
      Object.entries(dailyLoad).map(([k, v]) => [k, round2(v)])
    ),
    hourLoad: Object.fromEntries(
      Object.entries(hourLoad).map(([k, v]) => [k, round2(v)])
    ),
    weekdayAvg,
    calendarBreakdown: Object.values(calMap)
      .map((c) => ({ ...c, hours: round2(c.hours) }))
      .sort((a, b) => b.hours - a.hours),
    weeklyTrend: Object.entries(weekLoad)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([weekKey, data]) => ({
        weekKey,
        weekLabel: data.label,
        hours: round2(data.hours),
      })),
    burnoutAlerts,
    busiestDate,
    busiestDateHours,
    busiestHour,
    comparison,
  };

  await cache.set(ck, analytics, CACHE_TTL.ANALYTICS);
  return NextResponse.json({ data: analytics });
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

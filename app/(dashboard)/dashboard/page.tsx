import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { TodayAgenda } from "@/components/dashboard/today-agenda";
import { UpcomingWeek } from "@/components/dashboard/upcoming-week";
import { ConflictBanner } from "@/components/conflicts/conflict-banner";
import {
  startOfToday, endOfToday,
  startOfWeek, endOfWeek,
  addDays, isSameDay,
} from "date-fns";
import type { WeekDayData } from "@/components/dashboard/upcoming-week";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireAuth();

  const today     = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd   = endOfWeek(today, { weekStartsOn: 1 });

  const [todayEvents, weekEvents, activeConflicts, accounts] = await Promise.all([
    db.event.findMany({
      where: {
        userId:   session.user.id,
        deletedAt: null,
        status:   { not: "cancelled" },
        startsAt: { gte: startOfToday() },
        endsAt:   { lte: endOfToday() },
      },
      include: {
        calendar: { select: { name: true, color: true } },
      },
      orderBy: { startsAt: "asc" },
    }),

    db.event.findMany({
      where: {
        userId:   session.user.id,
        deletedAt: null,
        status:   { not: "cancelled" },
        startsAt: { gte: weekStart },
        endsAt:   { lte: weekEnd },
      },
      select: { startsAt: true, endsAt: true, isAllDay: true },
    }),

    db.conflictFlag.count({
      where: { userId: session.user.id, status: "active" },
    }),

    db.connectedAccount.count({
      where: { userId: session.user.id, isActive: true },
    }),
  ]);

  const totalMeetingMs = todayEvents
    .filter((e) => !e.isAllDay)
    .reduce((sum, e) => sum + (e.endsAt.getTime() - e.startsAt.getTime()), 0);
  const totalMeetingHours = Math.round((totalMeetingMs / 3_600_000) * 10) / 10;

  // Build per-day data for the week strip
  const weekDayData: WeekDayData[] = Array.from({ length: 7 }, (_, i) => {
    const day      = addDays(weekStart, i);
    const dayEvts  = weekEvents.filter((e) => isSameDay(e.startsAt, day));
    const hoursMs  = dayEvts
      .filter((e) => !e.isAllDay)
      .reduce((sum, e) => sum + (e.endsAt.getTime() - e.startsAt.getTime()), 0);
    return {
      date:       day,
      eventCount: dayEvts.length,
      hours:      Math.round((hoursMs / 3_600_000) * 10) / 10,
    };
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {today.toLocaleDateString("en-US", {
            weekday: "long",
            month:   "long",
            day:     "numeric",
          })}
        </p>
      </div>

      {activeConflicts > 0 && (
        <ConflictBanner count={activeConflicts} />
      )}

      <SummaryCards
        eventCount={todayEvents.length}
        conflictCount={activeConflicts}
        meetingHours={totalMeetingHours}
        accountCount={accounts}
      />

      <div className="mt-5">
        <UpcomingWeek days={weekDayData} />
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-700">Today&apos;s agenda</h2>
          <span className="text-xs text-gray-400">
            {todayEvents.length} event{todayEvents.length !== 1 ? "s" : ""}
          </span>
        </div>
        <TodayAgenda events={todayEvents as any} />
      </div>
    </div>
  );
}

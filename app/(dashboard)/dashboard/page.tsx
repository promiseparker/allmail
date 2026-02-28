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

function getGreeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const session = await requireAuth();

  const today     = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd   = endOfWeek(today, { weekStartsOn: 1 });

  const [todayEvents, weekEvents, activeConflicts, accounts] = await Promise.all([
    db.event.findMany({
      where: {
        userId:    session.user.id,
        deletedAt: null,
        status:    { not: "cancelled" },
        startsAt:  { gte: startOfToday() },
        endsAt:    { lte: endOfToday() },
      },
      include: {
        calendar: { select: { name: true, color: true } },
      },
      orderBy: { startsAt: "asc" },
    }),

    db.event.findMany({
      where: {
        userId:    session.user.id,
        deletedAt: null,
        status:    { not: "cancelled" },
        startsAt:  { gte: weekStart },
        endsAt:    { lte: weekEnd },
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

  const weekDayData: WeekDayData[] = Array.from({ length: 7 }, (_, i) => {
    const day     = addDays(weekStart, i);
    const dayEvts = weekEvents.filter((e) => isSameDay(e.startsAt, day));
    const hoursMs = dayEvts
      .filter((e) => !e.isAllDay)
      .reduce((sum, e) => sum + (e.endsAt.getTime() - e.startsAt.getTime()), 0);
    return {
      date:       day,
      eventCount: dayEvts.length,
      hours:      Math.round((hoursMs / 3_600_000) * 10) / 10,
    };
  });

  const firstName = session.user.name?.split(" ")[0] ?? "there";
  const greeting  = getGreeting(today.getHours());

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Greeting */}
      <div className="mb-7">
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest mb-1">
          {today.toLocaleDateString("en-US", {
            weekday: "long",
            month:   "long",
            day:     "numeric",
          })}
        </p>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          {greeting}, {firstName}
        </h1>
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

      {/* Week + Agenda two-column layout */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-4">
        {/* Today's agenda */}
        <TodayAgenda events={todayEvents as any} />

        {/* This week */}
        <UpcomingWeek days={weekDayData} />
      </div>
    </div>
  );
}

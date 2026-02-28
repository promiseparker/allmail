"use client";

import Link from "next/link";
import { isToday, format, isTomorrow } from "date-fns";
import { cn } from "@/lib/utils";

export interface WeekDayData {
  date:       Date;
  eventCount: number;
  hours:      number;
}

interface UpcomingWeekProps {
  days: WeekDayData[];
}

export function UpcomingWeek({ days }: UpcomingWeekProps) {
  const maxHours = Math.max(...days.map((d) => d.hours), 1);

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 h-full">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-gray-900">This week</h2>
        <Link
          href="/calendar"
          className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors"
        >
          Open calendar →
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const today     = isToday(day.date);
          const tomorrow  = isTomorrow(day.date);
          const past      = day.date < new Date() && !today;
          const barPct    = maxHours > 0 ? (day.hours / maxHours) * 100 : 0;
          const hasEvents = day.eventCount > 0;

          return (
            <Link
              key={day.date.toISOString()}
              href={`/calendar?date=${format(day.date, "yyyy-MM-dd")}&view=day`}
              className={cn(
                "group flex flex-col items-center gap-1.5 p-2 rounded-xl transition-colors cursor-pointer",
                today
                  ? "bg-gray-100 border border-gray-200"
                  : "hover:bg-gray-50",
              )}
            >
              {/* Day name */}
              <span
                className={cn(
                  "text-[10px] font-medium uppercase tracking-wide",
                  today    ? "text-gray-900" :
                  past     ? "text-gray-300" :
                  tomorrow ? "text-gray-600" :
                  "text-gray-400"
                )}
              >
                {format(day.date, "EEE")}
              </span>

              {/* Date circle */}
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
                  today
                    ? "bg-gray-900 text-white"
                    : past
                    ? "text-gray-300"
                    : "text-gray-700 group-hover:bg-gray-100",
                )}
              >
                {format(day.date, "d")}
              </div>

              {/* Busy bar */}
              <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                {hasEvents && (
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      today ? "bg-gray-800" : past ? "bg-gray-200" : "bg-gray-400",
                    )}
                    style={{ width: `${Math.max(barPct, 20)}%` }}
                  />
                )}
              </div>

              {/* Event count */}
              <span
                className={cn(
                  "text-[10px] tabular-nums",
                  today
                    ? "text-gray-800 font-medium"
                    : past
                    ? "text-gray-300"
                    : hasEvents
                    ? "text-gray-500"
                    : "text-gray-300",
                )}
              >
                {hasEvents ? String(day.eventCount) : "·"}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Week summary */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {days.reduce((s, d) => s + d.eventCount, 0)} events this week
        </span>
        <span className="text-xs font-semibold text-gray-700 tabular-nums">
          {Math.round(days.reduce((s, d) => s + d.hours, 0) * 10) / 10}h scheduled
        </span>
      </div>
    </div>
  );
}

"use client";

import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isToday, format } from "date-fns";
import { EventCard } from "./event-card";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/types/events";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_EVENTS_PER_DAY = 3;

interface MonthViewProps {
  currentDate: Date;
  events:      CalendarEvent[];
  onDayClick?: (date: Date) => void;
}

export function MonthView({ currentDate, events, onDayClick }: MonthViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let d = gridStart;
  while (d <= gridEnd) {
    days.push(d);
    d = addDays(d, 1);
  }

  function eventsForDay(day: Date): CalendarEvent[] {
    return events.filter((e) => {
      const start = new Date(e.startsAt);
      return (
        start.getFullYear() === day.getFullYear() &&
        start.getMonth() === day.getMonth() &&
        start.getDate() === day.getDate()
      );
    });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Day name headers */}
      <div className="grid grid-cols-7 border-b border-border bg-white">
        {DAY_NAMES.map((name) => (
          <div key={name} className="py-2 text-center text-xs font-medium text-gray-400 uppercase tracking-wide">
            {name}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 grid grid-cols-7 overflow-y-auto">
        {days.map((day) => {
          const dayEvents = eventsForDay(day);
          const overflow = dayEvents.length - MAX_EVENTS_PER_DAY;
          const isCurrentMonth = isSameMonth(day, currentDate);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-24 p-1.5 border-r border-b border-border",
                !isCurrentMonth && "bg-surface-muted"
              )}
            >
              <button
                onClick={() => onDayClick?.(day)}
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mb-1 ml-auto transition-colors",
                  isToday(day)
                    ? "bg-primary text-white"
                    : isCurrentMonth
                    ? "text-gray-700 hover:bg-surface-subtle"
                    : "text-gray-300"
                )}
              >
                {format(day, "d")}
              </button>
              <div className="space-y-0.5">
                {dayEvents.slice(0, MAX_EVENTS_PER_DAY).map((event) => (
                  <EventCard key={event.id} event={event} compact />
                ))}
                {overflow > 0 && (
                  <button
                    onClick={() => onDayClick?.(day)}
                    className="text-[10px] text-primary hover:underline pl-1 font-medium"
                  >
                    +{overflow} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

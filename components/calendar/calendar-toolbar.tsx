"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { format, addWeeks, subWeeks, addMonths, subMonths, addDays, subDays, startOfWeek, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import type { CalendarView } from "@/types/events";

interface CalendarToolbarProps {
  view: CalendarView;
  currentDate: Date;
  onViewChange: (v: CalendarView) => void;
  onDateChange: (d: Date) => void;
}

export function CalendarToolbar({
  view,
  currentDate,
  onViewChange,
  onDateChange,
}: CalendarToolbarProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });

  const title =
    view === "month"
      ? format(currentDate, "MMMM yyyy")
      : view === "week"
      ? `${format(weekStart, "MMM d")} – ${format(addDays(weekStart, 6), "MMM d, yyyy")}`
      : format(currentDate, "EEEE, MMMM d, yyyy");

  function navigate(dir: 1 | -1) {
    if (view === "week") onDateChange(dir === 1 ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    else if (view === "month") onDateChange(dir === 1 ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    else onDateChange(dir === 1 ? addDays(currentDate, 1) : subDays(currentDate, 1));
  }

  return (
    <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-white flex-shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={() => onDateChange(new Date())}
          className={cn(
            "text-xs font-medium border rounded px-3 py-1.5 transition-colors",
            isToday(currentDate) && view === "day"
              ? "border-primary/30 bg-primary-50 text-primary"
              : "border-border hover:bg-surface-muted"
          )}
        >
          Today
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(-1)}
            className="w-7 h-7 rounded hover:bg-surface-muted transition-colors flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={() => navigate(1)}
            className="w-7 h-7 rounded hover:bg-surface-muted transition-colors flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </div>

      <div className="flex items-center gap-3">
        {/* New event — opens Google Calendar to create */}
        <a
          href="https://calendar.google.com/calendar/r/eventedit"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 bg-primary text-white text-xs font-medium px-3 py-1.5 rounded-md hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New event
        </a>

        {/* View switcher */}
        <div className="flex items-center bg-surface-muted rounded-md p-0.5 border border-border">
        {(["day", "week", "month"] as const).map((v) => (
          <button
            key={v}
            onClick={() => onViewChange(v)}
            className={cn(
              "text-xs px-3 py-1 rounded transition-all capitalize font-medium",
              view === v
                ? "bg-white text-gray-900 shadow-card"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {v}
          </button>
        ))}
        </div>
      </div>
    </div>
  );
}

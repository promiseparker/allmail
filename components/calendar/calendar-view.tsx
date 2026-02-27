"use client";

import { useQuery } from "@tanstack/react-query";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays } from "date-fns";
import { WeekView } from "./week-view";
import { MonthView } from "./month-view";
import type { CalendarView as ViewType, CalendarEvent } from "@/types/events";

interface CalendarViewProps {
  view:          ViewType;
  currentDate:   Date;
  onViewChange?: (v: ViewType) => void;
  onDateChange?: (d: Date) => void;
}

export function CalendarView({
  view,
  currentDate,
  onViewChange,
  onDateChange,
}: CalendarViewProps) {
  const { start, end } = getRange(view, currentDate);

  const { data, isLoading } = useQuery<{ data: CalendarEvent[] }>({
    queryKey: ["events", start.toISOString(), end.toISOString()],
    queryFn: async () => {
      const params = new URLSearchParams({
        start: start.toISOString(),
        end:   end.toISOString(),
      });
      const res = await fetch(`/api/events?${params}`);
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
  });

  const events = data?.data ?? [];

  if (isLoading) {
    return <CalendarSkeleton view={view} />;
  }

  if (view === "week" || view === "day") {
    return (
      <WeekView
        currentDate={currentDate}
        events={events}
        days={view === "day" ? 1 : 7}
      />
    );
  }

  return (
    <MonthView
      currentDate={currentDate}
      events={events}
      onDayClick={(date) => {
        onDateChange?.(date);
        onViewChange?.("day");
      }}
    />
  );
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

function CalendarSkeleton({ view }: { view: ViewType }) {
  if (view === "month") {
    return (
      <div className="flex flex-col h-full animate-pulse">
        <div className="grid grid-cols-7 border-b border-border">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-9 bg-surface-muted border-r border-border last:border-r-0" />
          ))}
        </div>
        <div className="flex-1 grid grid-cols-7">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="min-h-24 border-r border-b border-border p-1.5">
              <div className="w-6 h-6 rounded-full bg-surface-subtle ml-auto mb-1" />
              {i % 3 === 0 && <div className="h-4 rounded bg-surface-subtle w-full mb-0.5" />}
              {i % 5 === 0 && <div className="h-4 rounded bg-surface-subtle w-3/4" />}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const cols = view === "day" ? 1 : 7;
  return (
    <div className="flex flex-col h-full animate-pulse">
      {/* Header */}
      <div
        className="flex-shrink-0 grid border-b border-border"
        style={{ gridTemplateColumns: `56px repeat(${cols}, 1fr)` }}
      >
        <div className="border-r border-border" />
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="py-2 border-r border-border last:border-r-0">
            <div className="h-3 w-8 bg-surface-subtle mx-auto rounded mb-1.5" />
            <div className="w-8 h-8 rounded-full bg-surface-subtle mx-auto" />
          </div>
        ))}
      </div>
      {/* Time grid */}
      <div className="flex-1 overflow-hidden">
        <div
          className="grid h-full"
          style={{ gridTemplateColumns: `56px repeat(${cols}, 1fr)` }}
        >
          <div className="border-r border-border/60" />
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="border-r border-border/60 last:border-r-0 relative">
              {[100, 280, 450, 620].map((top) => (
                <div
                  key={top}
                  className="absolute inset-x-1 h-12 rounded bg-surface-subtle"
                  style={{ top }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Range helper ──────────────────────────────────────────────────────────────

function getRange(view: ViewType, date: Date): { start: Date; end: Date } {
  switch (view) {
    case "day":
      return { start: date, end: addDays(date, 1) };
    case "week":
      return {
        start: startOfWeek(date, { weekStartsOn: 1 }),
        end:   endOfWeek(date, { weekStartsOn: 1 }),
      };
    case "month":
      return {
        start: startOfMonth(date),
        end:   endOfMonth(date),
      };
  }
}

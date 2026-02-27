"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  addDays, format, startOfWeek, isSameDay, isToday,
} from "date-fns";
import { EventCard } from "./event-card";
import { EventDetail } from "./event-detail";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/types/events";

// 1 minute = 1 pixel, so 24 hours = 1440px total
const TOTAL_H_PX   = 24 * 60;      // 1440
const MIN_EVT_H    = 30;            // minimum event height in px
const HOURS        = Array.from({ length: 24 }, (_, i) => i);

// ── Hour label formatter ──────────────────────────────────────────────────────

function hourLabel(h: number): string {
  if (h === 0) return "";
  if (h < 12) return `${h}am`;
  if (h === 12) return "12pm";
  return `${h - 12}pm`;
}

// ── Overlap layout algorithm ──────────────────────────────────────────────────

interface EventLayout { col: number; numCols: number }

function layoutDayEvents(events: CalendarEvent[]): Map<string, EventLayout> {
  const result = new Map<string, EventLayout>();
  if (events.length === 0) return result;

  const sorted = [...events].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  );

  // Group into overlap clusters
  const groups: CalendarEvent[][] = [];
  let cur: CalendarEvent[]        = [sorted[0]!];
  let maxEnd                      = new Date(sorted[0]!.endsAt).getTime();

  for (let i = 1; i < sorted.length; i++) {
    const ev = sorted[i]!;
    if (new Date(ev.startsAt).getTime() < maxEnd) {
      cur.push(ev);
      maxEnd = Math.max(maxEnd, new Date(ev.endsAt).getTime());
    } else {
      groups.push(cur);
      cur    = [ev];
      maxEnd = new Date(ev.endsAt).getTime();
    }
  }
  groups.push(cur);

  // Assign columns within each cluster (greedy)
  for (const group of groups) {
    const colFree: number[] = [];

    for (const ev of group) {
      const startMs = new Date(ev.startsAt).getTime();
      const endMs   = new Date(ev.endsAt).getTime();

      let col = -1;
      for (let c = 0; c < colFree.length; c++) {
        if (colFree[c]! <= startMs) { col = c; colFree[c] = endMs; break; }
      }
      if (col === -1) { col = colFree.length; colFree.push(endMs); }
      result.set(ev.id, { col, numCols: 0 });
    }

    const numCols = colFree.length;
    for (const ev of group) {
      const r = result.get(ev.id)!;
      result.set(ev.id, { ...r, numCols });
    }
  }

  return result;
}

// ── Pixel math ────────────────────────────────────────────────────────────────

function eventTopPx(event: CalendarEvent): number {
  const d = new Date(event.startsAt);
  return d.getHours() * 60 + d.getMinutes();
}

function eventHeightPx(event: CalendarEvent): number {
  const ms = new Date(event.endsAt).getTime() - new Date(event.startsAt).getTime();
  return Math.max(ms / 60_000, MIN_EVT_H);
}

function nowPx(): number {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
}

// ── WeekView ──────────────────────────────────────────────────────────────────

interface WeekViewProps {
  currentDate: Date;
  events:      CalendarEvent[];
  days?:       number;
}

export function WeekView({ currentDate, events, days = 7 }: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });

  const dayColumns = useMemo(
    () => Array.from({ length: days }, (_, i) => addDays(weekStart, i)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [weekStart.toISOString(), days]
  );

  const timedEvents  = events.filter((e) => !e.isAllDay);
  const allDayEvents = events.filter((e) => e.isAllDay);
  const hasAllDay    = allDayEvents.some((e) =>
    dayColumns.some((d) => isSameDay(new Date(e.startsAt), d))
  );

  // Per-day overlap layout
  const layouts = useMemo(() => {
    const map = new Map<string, Map<string, EventLayout>>();
    for (const day of dayColumns) {
      const key      = format(day, "yyyy-MM-dd");
      const dayEvts  = timedEvents.filter((e) => isSameDay(new Date(e.startsAt), day));
      map.set(key, layoutDayEvents(dayEvts));
    }
    return map;
  }, [timedEvents, dayColumns]);

  // Current-time indicator — updates every minute
  const [currentY, setCurrentY] = useState(nowPx);
  useEffect(() => {
    const id = setInterval(() => setCurrentY(nowPx()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Auto-scroll to current time on mount
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = Math.max(0, currentY - 120);
    }
    // Run once on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Event detail popover
  const [selected, setSelected] = useState<CalendarEvent | null>(null);

  const gridCols = `56px repeat(${days}, 1fr)`;

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">

        {/* ── Day header row ── */}
        <div
          className="flex-shrink-0 grid bg-white border-b border-border"
          style={{ gridTemplateColumns: gridCols }}
        >
          <div className="border-r border-border" />
          {dayColumns.map((day) => (
            <div
              key={day.toISOString()}
              className="py-2 text-center border-r border-border last:border-r-0"
            >
              <p
                className={cn(
                  "text-xs uppercase tracking-wider font-medium",
                  isToday(day) ? "text-primary" : "text-gray-400"
                )}
              >
                {format(day, "EEE")}
              </p>
              <div
                className={cn(
                  "w-8 h-8 mx-auto flex items-center justify-center rounded-full text-sm font-semibold mt-0.5 transition-colors",
                  isToday(day) ? "bg-primary text-white" : "text-gray-800 hover:bg-surface-muted"
                )}
              >
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>

        {/* ── All-day events row (only when needed) ── */}
        {hasAllDay && (
          <div
            className="flex-shrink-0 grid bg-white border-b border-border"
            style={{ gridTemplateColumns: gridCols }}
          >
            <div className="border-r border-border flex items-center justify-end pr-2 py-1.5">
              <span className="text-[10px] text-gray-400 leading-none">all-day</span>
            </div>
            {dayColumns.map((day) => {
              const dayAllDay = allDayEvents.filter((e) =>
                isSameDay(new Date(e.startsAt), day)
              );
              return (
                <div
                  key={day.toISOString()}
                  className="border-r border-border last:border-r-0 p-1 min-h-[28px] space-y-0.5"
                >
                  {dayAllDay.map((e) => (
                    <div
                      key={e.id}
                      onClick={() => setSelected(e)}
                      className="cursor-pointer"
                    >
                      <EventCard event={e} compact />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Scrollable time grid ── */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div
            className="grid"
            style={{
              gridTemplateColumns: gridCols,
              height:              `${TOTAL_H_PX}px`,
            }}
          >
            {/* Time labels */}
            <div className="relative border-r border-border/60 select-none">
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="absolute right-2 text-[11px] text-gray-400 tabular-nums leading-none"
                  style={{ top: h * 60 - 7 }}
                >
                  {hourLabel(h)}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {dayColumns.map((day) => {
              const dayKey   = format(day, "yyyy-MM-dd");
              const layout   = layouts.get(dayKey) ?? new Map<string, EventLayout>();
              const dayTimed = timedEvents.filter((e) => isSameDay(new Date(e.startsAt), day));
              const today    = isToday(day);

              return (
                <div
                  key={dayKey}
                  className={cn(
                    "relative border-r border-border/60 last:border-r-0",
                    today && "bg-blue-50/20"
                  )}
                >
                  {/* Hour lines */}
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className="absolute inset-x-0 border-t border-border/40 pointer-events-none"
                      style={{ top: h * 60 }}
                    />
                  ))}
                  {/* Half-hour lines (lighter, dashed) */}
                  {HOURS.map((h) => (
                    <div
                      key={`hh-${h}`}
                      className="absolute inset-x-0 border-t border-border/20 pointer-events-none"
                      style={{
                        top:         h * 60 + 30,
                        borderStyle: "dashed",
                      }}
                    />
                  ))}

                  {/* Current time line */}
                  {today && (
                    <div
                      className="absolute inset-x-0 z-20 pointer-events-none"
                      style={{ top: `${currentY}px` }}
                    >
                      <div className="relative">
                        <div className="border-t-2 border-red-500" />
                        <div className="absolute w-2.5 h-2.5 rounded-full bg-red-500 -left-1 -top-[5px]" />
                      </div>
                    </div>
                  )}

                  {/* Events */}
                  {dayTimed.map((event) => {
                    const { col, numCols } = layout.get(event.id) ?? { col: 0, numCols: 1 };
                    const top    = eventTopPx(event);
                    const height = eventHeightPx(event);

                    return (
                      <div
                        key={event.id}
                        className="absolute z-10 cursor-pointer"
                        style={{
                          top:    `${top}px`,
                          height: `${height}px`,
                          left:   `calc(${(col / numCols) * 100}% + 2px)`,
                          width:  `calc(${(1 / numCols) * 100}% - 4px)`,
                        }}
                        onClick={() => setSelected(event)}
                      >
                        <EventCard event={event} compact showTime={height >= 46} />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Event detail modal */}
      {selected && (
        <EventDetail event={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}

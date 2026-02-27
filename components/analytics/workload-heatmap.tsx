"use client";

import { useState } from "react";
import {
  subDays, addDays, startOfISOWeek, format, isSameDay, isToday,
} from "date-fns";
import { cn } from "@/lib/utils";

interface WorkloadHeatmapProps {
  dailyLoad: Record<string, number>;
  period: number;
}

const DOW_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// ISO week day: 1=Mon...7=Sun  →  index 0–6

export function WorkloadHeatmap({ dailyLoad, period }: WorkloadHeatmapProps) {
  const [tooltip, setTooltip] = useState<{ date: string; hours: number; x: number; y: number } | null>(null);

  const maxHours = Math.max(...Object.values(dailyLoad), 4); // floor at 4 for colour scale

  // Build grid: columns = weeks, rows = Mon(0)→Sun(6)
  const today = new Date();
  const gridStart = startOfISOWeek(subDays(today, period));

  const weeks: Date[][] = [];
  let cursor = gridStart;
  while (cursor <= today) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(addDays(cursor, d));
    }
    weeks.push(week);
    cursor = addDays(cursor, 7);
  }

  function getCellColor(date: Date): string {
    const key = format(date, "yyyy-MM-dd");
    const hours = dailyLoad[key] ?? 0;
    if (hours === 0) return "bg-surface-subtle border border-border/60";
    const intensity = Math.min(hours / maxHours, 1);
    if (intensity < 0.25) return "bg-primary-100";
    if (intensity < 0.5)  return "bg-primary-200";
    if (intensity < 0.75) return "bg-primary-400";
    if (intensity < 0.9)  return "bg-primary-600";
    return "bg-primary-800";
  }

  return (
    <div className="relative">
      <div className="flex gap-3">
        {/* DOW labels */}
        <div className="flex flex-col gap-0.5 pt-5">
          {DOW_LABELS.map((d, i) => (
            <div
              key={d}
              className={cn(
                "h-3 flex items-center text-[10px] text-gray-400 leading-none select-none",
                // Only show Mon / Wed / Fri labels to avoid crowding
                i % 2 !== 0 && "invisible"
              )}
              style={{ width: 20 }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="flex-1 overflow-x-auto">
          {/* Month labels */}
          <div className="flex gap-0.5 mb-1 pl-0">
            {weeks.map((week, wi) => {
              const firstDay = week[0]!;
              const showMonth = firstDay.getDate() <= 7;
              return (
                <div key={wi} className="w-3 flex-shrink-0 text-[10px] text-gray-400 text-center">
                  {showMonth ? format(firstDay, "MMM") : ""}
                </div>
              );
            })}
          </div>

          {/* Cells */}
          <div className="flex gap-0.5">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.map((day, di) => {
                  const key = format(day, "yyyy-MM-dd");
                  const hours = dailyLoad[key] ?? 0;
                  const inFuture = day > today;

                  return (
                    <div
                      key={di}
                      onMouseEnter={(e) => {
                        if (!inFuture) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTooltip({ date: key, hours, x: rect.left, y: rect.top });
                        }
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      className={cn(
                        "w-3 h-3 rounded-sm transition-opacity",
                        inFuture
                          ? "opacity-0"
                          : getCellColor(day),
                        isToday(day) && "ring-1 ring-primary ring-offset-1"
                      )}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3">
        <span className="text-[10px] text-gray-400">Less</span>
        {["bg-surface-subtle border border-border/60", "bg-primary-100", "bg-primary-200", "bg-primary-400", "bg-primary-600", "bg-primary-800"].map((cls, i) => (
          <div key={i} className={cn("w-3 h-3 rounded-sm", cls)} />
        ))}
        <span className="text-[10px] text-gray-400">More</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-xs rounded-md px-2 py-1.5 pointer-events-none shadow-modal -translate-y-full -translate-x-1/2"
          style={{ left: tooltip.x + 6, top: tooltip.y - 4 }}
        >
          <p className="font-medium">{format(new Date(tooltip.date), "EEE, MMM d")}</p>
          <p className="text-gray-300">{tooltip.hours > 0 ? `${tooltip.hours}h scheduled` : "No events"}</p>
        </div>
      )}
    </div>
  );
}

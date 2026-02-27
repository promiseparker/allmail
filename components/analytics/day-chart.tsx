"use client";

import { cn } from "@/lib/utils";

interface DayChartProps {
  weekdayAvg: Record<string, number>;
}

const DOW_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function DayChart({ weekdayAvg }: DayChartProps) {
  const values = DOW_ORDER.map((d) => weekdayAvg[d] ?? 0);
  const max = Math.max(...values, 0.5);
  const busiest = DOW_ORDER[values.indexOf(Math.max(...values))]!;

  return (
    <div className="flex items-end gap-1.5 h-28">
      {DOW_ORDER.map((day, i) => {
        const hrs = values[i] ?? 0;
        const heightPct = max > 0 ? (hrs / max) * 100 : 0;
        const isBusiest = day === busiest && hrs > 0;
        const isWeekend = day === "Sat" || day === "Sun";

        return (
          <div key={day} className="flex-1 flex flex-col items-center gap-1 group">
            {/* Bar */}
            <div className="w-full flex items-end justify-center" style={{ height: 88 }}>
              <div
                title={`${day}: avg ${hrs}h`}
                className={cn(
                  "w-full rounded-t transition-all duration-500",
                  isBusiest
                    ? "bg-primary"
                    : isWeekend
                    ? "bg-gray-200"
                    : "bg-primary-200 group-hover:bg-primary-300"
                )}
                style={{ height: `${Math.max(heightPct, hrs > 0 ? 4 : 0)}%` }}
              />
            </div>
            {/* Label */}
            <span
              className={cn(
                "text-[10px] font-medium",
                isBusiest ? "text-primary" : "text-gray-400"
              )}
            >
              {day.slice(0, 1)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

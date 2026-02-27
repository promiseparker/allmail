"use client";

import { cn } from "@/lib/utils";

interface HourChartProps {
  hourLoad: Record<string, number>;
  busiestHour: number | null;
}

// Show 6am – 10pm only
const DISPLAY_HOURS = Array.from({ length: 17 }, (_, i) => i + 6);

function formatHour(h: number): string {
  if (h === 0) return "12am";
  if (h < 12) return `${h}am`;
  if (h === 12) return "12pm";
  return `${h - 12}pm`;
}

export function HourChart({ hourLoad, busiestHour }: HourChartProps) {
  const values = DISPLAY_HOURS.map((h) => hourLoad[String(h)] ?? 0);
  const max = Math.max(...values, 0.5);

  return (
    <div className="space-y-1.5">
      {DISPLAY_HOURS.map((hour, i) => {
        const hours = values[i] ?? 0;
        const pct = (hours / max) * 100;
        const isBusiest = hour === busiestHour;

        return (
          <div key={hour} className="flex items-center gap-2.5">
            <span
              className={cn(
                "text-[11px] tabular-nums flex-shrink-0 text-right",
                isBusiest ? "text-primary font-medium" : "text-gray-400"
              )}
              style={{ width: 34 }}
            >
              {formatHour(hour)}
            </span>
            <div className="flex-1 bg-surface-subtle rounded-full h-2 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isBusiest ? "bg-primary" : "bg-primary-300"
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span
              className={cn(
                "text-[11px] tabular-nums w-10 text-right flex-shrink-0",
                isBusiest ? "text-primary font-medium" : "text-gray-400"
              )}
            >
              {hours > 0 ? `${hours}h` : "–"}
            </span>
          </div>
        );
      })}
      <p className="text-[10px] text-gray-400 pt-1">
        Total hours of events starting in each hour slot
      </p>
    </div>
  );
}

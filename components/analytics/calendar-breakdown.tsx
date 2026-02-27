"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { CalendarStat } from "@/app/api/analytics/route";

interface CalendarBreakdownProps {
  data: CalendarStat[];
}

export function CalendarBreakdown({ data }: CalendarBreakdownProps) {
  const totalHours = data.reduce((s, c) => s + c.hours, 0);

  if (data.length === 0) {
    return <p className="text-sm text-gray-400 py-4 text-center">No calendar data for this period.</p>;
  }

  return (
    <div className="space-y-3">
      {data.map((cal) => {
        const pct = totalHours > 0 ? (cal.hours / totalHours) * 100 : 0;

        return (
          <div key={cal.calendarId}>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: cal.color }}
              />
              <span className="text-xs font-medium text-gray-700 flex-1 truncate">{cal.name}</span>
              <Badge
                variant={cal.provider === "google" ? "google" : "microsoft"}
                className="text-[10px]"
              >
                {cal.provider === "google" ? "Google" : "Outlook"}
              </Badge>
              <span className="text-xs text-gray-500 tabular-nums w-8 text-right">{Math.round(pct)}%</span>
              <span className="text-xs text-gray-400 tabular-nums w-12 text-right">{cal.hours}h</span>
            </div>
            <div className="w-full bg-surface-subtle rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, backgroundColor: cal.color }}
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">{cal.eventCount} events</p>
          </div>
        );
      })}

      {/* Total */}
      <div className="pt-2 border-t border-border flex items-center justify-between">
        <span className="text-xs text-gray-500">Total</span>
        <span className="text-xs font-semibold text-gray-900 tabular-nums">{totalHours.toFixed(1)}h</span>
      </div>
    </div>
  );
}

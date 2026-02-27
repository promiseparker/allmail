"use client";

import { format } from "date-fns";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/types/events";

interface EventCardProps {
  event:     CalendarEvent;
  compact?:  boolean;
  showTime?: boolean;
  onClick?:  () => void;
}

export function EventCard({ event, compact = false, showTime, onClick }: EventCardProps) {
  const color       = event.calendarColor ?? "#6B7280";
  const displayTime = showTime ?? !compact;

  return (
    <div
      onClick={onClick}
      className={cn(
        "event-card h-full",
        event.hasConflict
          ? event.conflictSeverity === "hard"
            ? "bg-conflict-hard-bg border border-conflict-hard/30"
            : "bg-conflict-soft-bg border border-conflict-soft/30"
          : "bg-white border border-border"
      )}
      style={{
        borderLeftColor:  color,
        borderLeftWidth:  3,
        backgroundColor:  event.hasConflict ? undefined : `${color}0d`,
      }}
      title={event.title}
    >
      <div className="flex items-start gap-1 min-w-0">
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "font-medium truncate leading-tight",
              compact ? "text-[11px]" : "text-xs"
            )}
            style={{ color: darkenColor(color, 40) }}
          >
            {event.title}
          </p>
          {displayTime && (
            <p className="text-[10px] text-gray-400 mt-0.5">
              {format(new Date(event.startsAt), "h:mm a")}
            </p>
          )}
        </div>
        {event.hasConflict && (
          <AlertTriangle
            className={cn(
              "flex-shrink-0",
              compact ? "w-2.5 h-2.5" : "w-3 h-3",
              event.conflictSeverity === "hard"
                ? "text-conflict-hard"
                : "text-conflict-soft"
            )}
          />
        )}
      </div>
    </div>
  );
}

// Simple color darkening for text on light backgrounds
function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0x00ff) - amount);
  const b = Math.max(0, (num & 0x0000ff) - amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

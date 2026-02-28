"use client";

import { useState, useEffect } from "react";
import { format, isBefore, isAfter } from "date-fns";
import { AlertTriangle, MapPin, Users, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/types/events";

interface TodayAgendaProps {
  events: CalendarEvent[];
}

export function TodayAgenda({ events }: TodayAgendaProps) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const allDay   = events.filter((e) => e.isAllDay);
  const timed    = events.filter((e) => !e.isAllDay);
  const past     = timed.filter((e) => isBefore(new Date(e.endsAt), now));
  const current  = timed.filter(
    (e) => isBefore(new Date(e.startsAt), now) && isAfter(new Date(e.endsAt), now),
  );
  const upcoming = timed.filter((e) => !isBefore(new Date(e.startsAt), now));

  if (events.length === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden h-full flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Today&apos;s agenda</h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
          <Calendar className="w-7 h-7 text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-400">No events scheduled for today</p>
          <p className="text-xs text-gray-300 mt-1">Enjoy the free time</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">Today&apos;s agenda</h2>
      </div>

      {/* All-day chips */}
      {allDay.length > 0 && (
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mr-1">
            All day
          </span>
          {allDay.map((e) => (
            <span
              key={e.id}
              className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: e.calendarColor ?? "#6B7280" }}
            >
              {e.title}
            </span>
          ))}
        </div>
      )}

      {/* Past events */}
      {past.map((event) => (
        <AgendaItem key={event.id} event={event} dim />
      ))}

      {/* Now indicator */}
      {(current.length > 0 || (past.length > 0 && upcoming.length > 0)) && (
        <div className="flex items-center gap-2 px-5 py-1">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
          <div className="flex-1 border-t border-red-300/50" />
          <span className="text-[10px] text-red-400 font-medium tabular-nums flex-shrink-0">
            {format(now, "h:mm a")}
          </span>
        </div>
      )}

      {/* In-progress events */}
      {current.map((event) => (
        <AgendaItem key={event.id} event={event} inProgress />
      ))}

      {/* Upcoming events */}
      {upcoming.map((event) => (
        <AgendaItem key={event.id} event={event} />
      ))}
    </div>
  );
}

function AgendaItem({
  event,
  dim        = false,
  inProgress = false,
}: {
  event:       CalendarEvent;
  dim?:        boolean;
  inProgress?: boolean;
}) {
  const color       = event.calendarColor ?? "#6B7280";
  const startTime   = format(new Date(event.startsAt), "h:mm a");
  const endTime     = format(new Date(event.endsAt), "h:mm a");
  const durationMin = Math.round(
    (new Date(event.endsAt).getTime() - new Date(event.startsAt).getTime()) / 60_000,
  );

  return (
    <div
      className={cn(
        "flex items-start gap-4 px-5 py-3.5 border-b border-gray-100 last:border-b-0 transition-colors hover:bg-gray-50",
        dim && "opacity-35",
        inProgress && "bg-gray-50",
      )}
    >
      {/* Time */}
      <div className="w-16 flex-shrink-0 text-right">
        <p className={cn("text-xs font-semibold tabular-nums", inProgress ? "text-gray-900" : "text-gray-700")}>
          {startTime}
        </p>
        <p className="text-xs text-gray-400 tabular-nums">{endTime}</p>
      </div>

      {/* Color bar */}
      <div
        className="w-0.5 self-stretch rounded-full mt-0.5 flex-shrink-0"
        style={{ backgroundColor: color }}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
          {inProgress && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-900 text-white flex-shrink-0">
              Live
            </span>
          )}
          {event.hasConflict && (
            <span
              className={cn(
                "flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-md flex-shrink-0",
                event.conflictSeverity === "hard"
                  ? "bg-red-50 text-red-500"
                  : "bg-amber-50 text-amber-600",
              )}
            >
              <AlertTriangle className="w-3 h-3" />
              {event.conflictSeverity === "hard" ? "Conflict" : "Overlap"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <span className="text-xs text-gray-400">{event.calendarName}</span>
          {event.location && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate max-w-[200px]">{event.location}</span>
            </span>
          )}
          {event.attendeeCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Users className="w-3 h-3" />
              {event.attendeeCount}
            </span>
          )}
        </div>
      </div>

      {/* Duration */}
      <div className="flex-shrink-0 text-xs text-gray-400 tabular-nums">
        {durationMin >= 60
          ? `${Math.round(durationMin / 6) / 10}h`
          : `${durationMin}m`}
      </div>
    </div>
  );
}

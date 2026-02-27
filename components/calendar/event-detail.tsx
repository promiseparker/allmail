"use client";

import { useEffect } from "react";
import { X, Clock, MapPin, Users, AlertTriangle, Repeat, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/types/events";

interface EventDetailProps {
  event:   CalendarEvent;
  onClose: () => void;
}

export function EventDetail({ event, onClose }: EventDetailProps) {
  const color    = event.calendarColor ?? "#6B7280";
  const startDate = new Date(event.startsAt);
  const endDate   = new Date(event.endsAt);
  const durationMs  = endDate.getTime() - startDate.getTime();
  const durationMin = Math.round(durationMs / 60_000);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  function formatDuration(min: number): string {
    if (min < 60) return `${min}m`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 bg-white rounded-2xl shadow-modal border border-border overflow-hidden animate-slide-up">
        {/* Color top bar */}
        <div className="h-1 w-full flex-shrink-0" style={{ backgroundColor: color }} />

        <div className="p-5">
          {/* Title + close */}
          <div className="flex items-start gap-2 mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900 leading-snug break-words">
                {event.title}
              </h3>
              {event.isRecurring && (
                <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                  <Repeat className="w-3 h-3" />
                  Recurring
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-surface-muted text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 mt-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {/* Time */}
            <div className="flex items-start gap-2.5">
              <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700 leading-snug">
                {event.isAllDay ? (
                  <span>
                    <span className="font-medium">
                      {format(startDate, "EEEE, MMMM d")}
                    </span>
                    <span className="text-gray-400 ml-1.5">· All day</span>
                  </span>
                ) : (
                  <>
                    <span className="font-medium">
                      {format(startDate, "EEE, MMM d")}
                    </span>
                    <span className="text-gray-500 ml-1.5">
                      {format(startDate, "h:mm a")}
                      {" – "}
                      {format(endDate, "h:mm a")}
                    </span>
                    <span className="text-xs text-gray-400 ml-1.5">
                      · {formatDuration(durationMin)}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Calendar */}
            <div className="flex items-center gap-2.5">
              <div
                className="w-3.5 h-3.5 rounded-[3px] flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-sm text-gray-600">{event.calendarName}</span>
            </div>

            {/* Location */}
            {event.location && (
              <div className="flex items-start gap-2.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-600 leading-snug break-words">
                  {event.location}
                </span>
              </div>
            )}

            {/* Attendees */}
            {event.attendeeCount > 0 && (
              <div className="flex items-center gap-2.5">
                <Users className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-600">
                  {event.attendeeCount}{" "}
                  attendee{event.attendeeCount !== 1 ? "s" : ""}
                </span>
              </div>
            )}

            {/* URL */}
            {event.url && (
              <div className="flex items-center gap-2.5">
                <ExternalLink className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <a
                  href={event.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline truncate"
                >
                  Join link
                </a>
              </div>
            )}
          </div>

          {/* Conflict badge */}
          {event.hasConflict && (
            <div
              className={cn(
                "flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg mt-4",
                event.conflictSeverity === "hard"
                  ? "bg-conflict-hard-bg text-conflict-hard border border-conflict-hard/20"
                  : "bg-conflict-soft-bg text-conflict-soft border border-conflict-soft/20"
              )}
            >
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              {event.conflictSeverity === "hard"
                ? "Hard conflict — overlaps another event"
                : "Soft overlap — partial overlap with another event"}
            </div>
          )}

          {/* Description */}
          {event.description && (
            <p className="text-xs text-gray-500 mt-4 leading-relaxed line-clamp-4 border-t border-border pt-3 whitespace-pre-line">
              {event.description}
            </p>
          )}
        </div>
      </div>
    </>
  );
}

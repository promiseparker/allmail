"use client";

import { cn } from "@/lib/utils";

interface MeetingFocusChartProps {
  meetingHours: number;
  focusHours:   number;
  totalHours:   number;
}

export function MeetingFocusChart({
  meetingHours,
  focusHours,
  totalHours,
}: MeetingFocusChartProps) {
  const hasMeetings = meetingHours > 0;
  const hasFocus    = focusHours > 0;

  if (!hasMeetings && !hasFocus) {
    return (
      <p className="text-xs text-gray-400 py-4 text-center">No scheduled time in this period.</p>
    );
  }

  const meetingPct = totalHours > 0 ? meetingHours / totalHours : 0;
  const focusPct   = totalHours > 0 ? focusHours   / totalHours : 0;

  // SVG donut geometry
  const R            = 34;
  const CX = 50;
  const CY = 50;
  const circumference = 2 * Math.PI * R;

  const meetingDash = meetingPct * circumference;
  const focusDash   = focusPct   * circumference;

  const meetingColor = "#0055FF"; // primary blue
  const focusColor   = "#16A34A"; // green-600

  // Inner label
  const dominantType  = meetingPct >= 0.5 ? "meetings" : "focus";
  const dominantPct   = Math.round(Math.max(meetingPct, focusPct) * 100);

  return (
    <div className="flex items-center gap-5">
      {/* Donut */}
      <div className="relative flex-shrink-0">
        <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
          {/* Track */}
          <circle
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke="#F1F5F9"
            strokeWidth="14"
          />
          {/* Focus segment (drawn first, starting at 12 o'clock) */}
          {hasFocus && (
            <circle
              cx={CX} cy={CY} r={R}
              fill="none"
              stroke={focusColor}
              strokeWidth="14"
              strokeDasharray={`${focusDash} ${circumference}`}
              strokeDashoffset={0}
              strokeLinecap="butt"
            />
          )}
          {/* Meeting segment (offset past focus) */}
          {hasMeetings && (
            <circle
              cx={CX} cy={CY} r={R}
              fill="none"
              stroke={meetingColor}
              strokeWidth="14"
              strokeDasharray={`${meetingDash} ${circumference}`}
              strokeDashoffset={-focusDash}
              strokeLinecap="butt"
            />
          )}
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
          <span className="text-base font-bold text-gray-900 tabular-nums leading-none">
            {dominantPct}%
          </span>
          <span className="text-[9px] text-gray-400 leading-none mt-0.5">
            {dominantType}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-3 flex-1 min-w-0">
        {/* Meetings */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: meetingColor }} />
              <span className="text-xs text-gray-600">Meetings</span>
            </div>
            <span className="text-xs font-semibold text-gray-900 tabular-nums">
              {meetingHours}h
            </span>
          </div>
          <div className="w-full bg-surface-subtle rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width:           `${meetingPct * 100}%`,
                backgroundColor: meetingColor,
              }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {Math.round(meetingPct * 100)}% of scheduled time
          </p>
        </div>

        {/* Focus */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: focusColor }} />
              <span className="text-xs text-gray-600">Focus time</span>
            </div>
            <span className="text-xs font-semibold text-gray-900 tabular-nums">
              {focusHours}h
            </span>
          </div>
          <div className="w-full bg-surface-subtle rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width:           `${focusPct * 100}%`,
                backgroundColor: focusColor,
              }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {Math.round(focusPct * 100)}% of scheduled time
          </p>
        </div>

        {/* Insight */}
        {meetingPct > 0.7 && (
          <p className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-2 py-1 leading-snug">
            Over 70% of your time is in meetings — consider blocking focus time.
          </p>
        )}
        {focusPct > 0.8 && (
          <p className="text-[10px] text-green-700 bg-green-50 border border-green-200 rounded-md px-2 py-1 leading-snug">
            Great focus-to-meeting ratio this period.
          </p>
        )}
      </div>
    </div>
  );
}

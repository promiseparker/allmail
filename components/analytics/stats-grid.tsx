"use client";

import { Clock, Users, Target, Calendar, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalyticsData } from "@/app/api/analytics/route";

interface StatsGridProps {
  data: AnalyticsData;
}

function TrendBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 || current === 0) return null;
  const delta = ((current - previous) / previous) * 100;
  if (Math.abs(delta) < 2) return null;
  const isUp = delta > 0;
  return (
    <span
      className={cn(
        "text-[10px] font-semibold tabular-nums",
        isUp ? "text-green-600" : "text-red-500"
      )}
    >
      {isUp ? "↑" : "↓"}&thinsp;{Math.round(Math.abs(delta))}%
    </span>
  );
}

export function StatsGrid({ data }: StatsGridProps) {
  const c = data.comparison;

  const meetingPct =
    data.totalScheduledHours > 0
      ? Math.round((data.meetingHours / data.totalScheduledHours) * 100)
      : 0;

  const stats = [
    {
      label:   "Total scheduled",
      value:   `${data.totalScheduledHours}h`,
      sub:     `across ${data.activeDays} active days`,
      icon:    Clock,
      iconBg:  "bg-primary-50",
      iconColor: "text-primary",
      trend:   <TrendBadge current={data.totalScheduledHours} previous={c.totalScheduledHours} />,
    },
    {
      label:   "Avg per day",
      value:   `${data.averageDailyHours}h`,
      sub:     `on days with events`,
      icon:    TrendingUp,
      iconBg:  "bg-primary-50",
      iconColor: "text-primary",
      trend:   c.activeDays > 0
        ? <TrendBadge
            current={data.activeDays > 0 ? data.totalScheduledHours / data.activeDays : 0}
            previous={c.activeDays > 0 ? c.totalScheduledHours / c.activeDays : 0}
          />
        : null,
    },
    {
      label:   "Meeting time",
      value:   `${data.meetingHours}h`,
      sub:     `${meetingPct}% of scheduled time`,
      icon:    Users,
      iconBg:  meetingPct > 60 ? "bg-amber-50" : "bg-green-50",
      iconColor: meetingPct > 60 ? "text-amber-600" : "text-green-600",
      warn:    meetingPct > 70,
      trend:   <TrendBadge current={data.meetingHours} previous={c.meetingHours} />,
    },
    {
      label:   "Focus time",
      value:   `${data.focusHours}h`,
      sub:     `${data.totalEvents - data.totalMeetings} solo events`,
      icon:    Target,
      iconBg:  "bg-green-50",
      iconColor: "text-green-600",
      trend:   <TrendBadge current={data.focusHours} previous={c.focusHours} />,
    },
    {
      label:   "Total events",
      value:   data.totalEvents,
      sub:     `${data.totalMeetings} meetings · ${data.totalEvents - data.totalMeetings} solo`,
      icon:    Calendar,
      iconBg:  "bg-surface-muted",
      iconColor: "text-gray-500",
      trend:   <TrendBadge current={data.totalEvents} previous={c.totalEvents} />,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className={cn(
            "bg-white border rounded-xl p-4 shadow-card",
            (s as any).warn ? "border-amber-200" : "border-border"
          )}
        >
          <div className="flex items-start justify-between mb-2">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", s.iconBg)}>
              <s.icon className={cn("w-4 h-4", s.iconColor)} />
            </div>
            {s.trend && <div className="mt-0.5">{s.trend}</div>}
          </div>
          <p className="text-xl font-bold text-gray-900 tabular-nums">{s.value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{s.sub}</p>
        </div>
      ))}
    </div>
  );
}

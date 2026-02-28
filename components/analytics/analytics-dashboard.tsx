"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, AlertTriangle } from "lucide-react";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import type { AnalyticsData } from "@/app/api/analytics/route";
import { StatsGrid } from "./stats-grid";
import { WorkloadHeatmap } from "./workload-heatmap";
import { HourChart } from "./hour-chart";
import { DayChart } from "./day-chart";
import { CalendarBreakdown } from "./calendar-breakdown";
import { WeeklyTrend } from "./weekly-trend";
import { BurnoutPanel } from "./burnout-panel";
import { MeetingFocusChart } from "./meeting-focus-chart";

const PERIODS = [
  { value: 7,   label: "7 days"   },
  { value: 30,  label: "30 days"  },
  { value: 90,  label: "90 days"  },
  { value: 180, label: "180 days" },
] as const;

type Period = (typeof PERIODS)[number]["value"];

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title:     string;
  subtitle?: string;
  children:  React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 animate-pulse">
      <div className="h-4 w-28 bg-gray-100 rounded mb-4" />
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-3 bg-gray-100 rounded mb-2 last:mb-0"
          style={{ width: `${60 + (i % 3) * 15}%` }}
        />
      ))}
    </div>
  );
}

function formatHour(h: number): string {
  if (h === 0)  return "12am";
  if (h < 12)   return `${h}am`;
  if (h === 12) return "12pm";
  return `${h - 12}pm`;
}

function exportToCSV(analytics: AnalyticsData, period: number): void {
  const dateRange = `${format(subDays(new Date(), period), "yyyy-MM-dd")} to ${format(new Date(), "yyyy-MM-dd")}`;

  // Summary section
  const summary = [
    `# SyncOne Analytics Export`,
    `# Period: ${period} days (${dateRange})`,
    `# Generated: ${new Date().toISOString()}`,
    ``,
    `## Summary`,
    `Metric,Value`,
    `Total scheduled hours,${analytics.totalScheduledHours}`,
    `Average daily hours,${analytics.averageDailyHours}`,
    `Meeting hours,${analytics.meetingHours}`,
    `Focus hours,${analytics.focusHours}`,
    `Total events,${analytics.totalEvents}`,
    `Total meetings,${analytics.totalMeetings}`,
    `Active days,${analytics.activeDays}`,
    ``,
    `## Daily Load`,
    `Date,Hours Scheduled`,
    ...Object.entries(analytics.dailyLoad)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, hours]) => `${date},${hours}`),
    ``,
    `## Weekly Trend`,
    `Week,Week Label,Hours`,
    ...analytics.weeklyTrend.map((w) => `${w.weekKey},${w.weekLabel},${w.hours}`),
    ``,
    `## Calendar Breakdown`,
    `Calendar,Provider,Hours,Events`,
    ...analytics.calendarBreakdown.map(
      (c) => `${c.name},${c.provider},${c.hours},${c.eventCount}`
    ),
    ``,
    `## Average by Day of Week`,
    `Day,Avg Hours`,
    ...Object.entries(analytics.weekdayAvg).map(([d, h]) => `${d},${h}`),
  ].join("\n");

  const blob = new Blob([summary], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `syncone-analytics-${period}d-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Main component ────────────────────────────────────────────────────────────

export function AnalyticsDashboard() {
  const [period, setPeriod] = useState<Period>(30);

  const { data, isLoading, isError, refetch } = useQuery<{ data: AnalyticsData }>({
    queryKey: ["analytics", period],
    queryFn: async () => {
      const res = await fetch(`/api/analytics?period=${period}`);
      if (!res.ok) throw new Error("Failed to load analytics");
      return res.json();
    },
    staleTime: 10 * 60_000,
  });

  const analytics  = data?.data;
  const periodStart = format(subDays(new Date(), period), "MMM d, yyyy");
  const periodEnd   = format(new Date(), "MMM d, yyyy");

  return (
    <div className="space-y-6">
      {/* ── Controls row ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Period selector */}
          <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-md transition-colors font-medium",
                  period === p.value
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Date range label */}
          {!isLoading && (
            <span className="text-xs text-gray-400 tabular-nums">
              {periodStart} – {periodEnd}
            </span>
          )}
        </div>

        {/* Export */}
        {analytics && (
          <button
            onClick={() => exportToCSV(analytics, period)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-100 rounded-md px-3 py-1.5 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        )}
      </div>

      {/* ── Stats grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-gray-100 rounded-xl p-4 animate-pulse"
            >
              <div className="w-8 h-8 bg-gray-100 rounded-lg mb-3" />
              <div className="h-6 w-14 bg-gray-100 rounded mb-1.5" />
              <div className="h-3 w-20 bg-gray-100 rounded mb-1" />
              <div className="h-2.5 w-24 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : analytics ? (
        <StatsGrid data={analytics} />
      ) : null}

      {/* ── Main layout: left 2/3 + right 1/3 ── */}
      {!isError && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Left column */}
          <div className="lg:col-span-2 space-y-5">
            {isLoading ? (
              <>
                <SkeletonCard rows={5} />
                <SkeletonCard rows={4} />
                <div className="grid grid-cols-2 gap-5">
                  <SkeletonCard rows={7} />
                  <SkeletonCard rows={10} />
                </div>
              </>
            ) : analytics ? (
              <>
                <SectionCard
                  title="Workload heatmap"
                  subtitle={`Daily scheduled hours — last ${period} days`}
                >
                  <WorkloadHeatmap dailyLoad={analytics.dailyLoad} period={period} />
                </SectionCard>

                <SectionCard title="Weekly trend" subtitle="Total hours per ISO week">
                  <WeeklyTrend data={analytics.weeklyTrend} />
                </SectionCard>

                <div className="grid grid-cols-2 gap-5">
                  <SectionCard title="By day of week" subtitle="Average scheduled hours">
                    <DayChart weekdayAvg={analytics.weekdayAvg} />
                  </SectionCard>
                  <SectionCard title="By hour of day" subtitle="Hours starting in each slot">
                    <HourChart
                      hourLoad={analytics.hourLoad}
                      busiestHour={analytics.busiestHour}
                    />
                  </SectionCard>
                </div>
              </>
            ) : null}
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {isLoading ? (
              <>
                <SkeletonCard rows={4} />
                <SkeletonCard rows={4} />
                <SkeletonCard rows={3} />
              </>
            ) : analytics ? (
              <>
                {/* Meeting / Focus split — always first in the right column */}
                <SectionCard
                  title="Meeting vs. focus"
                  subtitle="How your scheduled time breaks down"
                >
                  <MeetingFocusChart
                    meetingHours={analytics.meetingHours}
                    focusHours={analytics.focusHours}
                    totalHours={analytics.totalScheduledHours}
                  />
                </SectionCard>

                <SectionCard
                  title="Calendar breakdown"
                  subtitle="Scheduled time per calendar"
                >
                  <CalendarBreakdown data={analytics.calendarBreakdown} />
                </SectionCard>

                <SectionCard title="Burnout signals">
                  <BurnoutPanel alerts={analytics.burnoutAlerts} />
                </SectionCard>

                {(analytics.busiestDate || analytics.busiestHour !== null) && (
                  <SectionCard title="Peak times">
                    <div className="space-y-0 divide-y divide-gray-100">
                      {analytics.busiestDate && (
                        <div className="flex items-center justify-between py-2.5">
                          <p className="text-xs text-gray-500">Busiest day</p>
                          <div className="text-right">
                            <p className="text-xs font-semibold text-gray-900">
                              {format(
                                new Date(`${analytics.busiestDate}T12:00:00`),
                                "EEE, MMM d"
                              )}
                            </p>
                            <p className="text-[11px] text-gray-400 tabular-nums">
                              {analytics.busiestDateHours}h
                            </p>
                          </div>
                        </div>
                      )}
                      {analytics.busiestHour !== null && (
                        <div className="flex items-center justify-between py-2.5">
                          <p className="text-xs text-gray-500">Busiest hour</p>
                          <p className="text-xs font-semibold text-gray-900">
                            {formatHour(analytics.busiestHour!)}
                          </p>
                        </div>
                      )}
                    </div>
                  </SectionCard>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="bg-white border border-conflict-hard/30 rounded-xl p-8 text-center">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-5 h-5 text-conflict-hard" />
          </div>
          <p className="text-sm font-medium text-gray-900 mb-1">Failed to load analytics</p>
          <p className="text-xs text-gray-400 mb-4">
            There was a problem fetching your analytics data.
          </p>
          <button
            onClick={() => refetch()}
            className="text-xs text-gray-500 hover:underline font-medium"
          >
            Try again →
          </button>
        </div>
      )}
    </div>
  );
}

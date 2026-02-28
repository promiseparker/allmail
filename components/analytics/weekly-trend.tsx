"use client";

import { cn } from "@/lib/utils";
import type { WeekStat } from "@/app/api/analytics/route";

interface WeeklyTrendProps {
  data: WeekStat[];
}

export function WeeklyTrend({ data }: WeeklyTrendProps) {
  if (data.length < 2) {
    return <p className="text-xs text-gray-400 py-4 text-center">Not enough data yet.</p>;
  }

  const max = Math.max(...data.map((w) => w.hours), 1);
  const BAR_H = 64; // px — height of chart area

  // SVG sparkline
  const W = 100;
  const H = 40;
  const pts = data.map((w, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - (w.hours / max) * (H - 4),
  }));
  const path = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${path} L${pts[pts.length - 1]!.x.toFixed(1)},${H} L0,${H} Z`;

  const lastWeek = data[data.length - 1]!;
  const prevWeek = data[data.length - 2];
  const trend = prevWeek
    ? lastWeek.hours > prevWeek.hours
      ? "up"
      : lastWeek.hours < prevWeek.hours
      ? "down"
      : "flat"
    : "flat";

  return (
    <div>
      {/* Sparkline */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: BAR_H }}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6B7280" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#6B7280" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#sparkGrad)" />
        <path d={path} fill="none" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Current week dot */}
        {pts[pts.length - 1] && (
          <circle cx={pts[pts.length - 1]!.x} cy={pts[pts.length - 1]!.y} r="2" fill="#111827" />
        )}
      </svg>

      {/* Week labels + bars */}
      <div className="flex items-end gap-1 mt-3">
        {data.slice(-8).map((week, i, arr) => {
          const isLast = i === arr.length - 1;
          const heightPct = max > 0 ? (week.hours / max) * 100 : 0;
          return (
            <div key={week.weekKey} className="flex-1 flex flex-col items-center gap-1 group" title={`${week.weekLabel}: ${week.hours}h`}>
              <div
                className={cn(
                  "w-full rounded-sm transition-all duration-500",
                  isLast ? "bg-gray-800" : "bg-gray-200 group-hover:bg-gray-300"
                )}
                style={{ height: Math.max(heightPct * 0.4, week.hours > 0 ? 2 : 0) }}
              />
              <span className="text-[9px] text-gray-400 truncate w-full text-center">
                {week.weekLabel}
              </span>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          Last week: <span className="font-semibold text-gray-900">{lastWeek.hours}h</span>
        </p>
        <p className={cn(
          "text-xs font-medium",
          trend === "up" ? "text-gray-600" : trend === "down" ? "text-gray-600" : "text-gray-400"
        )}>
          {trend === "up" ? "↑ More than prior week" : trend === "down" ? "↓ Less than prior week" : "→ Same as prior week"}
        </p>
      </div>
    </div>
  );
}

import { AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BurnoutAlert } from "@/app/api/analytics/route";

const BURNOUT_ICONS = {
  overload_streak: "🔥",
  heavy_week:      "📦",
  no_breaks:       "⏰",
  meeting_heavy:   "🗣️",
} as const;

const BURNOUT_TITLES = {
  overload_streak: "Overload streak",
  heavy_week:      "Heavy week",
  no_breaks:       "No rest days",
  meeting_heavy:   "Meeting-heavy day",
} as const;

interface BurnoutPanelProps {
  alerts: BurnoutAlert[];
}

export function BurnoutPanel({ alerts }: BurnoutPanelProps) {
  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
          <span className="text-base">✅</span>
        </div>
        <div>
          <p className="text-sm font-medium text-green-800">No burnout signals detected</p>
          <p className="text-xs text-green-600 mt-0.5">Your workload looks healthy in this period.</p>
        </div>
      </div>
    );
  }

  const highCount = alerts.filter((a) => a.severity === "high").length;
  const medCount  = alerts.filter((a) => a.severity === "medium").length;

  return (
    <div>
      {/* Summary bar */}
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-conflict-soft" />
        <p className="text-sm font-medium text-gray-700">
          {alerts.length} signal{alerts.length !== 1 ? "s" : ""} detected
        </p>
        {highCount > 0 && (
          <span className="text-xs bg-conflict-hard-bg text-conflict-hard border border-conflict-hard/20 px-2 py-0.5 rounded-full font-medium">
            {highCount} high
          </span>
        )}
        {medCount > 0 && (
          <span className="text-xs bg-conflict-soft-bg text-conflict-soft border border-conflict-soft/20 px-2 py-0.5 rounded-full font-medium">
            {medCount} medium
          </span>
        )}
      </div>

      {/* Alert cards */}
      <div className="space-y-2">
        {alerts.map((alert, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-3 p-3 rounded-lg border",
              alert.severity === "high"
                ? "bg-red-50 border-conflict-hard/20"
                : "bg-amber-50 border-conflict-soft/20"
            )}
          >
            <span className="text-lg flex-shrink-0 mt-0.5">
              {BURNOUT_ICONS[alert.type]}
            </span>
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-xs font-semibold",
                  alert.severity === "high" ? "text-conflict-hard" : "text-conflict-soft"
                )}
              >
                {BURNOUT_TITLES[alert.type]}
              </p>
              <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{alert.description}</p>
              {alert.hours !== undefined && (
                <p className="text-[10px] text-gray-400 mt-1 tabular-nums">{alert.hours}h</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-1.5 mt-3 p-3 bg-surface-muted rounded-lg">
        <Info className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-gray-400 leading-relaxed">
          Signals are based on scheduled calendar time only. Actual work may vary. Use these as a starting point for reflection, not absolute rules.
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isSameDay, parseISO } from "date-fns";
import {
  AlertTriangle, CheckCircle2, RefreshCw,
  Check, RotateCcw, Calendar,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Toast, useToast } from "@/components/ui/toast";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ConflictEvent {
  id:       string;
  title:    string;
  startsAt: string;
  endsAt:   string;
  calendar: { name: string; color: string | null };
}

interface Conflict {
  id:             string;
  eventA:         ConflictEvent;
  eventB:         ConflictEvent;
  overlapStart:   string;
  overlapEnd:     string;
  overlapMinutes: number;
  severity:       "hard" | "soft";
  status:         "active" | "acknowledged" | "resolved";
}

type TabStatus      = "active" | "acknowledged";
type SeverityFilter = "all" | "hard" | "soft";

interface ConflictListProps {
  initialActiveCount:       number;
  initialAcknowledgedCount: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toMs(t: string) {
  return new Date(t).getTime();
}

// ── Overlap timeline bar ──────────────────────────────────────────────────────

function OverlapBar({ eventA, eventB, overlapStart, overlapEnd, severity }: {
  eventA:       ConflictEvent;
  eventB:       ConflictEvent;
  overlapStart: string;
  overlapEnd:   string;
  severity:     "hard" | "soft";
}) {
  const rangeStart = Math.min(toMs(eventA.startsAt), toMs(eventB.startsAt));
  const rangeEnd   = Math.max(toMs(eventA.endsAt),   toMs(eventB.endsAt));
  const range      = rangeEnd - rangeStart || 1;

  function pct(t: string) {
    return ((toMs(t) - rangeStart) / range) * 100;
  }

  const aLeft  = pct(eventA.startsAt);
  const aWidth = Math.max(pct(eventA.endsAt) - aLeft, 1);
  const bLeft  = pct(eventB.startsAt);
  const bWidth = Math.max(pct(eventB.endsAt) - bLeft, 1);
  const oLeft  = pct(overlapStart);
  const oWidth = Math.max(pct(overlapEnd) - oLeft, 1);

  const overlapBg = severity === "hard"
    ? "rgba(220,38,38,0.18)"
    : "rgba(217,119,6,0.18)";

  return (
    <div
      className="relative h-8 my-3 rounded-md overflow-hidden bg-surface-subtle"
      aria-hidden
    >
      <div
        className="absolute top-1 h-2.5 rounded-full opacity-75"
        style={{
          left:            `${aLeft}%`,
          width:           `${aWidth}%`,
          backgroundColor: eventA.calendar.color ?? "#6B7280",
        }}
      />
      <div
        className="absolute bottom-1 h-2.5 rounded-full opacity-75"
        style={{
          left:            `${bLeft}%`,
          width:           `${bWidth}%`,
          backgroundColor: eventB.calendar.color ?? "#6B7280",
        }}
      />
      <div
        className="absolute inset-y-0 rounded"
        style={{
          left:            `${oLeft}%`,
          width:           `${oWidth}%`,
          backgroundColor: overlapBg,
        }}
      />
    </div>
  );
}

// ── ConflictCard ──────────────────────────────────────────────────────────────

function ConflictCard({ conflict }: { conflict: Conflict }) {
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (action: "acknowledge" | "resolve" | "reopen") => {
      const res = await fetch("/api/conflicts", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ conflictId: conflict.id, action }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conflicts"] });
    },
  });

  const isHard         = conflict.severity === "hard";
  const isAcknowledged = conflict.status === "acknowledged";
  const { eventA, eventB } = conflict;

  const overlapDate   = format(parseISO(conflict.overlapStart), "EEE, MMM d");
  const isSameCalDate = isSameDay(parseISO(eventA.startsAt), parseISO(eventB.startsAt));
  const calendarUrl   = `/calendar?date=${format(parseISO(conflict.overlapStart), "yyyy-MM-dd")}&view=day`;

  function formatRange(startsAt: string, endsAt: string) {
    return `${format(parseISO(startsAt), "h:mm a")} – ${format(parseISO(endsAt), "h:mm a")}`;
  }

  return (
    <div
      className={cn(
        "bg-white border rounded-xl overflow-hidden transition-opacity",
        isHard        ? "border-conflict-hard/30" : "border-conflict-soft/30",
        isAcknowledged && "opacity-60"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-2.5",
          isHard ? "bg-conflict-hard-bg" : "bg-conflict-soft-bg"
        )}
      >
        <div className="flex items-center gap-1.5">
          <AlertTriangle
            className={cn("w-3.5 h-3.5", isHard ? "text-conflict-hard" : "text-conflict-soft")}
          />
          <span
            className={cn(
              "text-xs font-semibold uppercase tracking-wide",
              isHard ? "text-conflict-hard" : "text-conflict-soft"
            )}
          >
            {isHard ? "Hard conflict" : "Soft overlap"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{overlapDate}</span>
          <span
            className={cn(
              "text-xs font-medium tabular-nums px-1.5 py-0.5 rounded-full",
              isHard
                ? "bg-conflict-hard/10 text-conflict-hard"
                : "bg-conflict-soft/10 text-conflict-soft"
            )}
          >
            {conflict.overlapMinutes} min
          </span>
        </div>
      </div>

      {/* Event details */}
      <div className="px-4 pt-3 pb-2">
        <OverlapBar
          eventA={eventA}
          eventB={eventB}
          overlapStart={conflict.overlapStart}
          overlapEnd={conflict.overlapEnd}
          severity={conflict.severity}
        />

        <div className="space-y-2.5">
          {[eventA, eventB].map((event) => (
            <div key={event.id} className="flex items-start gap-2.5">
              <div
                className="w-0.5 h-9 rounded-full flex-shrink-0 mt-0.5"
                style={{ backgroundColor: event.calendar.color ?? "#6B7280" }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                <p className="text-xs text-gray-400">
                  <span className="font-medium text-gray-600">{event.calendar.name}</span>
                  {" · "}
                  {formatRange(event.startsAt, event.endsAt)}
                </p>
              </div>
              {!isSameCalDate && (
                <span className="text-[10px] text-gray-400 bg-surface-muted px-1.5 py-0.5 rounded-full flex-shrink-0">
                  {format(parseISO(event.startsAt), "MMM d")}
                </span>
              )}
            </div>
          ))}
        </div>

        <div
          className={cn(
            "mt-2.5 text-xs tabular-nums",
            isHard ? "text-conflict-hard" : "text-conflict-soft"
          )}
        >
          Overlap: {format(parseISO(conflict.overlapStart), "h:mm a")}
          {" – "}
          {format(parseISO(conflict.overlapEnd), "h:mm a")}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-t border-gray-100">
        {isAcknowledged ? (
          <>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Check className="w-3 h-3" /> Acknowledged
            </span>
            <button
              onClick={() => mutation.mutate("reopen")}
              disabled={mutation.isPending}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-3 h-3" />
              Reopen
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => mutation.mutate("acknowledge")}
              disabled={mutation.isPending}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
            >
              Acknowledge
            </button>
            <button
              onClick={() => mutation.mutate("resolve")}
              disabled={mutation.isPending}
              className="text-xs font-medium text-gray-700 hover:text-gray-900 transition-colors disabled:opacity-50"
            >
              Mark resolved
            </button>
          </>
        )}

        {mutation.isPending && (
          <RefreshCw className="w-3 h-3 text-gray-400 animate-spin" />
        )}

        {/* View in calendar */}
        <Link
          href={calendarUrl}
          className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors"
        >
          <Calendar className="w-3 h-3" />
          View in calendar
        </Link>
      </div>
    </div>
  );
}

// ── ConflictList ──────────────────────────────────────────────────────────────

export function ConflictList({
  initialActiveCount,
  initialAcknowledgedCount,
}: ConflictListProps) {
  const qc                       = useQueryClient();
  const { toast, show, dismiss } = useToast();
  const [tab, setTab]            = useState<TabStatus>("active");
  const [severity, setSeverity]  = useState<SeverityFilter>("all");
  const [isRescanning, setIsRescanning] = useState(false);

  // Fetch both tabs simultaneously to keep counts live
  const activeQuery = useQuery<Conflict[]>({
    queryKey: ["conflicts", "active"],
    queryFn:  async () => {
      const res = await fetch("/api/conflicts?status=active");
      if (!res.ok) throw new Error("Failed to fetch conflicts");
      return (await res.json()).data;
    },
    staleTime:       30_000,
    refetchInterval: 5 * 60_000,
  });

  const acknowledgedQuery = useQuery<Conflict[]>({
    queryKey: ["conflicts", "acknowledged"],
    queryFn:  async () => {
      const res = await fetch("/api/conflicts?status=acknowledged");
      if (!res.ok) throw new Error("Failed to fetch conflicts");
      return (await res.json()).data;
    },
    staleTime: 60_000,
  });

  const allConflicts = tab === "active"
    ? (activeQuery.data ?? [])
    : (acknowledgedQuery.data ?? []);

  const isLoading = tab === "active" ? activeQuery.isLoading : acknowledgedQuery.isLoading;
  const isError   = tab === "active" ? activeQuery.isError   : acknowledgedQuery.isError;

  // Apply severity filter
  const conflicts = severity === "all"
    ? allConflicts
    : allConflicts.filter((c) => c.severity === severity);

  // Live counts (fall back to server-side initial counts during first load)
  const activeCount       = activeQuery.data       ? activeQuery.data.length       : initialActiveCount;
  const acknowledgedCount = acknowledgedQuery.data ? acknowledgedQuery.data.length : initialAcknowledgedCount;

  // Hard / soft split for the filter pills
  const hardCount = allConflicts.filter((c) => c.severity === "hard").length;
  const softCount = allConflicts.filter((c) => c.severity === "soft").length;

  const acknowledgeAllMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(
        allConflicts
          .filter((c) => c.status === "active")
          .map((c) =>
            fetch("/api/conflicts", {
              method:  "PATCH",
              headers: { "Content-Type": "application/json" },
              body:    JSON.stringify({ conflictId: c.id, action: "acknowledge" }),
            })
          )
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conflicts"] });
      show("All conflicts acknowledged", "success");
    },
    onError: () => show("Failed to acknowledge all — please try again", "error"),
  });

  async function rescan() {
    setIsRescanning(true);
    try {
      const res = await fetch("/api/conflicts", { method: "POST" });
      if (res.ok) {
        qc.invalidateQueries({ queryKey: ["conflicts"] });
        show("Conflict scan complete", "success");
      } else {
        show("Rescan failed — please try again", "error");
      }
    } catch {
      show("Rescan failed — please try again", "error");
    } finally {
      setIsRescanning(false);
    }
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        {/* Tabs */}
        <div className="flex items-center gap-0.5 bg-surface-muted rounded-lg p-1">
          {(["active", "acknowledged"] as const).map((t) => {
            const count = t === "active" ? activeCount : acknowledgedCount;
            return (
              <button
                key={t}
                onClick={() => { setTab(t); setSeverity("all"); }}
                className={cn(
                  "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors font-medium capitalize",
                  tab === t
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {t}
                {count > 0 && (
                  <span
                    className={cn(
                      "text-[10px] font-bold rounded-full px-1.5 py-0 min-w-[18px] text-center",
                      tab === t
                        ? t === "active"
                          ? "bg-conflict-hard text-white"
                          : "bg-gray-200 text-gray-600"
                        : "bg-gray-200 text-gray-500"
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {tab === "active" && allConflicts.length > 1 && (
            <button
              onClick={() => acknowledgeAllMutation.mutate()}
              disabled={acknowledgeAllMutation.isPending}
              className="text-xs text-gray-500 hover:text-gray-700 border border-gray-100 rounded-md px-3 py-1.5 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Acknowledge all
            </button>
          )}
          <button
            onClick={rescan}
            disabled={isRescanning}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-100 rounded-md px-3 py-1.5 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isRescanning && "animate-spin")} />
            {isRescanning ? "Scanning…" : "Rescan"}
          </button>
        </div>
      </div>

      {/* Severity filter — shown when there are conflicts of both types */}
      {!isLoading && allConflicts.length > 0 && hardCount > 0 && softCount > 0 && (
        <div className="flex items-center gap-2 mb-4">
          {([
            { key: "all",  label: `All (${allConflicts.length})` },
            { key: "hard", label: `Hard (${hardCount})` },
            { key: "soft", label: `Soft (${softCount})` },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSeverity(key)}
              className={cn(
                "text-xs px-2.5 py-1 rounded-full border transition-colors font-medium",
                severity === key
                  ? key === "hard"
                    ? "bg-conflict-hard/10 border-conflict-hard/30 text-conflict-hard"
                    : key === "soft"
                    ? "bg-conflict-soft/10 border-conflict-soft/30 text-conflict-soft"
                    : "bg-gray-100 border-gray-300 text-gray-700"
                  : "border-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Severity summary (single-type active, no filter needed) */}
      {!isLoading && allConflicts.length > 0 && !(hardCount > 0 && softCount > 0) && (
        <div className="flex items-center gap-3 mb-4 text-xs">
          {hardCount > 0 && (
            <span className="flex items-center gap-1 text-conflict-hard font-medium">
              <AlertTriangle className="w-3 h-3" />
              {hardCount} hard conflict{hardCount !== 1 ? "s" : ""}
            </span>
          )}
          {softCount > 0 && (
            <span className="flex items-center gap-1 text-conflict-soft font-medium">
              <AlertTriangle className="w-3 h-3" />
              {softCount} soft overlap{softCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white border border-gray-100 rounded-xl p-4 animate-pulse"
            >
              <div className="h-4 w-40 bg-surface-subtle rounded mb-3" />
              <div className="h-8 w-full bg-surface-subtle rounded mb-3" />
              <div className="h-3 w-64 bg-surface-subtle rounded mb-2" />
              <div className="h-3 w-56 bg-surface-subtle rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="bg-white border border-gray-100 rounded-xl p-8 text-center">
          <p className="text-sm text-conflict-hard">Failed to load conflicts.</p>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ["conflicts"] })}
            className="text-xs text-gray-500 underline mt-2"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && allConflicts.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-700">
            {tab === "active" ? "No active conflicts" : "No acknowledged conflicts"}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {tab === "active"
              ? "Your schedule is clear — no overlapping events detected."
              : "Acknowledged conflicts will appear here."}
          </p>
          {tab === "active" && (
            <button
              onClick={rescan}
              disabled={isRescanning}
              className="mt-4 text-xs text-gray-500 hover:underline disabled:opacity-50"
            >
              Run a conflict scan →
            </button>
          )}
        </div>
      )}

      {/* Filtered-to-empty state */}
      {!isLoading && !isError && allConflicts.length > 0 && conflicts.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-8 text-center">
          <p className="text-sm text-gray-400">
            No {severity} conflicts in this view.
          </p>
          <button
            onClick={() => setSeverity("all")}
            className="text-xs text-gray-500 hover:underline mt-2"
          >
            Show all
          </button>
        </div>
      )}

      {/* Conflict cards */}
      {!isLoading && !isError && conflicts.length > 0 && (
        <div className="space-y-3">
          {conflicts.map((conflict) => (
            <ConflictCard key={conflict.id} conflict={conflict} />
          ))}
        </div>
      )}

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onDismiss={dismiss} />
      )}
    </>
  );
}

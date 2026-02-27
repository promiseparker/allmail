"use client";

import { useState } from "react";
import { Check, Zap, ExternalLink } from "lucide-react";
import { Toast, useToast } from "@/components/ui/toast";
import { PLAN_LIMITS } from "@/types/api";
import type { Plan } from "@/types/api";

interface BillingSectionProps {
  plan:           Plan;
  planExpiresAt:  string | null;
  accountCount:   number;
  accountLimit:   number;
}

const FREE_FEATURES = [
  "2 connected accounts",
  "All calendar views",
  "Conflict detection",
  "7-day sync history",
];

const PRO_FEATURES = [
  "Unlimited connected accounts",
  "Advanced conflict resolution",
  "Analytics & workload heatmaps",
  "Burnout signal detection",
  "Weekly digest email",
  "90-day sync history",
  "Priority support",
];

export function BillingSection({
  plan,
  planExpiresAt,
  accountCount,
  accountLimit,
}: BillingSectionProps) {
  const { toast, show, dismiss } = useToast();
  const [loading, setLoading] = useState<"checkout" | "portal" | null>(null);
  const isPro = plan === "pro" || plan === "enterprise";

  const limits = PLAN_LIMITS[plan];

  async function openCheckout() {
    setLoading("checkout");
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      } else {
        show("Failed to open checkout — please try again", "error");
        setLoading(null);
      }
    } catch {
      show("Something went wrong", "error");
      setLoading(null);
    }
  }

  async function openPortal() {
    setLoading("portal");
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      } else {
        show("Failed to open billing portal — please try again", "error");
        setLoading(null);
      }
    } catch {
      show("Something went wrong", "error");
      setLoading(null);
    }
  }

  const accountLimitDisplay =
    accountLimit === Infinity ? "∞" : String(accountLimit);
  const accountUsagePct =
    accountLimit === Infinity ? 0 : accountCount / accountLimit;

  return (
    <>
      <div className="space-y-5">
        {/* Current plan banner */}
        <div
          className={`rounded-xl p-4 border ${
            isPro
              ? "bg-primary-50 border-primary/20"
              : "bg-surface-muted border-border"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Current plan</p>
              <p className="text-lg font-bold text-gray-900 capitalize mt-0.5">
                {plan}
              </p>
              {isPro && planExpiresAt && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Renews{" "}
                  {new Date(planExpiresAt).toLocaleDateString(undefined, {
                    year:  "numeric",
                    month: "long",
                    day:   "numeric",
                  })}
                </p>
              )}
            </div>
            {isPro ? (
              <button
                onClick={openPortal}
                disabled={loading === "portal"}
                className="flex items-center gap-1.5 text-sm font-medium border border-border bg-white px-4 py-2 rounded-md hover:bg-surface-subtle transition-colors disabled:opacity-50"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {loading === "portal" ? "Loading…" : "Manage billing"}
              </button>
            ) : (
              <span className="text-xs text-gray-400 font-medium">Free forever</span>
            )}
          </div>
        </div>

        {/* Usage stats */}
        <div className="bg-white border border-border rounded-xl p-5 shadow-card">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Usage</h3>
          <div className="space-y-4">

            {/* Connected accounts */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-600">Connected accounts</span>
                <span className="text-xs font-semibold text-gray-900 tabular-nums">
                  {accountCount} / {accountLimitDisplay}
                </span>
              </div>
              {accountLimit !== Infinity && (
                <div className="w-full bg-surface-subtle rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      accountUsagePct >= 1
                        ? "bg-conflict-hard"
                        : accountUsagePct >= 0.75
                        ? "bg-amber-500"
                        : "bg-primary"
                    }`}
                    style={{ width: `${Math.min(accountUsagePct * 100, 100)}%` }}
                  />
                </div>
              )}
              {accountLimit !== Infinity && accountUsagePct >= 1 && (
                <p className="text-[10px] text-conflict-hard mt-1">
                  Limit reached — upgrade to add more accounts.
                </p>
              )}
            </div>

            {/* Sync interval */}
            <div className="flex items-center justify-between py-2.5 border-t border-border">
              <span className="text-xs text-gray-600">Sync interval</span>
              <span className="text-xs font-semibold text-gray-900">
                Every {limits.syncIntervalMinutes}{" "}
                {limits.syncIntervalMinutes === 1 ? "minute" : "minutes"}
              </span>
            </div>

            {/* Conflict lookback */}
            <div className="flex items-center justify-between py-2.5 border-t border-border">
              <span className="text-xs text-gray-600">Conflict lookback</span>
              <span className="text-xs font-semibold text-gray-900">
                {limits.conflictLookbackDays} days
              </span>
            </div>

            {/* Analytics */}
            <div className="flex items-center justify-between py-2.5 border-t border-border">
              <span className="text-xs text-gray-600">Analytics</span>
              <span className={`text-xs font-semibold ${limits.analyticsEnabled ? "text-green-600" : "text-gray-400"}`}>
                {limits.analyticsEnabled ? "Enabled" : "Not available"}
              </span>
            </div>
          </div>
        </div>

        {/* Plan comparison (free users only) */}
        {!isPro && (
          <div className="grid grid-cols-2 gap-4">
            {/* Free card */}
            <div className="bg-white border border-border rounded-xl p-5 shadow-card">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Free</h3>
              <p className="text-2xl font-bold text-gray-900 mb-4">
                $0{" "}
                <span className="text-sm font-normal text-gray-400">/mo</span>
              </p>
              <ul className="space-y-2 mb-5">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                    <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="py-2 text-center text-xs font-medium text-gray-400 border border-border rounded-md bg-surface-muted">
                Current plan
              </div>
            </div>

            {/* Pro card */}
            <div className="bg-white border-2 border-primary rounded-xl p-5 shadow-card relative overflow-hidden">
              <div className="absolute top-3 right-3 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                POPULAR
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Pro</h3>
              <p className="text-2xl font-bold text-gray-900 mb-4">
                $12{" "}
                <span className="text-sm font-normal text-gray-400">/mo</span>
              </p>
              <ul className="space-y-2 mb-5">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                    <Check className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={openCheckout}
                disabled={loading === "checkout"}
                className="w-full flex items-center justify-center gap-1.5 bg-primary text-white text-sm font-medium py-2.5 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5" />
                {loading === "checkout" ? "Loading…" : "Upgrade to Pro"}
              </button>
            </div>
          </div>
        )}

        {/* Pro feature list */}
        {isPro && (
          <div className="bg-white border border-border rounded-xl p-5 shadow-card">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Your Pro features</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              {PRO_FEATURES.map((f) => (
                <div key={f} className="flex items-center gap-2 text-xs text-gray-600">
                  <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onDismiss={dismiss} />
      )}
    </>
  );
}

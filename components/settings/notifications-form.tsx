"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Toast, useToast } from "@/components/ui/toast";
import type { Plan } from "@/types/api";

interface NotificationsFormProps {
  initialConflictEmail:  boolean;
  initialWeeklyDigest:   boolean;
  initialSyncErrors:     boolean;
  initialBurnoutSignals: boolean;
  plan: Plan;
}

export function NotificationsForm({
  initialConflictEmail,
  initialWeeklyDigest,
  initialSyncErrors,
  initialBurnoutSignals,
  plan,
}: NotificationsFormProps) {
  const router = useRouter();
  const { toast, show, dismiss } = useToast();
  const [isPending, startTransition] = useTransition();

  const [conflictEmail,  setConflictEmail]  = useState(initialConflictEmail);
  const [weeklyDigest,   setWeeklyDigest]   = useState(initialWeeklyDigest);
  const [syncErrors,     setSyncErrors]     = useState(initialSyncErrors);
  const [burnoutSignals, setBurnoutSignals] = useState(initialBurnoutSignals);

  const isPro = plan === "pro";

  function save() {
    startTransition(async () => {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "notifications",
          data: { conflictEmail, weeklyDigest, syncErrors, burnoutSignals },
        }),
      });
      if (res.ok) {
        show("Preferences saved", "success");
        router.refresh();
      } else {
        show("Failed to save preferences", "error");
      }
    });
  }

  return (
    <>
      <div className="space-y-5">
        <section className="bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Email notifications</h2>

          <div className="space-y-0 divide-y divide-gray-100">
            <div className="py-3">
              <Toggle
                checked={conflictEmail}
                onChange={setConflictEmail}
                label="Conflict alerts"
                description="Get an email when a new scheduling conflict is detected."
              />
            </div>
            <div className="py-3">
              <Toggle
                checked={weeklyDigest}
                onChange={setWeeklyDigest}
                label="Weekly digest"
                description="A weekly summary of your schedule, meetings, and workload trends."
              />
            </div>
            <div className="py-3">
              <Toggle
                checked={syncErrors}
                onChange={setSyncErrors}
                label="Sync error alerts"
                description="Be notified if a calendar fails to sync."
              />
            </div>
            <div className="py-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm ${isPro ? "text-gray-700" : "text-gray-400"}`}>
                      Burnout signals
                    </span>
                    {!isPro && (
                      <span className="flex items-center gap-0.5 text-[10px] font-medium text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                        <Lock className="w-2.5 h-2.5" />
                        Pro
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {isPro
                      ? "Get notified when overload or burnout patterns are detected."
                      : "Upgrade to Pro to enable burnout signal notifications."}
                  </p>
                </div>
                <Toggle
                  checked={burnoutSignals}
                  onChange={setBurnoutSignals}
                  disabled={!isPro}
                />
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            onClick={save}
            disabled={isPending}
            className="bg-primary text-white text-sm font-medium px-5 py-2 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Saving…" : "Save preferences"}
          </button>
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onDismiss={dismiss} />
      )}
    </>
  );
}

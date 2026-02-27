"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import { Toast, useToast } from "@/components/ui/toast";

const TIMEZONE_OPTIONS = [
  "UTC",
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Anchorage", "Pacific/Honolulu",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Amsterdam",
  "Europe/Rome", "Europe/Madrid", "Europe/Warsaw", "Europe/Helsinki",
  "Asia/Dubai", "Asia/Kolkata", "Asia/Bangkok", "Asia/Tokyo", "Asia/Singapore",
  "Asia/Shanghai", "Asia/Seoul",
  "Australia/Perth", "Australia/Sydney",
  "Pacific/Auckland",
];

interface ProfileFormProps {
  initialName:      string;
  email:            string;
  avatarUrl?:       string | null;
  initialTimezone:  string;
  initialView:      "week" | "month" | "day";
  initialWeekStart: 0 | 1;
  initialWorkStart: number;
  initialWorkEnd:   number;
}

export function ProfileForm({
  initialName,
  email,
  avatarUrl,
  initialTimezone,
  initialView,
  initialWeekStart,
  initialWorkStart,
  initialWorkEnd,
}: ProfileFormProps) {
  const router = useRouter();
  const { toast, show, dismiss } = useToast();
  const [isPending, startTransition] = useTransition();

  const [name,        setName]        = useState(initialName);
  const [timezone,    setTimezone]    = useState(initialTimezone);
  const [tzSearch,    setTzSearch]    = useState("");
  const [defaultView, setDefaultView] = useState(initialView);
  const [weekStart,   setWeekStart]   = useState<0 | 1>(initialWeekStart);
  const [workStart,   setWorkStart]   = useState(initialWorkStart);
  const [workEnd,     setWorkEnd]     = useState(initialWorkEnd);

  const tzQuery = tzSearch.trim().toLowerCase();
  const filteredTimezones = tzQuery
    ? TIMEZONE_OPTIONS.filter((tz) => tz.toLowerCase().includes(tzQuery))
    : TIMEZONE_OPTIONS;

  const hasChanges =
    name        !== initialName      ||
    timezone    !== initialTimezone  ||
    defaultView !== initialView      ||
    weekStart   !== initialWeekStart ||
    workStart   !== initialWorkStart ||
    workEnd     !== initialWorkEnd;

  function save() {
    startTransition(async () => {
      const [profileRes, prefsRes] = await Promise.all([
        fetch("/api/settings", {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            section: "profile",
            data:    { name, timezone },
          }),
        }),
        fetch("/api/settings", {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            section: "preferences",
            data: {
              defaultView,
              weekStartsOn:      weekStart,
              workingHoursStart: workStart,
              workingHoursEnd:   workEnd,
            },
          }),
        }),
      ]);

      if (profileRes.ok && prefsRes.ok) {
        show("Settings saved", "success");
        router.refresh();
      } else {
        show("Failed to save settings", "error");
      }
    });
  }

  const initials = (initialName || email)
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");

  return (
    <>
      <div className="space-y-5">
        {/* Profile */}
        <section className="bg-white border border-border rounded-xl p-5 shadow-card space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Profile</h2>

          {/* Avatar row */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-primary-50 border border-border flex items-center justify-center">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={initialName || email}
                  className="w-full h-full object-cover"
                />
              ) : initials ? (
                <span className="text-lg font-semibold text-primary">
                  {initials}
                </span>
              ) : (
                <User className="w-6 h-6 text-gray-300" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{initialName || "—"}</p>
              <p className="text-xs text-gray-400">{email}</p>
              <p className="text-[11px] text-gray-400 mt-1">
                Avatar is synced from your sign-in provider.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Display name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface-muted text-gray-400 cursor-not-allowed"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Email is managed by your sign-in provider and cannot be changed here.
            </p>
          </div>
        </section>

        {/* Preferences */}
        <section className="bg-white border border-border rounded-xl p-5 shadow-card space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Preferences</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Timezone
              </label>
              <input
                type="search"
                value={tzSearch}
                onChange={(e) => setTzSearch(e.target.value)}
                placeholder="Search timezones…"
                className="w-full border border-border rounded-t-md border-b-0 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <select
                value={timezone}
                onChange={(e) => { setTimezone(e.target.value); setTzSearch(""); }}
                size={filteredTimezones.length > 0 ? Math.min(filteredTimezones.length, 5) : 1}
                className="w-full border border-border rounded-b-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                {filteredTimezones.length === 0 ? (
                  <option disabled>No matches</option>
                ) : (
                  filteredTimezones.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Default calendar view
              </label>
              <select
                value={defaultView}
                onChange={(e) => setDefaultView(e.target.value as "week" | "month" | "day")}
                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="day">Day</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Week starts on
              </label>
              <select
                value={weekStart}
                onChange={(e) => setWeekStart(Number(e.target.value) as 0 | 1)}
                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value={1}>Monday</option>
                <option value={0}>Sunday</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Working hours
            </label>
            <div className="flex items-center gap-3">
              <select
                value={workStart}
                onChange={(e) => setWorkStart(Number(e.target.value))}
                className="border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{formatHour(i)}</option>
                ))}
              </select>
              <span className="text-sm text-gray-400">to</span>
              <select
                value={workEnd}
                onChange={(e) => setWorkEnd(Number(e.target.value))}
                className="border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{formatHour(i)}</option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">
              Used to shade your working hours in the calendar view.
            </p>
          </div>
        </section>

        <div className="flex items-center justify-end gap-3">
          {hasChanges && !isPending && (
            <p className="text-xs text-amber-600 font-medium">Unsaved changes</p>
          )}
          <button
            onClick={save}
            disabled={isPending || !hasChanges}
            className="bg-primary text-white text-sm font-medium px-5 py-2 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onDismiss={dismiss} />
      )}
    </>
  );
}

function formatHour(h: number): string {
  if (h === 0)  return "12:00 AM";
  if (h < 12)   return `${h}:00 AM`;
  if (h === 12) return "12:00 PM";
  return `${h - 12}:00 PM`;
}

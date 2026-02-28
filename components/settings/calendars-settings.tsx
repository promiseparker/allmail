"use client";

import { useState } from "react";
import { Search, Mail } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Badge } from "@/components/ui/badge";
import { Toast, useToast } from "@/components/ui/toast";

interface CalendarItem {
  id:        string;
  name:      string;
  color:     string;
  isEnabled: boolean;
}

interface AccountGroup {
  accountId:   string;
  provider:    string;
  email:       string;
  displayName: string;
  calendars:   CalendarItem[];
}

interface CalendarsSettingsProps {
  groups: AccountGroup[];
}

const PRESET_COLORS = [
  "#0055FF", "#7C3AED", "#DB2777", "#DC2626",
  "#D97706", "#059669", "#0891B2", "#6B7280",
];

export function CalendarsSettings({ groups }: CalendarsSettingsProps) {
  const { toast, show, dismiss } = useToast();
  const [localGroups, setLocalGroups] = useState(groups);
  const [saving,      setSaving]      = useState<string | null>(null);
  const [colorPicker, setColorPicker] = useState<string | null>(null);
  const [search,      setSearch]      = useState("");

  const query = search.trim().toLowerCase();

  const filteredGroups = localGroups
    .map((g) => ({
      ...g,
      calendars: query
        ? g.calendars.filter(
            (c) =>
              c.name.toLowerCase().includes(query) ||
              g.email.toLowerCase().includes(query) ||
              (g.displayName ?? "").toLowerCase().includes(query)
          )
        : g.calendars,
    }))
    .filter((g) => g.calendars.length > 0);

  const totalCalendars  = localGroups.reduce((s, g) => s + g.calendars.length, 0);
  const enabledCalendars = localGroups.reduce(
    (s, g) => s + g.calendars.filter((c) => c.isEnabled).length,
    0
  );

  async function updateCalendar(
    id: string,
    patch: { isEnabled?: boolean; color?: string }
  ) {
    setSaving(id);
    const res = await fetch(`/api/calendars/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(patch),
    });
    setSaving(null);

    if (res.ok) {
      setLocalGroups((prev) =>
        prev.map((g) => ({
          ...g,
          calendars: g.calendars.map((c) =>
            c.id === id ? { ...c, ...patch } : c
          ),
        }))
      );
      if (patch.color) {
        setColorPicker(null);
        show("Color updated", "success");
      }
    } else {
      show("Update failed — please try again", "error");
    }
  }

  if (totalCalendars === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl p-10 text-center ">
        <p className="text-sm text-gray-400">
          No calendars found. Connect an account first.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Search + summary */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search calendars…"
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <p className="text-xs text-gray-400 tabular-nums flex-shrink-0">
            {enabledCalendars} of {totalCalendars} enabled
          </p>
        </div>

        {/* No search results */}
        {filteredGroups.length === 0 && (
          <div className="bg-white border border-gray-100 rounded-xl p-8 text-center ">
            <p className="text-sm text-gray-400">No calendars match &ldquo;{search}&rdquo;</p>
            <button
              onClick={() => setSearch("")}
              className="text-xs text-gray-500 hover:underline mt-1"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Account groups */}
        {filteredGroups.map((group) => (
          <div key={group.accountId} className="bg-white border border-gray-100 rounded-xl  overflow-hidden">
            {/* Account header */}
            <div className="flex items-center gap-2.5 px-4 py-3 bg-gray-50 border-b border-gray-100">
              <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-700 truncate">
                  {group.displayName || group.email}
                </p>
                {group.displayName && (
                  <p className="text-[10px] text-gray-400 truncate">{group.email}</p>
                )}
              </div>
              <Badge
                variant={group.provider === "google" ? "google" : "microsoft"}
                className="text-[10px] flex-shrink-0"
              >
                {group.provider === "google" ? "Google" : "Outlook"}
              </Badge>
            </div>

            {/* Calendar rows */}
            <div className="divide-y divide-border">
              {group.calendars.map((cal) => (
                <div
                  key={cal.id}
                  className="flex items-center gap-4 px-4 py-3"
                >
                  {/* Color dot with picker */}
                  <div className="relative">
                    <button
                      onClick={() =>
                        setColorPicker(colorPicker === cal.id ? null : cal.id)
                      }
                      title="Change color"
                      className="w-7 h-7 rounded-full border-2 border-white ring-1 ring-border shadow-sm flex-shrink-0 hover:scale-110 transition-transform"
                      style={{ backgroundColor: cal.color }}
                    />
                    {colorPicker === cal.id && (
                      <div className="absolute z-20 top-9 left-0 bg-white border border-gray-100 rounded-xl p-3">
                        <p className="text-[11px] text-gray-500 mb-2 font-medium">
                          Pick a color
                        </p>
                        <div className="grid grid-cols-4 gap-1.5">
                          {PRESET_COLORS.map((c) => (
                            <button
                              key={c}
                              onClick={() => updateCalendar(cal.id, { color: c })}
                              className="w-6 h-6 rounded-full border-2 hover:scale-110 transition-transform"
                              style={{
                                backgroundColor: c,
                                borderColor: cal.color === c ? "#111827" : "transparent",
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Calendar name */}
                  <p className="flex-1 text-sm text-gray-800 truncate min-w-0">
                    {cal.name}
                  </p>

                  {/* Saving spinner + toggle */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {saving === cal.id && (
                      <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    )}
                    <Toggle
                      checked={cal.isEnabled}
                      onChange={(v) => updateCalendar(cal.id, { isEnabled: v })}
                      disabled={saving === cal.id}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <p className="text-[11px] text-gray-400 pt-1 pl-1">
          Disabled calendars are hidden from your views but continue syncing in
          the background.
        </p>
      </div>

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onDismiss={dismiss} />
      )}
    </>
  );
}

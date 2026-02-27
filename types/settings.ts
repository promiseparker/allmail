// Shape of the users.settings JSON column
export interface UserSettings {
  defaultView: "week" | "month" | "day";
  weekStartsOn: 0 | 1;       // 0 = Sunday, 1 = Monday
  workingHoursStart: number;  // 0–23
  workingHoursEnd: number;    // 0–23
  notifications: {
    conflictEmail: boolean;
    weeklyDigest: boolean;
    syncErrors: boolean;
    burnoutSignals: boolean;  // Pro only
  };
}

export const DEFAULT_SETTINGS: UserSettings = {
  defaultView: "week",
  weekStartsOn: 1,
  workingHoursStart: 9,
  workingHoursEnd: 18,
  notifications: {
    conflictEmail: true,
    weeklyDigest: true,
    syncErrors: true,
    burnoutSignals: false,
  },
};

export function mergeSettings(stored: unknown): UserSettings {
  if (!stored || typeof stored !== "object") return DEFAULT_SETTINGS;
  const s = stored as Partial<UserSettings>;
  return {
    defaultView: s.defaultView ?? DEFAULT_SETTINGS.defaultView,
    weekStartsOn: s.weekStartsOn ?? DEFAULT_SETTINGS.weekStartsOn,
    workingHoursStart: s.workingHoursStart ?? DEFAULT_SETTINGS.workingHoursStart,
    workingHoursEnd: s.workingHoursEnd ?? DEFAULT_SETTINGS.workingHoursEnd,
    notifications: {
      conflictEmail: s.notifications?.conflictEmail ?? DEFAULT_SETTINGS.notifications.conflictEmail,
      weeklyDigest: s.notifications?.weeklyDigest ?? DEFAULT_SETTINGS.notifications.weeklyDigest,
      syncErrors: s.notifications?.syncErrors ?? DEFAULT_SETTINGS.notifications.syncErrors,
      burnoutSignals: s.notifications?.burnoutSignals ?? DEFAULT_SETTINGS.notifications.burnoutSignals,
    },
  };
}

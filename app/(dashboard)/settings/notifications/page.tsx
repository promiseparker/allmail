import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { mergeSettings } from "@/types/settings";
import { NotificationsForm } from "@/components/settings/notifications-form";
import type { Plan } from "@/types/api";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Notification Settings" };
export const dynamic = "force-dynamic";

export default async function NotificationsSettingsPage() {
  const session = await requireAuth();

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, settings: true },
  });

  const settings = mergeSettings(user?.settings);

  return (
    <NotificationsForm
      initialConflictEmail={settings.notifications.conflictEmail}
      initialWeeklyDigest={settings.notifications.weeklyDigest}
      initialSyncErrors={settings.notifications.syncErrors}
      initialBurnoutSignals={settings.notifications.burnoutSignals}
      plan={(user?.plan ?? "free") as Plan}
    />
  );
}

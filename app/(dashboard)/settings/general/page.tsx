import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { mergeSettings } from "@/types/settings";
import { ProfileForm } from "@/components/settings/profile-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "General Settings" };
export const dynamic = "force-dynamic";

export default async function GeneralSettingsPage() {
  const session = await requireAuth();

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      name:      true,
      email:     true,
      avatarUrl: true,
      timezone:  true,
      settings:  true,
    },
  });

  const settings = mergeSettings(user?.settings);

  return (
    <ProfileForm
      initialName={user?.name ?? ""}
      email={user?.email ?? session.user.email ?? ""}
      avatarUrl={user?.avatarUrl ?? null}
      initialTimezone={user?.timezone ?? "UTC"}
      initialView={settings.defaultView}
      initialWeekStart={settings.weekStartsOn}
      initialWorkStart={settings.workingHoursStart}
      initialWorkEnd={settings.workingHoursEnd}
    />
  );
}

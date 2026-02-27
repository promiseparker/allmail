import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { CalendarsSettings } from "@/components/settings/calendars-settings";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Calendar Settings" };
export const dynamic = "force-dynamic";

export default async function CalendarsSettingsPage() {
  const session = await requireAuth();

  const accounts = await db.connectedAccount.findMany({
    where: { userId: session.user.id, isActive: true },
    select: {
      id:          true,
      provider:    true,
      email:       true,
      displayName: true,
      calendars: {
        select: {
          id:        true,
          name:      true,
          color:     true,
          isEnabled: true,
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const groups = accounts.map((a) => ({
    accountId:   a.id,
    provider:    a.provider,
    email:       a.email ?? "",
    displayName: a.displayName ?? "",
    calendars:   a.calendars.map((c) => ({
      id:        c.id,
      name:      c.name,
      color:     c.color ?? "#6B7280",
      isEnabled: c.isEnabled,
    })),
  }));

  return <CalendarsSettings groups={groups} />;
}

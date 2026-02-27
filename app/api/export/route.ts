import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

// GET /api/export — download a full JSON export of the user's data
export async function GET() {
  const session = await requireAuth();
  const userId = session.user.id;

  const [user, accounts, calendars, events] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        id:           true,
        name:         true,
        email:        true,
        timezone:     true,
        plan:         true,
        settings:     true,
        createdAt:    true,
      },
    }),
    db.connectedAccount.findMany({
      where: { userId },
      select: {
        id:          true,
        provider:    true,
        email:       true,
        scopes:      true,
        syncStatus:  true,
        isActive:    true,
        createdAt:   true,
      },
    }),
    db.calendar.findMany({
      where: { connectedAccount: { userId } },
      select: {
        id:        true,
        name:      true,
        color:     true,
        isEnabled: true,
        createdAt: true,
      },
    }),
    db.event.findMany({
      where: { userId, deletedAt: null },
      select: {
        id:            true,
        title:         true,
        description:   true,
        location:      true,
        startsAt:      true,
        endsAt:        true,
        isAllDay:      true,
        isRecurring:   true,
        status:        true,
        visibility:    true,
        attendeeCount: true,
        calendarId:    true,
        createdAt:     true,
        updatedAt:     true,
      },
      orderBy: { startsAt: "desc" },
    }),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    version: "1.0",
    user,
    connectedAccounts: accounts,
    calendars,
    events,
  };

  const filename = `syncone-export-${format(new Date(), "yyyy-MM-dd")}.json`;

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      "Content-Type":        "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// DELETE /api/account — permanently delete the account and all associated data
export async function DELETE() {
  const session = await requireAuth();
  const userId = session.user.id;

  // Delete in dependency order so foreign-key constraints are respected.
  await db.$transaction([
    // Events (directly own userId)
    db.event.deleteMany({ where: { userId } }),
    // Conflict flags (directly own userId)
    db.conflictFlag.deleteMany({ where: { userId } }),
    // Sync logs → through connectedAccount
    db.syncLog.deleteMany({ where: { connectedAccount: { userId } } }),
    // Webhook subscriptions → through calendar → through connectedAccount
    db.webhookSubscription.deleteMany({
      where: { calendar: { connectedAccount: { userId } } },
    }),
    // Calendars → through connectedAccount
    db.calendar.deleteMany({ where: { connectedAccount: { userId } } }),
    // OAuth tokens → through connectedAccount
    db.oAuthToken.deleteMany({ where: { connectedAccount: { userId } } }),
    // Connected accounts
    db.connectedAccount.deleteMany({ where: { userId } }),
    // NextAuth sessions and accounts (cascade from User, but explicit for safety)
    db.session.deleteMany({ where: { userId } }),
    db.account.deleteMany({ where: { userId } }),
    // The user itself
    db.user.delete({ where: { id: userId } }),
  ]);

  return NextResponse.json({ data: { success: true } });
}

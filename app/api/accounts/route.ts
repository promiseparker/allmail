import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { PLAN_LIMITS } from "@/types/api";
import type { Plan } from "@/types/api";

// GET /api/accounts — list connected accounts
export async function GET() {
  const session = await requireAuth();

  const accounts = await db.connectedAccount.findMany({
    where: { userId: session.user.id, isActive: true },
    include: {
      calendars: {
        select: { id: true, name: true, color: true, isEnabled: true, isPrimary: true },
        orderBy: { isPrimary: "desc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ data: accounts });
}

// DELETE /api/accounts/:id — disconnect account
export async function DELETE(req: Request) {
  const session = await requireAuth();
  const { accountId } = await req.json() as { accountId: string };

  const account = await db.connectedAccount.findFirst({
    where: { id: accountId, userId: session.user.id },
  });

  if (!account) {
    return NextResponse.json({ error: { code: "not_found", message: "Account not found" } }, { status: 404 });
  }

  // Soft delete — mark inactive + delete tokens
  await db.$transaction([
    db.connectedAccount.update({
      where: { id: accountId },
      data: { isActive: false },
    }),
    db.oAuthToken.deleteMany({ where: { connectedAccountId: accountId } }),
  ]);

  return NextResponse.json({ data: { success: true } });
}

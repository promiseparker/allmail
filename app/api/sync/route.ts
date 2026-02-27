import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { enqueueFullSync } from "@/lib/queue/jobs";
import { z } from "zod";

const syncSchema = z.object({
  connectedAccountId: z.string(),
});

// POST /api/sync — trigger manual sync
export async function POST(req: NextRequest) {
  const session = await requireAuth();
  const body = syncSchema.safeParse(await req.json());

  if (!body.success) {
    return NextResponse.json(
      { error: { code: "validation_error", message: "connectedAccountId required" } },
      { status: 400 }
    );
  }

  const { connectedAccountId } = body.data;

  // Verify ownership
  const account = await db.connectedAccount.findFirst({
    where: { id: connectedAccountId, userId: session.user.id, isActive: true },
  });

  if (!account) {
    return NextResponse.json({ error: { code: "not_found" } }, { status: 404 });
  }

  // Check if already syncing
  if (account.syncStatus === "syncing") {
    return NextResponse.json(
      { error: { code: "sync_in_progress", message: "Sync already in progress" } },
      { status: 409 }
    );
  }

  await enqueueFullSync(connectedAccountId);

  return NextResponse.json({ data: { queued: true } });
}

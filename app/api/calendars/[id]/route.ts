import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { z } from "zod";

const patchSchema = z.object({
  isEnabled: z.boolean().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

// PATCH /api/calendars/[id] — toggle visibility or update color
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAuth();
  const body = patchSchema.safeParse(await req.json());

  if (!body.success) {
    return NextResponse.json(
      { error: { code: "validation_error", message: body.error.message } },
      { status: 400 }
    );
  }

  // Verify the calendar belongs to this user
  const calendar = await db.calendar.findFirst({
    where: {
      id: params.id,
      connectedAccount: { userId: session.user.id },
    },
  });

  if (!calendar) {
    return NextResponse.json({ error: { code: "not_found" } }, { status: 404 });
  }

  await db.calendar.update({
    where: { id: params.id },
    data: {
      ...(body.data.isEnabled !== undefined && { isEnabled: body.data.isEnabled }),
      ...(body.data.color !== undefined && { color: body.data.color }),
    },
  });

  return NextResponse.json({ data: { success: true } });
}

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { mergeSettings } from "@/types/settings";
import { z } from "zod";

// GET /api/settings — fetch current user settings
export async function GET() {
  const session = await requireAuth();

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, timezone: true, plan: true, settings: true, avatarUrl: true },
  });

  if (!user) return NextResponse.json({ error: { code: "not_found" } }, { status: 404 });

  return NextResponse.json({
    data: {
      name: user.name,
      email: user.email,
      timezone: user.timezone,
      plan: user.plan,
      avatarUrl: user.avatarUrl,
      settings: mergeSettings(user.settings),
    },
  });
}

// PATCH /api/settings — update a section of user settings
const patchSchema = z.discriminatedUnion("section", [
  z.object({
    section: z.literal("profile"),
    data: z.object({
      name: z.string().min(1).max(100).optional(),
      timezone: z.string().min(1).max(60).optional(),
    }),
  }),
  z.object({
    section: z.literal("preferences"),
    data: z.object({
      defaultView: z.enum(["week", "month", "day"]).optional(),
      weekStartsOn: z.union([z.literal(0), z.literal(1)]).optional(),
      workingHoursStart: z.number().min(0).max(23).optional(),
      workingHoursEnd: z.number().min(0).max(23).optional(),
    }),
  }),
  z.object({
    section: z.literal("notifications"),
    data: z.object({
      conflictEmail: z.boolean().optional(),
      weeklyDigest: z.boolean().optional(),
      syncErrors: z.boolean().optional(),
      burnoutSignals: z.boolean().optional(),
    }),
  }),
]);

export async function PATCH(req: NextRequest) {
  const session = await requireAuth();
  const body = patchSchema.safeParse(await req.json());

  if (!body.success) {
    return NextResponse.json(
      { error: { code: "validation_error", message: body.error.message } },
      { status: 400 }
    );
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { settings: true, plan: true },
  });
  if (!user) return NextResponse.json({ error: { code: "not_found" } }, { status: 404 });

  const current = mergeSettings(user.settings);

  if (body.data.section === "profile") {
    const { name, timezone } = body.data.data;
    await db.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(timezone !== undefined && { timezone }),
      },
    });
  } else if (body.data.section === "preferences") {
    const prefs = body.data.data;
    await db.user.update({
      where: { id: session.user.id },
      data: {
        settings: {
          ...current,
          ...prefs,
        },
      },
    });
  } else if (body.data.section === "notifications") {
    const notifs = body.data.data;
    // Burnout signals only toggleable on Pro+
    if (notifs.burnoutSignals !== undefined && user.plan === "free") {
      return NextResponse.json(
        { error: { code: "plan_required", message: "Burnout signals require Pro" } },
        { status: 403 }
      );
    }
    await db.user.update({
      where: { id: session.user.id },
      data: {
        settings: {
          ...current,
          notifications: { ...current.notifications, ...notifs },
        },
      },
    });
  }

  return NextResponse.json({ data: { success: true } });
}

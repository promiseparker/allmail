import { NextRequest, NextResponse } from "next/server";
import { handleGoogleWebhook } from "@/lib/sync/webhooks";

export const runtime = "nodejs";

// POST /api/webhooks/google — receive Google Calendar push notifications
export async function POST(req: NextRequest) {
  const channelId = req.headers.get("x-goog-channel-id");
  const resourceState = req.headers.get("x-goog-resource-state");

  if (!channelId || !resourceState) {
    return new NextResponse(null, { status: 400 });
  }

  // Respond immediately — Google requires <10s response
  void handleGoogleWebhook(channelId, resourceState).catch(console.error);

  return new NextResponse(null, { status: 200 });
}

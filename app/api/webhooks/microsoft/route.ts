import { NextRequest, NextResponse } from "next/server";
import { handleMicrosoftWebhook } from "@/lib/sync/webhooks";

export const runtime = "nodejs";

// POST /api/webhooks/microsoft — receive Microsoft Graph change notifications
export async function POST(req: NextRequest) {
  // Microsoft sends a validationToken query param for subscription validation
  const validationToken = req.nextUrl.searchParams.get("validationToken");
  if (validationToken) {
    return new NextResponse(validationToken, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  const body = await req.json() as {
    value?: Array<{ subscriptionId: string; changeType: string }>;
  };

  if (!body.value?.length) {
    return new NextResponse(null, { status: 202 });
  }

  // Respond immediately — process async
  void Promise.allSettled(
    body.value.map((n) =>
      handleMicrosoftWebhook(n.subscriptionId).catch(console.error)
    )
  );

  return new NextResponse(null, { status: 202 });
}

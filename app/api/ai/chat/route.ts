import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { suggestFreeSlots } from "@/lib/conflicts/detector";
import { GoogleCalendarClient } from "@/lib/providers/google/client";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TOOLS: Anthropic.Tool[] = [
  {
    name: "get_events",
    description:
      "Fetch the user's calendar events for a specific date range. Use this when asked about schedule, meetings, or events.",
    input_schema: {
      type: "object" as const,
      properties: {
        start_date: {
          type: "string",
          description: "Start of range in ISO 8601 format (e.g. 2024-03-15T00:00:00Z)",
        },
        end_date: {
          type: "string",
          description: "End of range in ISO 8601 format",
        },
      },
      required: ["start_date", "end_date"],
    },
  },
  {
    name: "find_free_slots",
    description:
      "Find available time slots in the user's calendar for scheduling a meeting. Returns up to 5 best options ranked by preference.",
    input_schema: {
      type: "object" as const,
      properties: {
        duration_minutes: {
          type: "number",
          description: "Duration of the meeting in minutes (e.g. 30, 60, 90)",
        },
        start_date: {
          type: "string",
          description: "Start of the search window in ISO 8601 format",
        },
        end_date: {
          type: "string",
          description: "End of the search window in ISO 8601 format",
        },
      },
      required: ["duration_minutes", "start_date", "end_date"],
    },
  },
  {
    name: "create_event",
    description:
      "Create a new calendar event on the user's primary Google Calendar. Always confirm details with the user before calling this.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Event title/summary" },
        start_time: { type: "string", description: "Start time in ISO 8601 format with timezone offset" },
        end_time: { type: "string", description: "End time in ISO 8601 format with timezone offset" },
        description: { type: "string", description: "Optional event description or agenda" },
        location: { type: "string", description: "Optional location or video call link" },
      },
      required: ["title", "start_time", "end_time"],
    },
  },
  {
    name: "get_schedule_summary",
    description:
      "Get an overview of the user's upcoming schedule: event count, total meeting hours, average meetings per day, and active conflicts.",
    input_schema: {
      type: "object" as const,
      properties: {
        days: {
          type: "number",
          description: "Number of days ahead to summarise (default 7)",
        },
      },
    },
  },
];

async function executeTool(
  name: string,
  input: Record<string, unknown>,
  userId: string
): Promise<unknown> {
  switch (name) {
    case "get_events": {
      const events = await db.event.findMany({
        where: {
          userId,
          deletedAt: null,
          status: { not: "cancelled" },
          startsAt: { gte: new Date(input.start_date as string) },
          endsAt: { lte: new Date(input.end_date as string) },
        },
        select: {
          id: true,
          title: true,
          startsAt: true,
          endsAt: true,
          isAllDay: true,
          location: true,
          description: true,
          status: true,
          calendar: { select: { name: true, color: true } },
        },
        orderBy: { startsAt: "asc" },
        take: 50,
      });
      return { events, count: events.length };
    }

    case "find_free_slots": {
      const { duration_minutes, start_date, end_date } = input as {
        duration_minutes: number;
        start_date: string;
        end_date: string;
      };

      const busyEvents = await db.event.findMany({
        where: {
          userId,
          deletedAt: null,
          status: { not: "cancelled" },
          isAllDay: false,
          startsAt: { gte: new Date(start_date) },
          endsAt: { lte: new Date(end_date) },
        },
        select: { startsAt: true, endsAt: true },
      });

      const user = await db.user.findUnique({
        where: { id: userId },
        select: { settings: true, timezone: true },
      });

      const settings = (user?.settings as Record<string, unknown> | null) ?? {};
      const slots = suggestFreeSlots(busyEvents, {
        durationMinutes: duration_minutes,
        windowStart: new Date(start_date),
        windowEnd: new Date(end_date),
        workingHoursStart: (settings.workingHoursStart as number) ?? 9,
        workingHoursEnd: (settings.workingHoursEnd as number) ?? 18,
        userTimezone: user?.timezone ?? "UTC",
      });

      return { slots, count: slots.length };
    }

    case "create_event": {
      const { title, start_time, end_time, description, location } = input as {
        title: string;
        start_time: string;
        end_time: string;
        description?: string;
        location?: string;
      };

      const primaryAccount = await db.connectedAccount.findFirst({
        where: { userId, provider: "google" },
        select: { id: true },
      });

      if (!primaryAccount) {
        return {
          error: "No Google Calendar connected. Please connect a Google account first.",
        };
      }

      const primaryCalendar = await db.calendar.findFirst({
        where: { connectedAccountId: primaryAccount.id, isPrimary: true, isEnabled: true },
        select: { providerCalendarId: true },
      });

      if (!primaryCalendar) {
        return { error: "No primary calendar found on your Google account." };
      }

      try {
        const client = new GoogleCalendarClient(primaryAccount.id, userId);
        const event = await client.createEvent(primaryCalendar.providerCalendarId, {
          title,
          startTime: start_time,
          endTime: end_time,
          description,
          location,
        });

        return {
          success: true,
          eventId: event.id,
          htmlLink: event.htmlLink,
          title,
          start_time,
          end_time,
        };
      } catch (err) {
        return {
          error: err instanceof Error ? err.message : "Failed to create event",
        };
      }
    }

    case "get_schedule_summary": {
      const days = (input.days as number) ?? 7;
      const windowEnd = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

      const [events, conflictCount] = await Promise.all([
        db.event.findMany({
          where: {
            userId,
            deletedAt: null,
            status: { not: "cancelled" },
            isAllDay: false,
            startsAt: { gte: new Date() },
            endsAt: { lte: windowEnd },
          },
          select: { startsAt: true, endsAt: true, title: true },
          orderBy: { startsAt: "asc" },
        }),
        db.conflictFlag.count({ where: { userId, status: "active" } }),
      ]);

      const totalMinutes = events.reduce(
        (sum, e) => sum + (e.endsAt.getTime() - e.startsAt.getTime()) / 60_000,
        0
      );

      return {
        eventCount: events.length,
        totalMeetingHours: Math.round((totalMinutes / 60) * 10) / 10,
        avgMeetingsPerDay: Math.round((events.length / days) * 10) / 10,
        conflictCount,
        nextEvents: events.slice(0, 5).map((e) => ({
          title: e.title,
          startsAt: e.startsAt.toISOString(),
          endsAt: e.endsAt.toISOString(),
        })),
      };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAuth();
  const userId = session.user.id;

  const body = await request.json() as {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    timezone?: string;
  };

  const { messages, timezone = "UTC" } = body;

  const now = new Date();
  const systemPrompt = `You are an AI scheduling assistant built into SyncOne, a unified calendar platform.

Current date/time: ${now.toISOString()} (user timezone: ${timezone})

Your capabilities:
- Fetch events for any date range
- Find free time slots for meetings
- Create calendar events on the user's primary Google Calendar
- Summarize their upcoming schedule and workload

Guidelines:
- Be concise and friendly. One short sentence is often enough.
- When asked about "today", use today's date range.
- When asked about "this week", use Mon–Sun of the current week.
- Before creating an event, always confirm the details once.
- Format times in a human-readable way relative to the user's timezone.
- Use bullet points for event lists. Keep summaries brief.
- If there are no events, say so clearly.`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Convert frontend messages to Anthropic format
      const conversation: Anthropic.MessageParam[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        let continueLoop = true;

        while (continueLoop) {
          const messageStream = anthropic.messages.stream({
            model: "claude-opus-4-6",
            max_tokens: 2048,
            system: systemPrompt,
            messages: conversation,
            tools: TOOLS,
          });

          let assistantText = "";
          const toolUseBlocks: Anthropic.ToolUseBlockParam[] = [];
          let currentToolId = "";
          let currentToolName = "";
          let currentToolInput = "";
          let stopReason: string | null = null;

          for await (const event of messageStream) {
            if (event.type === "content_block_start") {
              if (event.content_block.type === "tool_use") {
                currentToolId = event.content_block.id;
                currentToolName = event.content_block.name;
                currentToolInput = "";
                send({ type: "tool_call", name: currentToolName });
              }
            } else if (event.type === "content_block_delta") {
              if (event.delta.type === "text_delta") {
                assistantText += event.delta.text;
                send({ type: "text", delta: event.delta.text });
              } else if (event.delta.type === "input_json_delta") {
                currentToolInput += event.delta.partial_json;
              }
            } else if (event.type === "content_block_stop") {
              if (currentToolName) {
                try {
                  toolUseBlocks.push({
                    type: "tool_use",
                    id: currentToolId,
                    name: currentToolName,
                    input: JSON.parse(currentToolInput || "{}"),
                  });
                } catch {
                  // ignore malformed JSON
                }
                currentToolName = "";
                currentToolId = "";
                currentToolInput = "";
              }
            } else if (event.type === "message_delta") {
              stopReason = event.delta.stop_reason ?? null;
            }
          }

          // Build assistant message for conversation history
          const assistantContent: Array<Anthropic.TextBlockParam | Anthropic.ToolUseBlockParam> = [];
          if (assistantText) {
            assistantContent.push({ type: "text", text: assistantText });
          }
          assistantContent.push(...toolUseBlocks);
          conversation.push({ role: "assistant", content: assistantContent });

          if (stopReason === "tool_use" && toolUseBlocks.length > 0) {
            const toolResults: Anthropic.ToolResultBlockParam[] = [];

            for (const toolBlock of toolUseBlocks) {
              const result = await executeTool(
                toolBlock.name,
                (toolBlock.input ?? {}) as Record<string, unknown>,
                userId
              );

              send({ type: "tool_result", name: toolBlock.name, data: result });

              toolResults.push({
                type: "tool_result",
                tool_use_id: toolBlock.id,
                content: JSON.stringify(result),
              });
            }

            conversation.push({ role: "user", content: toolResults });
          } else {
            continueLoop = false;
          }
        }

        send({ type: "done" });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Something went wrong";
        send({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

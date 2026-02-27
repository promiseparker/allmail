import { db } from "@/lib/db";
import { GoogleCalendarClient } from "@/lib/providers/google/client";
import { MicrosoftCalendarClient } from "@/lib/providers/microsoft/client";
import { enqueueDeltaSync } from "@/lib/queue/jobs";
import { v4 as uuidv4 } from "uuid";

// ============================================================
// REGISTER WEBHOOKS FOR A CALENDAR
// ============================================================

export async function registerWebhook(calendarId: string): Promise<void> {
  const calendar = await db.calendar.findUnique({
    where: { id: calendarId },
    include: { connectedAccount: { include: { user: true } } },
  });

  if (!calendar) throw new Error("Calendar not found");

  const { connectedAccount } = calendar;
  const { user } = connectedAccount;

  if (connectedAccount.provider === "google") {
    const client = new GoogleCalendarClient(connectedAccount.id, user.id);
    const channelId = uuidv4();

    try {
      const { resourceId, expiration } = await client.registerWebhook(
        calendar.providerCalendarId,
        channelId
      );

      await db.webHookSubscription.create({
        data: {
          calendarId,
          provider: "google",
          channelId,
          resourceId,
          expiresAt: new Date(expiration),
        },
      });

      await db.calendar.update({
        where: { id: calendarId },
        data: {
          webhookChannelId: channelId,
          webhookExpiresAt: new Date(expiration),
        },
      });
    } catch (error) {
      // Webhook registration failure is non-fatal — fall back to polling
      console.error("Failed to register Google webhook:", error);
    }
  } else if (connectedAccount.provider === "microsoft") {
    const client = new MicrosoftCalendarClient(connectedAccount.id, user.id);

    try {
      const { subscriptionId, expiresAt } = await client.registerWebhook(
        calendar.providerCalendarId
      );

      await db.webHookSubscription.create({
        data: {
          calendarId,
          provider: "microsoft",
          channelId: subscriptionId,
          expiresAt,
        },
      });

      await db.calendar.update({
        where: { id: calendarId },
        data: {
          webhookChannelId: subscriptionId,
          webhookExpiresAt: expiresAt,
        },
      });
    } catch (error) {
      console.error("Failed to register Microsoft webhook:", error);
    }
  }
}

// ============================================================
// RENEW EXPIRING WEBHOOKS (run every 6 hours via cron)
// ============================================================

export async function renewExpiringWebhooks(): Promise<void> {
  // Find webhooks expiring in next 24 hours
  const expiringWebhooks = await db.webHookSubscription.findMany({
    where: {
      isActive: true,
      expiresAt: {
        lte: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    },
    include: {
      calendar: {
        include: {
          connectedAccount: { include: { user: true } },
        },
      },
    },
  });

  await Promise.allSettled(
    expiringWebhooks.map(async (webhook) => {
      const { calendar } = webhook;
      const { connectedAccount } = calendar;

      try {
        if (webhook.provider === "microsoft") {
          const client = new MicrosoftCalendarClient(
            connectedAccount.id,
            connectedAccount.user.id
          );
          const newExpiry = await client.renewWebhook(webhook.channelId);

          await db.webHookSubscription.update({
            where: { id: webhook.id },
            data: { expiresAt: newExpiry },
          });

          await db.calendar.update({
            where: { id: calendar.id },
            data: { webhookExpiresAt: newExpiry },
          });
        } else if (webhook.provider === "google") {
          // Google webhooks: stop old + create new
          const client = new GoogleCalendarClient(
            connectedAccount.id,
            connectedAccount.user.id
          );

          if (webhook.resourceId) {
            await client.stopWebhook(webhook.channelId, webhook.resourceId);
          }

          await db.webHookSubscription.update({
            where: { id: webhook.id },
            data: { isActive: false },
          });

          await registerWebhook(calendar.id);
        }
      } catch (error) {
        console.error(`Failed to renew webhook ${webhook.id}:`, error);
      }
    })
  );
}

// ============================================================
// HANDLE INCOMING GOOGLE WEBHOOK
// ============================================================

export async function handleGoogleWebhook(
  channelId: string,
  resourceState: string
): Promise<void> {
  if (resourceState === "sync") return; // Initial verification ping

  const subscription = await db.webHookSubscription.findUnique({
    where: { channelId },
    include: { calendar: { include: { connectedAccount: true } } },
  });

  if (!subscription) return;

  await enqueueDeltaSync(
    subscription.calendarId,
    subscription.calendar.connectedAccount.userId
  );
}

// ============================================================
// HANDLE INCOMING MICROSOFT WEBHOOK
// ============================================================

export async function handleMicrosoftWebhook(
  subscriptionId: string
): Promise<void> {
  const subscription = await db.webHookSubscription.findUnique({
    where: { channelId: subscriptionId },
    include: { calendar: { include: { connectedAccount: true } } },
  });

  if (!subscription) return;

  await enqueueDeltaSync(
    subscription.calendarId,
    subscription.calendar.connectedAccount.userId
  );
}

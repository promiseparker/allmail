import { Queue, Worker, Job } from "bullmq";
import { getIORedis } from "@/lib/redis";

// ============================================================
// JOB DEFINITIONS
// ============================================================

export type SyncJobData =
  | { type: "full_sync"; connectedAccountId: string }
  | { type: "delta_sync"; calendarId: string; userId: string }
  | { type: "setup_calendars"; connectedAccountId: string; userId: string }
  | { type: "renew_webhooks" };

export type NotificationJobData = {
  type: "conflict_alert";
  userId: string;
  conflictCount: number;
};

// ============================================================
// QUEUES
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let syncQueue: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let notificationQueue: any = null;

export function getSyncQueue(): Queue<SyncJobData> {
  if (!syncQueue) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    syncQueue = new (Queue as any)<SyncJobData>("sync-jobs", {
      connection: getIORedis(),
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 500,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
      },
    });
  }
  return syncQueue;
}

export function getNotificationQueue(): Queue<NotificationJobData> {
  if (!notificationQueue) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    notificationQueue = new (Queue as any)<NotificationJobData>("notifications", {
      connection: getIORedis(),
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 100,
        attempts: 2,
      },
    });
  }
  return notificationQueue;
}

// ============================================================
// JOB ENQUEUE HELPERS
// ============================================================

export async function enqueueFullSync(
  connectedAccountId: string,
  delayMs = 0
): Promise<void> {
  await getSyncQueue().add(
    "full-sync",
    { type: "full_sync", connectedAccountId },
    {
      delay: delayMs,
      jobId: `full-sync:${connectedAccountId}`, // Dedup: only one full sync per account
    }
  );
}

export async function enqueueDeltaSync(
  calendarId: string,
  userId: string
): Promise<void> {
  await getSyncQueue().add(
    "delta-sync",
    { type: "delta_sync", calendarId, userId },
    {
      jobId: `delta:${calendarId}`, // Dedup
    }
  );
}

export async function enqueueSetupCalendars(
  connectedAccountId: string,
  userId: string
): Promise<void> {
  await getSyncQueue().add(
    "setup-calendars",
    { type: "setup_calendars", connectedAccountId, userId }
  );
}

// ============================================================
// WORKER (run in a separate process / edge function)
// ============================================================

export function createSyncWorker() {
  return new Worker<SyncJobData>(
    "sync-jobs",
    async (job: Job<SyncJobData>) => {
      // Dynamic imports to avoid loading heavy libs in edge runtime
      const { data } = job;

      switch (data.type) {
        case "full_sync": {
          const { fullSync } = await import("@/lib/sync/engine");
          await fullSync(data.connectedAccountId);
          break;
        }

        case "delta_sync": {
          const { deltaSync } = await import("@/lib/sync/engine");
          await deltaSync(data.calendarId, data.userId);
          break;
        }

        case "setup_calendars": {
          const { setupCalendars, fullSync } = await import("@/lib/sync/engine");
          await setupCalendars(data.connectedAccountId, data.userId);
          // Kick off full sync after calendar discovery
          await fullSync(data.connectedAccountId);
          break;
        }

        case "renew_webhooks": {
          const { renewExpiringWebhooks } = await import("@/lib/sync/webhooks");
          await renewExpiringWebhooks();
          break;
        }
      }
    },
    {
      connection: getIORedis(),
      concurrency: 10,
    }
  );
}

import { Queue, Worker, Job } from "bullmq";
import { getIORedis } from "@/lib/redis";

// Check if Redis is configured for BullMQ
const hasRedis =
  process.env.REDIS_URL &&
  !process.env.REDIS_URL.includes("localhost") &&
  process.env.REDIS_URL !== "redis://localhost:6379";

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

let syncQueue: Queue<SyncJobData> | null = null;
let notificationQueue: Queue<NotificationJobData> | null = null;

export function getSyncQueue(): Queue<SyncJobData> {
  if (!syncQueue) {
    syncQueue = new Queue<SyncJobData>("sync-jobs", {
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
    notificationQueue = new Queue<NotificationJobData>("notifications", {
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
  if (!hasRedis) {
    const { fullSync } = await import("@/lib/sync/engine");
    await fullSync(connectedAccountId);
    return;
  }
  await getSyncQueue().add(
    "full-sync",
    { type: "full_sync", connectedAccountId },
    { delay: delayMs, jobId: `full-sync:${connectedAccountId}` }
  );
}

export async function enqueueDeltaSync(
  calendarId: string,
  userId: string
): Promise<void> {
  if (!hasRedis) {
    const { deltaSync } = await import("@/lib/sync/engine");
    await deltaSync(calendarId, userId);
    return;
  }
  await getSyncQueue().add(
    "delta-sync",
    { type: "delta_sync", calendarId, userId },
    { jobId: `delta:${calendarId}` }
  );
}

export async function enqueueSetupCalendars(
  connectedAccountId: string,
  userId: string
): Promise<void> {
  if (!hasRedis) {
    const { setupCalendars, fullSync } = await import("@/lib/sync/engine");
    await setupCalendars(connectedAccountId, userId);
    await fullSync(connectedAccountId);
    return;
  }
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

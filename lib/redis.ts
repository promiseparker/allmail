import { Redis } from "@upstash/redis";
import IORedis from "ioredis";

// Upstash Redis for serverless (Vercel)
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// IORedis for BullMQ (needs full TCP connection)
const globalForIORedis = globalThis as unknown as {
  ioredis: IORedis | undefined;
};

export const getIORedis = (): IORedis => {
  if (!globalForIORedis.ioredis) {
    globalForIORedis.ioredis = new IORedis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,
    });
  }
  return globalForIORedis.ioredis;
};

// Cache helpers
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    return redis.get<T>(key);
  },

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await redis.set(key, value, { ex: ttlSeconds });
    } else {
      await redis.set(key, value);
    }
  },

  async del(key: string): Promise<void> {
    await redis.del(key);
  },

  async delPattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  },

  // Distributed lock (simple implementation)
  async acquireLock(key: string, ttlMs: number): Promise<boolean> {
    const lockKey = `lock:${key}`;
    const result = await redis.set(lockKey, "1", {
      nx: true,
      px: ttlMs,
    });
    return result === "OK";
  },

  async releaseLock(key: string): Promise<void> {
    await redis.del(`lock:${key}`);
  },
};

// Cache TTLs in seconds
export const CACHE_TTL = {
  EVENT_LIST: 15 * 60,       // 15 minutes
  TODAY_AGENDA: 5 * 60,      // 5 minutes
  CONFLICTS: 2 * 60,         // 2 minutes
  ANALYTICS: 60 * 60,        // 1 hour
  ACCOUNT_LIST: 5 * 60,      // 5 minutes
  OAUTH_STATE: 10 * 60,      // 10 minutes (CSRF state)
} as const;

// Cache key builders
export const cacheKey = {
  events: (userId: string, start: string, end: string) =>
    `events:${userId}:${start}:${end}`,
  todayAgenda: (userId: string) =>
    `agenda:${userId}:${new Date().toISOString().split("T")[0]}`,
  conflicts: (userId: string) => `conflicts:${userId}`,
  analytics: (userId: string, period: string) =>
    `analytics:${userId}:${period}`,
  accounts: (userId: string) => `accounts:${userId}`,
  oauthState: (state: string) => `oauth:state:${state}`,
};

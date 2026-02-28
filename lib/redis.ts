import { Redis } from "@upstash/redis";
import IORedis from "ioredis";

// ── Upstash client (only if credentials are configured) ──────────────────────
const hasUpstash =
  process.env.UPSTASH_REDIS_REST_URL &&
  !process.env.UPSTASH_REDIS_REST_URL.includes("your-upstash") &&
  process.env.UPSTASH_REDIS_REST_TOKEN &&
  !process.env.UPSTASH_REDIS_REST_TOKEN.includes("your-upstash");

export const redis = hasUpstash
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// ── In-memory fallback (dev without Upstash) ─────────────────────────────────
const memStore = new Map<string, { value: unknown; expiresAt: number | null }>();

const mem = {
  get<T>(key: string): T | null {
    const entry = memStore.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      memStore.delete(key);
      return null;
    }
    return entry.value as T;
  },
  set(key: string, value: unknown, ttlSeconds?: number): void {
    memStore.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    });
  },
  del(key: string): void {
    memStore.delete(key);
  },
  keys(pattern: string): string[] {
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    return Array.from(memStore.keys()).filter((k) => regex.test(k));
  },
};

// ── IORedis for BullMQ (needs full TCP connection) ────────────────────────────
const globalForIORedis = globalThis as unknown as {
  ioredis: IORedis | undefined;
};

export const getIORedis = (): IORedis => {
  if (!globalForIORedis.ioredis) {
    globalForIORedis.ioredis = new IORedis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }
  return globalForIORedis.ioredis;
};

// ── Cache helpers (use Upstash if available, otherwise in-memory) ─────────────
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    if (redis) return redis.get<T>(key);
    return mem.get<T>(key);
  },

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    if (redis) {
      if (ttlSeconds) {
        await redis.set(key, value, { ex: ttlSeconds });
      } else {
        await redis.set(key, value);
      }
    } else {
      mem.set(key, value, ttlSeconds);
    }
  },

  async del(key: string): Promise<void> {
    if (redis) {
      await redis.del(key);
    } else {
      mem.del(key);
    }
  },

  async delPattern(pattern: string): Promise<void> {
    if (redis) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) await redis.del(...keys);
    } else {
      mem.keys(pattern).forEach((k) => mem.del(k));
    }
  },

  async acquireLock(key: string, ttlMs: number): Promise<boolean> {
    const lockKey = `lock:${key}`;
    if (redis) {
      const result = await redis.set(lockKey, "1", { nx: true, px: ttlMs });
      return result === "OK";
    }
    if (mem.get(lockKey)) return false;
    mem.set(lockKey, "1", ttlMs / 1000);
    return true;
  },

  async releaseLock(key: string): Promise<void> {
    if (redis) {
      await redis.del(`lock:${key}`);
    } else {
      mem.del(`lock:${key}`);
    }
  },
};

// ── Cache TTLs in seconds ─────────────────────────────────────────────────────
export const CACHE_TTL = {
  EVENT_LIST:    15 * 60,
  TODAY_AGENDA:   5 * 60,
  CONFLICTS:      2 * 60,
  ANALYTICS:     60 * 60,
  ACCOUNT_LIST:   5 * 60,
  OAUTH_STATE:   10 * 60,
} as const;

// ── Cache key builders ────────────────────────────────────────────────────────
export const cacheKey = {
  events:       (userId: string, start: string, end: string) => `events:${userId}:${start}:${end}`,
  todayAgenda:  (userId: string) => `agenda:${userId}:${new Date().toISOString().split("T")[0]}`,
  conflicts:    (userId: string) => `conflicts:${userId}`,
  analytics:    (userId: string, period: string) => `analytics:${userId}:${period}`,
  accounts:     (userId: string) => `accounts:${userId}`,
  oauthState:   (state: string) => `oauth:state:${state}`,
};

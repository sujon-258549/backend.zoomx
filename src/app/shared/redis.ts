import Redis from "ioredis";
import config from "../config";

const redis = new Redis(config.redis_url, {
  retryStrategy: (times: number) => Math.min(times * 100, 3000),
  maxRetriesPerRequest: 3,
  connectionName: "zoomit-backend",
});

// Suppress noisy retry logs until the first successful connection — the local
// Redis service takes a moment to accept connections on startup, which shows
// up as harmless errors during that window.
let redisReady = false;
redis.on("connect", () => {
  if (!redisReady) console.log("🔴 Redis connecting...");
});
redis.on("ready", () => {
  redisReady = true;
  console.log("✅ Redis connected and ready");
});
redis.on("error", (err) => {
  if (redisReady) console.error("❌ Redis error:", err.message);
});
redis.on("close", () => {
  if (redisReady) console.warn("⚠️  Redis connection closed");
});

export const setJson = async <T>(
  key: string,
  value: T,
  ttlSeconds?: number
): Promise<void> => {
  try {
    const stringified = JSON.stringify(value);
    if (ttlSeconds) {
      await redis.set(key, stringified, "EX", ttlSeconds);
    } else {
      await redis.set(key, stringified);
    }
  } catch (err) {
    console.error(`Redis setJson failed for ${key}:`, err);
  }
};

export const getJson = async <T>(key: string): Promise<T | null> => {
  try {
    const value = await redis.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch (err) {
    console.error(`Redis getJson failed for ${key}:`, err);
    return null;
  }
};

export const delKey = async (...keys: string[]): Promise<void> => {
  try {
    if (keys.length === 0) return;
    await redis.del(...keys);
  } catch (err) {
    console.error(`Redis del failed:`, err);
  }
};

// SCAN-based safe pattern delete — never use KEYS in production
export const delByPattern = async (pattern: string): Promise<number> => {
  try {
    let cursor = "0";
    let deleted = 0;
    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        100
      );
      cursor = nextCursor;
      if (keys.length > 0) {
        deleted += await redis.del(...keys);
      }
    } while (cursor !== "0");
    return deleted;
  } catch (err) {
    console.error(`Redis delByPattern failed for ${pattern}:`, err);
    return 0;
  }
};

interface CacheOptions {
  key: string;
  ttl?: number;
}

export const withCache = async <T>(
  { key, ttl = 300 }: CacheOptions,
  fetcher: () => Promise<T>
): Promise<T> => {
  const cached = await getJson<T>(key);
  if (cached !== null) return cached;

  const data = await fetcher();
  if (data !== null && data !== undefined) {
    await setJson(key, data, ttl);
  }
  return data;
};

export default redis;

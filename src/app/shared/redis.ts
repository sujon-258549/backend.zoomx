// In-memory replacement for the previous ioredis-backed cache/store.
//
// Redis has been removed from the backend — this module keeps the exact same
// export surface (setJson / getJson / delKey / delByPattern / withCache and a
// default `redis` handle) so every existing call site keeps working, but all
// state now lives in-process. No network, no connection, no external service.
//
// Note: state is per-process, so on a multi-instance deployment each instance
// has its own cache / counters. That's fine for caching (worst case a cache
// miss) and acceptable for the coarse abuse counters that use it.

type Entry = { value: string; expireAt?: number };

const store = new Map<string, Entry>();

const now = () => Date.now();

const readEntry = (key: string): Entry | undefined => {
  const e = store.get(key);
  if (e && e.expireAt !== undefined && e.expireAt <= now()) {
    store.delete(key);
    return undefined;
  }
  return e;
};

const globToRegExp = (pattern: string): RegExp => {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  const regex = escaped.replace(/\*/g, ".*").replace(/\?/g, ".");
  return new RegExp(`^${regex}$`);
};

// Minimal ioredis-compatible surface used by the rate limiters and cache
// helpers. Only the commands actually called across the codebase are provided.
const redis = {
  async get(key: string): Promise<string | null> {
    const e = readEntry(key);
    return e ? e.value : null;
  },
  async set(key: string, value: string, ...args: unknown[]): Promise<"OK"> {
    let expireAt: number | undefined;
    const exIndex = args.findIndex(
      (a) => String(a).toUpperCase() === "EX"
    );
    if (exIndex >= 0) {
      const seconds = Number(args[exIndex + 1]);
      if (seconds) expireAt = now() + seconds * 1000;
    }
    store.set(key, { value: String(value), expireAt });
    return "OK";
  },
  async incr(key: string): Promise<number> {
    const e = readEntry(key);
    const next = (e ? Number(e.value) || 0 : 0) + 1;
    store.set(key, { value: String(next), expireAt: e?.expireAt });
    return next;
  },
  async expire(key: string, seconds: number): Promise<number> {
    const e = readEntry(key);
    if (!e) return 0;
    e.expireAt = now() + Number(seconds) * 1000;
    store.set(key, e);
    return 1;
  },
  async ttl(key: string): Promise<number> {
    const e = readEntry(key);
    if (!e) return -2;
    if (e.expireAt === undefined) return -1;
    return Math.max(0, Math.ceil((e.expireAt - now()) / 1000));
  },
  async del(...keys: string[]): Promise<number> {
    let count = 0;
    for (const k of keys) if (store.delete(k)) count++;
    return count;
  },
  async keys(pattern: string): Promise<string[]> {
    const re = globToRegExp(pattern);
    const out: string[] = [];
    for (const key of store.keys()) {
      if (readEntry(key) && re.test(key)) out.push(key);
    }
    return out;
  },
  // Some callers use the generic `call`; nothing relies on its result.
  async call(): Promise<null> {
    return null;
  },
  async quit(): Promise<"OK"> {
    store.clear();
    return "OK";
  },
  // ioredis emits lifecycle events; keep a no-op so `.on(...)` calls are safe.
  on(): void {
    /* no-op */
  },
};

export const setJson = async <T>(
  key: string,
  value: T,
  ttlSeconds?: number
): Promise<void> => {
  try {
    const stringified = JSON.stringify(value);
    store.set(key, {
      value: stringified,
      expireAt: ttlSeconds ? now() + ttlSeconds * 1000 : undefined,
    });
  } catch (err) {
    console.error(`setJson failed for ${key}:`, err);
  }
};

export const getJson = async <T>(key: string): Promise<T | null> => {
  try {
    const e = readEntry(key);
    if (!e) return null;
    return JSON.parse(e.value) as T;
  } catch (err) {
    console.error(`getJson failed for ${key}:`, err);
    return null;
  }
};

export const delKey = async (...keys: string[]): Promise<void> => {
  for (const k of keys) store.delete(k);
};

export const delByPattern = async (pattern: string): Promise<number> => {
  const re = globToRegExp(pattern);
  let deleted = 0;
  for (const key of Array.from(store.keys())) {
    if (re.test(key)) {
      store.delete(key);
      deleted++;
    }
  }
  return deleted;
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

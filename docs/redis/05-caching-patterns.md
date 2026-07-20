# 5. Caching Patterns

এই doc এ বিভিন্ন caching pattern এবং আমাদের project এ সেগুলো implement করার real example দেওয়া আছে।

---

## 🎯 Cache-Aside Pattern (সবচেয়ে common)

এটাই আমাদের project এ প্রধান pattern হবে। Application নিজেই cache manage করে।

### Flow:

```
1. Request আসলো
2. Redis check করলাম
3. Hit হলে → return
4. Miss হলে → MongoDB query → Redis এ save → return
```

### Real Example — Media Service:

আপনার `src/app/modules/media/media.service.ts` file এ এভাবে integrate করবেন:

```typescript
// src/app/modules/media/media.service.ts
import redis, { getJson, setJson } from "../../shared/redis";
import { MediaModel } from "./media.model";

const CACHE_TTL = 60 * 5; // 5 minute

const getSingleMediaFromDB = async (id: string) => {
  const cacheKey = `media:id:${id}`;

  // 1. Cache check
  const cached = await getJson(cacheKey);
  if (cached) {
    console.log("✅ Cache hit:", cacheKey);
    return cached;
  }

  // 2. Cache miss — DB query
  console.log("❌ Cache miss:", cacheKey);
  const media = await MediaModel.findById(id);

  if (!media) {
    throw new AppError(StatusCodes.NOT_FOUND, "Media not found");
  }

  // 3. Redis এ save
  await setJson(cacheKey, media, CACHE_TTL);

  return media;
};
```

---

## 📋 List Caching (Pagination সহ)

Query parameter অনুযায়ী list cache করতে key তে সব param include করতে হবে।

```typescript
const getAllMediaFromDB = async (query: Record<string, unknown>) => {
  const { page = 1, limit = 10, category, search } = query;

  // Unique cache key তৈরি — সব query param সহ
  const cacheKey = `media:list:page:${page}:limit:${limit}:cat:${
    category ?? "all"
  }:q:${search ?? "none"}`;

  const cached = await getJson(cacheKey);
  if (cached) return cached;

  // Actual query
  const filter: any = {};
  if (category) filter.category = category;
  if (search) filter.title = { $regex: search, $options: "i" };

  const total = await MediaModel.countDocuments(filter);
  const data = await MediaModel.find(filter)
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  const result = { data, meta: { total, page, limit } };

  // Cache করি
  await setJson(cacheKey, result, 60 * 2); // 2 min TTL

  return result;
};
```

> 💡 **Tip:** List query তে TTL কম রাখুন (2-5 min)। কারণ নতুন data insert হলে cached list এ দেখাবে না।

---

## 🚀 Higher-Order Function দিয়ে Reusable Cache Wrapper

প্রতিবার cache logic লিখতে না হয়ে reusable wrapper বানান:

```typescript
// src/app/shared/withCache.ts
import { getJson, setJson } from "./redis";

interface CacheOptions {
  key: string;
  ttl?: number; // seconds
}

export const withCache = async <T>(
  options: CacheOptions,
  fetcher: () => Promise<T>
): Promise<T> => {
  const { key, ttl = 300 } = options;

  // Cache check
  const cached = await getJson<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetcher();

  // Cache set
  if (data !== null && data !== undefined) {
    await setJson(key, data, ttl);
  }

  return data;
};
```

### Usage:

```typescript
// Service এ সহজেই use
const getSingleMediaFromDB = async (id: string) => {
  return withCache(
    { key: `media:id:${id}`, ttl: 300 },
    async () => {
      const media = await MediaModel.findById(id);
      if (!media) {
        throw new AppError(StatusCodes.NOT_FOUND, "Media not found");
      }
      return media;
    }
  );
};
```

অনেক clean, তাই না? 🎉

---

## ✍️ Write-Through Pattern

Data update এর সাথে সাথে cache ও update হয়ে যায়। Data consistency guaranteed।

```typescript
const updateMediaInDB = async (id: string, payload: Partial<IMedia>) => {
  // 1. DB update
  const updated = await MediaModel.findByIdAndUpdate(id, payload, {
    new: true,
  });

  if (!updated) {
    throw new AppError(StatusCodes.NOT_FOUND, "Media not found");
  }

  // 2. Cache update
  await setJson(`media:id:${id}`, updated, 300);

  // 3. List cache invalidate (নাহলে list এ পুরানো data)
  await delByPattern("media:list:*");

  return updated;
};
```

---

## 🗑️ Write-Behind / Delete-on-Write

Update এর সময় শুধু cache delete করে দিন — পরের request এ auto refresh হবে।

```typescript
const updateMediaInDB = async (id: string, payload: Partial<IMedia>) => {
  const updated = await MediaModel.findByIdAndUpdate(id, payload, {
    new: true,
  });

  if (!updated) {
    throw new AppError(StatusCodes.NOT_FOUND, "Media not found");
  }

  // Cache delete — next read এ refresh হবে
  await redis.del(`media:id:${id}`);
  await delByPattern("media:list:*");

  return updated;
};
```

**কোনটা কখন use করবো?**

| Situation | Pattern |
|-----------|---------|
| Update rare, read frequent | Write-Through |
| Update frequent | Delete-on-Write |
| Data consistency critical | Write-Through |
| Simple + safe | Delete-on-Write |

---

## 🎲 Stale-While-Revalidate

Cache stale হলেও পুরানো data return করে, background এ refresh চালু। User কে কখনো wait করতে হয় না।

```typescript
// src/app/shared/staleWhileRevalidate.ts
import redis, { setJson, getJson } from "./redis";

export const swr = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  freshTtl: number = 60,
  staleTtl: number = 600
): Promise<T> => {
  const cached = await getJson<{ data: T; freshUntil: number }>(key);
  const now = Date.now();

  // Fresh cache — সরাসরি return
  if (cached && cached.freshUntil > now) {
    return cached.data;
  }

  // Stale cache আছে — return করি, background এ refresh
  if (cached) {
    fetcher()
      .then((fresh) => {
        setJson(
          key,
          { data: fresh, freshUntil: Date.now() + freshTtl * 1000 },
          staleTtl
        );
      })
      .catch((err) => console.error("SWR refresh failed:", err));

    return cached.data;
  }

  // কোনো cache নেই — synchronous fetch
  const fresh = await fetcher();
  await setJson(
    key,
    { data: fresh, freshUntil: Date.now() + freshTtl * 1000 },
    staleTtl
  );

  return fresh;
};
```

### Usage:

```typescript
const getHomepageBanners = async () => {
  return swr(
    "homepage:banners",
    async () => {
      return await BannerModel.find({ active: true }).sort({ order: 1 });
    },
    60, // fresh এর 60 sec
    600 // 10 min পর্যন্ত stale allowed
  );
};
```

---

## 🔒 Cache Stampede Prevention (Lock)

একই cache miss হলে অনেক request একসাথে DB hit করে — এটাকে বলে **cache stampede**। Prevention:

```typescript
// src/app/shared/cacheWithLock.ts
import redis, { setJson, getJson } from "./redis";

export const withCacheLock = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300
): Promise<T> => {
  const cached = await getJson<T>(key);
  if (cached) return cached;

  const lockKey = `lock:${key}`;
  const acquired = await redis.set(lockKey, "1", "EX", 10, "NX");

  if (!acquired) {
    // অন্য কেউ fetch করছে — একটু wait করে আবার cache try করি
    await new Promise((r) => setTimeout(r, 100));
    const retryCache = await getJson<T>(key);
    if (retryCache) return retryCache;
  }

  try {
    const data = await fetcher();
    await setJson(key, data, ttl);
    return data;
  } finally {
    await redis.del(lockKey);
  }
};
```

---

## 📖 Next Step

Pattern গুলো শিখলেন। এখন cache invalidation এর details → [06-invalidation.md](./06-invalidation.md)

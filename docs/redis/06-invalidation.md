# 6. Cache Invalidation

> "There are only two hard things in Computer Science: cache invalidation and naming things." — Phil Karlton

Cache invalidation মানে: cache তে থাকা stale (পুরানো) data delete করে fresh data রাখা। এটা caching এর সবচেয়ে tricky অংশ। এই doc এ আমরা আমাদের project এ কিভাবে করবো তা দেখবো।

---

## 🤷 কেন Invalidation দরকার?

Consider এই scenario:

1. `GET /api/media/123` → DB query → Redis এ cache (TTL: 5 min)
2. `PATCH /api/media/123` → title update → **কিন্তু Redis এ পুরানো title!**
3. আবার `GET /api/media/123` → cache hit → পুরানো data return 😱

**Solution:** Update/delete এর সাথে সাথে related cache clear করে দিতে হবে।

---

## 🎯 Invalidation Strategies

### 1. **Time-Based (TTL)**

সবচেয়ে সহজ। Cache save করার সময় TTL set করে দিন। TTL শেষ হলে auto delete।

```typescript
await setJson("media:id:123", media, 300); // 5 min পর expire
```

**কখন use করবেন?**
- ✅ Data update হলে user সাথে সাথে দেখতে না পেলেও চলবে
- ✅ Analytics, statistics, aggregated data
- ❌ Critical data যেমন balance, stock

**TTL Recommendation:**

| Data Type | Recommended TTL |
|-----------|----------------|
| Blog list | 2-5 min |
| Blog details | 5-10 min |
| User profile | 15-30 min |
| Settings/Config | 1 hour |
| Static content (about, homepage) | 30 min - 1 hour |
| Real-time data | 10-30 sec |

---

### 2. **Event-Based (Explicit Invalidation)**

Update/Delete operation এর সময় সরাসরি cache delete করে দিন।

```typescript
const updateMedia = async (id: string, payload: Partial<IMedia>) => {
  const updated = await MediaModel.findByIdAndUpdate(id, payload, {
    new: true,
  });

  // Related cache clear
  await redis.del(`media:id:${id}`);         // এই media এর detail
  await delByPattern("media:list:*");        // সব list cache
  await delByPattern(`media:category:${updated.category}:*`); // category list

  return updated;
};
```

**Pros:** Fresh data guaranteed
**Cons:** সব invalidation point track করা কঠিন

---

### 3. **Tag-Based Invalidation**

Related keys গুলোকে "tag" দিয়ে group করে একসাথে invalidate করা।

```typescript
// src/app/shared/tagCache.ts
import redis, { setJson, getJson } from "./redis";

export const setWithTags = async <T>(
  key: string,
  value: T,
  tags: string[],
  ttl: number = 300
): Promise<void> => {
  const pipeline = redis.pipeline();

  pipeline.set(key, JSON.stringify(value), "EX", ttl);

  // প্রতি tag এর জন্য এই key কে set এ add
  for (const tag of tags) {
    pipeline.sadd(`tag:${tag}`, key);
    pipeline.expire(`tag:${tag}`, ttl + 60);
  }

  await pipeline.exec();
};

export const invalidateTag = async (tag: string): Promise<number> => {
  const keys = await redis.smembers(`tag:${tag}`);
  if (keys.length === 0) return 0;

  const pipeline = redis.pipeline();
  keys.forEach((key) => pipeline.del(key));
  pipeline.del(`tag:${tag}`);

  await pipeline.exec();
  return keys.length;
};
```

### Usage:

```typescript
// Cache set with tags
await setWithTags(
  "media:id:123",
  mediaData,
  ["media", "category:tech", "author:456"],
  300
);

// একটা tag এর সব cache clear
await invalidateTag("category:tech"); // tech category এর সব cache gone
await invalidateTag("author:456");    // এই author এর সব cache gone
```

---

## 🏗️ আমাদের Project এর জন্য Invalidation Plan

Module wise কি কি invalidate করতে হবে:

### 📰 Media/Blog Module

| Operation | Invalidate |
|-----------|-----------|
| Create | `media:list:*` |
| Update | `media:id:{id}`, `media:list:*`, `media:slug:{oldSlug}` |
| Delete | `media:id:{id}`, `media:list:*` |
| Publish/Unpublish | `media:id:{id}`, `media:list:*` |
| View count update | `media:id:{id}` (optional) |

### 👤 User Module

| Operation | Invalidate |
|-----------|-----------|
| Profile update | `user:id:{id}`, `user:email:{email}` |
| Delete | `user:id:{id}`, `user:email:{email}`, `user:list:*` |
| Role change | `user:id:{id}` |

### 🔐 Auth Module

| Operation | Invalidate |
|-----------|-----------|
| Login | `auth:blacklist:*` (কিছু না, শুধু new session) |
| Logout | Add token to `auth:blacklist:token:{hash}` |
| Password change | `user:id:{id}` |

---

## 🧰 Reusable Invalidation Helper

Module-specific helper বানান:

```typescript
// src/app/modules/media/media.cache.ts
import redis, { delByPattern } from "../../shared/redis";

export const invalidateMediaCache = async (id?: string) => {
  const tasks: Promise<any>[] = [];

  if (id) {
    tasks.push(redis.del(`media:id:${id}`));
  }

  // List cache সব clear
  tasks.push(delByPattern("media:list:*"));

  await Promise.all(tasks);
};
```

### Usage in service:

```typescript
import { invalidateMediaCache } from "./media.cache";

const updateMedia = async (id: string, payload: Partial<IMedia>) => {
  const updated = await MediaModel.findByIdAndUpdate(id, payload, {
    new: true,
  });

  if (!updated) throw new AppError(404, "Media not found");

  await invalidateMediaCache(id);
  return updated;
};

const deleteMedia = async (id: string) => {
  const deleted = await MediaModel.findByIdAndDelete(id);
  if (!deleted) throw new AppError(404, "Media not found");

  await invalidateMediaCache(id);
  return deleted;
};

const createMedia = async (payload: IMedia) => {
  const created = await MediaModel.create(payload);
  await invalidateMediaCache(); // শুধু list clear
  return created;
};
```

---

## ⚠️ Common Mistakes

### ❌ ভুল: Cache invalidate করতে ভুলে যাওয়া

```typescript
// ভুল — update এর পর cache clear করা হয়নি
const updateBlog = async (id: string, data: any) => {
  return await BlogModel.findByIdAndUpdate(id, data);
  // ↑ Redis এ পুরানো data থেকে যাবে!
};
```

**Fix:** সব write operation এর পর invalidation call করতে হবে।

---

### ❌ ভুল: KEYS command দিয়ে pattern delete

```typescript
// ভুল — production এ blocking, Redis freeze হতে পারে
const keys = await redis.keys("media:*");
await redis.del(...keys);
```

**Fix:** `SCAN` based `delByPattern()` use করুন (`04-usage.md` এ আছে)।

---

### ❌ ভুল: TTL ছাড়া cache set

```typescript
// ভুল — memory leak হবে
await redis.set("some:key", value);
```

**Fix:** সবসময় TTL দিন।

```typescript
await redis.set("some:key", value, "EX", 300);
```

---

### ❌ ভুল: Very long TTL

```typescript
// ভুল — ৭ দিন TTL, কিন্তু data change হলে stale থাকবে
await setJson("user:id:123", user, 60 * 60 * 24 * 7);
```

**Fix:** সাধারণত ৫ min - ১ hour ideal। যদি ৭ দিন লাগে, তাহলে explicit invalidation ঠিক আছে কিনা confirm করুন।

---

## 📖 Next Step

Invalidation clear? এবার production ready করার best practices → [07-best-practices.md](./07-best-practices.md)

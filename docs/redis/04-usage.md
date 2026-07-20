# 4. Basic Redis Usage

এই doc এ Redis এর সব important operation code example সহ দেখানো হয়েছে।

---

## 🔑 Key Naming Convention

আমাদের project এ consistent key naming rule follow করবো:

```
<module>:<resource>:<identifier>[:<sub-resource>]
```

**Examples:**

| Purpose | Key Format |
|---------|-----------|
| Single media | `media:id:507f1f77bcf86cd799439011` |
| Media list | `media:list:page:1:limit:10` |
| User profile | `user:id:507f1f77bcf86cd799439011` |
| Blog by slug | `blog:slug:my-first-post` |
| JWT blacklist | `auth:blacklist:token:<token-hash>` |
| Rate limit | `ratelimit:ip:192.168.1.1` |

> ✅ **Rule:** সব key **lowercase** এ, colon (`:`) দিয়ে separate।

---

## 🧰 Basic Operations

সব example এ ধরে নিচ্ছি আপনি এভাবে import করেছেন:

```typescript
import redis from "../shared/redis";
```

### 1️⃣ SET — Data রাখা

```typescript
// Simple set
await redis.set("user:id:123", "John Doe");

// TTL (expiration) সহ — 60 second পরে auto-delete
await redis.set("otp:phone:01700000000", "1234", "EX", 60);

// শুধুমাত্র key না থাকলে set (NX = Not Exists)
await redis.set("lock:job:daily-report", "locked", "EX", 300, "NX");
```

**Time units:**
- `EX` → seconds
- `PX` → milliseconds
- `EXAT` → Unix timestamp (seconds)
- `PXAT` → Unix timestamp (ms)

---

### 2️⃣ GET — Data পড়া

```typescript
const value = await redis.get("user:id:123");
// value: string | null

if (value) {
  console.log("Found:", value);
} else {
  console.log("Cache miss");
}
```

---

### 3️⃣ DEL — Data মুছা

```typescript
// Single key delete
await redis.del("user:id:123");

// Multiple key একসাথে
await redis.del("user:id:123", "user:id:456", "user:id:789");

// Pattern দিয়ে delete (careful!)
const keys = await redis.keys("user:id:*");
if (keys.length > 0) {
  await redis.del(...keys);
}
```

> ⚠️ **Warning:** Production এ `KEYS` command use করা risky (blocking)। বদলে `SCAN` use করুন — [best practices doc](./07-best-practices.md) এ details।

---

### 4️⃣ EXISTS — Key আছে কিনা check

```typescript
const exists = await redis.exists("user:id:123");
// exists: 1 (আছে) | 0 (নেই)

if (exists) {
  // do something
}
```

---

### 5️⃣ EXPIRE — TTL Set/Update

```typescript
// Existing key তে TTL add
await redis.expire("user:id:123", 3600); // 1 hour

// TTL কতো বাকি আছে দেখা
const ttl = await redis.ttl("user:id:123");
// ttl: -1 (no TTL) | -2 (key নেই) | number (seconds বাকি)
```

---

## 📦 Object/JSON Store করা

Redis শুধু string store করে। Object রাখতে `JSON.stringify` / `JSON.parse` use করতে হবে।

### Helper Function বানান:

```typescript
// src/app/shared/redis.ts এ add করুন
import Redis from "ioredis";
import config from "../config";

const redis = new Redis(config.redis_url, {
  /* ... previous config ... */
});

// Helper: JSON set
export const setJson = async <T>(
  key: string,
  value: T,
  ttlSeconds?: number
): Promise<void> => {
  const stringified = JSON.stringify(value);
  if (ttlSeconds) {
    await redis.set(key, stringified, "EX", ttlSeconds);
  } else {
    await redis.set(key, stringified);
  }
};

// Helper: JSON get
export const getJson = async <T>(key: string): Promise<T | null> => {
  const value = await redis.get(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

// Helper: Delete by pattern (SCAN based, safe)
export const delByPattern = async (pattern: string): Promise<number> => {
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
};

export default redis;
```

### Usage:

```typescript
import redis, { setJson, getJson, delByPattern } from "../shared/redis";

// Object save
const user = { id: "123", name: "John", email: "john@example.com" };
await setJson("user:id:123", user, 3600); // 1 hour TTL

// Object read
const cached = await getJson<typeof user>("user:id:123");
if (cached) {
  console.log(cached.name); // "John"
}

// Pattern delete
await delByPattern("user:*"); // সব user cache clear
```

---

## 🔢 Number Operations (Counters)

Redis counter খুবই efficient — rate limit, view count, ইত্যাদির জন্য perfect।

```typescript
// Counter increment
await redis.incr("blog:views:507f1f77bcf86cd799439011");

// Custom amount দিয়ে increment
await redis.incrby("blog:views:507f1f77bcf86cd799439011", 5);

// Decrement
await redis.decr("stock:product:123");

// Get current count
const views = await redis.get("blog:views:507f1f77bcf86cd799439011");
console.log(Number(views));
```

**Rate limiting example:**

```typescript
export const checkRateLimit = async (
  ip: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> => {
  const key = `ratelimit:ip:${ip}`;
  const count = await redis.incr(key);

  if (count === 1) {
    // প্রথম request হলে TTL set
    await redis.expire(key, windowSeconds);
  }

  return count <= limit;
};

// Usage in middleware
const allowed = await checkRateLimit(clientIp, 100, 60); // 60 second এ 100 request
if (!allowed) {
  throw new AppError(429, "Too many requests");
}
```

---

## 📋 List Operations

Recent activity, queue, বা log রাখার জন্য।

```typescript
// Left push (queue এর head এ)
await redis.lpush("recent:blogs", "blog-id-1", "blog-id-2");

// Right push (tail এ)
await redis.rpush("recent:blogs", "blog-id-3");

// Range read (0 = first, -1 = last)
const recent = await redis.lrange("recent:blogs", 0, 9); // latest 10

// List size limit রাখতে (trim)
await redis.ltrim("recent:blogs", 0, 99); // শুধু last 100 রাখো
```

---

## 🗺️ Hash Operations (Object like)

Multiple field সহ single key store করতে।

```typescript
// Multi-field set
await redis.hset("user:profile:123", {
  name: "John",
  email: "john@example.com",
  role: "admin",
});

// Single field get
const name = await redis.hget("user:profile:123", "name");

// সব field get
const all = await redis.hgetall("user:profile:123");
// { name: "John", email: "...", role: "admin" }

// Field delete
await redis.hdel("user:profile:123", "email");
```

---

## ⚡ Pipeline — একাধিক Command একসাথে

Multiple command একসাথে পাঠালে network round-trip কমে যায়।

```typescript
const pipeline = redis.pipeline();
pipeline.set("key1", "value1");
pipeline.set("key2", "value2");
pipeline.incr("counter");
pipeline.get("key1");

const results = await pipeline.exec();
// results: [[null, "OK"], [null, "OK"], [null, 5], [null, "value1"]]
```

---

## 📖 Next Step

Common operations জানা হয়ে গেছে। এখন actual caching pattern implement করতে → [05-caching-patterns.md](./05-caching-patterns.md)

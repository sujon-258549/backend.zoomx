# 7. Redis Best Practices

Production এ Redis smoothly চালাতে এই rules follow করুন।

---

## 🔑 1. Consistent Key Naming

**Rule:** `<module>:<resource>:<identifier>` format এ, সব lowercase, colon separated।

```typescript
// ✅ Good
"media:id:507f1f77bcf86cd799439011"
"user:email:john@example.com"
"blog:list:page:1:limit:10"

// ❌ Bad
"Media_507f1f77bcf86cd799439011"
"userEmail_john@example.com"
"BLOG-LIST-PAGE-1"
```

**Reason:** Consistency = readable + pattern-based invalidation সহজ।

---

## ⏱️ 2. সবসময় TTL Use করুন

TTL ছাড়া key permanently থাকবে → memory leak।

```typescript
// ❌ ভুল
await redis.set("session:abc", data);

// ✅ ঠিক
await redis.set("session:abc", data, "EX", 3600);
```

**Exception:** Explicit invalidation control চাইলে TTL skip করা যায়, কিন্তু tracking রাখতে হবে।

---

## 🚫 3. Production এ KEYS Command এড়িয়ে চলুন

`KEYS` command **blocking** — Redis freeze হয়ে যায় বড় dataset এ।

```typescript
// ❌ Dangerous in production
const keys = await redis.keys("user:*");

// ✅ Safe — SCAN based
export const delByPattern = async (pattern: string) => {
  let cursor = "0";
  let deleted = 0;
  do {
    const [next, keys] = await redis.scan(
      cursor, "MATCH", pattern, "COUNT", 100
    );
    cursor = next;
    if (keys.length) deleted += await redis.del(...keys);
  } while (cursor !== "0");
  return deleted;
};
```

---

## 📦 4. Value Size Limit রাখুন

Redis এ single value 512MB পর্যন্ত store করা যায়, কিন্তু best practice হলো **<100KB**।

```typescript
// ❌ ভুল — full document cache
await setJson("blog:id:123", fullBlogWithAllComments, 300);

// ✅ ঠিক — শুধু essential field
await setJson(
  "blog:id:123",
  { id, title, slug, excerpt, coverImage, author, publishedAt },
  300
);
```

**Reason:** Large value = slow network, high memory, GC pressure।

---

## 🔁 5. Pipeline দিয়ে Multiple Command Batch করুন

Network round-trip কমাতে।

```typescript
// ❌ ভুল — 3 network round-trip
await redis.set("k1", "v1");
await redis.set("k2", "v2");
await redis.set("k3", "v3");

// ✅ ঠিক — 1 round-trip
await redis.pipeline()
  .set("k1", "v1")
  .set("k2", "v2")
  .set("k3", "v3")
  .exec();
```

---

## 🛡️ 6. Cache Failure Graceful Handle করুন

Redis down থাকলে app crash করবে না — MongoDB থেকে সরাসরি serve করবে।

```typescript
export const getJson = async <T>(key: string): Promise<T | null> => {
  try {
    const value = await redis.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch (err) {
    console.error(`Redis get failed for ${key}:`, err);
    return null; // 👈 fail gracefully, DB fallback হবে
  }
};

export const setJson = async <T>(
  key: string,
  value: T,
  ttl?: number
): Promise<void> => {
  try {
    const stringified = JSON.stringify(value);
    if (ttl) {
      await redis.set(key, stringified, "EX", ttl);
    } else {
      await redis.set(key, stringified);
    }
  } catch (err) {
    console.error(`Redis set failed for ${key}:`, err);
    // Error throw করবেন না — cache ছাড়া app চলুক
  }
};
```

---

## 🔒 7. Sensitive Data Store এড়িয়ে চলুন

Redis এ password, secret token, credit card ইত্যাদি store করবেন না।

```typescript
// ❌ ভুল
await redis.set(`user:password:${id}`, plainPassword);

// ✅ ঠিক — শুধু hash বা token store
await redis.set(`user:session:${sessionId}`, jwtToken, "EX", 3600);
```

**যদি sensitive data cache করতেই হয়:**
- Encrypt before storing
- TTL অত্যন্ত কম
- Production Redis এ TLS + password required

---

## 🔐 8. Production এ Redis Secure করুন

### Environment variables:

```env
# Bad
REDIS_URL=redis://localhost:6379

# Good (production)
REDIS_URL=rediss://:strong_password@redis.example.com:6379
```

### Required settings:

- ✅ **Password (AUTH)** — always
- ✅ **TLS (rediss://)** — internet exposed হলে must
- ✅ **Firewall rules** — শুধু app server থেকে access
- ✅ **Bind to private IP** — public interface এ না
- ✅ **Rename dangerous commands** — `FLUSHDB`, `FLUSHALL`, `CONFIG`

---

## 📊 9. Monitoring Setup করুন

```typescript
// Regular check
setInterval(async () => {
  try {
    const info = await redis.info("memory");
    const dbsize = await redis.dbsize();
    console.log(`Redis: ${dbsize} keys, memory info: ${info}`);
  } catch (err) {
    console.error("Redis health check failed:", err);
  }
}, 60000); // প্রতি minute
```

**Production এ dedicated tool:**
- Redis Cloud এর built-in dashboard
- Upstash console
- RedisInsight (free GUI)
- Prometheus + Grafana

**Watch these metrics:**

| Metric | Concern If |
|--------|-----------|
| Memory usage | >80% of max |
| Cache hit rate | <70% |
| Evicted keys | Continuously rising |
| Connected clients | Sudden spike |
| Latency (p99) | >10ms |

---

## 🎯 10. Cache Hit Rate Measure করুন

কতটা effective cache হচ্ছে জানতে counter maintain করুন:

```typescript
// src/app/shared/withCache.ts এ update
export const withCache = async <T>(
  options: { key: string; ttl?: number },
  fetcher: () => Promise<T>
): Promise<T> => {
  const { key, ttl = 300 } = options;

  const cached = await getJson<T>(key);
  if (cached !== null) {
    redis.incr("stats:cache:hits").catch(() => {});
    return cached;
  }

  redis.incr("stats:cache:misses").catch(() => {});
  const data = await fetcher();
  await setJson(key, data, ttl);
  return data;
};

// Admin dashboard এ show
export const getCacheStats = async () => {
  const [hits, misses] = await Promise.all([
    redis.get("stats:cache:hits"),
    redis.get("stats:cache:misses"),
  ]);
  const h = Number(hits ?? 0);
  const m = Number(misses ?? 0);
  const total = h + m;
  return {
    hits: h,
    misses: m,
    hitRate: total > 0 ? ((h / total) * 100).toFixed(2) + "%" : "0%",
  };
};
```

**Goal:** Cache hit rate **>80%** on read-heavy endpoints।

---

## 💾 11. Redis Memory Policy Set করুন

Memory ভরে গেলে কি হবে? Config এ set করুন:

```bash
# redis.conf বা environment
maxmemory 512mb
maxmemory-policy allkeys-lru
```

**Common policies:**

| Policy | Behavior |
|--------|----------|
| `noeviction` | Memory full হলে write reject |
| `allkeys-lru` | Least Recently Used delete |
| `allkeys-lfu` | Least Frequently Used delete |
| `volatile-lru` | TTL সহ keys এর মধ্যে LRU |
| `volatile-ttl` | TTL কম যাদের, তাদের first delete |

**Recommended:** `allkeys-lru` (caching এর জন্য ideal)।

---

## 🔄 12. Connection Pooling Understand করুন

ioredis default single connection use করে, কিন্তু pipeline/cluster এ multiple lagতে পারে।

```typescript
// Multiple concurrent request এর জন্য concern নেই
const [user, media, blog] = await Promise.all([
  redis.get("user:1"),
  redis.get("media:1"),
  redis.get("blog:1"),
]);
```

ioredis internally efficient queuing করে।

---

## ✅ Production Checklist

Deploy করার আগে:

- [ ] `.env` এ REDIS_URL correctly set
- [ ] Redis password protected
- [ ] TLS enabled (rediss://)
- [ ] Firewall rules configured
- [ ] `maxmemory` এবং `maxmemory-policy` set
- [ ] Monitoring/alerting configured
- [ ] Graceful shutdown এ `redis.quit()` call
- [ ] Cache failure graceful (fallback to DB)
- [ ] সব critical read endpoint এ TTL set
- [ ] Write endpoint এ invalidation logic added
- [ ] Log level appropriate (error/warn এ Redis issue দেখা যাবে)
- [ ] Cache hit rate tracking enabled
- [ ] Backup strategy (RDB/AOF) configured

---

## 📖 Next Step

Problem এ পড়লে দেখুন → [08-troubleshooting.md](./08-troubleshooting.md)

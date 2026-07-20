# 8. Troubleshooting

Common Redis issues এবং তাদের solution।

---

## 🔴 1. Connection Refused

**Error:**
```
Redis error: connect ECONNREFUSED 127.0.0.1:6379
```

**কারণ:** Redis server চলছে না বা wrong port।

**Solution:**

```bash
# Docker container চলছে কিনা check
docker ps | grep redis

# চলছে না? Start করুন
docker start zoomit-redis

# Container ই নেই? আবার create করুন
docker run -d --name zoomit-redis -p 6379:6379 redis:alpine

# Native install (Linux)
sudo systemctl status redis
sudo systemctl start redis

# Port check
netstat -an | grep 6379
```

---

## 🔐 2. Authentication Failed

**Error:**
```
Redis error: NOAUTH Authentication required
```

**কারণ:** Redis এ password set আছে কিন্তু connection URL এ include নেই।

**Solution:**

```env
# .env এ password সহ URL
REDIS_URL=redis://:your_password@localhost:6379

# TLS সহ (production)
REDIS_URL=rediss://:your_password@redis-host.com:6379
```

---

## ⏱️ 3. Connection Timeout

**Error:**
```
Redis error: connect ETIMEDOUT
```

**কারণ:** Network issue, firewall block, বা wrong host।

**Solution:**

```typescript
// src/app/shared/redis.ts এ timeout config
const redis = new Redis(config.redis_url, {
  connectTimeout: 10000, // 10 sec
  commandTimeout: 5000,  // 5 sec
  retryStrategy: (times) => Math.min(times * 100, 3000),
});
```

**Manual check:**

```bash
# Host reachable?
ping redis-host.com

# Port open?
telnet redis-host.com 6379
```

---

## 🔄 4. Too Many Reconnections

**Symptom:** Log এ বারবার:
```
🔄 Redis reconnecting...
🔄 Redis reconnecting...
```

**কারণ:** Network unstable বা Redis crash।

**Solution:**

```typescript
const redis = new Redis(config.redis_url, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 10) {
      console.error("Redis: giving up after 10 retries");
      return null; // stop retry
    }
    return Math.min(times * 200, 5000);
  },
  reconnectOnError: (err) => {
    const targetError = "READONLY";
    if (err.message.includes(targetError)) {
      return true; // reconnect
    }
    return false;
  },
});
```

---

## 💾 5. Out of Memory

**Error:**
```
OOM command not allowed when used memory > 'maxmemory'
```

**কারণ:** Redis memory ভরে গেছে, eviction policy `noeviction`।

**Solution:**

**Immediate fix:**

```bash
# Redis CLI এ
redis-cli
> CONFIG SET maxmemory-policy allkeys-lru
> CONFIG SET maxmemory 1gb
```

**Permanent fix (redis.conf):**

```conf
maxmemory 1gb
maxmemory-policy allkeys-lru
```

**Docker restart:**

```bash
docker rm -f zoomit-redis
docker run -d --name zoomit-redis \
  -p 6379:6379 \
  redis:alpine redis-server \
  --maxmemory 512mb \
  --maxmemory-policy allkeys-lru
```

---

## 🗑️ 6. Cache Not Clearing (Stale Data)

**Symptom:** Update করার পরও পুরানো data show হচ্ছে।

**Debugging:**

```typescript
// Service এ log add করুন
const updateMedia = async (id: string, payload: any) => {
  const updated = await MediaModel.findByIdAndUpdate(id, payload, { new: true });

  console.log("Before invalidation:", await redis.get(`media:id:${id}`));
  await invalidateMediaCache(id);
  console.log("After invalidation:", await redis.get(`media:id:${id}`)); // should be null

  return updated;
};
```

**Common cause:**
- Invalidation call করা হয়নি
- Wrong key format use করা হয়েছে
- List cache pattern match হয়নি

**Fix:** Redis CLI দিয়ে manually check:

```bash
redis-cli
> KEYS media:*     # dev এ ঠিক আছে, production এ SCAN use করবেন
> GET media:id:123
> DEL media:id:123 # manual delete
```

---

## 🐌 7. Slow Response Time

**Symptom:** Redis query slow (>10ms)।

**Debug:**

```typescript
// Latency check
const start = Date.now();
await redis.get("key");
console.log(`Redis latency: ${Date.now() - start}ms`);
```

**Common causes এবং fix:**

| Cause | Fix |
|-------|-----|
| Large value | Value size <100KB রাখুন |
| Too many `KEYS` command | `SCAN` use করুন |
| Network latency | Redis + App server same region এ রাখুন |
| Memory swap | maxmemory ঠিক করুন |
| Single big pipeline | Pipeline break করুন (100-1000 command batch) |

**Slow log check:**

```bash
redis-cli
> SLOWLOG GET 10
```

---

## 🔥 8. `MAXCLIENTS` Reached

**Error:**
```
ERR max number of clients reached
```

**কারণ:** Application অনেক Redis connection open করছে।

**Solution:**

```typescript
// Single Redis instance share করুন — নতুন করে instance তৈরি করবেন না
// ❌ ভুল
const redis1 = new Redis(url);
const redis2 = new Redis(url);
const redis3 = new Redis(url);

// ✅ ঠিক — শুধু একটাই instance
import redis from "./shared/redis";
```

Config বাড়ানো:

```bash
redis-cli CONFIG SET maxclients 10000
```

---

## 🧪 9. Development এ Data Reset

Development এ পুরো Redis clear করতে চাইলে:

```bash
# Docker container
docker exec -it zoomit-redis redis-cli FLUSHALL

# অথবা
redis-cli
> FLUSHALL           # সব DB
> FLUSHDB            # শুধু current DB
> DBSIZE             # কতো key আছে
```

> ⚠️ **Production এ কখনো `FLUSHALL` করবেন না।**

---

## 📡 10. Socket.io Multi-Instance Issue

**Symptom:** Multiple server instance এ Socket event সবার কাছে পৌঁছাচ্ছে না।

**Solution:** Redis adapter use করুন।

```bash
npm install @socket.io/redis-adapter
```

```typescript
// src/app/socket/index.ts (existing file update)
import { createAdapter } from "@socket.io/redis-adapter";
import { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";
import redis from "../shared/redis";

export const initSocket = (server: HttpServer) => {
  const io = new SocketServer(server, {
    cors: { origin: "*" },
  });

  // Redis pub/sub client
  const pubClient = redis.duplicate();
  const subClient = redis.duplicate();
  io.adapter(createAdapter(pubClient, subClient));

  // ...rest of socket config
};
```

---

## 🔍 Debug Commands Cheatsheet

```bash
# CLI দিয়ে connect
redis-cli

# সব info
INFO

# Memory info
INFO memory

# Client list
CLIENT LIST

# কতো key আছে
DBSIZE

# Realtime monitor (dev মাত্র)
MONITOR

# Slow queries
SLOWLOG GET 10

# Config দেখা
CONFIG GET maxmemory
CONFIG GET maxmemory-policy

# Persistence status
LASTSAVE

# Kill connection
CLIENT KILL ID <id>

# Server restart (careful!)
SHUTDOWN NOSAVE
```

---

## 🆘 এখনো Problem?

1. **Log পুরোটা check করুন** — আমাদের setup এ event listeners আছে (`03-setup.md`)
2. **Redis CLI দিয়ে সরাসরি test** — Node.js issue না Redis issue distinguish করতে
3. **Community help:**
   - Redis official: https://redis.io/docs/
   - ioredis GitHub: https://github.com/redis/ioredis
   - Stack Overflow: `[redis]` tag

---

## 📖 Back to Index

সব doc দেখতে → [README](../README.md)

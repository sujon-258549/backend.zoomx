# 1. Redis Introduction

## 🤔 Redis কী?

**Redis** (Remote Dictionary Server) হলো একটা **in-memory key-value data store**। এটা RAM এ data রাখে, তাই MongoDB বা SQL database এর চেয়ে অনেক গুণ fast — sub-millisecond response time।

সহজ ভাষায়: Redis হলো একটা super-fast "memory box" যেখানে key দিয়ে data রাখা যায় এবং সেই key দিয়ে instantly ফিরিয়ে আনা যায়।

---

## 🎯 কেন Redis Use করবো?

আমাদের ZOOMIT backend এ MongoDB use হচ্ছে। MongoDB fast, কিন্তু কিছু জায়গায় আরও fast response দরকার:

| Scenario | Without Redis | With Redis |
|----------|--------------|-----------|
| Popular blog list fetch | ~150ms (DB query) | ~2ms (cache hit) |
| User profile lookup | ~80ms | ~1ms |
| Aggregation query | ~500ms+ | ~5ms |
| Rate limit check | ~50ms (DB) | ~0.5ms |

### মূল Benefits:

1. **⚡ Speed** — RAM based, তাই disk-based DB এর চেয়ে ~100x fast।
2. **📉 DB Load কমায়** — Repeated query MongoDB তে না গিয়ে Redis থেকে সরাসরি answer দেয়।
3. **💰 Cost Saving** — কম DB call = কম MongoDB Atlas bill।
4. **📈 Scalability** — বেশি traffic handle করা সহজ হয়।
5. **🔄 Real-time Features** — Pub/Sub, Socket.io scaling এ কাজে লাগে।

---

## 🎪 কোথায় কোথায় Redis Use করবো?

আমাদের project এর জন্য relevant use cases:

### ✅ ভালো Fit (অবশ্যই use করা উচিত)

- **Public read-heavy endpoints**
  - Blog/Media list (frequently viewed, rarely changes)
  - About page data
  - Public settings/config
  - Homepage banners
- **Expensive queries**
  - Mongoose aggregation (`$lookup`, `$group`)
  - Complex filter সহ list
- **User session data**
  - JWT blacklist (logout করা token)
  - Active user session tracking
- **Rate limiting**
  - IP wise request count
  - OTP send limit
- **Socket.io scaling**
  - Multiple server instance এ message broadcast

### ⚠️ Careful Use (যত্ন সহকারে)

- **Frequently updated data** — cache invalidation ঠিক না রাখলে stale data দেখাবে।
- **User-specific data** — key তে userId include করতে হবে।

### ❌ Bad Fit (use করবেন না)

- **Sensitive data as permanent store** — Redis primary DB না, backup হারালে data যাবে।
- **Large binary/file storage** — এর জন্য S3/local storage better।
- **Complex query** — Redis এ SQL এর মতো JOIN/WHERE clause নেই।

---

## 🏗️ Architecture Overview

আমাদের বর্তমান architecture:

```
Client → Express API → MongoDB
```

Redis add করার পর:

```
Client → Express API → Redis (check first)
                    ↓ (cache miss)
                    MongoDB → Redis (store) → Client
```

**Flow:**

1. Request আসলে প্রথমে Redis check করবো।
2. **Cache hit** হলে সরাসরি Redis থেকে data return।
3. **Cache miss** হলে MongoDB query করে data নিয়ে Redis এ save করে return।
4. Update/delete হলে related Redis key delete করে দিবো (invalidation)।

এই pattern কে বলে **Cache-Aside Pattern** — [caching patterns doc](./05-caching-patterns.md) এ details আছে।

---

## 📖 Next Step

Redis install করার জন্য দেখুন → [02-installation.md](./02-installation.md)

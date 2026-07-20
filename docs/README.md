# ZOOMIT Backend Documentation

এই folder এ ZOOMIT backend এর সব documentation থাকবে। যেকোনো নতুন feature, integration, বা architecture change এর জন্য এখানে সুন্দর করে docs লিখে রাখবো যাতে টিমের সবাই সহজে বুঝতে পারে।

---

## 📚 Documentation Index

### 🔴 Redis Caching

Backend এ Redis দিয়ে caching setup এবং use করার complete guide।

| # | Topic | Description |
|---|-------|-------------|
| 1 | [Introduction](./redis/01-introduction.md) | Redis কী, কেন use করবো, কোথায় use করবো |
| 2 | [Installation](./redis/02-installation.md) | Local এবং production এ Redis install করার steps |
| 3 | [Setup & Configuration](./redis/03-setup.md) | Project এ Redis client setup করা |
| 4 | [Basic Usage](./redis/04-usage.md) | GET, SET, DEL সহ common operations |
| 5 | [Caching Patterns](./redis/05-caching-patterns.md) | Cache-aside, write-through ইত্যাদি pattern |
| 6 | [Cache Invalidation](./redis/06-invalidation.md) | কখন এবং কিভাবে cache clear করবো |
| 7 | [Best Practices](./redis/07-best-practices.md) | Production এ কী কী মেনে চলতে হবে |
| 8 | [Troubleshooting](./redis/08-troubleshooting.md) | Common problem এবং তার solution |
| 9 | [Module Integrations](./redis/09-module-integrations.md) | Blog / DynamicContent / CaseStudy এ কোথায় cache আছে |

---

## 🏗️ Project Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Realtime:** Socket.io
- **Caching:** Redis (ioredis client) ← এই docs এ cover করা আছে

---

## 📁 Docs Folder Structure

```
docs/
├── README.md                    ← এই file (index)
└── redis/
    ├── 01-introduction.md
    ├── 02-installation.md
    ├── 03-setup.md
    ├── 04-usage.md
    ├── 05-caching-patterns.md
    ├── 06-invalidation.md
    ├── 07-best-practices.md
    ├── 08-troubleshooting.md
    └── 09-module-integrations.md
```

---

## ✍️ Contributing to Docs

নতুন documentation add করার সময় এই rules follow করবেন:

1. **Folder structure:** প্রতিটি major topic এর জন্য আলাদা folder বানান (যেমন `redis/`, `auth/`, `socket/`)।
2. **File naming:** `01-topic-name.md` format এ number prefix দিয়ে ordering ঠিক রাখুন।
3. **Language:** Bengali/Banglish মিশিয়ে লিখতে পারেন, technical term English এ রাখুন।
4. **Code examples:** সব code snippet এ TypeScript use করুন, actual project structure follow করুন।
5. **Index update:** এই `README.md` এর table তে নতুন doc add করতে ভুলবেন না।

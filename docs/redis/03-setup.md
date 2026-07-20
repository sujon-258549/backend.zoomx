# 3. Redis Setup & Configuration

এই doc এ আমাদের ZOOMIT backend project এ Redis client কিভাবে setup করবো তা step-by-step দেখাবো।

---

## 📁 File Structure

আমরা এই files গুলো create/update করবো:

```
server.thezoomit/
├── .env                                    ← REDIS_URL add
└── src/
    └── app/
        ├── config/
        │   └── index.ts                    ← redis_url export add
        └── shared/                         ← নতুন folder
            └── redis.ts                    ← Redis client
```

---

## Step 1: Config এ Redis URL Add করা

`src/app/config/index.ts` file এ Redis URL add করুন:

```typescript
// src/app/config/index.ts
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join((process.cwd(), ".env")) });

export default {
  NODE_ENV: process.env.NODE_ENV,
  port: process.env.PORT,
  db_url: process.env.DB_URL,
  server_url: process.env.SERVER_URL || `http://localhost:${process.env.PORT}`,
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
  jwt_access_secret: process.env.JWT_ACCESS_SECRET,
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
  jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,
  jwt_otp_secret: process.env.JWT_OTP_SECRET,
  jwt_pass_reset_secret: process.env.JWT_PASS_RESET_SECRET,
  jwt_pass_reset_expires_in: process.env.JWT_PASS_RESET_EXPIRES_IN,
  sender_email: process.env.SENDER_EMAIL,
  sender_app_password: process.env.SENDER_APP_PASS,

  // 👇 এই line টা add করুন
  redis_url: process.env.REDIS_URL || "redis://localhost:6379",
};
```

---

## Step 2: Redis Client File বানানো

`src/app/shared/` folder এ `redis.ts` file বানান।

```typescript
// src/app/shared/redis.ts
import Redis from "ioredis";
import config from "../config";

const redis = new Redis(config.redis_url, {
  // Connection ব্যর্থ হলে retry strategy
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  // Command queue তে max item
  maxRetriesPerRequest: 3,
  // Lazy connect — server start এ block করবে না
  lazyConnect: false,
  // Connection name (Redis CLI তে `CLIENT LIST` এ দেখাবে)
  connectionName: "zoomit-backend",
});

redis.on("connect", () => {
  console.log("🔴 Redis connecting...");
});

redis.on("ready", () => {
  console.log("✅ Redis connected and ready");
});

redis.on("error", (err) => {
  console.error("❌ Redis error:", err.message);
});

redis.on("close", () => {
  console.warn("⚠️  Redis connection closed");
});

redis.on("reconnecting", () => {
  console.log("🔄 Redis reconnecting...");
});

export default redis;
```

---

## Step 3: Graceful Shutdown এ Redis Close

`src/server.ts` এ graceful shutdown এর সময় Redis connection ঠিক মতো close করা দরকার। এতে data loss হবে না।

```typescript
// src/server.ts
import { createServer, Server } from "http";
import mongoose from "mongoose";
import app from "./app";
import config from "./app/config";
import redis from "./app/shared/redis"; // 👈 import add
import { initSocket } from "./app/socket";

let server: Server | null = null;

async function connectToDatabase() {
  try {
    await mongoose.connect(config.db_url as string);
    console.log("🛢 Database connected successfully");
  } catch (err) {
    console.error("Failed to connect to database:", err);
    process.exit(1);
  }
}

function gracefulShutdown(signal: string) {
  console.log(`Received ${signal}. Closing server...`);

  if (server) {
    server.close(async () => {
      console.log("Server closed gracefully");

      // 👇 Redis close
      try {
        await redis.quit();
        console.log("Redis connection closed");
      } catch (err) {
        console.error("Error closing Redis:", err);
      }

      // Mongo close
      await mongoose.connection.close();

      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

async function bootstrap() {
  try {
    await connectToDatabase();

    server = createServer(app);
    initSocket(server);

    server.listen(config.port, () => {
      console.log(
        `🚀 Application is running on port http://localhost:${config.port}`
      );
    });

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    process.on("uncaughtException", (error) => {
      console.error("Uncaught Exception:", error);
      gracefulShutdown("uncaughtException");
    });

    process.on("unhandledRejection", (error) => {
      console.error("Unhandled Rejection:", error);
      gracefulShutdown("unhandledRejection");
    });
  } catch (error) {
    console.error("Error during bootstrap:", error);
    process.exit(1);
  }
}

bootstrap();
```

---

## Step 4: Server Restart এবং Verify

Server run করুন:

```bash
npm run dev
```

Console এ এই log গুলো দেখতে পাবেন:

```
🛢 Database connected successfully
🔴 Redis connecting...
✅ Redis connected and ready
🚀 Application is running on port http://localhost:5000
```

যদি Redis connection error আসে:

```
❌ Redis error: connect ECONNREFUSED 127.0.0.1:6379
```

তাহলে Redis server চলছে কিনা check করুন ([troubleshooting doc](./08-troubleshooting.md))।

---

## 🧪 Quick Test

`src/app.ts` এ একটা test route add করে verify করুন:

```typescript
// src/app.ts এ (temporary, testing এর জন্য)
import redis from "./app/shared/redis";

app.get("/redis-test", async (_req, res) => {
  await redis.set("test-key", "Hello Redis!", "EX", 60);
  const value = await redis.get("test-key");
  res.json({ success: true, value });
});
```

Browser এ `http://localhost:5000/redis-test` visit করুন। Output:

```json
{
  "success": true,
  "value": "Hello Redis!"
}
```

Test successful হলে এই temporary route delete করে দিন।

---

## 📖 Next Step

Redis setup complete! এখন basic operations শিখতে → [04-usage.md](./04-usage.md)

import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redis from "../shared/redis";

const redisStore = (prefix: string) =>
  new RedisStore({
    prefix,
    sendCommand: (...args: string[]) => (redis.call as (...a: string[]) => Promise<any>)(...args),
  });

// Baseline abuse guard for every /api request.
export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore("rl:api:"),
  message: { success: false, message: "Too many requests. Please try again shortly." },
});

// Tighter guard for auth endpoints (login, register, forgot/reset password),
// which are the most common brute-force / abuse targets.
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore("rl:auth:"),
  message: {
    success: false,
    message: "Too many attempts. Please try again in a few minutes.",
  },
});

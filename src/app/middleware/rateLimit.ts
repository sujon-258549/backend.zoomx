import rateLimit from "express-rate-limit";

// Redis has been removed — these limiters use express-rate-limit's built-in
// in-memory MemoryStore. Counters are per-process (each instance tracks its
// own), which is sufficient for coarse abuse protection.

// Baseline abuse guard for every /api request. A single SSR page render fans
// out into many API reads, so the ceiling is generous — and much higher in dev
// where Next.js issues duplicate/fast-refresh requests.
const isProduction = process.env.NODE_ENV === "production";

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: isProduction ? 600 : 5000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again shortly." },
});

// Tighter guard for auth endpoints (login, register, forgot/reset password),
// which are the most common brute-force / abuse targets.
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts. Please try again in a few minutes.",
  },
});

// Stricter guard for contact forms, inquiries, and comments to prevent spam.
export const contactRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5, // Allow 5 submissions per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "You have submitted too many requests. Please wait an hour before trying again.",
  },
});

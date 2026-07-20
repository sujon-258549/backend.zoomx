import { z } from "zod";

export const trackPageView = z.object({
  body: z.object({
    path: z.string().min(1, "path is required"),
    full_url: z.string().optional(),
    referrer: z.string().optional(),
    session_id: z.string().min(1, "session_id is required"),
    visitor_id: z.string().optional(),
    duration_ms: z.number().int().nonnegative().optional(),
    timestamp: z.string().datetime().optional(),
  }),
});

export const PageViewValidation = {
  trackPageView,
};

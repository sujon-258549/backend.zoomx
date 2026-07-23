import { z } from "zod";

const hhmm = z
  .string()
  .regex(/^\d{1,2}:\d{2}$/, "Time must be in HH:mm (24h) format");

const window = z.object({
  start: hhmm,
  end: hhmm,
});

const availabilityDay = z.object({
  day: z.number().int().min(0).max(6),
  enabled: z.boolean().optional(),
  windows: z.array(window).optional(),
});

const update = z.object({
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    timezone: z.string().min(1).optional(),
    adminEmail: z.string().email("Invalid admin email").or(z.literal("")).optional(),
    meetingUrl: z.string().optional(),
    slotDurationMinutes: z.number().int().min(5).max(480).optional(),
    bufferMinutes: z.number().int().min(0).max(240).optional(),
    maxAdvanceDays: z.number().int().min(1).max(365).optional(),
    minNoticeHours: z.number().int().min(0).max(720).optional(),
    availabilityDays: z.array(availabilityDay).max(7).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const MeetingSettingValidation = { update };

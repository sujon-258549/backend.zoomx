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
    blockedDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    dailyLimit: z.number().int().min(0).max(100).optional(),
    customQuestions: z
      .array(z.object({ label: z.string().min(1), required: z.boolean().optional() }))
      .max(10)
      .optional(),
    reminderMinutesBefore: z.number().int().min(0).max(10080).optional(),
    followupEnabled: z.boolean().optional(),
    followupMinutesAfter: z.number().int().min(0).max(10080).optional(),
    followupMessage: z.string().optional(),
    cancelMessage: z.string().optional(),
    completedMessage: z.string().optional(),
  }),
});

export const MeetingSettingValidation = { update };

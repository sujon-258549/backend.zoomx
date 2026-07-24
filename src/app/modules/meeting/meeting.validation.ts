import { z } from "zod";

const book = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("A valid email is required"),
    phone: z.string().optional(),
    notes: z.string().optional(),
    /** UTC ISO start instant taken from the availability endpoint. */
    start: z.string().min(1, "Slot start is required"),
    /** The visitor's IANA timezone. */
    timezone: z.string().min(1, "Timezone is required"),
    /** Answers to the host's custom questions. */
    customAnswers: z
      .array(z.object({ question: z.string(), answer: z.string() }))
      .optional(),
  }),
});

const reschedule = z.object({
  body: z.object({
    start: z.string().min(1, "New slot start is required"),
    timezone: z.string().min(1, "Timezone is required"),
  }),
});

const updateStatus = z.object({
  body: z.object({
    status: z.enum(["confirmed", "cancelled", "completed"]),
    cancellationReason: z.string().optional(),
  }),
});

const note = z.object({
  body: z.object({
    adminNote: z.string().optional(),
  }),
});

const followup = z.object({
  body: z.object({
    messageHtml: z.string().min(1, "Message is required"),
  }),
});

const sendOtp = z.object({ body: z.object({ email: z.string().email() }) });
const verifyOtp = z.object({ body: z.object({ email: z.string().email(), code: z.string().min(3) }) });

export const MeetingValidation = { book, reschedule, updateStatus, note, followup, sendOtp, verifyOtp };

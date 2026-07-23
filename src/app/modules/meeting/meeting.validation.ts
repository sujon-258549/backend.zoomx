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
  }),
});

const updateStatus = z.object({
  body: z.object({
    status: z.enum(["confirmed", "cancelled", "completed"]),
  }),
});

export const MeetingValidation = { book, updateStatus };

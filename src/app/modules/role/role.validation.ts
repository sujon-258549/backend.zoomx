import { z } from "zod";

export const roleValidation = {
  create: z.object({
    body: z.object({
      role: z.string().min(1, "Role is required"),
      description: z.string().optional(),
      isActive: z.boolean().optional(),
    }),
  }),
  update: z.object({
    body: z.object({
      role: z.string().min(1, "Role is required").optional(),
      description: z.string().optional(),
      isActive: z.boolean().optional(),
    }),
  }),
};

import { z } from "zod";

export const designationValidation = {
  create: z.object({
    body: z.object({
      name: z.string().min(1, "Name is required"),
      description: z.string().optional(),
      is_active: z.boolean().optional(),
    }),
  }),
  update: z.object({
    body: z.object({
      name: z.string().min(1, "Name is required").optional(),
      description: z.string().optional(),
      is_active: z.boolean().optional(),
    }),
  }),
};

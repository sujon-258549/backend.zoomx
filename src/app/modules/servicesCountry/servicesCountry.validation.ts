import { z } from "zod";

const create = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    slug: z.string().min(1).max(120).optional(),
    isActive: z.boolean().optional(),
  }),
});

const update = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    slug: z.string().min(1).max(120).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const ServicesCountryValidation = { create, update };

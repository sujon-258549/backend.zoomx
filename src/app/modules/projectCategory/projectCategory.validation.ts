import { z } from "zod";

const create = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    slug: z.string().optional(),
    aspect: z.enum(["16/9", "9/16"]).optional(),
    cols: z.number().optional(),
    status: z.enum(["active", "inactive"]).optional(),
  }),
});

const update = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    slug: z.string().optional(),
    aspect: z.enum(["16/9", "9/16"]).optional(),
    cols: z.number().optional(),
    status: z.enum(["active", "inactive"]).optional(),
  }),
});

export const ProjectCategoryValidation = { create, update };

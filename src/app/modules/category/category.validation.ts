import { z } from "zod";

const createCategoryValidationSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Name is required" }),
    slug: z.string().optional(),
    imageId: z.string().optional(),
    desc: z.string().optional(),
    slNumber: z.number().optional(),
    isHome: z.boolean().optional(),
    status: z.enum(["active", "inactive"]).optional(),
  }),
});

const updateCategoryValidationSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    slug: z.string().optional(),
    imageId: z.string().optional(),
    desc: z.string().optional(),
    slNumber: z.number().optional(),
    isHome: z.boolean().optional(),
    status: z.enum(["active", "inactive"]).optional(),
  }),
});

export const CategoryValidation = {
  createCategoryValidationSchema,
  updateCategoryValidationSchema,
};

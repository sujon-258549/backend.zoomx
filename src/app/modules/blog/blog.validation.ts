import { z } from "zod";

const seoSchema = z.object({
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.array(z.string()).optional(),
});

const create = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required"),
    sort_description: z.string().optional(),
    content: z.string().optional(),
    excerpt: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    status: z.boolean().optional(),
    is_deleted: z.boolean().optional(),
    seo: seoSchema.optional(),
  }),
});

const update = z.object({
  body: z.object({
    title: z.string().optional(),
    sort_description: z.string().optional(),
    content: z.string().optional(),
    excerpt: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    status: z.boolean().optional(),
    is_deleted: z.boolean().optional(),
    seo: seoSchema.optional(),
  }),
});

export const BlogValidation = {
  create,
  update,
};

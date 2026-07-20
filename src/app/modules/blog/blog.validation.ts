import { z } from "zod";

const create = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required"),
    thumbnail: z.string().optional(),
    thumbnailId: z.string().optional(),
    coverImage: z.string().optional(),
    coverImageId: z.string().optional(),
    sort_description: z.string().optional(),
    content: z.string().optional(),
    excerpt: z.string().optional(),
    category: z.string().optional(),
    categoryIds: z.array(z.string()).optional(),
    status: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    viewCount: z.number().int().nonnegative().optional(),
    is_deleted: z.boolean().optional(),
  }),
});

const update = z.object({
  body: z.object({
    title: z.string().optional(),
    thumbnail: z.string().optional(),
    thumbnailId: z.string().optional(),
    coverImage: z.string().optional(),
    coverImageId: z.string().optional(),
    sort_description: z.string().optional(),
    content: z.string().optional(),
    excerpt: z.string().optional(),
    category: z.string().optional(),
    categoryIds: z.array(z.string()).optional(),
    status: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    viewCount: z.number().int().nonnegative().optional(),
    is_deleted: z.boolean().optional(),
  }),
});

export const BlogValidation = {
  create,
  update,
};

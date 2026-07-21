import { z } from "zod";

const create = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required"),
    videoUrl: z.string().min(1, "Video URL is required"),
    category: z.string().min(1, "Category ID is required"),
    status: z.enum(["active", "inactive"]).optional(),
  }),
});

const update = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    videoUrl: z.string().min(1).optional(),
    category: z.string().min(1).optional(),
    status: z.enum(["active", "inactive"]).optional(),
  }),
});

export const ProjectValidation = { create, update };

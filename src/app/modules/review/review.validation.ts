import { z } from "zod";

const createReview = z.object({
  body: z.object({
    quote: z.string().min(1),
    name: z.string().min(1),
    role: z.string().min(1),
    avatar: z.string().optional(),
    avatarId: z.string().optional(),
    type: z.enum(["video", "image"]),
    poster: z.string().min(1),
    posterId: z.string().optional(),
    videoUrl: z.string().optional(),
    order: z.number().optional(),
  }),
});

const updateReview = z.object({
  body: z.object({
    quote: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
    role: z.string().min(1).optional(),
    avatar: z.string().optional(),
    avatarId: z.string().optional(),
    type: z.enum(["video", "image"]).optional(),
    poster: z.string().min(1).optional(),
    posterId: z.string().optional(),
    videoUrl: z.string().optional(),
    order: z.number().optional(),
  }),
});

export const ReviewValidation = {
  createReview,
  updateReview,
};

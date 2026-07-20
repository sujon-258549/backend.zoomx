import { z } from "zod";

const create = z.object({
  body: z.object({
    name: z.string({ required_error: "Name is required" }).trim().min(1),
    emailOrPhone: z
      .string({ required_error: "Email or phone is required" })
      .trim()
      .min(1, "Email or phone is required"),
    rating: z
      .number({ required_error: "Rating is required" })
      .min(1, "Rating must be at least 1")
      .max(5, "Rating cannot be greater than 5"),
    comment: z.string({ required_error: "Comment is required" }).trim().min(1),
    product: z.string({ required_error: "Product ID is required" }),
  }),
});

const updateStatus = z.object({
  body: z.object({
    status: z.enum(["pending", "approved", "rejected"]),
  }),
});

// Admin edit — every field optional.
const update = z.object({
  body: z.object({
    name: z.string().trim().min(1).optional(),
    emailOrPhone: z.string().trim().min(1).optional(),
    rating: z.number().min(1).max(5).optional(),
    comment: z.string().trim().min(1).optional(),
    status: z.enum(["pending", "approved", "rejected"]).optional(),
  }),
});

export const ProductReviewValidation = {
  create,
  updateStatus,
  update,
};

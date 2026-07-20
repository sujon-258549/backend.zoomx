import { z } from "zod";

const create = z.object({
  body: z.object({
    name: z.string({ required_error: "Name is required" }),
    emailOrPhone: z.string({ required_error: "Email or Phone is required" }),
    comment: z.string({ required_error: "Comment is required" }),
    blog: z.string({ required_error: "Blog ID is required" }),
    status: z.enum(["pending", "approved", "rejected"]).optional(),
  }),
});

const updateStatus = z.object({
  body: z.object({
    status: z.enum(["pending", "approved", "rejected"]),
  }),
});

export const CommentValidation = {
  create,
  updateStatus,
};

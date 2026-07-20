import { Schema, model } from "mongoose";
import { IComment } from "./comment.interface";

const commentSchema = new Schema<IComment>(
  {
    name: { type: String, required: true },
    emailOrPhone: { type: String, required: true },
    comment: { type: String, required: true },
    blog: { type: Schema.Types.ObjectId, ref: "Blog", required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

export const Comment = model<IComment>("Comment", commentSchema);

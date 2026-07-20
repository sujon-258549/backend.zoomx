import { Schema, model } from "mongoose";
import { IProductReview } from "./productReview.interface";

const productReviewSchema = new Schema<IProductReview>(
  {
    name: {
      type: String,
      required: [true, "Reviewer name is required."],
      trim: true,
      maxlength: 100,
    },
    // Accepts either an email or a phone number — whichever the customer gives.
    emailOrPhone: {
      type: String,
      required: [true, "Email or phone is required."],
      trim: true,
      maxlength: 150,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required."],
      min: [1, "Rating must be at least 1."],
      max: [5, "Rating cannot be greater than 5."],
    },
    comment: {
      type: String,
      required: [true, "Review text is required."],
      trim: true,
      maxlength: 2000,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required."],
    },
    // New reviews are published immediately so the customer sees their review
    // appear right away. Admins can move a review to "pending"/"rejected" to
    // hide it, or delete it outright.
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },
  },
  {
    timestamps: true,
  }
);

export const ProductReview = model<IProductReview>(
  "ProductReview",
  productReviewSchema
);

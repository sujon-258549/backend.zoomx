import { Schema, model } from "mongoose";
import { IReview } from "./review.interface";

const reviewSchema = new Schema<IReview>(
  {
    quote: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    avatarId: {
      type: Schema.Types.ObjectId,
      ref: "Media",
    },
    type: {
      type: String,
      enum: ["video", "image"],
      required: true,
    },
    poster: {
      type: String,
      required: true,
    },
    posterId: {
      type: Schema.Types.ObjectId,
      ref: "Media",
    },
    videoUrl: {
      type: String,
      default: "",
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Review = model<IReview>("Review", reviewSchema);
export default Review;

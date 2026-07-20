import { Types } from "mongoose";

export type ProductReviewStatus = "pending" | "approved" | "rejected";

export interface IProductReview {
  name: string;
  emailOrPhone: string;
  rating: number;
  comment: string;
  product: Types.ObjectId;
  status: ProductReviewStatus;
}

import { Document } from "mongoose";

export interface IReview extends Document {
  quote: string;
  name: string;
  role: string;
  avatar?: string;
  type: "video" | "image";
  poster: string;
  order?: number;
}

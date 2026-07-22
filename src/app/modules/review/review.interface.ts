import { Document } from "mongoose";

export interface IReview extends Document {
  quote: string;
  name: string;
  role: string;
  avatar?: string;
  avatarId?: import("mongoose").Types.ObjectId;
  type: "video" | "image";
  poster: string;
  posterId?: import("mongoose").Types.ObjectId;
  videoUrl?: string;
  order?: number;
}

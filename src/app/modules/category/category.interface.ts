import { Types } from "mongoose";

export interface ICategory {
  name: string;
  slug: string;
  imageId?: Types.ObjectId | string;
  image?: Types.ObjectId | string;
  desc?: string;
  slNumber?: number;
  isHome?: boolean;
  status: "active" | "inactive";
}

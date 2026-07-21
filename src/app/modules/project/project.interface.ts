import { Types } from "mongoose";

export interface IProject {
  _id?: string;
  title: string;
  videoUrl: string;
  category: Types.ObjectId | string;
  status: "active" | "inactive";
  is_deleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

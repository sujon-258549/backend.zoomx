import { Types } from "mongoose";

export interface IComment {
  name: string;
  emailOrPhone: string;
  website?: string;
  comment: string;
  blog: Types.ObjectId;
  status: "pending" | "approved" | "rejected";
}

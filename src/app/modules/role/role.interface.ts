import { Document, Types } from "mongoose";

export interface IRole extends Document {
  role: string;
  description?: string;
  isActive: boolean;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

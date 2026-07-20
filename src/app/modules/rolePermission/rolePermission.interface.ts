import { Document, Types } from "mongoose";

export interface IRolePermission extends Document {
  roleId: Types.ObjectId;
  module: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

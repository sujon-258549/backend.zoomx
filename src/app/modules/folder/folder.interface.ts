import { Document, Types } from "mongoose";

export interface IFolder extends Document {
  name: string;
  // Self-reference. `null` = a top-level (root) folder; otherwise the id of the
  // folder this one lives inside. This is what allows folders-inside-folders
  // to any depth.
  parent?: Types.ObjectId | null;
  createdBy?: Types.ObjectId | null;
  is_deleted: boolean;
}

import { Schema, model } from "mongoose";
import { IProjectCategory } from "./projectCategory.interface";

const projectCategorySchema = new Schema<IProjectCategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    aspect: { type: String, enum: ["16/9", "9/16"], default: "16/9" },
    cols: { type: Number, default: 2 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    is_deleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

export const ProjectCategory = model<IProjectCategory>(
  "ProjectCategory",
  projectCategorySchema
);

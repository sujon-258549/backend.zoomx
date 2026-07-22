import { Schema, model } from "mongoose";
import { IServiceCategory } from "./serviceCategory.interface";

const serviceCategorySchema = new Schema<IServiceCategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    description: { type: String, trim: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    is_deleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

export const ServiceCategory = model<IServiceCategory>(
  "ServiceCategory",
  serviceCategorySchema
);

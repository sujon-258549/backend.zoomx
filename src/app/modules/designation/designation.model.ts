import { Schema, model } from "mongoose";
import { IDesignation } from "./designation.interface";

const designationSchema = new Schema<IDesignation>(
  {
    name: { type: String, required: true },
    description: { type: String },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Designation = model<IDesignation>(
  "Designation",
  designationSchema
);

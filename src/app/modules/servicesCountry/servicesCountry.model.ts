import { Schema, model } from "mongoose";
import { IServicesCountry } from "./servicesCountry.interface";

const servicesCountrySchema = new Schema<IServicesCountry>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

export const ServicesCountry = model<IServicesCountry>(
  "ServicesCountry",
  servicesCountrySchema
);

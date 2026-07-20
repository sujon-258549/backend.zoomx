import { Schema, model } from "mongoose";
import { IBrands } from "./brands.interface";

const brandsSchema = new Schema<IBrands>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 255,
    },
    logo: {
      type: String,
      required: true,
    },
    website: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      default: null,
    },
    address: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const Brands = model<IBrands>("Brands", brandsSchema);

export default Brands;

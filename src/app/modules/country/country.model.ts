import { Schema, model } from "mongoose";
import { ICountry } from "./country.interface";

const countrySchema = new Schema<ICountry>(
  {
    name: { type: String, required: true, trim: true },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 5,
    },
    flag: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    accentSolid: { type: String, required: true, trim: true },
    serial_no: { type: Number, required: true, min: 1 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Country = model<ICountry>("Country", countrySchema);

export default Country;

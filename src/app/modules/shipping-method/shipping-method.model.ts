import { model, Schema } from "mongoose";
import { IShippingMethod } from "./shipping-method.interface";

const ShippingMethodSchema = new Schema<IShippingMethod>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    // Serial number — controls the display order at checkout. Minimum 1.
    slNumber: { type: Number, default: 1, min: 1 },
    // Exactly one method should be the default (pre-selected at checkout).
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

export const ShippingMethod = model<IShippingMethod>(
  "ShippingMethod",
  ShippingMethodSchema
);

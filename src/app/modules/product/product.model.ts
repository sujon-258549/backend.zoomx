import { Schema, model } from "mongoose";
import { IProduct, IColor, IDiscountTier } from "./product.interface";

const colorSchema = new Schema<IColor>({
  name: { type: String, required: true },
  value: { type: String, required: true },
});

const discountTierSchema = new Schema<IDiscountTier>(
  {
    minAmount: { type: Number, min: 0, default: 0 },
    discountAmount: { type: Number, min: 0, default: 0 },
    note: { type: String, trim: true },
  },
  { _id: false }
);

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    shortDescription: { type: String, trim: true },
    description: { type: String },

    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    brand: { type: String, trim: true },
    sku: { type: String, required: true, unique: true, trim: true },

    // Regular price (what the admin enters and what shows struck when on sale).
    price: { type: Number, required: true, min: 0 },
    // Discount amount off the regular price (what the admin enters).
    discount: { type: Number, default: 0, min: 0 },
    // Discounted price — computed on save as (price - discount); 0 = no discount.
    comparePrice: { type: Number, min: 0, default: 0 },
    currency: { type: String, default: "USD" },

    thumbnailId: { type: Schema.Types.ObjectId, ref: "Media" },
    galleryIds: [{ type: Schema.Types.ObjectId, ref: "Media" }],

    colors: { type: [colorSchema], default: [] },
    sizes: { type: [String], default: [] },

    discountTiers: { type: [discountTierSchema], default: [] },
    freeShipping: { type: Boolean, default: false },

    badge: { type: String, trim: true },
    inStock: { type: Boolean, default: true },
    stockQuantity: { type: Number, default: 0 },
    taxIncluded: { type: Boolean, default: true },

    liveViewers: { type: Number, default: 0 },
    estimatedDelivery: { type: String, trim: true },

    shippingInfo: { type: String },
    careInfo: { type: String },
    customInfo: { type: String },

    isHome: { type: Boolean, default: true },

    status: {
      type: String,
      enum: ["active", "draft", "archived"],
      default: "active",
    },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Pre-find hook to filter out deleted products by default
productSchema.pre(/^find/, function (next) {
  (this as any).find({ isDeleted: { $ne: true } });
  next();
});

export const Product = model<IProduct>("Product", productSchema);

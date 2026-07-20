import { model, Schema } from "mongoose";
import { ICategory } from "./category.interface";
const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, trim: true, unique: true },
    imageId: { type: Schema.Types.ObjectId, ref: "Media" },
    image: { type: Schema.Types.ObjectId, ref: "Media" },
    desc: { type: String, trim: true },
    // Serial number — controls the display order (category-wise product lists
    // are sorted by this).
    slNumber: { type: Number, default: 0 },
    isHome: { type: Boolean, default: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true, versionKey: false }
);

export const Category = model<ICategory>("Category", CategorySchema);

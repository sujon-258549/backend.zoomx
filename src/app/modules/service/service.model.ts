import { Schema, model } from "mongoose";
import { IService } from "./service.interface";

const actionSchema = new Schema(
  {
    label: { type: String, trim: true },
    href: { type: String, trim: true },
  },
  { _id: false }
);

const heroSchema = new Schema(
  {
    videoSrc: { type: String, trim: true },
    eyebrow: { type: String, trim: true },
    titleGradient: { type: String, trim: true },
    titleWhite: { type: String, trim: true },
    description: { type: String, trim: true },
    primaryAction: { type: actionSchema, default: undefined },
    secondaryAction: { type: actionSchema, default: undefined },
  },
  { _id: false }
);

const detailsSchema = new Schema(
  {
    eyebrow: { type: String, trim: true },
    titleGradient: { type: String, trim: true },
    titleWhite: { type: String, trim: true },
    image: { type: String, trim: true },
    // Rich-text HTML from the admin editor.
    body: { type: String },
  },
  { _id: false }
);

const logoSchema = new Schema(
  {
    name: { type: String, trim: true },
    src: { type: String, trim: true },
  },
  { _id: false }
);

const trustedBrandsSchema = new Schema(
  {
    eyebrow: { type: String, trim: true },
    titleGradient: { type: String, trim: true },
    titleWhite: { type: String, trim: true },
    logos: { type: [logoSchema], default: [] },
  },
  { _id: false }
);

const galleryVideoSchema = new Schema(
  {
    id: { type: String, trim: true },
    title: { type: String, trim: true },
    thumbnail: { type: String, trim: true },
  },
  { _id: false }
);

const gallerySchema = new Schema(
  {
    eyebrow: { type: String, trim: true },
    titleGradient: { type: String, trim: true },
    titleWhite: { type: String, trim: true },
    videos: { type: [galleryVideoSchema], default: [] },
  },
  { _id: false }
);

const serviceSchema = new Schema<IService>(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    thumbnail: { type: String, trim: true },
    cardImages: { type: [String], default: [] },
    categoryIds: {
      type: [Schema.Types.ObjectId],
      ref: "ServiceCategory",
      default: [],
      index: true,
    },
    hero: { type: heroSchema, default: undefined },
    trustedBrands: { type: trustedBrandsSchema, default: undefined },
    details: { type: detailsSchema, default: undefined },
    gallery: { type: gallerySchema, default: undefined },

    status: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false, index: true },
    serial_no: { type: Number, default: 0, index: true },

    is_deleted: { type: Boolean, default: false },
    author_user: { type: Schema.Types.ObjectId, ref: "User", default: null },
    last_update_by: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true, versionKey: false }
);

serviceSchema.index({ serial_no: 1, createdAt: -1 });

export const Service = model<IService>("Service", serviceSchema);

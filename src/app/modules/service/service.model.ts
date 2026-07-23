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

const sectionSchema = new Schema(
  {
    key: { type: String, trim: true, required: true },
    visible: { type: Boolean, default: true },
  },
  { _id: false }
);

// ── Per-section editable content ──
const namedItemSchema = new Schema(
  { title: { type: String, trim: true }, description: { type: String, trim: true } },
  { _id: false }
);
const statItemSchema = new Schema(
  { value: { type: String, trim: true }, label: { type: String, trim: true } },
  { _id: false }
);
const processSchema = new Schema(
  { title1: { type: String, trim: true }, title2: { type: String, trim: true }, steps: { type: [namedItemSchema], default: [] } },
  { _id: false }
);
const whyUsSchema = new Schema(
  {
    eyebrow: { type: String, trim: true },
    title1: { type: String, trim: true },
    title2: { type: String, trim: true },
    description: { type: String, trim: true },
    features: { type: [namedItemSchema], default: [] },
    stats: { type: [statItemSchema], default: [] },
  },
  { _id: false }
);
const showcaseItemSchema = new Schema(
  {
    tag: { type: String, trim: true },
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    points: { type: [String], default: [] },
    image: { type: String, trim: true },
  },
  { _id: false }
);
const showcaseSchema = new Schema(
  { items: { type: [showcaseItemSchema], default: [] } },
  { _id: false }
);
const headingListSchema = new Schema(
  {
    title1: { type: String, trim: true },
    title2: { type: String, trim: true },
    sub: { type: String, trim: true },
    items: { type: [namedItemSchema], default: [] },
  },
  { _id: false }
);
const platformItemSchema = new Schema(
  { name: { type: String, trim: true }, format: { type: String, trim: true }, ratio: { type: String, trim: true } },
  { _id: false }
);
const platformsSchema = new Schema(
  {
    title1: { type: String, trim: true },
    title2: { type: String, trim: true },
    sub: { type: String, trim: true },
    items: { type: [platformItemSchema], default: [] },
  },
  { _id: false }
);
const comparisonSchema = new Schema(
  {
    title1: { type: String, trim: true },
    title2: { type: String, trim: true },
    sub: { type: String, trim: true },
    oursLabel: { type: String, trim: true },
    othersLabel: { type: String, trim: true },
    items: { type: [String], default: [] },
  },
  { _id: false }
);
const toolItemSchema = new Schema(
  { name: { type: String, trim: true }, role: { type: String, trim: true } },
  { _id: false }
);
const toolsSchema = new Schema(
  {
    title1: { type: String, trim: true },
    title2: { type: String, trim: true },
    sub: { type: String, trim: true },
    items: { type: [toolItemSchema], default: [] },
  },
  { _id: false }
);
const faqItemSchema = new Schema(
  { q: { type: String, trim: true }, a: { type: String, trim: true } },
  { _id: false }
);
const faqSchema = new Schema(
  { items: { type: [faqItemSchema], default: [] } },
  { _id: false }
);
const logosSchema = new Schema(
  { title: { type: String, trim: true }, images: { type: [String], default: [] } },
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
    sections: { type: [sectionSchema], default: [] },
    logos: { type: logosSchema, default: undefined },
    process: { type: processSchema, default: undefined },
    whyUs: { type: whyUsSchema, default: undefined },
    showcase: { type: showcaseSchema, default: undefined },
    deliverables: { type: headingListSchema, default: undefined },
    platforms: { type: platformsSchema, default: undefined },
    comparison: { type: comparisonSchema, default: undefined },
    tools: { type: toolsSchema, default: undefined },
    faq: { type: faqSchema, default: undefined },

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

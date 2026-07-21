import { Schema, model } from "mongoose";
import { ICaseStudy } from "./caseStudy.interface";

const statSchema = new Schema(
  {
    value: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const flowItemSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const tagSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    icon: { type: String, trim: true },
  },
  { _id: false }
);

const heroSchema = new Schema(
  {
    videoSrc: { type: String, trim: true },
    videoId: { type: Schema.Types.ObjectId, ref: "Media" },
    eyebrow: { type: String, trim: true },
    titleGradient: { type: String, trim: true },
    description: { type: String, trim: true },
  },
  { _id: false }
);

const blockSchema = new Schema(
  {
    title: { type: String, trim: true },
    summary: { type: String, trim: true },
    items: { type: [flowItemSchema], default: [] },
  },
  { _id: false }
);

const growthSchema = new Schema(
  {
    title: { type: String, trim: true },
    summary: { type: String, trim: true },
    stats: { type: [statSchema], default: [] },
  },
  { _id: false }
);

const detailsSchema = new Schema(
  {
    tags: { type: [tagSchema], default: [] },
    hero: { type: heroSchema, default: undefined },
    challenges: { type: blockSchema, default: undefined },
    solutions: { type: blockSchema, default: undefined },
    growth: { type: growthSchema, default: undefined },
  },
  { _id: false }
);

const caseStudySchema = new Schema<ICaseStudy>(
  {
    index: { type: String, trim: true },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    quote: {
      lead: { type: String, required: true, trim: true },
      punch: { type: String, required: true, trim: true },
    },
    author: {
      name: { type: String, required: true, trim: true },
      role: { type: String, required: true, trim: true },
      avatar: { type: String, trim: true },
      avatarId: { type: Schema.Types.ObjectId, ref: "Media" },
    },
    stats: { type: [statSchema], default: [] },
    // Card media — always a video. Store both the Media id (canonical) and the
    // resolved URL (mirrors how the blog module keeps thumbnail + thumbnailId).
    video_url: { type: String, trim: true },
    videoId: { type: Schema.Types.ObjectId, ref: "Media" },
    categoryIds: {
      type: [Schema.Types.ObjectId],
      ref: "CaseStudyCategory",
      default: [],
      index: true,
    },
    details: { type: detailsSchema, default: undefined },

    status: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false, index: true },
    serial_no: { type: Number, default: 0, index: true },

    is_deleted: { type: Boolean, default: false },
    author_user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    last_update_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

caseStudySchema.index({ serial_no: 1, createdAt: -1 });

export const CaseStudy = model<ICaseStudy>("CaseStudy", caseStudySchema);

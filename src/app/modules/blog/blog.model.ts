import { model } from "mongoose";
import { IBlog } from "./blog.interface";

const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    thumbnail: {
      type: String,
    },
    thumbnailId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Media",
    },
    coverImage: {
      type: String,
    },
    coverImageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Media",
    },
    sort_description: {
      type: String,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    content: {
      type: String,
    },
    excerpt: {
      type: String,
    },
    category: {
      type: String,
    },
    // Multi-category support. Refers to the Category collection (which serves
    // as blog categories in this project). Populate: 'categoryIds'.
    categoryIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Category",
      default: [],
      index: true,
    },
    status: {
      type: Boolean,
      default: false,
    },
    // Editorial pick — admin controls via a toggle. Powers "Featured Posts".
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Auto-incremented on each detail page view. Powers "Top Rated Posts".
    viewCount: {
      type: Number,
      default: 0,
      index: true,
    },

    is_deleted: {
      type: Boolean,
      default: false,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    last_update_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

blogSchema.index({ createdAt: -1 });
blogSchema.index({ createdAt: 1 });
blogSchema.index({ title: 1 });
blogSchema.index({ title: -1 });
blogSchema.index({ category: 1 });

export const Blog = model<IBlog>("Blog", blogSchema);

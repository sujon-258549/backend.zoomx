import { Schema, model } from "mongoose";
import { IMedia } from "./media-library.interface";

const mediaSchema = new Schema<IMedia>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: Number,
      default: 0,
    },
    type: {
      type: String,
      default: "application/octet-stream",
    },
    mediaType: {
      type: String,
      enum: ["image", "video", "audio", "document", "other"],
      default: "other",
    },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    // The folder ↔ media relationship. `null` = media is not inside any folder.
    folder: {
      type: Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Fast "media in this folder" lookups.
mediaSchema.index({ folder: 1, createdAt: -1 });

export const Media = model<IMedia>("Media", mediaSchema);

export default Media;

import { model, Schema } from 'mongoose';
import {
  DYNAMIC_CONTENT_TYPES,
  IDynamicContent,
  IDynamicContentHistory,
} from './dynamicContent.interface';

const DynamicContentSchema = new Schema<IDynamicContent>(
  {
    key: { type: String, required: true, unique: true, trim: true, index: true },
    name: { type: String, trim: true },
    value: { type: Schema.Types.Mixed },
    // Image URL from the media library. Kept as a plain string to match how
    // industry.iconUrl etc. are stored in this project — no separate Image
    // collection needed.
    imageUrl: { type: String, trim: true },
    group: { type: String, default: 'general', trim: true, index: true },
    type: {
      type: String,
      enum: DYNAMIC_CONTENT_TYPES,
      default: 'text',
    },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true, index: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, versionKey: false, minimize: false }
);

// Compound index for the common "list active items in a group" query.
DynamicContentSchema.index({ group: 1, isActive: 1 });

export const DynamicContent = model<IDynamicContent>(
  'DynamicContent',
  DynamicContentSchema
);

const DynamicContentHistorySchema = new Schema<IDynamicContentHistory>(
  {
    dynamicContentId: {
      type: Schema.Types.ObjectId,
      ref: 'DynamicContent',
      required: true,
      index: true,
    },
    // Duplicated so history entries stay useful even if the parent is
    // deleted, and so audit queries can filter by key without a join.
    key: { type: String, required: true, index: true },
    oldValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, versionKey: false, minimize: false }
);

export const DynamicContentHistory = model<IDynamicContentHistory>(
  'DynamicContentHistory',
  DynamicContentHistorySchema
);

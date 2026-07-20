import { Types } from 'mongoose';

// Allowed content types. `value` is Mixed at the DB layer so it can hold
// strings, html blobs, numbers, arrays, or nested objects — but callers
// should use `type` to tell the frontend how to render/interpret it.
export type DynamicContentType =
  | 'text'
  | 'html'
  | 'image'
  | 'number'
  | 'boolean'
  | 'json';

export const DYNAMIC_CONTENT_TYPES: DynamicContentType[] = [
  'text',
  'html',
  'image',
  'number',
  'boolean',
  'json',
];

export interface IDynamicContent {
  key: string;
  name?: string;
  value?: unknown;
  imageUrl?: string;
  group: string;
  type: DynamicContentType;
  description?: string;
  isActive: boolean;
  updatedBy?: Types.ObjectId | string;
}

export interface IDynamicContentHistory {
  dynamicContentId: Types.ObjectId | string;
  key: string;
  oldValue?: unknown;
  newValue?: unknown;
  updatedBy?: Types.ObjectId | string;
}

import { Document, Types } from "mongoose";

export type MediaType = "image" | "video" | "audio" | "document" | "other";

export interface IMedia extends Document {
  // R2 object key (the actual stored file). This is what we build the public
  // URL from and what we delete/copy in R2.
  key: string;
  // Display name shown in the UI (can be renamed without touching R2).
  name: string;
  size: number; // bytes
  type: string; // mime type
  mediaType: MediaType;
  width?: number | null;
  height?: number | null;
  // The relationship: which folder this media lives in. `null` = not in any
  // folder (bucket root / top level).
  folder?: Types.ObjectId | null;
  createdBy?: Types.ObjectId | null;
  is_deleted: boolean;
}

import { Types } from "mongoose";

export interface IBlog {
  _id?: string;
  title: string;
  /** Public URL of the thumbnail image (also stored on the Media doc). */
  thumbnail?: string;
  /** Media document ObjectId — the canonical reference to the thumbnail. */
  thumbnailId?: Types.ObjectId | string;
  /** Public URL of the cover image (also stored on the Media doc). */
  coverImage?: string;
  /** Media document ObjectId — the canonical reference to the cover image. */
  coverImageId?: Types.ObjectId | string;
  sort_description?: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  category?: string;
  /** Multi-category. Preferred over the legacy `category` string field. */
  categoryIds?: (Types.ObjectId | string)[];
  status: boolean;
  /** Editorially promoted — admin toggle for the frontend "Featured Posts" strip. */
  isFeatured?: boolean;
  /** Auto-incremented on each detail page view — drives "Top Rated Posts". */
  viewCount?: number;
  is_deleted?: boolean;
  author: Types.ObjectId | string;
  last_update_by?: Types.ObjectId | string;

  createdAt?: Date;
  updatedAt?: Date;
}

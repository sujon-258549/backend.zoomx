import { Types } from "mongoose";

export interface IBlog {
  _id?: string;
  title: string;
  thumbnail?: string;
  sort_description?: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  category?: string;
  tags?: string[];
  status: boolean;
  is_deleted?: boolean;
  author: Types.ObjectId | string;
  last_update_by?: Types.ObjectId | string;
  seo?: {
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
  };

  createdAt?: Date;
  updatedAt?: Date;
}

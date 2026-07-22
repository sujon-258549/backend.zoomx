import { Types } from "mongoose";

export interface IServiceAction {
  label?: string;
  href?: string;
}

export interface IServiceHero {
  videoSrc?: string;
  eyebrow?: string;
  titleGradient?: string;
  titleWhite?: string;
  description?: string;
  primaryAction?: IServiceAction;
  secondaryAction?: IServiceAction;
}

export interface IServiceDetails {
  eyebrow?: string;
  titleGradient?: string;
  titleWhite?: string;
  image?: string;
  /** Rich-text HTML body shown on the details page. */
  body?: string;
}

export interface IServiceLogo {
  name?: string;
  src?: string;
}

export interface IServiceTrustedBrands {
  eyebrow?: string;
  titleGradient?: string;
  titleWhite?: string;
  logos?: IServiceLogo[];
}

export interface IServiceGalleryVideo {
  /** YouTube video id (played in the lightbox). */
  id?: string;
  title?: string;
  thumbnail?: string;
}

export interface IServiceGallery {
  eyebrow?: string;
  titleGradient?: string;
  titleWhite?: string;
  videos?: IServiceGalleryVideo[];
}

export interface IService {
  _id?: string;
  /** Service name — used for the list, nav tab and card. */
  name: string;
  slug?: string;
  /** List/card thumbnail. */
  thumbnail?: string;
  /** Optional stack of card images (marketing collage). */
  cardImages?: string[];
  /** Multi-category — refs the ServiceCategory collection. */
  categoryIds?: (Types.ObjectId | string)[];
  hero?: IServiceHero;
  trustedBrands?: IServiceTrustedBrands;
  details?: IServiceDetails;
  gallery?: IServiceGallery;

  /** Published/visible on the public site. */
  status: boolean;
  /** Editorial pick — surfaced first. */
  isFeatured?: boolean;
  /** Manual ordering (asc). */
  serial_no?: number;

  is_deleted?: boolean;
  author_user?: Types.ObjectId | string;
  last_update_by?: Types.ObjectId | string;

  createdAt?: Date;
  updatedAt?: Date;
}

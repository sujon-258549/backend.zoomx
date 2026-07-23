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

/** One section on the service details page — controls order + visibility. */
export interface IServiceSection {
  key: string;
  visible?: boolean;
}

/* ── Per-section editable content (text/lists only; visuals stay fixed) ── */
export interface INamedItem {
  title?: string;
  description?: string;
}
export interface IStatItem {
  value?: string;
  label?: string;
}
export interface IServiceProcess {
  title1?: string;
  title2?: string;
  steps?: INamedItem[];
}
export interface IServiceWhyUs {
  eyebrow?: string;
  title1?: string;
  title2?: string;
  description?: string;
  features?: INamedItem[];
  stats?: IStatItem[];
}
export interface IShowcaseItem {
  tag?: string;
  title?: string;
  description?: string;
  points?: string[];
  image?: string;
}
export interface IServiceShowcase {
  items?: IShowcaseItem[];
}
export interface IServiceDeliverables {
  title1?: string;
  title2?: string;
  sub?: string;
  items?: INamedItem[];
}
export interface IPlatformItem {
  name?: string;
  format?: string;
  ratio?: string;
}
export interface IServicePlatforms {
  title1?: string;
  title2?: string;
  sub?: string;
  items?: IPlatformItem[];
}
export interface IServiceComparison {
  title1?: string;
  title2?: string;
  sub?: string;
  oursLabel?: string;
  othersLabel?: string;
  items?: string[];
}
export interface IToolItem {
  name?: string;
  role?: string;
}
export interface IServiceTools {
  title1?: string;
  title2?: string;
  sub?: string;
  items?: IToolItem[];
}
export interface IFaqItem {
  q?: string;
  a?: string;
}
export interface IServiceFaq {
  items?: IFaqItem[];
}
export interface IServiceLogos {
  title?: string;
  /** Logo image URLs shown in the marquee. */
  images?: string[];
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
  /** Ordered list of detail-page sections with per-section visibility. */
  sections?: IServiceSection[];
  /** Per-section editable content. */
  logos?: IServiceLogos;
  process?: IServiceProcess;
  whyUs?: IServiceWhyUs;
  showcase?: IServiceShowcase;
  deliverables?: IServiceDeliverables;
  platforms?: IServicePlatforms;
  comparison?: IServiceComparison;
  tools?: IServiceTools;
  faq?: IServiceFaq;

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

import { Types } from "mongoose";

/** A single `{ value, label }` metric — used on the card and the growth chart. */
export interface IStat {
  value: string;
  label: string;
}

/** A titled bullet — used in the challenges/solutions flow lists. */
export interface IFlowItem {
  title: string;
  description: string;
}

/** A pill on the details page (label + lucide icon name). */
export interface ITag {
  label: string;
  icon?: string;
}

export interface ICaseStudyHero {
  videoSrc?: string;
  /** Media document id for the hero video (resolved to `videoSrc` at response time). */
  videoId?: Types.ObjectId | string;
  eyebrow?: string;
  /** Single hero title. */
  titleGradient: string;
  description?: string;
}

export interface ICaseStudyBlock {
  title: string;
  summary?: string;
  items: IFlowItem[];
}

export interface ICaseStudyGrowth {
  title: string;
  summary?: string;
  stats: IStat[];
}

export interface ICaseStudyDetails {
  tags?: ITag[];
  hero: ICaseStudyHero;
  challenges: ICaseStudyBlock;
  solutions: ICaseStudyBlock;
  growth: ICaseStudyGrowth;
}

export interface ICaseStudy {
  _id?: string;
  /** Display order label shown on the card, e.g. "01". */
  index?: string;
  slug?: string;
  quote: { lead: string; punch: string };
  author: {
    name: string;
    role: string;
    avatar?: string;
    /** Media document id for the avatar image (resolved to `avatar` at response time). */
    avatarId?: Types.ObjectId | string;
  };
  /** Two or three headline metrics rendered on the card. */
  stats: IStat[];
  /** Card media — always a video. */
  video_url?: string;
  videoId?: Types.ObjectId | string;
  /** Multi-category — refs the CaseStudyCategory collection. */
  categoryIds?: (Types.ObjectId | string)[];
  /** Full details rendered on /case-study/[slug]. */
  details?: ICaseStudyDetails;

  /** Published/visible on the public site. */
  status: boolean;
  /** Editorial pick — surfaced first / on the home strip. */
  isFeatured?: boolean;
  /** Manual ordering for the list (asc). */
  serial_no?: number;

  is_deleted?: boolean;
  author_user?: Types.ObjectId | string;
  last_update_by?: Types.ObjectId | string;

  createdAt?: Date;
  updatedAt?: Date;
}

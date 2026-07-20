import { Types } from "mongoose";

export type TProductStatus = "active" | "draft" | "archived";

export interface IColor {
  name: string;
  value: string;
}

// An amount-tiered cart discount, e.g. "Buy ৳1000+ of this product → ৳50 off".
// All qualifying tiers stack (their `discountAmount`s are summed at order time).
// Applies only to the line for this product — never across other products.
export interface IDiscountTier {
  minAmount: number;
  discountAmount: number;
  note?: string;
}

export interface IProduct {
  name: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  
  categoryId: Types.ObjectId | string;
  brand?: string;
  sku: string;
  
  // `price` is always the regular price. `discount` is the flat ৳ amount off.
  // `comparePrice` is the resulting discounted price (price − discount, never
  // above `price`); 0 means "no discount". The customer pays `comparePrice`
  // when it is > 0, otherwise `price`.
  price: number;
  discount?: number;
  comparePrice?: number;
  currency: string;
  
  thumbnailId?: Types.ObjectId | string;
  galleryIds?: (Types.ObjectId | string)[];
  
  colors?: IColor[];
  sizes?: string[];

  // Amount-tiered cart discounts (all qualifying tiers stack).
  discountTiers?: IDiscountTier[];
  // When true, this product always ships free — the order's delivery is free if
  // any line has it on.
  freeShipping?: boolean;

  badge?: string;
  inStock: boolean;
  stockQuantity?: number;
  taxIncluded: boolean;
  
  liveViewers?: number;
  estimatedDelivery?: string;
  
  shippingInfo?: string;
  careInfo?: string;
  customInfo?: string;
  
  isHome?: boolean;

  status: TProductStatus;
  isDeleted: boolean;
  
  createdAt?: Date;
  updatedAt?: Date;
}

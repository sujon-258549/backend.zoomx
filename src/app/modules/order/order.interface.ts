import { Types } from "mongoose";

export interface IOrderItem {
  productId?: Types.ObjectId | string;
  slug: string;
  name: string;
  // Product SKU, denormalised at order time so it stays on the order history.
  sku?: string;
  // Product thumbnail URL, denormalised at order time for the order history.
  image?: string;
  // Selected variant (optional — a product may have no colours/sizes).
  size?: string;
  color?: string;
  qty: number;
  // Selling price per unit, resolved server-side from the product.
  unitPrice: number;
  lineTotal: number;
  // Highest qualifying discount tier for this line (tiers do not stack).
  lineDiscount: number;
}

// An internal note an admin adds to an order (follow-up, call outcome, etc.).
export interface IAdminNote {
  text: string;
  author?: string;
  createdAt: Date;
}

export type OrderStatus =
  | "pending"
  | "no-response"
  | "hold"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

// The statuses an admin can move an order into from the order screens.
export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "no-response",
  "hold",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

export interface IOrder {
  orderNumber: string;
  items: IOrderItem[];
  customerName: string;
  phone: string;
  address: string;
  shippingMethodTitle: string;
  shippingCost: number;
  subtotal: number;
  // Total offer discount applied across all lines.
  discount: number;
  // Whether the order qualified for free delivery.
  freeDelivery: boolean;
  total: number;
  paymentMethod: "cod";
  status: OrderStatus;
  // The customer's own note left at checkout (never overwritten by admins).
  notes?: string;
  // Internal notes/follow-ups added by admins, newest last.
  adminNotes?: IAdminNote[];
  // Client IP the order was placed from (anti-spam / auditing).
  ip?: string;
  // Soft delete — deleted orders move to the Order Bin, not removed outright.
  isDeleted?: boolean;
  deletedAt?: Date;
}

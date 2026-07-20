import { OrderStatus } from "../order/order.interface";

export const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// Number of recent months to include in the monthly performance chart.
export const MONTHLY_PERFORMANCE_WINDOW = 6;

// Display label + chart colour for each order status. Shared shape used by
// the "orders by status" widget and the recent-orders badges.
export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; color: string }
> = {
  pending: { label: "Pending", color: "#f59e0b" },
  "no-response": { label: "No Response", color: "#6b7280" },
  hold: { label: "On Hold", color: "#8b5cf6" },
  confirmed: { label: "Confirmed", color: "#3b82f6" },
  shipped: { label: "Shipped", color: "#06b6d4" },
  delivered: { label: "Delivered", color: "#10b981" },
  cancelled: { label: "Cancelled", color: "#ef4444" },
};

// Statuses that count toward realised revenue (a confirmed order is money we
// expect to collect; pending / cancelled / no-response are excluded).
export const REVENUE_STATUSES: OrderStatus[] = [
  "confirmed",
  "shipped",
  "delivered",
];

export const TOP_PRODUCTS_LIMIT = 5;
export const RECENT_ORDERS_LIMIT = 8;

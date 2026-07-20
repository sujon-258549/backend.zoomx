export type DashboardStatKey = "revenue" | "orders" | "products" | "categories";

export interface IDashboardStat {
  key: DashboardStatKey;
  title: string;
  value: number | string;
  change: string;
  trend: "up" | "down" | "neutral";
}

// One slice of the "orders by status" widget.
export interface IOrderStatusItem {
  status: string;
  label: string;
  count: number;
  color: string;
}

export interface IMonthlyPerformanceItem {
  month: string;
  revenue: number;
  orders: number;
}

export interface ITopProductItem {
  name: string;
  image: string | null;
  sold: number;
  revenue: number;
}

export interface IRecentOrderItem {
  orderNumber: string;
  customerName: string;
  total: number;
  itemsCount: number;
  status: string;
  statusLabel: string;
  statusColor: string;
  createdAt: string;
}

export interface IRevenueSummary {
  today: number;
  week: number;
  month: number;
  total: number;
}

export interface ITrafficSourceItem {
  name: string;
  value: number;
}

export interface IWeeklyActivityItem {
  day: string;
  views: number;
  clicks: number;
}

export interface IQuickStats {
  page_views: number;
  unique_visitors: number;
  bounce_rate: number;
  avg_session_seconds: number;
}

export interface IDashboardOverview {
  stats: IDashboardStat[];
  revenue_summary: IRevenueSummary;
  order_status: IOrderStatusItem[];
  monthly_performance: IMonthlyPerformanceItem[];
  top_products: ITopProductItem[];
  recent_orders: IRecentOrderItem[];
  traffic_sources: ITrafficSourceItem[];
  weekly_activity: IWeeklyActivityItem[];
  quick_stats: IQuickStats;
}

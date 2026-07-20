import { Category } from "../category/category.model";
import { Order } from "../order/order.model";
import { ORDER_STATUSES, OrderStatus } from "../order/order.interface";
import { PageViewServices } from "../pageView/pageView.service";
import { Product } from "../product/product.model";
import {
  MONTHLY_PERFORMANCE_WINDOW,
  MONTH_LABELS,
  ORDER_STATUS_META,
  RECENT_ORDERS_LIMIT,
  REVENUE_STATUSES,
  TOP_PRODUCTS_LIMIT,
} from "./dashboard.constant";
import {
  IDashboardOverview,
  IDashboardStat,
  IMonthlyPerformanceItem,
  IOrderStatusItem,
  IQuickStats,
  IRecentOrderItem,
  IRevenueSummary,
  ITopProductItem,
  ITrafficSourceItem,
  IWeeklyActivityItem,
} from "./dashboard.interface";

/* =========================================================
   Date helpers
========================================================= */

const startOfMonth = (year: number, month: number) =>
  new Date(year, month, 1, 0, 0, 0, 0);

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfWeek = () => {
  const d = startOfToday();
  // Week starts on Sunday.
  d.setDate(d.getDate() - d.getDay());
  return d;
};

const formatTrend = (current: number, previous: number) => {
  if (previous === 0 && current === 0) {
    return { change: "0%", trend: "neutral" as const };
  }
  if (previous === 0) {
    return { change: "+100%", trend: "up" as const };
  }
  const diff = ((current - previous) / previous) * 100;
  const rounded = Math.round(diff * 10) / 10;
  if (rounded === 0) return { change: "0%", trend: "neutral" as const };
  const sign = rounded > 0 ? "+" : "";
  return {
    change: `${sign}${rounded}%`,
    trend: rounded > 0 ? ("up" as const) : ("down" as const),
  };
};

const buildMonthRange = (windowSize: number) => {
  const now = new Date();
  const months: { label: string; start: Date; end: Date }[] = [];
  for (let i = windowSize - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = startOfMonth(d.getFullYear(), d.getMonth());
    const end = startOfMonth(d.getFullYear(), d.getMonth() + 1);
    months.push({ label: MONTH_LABELS[d.getMonth()], start, end });
  }
  return months;
};

/* =========================================================
   Revenue helpers
========================================================= */

// Sum of `total` for revenue-qualifying, non-deleted orders in a date window.
const sumRevenue = async (
  dateRange?: { $gte?: Date; $lt?: Date }
): Promise<number> => {
  const match: Record<string, unknown> = {
    isDeleted: { $ne: true },
    status: { $in: REVENUE_STATUSES },
  };
  if (dateRange) match.createdAt = dateRange;

  const rows = await Order.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: "$total" } } },
  ]);
  return rows[0]?.total ?? 0;
};

const countOrders = async (dateRange?: {
  $gte?: Date;
  $lt?: Date;
}): Promise<number> => {
  const match: Record<string, unknown> = { isDeleted: { $ne: true } };
  if (dateRange) match.createdAt = dateRange;
  return Order.countDocuments(match);
};

/* =========================================================
   Stats grid (top 4 cards)
========================================================= */

const buildStats = async (): Promise<IDashboardStat[]> => {
  const now = new Date();
  const startThisMonth = startOfMonth(now.getFullYear(), now.getMonth());
  const startLastMonth = startOfMonth(now.getFullYear(), now.getMonth() - 1);

  const [
    revenueThisMonth,
    revenueLastMonth,
    ordersThisMonth,
    ordersLastMonth,
    totalProducts,
    productsThisMonth,
    productsLastMonth,
    totalCategories,
  ] = await Promise.all([
    sumRevenue({ $gte: startThisMonth }),
    sumRevenue({ $gte: startLastMonth, $lt: startThisMonth }),
    countOrders({ $gte: startThisMonth }),
    countOrders({ $gte: startLastMonth, $lt: startThisMonth }),
    Product.countDocuments({ isDeleted: { $ne: true } }),
    Product.countDocuments({
      isDeleted: { $ne: true },
      createdAt: { $gte: startThisMonth },
    }),
    Product.countDocuments({
      isDeleted: { $ne: true },
      createdAt: { $gte: startLastMonth, $lt: startThisMonth },
    }),
    // Total product categories.
    Category.countDocuments({}),
  ]);

  const revenueTrend = formatTrend(revenueThisMonth, revenueLastMonth);
  const ordersTrend = formatTrend(ordersThisMonth, ordersLastMonth);
  const productsTrend = formatTrend(productsThisMonth, productsLastMonth);

  return [
    {
      key: "revenue",
      title: "Revenue (This Month)",
      value: revenueThisMonth,
      change: revenueTrend.change,
      trend: revenueTrend.trend,
    },
    {
      key: "orders",
      title: "Orders (This Month)",
      value: ordersThisMonth,
      change: ordersTrend.change,
      trend: ordersTrend.trend,
    },
    {
      key: "products",
      title: "Total Products",
      value: totalProducts,
      change: productsTrend.change,
      trend: productsTrend.trend,
    },
    {
      key: "categories",
      title: "Total Categories",
      value: totalCategories,
      change: "0%",
      trend: "neutral",
    },
  ];
};

/* =========================================================
   Revenue summary (today / week / month / all-time)
========================================================= */

const buildRevenueSummary = async (): Promise<IRevenueSummary> => {
  const now = new Date();
  const monthStart = startOfMonth(now.getFullYear(), now.getMonth());

  const [today, week, month, total] = await Promise.all([
    sumRevenue({ $gte: startOfToday() }),
    sumRevenue({ $gte: startOfWeek() }),
    sumRevenue({ $gte: monthStart }),
    sumRevenue(),
  ]);

  return { today, week, month, total };
};

/* =========================================================
   Orders by status (donut / list widget)
========================================================= */

const buildOrderStatus = async (): Promise<IOrderStatusItem[]> => {
  const grouped = await Order.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const counts = new Map<string, number>();
  for (const row of grouped) counts.set(row._id, row.count);

  // Always return every known status (0 when none) in a stable order.
  return ORDER_STATUSES.map((status: OrderStatus) => ({
    status,
    label: ORDER_STATUS_META[status].label,
    color: ORDER_STATUS_META[status].color,
    count: counts.get(status) ?? 0,
  }));
};

/* =========================================================
   Monthly performance (revenue + orders per month)
========================================================= */

const buildMonthlyPerformance = async (): Promise<
  IMonthlyPerformanceItem[]
> => {
  const months = buildMonthRange(MONTHLY_PERFORMANCE_WINDOW);
  const earliest = months[0].start;
  const latest = months[months.length - 1].end;

  const grouped = await Order.aggregate([
    {
      $match: {
        isDeleted: { $ne: true },
        createdAt: { $gte: earliest, $lt: latest },
      },
    },
    {
      $group: {
        _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } },
        orders: { $sum: 1 },
        // Only revenue-qualifying orders contribute to the revenue line.
        revenue: {
          $sum: {
            $cond: [
              { $in: ["$status", REVENUE_STATUSES] },
              "$total",
              0,
            ],
          },
        },
      },
    },
  ]);

  const map = new Map<string, { orders: number; revenue: number }>();
  for (const row of grouped) {
    map.set(`${row._id.y}-${row._id.m}`, {
      orders: row.orders,
      revenue: row.revenue,
    });
  }

  return months.map((m) => {
    const key = `${m.start.getFullYear()}-${m.start.getMonth() + 1}`;
    const entry = map.get(key);
    return {
      month: m.label,
      revenue: entry?.revenue ?? 0,
      orders: entry?.orders ?? 0,
    };
  });
};

/* =========================================================
   Top selling products
========================================================= */

const buildTopProducts = async (): Promise<ITopProductItem[]> => {
  const rows = await Order.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    { $unwind: "$items" },
    {
      $group: {
        _id: { $ifNull: ["$items.productId", "$items.name"] },
        name: { $first: "$items.name" },
        image: { $first: "$items.image" },
        sold: { $sum: "$items.qty" },
        revenue: { $sum: "$items.lineTotal" },
      },
    },
    { $sort: { sold: -1 } },
    { $limit: TOP_PRODUCTS_LIMIT },
  ]);

  return rows.map((r) => ({
    name: r.name ?? "Unknown product",
    image: r.image ?? null,
    sold: r.sold ?? 0,
    revenue: r.revenue ?? 0,
  }));
};

/* =========================================================
   Recent orders
========================================================= */

const buildRecentOrders = async (): Promise<IRecentOrderItem[]> => {
  const orders = await Order.find({ isDeleted: { $ne: true } })
    .sort({ createdAt: -1 })
    .limit(RECENT_ORDERS_LIMIT)
    .select("orderNumber customerName total items status createdAt")
    .lean();

  return orders.map((o: any) => {
    const meta =
      ORDER_STATUS_META[o.status as OrderStatus] ??
      ORDER_STATUS_META.pending;
    return {
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      total: o.total ?? 0,
      itemsCount: Array.isArray(o.items) ? o.items.length : 0,
      status: o.status,
      statusLabel: meta.label,
      statusColor: meta.color,
      createdAt: o.createdAt
        ? new Date(o.createdAt).toISOString()
        : new Date().toISOString(),
    };
  });
};

/* =========================================================
   Visitor analytics — delegated to the PageView module
========================================================= */

const buildTrafficSources = async (): Promise<ITrafficSourceItem[]> =>
  PageViewServices.buildTrafficSources();

const buildWeeklyActivity = async (): Promise<IWeeklyActivityItem[]> =>
  PageViewServices.buildWeeklyActivity();

const buildQuickStats = async (): Promise<IQuickStats> =>
  PageViewServices.buildQuickStats();

/* =========================================================
   Aggregated overview
========================================================= */

const getOverview = async (): Promise<IDashboardOverview> => {
  const [
    stats,
    revenueSummary,
    orderStatus,
    monthlyPerformance,
    topProducts,
    recentOrders,
    trafficSources,
    weeklyActivity,
    quickStats,
  ] = await Promise.all([
    buildStats(),
    buildRevenueSummary(),
    buildOrderStatus(),
    buildMonthlyPerformance(),
    buildTopProducts(),
    buildRecentOrders(),
    buildTrafficSources(),
    buildWeeklyActivity(),
    buildQuickStats(),
  ]);

  return {
    stats,
    revenue_summary: revenueSummary,
    order_status: orderStatus,
    monthly_performance: monthlyPerformance,
    top_products: topProducts,
    recent_orders: recentOrders,
    traffic_sources: trafficSources,
    weekly_activity: weeklyActivity,
    quick_stats: quickStats,
  };
};

export const DashboardServices = {
  getOverview,
  buildStats,
  buildRevenueSummary,
  buildOrderStatus,
  buildMonthlyPerformance,
  buildTopProducts,
  buildRecentOrders,
  buildTrafficSources,
  buildWeeklyActivity,
  buildQuickStats,
};

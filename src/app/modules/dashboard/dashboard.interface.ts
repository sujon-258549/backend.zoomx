export type DashboardStatKey =
  | "blogs"
  | "projects"
  | "caseStudies"
  | "categories";

export interface IDashboardStat {
  key: DashboardStatKey;
  title: string;
  value: number | string;
  change: string;
  trend: "up" | "down" | "neutral";
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
  traffic_sources: ITrafficSourceItem[];
  weekly_activity: IWeeklyActivityItem[];
  quick_stats: IQuickStats;
}

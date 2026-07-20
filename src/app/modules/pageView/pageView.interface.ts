export type TrafficSource =
  | "Direct"
  | "Organic Search"
  | "Social Media"
  | "Referral";

export type DeviceType = "desktop" | "mobile" | "tablet" | "unknown";

export interface IPageView {
  path: string;
  full_url?: string;
  referrer?: string;
  source: TrafficSource;
  session_id: string;
  visitor_id?: string;
  user_agent?: string;
  browser?: string;
  os?: string;
  device: DeviceType;
  ip_address?: string;
  country?: string;
  is_bot: boolean;
  duration_ms?: number;
  timestamp: Date;
}

export interface IPageViewStats {
  page_views: number;
  unique_visitors: number;
  bounce_rate: number;
  avg_session_seconds: number;
}

export interface IPageViewTrafficSource {
  name: TrafficSource;
  value: number;
}

export interface IPageViewWeeklyActivity {
  day: string;
  views: number;
  clicks: number;
}

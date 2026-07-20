import { TrafficSource } from "./pageView.interface";

export const TRAFFIC_SOURCES: TrafficSource[] = [
  "Direct",
  "Organic Search",
  "Social Media",
  "Referral",
];

// Hostnames whose referrers map to "Organic Search"
export const SEARCH_ENGINE_HOSTS = [
  "google.",
  "bing.",
  "duckduckgo.",
  "yahoo.",
  "yandex.",
  "baidu.",
  "ecosia.",
  "brave.",
  "qwant.",
];

// Hostnames whose referrers map to "Social Media"
export const SOCIAL_MEDIA_HOSTS = [
  "facebook.",
  "fb.",
  "instagram.",
  "twitter.",
  "x.com",
  "linkedin.",
  "lnkd.",
  "youtube.",
  "youtu.be",
  "tiktok.",
  "pinterest.",
  "reddit.",
  "whatsapp.",
  "telegram.",
  "t.me",
  "snapchat.",
  "threads.",
];

// User-Agent fragments commonly seen from bots/crawlers — excluded from analytics
export const BOT_USER_AGENT_FRAGMENTS = [
  "bot",
  "crawler",
  "spider",
  "slurp",
  "facebookexternalhit",
  "embedly",
  "quora link preview",
  "outbrain",
  "vkshare",
  "headless",
  "lighthouse",
  "applebot",
  "preview",
  "monitor",
  "pingdom",
  "uptime",
];

// How long after the last hit a session is still considered alive (minutes)
export const SESSION_INACTIVITY_MINUTES = 30;

// How many recent days to include in the weekly activity chart
export const WEEKLY_ACTIVITY_WINDOW_DAYS = 7;

// Window for quick-stats calculations (days)
export const QUICK_STATS_WINDOW_DAYS = 30;

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

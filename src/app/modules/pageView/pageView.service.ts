import {
  BOT_USER_AGENT_FRAGMENTS,
  QUICK_STATS_WINDOW_DAYS,
  SEARCH_ENGINE_HOSTS,
  SESSION_INACTIVITY_MINUTES,
  SOCIAL_MEDIA_HOSTS,
  TRAFFIC_SOURCES,
  WEEKDAY_LABELS,
  WEEKLY_ACTIVITY_WINDOW_DAYS,
} from "./pageView.constant";
import {
  DeviceType,
  IPageView,
  IPageViewStats,
  IPageViewTrafficSource,
  IPageViewWeeklyActivity,
  TrafficSource,
} from "./pageView.interface";
import { PageView } from "./pageView.model";

/* =========================================================
   Helpers
========================================================= */

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);

const detectIsBot = (userAgent?: string) => {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENT_FRAGMENTS.some((frag) => ua.includes(frag));
};

const detectDevice = (userAgent?: string): DeviceType => {
  if (!userAgent) return "unknown";
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|playbook|silk/i.test(ua)) return "tablet";
  if (/mobile|iphone|android.+mobile|windows phone/i.test(ua)) return "mobile";
  if (/mozilla|chrome|safari|firefox|edge|opera/i.test(ua)) return "desktop";
  return "unknown";
};

const detectBrowser = (userAgent?: string): string | undefined => {
  if (!userAgent) return undefined;
  const ua = userAgent.toLowerCase();
  if (ua.includes("edg/")) return "Edge";
  if (ua.includes("chrome/") && !ua.includes("edg/")) return "Chrome";
  if (ua.includes("firefox/")) return "Firefox";
  if (ua.includes("safari/") && !ua.includes("chrome/")) return "Safari";
  if (ua.includes("opera/") || ua.includes("opr/")) return "Opera";
  return undefined;
};

const detectOS = (userAgent?: string): string | undefined => {
  if (!userAgent) return undefined;
  const ua = userAgent.toLowerCase();
  if (ua.includes("windows")) return "Windows";
  if (ua.includes("mac os")) return "macOS";
  if (ua.includes("android")) return "Android";
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ios"))
    return "iOS";
  if (ua.includes("linux")) return "Linux";
  return undefined;
};

const classifyReferrer = (referrer?: string): TrafficSource => {
  if (!referrer) return "Direct";
  let host = "";
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return "Direct";
  }
  if (!host) return "Direct";

  if (SEARCH_ENGINE_HOSTS.some((h) => host.includes(h))) return "Organic Search";
  if (SOCIAL_MEDIA_HOSTS.some((h) => host.includes(h))) return "Social Media";
  return "Referral";
};

/* =========================================================
   Tracking
========================================================= */

interface TrackInput {
  path: string;
  full_url?: string;
  referrer?: string;
  session_id: string;
  visitor_id?: string;
  duration_ms?: number;
  timestamp?: string;
  user_agent?: string;
  ip_address?: string;
}

const trackPageView = async (input: TrackInput): Promise<IPageView> => {
  const userAgent = input.user_agent;
  const isBot = detectIsBot(userAgent);
  const source = classifyReferrer(input.referrer);

  const doc = await PageView.create({
    path: input.path,
    full_url: input.full_url,
    referrer: input.referrer,
    source,
    session_id: input.session_id,
    visitor_id: input.visitor_id,
    user_agent: userAgent,
    browser: detectBrowser(userAgent),
    os: detectOS(userAgent),
    device: detectDevice(userAgent),
    ip_address: input.ip_address,
    is_bot: isBot,
    duration_ms: input.duration_ms,
    timestamp: input.timestamp ? new Date(input.timestamp) : new Date(),
  });

  return doc.toObject();
};

/* =========================================================
   Quick stats (page views, unique visitors, bounce rate, avg session)
========================================================= */

const buildQuickStats = async (): Promise<IPageViewStats> => {
  const since = new Date();
  since.setDate(since.getDate() - QUICK_STATS_WINDOW_DAYS);

  const baseFilter = { timestamp: { $gte: since }, is_bot: false };

  const [pageViews, uniqueVisitorsResult, sessionStats] = await Promise.all([
    PageView.countDocuments(baseFilter),
    PageView.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: { $ifNull: ["$visitor_id", "$session_id"] },
        },
      },
      { $count: "total" },
    ]),
    PageView.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: "$session_id",
          firstSeen: { $min: "$timestamp" },
          lastSeen: { $max: "$timestamp" },
          totalDuration: { $sum: { $ifNull: ["$duration_ms", 0] } },
          hits: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          singleHitSessions: {
            $sum: { $cond: [{ $eq: ["$hits", 1] }, 1, 0] },
          },
          // Use (lastSeen - firstSeen) for multi-hit sessions, else 0.
          totalSessionMs: {
            $sum: {
              $cond: [
                { $gt: ["$hits", 1] },
                {
                  $add: [
                    { $subtract: ["$lastSeen", "$firstSeen"] },
                    "$totalDuration",
                  ],
                },
                "$totalDuration",
              ],
            },
          },
        },
      },
    ]),
  ]);

  const uniqueVisitors = uniqueVisitorsResult[0]?.total ?? 0;
  const stats = sessionStats[0];
  const totalSessions = stats?.totalSessions ?? 0;
  const singleHitSessions = stats?.singleHitSessions ?? 0;
  const totalSessionMs = stats?.totalSessionMs ?? 0;

  const bounceRate =
    totalSessions > 0
      ? Math.round((singleHitSessions / totalSessions) * 1000) / 10
      : 0;

  const avgSessionSeconds =
    totalSessions > 0 ? Math.round(totalSessionMs / totalSessions / 1000) : 0;

  return {
    page_views: pageViews,
    unique_visitors: uniqueVisitors,
    bounce_rate: bounceRate,
    avg_session_seconds: avgSessionSeconds,
  };
};

/* =========================================================
   Traffic sources
========================================================= */

const buildTrafficSources = async (): Promise<IPageViewTrafficSource[]> => {
  const since = new Date();
  since.setDate(since.getDate() - QUICK_STATS_WINDOW_DAYS);

  const grouped = await PageView.aggregate<{ _id: TrafficSource; total: number }>([
    {
      $match: {
        timestamp: { $gte: since },
        is_bot: false,
      },
    },
    {
      $group: {
        _id: "$source",
        total: { $sum: 1 },
      },
    },
  ]);

  const totals = new Map<TrafficSource, number>();
  for (const src of TRAFFIC_SOURCES) totals.set(src, 0);
  let grandTotal = 0;
  for (const row of grouped) {
    if (totals.has(row._id)) {
      totals.set(row._id, row.total);
      grandTotal += row.total;
    }
  }

  if (grandTotal === 0) {
    return TRAFFIC_SOURCES.map((name) => ({ name, value: 0 }));
  }

  return TRAFFIC_SOURCES.map((name) => ({
    name,
    value: Math.round(((totals.get(name) ?? 0) / grandTotal) * 100),
  }));
};

/* =========================================================
   Weekly activity (views vs unique sessions as "clicks")
========================================================= */

const buildWeeklyActivity = async (): Promise<IPageViewWeeklyActivity[]> => {
  const today = startOfDay(new Date());
  const start = new Date(today);
  start.setDate(start.getDate() - (WEEKLY_ACTIVITY_WINDOW_DAYS - 1));

  const grouped = await PageView.aggregate<{
    _id: { y: number; m: number; d: number };
    views: number;
    sessions: string[];
  }>([
    { $match: { timestamp: { $gte: start }, is_bot: false } },
    {
      $group: {
        _id: {
          y: { $year: "$timestamp" },
          m: { $month: "$timestamp" },
          d: { $dayOfMonth: "$timestamp" },
        },
        views: { $sum: 1 },
        sessions: { $addToSet: "$session_id" },
      },
    },
  ]);

  const dayMap = new Map<string, { views: number; sessions: number }>();
  for (const row of grouped) {
    const key = `${row._id.y}-${row._id.m}-${row._id.d}`;
    dayMap.set(key, { views: row.views, sessions: row.sessions.length });
  }

  const out: IPageViewWeeklyActivity[] = [];
  for (let i = 0; i < WEEKLY_ACTIVITY_WINDOW_DAYS; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    const value = dayMap.get(key) ?? { views: 0, sessions: 0 };
    out.push({
      day: WEEKDAY_LABELS[d.getDay()],
      views: value.views,
      clicks: value.sessions,
    });
  }
  return out;
};

/* =========================================================
   Top pages (admin overview)
========================================================= */

const buildTopPages = async (limit = 10) => {
  const since = new Date();
  since.setDate(since.getDate() - QUICK_STATS_WINDOW_DAYS);

  return PageView.aggregate([
    { $match: { timestamp: { $gte: since }, is_bot: false } },
    {
      $group: {
        _id: "$path",
        views: { $sum: 1 },
        sessions: { $addToSet: "$session_id" },
      },
    },
    {
      $project: {
        _id: 0,
        path: "$_id",
        views: 1,
        unique_sessions: { $size: "$sessions" },
      },
    },
    { $sort: { views: -1 } },
    { $limit: limit },
  ]);
};

/* =========================================================
   Active sessions (rolling — last N minutes)
========================================================= */

const getActiveSessionsCount = async (
  minutes = SESSION_INACTIVITY_MINUTES
): Promise<number> => {
  const since = new Date();
  since.setMinutes(since.getMinutes() - minutes);

  const result = await PageView.aggregate([
    { $match: { timestamp: { $gte: since }, is_bot: false } },
    { $group: { _id: "$session_id" } },
    { $count: "total" },
  ]);

  return result[0]?.total ?? 0;
};

export const PageViewServices = {
  trackPageView,
  buildQuickStats,
  buildTrafficSources,
  buildWeeklyActivity,
  buildTopPages,
  getActiveSessionsCount,
};

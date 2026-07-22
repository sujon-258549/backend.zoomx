import { Blog } from "../blog/blog.model";
import { CaseStudy } from "../caseStudy/caseStudy.model";
import { Category } from "../category/category.model";
import ProjectModel from "../project/project.model";
import { PageViewServices } from "../pageView/pageView.service";
import {
  IDashboardOverview,
  IDashboardStat,
  IQuickStats,
  ITrafficSourceItem,
  IWeeklyActivityItem,
} from "./dashboard.interface";

/* =========================================================
   Stats grid — content counts (blogs / projects / case studies / categories)
========================================================= */

const buildStats = async (): Promise<IDashboardStat[]> => {
  const [totalBlogs, totalProjects, totalCaseStudies, totalCategories] =
    await Promise.all([
      Blog.countDocuments({}),
      ProjectModel.countDocuments({}),
      CaseStudy.countDocuments({}),
      Category.countDocuments({}),
    ]);

  return [
    {
      key: "blogs",
      title: "Total Blogs",
      value: totalBlogs,
      change: "0%",
      trend: "neutral",
    },
    {
      key: "projects",
      title: "Total Projects",
      value: totalProjects,
      change: "0%",
      trend: "neutral",
    },
    {
      key: "caseStudies",
      title: "Total Case Studies",
      value: totalCaseStudies,
      change: "0%",
      trend: "neutral",
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
  const [stats, trafficSources, weeklyActivity, quickStats] = await Promise.all(
    [
      buildStats(),
      buildTrafficSources(),
      buildWeeklyActivity(),
      buildQuickStats(),
    ]
  );

  return {
    stats,
    traffic_sources: trafficSources,
    weekly_activity: weeklyActivity,
    quick_stats: quickStats,
  };
};

export const DashboardServices = {
  getOverview,
  buildStats,
  buildTrafficSources,
  buildWeeklyActivity,
  buildQuickStats,
};

import express from "express";
import auth from "../../middleware/auth";
import { DashboardControllers } from "./dashboard.controller";

const router = express.Router();

// Any authenticated user can read dashboard stats — fine-grained access is
// handled on the frontend via route-level permission gates.
const adminAuth = auth();

router.get("/overview", adminAuth, DashboardControllers.getOverview);
router.get("/stats", adminAuth, DashboardControllers.getStats);
router.get(
  "/revenue-summary",
  adminAuth,
  DashboardControllers.getRevenueSummary
);
router.get("/order-status", adminAuth, DashboardControllers.getOrderStatus);
router.get(
  "/monthly-performance",
  adminAuth,
  DashboardControllers.getMonthlyPerformance
);
router.get("/top-products", adminAuth, DashboardControllers.getTopProducts);
router.get(
  "/recent-orders",
  adminAuth,
  DashboardControllers.getRecentOrders
);
router.get(
  "/traffic-sources",
  adminAuth,
  DashboardControllers.getTrafficSources
);
router.get(
  "/weekly-activity",
  adminAuth,
  DashboardControllers.getWeeklyActivity
);
router.get("/quick-stats", adminAuth, DashboardControllers.getQuickStats);

export const DashboardRoutes = router;

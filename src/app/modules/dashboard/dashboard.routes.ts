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

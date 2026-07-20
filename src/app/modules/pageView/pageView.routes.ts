import express from "express";
import auth from "../../middleware/auth";
import validateRequest from "../../middleware/validateRequest";
import { PageViewControllers } from "./pageView.controller";
import { PageViewValidation } from "./pageView.validation";

const router = express.Router();

// Any authenticated user can read analytics stats — fine-grained access is
// handled on the frontend via route-level permission gates.
const adminAuth = auth();

// Public — fired by the website to record a page hit
router.post(
  "/track",
  validateRequest(PageViewValidation.trackPageView),
  PageViewControllers.trackPageView
);

// Admin — analytics
router.get("/quick-stats", adminAuth, PageViewControllers.getQuickStats);
router.get(
  "/traffic-sources",
  adminAuth,
  PageViewControllers.getTrafficSources
);
router.get(
  "/weekly-activity",
  adminAuth,
  PageViewControllers.getWeeklyActivity
);
router.get("/top-pages", adminAuth, PageViewControllers.getTopPages);
router.get(
  "/active-sessions",
  adminAuth,
  PageViewControllers.getActiveSessions
);

export const PageViewRoutes = router;

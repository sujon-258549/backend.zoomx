import express from "express";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import validateRequest from "../../middleware/validateRequest";
import { CaseStudyControllers } from "./caseStudy.controller";
import { CaseStudyValidation } from "./caseStudy.validation";

const router = express.Router();

// Public reads. `/featured` is placed before `/:slug` so it isn't captured as a slug.
router.get("/", CaseStudyControllers.getAllCaseStudies);
router.get("/featured", CaseStudyControllers.getFeaturedCaseStudies);
router.get("/related/:slug", CaseStudyControllers.getRelatedCaseStudies);
router.get("/:slug", CaseStudyControllers.getSingleCaseStudy);

// Admin writes — permission-gated.
router.post(
  "/create",
  auth(),
  checkPermission("Case Studies", "create"),
  validateRequest(CaseStudyValidation.create),
  CaseStudyControllers.createCaseStudy
);

router.put(
  "/status/:slug",
  auth(),
  checkPermission("Case Studies", "update"),
  CaseStudyControllers.updateStatus
);

router.patch(
  "/:slug",
  auth(),
  checkPermission("Case Studies", "update"),
  validateRequest(CaseStudyValidation.update),
  CaseStudyControllers.updateCaseStudy
);

router.delete(
  "/:slug",
  auth(),
  checkPermission("Case Studies", "delete"),
  CaseStudyControllers.deleteCaseStudy
);

export const CaseStudyRoutes = router;

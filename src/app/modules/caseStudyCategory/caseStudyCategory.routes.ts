import express from "express";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import validateRequest from "../../middleware/validateRequest";
import { CaseStudyCategoryControllers } from "./caseStudyCategory.controller";
import { CaseStudyCategoryValidation } from "./caseStudyCategory.validation";

const router = express.Router();

// Public read — used by the admin dropdown and (later) the public site.
router.get("/", CaseStudyCategoryControllers.getAllCategories);

router.post(
  "/",
  auth(),
  checkPermission("Case Study Categories", "create"),
  validateRequest(CaseStudyCategoryValidation.create),
  CaseStudyCategoryControllers.createCategory
);

router.put(
  "/:id",
  auth(),
  checkPermission("Case Study Categories", "update"),
  validateRequest(CaseStudyCategoryValidation.update),
  CaseStudyCategoryControllers.updateCategory
);

router.delete(
  "/:id",
  auth(),
  checkPermission("Case Study Categories", "delete"),
  CaseStudyCategoryControllers.deleteCategory
);

export const CaseStudyCategoryRoutes = router;

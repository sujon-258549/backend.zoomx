import express from "express";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import validateRequest from "../../middleware/validateRequest";
import { ServiceCategoryControllers } from "./serviceCategory.controller";
import { ServiceCategoryValidation } from "./serviceCategory.validation";

const router = express.Router();

// Public read — used by the admin dropdown and the public site.
router.get("/", ServiceCategoryControllers.getAllCategories);

router.post(
  "/",
  auth(),
  checkPermission("Service Categories", "create"),
  validateRequest(ServiceCategoryValidation.create),
  ServiceCategoryControllers.createCategory
);

router.put(
  "/:id",
  auth(),
  checkPermission("Service Categories", "update"),
  validateRequest(ServiceCategoryValidation.update),
  ServiceCategoryControllers.updateCategory
);

router.delete(
  "/:id",
  auth(),
  checkPermission("Service Categories", "delete"),
  ServiceCategoryControllers.deleteCategory
);

export const ServiceCategoryRoutes = router;

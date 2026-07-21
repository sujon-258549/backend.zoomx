import express from "express";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import validateRequest from "../../middleware/validateRequest";
import { ProjectCategoryControllers } from "./projectCategory.controller";
import { ProjectCategoryValidation } from "./projectCategory.validation";

const router = express.Router();

router.get("/", ProjectCategoryControllers.getAllCategories);

router.post(
  "/",
  auth(),
  checkPermission("Projects", "create"),
  validateRequest(ProjectCategoryValidation.create),
  ProjectCategoryControllers.createCategory
);

router.put(
  "/:id",
  auth(),
  checkPermission("Projects", "update"),
  validateRequest(ProjectCategoryValidation.update),
  ProjectCategoryControllers.updateCategory
);

router.delete(
  "/:id",
  auth(),
  checkPermission("Projects", "delete"),
  ProjectCategoryControllers.deleteCategory
);

export const ProjectCategoryRoutes = router;

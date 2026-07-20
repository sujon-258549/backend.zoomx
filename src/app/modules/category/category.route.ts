import express from "express";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import validateRequest from "../../middleware/validateRequest";
import { CategoryController } from "./category.controller";
import { CategoryValidation } from "./category.validation";

const router = express.Router();

router.get("/", CategoryController.getAllCategories);

router.post(
  "/",
  auth(),
  checkPermission("Categories", "create"),
  validateRequest(CategoryValidation.createCategoryValidationSchema),
  CategoryController.createCategory
);

router.put(
  "/:id",
  auth(),
  checkPermission("Categories", "update"),
  validateRequest(CategoryValidation.updateCategoryValidationSchema),
  CategoryController.updateCategory
);

router.delete(
  "/:id",
  auth(),
  checkPermission("Categories", "delete"),
  CategoryController.deleteCategory
);

export const CategoryRoutes = router;

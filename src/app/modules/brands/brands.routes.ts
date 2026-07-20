import { Router } from "express";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import validateRequest from "../../middleware/validateRequest";
import { BrandsController } from "./brands.controller";
import { BrandValidation } from "./brands.validation";

const router = Router();

router.get("", BrandsController.getBrands);

router.post(
  "/create",
  auth(),
  checkPermission("Brands", "create"),
  validateRequest(BrandValidation.createBrand),
  BrandsController.createBrand
);

router.put(
  "/:id",
  auth(),
  checkPermission("Brands", "update"),
  validateRequest(BrandValidation.updateBrand),
  BrandsController.updateBrand
);

router.delete(
  "/:id",
  auth(),
  checkPermission("Brands", "delete"),
  BrandsController.deleteBrand
);

export const BrandRoutes = router;

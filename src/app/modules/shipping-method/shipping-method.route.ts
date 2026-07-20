import express from "express";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import validateRequest from "../../middleware/validateRequest";
import { ShippingMethodController } from "./shipping-method.controller";
import { ShippingMethodValidation } from "./shipping-method.validation";

const router = express.Router();

// ─── Public read — storefront checkout ──────────────────────────────────
router.get("/", ShippingMethodController.getActiveShippingMethods);

// ─── Admin ──────────────────────────────────────────────────────────────
router.get(
  "/all",
  auth(),
  checkPermission("Shipping Methods", "view"),
  ShippingMethodController.getAllShippingMethods
);

router.post(
  "/",
  auth(),
  checkPermission("Shipping Methods", "create"),
  validateRequest(
    ShippingMethodValidation.createShippingMethodValidationSchema
  ),
  ShippingMethodController.createShippingMethod
);

router.put(
  "/:id",
  auth(),
  checkPermission("Shipping Methods", "update"),
  validateRequest(
    ShippingMethodValidation.updateShippingMethodValidationSchema
  ),
  ShippingMethodController.updateShippingMethod
);

router.delete(
  "/:id",
  auth(),
  checkPermission("Shipping Methods", "delete"),
  ShippingMethodController.deleteShippingMethod
);

export const ShippingMethodRoutes = router;

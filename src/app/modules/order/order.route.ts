import express from "express";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import validateRequest from "../../middleware/validateRequest";
import { orderRateLimit } from "../../middleware/orderRateLimit";
import { OrderController } from "./order.controller";
import { OrderValidation } from "./order.validation";

const router = express.Router();

// ─── Public — guest checkout ────────────────────────────────────────────
// Rate-limited by IP to block fake-order spam.
router.post(
  "/",
  orderRateLimit,
  validateRequest(OrderValidation.createOrderValidationSchema),
  OrderController.createOrder
);

// ─── Admin ──────────────────────────────────────────────────────────────
router.get(
  "/",
  auth(),
  checkPermission("Orders", "view"),
  OrderController.getAllOrders
);

router.get(
  "/status-counts",
  auth(),
  checkPermission("Orders", "view"),
  OrderController.getStatusCounts
);

// Order Bin — soft-deleted orders. Static path, before "/:id".
router.get(
  "/bin",
  auth(),
  checkPermission("Orders", "view"),
  OrderController.getDeletedOrders
);

router.get(
  "/:id",
  auth(),
  checkPermission("Orders", "view"),
  OrderController.getSingleOrder
);

router.patch(
  "/:id",
  auth(),
  checkPermission("Orders", "update"),
  validateRequest(OrderValidation.updateOrderValidationSchema),
  OrderController.updateOrder
);

// Soft delete (move to bin).
router.delete(
  "/:id",
  auth(),
  checkPermission("Orders", "delete"),
  OrderController.softDeleteOrder
);

// Restore from bin.
router.patch(
  "/:id/restore",
  auth(),
  checkPermission("Orders", "delete"),
  OrderController.restoreOrder
);

// Permanent delete (from bin).
router.delete(
  "/:id/permanent",
  auth(),
  checkPermission("Orders", "delete"),
  OrderController.hardDeleteOrder
);

export const OrderRoutes = router;

import express from "express";
import { actionLogger } from "../../middleware/actionLogger";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import validateRequest from "../../middleware/validateRequest";
import { ProductReviewControllers } from "./productReview.controller";
import { ProductReviewValidation } from "./productReview.validation";

const router = express.Router();

// ─── Public — storefront ────────────────────────────────────────────────
// A visitor submits a review from the product details page.
router.post(
  "/create",
  validateRequest(ProductReviewValidation.create),
  ProductReviewControllers.createReview
);

// Approved reviews + rating summary for one product.
router.get("/product/:productId", ProductReviewControllers.getProductReviews);

// ─── Admin ──────────────────────────────────────────────────────────────
router.get(
  "/",
  auth(),
  checkPermission("Product Reviews", "view"),
  ProductReviewControllers.getAllReviews
);

router.patch(
  "/status/:id",
  auth(),
  checkPermission("Product Reviews", "update"),
  actionLogger,
  validateRequest(ProductReviewValidation.updateStatus),
  ProductReviewControllers.updateStatus
);

router.put(
  "/:id",
  auth(),
  checkPermission("Product Reviews", "update"),
  actionLogger,
  validateRequest(ProductReviewValidation.update),
  ProductReviewControllers.updateReview
);

router.delete(
  "/:id",
  auth(),
  checkPermission("Product Reviews", "delete"),
  actionLogger,
  ProductReviewControllers.deleteReview
);

export const ProductReviewRoutes = router;

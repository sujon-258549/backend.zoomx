import { Router } from "express";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import validateRequest from "../../middleware/validateRequest";
import { ReviewController } from "./review.controller";
import { ReviewValidation } from "./review.validation";

const router = Router();

router.get("", ReviewController.getReviews);

router.post(
  "/create",
  auth(),
  checkPermission("Reviews", "create"),
  validateRequest(ReviewValidation.createReview),
  ReviewController.createReview
);

router.put(
  "/:id",
  auth(),
  checkPermission("Reviews", "update"),
  validateRequest(ReviewValidation.updateReview),
  ReviewController.updateReview
);

router.delete(
  "/:id",
  auth(),
  checkPermission("Reviews", "delete"),
  ReviewController.deleteReview
);

export const ReviewRoutes = router;

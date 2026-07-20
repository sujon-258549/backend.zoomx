import express from "express";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import { contactRateLimit } from "../../middleware/rateLimit";
import validateRequest from "../../middleware/validateRequest";
import { CommentControllers } from "./comment.controller";
import { CommentValidation } from "./comment.validation";

const router = express.Router();

router.post(
  "/create",
  contactRateLimit,
  validateRequest(CommentValidation.create),
  CommentControllers.createComment
);

router.get(
  "/public/:blogId",
  CommentControllers.getPublicCommentsForBlog
);

router.get(
  "/",
  auth(),
  checkPermission("Blog Comments", "view"),
  CommentControllers.getAllComments
);

router.patch(
  "/status/:id",
  auth(),
  checkPermission("Blog Comments", "update"),
  validateRequest(CommentValidation.updateStatus),
  CommentControllers.updateStatus
);

router.delete(
  "/:id",
  auth(),
  checkPermission("Blog Comments", "delete"),
  CommentControllers.deleteComment
);

export const CommentRoutes = router;

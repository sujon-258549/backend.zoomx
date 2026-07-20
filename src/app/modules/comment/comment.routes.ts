import express from "express";
import { actionLogger } from "../../middleware/actionLogger";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import validateRequest from "../../middleware/validateRequest";
import { CommentControllers } from "./comment.controller";
import { CommentValidation } from "./comment.validation";

const router = express.Router();

router.post(
  "/create",
  validateRequest(CommentValidation.create),
  CommentControllers.createComment
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
  actionLogger,
  validateRequest(CommentValidation.updateStatus),
  CommentControllers.updateStatus
);

router.delete(
  "/:id",
  auth(),
  checkPermission("Blog Comments", "delete"),
  actionLogger,
  CommentControllers.deleteComment
);

export const CommentRoutes = router;

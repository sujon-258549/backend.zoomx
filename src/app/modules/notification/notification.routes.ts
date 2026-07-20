import { Router } from "express";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import { NotificationController } from "./notification.controller";

const router = Router();

router.get(
  "/",
  auth(),
  checkPermission("Notifications", "view"),
  NotificationController.list
);

router.get(
  "/unread-count",
  auth(),
  checkPermission("Notifications", "view"),
  NotificationController.unreadCount
);

router.patch(
  "/read-all",
  auth(),
  checkPermission("Notifications", "view"),
  NotificationController.markAllAsRead
);

router.get(
  "/:id",
  auth(),
  checkPermission("Notifications", "view"),
  NotificationController.getById
);

router.patch(
  "/:id/read",
  auth(),
  checkPermission("Notifications", "view"),
  NotificationController.markAsRead
);

router.delete(
  "/:id",
  auth(),
  checkPermission("Notifications", "delete"),
  NotificationController.remove
);

export const NotificationRoutes = router;

import { NextFunction, Request, Response } from "express";
import {
  NotificationPriority,
  NotificationType,
} from "../modules/notification/notification.interface";
import { NotificationService } from "../modules/notification/notification.service";
import { UserRole } from "../modules/user/user.interface";

// Only order creation triggers a notification. A notification is emitted on a
// successful `POST /api/orders` and nothing else — no other module writes, and
// not order updates/deletes.
const ORDER_CREATE_PATH = "/api/orders";

// Every internal role (everything except a public end-user) should be able to
// see activity notifications, provided their role has "Notifications / view"
// permission. We resolve this once at module load.
const ACTIVITY_AUDIENCE = Object.values(UserRole).filter(
  (r) => r !== UserRole.USER
) as UserRole[];

export const activityNotifier = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  // Only notify when a new order is created (POST /api/orders). Ignore every
  // other route and method.
  const path = req.originalUrl.split("?")[0].replace(/\/+$/, "");
  if (req.method !== "POST" || path !== ORDER_CREATE_PATH) return next();

  _res.on("finish", () => {
    // Only notify on success (2xx).
    if (_res.statusCode < 200 || _res.statusCode >= 400) {
      console.log(
        `[activityNotifier] skip — ${req.method} ${req.originalUrl} → ${_res.statusCode}`
      );
      return;
    }

    const actor =
      (req.user as any)?.name ||
      (req.user as any)?.email ||
      "A customer";

    console.log(
      `[activityNotifier] emit — new order by ${actor}`
    );

    // Fire and forget — emit() is internally guarded and never throws.
    void NotificationService.emit({
      type: NotificationType.SYSTEM,
      title: "New order",
      message: `${actor} placed a new order.`,
      priority: NotificationPriority.NORMAL,
      audienceRoles: ACTIVITY_AUDIENCE,
      source: { module: "Orders" },
      metadata: {
        method: req.method,
        path: req.originalUrl,
      },
    });
  });

  next();
};

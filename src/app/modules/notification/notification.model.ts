import { Schema, model } from "mongoose";
import { UserRole } from "../user/user.interface";
import {
  INotification,
  NotificationPriority,
  NotificationType,
} from "./notification.interface";

const notificationSchema = new Schema<INotification>(
  {
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    priority: {
      type: String,
      enum: Object.values(NotificationPriority),
      default: NotificationPriority.NORMAL,
      index: true,
    },
    audience: {
      roles: {
        type: [{ type: String, enum: Object.values(UserRole) }],
        default: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      },
    },
    source: {
      module: { type: String, required: true },
      refModel: { type: String },
      refId: {
        type: Schema.Types.ObjectId,
        refPath: "source.refModel",
      },
    },
    metadata: { type: Schema.Types.Mixed },
    actionUrl: { type: String, trim: true },
    readBy: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
  },
  { timestamps: true }
);

notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ "audience.roles": 1, createdAt: -1 });

const Notification = model<INotification>("Notification", notificationSchema);

export default Notification;

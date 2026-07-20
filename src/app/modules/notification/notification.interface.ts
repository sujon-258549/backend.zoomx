import { Document, Types } from "mongoose";
import { UserRole } from "../user/user.interface";

export enum NotificationType {
  TIME_MEMBER_CONTACT = "time_member_contact",
  CONTACT_MESSAGE = "contact_message",
  QUOTATION_REQUEST = "quotation_request",
  JOB_APPLICATION = "job_application",
  SYSTEM = "system",
}

export enum NotificationPriority {
  LOW = "low",
  NORMAL = "normal",
  HIGH = "high",
}

export interface INotificationSource {
  module: string;
  refModel?: string;
  refId?: Types.ObjectId;
}

export interface INotificationAudience {
  roles: UserRole[];
}

export interface INotification extends Document {
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  audience: INotificationAudience;
  source: INotificationSource;
  metadata?: Record<string, unknown>;
  actionUrl?: string;
  readBy: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

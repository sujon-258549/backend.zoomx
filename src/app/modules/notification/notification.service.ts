import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import AppError from "../../errors/appError";
import { paginationHelper } from "../../helpers/paginationHelper";
import { IPaginationOptions } from "../../interface/pagination";
import { SocketEvent, SocketRoom, tryGetIO } from "../../socket";
import { UserRole } from "../user/user.interface";
import { notificationSearchableFields } from "./notification.constant";
import {
  INotification,
  NotificationPriority,
  NotificationType,
} from "./notification.interface";
import Notification from "./notification.model";

interface EmitInput {
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  audienceRoles?: UserRole[];
  source: {
    module: string;
    refModel?: string;
    refId?: string | Types.ObjectId;
  };
  metadata?: Record<string, unknown>;
  actionUrl?: string;
}

interface AuthUser {
  userId: string;
  role: string;
}

// Fire-and-forget creation. Never throws — the caller's main operation must
// not be broken by a failure to record a notification.
const emit = async (input: EmitInput): Promise<INotification | null> => {
  try {
    const refId =
      typeof input.source.refId === "string"
        ? new Types.ObjectId(input.source.refId)
        : input.source.refId;

    const doc = await Notification.create({
      type: input.type,
      title: input.title,
      message: input.message,
      priority: input.priority ?? NotificationPriority.NORMAL,
      audience: {
        roles:
          input.audienceRoles && input.audienceRoles.length > 0
            ? input.audienceRoles
            : [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      },
      source: {
        module: input.source.module,
        refModel: input.source.refModel,
        refId,
      },
      metadata: input.metadata,
      actionUrl: input.actionUrl,
      readBy: [],
    });

    // Real-time fan-out — broadcast to every connected admin socket. The
    // GET endpoint is permission-gated (`checkPermission("Notifications",
    // "view")`), so clients without permission can't read the actual
    // notification list even if they receive the refresh ping. This lets
    // custom (dynamic) roles get live updates without needing to be hard-
    // coded into `audience.roles`.
    try {
      const io = tryGetIO();
      if (io) {
        const payload = {
          ...doc.toObject(),
          isRead: false,
        };
        io.emit(SocketEvent.NOTIFICATION_NEW, payload);
      }
    } catch (broadcastErr) {
      console.error(
        "[NotificationService.emit] socket broadcast failed:",
        broadcastErr
      );
    }

    return doc;
  } catch (err) {
    console.error("[NotificationService.emit] failed:", err);
    return null;
  }
};

const list = async (
  user: AuthUser,
  params: Record<string, unknown>,
  options: IPaginationOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const { keyword, isRead, type, priority } = params as {
    keyword?: string;
    isRead?: string;
    type?: string;
    priority?: string;
  };

  // Authorization is enforced at the route level via
  // checkPermission("Notifications", "view"). We deliberately do NOT filter
  // by audience.roles here — that field would exclude any custom (dynamic)
  // role even after permission has been granted to it.
  const conditions: Record<string, unknown>[] = [];

  if (keyword) {
    conditions.push({
      $or: notificationSearchableFields.map((field) => ({
        [field]: { $regex: keyword, $options: "i" },
      })),
    });
  }

  if (type) conditions.push({ type });
  if (priority) conditions.push({ priority });

  const userObjectId = new Types.ObjectId(user.userId);
  if (isRead === "true") {
    conditions.push({ readBy: userObjectId });
  } else if (isRead === "false") {
    conditions.push({ readBy: { $ne: userObjectId } });
  }

  // Mongo rejects an empty $and array, so fall back to {} when no filters.
  const where = conditions.length > 0 ? { $and: conditions } : {};

  const [docs, total, unread] = await Promise.all([
    Notification.find(where)
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(where),
    Notification.countDocuments({
      readBy: { $ne: userObjectId },
    }),
  ]);

  const userIdStr = user.userId.toString();
  const data = docs.map((doc: any) => ({
    ...doc,
    isRead: Array.isArray(doc.readBy)
      ? doc.readBy.some((id: Types.ObjectId) => id.toString() === userIdStr)
      : false,
  }));

  const totalPage = limit > 0 ? Math.ceil(total / limit) : 0;

  return {
    meta: { page, limit, total, totalPage, unread },
    data,
  };
};

const unreadCount = async (user: AuthUser) => {
  const total = await Notification.countDocuments({
    readBy: { $ne: new Types.ObjectId(user.userId) },
  });
  return { total };
};

const getById = async (id: string, user: AuthUser) => {
  const doc = await Notification.findOne({
    _id: id,
  }).lean();
  if (!doc) {
    throw new AppError(StatusCodes.NOT_FOUND, "Notification not found");
  }
  const userIdStr = user.userId.toString();
  return {
    ...doc,
    isRead: Array.isArray(doc.readBy)
      ? doc.readBy.some((rid: Types.ObjectId) => rid.toString() === userIdStr)
      : false,
  };
};

const markAsRead = async (id: string, user: AuthUser) => {
  const objId = new Types.ObjectId(user.userId);
  const updated = await Notification.findOneAndUpdate(
    { _id: id },
    { $addToSet: { readBy: objId } },
    { new: true }
  );
  if (!updated) {
    throw new AppError(StatusCodes.NOT_FOUND, "Notification not found");
  }

  // Notify the user's other tabs/devices that this one is now read.
  try {
    const io = tryGetIO();
    io?.to(SocketRoom.user(user.userId)).emit(SocketEvent.NOTIFICATION_READ, {
      id: String(updated._id),
    });
  } catch (broadcastErr) {
    console.error(
      "[NotificationService.markAsRead] socket broadcast failed:",
      broadcastErr
    );
  }

  return updated;
};

const markAllAsRead = async (user: AuthUser) => {
  const objId = new Types.ObjectId(user.userId);
  const result = await Notification.updateMany(
    {
      readBy: { $ne: objId },
    },
    { $addToSet: { readBy: objId } }
  );

  try {
    const io = tryGetIO();
    io?.to(SocketRoom.user(user.userId)).emit(
      SocketEvent.NOTIFICATION_READ_ALL,
      { modified: result.modifiedCount }
    );
  } catch (broadcastErr) {
    console.error(
      "[NotificationService.markAllAsRead] socket broadcast failed:",
      broadcastErr
    );
  }

  return { modified: result.modifiedCount };
};

const remove = async (id: string) => {
  const result = await Notification.findByIdAndDelete(id);
  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "Notification not found");
  }
  return result;
};

export const NotificationService = {
  emit,
  list,
  unreadCount,
  getById,
  markAsRead,
  markAllAsRead,
  remove,
};

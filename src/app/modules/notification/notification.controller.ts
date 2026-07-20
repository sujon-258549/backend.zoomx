import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import pick from "../../../shared/pick";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { notificationFilterableFields } from "./notification.constant";
import { NotificationService } from "./notification.service";

interface AuthUser {
  userId: string;
  role: string;
}

const getAuthUser = (req: Request): AuthUser => {
  const u = req.user as { userId?: string; role?: string };
  return {
    userId: String(u?.userId ?? ""),
    role: String(u?.role ?? ""),
  };
};

const list = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, notificationFilterableFields);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const result = await NotificationService.list(
    getAuthUser(req),
    filters,
    options
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Notifications fetched successfully",
    data: result,
  });
});

const unreadCount = catchAsync(async (req: Request, res: Response) => {
  const result = await NotificationService.unreadCount(getAuthUser(req));
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Unread notification count fetched successfully",
    data: result,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const result = await NotificationService.getById(
    req.params.id,
    getAuthUser(req)
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Notification fetched successfully",
    data: result,
  });
});

const markAsRead = catchAsync(async (req: Request, res: Response) => {
  const result = await NotificationService.markAsRead(
    req.params.id,
    getAuthUser(req)
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Notification marked as read",
    data: result,
  });
});

const markAllAsRead = catchAsync(async (req: Request, res: Response) => {
  const result = await NotificationService.markAllAsRead(getAuthUser(req));
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "All notifications marked as read",
    data: result,
  });
});

const remove = catchAsync(async (req: Request, res: Response) => {
  await NotificationService.remove(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Notification deleted successfully",
  });
});

export const NotificationController = {
  list,
  unreadCount,
  getById,
  markAsRead,
  markAllAsRead,
  remove,
};

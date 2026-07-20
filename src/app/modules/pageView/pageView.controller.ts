import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { PageViewServices } from "./pageView.service";

const getClientIp = (req: Request): string | undefined => {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string") return xf.split(",")[0]!.trim();
  if (Array.isArray(xf)) return xf[0]!.split(",")[0]!.trim();
  return req.socket.remoteAddress ?? undefined;
};

const trackPageView = catchAsync(async (req: Request, res: Response) => {
  const userAgent = req.headers["user-agent"]?.toString();
  const ipAddress = getClientIp(req);

  const result = await PageViewServices.trackPageView({
    ...req.body,
    user_agent: userAgent,
    ip_address: ipAddress,
  });

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Page view tracked",
    data: { id: (result as any)?._id },
  });
});

const getQuickStats = catchAsync(async (_req: Request, res: Response) => {
  const result = await PageViewServices.buildQuickStats();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Page view quick stats fetched successfully",
    data: result,
  });
});

const getTrafficSources = catchAsync(async (_req: Request, res: Response) => {
  const result = await PageViewServices.buildTrafficSources();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Traffic sources fetched successfully",
    data: result,
  });
});

const getWeeklyActivity = catchAsync(async (_req: Request, res: Response) => {
  const result = await PageViewServices.buildWeeklyActivity();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Weekly activity fetched successfully",
    data: result,
  });
});

const getTopPages = catchAsync(async (req: Request, res: Response) => {
  const limit = Math.min(parseInt(String(req.query.limit ?? "10"), 10) || 10, 100);
  const result = await PageViewServices.buildTopPages(limit);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Top pages fetched successfully",
    data: result,
  });
});

const getActiveSessions = catchAsync(async (_req: Request, res: Response) => {
  const result = await PageViewServices.getActiveSessionsCount();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Active sessions fetched successfully",
    data: { active_sessions: result },
  });
});

export const PageViewControllers = {
  trackPageView,
  getQuickStats,
  getTrafficSources,
  getWeeklyActivity,
  getTopPages,
  getActiveSessions,
};

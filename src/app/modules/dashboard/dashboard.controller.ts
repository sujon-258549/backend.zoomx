import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { DashboardServices } from "./dashboard.service";

const getOverview = catchAsync(async (_req: Request, res: Response) => {
  const result = await DashboardServices.getOverview();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Dashboard overview fetched successfully",
    data: result,
  });
});

const getStats = catchAsync(async (_req: Request, res: Response) => {
  const result = await DashboardServices.buildStats();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Dashboard stats fetched successfully",
    data: result,
  });
});

const getRevenueSummary = catchAsync(async (_req: Request, res: Response) => {
  const result = await DashboardServices.buildRevenueSummary();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Revenue summary fetched successfully",
    data: result,
  });
});

const getOrderStatus = catchAsync(async (_req: Request, res: Response) => {
  const result = await DashboardServices.buildOrderStatus();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Order status breakdown fetched successfully",
    data: result,
  });
});

const getMonthlyPerformance = catchAsync(
  async (_req: Request, res: Response) => {
    const result = await DashboardServices.buildMonthlyPerformance();
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Monthly performance fetched successfully",
      data: result,
    });
  }
);

const getTopProducts = catchAsync(async (_req: Request, res: Response) => {
  const result = await DashboardServices.buildTopProducts();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Top products fetched successfully",
    data: result,
  });
});

const getRecentOrders = catchAsync(async (_req: Request, res: Response) => {
  const result = await DashboardServices.buildRecentOrders();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Recent orders fetched successfully",
    data: result,
  });
});

const getTrafficSources = catchAsync(async (_req: Request, res: Response) => {
  const result = await DashboardServices.buildTrafficSources();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Traffic sources fetched successfully",
    data: result,
  });
});

const getWeeklyActivity = catchAsync(async (_req: Request, res: Response) => {
  const result = await DashboardServices.buildWeeklyActivity();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Weekly activity fetched successfully",
    data: result,
  });
});

const getQuickStats = catchAsync(async (_req: Request, res: Response) => {
  const result = await DashboardServices.buildQuickStats();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Quick stats fetched successfully",
    data: result,
  });
});

export const DashboardControllers = {
  getOverview,
  getStats,
  getRevenueSummary,
  getOrderStatus,
  getMonthlyPerformance,
  getTopProducts,
  getRecentOrders,
  getTrafficSources,
  getWeeklyActivity,
  getQuickStats,
};

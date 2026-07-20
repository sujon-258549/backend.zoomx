import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { OrderService } from "./order.service";
import { getClientIp } from "../../middleware/orderRateLimit";

// Public — storefront guest checkout.
const createOrder = catchAsync(async (req: Request, res: Response) => {
  const data = await OrderService.createOrder({
    ...req.body,
    ip: getClientIp(req),
  });
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Order placed successfully",
    data,
  });
});

// Admin — order list.
const getAllOrders = catchAsync(async (req: Request, res: Response) => {
  const result = await OrderService.getAllOrders(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Orders retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

// Admin — order counts per status (for the list tabs).
const getStatusCounts = catchAsync(async (_req: Request, res: Response) => {
  const data = await OrderService.getStatusCounts();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Order status counts retrieved successfully",
    data,
  });
});

// Admin — single order.
const getSingleOrder = catchAsync(async (req: Request, res: Response) => {
  const data = await OrderService.getSingleOrder(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Order retrieved successfully",
    data,
  });
});

// Admin — update an order (status / internal note).
const updateOrder = catchAsync(async (req: Request, res: Response) => {
  const author =
    (req as any).user?.name || (req as any).user?.email || undefined;
  const data = await OrderService.updateOrder(req.params.id, {
    ...req.body,
    author,
  });
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Order updated successfully",
    data,
  });
});

// Admin — soft delete (move to bin).
const softDeleteOrder = catchAsync(async (req: Request, res: Response) => {
  const data = await OrderService.softDeleteOrder(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Order moved to bin",
    data,
  });
});

// Admin — bin list (soft-deleted orders).
const getDeletedOrders = catchAsync(async (req: Request, res: Response) => {
  const result = await OrderService.getDeletedOrders(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Deleted orders retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

// Admin — restore from bin.
const restoreOrder = catchAsync(async (req: Request, res: Response) => {
  const data = await OrderService.restoreOrder(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Order restored",
    data,
  });
});

// Admin — permanent delete (from bin).
const hardDeleteOrder = catchAsync(async (req: Request, res: Response) => {
  const data = await OrderService.hardDeleteOrder(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Order permanently deleted",
    data,
  });
});

export const OrderController = {
  createOrder,
  getAllOrders,
  getStatusCounts,
  getSingleOrder,
  updateOrder,
  softDeleteOrder,
  getDeletedOrders,
  restoreOrder,
  hardDeleteOrder,
};

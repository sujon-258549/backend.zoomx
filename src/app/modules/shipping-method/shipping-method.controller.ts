import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ShippingMethodService } from "./shipping-method.service";

const createShippingMethod = catchAsync(async (req: Request, res: Response) => {
  const data = await ShippingMethodService.createShippingMethod(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Shipping method created successfully",
    data,
  });
});

// Admin — all methods.
const getAllShippingMethods = catchAsync(async (_req: Request, res: Response) => {
  const data = await ShippingMethodService.getAllShippingMethods();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Shipping methods retrieved successfully",
    data,
  });
});

// Public — active methods only (used by the storefront checkout).
const getActiveShippingMethods = catchAsync(
  async (_req: Request, res: Response) => {
    const data = await ShippingMethodService.getActiveShippingMethods();
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Shipping methods retrieved successfully",
      data,
    });
  }
);

const updateShippingMethod = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = await ShippingMethodService.updateShippingMethod(id, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Shipping method updated successfully",
    data,
  });
});

const deleteShippingMethod = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await ShippingMethodService.deleteShippingMethod(id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Shipping method deleted successfully",
  });
});

export const ShippingMethodController = {
  createShippingMethod,
  getAllShippingMethods,
  getActiveShippingMethods,
  updateShippingMethod,
  deleteShippingMethod,
};

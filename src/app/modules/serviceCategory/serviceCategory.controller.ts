import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import pick from "../../../shared/pick";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ServiceCategoryServices } from "./serviceCategory.service";

const createCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await ServiceCategoryServices.createCategory(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Service category created successfully",
    data: result,
  });
});

const getAllCategories = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["keyword", "status"]);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const result = await ServiceCategoryServices.getAllCategories(filters, options);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Service categories fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await ServiceCategoryServices.updateCategory(req.params.id, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Service category updated successfully",
    data: result,
  });
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  await ServiceCategoryServices.deleteCategory(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Service category deleted successfully",
  });
});

export const ServiceCategoryControllers = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
};

import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { CategoryService } from "./category.service";
import { revalidateFrontend } from "../../utils/revalidateFrontend";

const createCategory = catchAsync(async (req: Request, res: Response) => {
  const data = await CategoryService.createCategory(req.body);
  revalidateFrontend(data?.slug);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "category created successfully",
    data,
  });
});

const getAllCategories = catchAsync(async (req: Request, res: Response) => {
  const result = await CategoryService.getAllCategories(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "categories retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = await CategoryService.updateCategoryFromDB(id, req.body);
  revalidateFrontend(data?.slug);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "category updated successfully",
    data,
  });
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await CategoryService.deleteCategoryFromDB(id);
  revalidateFrontend(); // Revalidate all without a specific slug since the category is gone
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "category deleted successfully",
  });
});

export const CategoryController = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
};

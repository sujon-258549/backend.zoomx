import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import pick from "../../../shared/pick";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { CaseStudyCategoryServices } from "./caseStudyCategory.service";

const createCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await CaseStudyCategoryServices.createCategory(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Case study category created successfully",
    data: result,
  });
});

const getAllCategories = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["keyword", "status"]);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const result = await CaseStudyCategoryServices.getAllCategories(filters, options);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Case study categories fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await CaseStudyCategoryServices.updateCategory(req.params.id, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Case study category updated successfully",
    data: result,
  });
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  await CaseStudyCategoryServices.deleteCategory(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Case study category deleted successfully",
  });
});

export const CaseStudyCategoryControllers = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
};

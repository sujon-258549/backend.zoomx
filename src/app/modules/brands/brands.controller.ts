import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { BrandService } from "./brands.service";

const createBrand = catchAsync(async (req: Request, res: Response) => {
  const result = await BrandService.createBrand(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Brand created successfully",
    data: result,
  });
});
const updateBrand = catchAsync(async (req: Request, res: Response) => {
  const result = await BrandService.updateBrand(req.params.id, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Brand updated successfully",
    data: result,
  });
});
const deleteBrand = catchAsync(async (req: Request, res: Response) => {
  const result = await BrandService.deleteBrand(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Brand deleted successfully",
    data: result,
  });
});

const getBrands = catchAsync(async (req: Request, res: Response) => {
  const result = await BrandService.getBrands();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Brands fetched successfully",
    data: result,
  });
});

export const BrandsController = {
  createBrand,
  updateBrand,
  deleteBrand,
  getBrands,
};

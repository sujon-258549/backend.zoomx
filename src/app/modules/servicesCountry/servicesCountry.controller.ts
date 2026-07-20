import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ServicesCountryService } from "./servicesCountry.service";

const create = catchAsync(async (req: Request, res: Response) => {
  const data = await ServicesCountryService.create(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Service country created successfully",
    data,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const data = await ServicesCountryService.getAll(req.query as any);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Service countries retrieved successfully",
    data,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const data = await ServicesCountryService.getById(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Service country retrieved successfully",
    data,
  });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const data = await ServicesCountryService.update(req.params.id, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Service country updated successfully",
    data,
  });
});

const remove = catchAsync(async (req: Request, res: Response) => {
  await ServicesCountryService.remove(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Service country deleted successfully",
  });
});

export const ServicesCountryController = {
  create,
  getAll,
  getById,
  update,
  remove,
};

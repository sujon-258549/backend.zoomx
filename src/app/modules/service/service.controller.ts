import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import pick from "../../../shared/pick";
import catchAsync from "../../utils/catchAsync";
import { revalidateFrontend } from "../../utils/revalidateFrontend";
import sendResponse from "../../utils/sendResponse";
import { ServiceServices } from "./service.service";

const serviceFilterableFields = [
  "keyword",
  "category",
  "status",
  "isFeatured",
  "is_deleted",
];

const createService = catchAsync(async (req: Request, res: Response) => {
  const result = await ServiceServices.createService({
    ...req.body,
    author_user: req.user?.userId,
  });
  revalidateFrontend(result?.slug);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Service created successfully",
    data: result,
  });
});

const getAllServices = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, serviceFilterableFields);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const result = await ServiceServices.getAllServices(filters, options);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Services fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getFeaturedServices = catchAsync(async (req: Request, res: Response) => {
  const limit = Number(req.query.limit) || 6;
  const result = await ServiceServices.getFeaturedServices(limit);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Featured services fetched successfully",
    data: result,
  });
});

const getSingleService = catchAsync(async (req: Request, res: Response) => {
  const result = await ServiceServices.getSingleService(req.params.slug);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Service fetched successfully",
    data: result,
  });
});

const updateService = catchAsync(async (req: Request, res: Response) => {
  const result = await ServiceServices.updateService(
    req.params.slug,
    req.body,
    req.user?.userId
  );
  revalidateFrontend(result?.slug);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Service updated successfully",
    data: result,
  });
});

const updateStatus = catchAsync(async (req: Request, res: Response) => {
  const { status } = req.body;
  const result = await ServiceServices.updateStatus(req.params.slug, status);
  revalidateFrontend(result?.slug);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Service status updated successfully",
    data: result,
  });
});

const deleteService = catchAsync(async (req: Request, res: Response) => {
  const result = await ServiceServices.deleteService(req.params.slug);
  revalidateFrontend(result?.slug);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Service deleted successfully",
    data: result,
  });
});

export const ServiceControllers = {
  createService,
  getAllServices,
  getFeaturedServices,
  getSingleService,
  updateService,
  updateStatus,
  deleteService,
};

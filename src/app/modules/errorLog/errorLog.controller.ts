import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import pick from "../../../shared/pick";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import {
  errorLogFilterableFields,
} from "./errorLog.constant";
import { ErrorLogServices } from "./errorLog.service";

const getAllErrorLogs = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, [...errorLogFilterableFields, "keyword"]);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const result = await ErrorLogServices.getAllErrorLogs(filters, options);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Error logs retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const deleteErrorLog = catchAsync(async (req: Request, res: Response) => {
  await ErrorLogServices.deleteErrorLog(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Error log deleted successfully",
  });
});

const clearAllErrorLogs = catchAsync(async (_req: Request, res: Response) => {
  await ErrorLogServices.clearAllErrorLogs();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "All error logs cleared",
  });
});

export const ErrorLogControllers = {
  getAllErrorLogs,
  deleteErrorLog,
  clearAllErrorLogs,
};

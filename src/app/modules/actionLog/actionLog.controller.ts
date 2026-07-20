import { StatusCodes } from "http-status-codes";
import pick from "../../../shared/pick";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { actionLogFilterableFields } from "./actionLog.constant";
import { ActionLogServices } from "./actionLog.service";

const getAllActionLogs = catchAsync(async (req, res) => {
  const filters = pick(req.query, actionLogFilterableFields);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const result = await ActionLogServices.getAllActionLogs(filters, options);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Action logs retrieved successfully",
    data: result,
  });
});

export const ActionLogControllers = {
  getAllActionLogs,
};

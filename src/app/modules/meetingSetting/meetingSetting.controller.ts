import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { MeetingSettingServices } from "./meetingSetting.service";

/** Public — safe subset used by the booking page. */
const getPublicSettings = catchAsync(async (_req: Request, res: Response) => {
  const result = await MeetingSettingServices.getPublicSettings();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Meeting settings fetched successfully",
    data: result,
  });
});

/** Admin — full settings for the management screen. */
const getSettings = catchAsync(async (_req: Request, res: Response) => {
  const result = await MeetingSettingServices.getSettings();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Meeting settings fetched successfully",
    data: result,
  });
});

const updateSettings = catchAsync(async (req: Request, res: Response) => {
  const result = await MeetingSettingServices.updateSettings(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Meeting settings updated successfully",
    data: result,
  });
});

export const MeetingSettingControllers = {
  getPublicSettings,
  getSettings,
  updateSettings,
};

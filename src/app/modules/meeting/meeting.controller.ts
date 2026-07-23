import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import pick from "../../../shared/pick";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { MeetingServices } from "./meeting.service";

/** Public — available slots for a date range in the visitor's timezone. */
const getSlots = catchAsync(async (req: Request, res: Response) => {
  const { from, to, timezone } = req.query as Record<string, string>;
  const result = await MeetingServices.getAvailableSlots(from, to, timezone);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Available slots fetched successfully",
    data: result,
  });
});

/** Public — book a slot. */
const bookMeeting = catchAsync(async (req: Request, res: Response) => {
  const result = await MeetingServices.bookMeeting(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Meeting booked successfully",
    data: result,
  });
});

/** Admin — list bookings. */
const getAllMeetings = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["keyword", "status", "from", "to"]);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const result = await MeetingServices.getAllMeetings(filters, options);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Meetings fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getMeeting = catchAsync(async (req: Request, res: Response) => {
  const result = await MeetingServices.getMeeting(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Meeting fetched successfully",
    data: result,
  });
});

const updateStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await MeetingServices.updateStatus(req.params.id, req.body.status);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Meeting status updated successfully",
    data: result,
  });
});

const deleteMeeting = catchAsync(async (req: Request, res: Response) => {
  const result = await MeetingServices.deleteMeeting(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Meeting deleted successfully",
    data: result,
  });
});

export const MeetingControllers = {
  getSlots,
  bookMeeting,
  getAllMeetings,
  getMeeting,
  updateStatus,
  deleteMeeting,
};

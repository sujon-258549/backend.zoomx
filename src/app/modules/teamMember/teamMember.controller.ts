import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import pick from "../../../shared/pick";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { teamMemberFilterableFields } from "./teamMember.constant";
import { TeamMemberService } from "./teamMember.service";

const createTeamMember = catchAsync(async (req: Request, res: Response) => {
  const result = await TeamMemberService.createTeamMember(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Team member created successfully",
    data: result,
  });
});

const updateTeamMember = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await TeamMemberService.updateTeamMember(id, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Team member updated successfully",
    data: result,
  });
});

const deleteTeamMember = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await TeamMemberService.deleteTeamMember(id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Team member deleted successfully",
  });
});

const getAllTeamMembers = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, teamMemberFilterableFields);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const result = await TeamMemberService.getAllTeamMembers(filters, options);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Team members fetched successfully",
    data: result,
  });
});

const getTeamMemberById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await TeamMemberService.getTeamMemberById(id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Team member fetched successfully",
    data: result,
  });
});

const toggleTeamMemberStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await TeamMemberService.toggleTeamMemberStatus(id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `Team member is now ${result.isActive ? "active" : "inactive"}`,
    data: result,
  });
});

const updateTeamMemberSerial = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { serial_no } = req.body as { serial_no: number };
  const result = await TeamMemberService.updateTeamMemberSerial(id, serial_no);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Team member serial updated successfully",
    data: result,
  });
});

const toggleTeamMemberIsNew = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await TeamMemberService.toggleTeamMemberIsNew(id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `Team member is ${result.is_new ? "marked as new" : "no longer new"}`,
    data: result,
  });
});

const toggleTeamMemberIsTeamLead = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await TeamMemberService.toggleTeamMemberIsTeamLead(id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `Team lead is now ${result.isTeamLead ? "enabled" : "disabled"}`,
    data: result,
  });
});

export const TeamMemberController = {
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  getAllTeamMembers,
  getTeamMemberById,
  toggleTeamMemberStatus,
  toggleTeamMemberIsNew,
  toggleTeamMemberIsTeamLead,
  updateTeamMemberSerial,
};

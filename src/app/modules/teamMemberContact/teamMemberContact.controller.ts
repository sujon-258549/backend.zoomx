import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import pick from "../../../shared/pick";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { teamMemberContactFilterableFields } from "./teamMemberContact.constant";
import { TeamMemberContactService } from "./teamMemberContact.service";

const createTeamMemberContact = catchAsync(async (req: Request, res: Response) => {
  const result = await TeamMemberContactService.createTeamMemberContact(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Question submitted successfully",
    data: result,
  });
});

const getAllTeamMemberContacts = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, teamMemberContactFilterableFields);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const result = await TeamMemberContactService.getAllTeamMemberContacts(
    filters,
    options
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Contact entries fetched successfully",
    data: result,
  });
});

const getTeamMemberContactById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await TeamMemberContactService.getTeamMemberContactById(id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Contact entry fetched successfully",
    data: result,
  });
});

const deleteTeamMemberContact = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await TeamMemberContactService.deleteTeamMemberContact(id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Contact entry deleted successfully",
  });
});

export const TeamMemberContactController = {
  createTeamMemberContact,
  getAllTeamMemberContacts,
  getTeamMemberContactById,
  deleteTeamMemberContact,
};

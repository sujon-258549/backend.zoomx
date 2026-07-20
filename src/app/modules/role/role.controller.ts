import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { RoleService } from "./role.service";

const createRole = catchAsync(async (req: Request, res: Response) => {
  const data = await RoleService.createRole(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Role created successfully",
    data,
  });
});

const getAllRoles = catchAsync(async (req: Request, res: Response) => {
  const { result, meta } = await RoleService.getAllRoles(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Roles retrieved successfully",
    meta,
    data: result,
  });
});

const getRoleById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = await RoleService.getRoleById(id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Role retrieved successfully",
    data,
  });
});

const updateRole = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = await RoleService.updateRole(id, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Role updated successfully",
    data,
  });
});

const toggleRoleStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = await RoleService.toggleRoleStatus(id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `Role is now ${data.isActive ? "active" : "inactive"}`,
    data,
  });
});

const deleteRole = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await RoleService.deleteRole(id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Role deleted successfully",
  });
});

export const RoleController = {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  toggleRoleStatus,
  deleteRole,
};

import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { RolePermissionService } from "./rolePermission.service";

const createRolePermission = catchAsync(
  async (req: Request, res: Response) => {
    const data = await RolePermissionService.createRolePermission(req.body);
    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Role permission created successfully",
      data,
    });
  }
);

const getAllRolePermissions = catchAsync(
  async (req: Request, res: Response) => {
    const data = await RolePermissionService.getAllRolePermissions();
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Role permissions retrieved successfully",
      data,
    });
  }
);

const getRolePermissionsByRoleId = catchAsync(
  async (req: Request, res: Response) => {
    const { roleId } = req.params;
    const data = await RolePermissionService.getRolePermissionsByRoleId(roleId);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Role permissions retrieved successfully",
      data,
    });
  }
);

const updateRolePermission = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = await RolePermissionService.updateRolePermission(id, req.body);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Role permission updated successfully",
      data,
    });
  }
);

const deleteRolePermission = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    await RolePermissionService.deleteRolePermission(id);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Role permission deleted successfully",
    });
  }
);

export const RolePermissionController = {
  createRolePermission,
  getAllRolePermissions,
  getRolePermissionsByRoleId,
  updateRolePermission,
  deleteRolePermission,
};

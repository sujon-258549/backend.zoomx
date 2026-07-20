import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { permissionsService } from "./permissions.service";

const CreatePermission = catchAsync(async (req: Request, res: Response) => {
  const data = await permissionsService.createPermission(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "permission created successfully",
    data,
  });
});

const GetAllPermissions = catchAsync(async (req: Request, res: Response) => {
  const data = await permissionsService.getAllPermissions();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "permissions retrieved successfully",
    data,
  });
});

const UpdatePermission = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = await permissionsService.updatePermission(id, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "permission updated successfully",
    data,
  });
});

const DeletePermission = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await permissionsService.deletePermission(id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "permission deleted successfully",
  });
});

export const PermissionsController = {
  createPermission: CreatePermission,
  getAllPermissions: GetAllPermissions,
  updatePermission: UpdatePermission,
  deletePermission: DeletePermission,
};


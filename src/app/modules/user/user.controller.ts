import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/appError";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { IJwtPayload } from "../auth/auth.interface";
import { UserServices } from "./user.service";

const assertNotSelf = (req: Request, action: string) => {
  const actor = req.user as IJwtPayload | undefined;
  if (actor?.userId && String(actor.userId) === String(req.params.id)) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      `You cannot ${action} your own account`
    );
  }
};

const registerUser = catchAsync(async (req: Request, res: Response) => {
 await UserServices.registerUser(req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User registration completed successfully!",
  });
});

const getAllUser = catchAsync(async (req, res) => {
  const result = await UserServices.getAllUser(req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Users are retrieved successfully",
    meta: result.meta,
    data: result.result,
  });
});

const myProfile = catchAsync(async (req, res) => {
  const result = await UserServices.myProfile(req.user as IJwtPayload);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Profile retrieved successfully",
    data: result,
  });
});



const updateUserStatus = catchAsync(async (req, res) => {
  assertNotSelf(req, "change the active status of");
  const userId = req.params.id;
  const result = await UserServices.updateUserStatus(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `User is now ${result.isActive ? "active" : "inactive"}`,
    data: result,
  });
});

const updateUser = catchAsync(async (req, res) => {
  const userId = req.params.id;
  const result = await UserServices.updateUser(userId, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User updated successfully",
    data: result,
  });
});

const deleteUser = catchAsync(async (req, res) => {
  assertNotSelf(req, "delete");
  const userId = req.params.id;
  await UserServices.deleteUser(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User deleted successfully",
  });
});

const changePassword = catchAsync(async (req, res) => {
  assertNotSelf(req, "change the password of");
  const userId = req.params.id;
  const { newPassword } = req.body;
  const result = await UserServices.changePassword(userId, newPassword);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

export const UserController = {
  registerUser,
  getAllUser,
  myProfile,
  updateUserStatus,
  updateUser,
  deleteUser,
  changePassword,
};

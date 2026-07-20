import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import config from "../../config";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AuthService } from "./auth.service";

const loginUser = catchAsync(async (req, res) => {
  const result = await AuthService.loginUser(req.body);

  // Cookie config must be environment-aware:
  // - Production (HTTPS, cross-site: admin.thezoomit.com → api.thezoomit.com):
  //     sameSite=none + secure=true — required by the browser for cross-site cookies.
  // - Development (HTTP localhost):
  //     sameSite=lax + secure=false — modern browsers REJECT sameSite=none unless
  //     secure=true, which is why local dev sessions were getting logged out
  //     every ~15min (access token TTL) — the refresh cookie never got set.
  const isProd = config.NODE_ENV === "production";
  // Old (single config that broke localhost):
  // res.cookie("refreshToken", result.refreshToken, {
  //   secure: config.NODE_ENV === "production",
  //   httpOnly: true,
  //   sameSite: "none",
  //   maxAge: 1000 * 60 * 60 * 24 * 365,
  // });
  res.cookie("refreshToken", result.refreshToken, {
    secure: isProd,
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    maxAge: 1000 * 60 * 60 * 24 * 365,
  });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User logged in successfully!",
    data: result,
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  // Prefer the httpOnly cookie set at login; fall back to the Authorization
  // header so a manual call with Bearer also works.
  const cookieToken = (req as any).cookies?.refreshToken as string | undefined;
  const headerRaw = req.headers.authorization;
  const headerToken = headerRaw?.startsWith("Bearer ")
    ? headerRaw.slice(7)
    : headerRaw;
  const token = cookieToken || headerToken;

  const result = await AuthService.refreshToken(token as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Access token refreshed successfully",
    data: result,
  });
});

// change password
const changePassword = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const payload = req.body;

  const result = await AuthService.changePassword(user, payload);

  // Refresh the httpOnly refresh-token cookie (same policy as login) so the
  // session survives the password change.
  const isProd = config.NODE_ENV === "production";
  res.cookie("refreshToken", result.refreshToken, {
    secure: isProd,
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    maxAge: 1000 * 60 * 60 * 24 * 365,
  });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Password changed successfully!",
    // Return the new access + refresh tokens so the client can update them.
    data: { token: result.token, refreshToken: result.refreshToken },
  });
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.forgotPassword(req.body?.email);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.resetPassword({
    email: req.body?.email,
    code: req.body?.code,
    newPassword: req.body?.newPassword,
  });
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

export const AuthController = {
  loginUser,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
};

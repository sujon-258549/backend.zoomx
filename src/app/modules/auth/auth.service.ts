import bcrypt from "bcrypt";
import crypto from "crypto";
import { StatusCodes } from "http-status-codes";
import { JwtPayload, Secret } from "jsonwebtoken";
import config from "../../config";
import AppError from "../../errors/appError";
import { EmailHelper } from "../../utils/emailHelper";
import User from "../user/user.model";
import { IAuth, IJwtPayload } from "./auth.interface";
import { createToken, verifyToken } from "./auth.utils";

const loginUser = async (payload: IAuth) => {
  const user = await User.findOne({ email: payload.email });
  if (!user || user.isDeleted) {
    throw new AppError(StatusCodes.NOT_FOUND, "This user is not found!");
  }

  if (!user.isActive) {
    throw new AppError(StatusCodes.FORBIDDEN, "This user is not active!");
  }

  if (!(await User.isPasswordMatched(payload?.password, user?.password))) {
    throw new AppError(StatusCodes.FORBIDDEN, "Password does not match");
  }
  const jwtPayload: IJwtPayload = {
    userId: user._id as string,
    name: user.name as string,
    email: user.email as string,
    isActive: user.isActive,
    lastLogin: user.lastLogin,
    role: String(user.role ?? "").toUpperCase() as IJwtPayload["role"],
  };

  const token = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string
  );

  const refreshToken = createToken(
    jwtPayload,
    config.jwt_refresh_secret as string,
    config.jwt_refresh_expires_in as string
  );

  await User.findByIdAndUpdate(user._id, {
    clientInfo: payload.clientInfo,
    lastLogin: Date.now(),
  });

  return {
    token,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: user.isActive,
      last_login: user.lastLogin,
    },
  };
};

const refreshToken = async (token: string) => {
  let verifiedToken = null;
  try {
    verifiedToken = verifyToken(token, config.jwt_refresh_secret as Secret);
  } catch (err) {
    throw new AppError(StatusCodes.FORBIDDEN, "Invalid Refresh Token");
  }

  const { userId } = verifiedToken;

  const isUserExist = await User.findById(userId);
  if (!isUserExist || isUserExist.isDeleted) {
    throw new AppError(StatusCodes.NOT_FOUND, "User does not exist");
  }

  if (!isUserExist.isActive) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User is not active");
  }

  const jwtPayload: IJwtPayload = {
    userId: isUserExist._id as string,
    name: isUserExist.name as string,
    email: isUserExist.email as string,
    lastLogin: isUserExist.lastLogin,
    isActive: isUserExist.isActive,
    role: String(isUserExist.role ?? "").toUpperCase() as IJwtPayload["role"],
  };

  const newAccessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as Secret,
    config.jwt_access_expires_in as string
  );

  return {
    accessToken: newAccessToken,
  };
};

const changePassword = async (
  userData: JwtPayload,
  payload: { oldPassword: string; newPassword: string }
) => {
  const { userId } = userData;
  const { oldPassword, newPassword } = payload;

  const user = await User.findOne({ _id: userId }).select("+password");
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }
  if (!user.isActive) {
    throw new AppError(StatusCodes.FORBIDDEN, "User account is inactive");
  }

  // Validate old password
  const isOldPasswordCorrect = await User.isPasswordMatched(
    oldPassword,
    user.password
  );
  if (!isOldPasswordCorrect) {
    throw new AppError(StatusCodes.FORBIDDEN, "Incorrect old password");
  }

  // Hash and update the new password
  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds)
  );
  await User.updateOne({ _id: userId }, { password: hashedPassword });

  // Issue fresh tokens so the user stays logged in without re-authenticating.
  const jwtPayload: IJwtPayload = {
    userId: user._id as string,
    name: user.name as string,
    email: user.email as string,
    isActive: user.isActive,
    lastLogin: user.lastLogin,
    role: String(user.role ?? "").toUpperCase() as IJwtPayload["role"],
  };

  const token = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string
  );
  const refreshToken = createToken(
    jwtPayload,
    config.jwt_refresh_secret as string,
    config.jwt_refresh_expires_in as string
  );

  return { message: "Password changed successfully", token, refreshToken };
};

// ---------------------------------------------------------------------------
// Forgot password — email-code flow
// ---------------------------------------------------------------------------

const RESET_CODE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const RESET_CODE_MAX_ATTEMPTS = 5;

const hashCode = (code: string): string =>
  crypto.createHash("sha256").update(code).digest("hex");

const generateSixDigitCode = (): string => {
  // 100000–999999 inclusive
  const n = crypto.randomInt(100000, 1000000);
  return String(n);
};

const buildResetEmailHtml = (name: string, code: string): string => `
<div style="background:#ffffff;font-family:Inter,Segoe UI,Arial,sans-serif;color:#1f2937;margin:0;padding:0;width:100%;">
  <div style="width:100%;background:linear-gradient(135deg,#35ad0b 0%,#2f9a0a 100%);padding:32px 24px;color:#ffffff;box-sizing:border-box;">
    <p style="margin:0;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.85;">ZOOM IT — Password Reset</p>
    <h1 style="margin:8px 0 0;font-size:22px;line-height:1.3;">Hi ${name || "there"},</h1>
    <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">Use the code below to reset your password.</p>
  </div>
  <div style="width:100%;padding:32px 24px;font-size:15px;line-height:1.65;color:#1f2937;box-sizing:border-box;text-align:center;">
    <p style="margin:0 0 16px;">Your verification code is:</p>
    <div style="display:inline-block;padding:14px 28px;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:10px;font-size:32px;font-weight:700;letter-spacing:8px;color:#111827;font-family:'Courier New',monospace;">
      ${code}
    </div>
    <p style="margin:20px 0 0;font-size:13px;color:#6b7280;">This code expires in 15 minutes. If you didn't request a password reset, you can safely ignore this email.</p>
  </div>
  <div style="width:100%;background:#f9fafb;border-top:1px solid #e5e7eb;padding:18px 24px;box-sizing:border-box;font-size:12px;color:#6b7280;text-align:center;">
    Sent by the ZOOM IT team · <a href="https://thezoomit.com" style="color:#35ad0b;text-decoration:none;">thezoomit.com</a>
  </div>
</div>`;

/**
 * Generate a 6-digit code, store its hash + expiry on the user, and email it.
 * Always returns success to the caller (even when the email doesn't exist) to
 * avoid leaking which addresses are registered.
 */
const forgotPassword = async (email: string) => {
  const successMessage =
    "If that email is registered, a reset code is on its way.";

  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) {
    return { message: successMessage };
  }

  const user = await User.findOne({
    email: normalized,
    isDeleted: { $ne: true },
  });
  if (!user || !user.isActive) {
    return { message: successMessage };
  }

  const code = generateSixDigitCode();
  await User.updateOne(
    { _id: user._id },
    {
      resetCodeHash: hashCode(code),
      resetCodeExpiresAt: new Date(Date.now() + RESET_CODE_TTL_MS),
      resetCodeAttempts: 0,
    }
  );

  try {
    await EmailHelper.sendEmail(
      user.email,
      buildResetEmailHtml(user.name, code),
      "Your ZOOM IT password reset code"
    );
  } catch (err) {
    console.error("[AuthService.forgotPassword] email send failed:", err);
    // Don't surface the failure to the client — we already wrote the code.
    // The user can request another one if they don't receive an email.
  }

  return { message: successMessage };
};

/**
 * Verify the code and set a new password. Wipes the code on success or on
 * exhausting the attempt budget so the same code can't be brute-forced.
 */
const resetPassword = async (input: {
  email: string;
  code: string;
  newPassword: string;
}) => {
  const normalized = String(input.email || "").trim().toLowerCase();
  const code = String(input.code || "").trim();
  if (!normalized || !code || !input.newPassword) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Email, code, and new password are required"
    );
  }

  const user = await User.findOne({
    email: normalized,
    isDeleted: { $ne: true },
  }).select("+resetCodeHash +resetCodeExpiresAt +resetCodeAttempts");
  if (!user || !user.isActive) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid code or email");
  }

  if (
    !user.resetCodeHash ||
    !user.resetCodeExpiresAt ||
    user.resetCodeExpiresAt.getTime() < Date.now()
  ) {
    // Expired or never issued — clear leftovers if any.
    await User.updateOne(
      { _id: user._id },
      {
        resetCodeHash: null,
        resetCodeExpiresAt: null,
        resetCodeAttempts: 0,
      }
    );
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Reset code has expired. Please request a new one."
    );
  }

  if ((user.resetCodeAttempts ?? 0) >= RESET_CODE_MAX_ATTEMPTS) {
    await User.updateOne(
      { _id: user._id },
      {
        resetCodeHash: null,
        resetCodeExpiresAt: null,
        resetCodeAttempts: 0,
      }
    );
    throw new AppError(
      StatusCodes.TOO_MANY_REQUESTS,
      "Too many attempts. Please request a new code."
    );
  }

  if (hashCode(code) !== user.resetCodeHash) {
    await User.updateOne(
      { _id: user._id },
      { $inc: { resetCodeAttempts: 1 } }
    );
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid code or email");
  }

  const hashed = await bcrypt.hash(
    input.newPassword,
    Number(config.bcrypt_salt_rounds)
  );
  await User.updateOne(
    { _id: user._id },
    {
      password: hashed,
      resetCodeHash: null,
      resetCodeExpiresAt: null,
      resetCodeAttempts: 0,
    }
  );

  return { message: "Password reset successfully. You can now log in." };
};

export const AuthService = {
  loginUser,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
};

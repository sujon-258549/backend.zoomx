import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import jwt, { JwtPayload, TokenExpiredError } from "jsonwebtoken";
import config from "../config";
import AppError from "../errors/appError";
import { UserRole } from "../modules/user/user.interface";
import User from "../modules/user/user.model";
import catchAsync from "../utils/catchAsync";

const auth = (...requiredRoles: UserRole[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      throw new AppError(StatusCodes.UNAUTHORIZED, "You are not authorized!");
    }

    try {
      const decoded = jwt.verify(
        token,
        config.jwt_access_secret as string
      ) as JwtPayload;

      const { role, email } = decoded;

      // Look up by email only — the role string may be stored in either case
      // (legacy lowercase or new uppercase from the dynamic Role table).
      const user = await User.findOne({
        email,
        isActive: true,
        isDeleted: { $ne: true },
      });

      if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, "This user is not found!");
      }

      // Case-insensitive role comparison so legacy lowercase roles
      // (e.g. "super_admin") still match UserRole.SUPER_ADMIN.
      const normalizedRole = String(role ?? user.role ?? "").toUpperCase();
      const normalizedRequired = requiredRoles.map((r) => String(r).toUpperCase());

      if (
        normalizedRequired.length > 0 &&
        !normalizedRequired.includes(normalizedRole)
      ) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "You are not authorized!");
      }

      req.user = {
        ...(decoded as JwtPayload),
        role: normalizedRole,
      } as JwtPayload & { role: string };
      next();
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        return next(
          new AppError(
            StatusCodes.UNAUTHORIZED,
            "Token has expired! Please login again."
          )
        );
      }
      return next(new AppError(StatusCodes.UNAUTHORIZED, "Invalid token!"));
    }
  });
};

export default auth;

import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import AppError from "../errors/appError";
import { RolePermission } from "../modules/rolePermission/rolePermission.model";
import { UserRole } from "../modules/user/user.interface";
import User from "../modules/user/user.model";
import catchAsync from "../utils/catchAsync";

export interface PermissionRequirement {
  module: string;
  action: string;
}

/**
 * Resolves the calling user and returns:
 *   - the user document (for `isActive` / `roleId` access)
 *   - whether they're a SUPER_ADMIN (bypass)
 */
const resolveActingUser = async (req: Request) => {
  const user = (req as any).user;
  if (!user || !user.userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "You are not authorized!");
  }

  const userData = await User.findById(user.userId);
  if (!userData) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found!");
  }
  if (!userData.isActive) {
    throw new AppError(StatusCodes.FORBIDDEN, "User is not active!");
  }

  const isSuperAdmin =
    String(userData.role ?? "").toUpperCase() ===
    String(UserRole.SUPER_ADMIN).toUpperCase();

  return { userData, isSuperAdmin };
};

/** True if the role has the given action on the given module (case-insensitive). */
const hasPermission = async (
  roleId: unknown,
  module: string,
  action: string
): Promise<boolean> => {
  if (!roleId) return false;
  const rp = await RolePermission.findOne({ roleId, module });
  if (!rp) return false;
  const wanted = String(action).toUpperCase();
  return (rp.permissions || []).some(
    (p) => String(p).toUpperCase() === wanted
  );
};

/**
 * Require a single `module + action` permission on the caller's role.
 * SUPER_ADMIN bypasses every check.
 */
const checkPermission = (module: string, action: string) => {
  return catchAsync(
    async (req: Request, _res: Response, next: NextFunction) => {
      const { userData, isSuperAdmin } = await resolveActingUser(req);
      if (isSuperAdmin) return next();

      const ok = await hasPermission(userData.roleId, module, action);
      if (!ok) {
        throw new AppError(
          StatusCodes.FORBIDDEN,
          "You don't have permission to access this resource!"
        );
      }
      next();
    }
  );
};

/**
 * Require ANY of the supplied `{module, action}` requirements — useful when a
 * route serves multiple regions / variants (e.g. BD Services or Egypt Services).
 * SUPER_ADMIN bypasses.
 */
export const checkPermissionAny = (requirements: PermissionRequirement[]) => {
  return catchAsync(
    async (req: Request, _res: Response, next: NextFunction) => {
      const { userData, isSuperAdmin } = await resolveActingUser(req);
      if (isSuperAdmin) return next();

      for (const r of requirements) {
        if (await hasPermission(userData.roleId, r.module, r.action)) {
          return next();
        }
      }
      throw new AppError(
        StatusCodes.FORBIDDEN,
        "You don't have permission to access this resource!"
      );
    }
  );
};

export default checkPermission;

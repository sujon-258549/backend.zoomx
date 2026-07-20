import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/appError";
import { Role } from "../role/role.model";
import User from "../user/user.model";
import { IRolePermission } from "./rolePermission.interface";
import { RolePermission } from "./rolePermission.model";

// Flag every user on this role so the admin panel reloads and picks up the
// new permissions on their next /user/me read.
const flagRoleUsers = async (roleId: unknown) => {
  if (!roleId) return;
  await User.updateMany({ roleId }, { hasPermissionChange: true });
};

const createRolePermission = async (payload: Partial<IRolePermission>) => {
  const role = await Role.findById(payload.roleId);
  if (!role) {
    throw new AppError(StatusCodes.NOT_FOUND, "Role not found");
  }
  const rolePermission = await RolePermission.create(payload);
  await flagRoleUsers(rolePermission.roleId);
  return rolePermission;
};

const getAllRolePermissions = async () => {
  const rolePermissions = await RolePermission.find().populate("roleId");
  return rolePermissions;
};

const getRolePermissionsByRoleId = async (roleId: string) => {
  const rolePermissions = await RolePermission.find({ roleId });
  return rolePermissions;
};

const updateRolePermission = async (
  id: string,
  payload: Partial<IRolePermission>
) => {
  const updated = await RolePermission.findByIdAndUpdate(id, payload, {
    new: true,
  });
  if (!updated) {
    throw new AppError(StatusCodes.NOT_FOUND, "Role permission not found");
  }
  await flagRoleUsers(updated.roleId);
  return updated;
};

const deleteRolePermission = async (id: string) => {
  const deleted = await RolePermission.findByIdAndDelete(id);
  if (!deleted) {
    throw new AppError(StatusCodes.NOT_FOUND, "Role permission not found");
  }
  await flagRoleUsers(deleted.roleId);
  return deleted;
};

export const RolePermissionService = {
  createRolePermission,
  getAllRolePermissions,
  getRolePermissionsByRoleId,
  updateRolePermission,
  deleteRolePermission,
};

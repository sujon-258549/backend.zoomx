import { IPermissions } from "./permissions.interface";
import { Permissions } from "./permissions.model";

export const createPermission = async (payload: IPermissions) => {
  const permission = await Permissions.create(payload);
  return permission;
};

export const updatePermission = async (id: string, payload: IPermissions) => {
  const permission = await Permissions.findByIdAndUpdate(id, payload, { new: true });
  return permission;
};

export const deletePermission = async (id: string) => {
  const permission = await Permissions.findByIdAndDelete(id);
  return permission;
};

export const getAllPermissions = async () => {
  const permissions = await Permissions.find();
  return permissions;
};

export const permissionsService = {
  createPermission,
  updatePermission,
  deletePermission,
  getAllPermissions,
};
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/appError";
import User from "../user/user.model";
import { IRole } from "./role.interface";
import { Role } from "./role.model";

const RoleSearchableFields = ["role", "description"];

const createRole = async (payload: Partial<IRole>) => {
  const existing = await Role.findOne({ role: payload.role });
  if (existing) {
    throw new AppError(StatusCodes.CONFLICT, "Role already exists");
  }
  const role = await Role.create(payload);
  return role;
};

const getAllRoles = async (query: Record<string, unknown>) => {
  const roleQuery = new QueryBuilder(Role.find(), query)
    .search(RoleSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const roles = await roleQuery.modelQuery;
  const meta = await roleQuery.countTotal();

  // Attach employeeCount per role — single aggregate covering just the page.
  const ids = roles.map((r: any) => r._id).filter(Boolean);
  let countMap = new Map<string, number>();
  if (ids.length > 0) {
    const grouped = await User.aggregate<{ _id: Types.ObjectId; count: number }>(
      [
        {
          $match: {
            roleId: { $in: ids },
            isDeleted: { $ne: true },
          },
        },
        { $group: { _id: "$roleId", count: { $sum: 1 } } },
      ]
    );
    countMap = new Map(grouped.map((g) => [String(g._id), g.count]));
  }

  const result = roles.map((r: any) => {
    const plain = typeof r.toObject === "function" ? r.toObject() : r;
    return { ...plain, employeeCount: countMap.get(String(plain._id)) ?? 0 };
  });

  return { result, meta };
};

const getRoleById = async (id: string) => {
  const role = await Role.findById(id);
  if (!role) {
    throw new AppError(StatusCodes.NOT_FOUND, "Role not found");
  }
  return role;
};

const updateRole = async (id: string, payload: Partial<IRole>) => {
  const role = await Role.findByIdAndUpdate(id, payload, { new: true });
  if (!role) {
    throw new AppError(StatusCodes.NOT_FOUND, "Role not found");
  }
  return role;
};

const toggleRoleStatus = async (id: string) => {
  const role = await Role.findById(id);
  if (!role) {
    throw new AppError(StatusCodes.NOT_FOUND, "Role not found");
  }
  role.isActive = !role.isActive;
  const updated = await role.save();
  return updated;
};

const deleteRole = async (id: string) => {
  const role = await Role.findByIdAndDelete(id);
  if (!role) {
    throw new AppError(StatusCodes.NOT_FOUND, "Role not found");
  }
  return role;
};

export const RoleService = {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  toggleRoleStatus,
  deleteRole,
};

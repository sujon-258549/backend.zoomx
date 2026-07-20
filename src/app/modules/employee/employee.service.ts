import bcrypt from "bcrypt";
import { StatusCodes } from "http-status-codes";
import QueryBuilder from "../../builder/QueryBuilder";
import config from "../../config";
import AppError from "../../errors/appError";
import { Designation } from "../designation/designation.model";
import { Role } from "../role/role.model";
import { UserSearchableFields } from "../user/user.constant";
import { UserRole } from "../user/user.interface";
import User from "../user/user.model";
import { ICreateEmployee, IUpdateEmployee } from "./employee.interface";

const resolveRole = async (roleId: ICreateEmployee["roleId"]) => {
  const roleDoc = await Role.findById(roleId);
  if (!roleDoc) {
    throw new AppError(StatusCodes.NOT_FOUND, "Role not found");
  }
  if (!roleDoc.isActive) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Role is not active");
  }
  return roleDoc;
};

const resolveDesignation = async (
  designationId: ICreateEmployee["designationId"]
) => {
  if (!designationId) return null;
  const doc = await Designation.findById(designationId);
  if (!doc) {
    throw new AppError(StatusCodes.NOT_FOUND, "Designation not found");
  }
  if (doc.is_active === false) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Designation is not active");
  }
  return doc;
};

// Excludes soft-deleted records. Email uniqueness still applies across the
// whole collection (soft-deleted included), to avoid resurrecting a "ghost"
// account by creating a new one with the same email.
const liveFilter = { isDeleted: { $ne: true } } as const;

const findLiveEmployee = async (id: string) => {
  const employee = await User.findOne({ _id: id, ...liveFilter });
  if (!employee) {
    throw new AppError(StatusCodes.NOT_FOUND, "Employee not found");
  }
  return employee;
};

const createEmployee = async (payload: ICreateEmployee) => {
  const existing = await User.findOne({ email: payload.email });
  if (existing) {
    throw new AppError(StatusCodes.CONFLICT, "Email is already registered");
  }

  const roleDoc = await resolveRole(payload.roleId);
  const designationDoc = await resolveDesignation(payload.designationId);

  const employee = await User.create({
    ...payload,
    role: roleDoc.role.toUpperCase() as UserRole,
    roleId: roleDoc._id,
    designationId: designationDoc?._id,
    clientInfo: {
      device: "system",
      browser: "system",
      ipAddress: "0.0.0.0",
    },
  });

  return employee;
};

const getAllEmployees = async (query: Record<string, unknown>) => {
  const employeeQuery = new QueryBuilder(
    User.find({
      roleId: { $exists: true, $ne: null },
      ...liveFilter,
    })
      .populate({ path: "roleId", select: "_id role" })
      .populate({ path: "designationId", select: "_id name" }),
    query,
  )
    .search(UserSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await employeeQuery.modelQuery;
  const meta = await employeeQuery.countTotal();
  return { result, meta };
};

const getEmployeeById = async (id: string) => {
  const employee = await User.findOne({ _id: id, ...liveFilter })
    .populate({ path: "roleId", select: "_id role" })
    .populate({ path: "designationId", select: "_id name" });
  if (!employee) {
    throw new AppError(StatusCodes.NOT_FOUND, "Employee not found");
  }
  return employee;
};

const updateEmployee = async (id: string, payload: IUpdateEmployee) => {
  const employee = await findLiveEmployee(id);

  if (payload.email && payload.email !== employee.email) {
    const taken = await User.findOne({ email: payload.email });
    if (taken) {
      throw new AppError(StatusCodes.CONFLICT, "Email is already registered");
    }
  }

  const updatePayload: Record<string, unknown> = { ...payload };

  if (payload.roleId) {
    const roleDoc = await resolveRole(payload.roleId);
    updatePayload.roleId = roleDoc._id;
    updatePayload.role = roleDoc.role.toUpperCase();
  }

  if (payload.designationId) {
    const designationDoc = await resolveDesignation(payload.designationId);
    updatePayload.designationId = designationDoc?._id;
  }

  const updated = await User.findByIdAndUpdate(id, updatePayload, {
    new: true,
    runValidators: true,
  })
    .populate({ path: "roleId", select: "_id role" })
    .populate({ path: "designationId", select: "_id name" });

  return updated;
};

const toggleEmployeeStatus = async (id: string) => {
  const employee = await findLiveEmployee(id);
  employee.isActive = !employee.isActive;
  const updated = await employee.save();
  return updated;
};

// Soft delete — flips `isDeleted` so the record disappears from admin lists
// but the row stays in MongoDB (recoverable, keeps related history intact).
const deleteEmployee = async (id: string) => {
  const updated = await User.findOneAndUpdate(
    { _id: id, ...liveFilter },
    { isDeleted: true, isActive: false },
    { new: true }
  );
  if (!updated) {
    throw new AppError(StatusCodes.NOT_FOUND, "Employee not found");
  }
  return { message: "Employee deleted successfully" };
};

const changeEmployeePassword = async (id: string, newPassword: string) => {
  await findLiveEmployee(id);
  const hashed = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds),
  );
  await User.updateOne({ _id: id }, { password: hashed });
  return { message: "Password changed successfully" };
};

export const EmployeeService = {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  toggleEmployeeStatus,
  deleteEmployee,
  changeEmployeePassword,
};

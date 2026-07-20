import bcrypt from "bcrypt";
import { StatusCodes } from "http-status-codes";
import QueryBuilder from "../../builder/QueryBuilder";
import config from "../../config";
import AppError from "../../errors/appError";
import { IJwtPayload } from "../auth/auth.interface";
import { AuthService } from "../auth/auth.service";
import Customer from "../customer/customer.model";
import { Role } from "../role/role.model";
import { RolePermission } from "../rolePermission/rolePermission.model";
import { UserSearchableFields } from "./user.constant";
import { IUser, UserRole } from "./user.interface";
import User from "./user.model";

export const registerUser = async (userData: IUser) => {
  // 🔐 Resolve role from roleId if provided (employee creation flow)
  if (userData.roleId) {
    const roleDoc = await Role.findById(userData.roleId);
    if (!roleDoc) {
      throw new AppError(StatusCodes.NOT_FOUND, "Role not found");
    }
    if (!roleDoc.isActive) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Role is not active");
    }
    userData.role = roleDoc.role.toUpperCase() as UserRole;
  }

  // 🔐 FORCE DEFAULT ROLE
  if (!userData.role) {
    userData.role = UserRole.USER;
  }

  // 🔍 Check email duplication
  const existingUser = await User.findOne({ email: userData.email });

  if (existingUser) {
    throw new AppError(
      StatusCodes.NOT_ACCEPTABLE,
      "Email is already registered"
    );
  }

  // 👤 Create user
  const user = new User(userData);
  const createdUser = await user.save();

  // 👥 Create customer profile
  const profile = new Customer({
    user: createdUser._id,
  });

  await profile.save();

  // 🔐 Auto login after register
  return await AuthService.loginUser({
    email: createdUser.email,
    password: userData.password,
    clientInfo: userData.clientInfo,
  });
};

const getAllUser = async (query: Record<string, unknown>) => {
  const UserQuery = new QueryBuilder(
    // Super admin is a protected system account — never listed to other admins.
    User.find({
      isDeleted: { $ne: true },
      role: { $ne: UserRole.SUPER_ADMIN },
    })
      .populate({ path: "roleId", select: "_id role" })
      .populate({ path: "designationId", select: "_id name" }),
    query
  )
    .search(UserSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await UserQuery.modelQuery;
  const meta = await UserQuery.countTotal();
  return {
    result,
    meta,
  };
};

const myProfile = async (authUser: IJwtPayload) => {
  const isUserExists = await User.findById(authUser.userId)
    .populate({ path: "roleId", select: "_id role" })
    .populate({ path: "designationId", select: "_id name" });
  if (!isUserExists || isUserExists.isDeleted) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found!");
  }
  if (!isUserExists.isActive) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User is not active!");
  }

  // Pull this user's role-based permissions: [{ module, actions: ["view",...] }]
  const permissions = isUserExists.roleId
    ? (
        await RolePermission.find({ roleId: isUserExists.roleId }).select(
          "module permissions -_id"
        )
      ).map((rp) => ({
        module: rp.module,
        actions: rp.permissions,
      }))
    : [];

  // Consume-once permission-change flag: return its current value, then reset
  // it so the next read is false (prevents a reload loop on the admin panel).
  const hadPermissionChange = isUserExists.hasPermissionChange === true;
  if (hadPermissionChange) {
    await User.updateOne(
      { _id: authUser.userId },
      { hasPermissionChange: false }
    );
  }

  const {
    password: _pw,
    isActive: _isActive,
    ...userData
  } = isUserExists.toObject();

  return {
    ...userData,
    permissions,
    hasPermissionChange: hadPermissionChange,
  };
};

const updateUserStatus = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User is not found");
  }

  // Super admin is a protected system account — its status can't be toggled.
  if (user.role === UserRole.SUPER_ADMIN) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "Super admin status cannot be changed."
    );
  }

  // Use an update (not .save()) so the model's pre-save hook doesn't
  // re-hash the already-hashed password.
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { isActive: !user.isActive },
    { new: true }
  );
  if (!updatedUser) {
    throw new AppError(StatusCodes.NOT_FOUND, "User is not found");
  }
  return updatedUser;
};

const updateUser = async (userId: string, payload: Partial<IUser>) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User is not found");
  }

  // Super admin is protected: only profile fields (email, name, phone) may be
  // changed. Role, designation and status stay locked.
  if (user.role === UserRole.SUPER_ADMIN) {
    const allowedFields = ["email", "name", "phone"];
    const disallowed = Object.keys(payload).filter(
      (key) => !allowedFields.includes(key)
    );
    if (disallowed.length > 0) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        "Super admin is protected — only email, name and phone can be changed."
      );
    }
  }

  // If updating email, check if it's already taken
  if (payload.email && payload.email !== user.email) {
    const existingUser = await User.findOne({ email: payload.email });
    if (existingUser) {
      throw new AppError(StatusCodes.CONFLICT, "Email is already registered");
    }
  }

  // If updating roleId, resolve and sync the role string
  if (payload.roleId) {
    const roleDoc = await Role.findById(payload.roleId);
    if (!roleDoc) {
      throw new AppError(StatusCodes.NOT_FOUND, "Role not found");
    }
    if (!roleDoc.isActive) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Role is not active");
    }
    payload.role = roleDoc.role.toUpperCase() as UserRole;
  }

  const updatedUser = await User.findByIdAndUpdate(userId, payload, {
    new: true,
    runValidators: true,
  }).populate({ path: "roleId", select: "_id role" });

  return updatedUser;
};

// Soft delete — flips `isDeleted` so the user disappears from admin lists
// but the row stays in MongoDB.
const deleteUser = async (userId: string) => {
  const target = await User.findOne({
    _id: userId,
    isDeleted: { $ne: true },
  });
  if (!target) {
    throw new AppError(StatusCodes.NOT_FOUND, "User is not found");
  }

  // Super admin is a protected system account — it can never be deleted.
  if (target.role === UserRole.SUPER_ADMIN) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "Super admin cannot be deleted."
    );
  }

  // Use an update (not .save()) so the model's pre-save hook doesn't
  // re-hash the already-hashed password.
  await User.updateOne(
    { _id: userId },
    { isDeleted: true, isActive: false }
  );

  return { message: "User deleted successfully" };
};

const changePassword = async (userId: string, newPassword: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User is not found");
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds)
  );

  // Update password directly (bypassing pre-save hook by using updateOne)
  await User.updateOne({ _id: userId }, { password: hashedPassword });

  return { message: "Password changed successfully" };
};

// -------- Profile images --------
// SUPER_ADMIN + ADMIN can list every user's profile image. Everyone else only
// sees their own — same row-level access pattern as ActionLogs.
const AUDIT_PRIVILEGED_ROLES = new Set([UserRole.SUPER_ADMIN, UserRole.ADMIN]);

const uploadProfileImage = async (authUser: IJwtPayload, url: string) => {
  const updated = await User.findByIdAndUpdate(
    authUser.userId,
    { profilePhoto: url },
    { new: true }
  ).select("_id name email profilePhoto role");
  if (!updated) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }
  return updated;
};

const getAllProfileImages = async (authUser: IJwtPayload) => {
  const isPrivileged = AUDIT_PRIVILEGED_ROLES.has(authUser.role as UserRole);
  const scope = isPrivileged
    ? { isDeleted: { $ne: true } }
    : { _id: authUser.userId, isDeleted: { $ne: true } };

  const users = await User.find(scope)
    .select("_id name email profilePhoto role")
    .sort({ updatedAt: -1 });

  return users;
};

export const UserServices = {
  registerUser,
  getAllUser,
  myProfile,
  updateUserStatus,
  updateUser,
  deleteUser,
  changePassword,
  uploadProfileImage,
  getAllProfileImages,
};

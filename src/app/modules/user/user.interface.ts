import { Document, Model, Types } from "mongoose";

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  EDITOR = "EDITOR",
  PUBLISHER = "PUBLISHER",
  USER = "USER",
}

// User Schema Definition
export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  username?: string;
  role: UserRole;
  roleId?: Types.ObjectId;
  designationId?: Types.ObjectId;
  profilePhoto?: string;
  phone?: string;
  clientInfo: {
    device: string;
    browser: string;
    ipAddress: string;
    pcName?: string;
    os?: string;
    userAgent?: string;
  };
  lastLogin: Date;
  isActive: boolean;
  isDeleted: boolean;
  /**
   * Flipped to true when this user's role permissions change. The next
   * `/user/me` read returns it and resets it to false — the admin panel uses
   * it to force a reload so the UI picks up the new access.
   */
  hasPermissionChange?: boolean;
  /** 6-digit reset code (hashed) used for forgot-password flow. */
  resetCodeHash?: string | null;
  /** When the active reset code expires. Null when no code is outstanding. */
  resetCodeExpiresAt?: Date | null;
  /** Failed attempts on the current code; reset after success or expiry. */
  resetCodeAttempts?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserModel extends Model<IUser> {
  //instance methods for checking if passwords are matched
  isPasswordMatched(
    plainTextPassword: string,
    hashedPassword: string
  ): Promise<boolean>;
  isUserExistsByEmail(id: string): Promise<IUser>;
  checkUserExist(userId: string): Promise<IUser>;
}

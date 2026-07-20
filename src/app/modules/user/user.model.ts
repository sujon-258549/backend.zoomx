import bcrypt from "bcrypt";
import { StatusCodes } from "http-status-codes";
import mongoose, { Schema } from "mongoose";
import config from "../../config";
import AppError from "../../errors/appError";
import { IUser, UserModel } from "./user.interface";

// Create the User schema based on the interface
const userSchema = new Schema<IUser, UserModel>(
  {
    name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      trim: true,
      sparse: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    roleId: {
      type: Schema.Types.ObjectId,
      ref: "Role",
    },
    designationId: {
      type: Schema.Types.ObjectId,
      ref: "Designation",
    },
    profilePhoto: {
      type: String,
    },
    phone: {
      type: String,
    },
    clientInfo: {
      device: {
        type: String,
        required: true,
      },
      browser: {
        type: String,
        required: true,
      },
      ipAddress: {
        type: String,
        required: true,
      },
      pcName: {
        type: String,
      },
      os: {
        type: String,
      },
      userAgent: {
        type: String,
      },
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Set true when the user's role permissions change; consumed (reset to
    // false) on the next /user/me read. Drives the admin force-reload.
    hasPermissionChange: {
      type: Boolean,
      default: false,
    },
    // Forgot-password fields. Code is hashed (never stored in plain text); see
    // AuthService.forgotPassword / AuthService.resetPassword for the flow.
    resetCodeHash: {
      type: String,
      default: null,
      select: false,
    },
    resetCodeExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },
    resetCodeAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  const user = this;

  user.password = await bcrypt.hash(
    user.password,
    Number(config.bcrypt_salt_rounds)
  );

  next();
});

userSchema.post("save", function (doc, next) {
  doc.password = "";
  next();
});

userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  },
});

userSchema.statics.isPasswordMatched = async function (
  plainTextPassword,
  hashedPassword
) {
  return await bcrypt.compare(plainTextPassword, hashedPassword);
};

userSchema.statics.isUserExistsByEmail = async function (email: string) {
  return await User.findOne({ email }).select("+password");
};

userSchema.statics.checkUserExist = async function (userId: string) {
  const existingUser = await this.findById(userId);

  if (!existingUser) {
    throw new AppError(StatusCodes.NOT_ACCEPTABLE, "User does not exist!");
  }

  if (!existingUser.isActive) {
    throw new AppError(StatusCodes.NOT_ACCEPTABLE, "User is not active!");
  }

  return existingUser;
};

const User = mongoose.model<IUser, UserModel>("User", userSchema);
export default User;

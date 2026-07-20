import mongoose, { Schema } from "mongoose";
import { IRolePermission } from "./rolePermission.interface";

const rolePermissionSchema = new Schema<IRolePermission>(
  {
    roleId: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    module: {
      type: String,
      required: true,
    },
    permissions: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

export const RolePermission = mongoose.model<IRolePermission>(
  "RolePermission",
  rolePermissionSchema
);

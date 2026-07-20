import { Schema, model } from "mongoose";
import { IPermissions, PERMISSION_ACTIONS } from "./permissions.interface";

const permissionsSchema = new Schema<IPermissions>(
  {
    module: { type: String, required: true, unique: true },
    description: { type: String },
    actions: {
      type: [String],
      required: true,
      enum: PERMISSION_ACTIONS,
    },
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export const Permissions = model<IPermissions>(
  "Permissions",
  permissionsSchema
);

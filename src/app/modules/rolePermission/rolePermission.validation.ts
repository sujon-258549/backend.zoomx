import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const rolePermissionValidation = {
  create: z.object({
    body: z.object({
      roleId: z.string().regex(objectIdRegex, "Invalid role ID format"),
      module: z.string().min(1, "Module is required"),
      permissions: z.array(z.string()).min(1, "Permissions are required"),
    }),
  }),
  update: z.object({
    body: z.object({
      roleId: z
        .string()
        .regex(objectIdRegex, "Invalid role ID format")
        .optional(),
      module: z.string().min(1, "Module is required").optional(),
      permissions: z
        .array(z.string())
        .min(1, "Permissions are required")
        .optional(),
    }),
  }),
};

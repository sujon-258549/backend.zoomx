import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const employeeValidation = {
  create: z.object({
    body: z.object({
      name: z.string().min(1, "Name is required"),
      email: z.string().email("Invalid email address"),
      password: z.string().min(6, "Password must be at least 6 characters long"),
      username: z.string().optional(),
      phone: z.string().optional(),
      profilePhoto: z.string().optional(),
      roleId: z.string().regex(objectIdRegex, "Invalid role ID format"),
      designationId: z
        .string()
        .regex(objectIdRegex, "Invalid designation ID format")
        .optional(),
    }),
  }),
  update: z
    .object({
      body: z
        .object({
          name: z.string().min(1, "Name is required").optional(),
          email: z.string().email("Invalid email address").optional(),
          username: z.string().optional(),
          phone: z.string().optional(),
          profilePhoto: z.string().optional(),
          roleId: z
            .string()
            .regex(objectIdRegex, "Invalid role ID format")
            .optional(),
          designationId: z
            .string()
            .regex(objectIdRegex, "Invalid designation ID format")
            .optional(),
          isActive: z.boolean().optional(),
        })
        .strict(),
    }),
  changePassword: z.object({
    body: z.object({
      newPassword: z
        .string()
        .min(6, "Password must be at least 6 characters long"),
    }),
  }),
};

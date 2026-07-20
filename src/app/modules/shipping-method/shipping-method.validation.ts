import { z } from "zod";

const createShippingMethodValidationSchema = z.object({
  body: z.object({
    title: z.string({ required_error: "Title is required" }),
    description: z.string().optional(),
    price: z.number({ required_error: "Price is required" }).min(0),
    slNumber: z.number().min(1).optional(),
    isDefault: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
});

const updateShippingMethodValidationSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    price: z.number().min(0).optional(),
    slNumber: z.number().min(1).optional(),
    isDefault: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const ShippingMethodValidation = {
  createShippingMethodValidationSchema,
  updateShippingMethodValidationSchema,
};

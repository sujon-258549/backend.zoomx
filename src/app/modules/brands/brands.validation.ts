import { z } from "zod";

// Create Brand Validation
const createBrand = z.object({
  body: z.object({
    name: z.string().min(1).max(50),
    description: z.string().min(1).max(255),
    logo: z.string().max(55),
    website: z.string().url("Website must be a valid URL").max(255).optional(),
    email: z.string().email(),
    phone: z.string().min(1).max(20).optional(),
    address: z.string().max(255).optional(),
  }),
});

// Update Brand Validation (all fields optional)
const updateBrand = z.object({
  body: z.object({
    name: z.string().min(1).max(50).optional(),
    description: z.string().min(1).max(255).optional(),
    logo: z.string().max(50).optional(),
    website: z.string().url("Website must be a valid URL").max(255).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(1).max(20).optional(),
    address: z.string().max(255).optional(),
  }),
});

export const BrandValidation = {
  createBrand,
  updateBrand,
};

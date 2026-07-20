import { z } from "zod";

const colorSchema = z.object({
  name: z.string(),
  value: z.string(),
});

const discountTierSchema = z.object({
  minAmount: z.number().min(0),
  discountAmount: z.number().min(0),
  note: z.string().optional(),
});

const createProductValidationSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Name is required" }),
    slug: z.string().optional(),
    shortDescription: z.string().optional(),
    description: z.string().optional(),
    
    categoryId: z.string({ required_error: "Category ID is required" }),
    brand: z.string().optional(),
    sku: z.string({ required_error: "SKU is required" }),
    
    price: z.number({ required_error: "Price is required" }).min(0),
    discount: z.number().min(0).optional(),
    comparePrice: z.number().min(0).optional(),
    currency: z.string().optional(),
    
    thumbnailId: z.string().optional(),
    galleryIds: z.array(z.string()).optional(),
    
    colors: z.array(colorSchema).optional(),
    sizes: z.array(z.string()).optional(),

    discountTiers: z.array(discountTierSchema).optional(),
    freeShipping: z.boolean().optional(),

    badge: z.string().optional(),
    inStock: z.boolean().optional(),
    stockQuantity: z.number().min(0).optional(),
    taxIncluded: z.boolean().optional(),
    
    liveViewers: z.number().min(0).optional(),
    estimatedDelivery: z.string().optional(),
    
    shippingInfo: z.string().optional(),
    careInfo: z.string().optional(),
    customInfo: z.string().optional(),
    
    status: z.enum(["active", "draft", "archived"]).optional(),
    isDeleted: z.boolean().optional(),
  }),
});

const updateProductValidationSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    slug: z.string().optional(),
    shortDescription: z.string().optional(),
    description: z.string().optional(),
    
    categoryId: z.string().optional(),
    brand: z.string().optional(),
    sku: z.string().optional(),
    
    price: z.number().min(0).optional(),
    discount: z.number().min(0).optional(),
    comparePrice: z.number().min(0).optional(),
    currency: z.string().optional(),
    
    thumbnailId: z.string().optional(),
    galleryIds: z.array(z.string()).optional(),
    
    colors: z.array(colorSchema).optional(),
    sizes: z.array(z.string()).optional(),

    discountTiers: z.array(discountTierSchema).optional(),
    freeShipping: z.boolean().optional(),

    badge: z.string().optional(),
    inStock: z.boolean().optional(),
    stockQuantity: z.number().min(0).optional(),
    taxIncluded: z.boolean().optional(),
    
    liveViewers: z.number().min(0).optional(),
    estimatedDelivery: z.string().optional(),
    
    shippingInfo: z.string().optional(),
    careInfo: z.string().optional(),
    customInfo: z.string().optional(),
    
    status: z.enum(["active", "draft", "archived"]).optional(),
    isDeleted: z.boolean().optional(),
  }),
});

export const ProductValidation = {
  createProductValidationSchema,
  updateProductValidationSchema,
};

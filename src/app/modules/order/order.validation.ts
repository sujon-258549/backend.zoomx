import { z } from "zod";

// The client sends which product (by id, with slug as fallback), the chosen
// variant, and how many. Prices, discounts, shipping and totals are all
// resolved server-side from the product — never trusted from the client.
const orderItemSchema = z
  .object({
    productId: z.string().optional(),
    slug: z.string().optional(),
    name: z.string().optional(),
    size: z.string().optional(),
    color: z.string().optional(),
    qty: z.number().min(1),
  })
  .refine((it) => Boolean(it.productId || it.slug), {
    message: "Each item needs a productId or slug",
  });

const createOrderValidationSchema = z.object({
  body: z.object({
    items: z.array(orderItemSchema).min(1, "Order must have at least one item"),
    customerName: z.string({ required_error: "Name is required" }),
    phone: z
      .string({ required_error: "Phone is required" })
      .regex(
        /^01[3-9]\d{8}$/,
        "Enter a valid Bangladeshi phone number (e.g. 01712345678)"
      ),
    address: z.string({ required_error: "Address is required" }),
    // Optional — omitted / ignored when the order qualifies for free delivery.
    shippingMethodId: z.string().optional(),
    paymentMethod: z.enum(["cod"]).optional(),
    notes: z.string().optional(),
  }),
});

// Admin update — status, an internal note, edited customer info, and/or edited
// line items. Prices/totals are always recomputed server-side from the items.
const updateOrderValidationSchema = z.object({
  body: z.object({
    status: z
      .enum([
        "pending",
        "no-response",
        "hold",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
      ])
      .optional(),
    note: z.string().optional(),
    customerName: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    items: z
      .array(
        z.object({
          productId: z.string().optional(),
          slug: z.string().optional(),
          size: z.string().optional(),
          color: z.string().optional(),
          qty: z.number().min(1),
        })
      )
      .min(1)
      .optional(),
  }),
});

export const OrderValidation = {
  createOrderValidationSchema,
  updateOrderValidationSchema,
};

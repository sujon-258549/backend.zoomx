import { model, Schema } from "mongoose";
import { IOrder, IOrderItem } from "./order.interface";

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    slug: { type: String, required: true },
    name: { type: String, required: true },
    sku: { type: String, trim: true },
    image: { type: String, trim: true },
    size: { type: String, trim: true },
    color: { type: String, trim: true },
    qty: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
    lineDiscount: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    items: { type: [OrderItemSchema], required: true },
    customerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    shippingMethodTitle: { type: String, required: true },
    shippingCost: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    freeDelivery: { type: Boolean, required: true, default: false },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ["cod"], default: "cod" },
    status: {
      type: String,
      enum: [
        "pending",
        "no-response",
        "hold",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },
    notes: { type: String, trim: true },
    adminNotes: {
      type: [
        new Schema(
          {
            text: { type: String, required: true, trim: true },
            author: { type: String, trim: true },
            createdAt: { type: Date, default: Date.now },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    ip: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true, versionKey: false }
);

export const Order = model<IOrder>("Order", OrderSchema);

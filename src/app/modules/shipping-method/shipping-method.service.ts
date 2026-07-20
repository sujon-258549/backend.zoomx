import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/appError";
import { IShippingMethod } from "./shipping-method.interface";
import { ShippingMethod } from "./shipping-method.model";

// The two methods the storefront ships with out of the box. Inserted once, the
// first time the active list is requested on an empty collection.
const DEFAULT_METHODS: IShippingMethod[] = [
  {
    title: "Inside Dhaka",
    description: "Delivered within 1–2 business days",
    price: 70,
    slNumber: 1,
    isDefault: true,
    isActive: true,
  },
  {
    title: "Outside Dhaka",
    description: "Delivered within 3–5 business days",
    price: 130,
    slNumber: 2,
    isDefault: false,
    isActive: true,
  },
];

// When a method is set as default, no other method may stay default.
const clearOtherDefaults = async (exceptId?: string) => {
  await ShippingMethod.updateMany(
    exceptId ? { _id: { $ne: exceptId } } : {},
    { $set: { isDefault: false } }
  );
};

const createShippingMethod = async (payload: IShippingMethod) => {
  const doc = await ShippingMethod.create(payload);
  if (doc.isDefault) {
    await clearOtherDefaults(String(doc._id));
  }
  return doc;
};

// Admin list — everything, ordered by serial.
const getAllShippingMethods = async () => {
  return await ShippingMethod.find().sort({ slNumber: 1, createdAt: 1 });
};

// Public list — active methods only. Seeds the two defaults on first run.
const getActiveShippingMethods = async () => {
  const count = await ShippingMethod.countDocuments({});
  if (count === 0) {
    await ShippingMethod.insertMany(DEFAULT_METHODS);
  }
  return await ShippingMethod.find({ isActive: true }).sort({
    slNumber: 1,
    createdAt: 1,
  });
};

const updateShippingMethod = async (
  id: string,
  payload: Partial<IShippingMethod>
) => {
  const existing = await ShippingMethod.findById(id);
  if (!existing) {
    throw new AppError(StatusCodes.NOT_FOUND, "Shipping method not found.");
  }

  const updated = await ShippingMethod.findByIdAndUpdate(id, payload, {
    new: true,
  });

  if (payload.isDefault) {
    await clearOtherDefaults(id);
  }

  return updated;
};

const deleteShippingMethod = async (id: string) => {
  // Keep at least one method so checkout is never left without options.
  const count = await ShippingMethod.countDocuments({});
  if (count <= 1) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "At least one shipping method must exist."
    );
  }
  const doc = await ShippingMethod.findByIdAndDelete(id);
  if (!doc) {
    throw new AppError(StatusCodes.NOT_FOUND, "Shipping method not found.");
  }
  return doc;
};

export const ShippingMethodService = {
  createShippingMethod,
  getAllShippingMethods,
  getActiveShippingMethods,
  updateShippingMethod,
  deleteShippingMethod,
};

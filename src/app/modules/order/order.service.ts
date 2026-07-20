import { isValidObjectId } from "mongoose";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/appError";
import QueryBuilder from "../../builder/QueryBuilder";
import { Product } from "../product/product.model";
import { ShippingMethod } from "../shipping-method/shipping-method.model";
import { r2PublicUrl } from "../../utils/r2";
import { IOrder, IOrderItem } from "./order.interface";
import { Order } from "./order.model";
import { Counter } from "./counter.model";

// What the client sends per line: which product (id preferred, slug fallback),
// the chosen variant, and how many. Nothing price-related is trusted.
type OrderItemInput = {
  productId?: string;
  slug?: string;
  name?: string;
  size?: string;
  color?: string;
  qty: number;
};

type CreateOrderPayload = {
  items: OrderItemInput[];
  customerName: string;
  phone: string;
  address: string;
  shippingMethodId?: string;
  paymentMethod?: "cod";
  notes?: string;
  ip?: string;
};

// Sequential, per-month order number: SF-<YYYYMM>-<serial>. The serial resets
// each month and comes from an atomic counter, so numbers are gap-free and
// race-safe — e.g. SF-202607-1, SF-202607-2, …
const generateOrderNumber = async () => {
  const now = new Date();
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const counter = await Counter.findByIdAndUpdate(
    `order-${ym}`,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `SF-${ym}-${counter?.seq ?? 1}`;
};

// Price the customer actually pays: the discounted price when set, otherwise the
// regular price. Mirrors the storefront's `sellingPriceOf`.
const sellingPrice = (product: any) => {
  const regular = Number(product.price) || 0;
  const discounted = Number(product.comparePrice) || 0;
  return discounted > 0 ? discounted : regular;
};

// Highest single qualifying discount tier for a line — tiers do NOT stack, the
// biggest one the line qualifies for wins. Mirrors the storefront.
const lineDiscountFor = (
  tiers: Array<{ minAmount?: number; discountAmount?: number }> | undefined,
  lineTotal: number
) =>
  (tiers ?? []).reduce(
    (best, t) =>
      lineTotal >= (t.minAmount ?? 0)
        ? Math.max(best, Number(t.discountAmount) || 0)
        : best,
    0
  );

// Look up a product by id (preferred) or slug. The client is only trusted for
// which product + variant + quantity — never for price.
const findProduct = async (it: OrderItemInput) => {
  const where =
    it.productId && isValidObjectId(it.productId)
      ? { _id: it.productId }
      : { slug: it.slug };
  const product = await Product.findOne(where)
    .populate("thumbnailId", "key")
    .lean();
  if (!product) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `Product not found: ${it.productId || it.slug}`
    );
  }
  return product as any;
};

// Public thumbnail URL for a product, if it has one.
const productImage = (product: any): string | undefined => {
  const thumb = product?.thumbnailId;
  return thumb && typeof thumb === "object" && thumb.key
    ? r2PublicUrl(thumb.key)
    : undefined;
};

// Turn one requested item + its resolved product into a fully-priced line.
// Variant: use what the customer chose; otherwise fall back to the product's
// first colour/size so an order item always carries a variant when the product
// has options.
const priceLine = (product: any, it: OrderItemInput): IOrderItem => {
  const qty = Math.max(1, Number(it.qty) || 1);
  const unitPrice = sellingPrice(product);
  const lineTotal = unitPrice * qty;
  const color = it.color?.trim() || product.colors?.[0]?.name || undefined;
  const size = it.size?.trim() || product.sizes?.[0] || undefined;
  return {
    productId: product._id,
    slug: product.slug,
    name: product.name,
    sku: product.sku,
    image: productImage(product),
    size,
    color,
    qty,
    unitPrice,
    lineTotal,
    lineDiscount: lineDiscountFor(product.discountTiers, lineTotal),
  };
};

// Delivery: free when any product is free-shipping, otherwise the chosen method.
const resolveShipping = async (
  freeDelivery: boolean,
  shippingMethodId?: string
) => {
  if (freeDelivery) return { title: "Free delivery", cost: 0 };
  const method =
    shippingMethodId && isValidObjectId(shippingMethodId)
      ? await ShippingMethod.findById(shippingMethodId).lean()
      : null;
  if (!method) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "A valid delivery option is required."
    );
  }
  return {
    title: (method as any).title,
    cost: Number((method as any).price) || 0,
  };
};

const createOrder = async (payload: CreateOrderPayload) => {
  // 1) Resolve + price every line from the live product. This mirrors the
  //    storefront checkout math exactly (discounted unit price, single best
  //    discount tier) so the saved total matches what the customer saw.
  const products = await Promise.all(payload.items.map(findProduct));
  const items = products.map((product, i) =>
    priceLine(product, payload.items[i])
  );

  // 2) Aggregate money + the free-delivery flag.
  const subtotal = items.reduce((sum, it) => sum + it.lineTotal, 0);
  const discount = items.reduce((sum, it) => sum + it.lineDiscount, 0);
  const freeDelivery = products.some((p) => p.freeShipping === true);

  // 3) Resolve delivery (free, or the selected shipping method).
  const shipping = await resolveShipping(freeDelivery, payload.shippingMethodId);

  // 4) Final total — same formula as the storefront summary.
  const total = Math.max(subtotal - discount, 0) + shipping.cost;

  // 5) Persist.
  const doc: IOrder = {
    orderNumber: await generateOrderNumber(),
    items,
    customerName: payload.customerName,
    phone: payload.phone,
    address: payload.address,
    shippingMethodTitle: shipping.title,
    shippingCost: shipping.cost,
    subtotal,
    discount,
    freeDelivery,
    total,
    paymentMethod: payload.paymentMethod ?? "cod",
    status: "pending",
    notes: payload.notes,
    ip: payload.ip,
  };

  return await Order.create(doc);
};

// `status` may be a single value or a comma list ("pending,hold") → matched
// with $in. Applied as a base filter so QueryBuilder still handles the rest.
const buildStatusFilter = (query: Record<string, unknown>) => {
  const base: Record<string, unknown> = { isDeleted: { $ne: true } };
  if (query.status) {
    const arr = String(query.status)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (arr.length === 1) base.status = arr[0];
    else if (arr.length > 1) base.status = { $in: arr };
    delete query.status;
  }
  return base;
};

// Fill in each item's `image` from the live product for any item that doesn't
// already have one stored (e.g. orders placed before images were denormalised).
// One extra query per page, batched by productId.
const withItemImages = async <T extends { items?: any[] }>(
  orders: T[]
): Promise<T[]> => {
  const ids = new Set<string>();
  const slugs = new Set<string>();
  for (const o of orders) {
    for (const it of o.items ?? []) {
      if (it.image) continue;
      if (it.productId) ids.add(String(it.productId));
      else if (it.slug) slugs.add(String(it.slug));
    }
  }
  if (ids.size === 0 && slugs.size === 0) return orders;

  const products = await Product.find({
    $or: [{ _id: { $in: [...ids] } }, { slug: { $in: [...slugs] } }],
  })
    .select("_id slug thumbnailId")
    .populate("thumbnailId", "key")
    .lean();

  const byId = new Map<string, string | undefined>();
  const bySlug = new Map<string, string | undefined>();
  for (const p of products) {
    const img = productImage(p);
    byId.set(String((p as any)._id), img);
    if ((p as any).slug) bySlug.set(String((p as any).slug), img);
  }

  for (const o of orders) {
    for (const it of o.items ?? []) {
      if (it.image) continue;
      it.image =
        (it.productId && byId.get(String(it.productId))) ||
        (it.slug && bySlug.get(String(it.slug))) ||
        undefined;
    }
  }
  return orders;
};

const getAllOrders = async (query: Record<string, unknown>) => {
  if (!query.sort) query.sort = "-createdAt";
  const base = buildStatusFilter(query);
  const orderQuery = new QueryBuilder(Order.find(base), query)
    .search(["orderNumber", "customerName", "phone"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await orderQuery.countTotal();
  const data = await withItemImages(
    (await orderQuery.modelQuery.lean()) as any[]
  );
  return { meta, data };
};

// Count of (non-deleted) orders per status — powers the tab badges.
const getStatusCounts = async () => {
  const grouped = await Order.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const counts: Record<string, number> = {};
  let total = 0;
  for (const g of grouped) {
    counts[g._id] = g.count;
    total += g.count;
  }
  return { total, counts };
};

const getSingleOrder = async (id: string) => {
  const order = await Order.findById(id).lean();
  if (!order) {
    throw new AppError(StatusCodes.NOT_FOUND, "Order not found.");
  }
  const [enriched] = await withItemImages([order as any]);
  return enriched;
};

type UpdateOrderPayload = {
  status?: string;
  note?: string;
  author?: string;
  customerName?: string;
  phone?: string;
  address?: string;
  items?: OrderItemInput[];
};

// Update an order from the details page: status, customer info, and/or edited
// line items — plus an optional internal note. When items change, everything
// money-related is recomputed server-side (same math as checkout). The
// customer's own `notes` field is never touched here.
const updateOrder = async (id: string, payload: UpdateOrderPayload) => {
  const current = await Order.findById(id);
  if (!current) {
    throw new AppError(StatusCodes.NOT_FOUND, "Order not found.");
  }

  const set: Record<string, unknown> = {};
  if (payload.status) set.status = payload.status;
  if (payload.customerName !== undefined)
    set.customerName = payload.customerName;
  if (payload.phone !== undefined) set.phone = payload.phone;
  if (payload.address !== undefined) set.address = payload.address;

  // Re-price the order when the items are edited.
  if (payload.items && payload.items.length > 0) {
    const products = await Promise.all(payload.items.map(findProduct));
    const items = products.map((product, i) =>
      priceLine(product, payload.items![i])
    );
    const subtotal = items.reduce((sum, it) => sum + it.lineTotal, 0);
    const discount = items.reduce((sum, it) => sum + it.lineDiscount, 0);
    const freeDelivery = products.some((p) => p.freeShipping === true);
    // Keep the originally chosen delivery charge unless it's now free.
    const shippingCost = freeDelivery ? 0 : current.shippingCost;
    const shippingMethodTitle = freeDelivery
      ? "Free delivery"
      : current.shippingMethodTitle;
    const total = Math.max(subtotal - discount, 0) + shippingCost;

    Object.assign(set, {
      items,
      subtotal,
      discount,
      freeDelivery,
      shippingCost,
      shippingMethodTitle,
      total,
    });
  }

  const ops: Record<string, unknown> = {};
  if (Object.keys(set).length > 0) ops.$set = set;
  const note = payload.note?.trim();
  if (note) {
    ops.$push = {
      adminNotes: { text: note, author: payload.author, createdAt: new Date() },
    };
  }

  const order = await Order.findByIdAndUpdate(id, ops, { new: true });
  return order;
};

// Soft delete — move an order to the bin.
const softDeleteOrder = async (id: string) => {
  const order = await Order.findByIdAndUpdate(
    id,
    { isDeleted: true, deletedAt: new Date() },
    { new: true }
  );
  if (!order) {
    throw new AppError(StatusCodes.NOT_FOUND, "Order not found.");
  }
  return order;
};

// The Order Bin — soft-deleted orders only.
const getDeletedOrders = async (query: Record<string, unknown>) => {
  if (!query.sort) query.sort = "-deletedAt";
  const orderQuery = new QueryBuilder(Order.find({ isDeleted: true }), query)
    .search(["orderNumber", "customerName", "phone"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await orderQuery.countTotal();
  const data = await withItemImages(
    (await orderQuery.modelQuery.lean()) as any[]
  );
  return { meta, data };
};

// Restore an order out of the bin.
const restoreOrder = async (id: string) => {
  const order = await Order.findByIdAndUpdate(
    id,
    { isDeleted: false, deletedAt: null },
    { new: true }
  );
  if (!order) {
    throw new AppError(StatusCodes.NOT_FOUND, "Order not found.");
  }
  return order;
};

// Permanent delete — only from the bin.
const hardDeleteOrder = async (id: string) => {
  const order = await Order.findOneAndDelete({ _id: id, isDeleted: true });
  if (!order) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "Order not found in the bin."
    );
  }
  return order;
};

export const OrderService = {
  createOrder,
  getAllOrders,
  getStatusCounts,
  getSingleOrder,
  updateOrder,
  softDeleteOrder,
  getDeletedOrders,
  restoreOrder,
  hardDeleteOrder,
};

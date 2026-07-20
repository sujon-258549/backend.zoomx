import { Types } from "mongoose";
import QueryBuilder from "../../builder/QueryBuilder";
import { IProductReview } from "./productReview.interface";
import { ProductReview } from "./productReview.model";

const createReview = async (payload: IProductReview) => {
  const result = await ProductReview.create(payload);
  return result;
};

// Admin listing — all statuses, with product info and search/filter/paginate.
const getAllReviews = async (query: Record<string, unknown>) => {
  const reviewQuery = new QueryBuilder(
    ProductReview.find().populate("product", "name slug thumbnailId"),
    query
  )
    .search(["name", "emailOrPhone", "comment"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await reviewQuery.countTotal();
  const data = await reviewQuery.modelQuery;
  return { meta, data };
};

// Public — approved reviews for a single product plus a rating summary.
const getApprovedByProduct = async (productId: string) => {
  const filter = {
    product: new Types.ObjectId(productId),
    status: "approved" as const,
  };

  const reviews = await ProductReview.find(filter)
    .sort({ createdAt: -1 })
    .select("name rating comment createdAt");

  const count = reviews.length;
  const average =
    count > 0
      ? Number(
          (reviews.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1)
        )
      : 0;

  // Star distribution: { 5: n, 4: n, ... }
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((r) => {
    distribution[r.rating] = (distribution[r.rating] || 0) + 1;
  });

  return { reviews, summary: { average, count, distribution } };
};

const updateStatus = async (id: string, status: string) => {
  const result = await ProductReview.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );
  return result;
};

const updateReview = async (id: string, payload: Partial<IProductReview>) => {
  const result = await ProductReview.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  return result;
};

const deleteReview = async (id: string) => {
  const result = await ProductReview.findByIdAndDelete(id);
  return result;
};

export const ProductReviewServices = {
  createReview,
  getAllReviews,
  getApprovedByProduct,
  updateStatus,
  updateReview,
  deleteReview,
};

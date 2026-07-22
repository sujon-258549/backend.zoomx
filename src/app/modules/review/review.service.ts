import { IReview } from "./review.interface";
import Review from "./review.model";

const createReview = async (payload: IReview): Promise<IReview> => {
  try {
    if (payload.order === undefined || payload.order === null) {
      const lastReview = await Review.findOne().sort({ order: -1 });
      payload.order = lastReview?.order ? lastReview.order + 1 : 1;
    }
    const result = await Review.create(payload);
    return result;
  } catch (err) {
    console.error("Error creating review:", err);
    throw err;
  }
};

import { r2PublicUrl } from "../../utils/r2";
import QueryBuilder from "../../builder/QueryBuilder";

const getReviews = async (query: Record<string, unknown>) => {
  try {
    const reviewQuery = new QueryBuilder(
      Review.find().populate("avatarId", "key").populate("posterId", "key"),
      query
    )
      .search(["name", "role", "quote"])
      .filter()
      .sort()
      .paginate()
      .fields();

    const result = await reviewQuery.modelQuery;
    const meta = await reviewQuery.countTotal();

    const data = result.map((review: any) => {
      const raw = review.toObject ? review.toObject() : review;
      return {
        ...raw,
        avatarId: raw.avatarId?.key
          ? { _id: raw.avatarId._id, url: r2PublicUrl(raw.avatarId.key) }
          : raw.avatarId ?? null,
        posterId: raw.posterId?.key
          ? { _id: raw.posterId._id, url: r2PublicUrl(raw.posterId.key) }
          : raw.posterId ?? null,
      };
    });

    return {
      meta,
      data,
    };
  } catch (err) {
    console.error("Error getting reviews:", err);
    throw err;
  }
};

const updateReview = async (id: string, payload: Partial<IReview>) => {
  try {
    const result = await Review.findByIdAndUpdate(id, payload, { new: true });
    return result;
  } catch (err) {
    console.error("Error updating review:", err);
    throw err;
  }
};

const deleteReview = async (id: string) => {
  try {
    const isExistReview = await Review.findById({ _id: id });
    if (!isExistReview) {
      throw new Error("Review not found");
    }
    const result = await Review.findByIdAndDelete(id);
    return result;
  } catch (err) {
    console.error("Error deleting review:", err);
    throw err;
  }
};

export const ReviewService = {
  createReview,
  getReviews,
  updateReview,
  deleteReview,
};

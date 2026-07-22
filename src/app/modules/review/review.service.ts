import { IReview } from "./review.interface";
import Review from "./review.model";

const createReview = async (payload: IReview): Promise<IReview> => {
  try {
    const result = await Review.create(payload);
    return result;
  } catch (err) {
    console.error("Error creating review:", err);
    throw err;
  }
};

const getReviews = async () => {
  try {
    const result = await Review.find().sort({ order: 1, createdAt: -1 });
    return result;
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

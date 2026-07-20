import QueryBuilder from "../../builder/QueryBuilder";
import { IComment } from "./comment.interface";
import { Comment } from "./comment.model";
import { revalidateFrontend } from "../../utils/revalidateFrontend";

const createComment = async (payload: IComment) => {
  const result = await Comment.create(payload);
  return result;
};

const getAllComments = async (query: Record<string, unknown>) => {
  const commentQuery = new QueryBuilder(
    Comment.find().populate("blog", "title slug"),
    query
  )
    .search(["name", "emailOrPhone", "comment"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await commentQuery.countTotal();
  const data = await commentQuery.modelQuery;
  return { meta, data };
};

const getPublicCommentsForBlog = async (blogId: string) => {
  const result = await Comment.find({ blog: blogId, status: "approved" }).sort({ createdAt: -1 });
  return result;
};

const updateStatus = async (id: string, status: string) => {
  const result = await Comment.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );
  if (result) {
    await revalidateFrontend();
  }
  return result;
};

const deleteComment = async (id: string) => {
  const result = await Comment.findByIdAndDelete(id);
  if (result) {
    await revalidateFrontend();
  }
  return result;
};

const bulkUpdateStatus = async (ids: string[], status: string) => {
  const result = await Comment.updateMany(
    { _id: { $in: ids } },
    { status }
  );
  if (result.modifiedCount > 0) {
    await revalidateFrontend();
  }
  return result;
};

const bulkDeleteComments = async (ids: string[]) => {
  const result = await Comment.deleteMany({ _id: { $in: ids } });
  if (result.deletedCount > 0) {
    await revalidateFrontend();
  }
  return result;
};

export const CommentServices = {
  createComment,
  getAllComments,
  getPublicCommentsForBlog,
  updateStatus,
  deleteComment,
  bulkUpdateStatus,
  bulkDeleteComments,
};

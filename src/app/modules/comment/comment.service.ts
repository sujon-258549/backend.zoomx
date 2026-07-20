import QueryBuilder from "../../builder/QueryBuilder";
import { IComment } from "./comment.interface";
import { Comment } from "./comment.model";

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

const updateStatus = async (id: string, status: string) => {
  const result = await Comment.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );
  return result;
};

const deleteComment = async (id: string) => {
  const result = await Comment.findByIdAndDelete(id);
  return result;
};

export const CommentServices = {
  createComment,
  getAllComments,
  updateStatus,
  deleteComment,
};

import { Request, Response } from "express";
import { CommentServices } from "./comment.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";

const createComment = catchAsync(async (req: Request, res: Response) => {
  const result = await CommentServices.createComment(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Comment submitted successfully and is awaiting moderation",
    data: result,
  });
}); 

const getAllComments = catchAsync(async (req: Request, res: Response) => {
  const result = await CommentServices.getAllComments(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Comments retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const updateStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const result = await CommentServices.updateStatus(id, status);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Comment status updated successfully",
    data: result,
  });
});

const deleteComment = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CommentServices.deleteComment(id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Comment deleted successfully",
    data: result,
  });
});

export const CommentControllers = {
  createComment,
  getAllComments,
  updateStatus,
  deleteComment,
};

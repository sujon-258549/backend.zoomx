import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import pick from "../../../shared/pick";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { blogFilterableFields } from "./blog.constant";
import { BlogServices } from "./blog.service";

const createBlog = catchAsync(async (req: Request, res: Response) => {
  const result = await BlogServices.createBlog({
    ...req.body,
    author: req.user.userId,
  });
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Blog created successfully",
    data: result,
  });
});

const getAllBlogs = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, blogFilterableFields);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const result = await BlogServices.getAllBlogs(filters, options);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "All blogs fetched successfully",
    data: result,
  });
});

const getSingleBlog = catchAsync(async (req: Request, res: Response) => {
  const result = await BlogServices.getSingleBlog(req.params.slug);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Blog fetched successfully",
    data: result,
  });
});

const updateBlog = catchAsync(async (req: Request, res: Response) => {
  // When blog.author is null, service sets author = lastUpdatedBy (current user)
  const lastUpdatedBy = req.user?.userId;
  const result = await BlogServices.updateBlog(
    req.params.slug,
    req.body,
    lastUpdatedBy
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Blog updated successfully",
    data: result,
  });
});

const deleteBlog = catchAsync(async (req: Request, res: Response) => {
  const result = await BlogServices.deleteBlog(req.params.slug);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Blog deleted successfully",
    data: result,
  });
});

const updateStatus = catchAsync(async (req: Request, res: Response) => {
  const { status } = req.body;
  const result = await BlogServices.updateStatus(req.params.slug, status);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Blog status updated successfully",
    data: result,
  });
});

const getCategoryList = catchAsync(async (req: Request, res: Response) => {
  const result = await BlogServices.getCategoryList();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Category list fetched successfully",
    data: result,
  });
});

const getBlogsByCategory = catchAsync(async (req: Request, res: Response) => {
  const category = req.params.category;
  const filters = pick(req.query, blogFilterableFields);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const result = await BlogServices.getBlogsByCategory(category, filters, options);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Blogs by category fetched successfully",
    data: result,
  });
});

const getBlogsByAuthor = catchAsync(async (req: Request, res: Response) => {
  const username = req.params.username;
  const filters = pick(req.query, blogFilterableFields);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const result = await BlogServices.getBlogsByAuthor(username, filters, options);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Blogs by author fetched successfully",
    data: result,
  });
});

const getAllAuthors = catchAsync(async (req: Request, res: Response) => {
  const result = await BlogServices.getAllAuthors();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Authors fetched successfully",
    data: result,
  });
});

export const BlogControllers = {
  createBlog,
  getAllBlogs,
  getSingleBlog,
  updateBlog,
  deleteBlog,
  updateStatus,
  getCategoryList,
  getBlogsByCategory,
  getBlogsByAuthor,
  getAllAuthors,
};    

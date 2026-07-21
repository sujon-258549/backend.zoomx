import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import pick from "../../../shared/pick";
import catchAsync from "../../utils/catchAsync";
import { revalidateFrontend } from "../../utils/revalidateFrontend";
import sendResponse from "../../utils/sendResponse";
import { caseStudyFilterableFields } from "./caseStudy.constant";
import { CaseStudyServices } from "./caseStudy.service";

const createCaseStudy = catchAsync(async (req: Request, res: Response) => {
  const result = await CaseStudyServices.createCaseStudy({
    ...req.body,
    author_user: req.user?.userId,
  });
  revalidateFrontend(result?.slug);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Case study created successfully",
    data: result,
  });
});

const getAllCaseStudies = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, caseStudyFilterableFields);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const result = await CaseStudyServices.getAllCaseStudies(filters, options);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Case studies fetched successfully",
    data: result,
  });
});

const getFeaturedCaseStudies = catchAsync(async (req: Request, res: Response) => {
  const limit = Number(req.query.limit) || 3;
  const result = await CaseStudyServices.getFeaturedCaseStudies(limit);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Featured case studies fetched successfully",
    data: result,
  });
});

const getRelatedCaseStudies = catchAsync(async (req: Request, res: Response) => {
  const limit = Number(req.query.limit) || 4;
  const result = await CaseStudyServices.getRelatedCaseStudies(req.params.slug, limit);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Related case studies fetched successfully",
    data: result,
  });
});

const getSingleCaseStudy = catchAsync(async (req: Request, res: Response) => {
  const result = await CaseStudyServices.getSingleCaseStudy(req.params.slug);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Case study fetched successfully",
    data: result,
  });
});

const updateCaseStudy = catchAsync(async (req: Request, res: Response) => {
  const result = await CaseStudyServices.updateCaseStudy(
    req.params.slug,
    req.body,
    req.user?.userId
  );
  revalidateFrontend(result?.slug);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Case study updated successfully",
    data: result,
  });
});

const updateStatus = catchAsync(async (req: Request, res: Response) => {
  const { status } = req.body;
  const result = await CaseStudyServices.updateStatus(req.params.slug, status);
  revalidateFrontend(result?.slug);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Case study status updated successfully",
    data: result,
  });
});

const deleteCaseStudy = catchAsync(async (req: Request, res: Response) => {
  const result = await CaseStudyServices.deleteCaseStudy(req.params.slug);
  revalidateFrontend(result?.slug);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Case study deleted successfully",
    data: result,
  });
});

export const CaseStudyControllers = {
  createCaseStudy,
  getAllCaseStudies,
  getFeaturedCaseStudies,
  getRelatedCaseStudies,
  getSingleCaseStudy,
  updateCaseStudy,
  updateStatus,
  deleteCaseStudy,
};

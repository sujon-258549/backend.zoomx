import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import pick from "../../../shared/pick";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { inquiriesSearchableFields } from "./inquiries.constant";
import { inquiriesService } from "./inquiries.service";

// Contact Message Controller
const createContactMessage = catchAsync(async (req: Request, res: Response) => {
  await inquiriesService.createContactMessage(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Message Send Successfully",
  });
});

const allContactMessage = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, inquiriesSearchableFields);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const result = await inquiriesService.allContactMessage(filters, options);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "All contact messages fetched successfully",
    data: result,
  });
});

// Quotation Requests Controller
const createQuotationRequest = catchAsync(
  async (req: Request, res: Response) => {
    await inquiriesService.createQuotationRequest(req.body);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Quotation Send successfully",
    });
  }
);

const allQuotationRequest = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, inquiriesSearchableFields);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const result = await inquiriesService.allQuotationRequest(filters, options);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "All quotation requests fetched successfully",
    data: result,
  });
});

const deleteQuotationRequest = catchAsync(
  async (req: Request, res: Response) => {
    const result = await inquiriesService.deleteQuotationRequest(req.params.id);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Quotation request deleted successfully",
      data: result,
    });
  }
);

const sendQuotationEmail = catchAsync(
  async (req: Request, res: Response) => {
    const result = await inquiriesService.sendQuotationEmail({
      quotationId: req.params.id,
      subject: req.body.subject,
      body: req.body.body,
    });
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Email sent successfully",
      data: result,
    });
  }
);

const sendContactEmail = catchAsync(async (req: Request, res: Response) => {
  const result = await inquiriesService.sendContactEmail({
    contactId: req.params.id,
    subject: req.body.subject,
    body: req.body.body,
  });
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Email sent successfully",
    data: result,
  });
});

export const inquiriesController = {
  createContactMessage,
  createQuotationRequest,
  allContactMessage,
  allQuotationRequest,
  deleteQuotationRequest,
  sendQuotationEmail,
  sendContactEmail,
};

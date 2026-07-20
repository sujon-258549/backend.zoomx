import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { SitemapService } from "./sitemap.service";

const getSitemapData = catchAsync(async (_req: Request, res: Response) => {
  const result = await SitemapService.getSitemapData();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Sitemap generated successfully",
    data: result,
  });
});

export const SitemapController = {
  getSitemapData,
};



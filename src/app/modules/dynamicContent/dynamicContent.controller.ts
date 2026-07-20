import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { DynamicContentService } from './dynamicContent.service';
import { revalidateFrontend } from '../../utils/revalidateFrontend';

const upsertContent = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const result = await DynamicContentService.upsertContent(req.body, userId);
  revalidateFrontend();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Content saved successfully',
    data: result,
  });
});

const bulkUpsertContents = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const result = await DynamicContentService.bulkUpsertContents(
    req.body.contents,
    userId
  );
  revalidateFrontend();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `${result.length} contents saved successfully`,
    data: result,
  });
});

const getContentsByGroup = catchAsync(async (req: Request, res: Response) => {
  const result = await DynamicContentService.getContentsByGroup(
    req.params.group
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Contents retrieved successfully',
    data: result,
  });
});

const getContentsMap = catchAsync(async (req: Request, res: Response) => {
  const group =
    typeof req.query.group === 'string' ? req.query.group : undefined;
  const result = await DynamicContentService.getContentsMap(group);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Content map retrieved successfully',
    data: result,
  });
});

const deleteContent = catchAsync(async (req: Request, res: Response) => {
  const result = await DynamicContentService.deleteContent(req.params.key);
  revalidateFrontend();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Content deleted successfully',
    data: result,
  });
});

const bulkDeleteContents = catchAsync(async (req: Request, res: Response) => {
  const result = await DynamicContentService.bulkDeleteContents(req.body.keys);
  revalidateFrontend();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `${result.deletedCount} contents deleted successfully`,
    data: result,
  });
});

const getAllContents = catchAsync(async (req: Request, res: Response) => {
  const result = await DynamicContentService.getAllContents(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Contents retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getContentHistory = catchAsync(async (req: Request, res: Response) => {
  const take = Number(req.query.take) || 20;
  const result = await DynamicContentService.getContentHistory(
    req.params.key,
    take
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'History retrieved successfully',
    data: result,
  });
});

export const DynamicContentController = {
  upsertContent,
  bulkUpsertContents,
  getContentsByGroup,
  getContentsMap,
  deleteContent,
  bulkDeleteContents,
  getAllContents,
  getContentHistory,
};

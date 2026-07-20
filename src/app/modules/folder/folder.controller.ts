import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { FolderService } from "./folder.service";

const createFolder = catchAsync(async (req: Request, res: Response) => {
  const result = await FolderService.createFolder(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Folder created successfully",
    data: result,
  });
});

const getFolders = catchAsync(async (req: Request, res: Response) => {
  const result = await FolderService.getFolders({
    parent: req.query.parent as string | undefined,
  });
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Folders fetched successfully",
    data: result,
  });
});

const getFolderTree = catchAsync(async (_req: Request, res: Response) => {
  const result = await FolderService.getFolderTree();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Folder tree fetched successfully",
    data: result,
  });
});

const getFolderById = catchAsync(async (req: Request, res: Response) => {
  const result = await FolderService.getFolderById(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Folder fetched successfully",
    data: result,
  });
});

const updateFolder = catchAsync(async (req: Request, res: Response) => {
  const result = await FolderService.updateFolder(req.params.id, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Folder updated successfully",
    data: result,
  });
});

const deleteFolder = catchAsync(async (req: Request, res: Response) => {
  const result = await FolderService.deleteFolder(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Folder deleted successfully",
    data: result,
  });
});

export const FolderController = {
  createFolder,
  getFolders,
  getFolderTree,
  getFolderById,
  updateFolder,
  deleteFolder,
};

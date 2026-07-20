import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/appError";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { MediaLibraryServices } from "./media-library.service";

const getAllMedia = catchAsync(async (req, res) => {
  const result = await MediaLibraryServices.getAllMedia(
    req.query as Record<string, unknown>
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Media listed successfully (latest first)",
    data: result,
  });
});

const deleteMedia = catchAsync(async (req, res) => {
  const raw = (req.params as Record<string, string>)[0];
  if (!raw?.trim()) {
    throw new AppError(StatusCodes.BAD_REQUEST, "File path is required");
  }
  const relativePath = decodeURIComponent(raw);
  await MediaLibraryServices.deleteMedia(relativePath);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Media deleted successfully",
  });
});

const uploadMedia = catchAsync(async (req, res) => {
  if (!req.file) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "No file uploaded",
    });
  }

  const customName =
    typeof req.body.customName === "string" ? req.body.customName : undefined;
  const folder =
    typeof req.body.folder === "string" ? req.body.folder : undefined;
  const createdBy = (req as any).user?.userId as string | undefined;
  const data = await MediaLibraryServices.uploadMedia(
    req.file,
    customName,
    folder,
    createdBy
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Media uploaded successfully",
    data,
  });
});

const renameImage = catchAsync(async (req, res) => {
  const { oldName, newName } = req.body;

  await MediaLibraryServices.renameMedia(oldName, newName);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "File renamed successfully",
  });
});

const moveMedia = catchAsync(async (req, res) => {
  const { key, folder } = req.body;
  if (!key) {
    throw new AppError(StatusCodes.BAD_REQUEST, "key is required");
  }
  const result = await MediaLibraryServices.moveMedia(key, folder);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Media moved successfully",
    data: result,
  });
});

const getBinnedMedia = catchAsync(async (req, res) => {
  const result = await MediaLibraryServices.getBinnedMedia(
    req.query as Record<string, unknown>
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Binned media listed successfully",
    data: result,
  });
});

const restoreMedia = catchAsync(async (req, res) => {
  const raw = (req.params as Record<string, string>)[0];
  if (!raw?.trim()) {
    throw new AppError(StatusCodes.BAD_REQUEST, "File key is required");
  }
  const key = decodeURIComponent(raw);
  const result = await MediaLibraryServices.restoreMedia(key);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Media restored successfully",
    data: result,
  });
});

const permanentDeleteMedia = catchAsync(async (req, res) => {
  const raw = (req.params as Record<string, string>)[0];
  if (!raw?.trim()) {
    throw new AppError(StatusCodes.BAD_REQUEST, "File key is required");
  }
  const key = decodeURIComponent(raw);
  await MediaLibraryServices.permanentDeleteMedia(key);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Media permanently deleted",
  });
});

const bulkRestoreMedia = catchAsync(async (req, res) => {
  const { keys } = req.body;
  if (!Array.isArray(keys) || keys.length === 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, "keys array is required");
  }
  const result = await MediaLibraryServices.bulkRestoreMedia(keys);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `${result.restored} file(s) restored successfully`,
    data: result,
  });
});

const bulkPermanentDeleteMedia = catchAsync(async (req, res) => {
  const { keys } = req.body;
  if (!Array.isArray(keys) || keys.length === 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, "keys array is required");
  }
  const result = await MediaLibraryServices.bulkPermanentDeleteMedia(keys);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `${result.deleted} file(s) permanently deleted`,
    data: result,
  });
});

const getMediaUsage = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await MediaLibraryServices.getMediaUsage(id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Media usage retrieved successfully",
    data: result,
  });
});

export const MediaLibraryControllers = {
  getAllMedia,
  deleteMedia,
  uploadMedia,
  renameImage,
  moveMedia,
  getBinnedMedia,
  restoreMedia,
  permanentDeleteMedia,
  bulkRestoreMedia,
  bulkPermanentDeleteMedia,
  getMediaUsage,
};

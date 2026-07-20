import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { designationService } from './designation.service';

const createDesignation = catchAsync(async (req: Request, res: Response) => {
  const result = await designationService.createDesignation(req.body);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Designation created successfully',
    data: result,
  });
});

const updateDesignation = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await designationService.updateDesignation(id, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Designation updated successfully',
    data: result,
  });
});

const deleteDesignation = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await designationService.deleteDesignation(id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Designation deleted successfully',
  });
});

const getAllDesignations = catchAsync(async (req: Request, res: Response) => {
  const result = await designationService.getAllDesignations();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Designations fetched successfully',
    data: result,
  });
});

const toggleDesignationStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await designationService.toggleDesignationStatus(id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `Designation is now ${result.is_active ? 'active' : 'inactive'}`,
    data: result,
  });
});

export const DesignationController = {
  createDesignation,
  updateDesignation,
  deleteDesignation,
  getAllDesignations,
  toggleDesignationStatus,
};

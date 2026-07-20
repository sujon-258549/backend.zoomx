import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { EmployeeService } from "./employee.service";

const createEmployee = catchAsync(async (req: Request, res: Response) => {
  const data = await EmployeeService.createEmployee(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Employee created successfully",
    data,
  });
});

const getAllEmployees = catchAsync(async (req: Request, res: Response) => {
  const result = await EmployeeService.getAllEmployees(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Employees retrieved successfully",
    meta: result.meta,
    data: result.result,
  });
});

const getEmployeeById = catchAsync(async (req: Request, res: Response) => {
  const data = await EmployeeService.getEmployeeById(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Employee retrieved successfully",
    data,
  });
});

const updateEmployee = catchAsync(async (req: Request, res: Response) => {
  const data = await EmployeeService.updateEmployee(req.params.id, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Employee updated successfully",
    data,
  });
});

const toggleEmployeeStatus = catchAsync(async (req: Request, res: Response) => {
  const data = await EmployeeService.toggleEmployeeStatus(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `Employee is now ${data.isActive ? "active" : "inactive"}`,
    data,
  });
});

const deleteEmployee = catchAsync(async (req: Request, res: Response) => {
  const result = await EmployeeService.deleteEmployee(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
  });
});

const changeEmployeePassword = catchAsync(
  async (req: Request, res: Response) => {
    const { newPassword } = req.body;
    const result = await EmployeeService.changeEmployeePassword(
      req.params.id,
      newPassword
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: result.message,
    });
  }
);

export const EmployeeController = {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  toggleEmployeeStatus,
  deleteEmployee,
  changeEmployeePassword,
};

import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import pick from "../../../shared/pick";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { countryFilterableFields } from "./country.constant";
import { CountryService } from "./country.service";

const createCountry = catchAsync(async (req: Request, res: Response) => {
  const result = await CountryService.createCountry(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Country created successfully",
    data: result,
  });
});

const updateCountry = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CountryService.updateCountry(id, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Country updated successfully",
    data: result,
  });
});

const deleteCountry = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await CountryService.deleteCountry(id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Country deleted successfully",
  });
});

const getAllCountries = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, countryFilterableFields);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const result = await CountryService.getAllCountries(filters, options);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Countries fetched successfully",
    data: result,
  });
});

const getCountryById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CountryService.getCountryById(id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Country fetched successfully",
    data: result,
  });
});

const toggleCountryStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CountryService.toggleCountryStatus(id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `Country is now ${result.isActive ? "active" : "inactive"}`,
    data: result,
  });
});

const updateCountrySerial = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { serial_no } = req.body as { serial_no: number };
  const result = await CountryService.updateCountrySerial(id, serial_no);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Country serial updated successfully",
    data: result,
  });
});

export const CountryController = {
  createCountry,
  updateCountry,
  deleteCountry,
  getAllCountries,
  getCountryById,
  toggleCountryStatus,
  updateCountrySerial,
};

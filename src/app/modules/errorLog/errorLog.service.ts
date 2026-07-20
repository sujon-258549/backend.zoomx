import { paginationHelper } from "../../helpers/paginationHelper";
import { IPaginationOptions } from "../../interface/pagination";
import {
  errorLogFilterableFields,
  errorLogSearchableFields,
} from "./errorLog.constant";
import { IErrorLog } from "./errorLog.interface";
import { ErrorLog } from "./errorLog.model";

const recordError = async (payload: Partial<IErrorLog>) => {
  try {
    await ErrorLog.create(payload);
  } catch {
    // Swallow — never throw from inside the error handler itself.
  }
};

const getAllErrorLogs = async (
  params: Record<string, unknown>,
  options: IPaginationOptions
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { keyword, ...rest } = params;

  // Only keep whitelisted filter fields.
  const filters: Record<string, unknown> = {};
  Object.entries(rest).forEach(([key, value]) => {
    if (errorLogFilterableFields.includes(key) && value !== undefined) {
      filters[key] = value;
    }
  });

  // Keyword search across `message`, `route`, `email`.
  const search = keyword
    ? {
        $or: errorLogSearchableFields.map((field) => ({
          [field]: { $regex: keyword, $options: "i" },
        })),
      }
    : {};

  const whereConditions = { ...filters, ...search };

  const data = await ErrorLog.find(whereConditions)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit);

  const total = await ErrorLog.countDocuments(whereConditions);
  const totalPage = Math.ceil(total / limit);

  return {
    meta: { page, limit, total, totalPage },
    data,
  };
};

const deleteErrorLog = async (id: string) => {
  return ErrorLog.findByIdAndDelete(id);
};

const clearAllErrorLogs = async () => {
  return ErrorLog.deleteMany({});
};

export const ErrorLogServices = {
  recordError,
  getAllErrorLogs,
  deleteErrorLog,
  clearAllErrorLogs,
};

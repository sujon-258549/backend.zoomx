import { paginationHelper } from "../../helpers/paginationHelper";
import { IPaginationOptions } from "../../interface/pagination";
import { ActionLog } from "./actionLog.model";

const getAllActionLogs = async (params: any, options: IPaginationOptions) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { keyword, ...filterData } = params;

  const filterCondition =
    Object.keys(filterData).length > 0
      ? {
          $and: Object.entries(filterData).map(([key, value]) => ({
            [key]: value,
          })),
        }
      : {};

  const whereConditions = {
    ...filterCondition,
  };

  const data = await ActionLog.find(whereConditions)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit);

  const total = await ActionLog.countDocuments(whereConditions);

  return {
    meta: {
      page,
      limit,
      total,
    },
    data,
  };
};

export const ActionLogServices = {
  getAllActionLogs,
};

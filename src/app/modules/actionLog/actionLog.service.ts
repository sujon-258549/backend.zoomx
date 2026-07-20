import { JwtPayload } from "jsonwebtoken";
import { paginationHelper } from "../../helpers/paginationHelper";
import { IPaginationOptions } from "../../interface/pagination";
import { ActionLog } from "./actionLog.model";

// Roles that can see every user's logs. Everyone else is scoped to their own
// email — the "row-level access" pattern used across the rest of the panel.
const AUDIT_PRIVILEGED_ROLES = new Set(["SUPER_ADMIN", "ADMIN"]);

const getAllActionLogs = async (
  params: any,
  options: IPaginationOptions,
  currentUser: JwtPayload,
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { ...filterData } = params;

  const filterCondition =
    Object.keys(filterData).length > 0
      ? {
          $and: Object.entries(filterData).map(([key, value]) => ({
            [key]: value,
          })),
        }
      : {};

  // Non-privileged users can only see their own actions. This overrides any
  // ?email=... query param they might try to send, so no lateral peeking.
  const isPrivileged = AUDIT_PRIVILEGED_ROLES.has(currentUser?.role);
  const scopeCondition = isPrivileged
    ? {}
    : { email: currentUser?.email };

  const whereConditions = {
    ...filterCondition,
    ...scopeCondition,
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

import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/appError";
import { paginationHelper } from "../../helpers/paginationHelper";
import { IPaginationOptions } from "../../interface/pagination";
import { teamMemberSearchableFields } from "./teamMember.constant";
import { ITeamMember } from "./teamMember.interface";
import TeamMember from "./teamMember.model";

const createTeamMember = async (payload: Partial<ITeamMember>) => {
  const count = await TeamMember.countDocuments();
  const docToCreate = { ...payload, serial_no: count + 1 };
  const result = await TeamMember.create(docToCreate);
  return result;
};

const updateTeamMember = async (id: string, payload: Partial<ITeamMember>) => {
  const { serial_no: _ignored, ...rest } = payload;
  const result = await TeamMember.findByIdAndUpdate(id, rest, { new: true });
  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "Team member not found");
  }
  return result;
};

const deleteTeamMember = async (id: string) => {
  const target = await TeamMember.findById(id);
  if (!target) {
    throw new AppError(StatusCodes.NOT_FOUND, "Team member not found");
  }
  const removedSerial = target.serial_no;
  await TeamMember.findByIdAndDelete(id);
  await TeamMember.updateMany(
    { serial_no: { $gt: removedSerial } },
    { $inc: { serial_no: -1 } }
  );
  return target;
};

const getAllTeamMembers = async (
  params: Record<string, unknown>,
  options: IPaginationOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination({
      ...options,
      sortBy: options.sortBy || "serial_no",
      sortOrder: options.sortOrder || "asc",
    });
  const { keyword, ...filterData } = params;

  const searchCondition =
    keyword && teamMemberSearchableFields.length > 0
      ? {
          $or: teamMemberSearchableFields.map((field) => ({
            [field]: { $regex: keyword, $options: "i" },
          })),
        }
      : {};

  const filterCondition =
    Object.keys(filterData).length > 0
      ? {
          $and: Object.entries(filterData).map(([key, value]) => ({
            [key]: value,
          })),
        }
      : {};

  const whereConditions = {
    ...searchCondition,
    ...filterCondition,
  };

  const data = await TeamMember.find(whereConditions)
    .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
    .skip(skip)
    .limit(limit);

  const total = await TeamMember.countDocuments(whereConditions);

  return {
    meta: { page, limit, total },
    data,
  };
};

const getTeamMemberById = async (id: string) => {
  const result = await TeamMember.findById(id);
  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "Team member not found");
  }
  return result;
};

const toggleTeamMemberStatus = async (id: string) => {
  const member = await TeamMember.findById(id);
  if (!member) {
    throw new AppError(StatusCodes.NOT_FOUND, "Team member not found");
  }
  member.isActive = !member.isActive;
  const result = await member.save();
  return result;
};

const toggleTeamMemberIsNew = async (id: string) => {
  const member = await TeamMember.findById(id);
  if (!member) {
    throw new AppError(StatusCodes.NOT_FOUND, "Team member not found");
  }
  member.is_new = !member.is_new;
  const result = await member.save();
  return result;
};

const toggleTeamMemberIsTeamLead = async (id: string) => {
  const member = await TeamMember.findById(id);
  if (!member) {
    throw new AppError(StatusCodes.NOT_FOUND, "Team member not found");
  }
  member.isTeamLead = !member.isTeamLead;
  const result = await member.save();
  return result;
};

const updateTeamMemberSerial = async (id: string, targetSerial: number) => {
  const member = await TeamMember.findById(id);
  if (!member) {
    throw new AppError(StatusCodes.NOT_FOUND, "Team member not found");
  }

  const total = await TeamMember.countDocuments();
  if (targetSerial < 1 || targetSerial > total) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `Serial number must be between 1 and ${total}.`
    );
  }

  const sourceSerial = member.serial_no;
  if (sourceSerial === targetSerial) {
    return member;
  }

  if (sourceSerial < targetSerial) {
    await TeamMember.updateMany(
      {
        _id: { $ne: member._id },
        serial_no: { $gt: sourceSerial, $lte: targetSerial },
      },
      { $inc: { serial_no: -1 } }
    );
  } else {
    await TeamMember.updateMany(
      {
        _id: { $ne: member._id },
        serial_no: { $gte: targetSerial, $lt: sourceSerial },
      },
      { $inc: { serial_no: 1 } }
    );
  }

  member.serial_no = targetSerial;
  const result = await member.save();
  return result;
};

export const TeamMemberService = {
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  getAllTeamMembers,
  getTeamMemberById,
  toggleTeamMemberStatus,
  toggleTeamMemberIsNew,
  toggleTeamMemberIsTeamLead,
  updateTeamMemberSerial,
};

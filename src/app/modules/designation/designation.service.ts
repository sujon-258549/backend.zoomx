import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import AppError from "../../errors/appError";
import User from "../user/user.model";
import { IDesignation } from "./designation.interface";
import { Designation } from "./designation.model";
const createDesignation = async (designation: IDesignation) => {
  const newDesignation = await Designation.create(designation);
  return newDesignation;
};

const updateDesignation = async (id: string, designation: IDesignation) => {
  const updatedDesignation = await Designation.findByIdAndUpdate(id, designation, { new: true });
  return updatedDesignation;
};

const deleteDesignation = async (id: string) => {
  const deletedDesignation = await Designation.findByIdAndDelete(id);
  return deletedDesignation;
};

const getAllDesignations = async () => {
  const allDesignations = await Designation.find().sort({ createdAt: -1 });

  // Attach employeeCount per designation — one aggregate, then merge.
  const ids = allDesignations.map((d: any) => d._id).filter(Boolean);
  let countMap = new Map<string, number>();
  if (ids.length > 0) {
    const grouped = await User.aggregate<{ _id: Types.ObjectId; count: number }>(
      [
        {
          $match: {
            designationId: { $in: ids },
            isDeleted: { $ne: true },
          },
        },
        { $group: { _id: "$designationId", count: { $sum: 1 } } },
      ]
    );
    countMap = new Map(grouped.map((g) => [String(g._id), g.count]));
  }

  return allDesignations.map((d: any) => {
    const plain = typeof d.toObject === "function" ? d.toObject() : d;
    return { ...plain, employeeCount: countMap.get(String(plain._id)) ?? 0 };
  });
};

const toggleDesignationStatus = async (id: string) => {
  const designation = await Designation.findById(id);
  if (!designation) {
    throw new AppError(StatusCodes.NOT_FOUND, "Designation not found");
  }
  designation.is_active = !designation.is_active;
  const updatedDesignation = await designation.save();
  return updatedDesignation;
};

export const designationService = {
  createDesignation,
  updateDesignation,
  deleteDesignation,
  getAllDesignations,
  toggleDesignationStatus,
}

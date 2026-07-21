import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/appError";
import { paginationHelper } from "../../helpers/paginationHelper";
import { IPaginationOptions } from "../../interface/pagination";
import { IProject } from "./project.interface";
import ProjectModel from "./project.model";

const createProject = async (payload: IProject) => {
  return (await ProjectModel.create(payload)).populate("category");
};

const getAllProjects = async (params: any, options: IPaginationOptions) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { keyword, status, category } = params;

  const where: Record<string, any> = { is_deleted: { $ne: true } };
  if (status) where.status = status;
  if (category) where.category = category;
  if (keyword) {
    where.$or = [
      { title: { $regex: keyword, $options: "i" } },
      { videoUrl: { $regex: keyword, $options: "i" } },
    ];
  }

  const sort =
    sortBy && sortBy !== "createdAt"
      ? { [sortBy]: sortOrder === "asc" ? 1 : -1 }
      : { createdAt: -1 as const };

  const [data, total] = await Promise.all([
    ProjectModel.find(where)
      .populate("category")
      .sort(sort as any)
      .skip(skip)
      .limit(limit)
      .lean(),
    ProjectModel.countDocuments(where),
  ]);

  return { meta: { page, limit, total }, data };
};

const getProjectById = async (id: string) => {
  const doc = await ProjectModel.findOne({ _id: id, is_deleted: false }).populate("category");
  if (!doc) throw new AppError(StatusCodes.NOT_FOUND, "Project not found.");
  return doc;
};

const updateProject = async (id: string, data: Partial<IProject>) => {
  const existing = await ProjectModel.findOne({ _id: id, is_deleted: false });
  if (!existing) throw new AppError(StatusCodes.NOT_FOUND, "Project not found.");

  return ProjectModel.findByIdAndUpdate(id, data, { new: true }).populate("category");
};

const deleteProject = async (id: string) => {
  const doc = await ProjectModel.findOneAndUpdate(
    { _id: id, is_deleted: false },
    { is_deleted: true },
    { new: true }
  );
  if (!doc) throw new AppError(StatusCodes.NOT_FOUND, "Project not found.");
  return doc;
};

export const ProjectServices = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
};

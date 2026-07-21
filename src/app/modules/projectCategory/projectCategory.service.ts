import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/appError";
import { paginationHelper } from "../../helpers/paginationHelper";
import { IPaginationOptions } from "../../interface/pagination";
import { generateSlug } from "../../utils/slug";
import { IProjectCategory } from "./projectCategory.interface";
import { ProjectCategory } from "./projectCategory.model";

const buildUniqueSlug = async (base: string, ignoreId?: string): Promise<string> => {
  const root = generateSlug(base) || "category";
  let candidate = root;
  let n = 1;
  while (true) {
    const existing = await ProjectCategory.findOne({
      slug: candidate,
      is_deleted: false,
      ...(ignoreId ? { _id: { $ne: ignoreId } } : {}),
    }).select("_id");
    if (!existing) return candidate;
    candidate = `${root}-${n++}`;
  }
};

const createCategory = async (payload: IProjectCategory) => {
  payload.slug = await buildUniqueSlug(payload.slug || payload.name);
  return ProjectCategory.create(payload);
};

const getAllCategories = async (params: any, options: IPaginationOptions) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { keyword, status } = params;

  const count = await ProjectCategory.countDocuments({ is_deleted: false });
  if (count === 0) {
    const defaults = [
      { name: "Youtube Videos", slug: "youtube-videos", aspect: "16/9" as const, cols: 2, status: "active" as const },
      { name: "Shorts", slug: "shorts", aspect: "9/16" as const, cols: 4, status: "active" as const },
      { name: "SAAS Videos", slug: "saas-videos", aspect: "16/9" as const, cols: 2, status: "active" as const },
      { name: "Ad Creatives & VSL", slug: "ad-creatives-vsl", aspect: "9/16" as const, cols: 4, status: "active" as const },
    ];
    await ProjectCategory.insertMany(defaults);
  }

  const where: Record<string, any> = { is_deleted: { $ne: true } };
  if (status) where.status = status;
  if (keyword) {
    where.$or = [
      { name: { $regex: keyword, $options: "i" } },
      { slug: { $regex: keyword, $options: "i" } },
    ];
  }

  const sort =
    sortBy && sortBy !== "createdAt"
      ? { [sortBy]: sortOrder === "asc" ? 1 : -1 }
      : { createdAt: -1 as const };

  const [data, total] = await Promise.all([
    ProjectCategory.find(where).sort(sort as any).skip(skip).limit(limit).lean(),
    ProjectCategory.countDocuments(where),
  ]);

  return { meta: { page, limit, total }, data };
};

const updateCategory = async (id: string, data: Partial<IProjectCategory>) => {
  const existing = await ProjectCategory.findOne({ _id: id, is_deleted: false });
  if (!existing) throw new AppError(StatusCodes.NOT_FOUND, "Category not found.");

  if (data.slug || data.name) {
    data.slug = await buildUniqueSlug(data.slug || data.name || existing.name, id);
  }

  return ProjectCategory.findByIdAndUpdate(id, data, { new: true });
};

const deleteCategory = async (id: string) => {
  const doc = await ProjectCategory.findOneAndUpdate(
    { _id: id, is_deleted: false },
    { is_deleted: true },
    { new: true }
  );
  if (!doc) throw new AppError(StatusCodes.NOT_FOUND, "Category not found.");
  return doc;
};

export const ProjectCategoryServices = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
};

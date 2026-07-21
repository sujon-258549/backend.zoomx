import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/appError";
import { paginationHelper } from "../../helpers/paginationHelper";
import { IPaginationOptions } from "../../interface/pagination";
import { generateSlug } from "../../utils/slug";
import { ICaseStudyCategory } from "./caseStudyCategory.interface";
import { CaseStudyCategory } from "./caseStudyCategory.model";

const buildUniqueSlug = async (base: string, ignoreId?: string): Promise<string> => {
  const root = generateSlug(base) || "category";
  let candidate = root;
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await CaseStudyCategory.findOne({
      slug: candidate,
      is_deleted: false,
      ...(ignoreId ? { _id: { $ne: ignoreId } } : {}),
    }).select("_id");
    if (!existing) return candidate;
    candidate = `${root}-${n++}`;
  }
};

const createCategory = async (payload: ICaseStudyCategory) => {
  payload.slug = await buildUniqueSlug(payload.slug || payload.name);
  return CaseStudyCategory.create(payload);
};

const getAllCategories = async (params: any, options: IPaginationOptions) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { keyword, status } = params;

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
    CaseStudyCategory.find(where).sort(sort as any).skip(skip).limit(limit).lean(),
    CaseStudyCategory.countDocuments(where),
  ]);

  return { meta: { page, limit, total }, data };
};

const updateCategory = async (id: string, data: Partial<ICaseStudyCategory>) => {
  const existing = await CaseStudyCategory.findOne({ _id: id, is_deleted: false });
  if (!existing) throw new AppError(StatusCodes.NOT_FOUND, "Category not found.");

  if (data.slug || data.name) {
    data.slug = await buildUniqueSlug(data.slug || data.name || existing.name, id);
  }

  return CaseStudyCategory.findByIdAndUpdate(id, data, { new: true });
};

const deleteCategory = async (id: string) => {
  const doc = await CaseStudyCategory.findOneAndUpdate(
    { _id: id, is_deleted: false },
    { is_deleted: true },
    { new: true }
  );
  if (!doc) throw new AppError(StatusCodes.NOT_FOUND, "Category not found.");
  return doc;
};

export const CaseStudyCategoryServices = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
};

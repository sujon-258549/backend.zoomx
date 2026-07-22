import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/appError";
import { paginationHelper } from "../../helpers/paginationHelper";
import { IPaginationOptions } from "../../interface/pagination";
import { generateSlug } from "../../utils/slug";
import { IService } from "./service.interface";
import { Service } from "./service.model";

const searchableFields = ["name", "slug", "hero.eyebrow", "hero.titleGradient"];

const categoryPopulate = [{ path: "categoryIds", select: "name slug" }];

const buildUniqueSlug = async (base: string, ignoreId?: string): Promise<string> => {
  const root = generateSlug(base) || "service";
  let candidate = root;
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await Service.findOne({
      slug: candidate,
      is_deleted: false,
      ...(ignoreId ? { _id: { $ne: ignoreId } } : {}),
    }).select("_id");
    if (!existing) return candidate;
    candidate = `${root}-${n++}`;
  }
};

const createService = async (payload: IService): Promise<IService> => {
  payload.slug = await buildUniqueSlug(payload.slug || payload.name);
  return Service.create(payload);
};

const getAllServices = async (params: any, options: IPaginationOptions) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { keyword, category, ...filterData } = params;

  const searchCondition =
    keyword && searchableFields.length > 0
      ? {
          $or: searchableFields.map((field) => ({
            [field]: { $regex: keyword, $options: "i" },
          })),
        }
      : {};

  const filterCondition =
    Object.keys(filterData).length > 0
      ? {
          $and: Object.entries(filterData).map(([key, value]) => {
            let val: any = value;
            if (value === "true") val = true;
            if (value === "false") val = false;
            return { [key]: val };
          }),
        }
      : {};

  const categoryCondition = category ? { categoryIds: category } : {};

  const whereConditions = {
    ...searchCondition,
    ...filterCondition,
    ...categoryCondition,
    is_deleted: { $ne: true },
  };

  const sort =
    sortBy && sortBy !== "createdAt"
      ? { [sortBy]: sortOrder === "asc" ? 1 : -1 }
      : { serial_no: 1 as const, createdAt: -1 as const };

  const [data, total] = await Promise.all([
    Service.find(whereConditions)
      .sort(sort as any)
      .skip(skip)
      .limit(limit)
      .populate(categoryPopulate)
      .lean(),
    Service.countDocuments(whereConditions),
  ]);

  return { meta: { page, limit, total }, data };
};

const getSingleService = async (slug: string): Promise<IService> => {
  const doc = await Service.findOne({ slug, is_deleted: false })
    .populate(categoryPopulate)
    .lean();
  if (!doc) throw new AppError(StatusCodes.NOT_FOUND, "Service not found.");
  return doc as IService;
};

const getFeaturedServices = async (limit = 6): Promise<IService[]> => {
  const raw = await Service.find({
    isFeatured: true,
    status: true,
    is_deleted: { $ne: true },
  })
    .sort({ serial_no: 1, createdAt: -1 })
    .limit(Math.min(Math.max(limit, 1), 20))
    .populate(categoryPopulate)
    .lean();
  return raw as IService[];
};

const updateService = async (
  slug: string,
  data: Partial<IService>,
  lastUpdatedBy?: string
): Promise<IService> => {
  const existing = await Service.findOne({ slug, is_deleted: false }).select("_id");
  if (!existing) {
    throw new AppError(StatusCodes.NOT_FOUND, "Service not found or already deleted.");
  }

  if (data.slug) {
    data.slug = await buildUniqueSlug(data.slug, String(existing._id));
  }

  const setObj: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) setObj[k] = v;
  }
  if (lastUpdatedBy) setObj.last_update_by = lastUpdatedBy;

  const updated = await Service.findOneAndUpdate(
    { _id: existing._id },
    { $set: setObj },
    { new: true }
  )
    .populate(categoryPopulate)
    .lean();

  if (!updated) {
    throw new AppError(StatusCodes.NOT_FOUND, "Service not found or already deleted.");
  }
  return updated as IService;
};

const updateStatus = async (slug: string, status: boolean): Promise<IService> => {
  const doc = await Service.findOneAndUpdate(
    { slug, is_deleted: false },
    { status },
    { new: true }
  ).lean();
  if (!doc) {
    throw new AppError(StatusCodes.NOT_FOUND, "Service not found or already deleted.");
  }
  return doc as IService;
};

const deleteService = async (slug: string): Promise<IService> => {
  const doc = await Service.findOneAndUpdate(
    { slug, is_deleted: false },
    { is_deleted: true },
    { new: true }
  ).lean();
  if (!doc) {
    throw new AppError(StatusCodes.NOT_FOUND, "Service not found or already deleted.");
  }
  return doc as IService;
};

export const ServiceServices = {
  createService,
  getAllServices,
  getSingleService,
  getFeaturedServices,
  updateService,
  updateStatus,
  deleteService,
};

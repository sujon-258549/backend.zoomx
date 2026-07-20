import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/appError";
import { Service } from "../service/service.model";
import { IServicesCountry } from "./servicesCountry.interface";
import { ServicesCountry } from "./servicesCountry.model";

/** Simple URL-safe slug from name when no slug is provided. */
const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const create = async (payload: IServicesCountry) => {
  const slug = (payload.slug?.trim() || slugify(payload.name)).toLowerCase();
  if (!slug) {
    throw new AppError(StatusCodes.BAD_REQUEST, "A valid slug is required.");
  }
  const existing = await ServicesCountry.findOne({
    $or: [{ name: payload.name }, { slug }],
  });
  if (existing) {
    throw new AppError(
      StatusCodes.CONFLICT,
      "A service country with this name or slug already exists."
    );
  }
  return ServicesCountry.create({ ...payload, slug });
};

const getAll = async (
  params: { keyword?: string; isActive?: string | boolean } = {}
) => {
  const where: Record<string, unknown> = {};
  if (params.keyword) {
    where.$or = [
      { name: { $regex: params.keyword, $options: "i" } },
      { slug: { $regex: params.keyword, $options: "i" } },
    ];
  }
  if (params.isActive !== undefined) {
    where.isActive =
      params.isActive === "true" || params.isActive === true;
  }
  return ServicesCountry.find(where).sort({ name: 1 });
};

const getById = async (id: string) => {
  const item = await ServicesCountry.findById(id);
  if (!item) {
    throw new AppError(StatusCodes.NOT_FOUND, "Service country not found.");
  }
  return item;
};

const update = async (id: string, payload: Partial<IServicesCountry>) => {
  const item = await ServicesCountry.findById(id);
  if (!item) {
    throw new AppError(StatusCodes.NOT_FOUND, "Service country not found.");
  }

  const next: Partial<IServicesCountry> = { ...payload };
  // Auto-regenerate slug from name if name changed but slug not provided
  if (payload.name && !payload.slug) {
    next.slug = slugify(payload.name);
  }
  if (next.slug) next.slug = next.slug.toLowerCase();

  if (next.name || next.slug) {
    const conflict = await ServicesCountry.findOne({
      _id: { $ne: id },
      $or: [
        ...(next.name ? [{ name: next.name }] : []),
        ...(next.slug ? [{ slug: next.slug }] : []),
      ],
    });
    if (conflict) {
      throw new AppError(
        StatusCodes.CONFLICT,
        "Another service country with this name or slug already exists."
      );
    }
  }

  return ServicesCountry.findByIdAndUpdate(id, next, {
    new: true,
    runValidators: true,
  });
};

const remove = async (id: string) => {
  const item = await ServicesCountry.findById(id);
  if (!item) {
    throw new AppError(StatusCodes.NOT_FOUND, "Service country not found.");
  }
  // Block delete if any non-deleted service references this country
  const usedBy = await Service.countDocuments({
    servicesCountry: id,
    is_deleted: { $ne: true },
  });
  if (usedBy > 0) {
    throw new AppError(
      StatusCodes.CONFLICT,
      `Cannot delete — this country is currently used by ${usedBy} service${
        usedBy === 1 ? "" : "s"
      }.`
    );
  }
  await ServicesCountry.findByIdAndDelete(id);
  return item;
};

export const ServicesCountryService = {
  create,
  getAll,
  getById,
  update,
  remove,
};

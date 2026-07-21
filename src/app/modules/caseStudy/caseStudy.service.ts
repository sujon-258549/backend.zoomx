import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/appError";
import { paginationHelper } from "../../helpers/paginationHelper";
import { IPaginationOptions } from "../../interface/pagination";
import { generateSlug } from "../../utils/slug";
import { r2PublicUrl } from "../../utils/r2";
import { caseStudySearchableFields } from "./caseStudy.constant";
import { ICaseStudy } from "./caseStudy.interface";
import { CaseStudy } from "./caseStudy.model";

// Populate every Media reference (card video, avatar, hero video) down to its
// key, plus the system users who created / last updated the record.
const mediaPopulate = [
  { path: "videoId", select: "key" },
  { path: "author.avatarId", select: "key" },
  { path: "details.hero.videoId", select: "key" },
  { path: "categoryIds", select: "name slug" },
  { path: "author_user", select: "name email -_id" },
  { path: "last_update_by", select: "name email -_id" },
];

// After .lean(), reshape each populated Media ref to `{ _id, url }` and refresh
// the sibling URL string from the canonical key — mirrors the blog module.
const shapeMediaRefs = (doc: any) => {
  if (!doc) return doc;
  if (doc.videoId?.key) {
    doc.video_url = r2PublicUrl(doc.videoId.key);
    doc.videoId = { _id: doc.videoId._id, url: doc.video_url };
  }
  if (doc.author?.avatarId?.key) {
    doc.author.avatar = r2PublicUrl(doc.author.avatarId.key);
    doc.author.avatarId = { _id: doc.author.avatarId._id, url: doc.author.avatar };
  }
  if (doc.details?.hero?.videoId?.key) {
    doc.details.hero.videoSrc = r2PublicUrl(doc.details.hero.videoId.key);
    doc.details.hero.videoId = {
      _id: doc.details.hero.videoId._id,
      url: doc.details.hero.videoSrc,
    };
  }
  return doc;
};

const buildUniqueSlug = async (base: string, ignoreId?: string): Promise<string> => {
  const root = generateSlug(base) || "case-study";
  let candidate = root;
  let n = 1;
  // Ensure uniqueness among non-deleted docs (sparse unique index also guards this).
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await CaseStudy.findOne({
      slug: candidate,
      is_deleted: false,
      ...(ignoreId ? { _id: { $ne: ignoreId } } : {}),
    }).select("_id");
    if (!existing) return candidate;
    candidate = `${root}-${n++}`;
  }
};

// The "01" printed on the card is derived from the serial number, never entered
// by hand — keep the stored `index` in sync so any reader sees a consistent value.
const indexFromSerial = (serial?: number): string | undefined =>
  serial != null ? String(serial).padStart(2, "0") : undefined;

const createCaseStudy = async (payload: ICaseStudy): Promise<ICaseStudy> => {
  const base = payload.slug || payload.author?.name || payload.quote?.lead || "case-study";
  payload.slug = await buildUniqueSlug(base);
  payload.index = indexFromSerial(payload.serial_no) ?? payload.index;
  const created = await CaseStudy.create(payload);
  return created;
};

const getAllCaseStudies = async (params: any, options: IPaginationOptions) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { keyword, startDate, endDate, ...filterData } = params;

  const searchCondition =
    keyword && caseStudySearchableFields.length > 0
      ? {
          $or: caseStudySearchableFields.map((field) => ({
            [field]: { $regex: keyword, $options: "i" },
          })),
        }
      : {};

  const dateCondition: Record<string, any> = {};
  if (startDate || endDate) {
    dateCondition.createdAt = {};
    if (startDate) dateCondition.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateCondition.createdAt.$lte = end;
    }
  }

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

  const whereConditions = {
    ...searchCondition,
    ...filterCondition,
    ...dateCondition,
    is_deleted: { $ne: true },
  };

  // Default ordering: manual serial, then newest. Callers can override via sortBy.
  const sort =
    sortBy && sortBy !== "createdAt"
      ? { [sortBy]: sortOrder === "asc" ? 1 : -1 }
      : { serial_no: 1 as const, createdAt: -1 as const };

  const [rawData, total] = await Promise.all([
    CaseStudy.find(whereConditions)
      .sort(sort as any)
      .skip(skip)
      .limit(limit)
      .populate(mediaPopulate)
      .lean(),
    CaseStudy.countDocuments(whereConditions),
  ]);

  return {
    meta: { page, limit, total },
    data: rawData.map(shapeMediaRefs),
  };
};

const getSingleCaseStudy = async (slug: string): Promise<ICaseStudy> => {
  const doc = await CaseStudy.findOne({ slug, is_deleted: false })
    .populate(mediaPopulate)
    .lean();
  if (!doc) throw new AppError(StatusCodes.NOT_FOUND, "Case study not found.");
  return shapeMediaRefs(doc) as ICaseStudy;
};

/**
 * Latest case studies related to the given one — those sharing at least one
 * category, newest first, excluding itself. If there aren't enough category
 * matches, it's topped up with the latest other published case studies so the
 * details page section is never empty.
 */
const getRelatedCaseStudies = async (
  slug: string,
  limit = 4
): Promise<ICaseStudy[]> => {
  const current = await CaseStudy.findOne({ slug, is_deleted: false })
    .select("categoryIds")
    .lean();
  if (!current) return [];

  const cap = Math.min(Math.max(limit, 1), 12);
  const baseFilter = {
    slug: { $ne: slug },
    status: true,
    is_deleted: { $ne: true },
  };

  const categoryIds = ((current as any).categoryIds || []) as unknown[];
  let raw: any[] = [];

  if (categoryIds.length > 0) {
    raw = await CaseStudy.find({ ...baseFilter, categoryIds: { $in: categoryIds } })
      .sort({ createdAt: -1 })
      .limit(cap)
      .populate(mediaPopulate)
      .lean();
  }

  // Top up with the latest others when category matches fall short.
  if (raw.length < cap) {
    const excludeIds = raw.map((r) => r._id);
    const fill = await CaseStudy.find({
      ...baseFilter,
      _id: { $nin: excludeIds },
    })
      .sort({ createdAt: -1 })
      .limit(cap - raw.length)
      .populate(mediaPopulate)
      .lean();
    raw = [...raw, ...fill];
  }

  return raw.map(shapeMediaRefs) as ICaseStudy[];
};

const getFeaturedCaseStudies = async (limit = 3): Promise<ICaseStudy[]> => {
  const raw = await CaseStudy.find({
    isFeatured: true,
    status: true,
    is_deleted: { $ne: true },
  })
    .sort({ serial_no: 1, createdAt: -1 })
    .limit(Math.min(Math.max(limit, 1), 20))
    .populate(mediaPopulate)
    .lean();
  return raw.map(shapeMediaRefs) as ICaseStudy[];
};

const updateCaseStudy = async (
  slug: string,
  data: Partial<ICaseStudy>,
  lastUpdatedBy?: string
): Promise<ICaseStudy> => {
  const existing = await CaseStudy.findOne({ slug, is_deleted: false }).select("_id");
  if (!existing) {
    throw new AppError(StatusCodes.NOT_FOUND, "Case study not found or already deleted.");
  }

  // Regenerate slug only when the caller explicitly sends a new one.
  if (data.slug) {
    data.slug = await buildUniqueSlug(data.slug, String(existing._id));
  }

  const setObj: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) setObj[k] = v;
  }
  // Keep the card number in sync whenever the serial changes.
  if (data.serial_no != null) setObj.index = indexFromSerial(data.serial_no);
  if (lastUpdatedBy) setObj.last_update_by = lastUpdatedBy;

  const updated = await CaseStudy.findOneAndUpdate(
    { _id: existing._id },
    { $set: setObj },
    { new: true }
  )
    .populate(mediaPopulate)
    .lean();

  if (!updated) {
    throw new AppError(StatusCodes.NOT_FOUND, "Case study not found or already deleted.");
  }
  return shapeMediaRefs(updated) as ICaseStudy;
};

const updateStatus = async (slug: string, status: boolean): Promise<ICaseStudy> => {
  const doc = await CaseStudy.findOneAndUpdate(
    { slug, is_deleted: false },
    { status },
    { new: true }
  ).lean();
  if (!doc) {
    throw new AppError(StatusCodes.NOT_FOUND, "Case study not found or already deleted.");
  }
  return doc as ICaseStudy;
};

const deleteCaseStudy = async (slug: string): Promise<ICaseStudy> => {
  const doc = await CaseStudy.findOneAndUpdate(
    { slug, is_deleted: false },
    { is_deleted: true },
    { new: true }
  ).lean();
  if (!doc) {
    throw new AppError(StatusCodes.NOT_FOUND, "Case study not found or already deleted.");
  }
  return doc as ICaseStudy;
};

export const CaseStudyServices = {
  createCaseStudy,
  getAllCaseStudies,
  getSingleCaseStudy,
  getFeaturedCaseStudies,
  getRelatedCaseStudies,
  updateCaseStudy,
  updateStatus,
  deleteCaseStudy,
};

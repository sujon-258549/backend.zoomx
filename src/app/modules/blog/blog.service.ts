import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/appError";
import { paginationHelper } from "../../helpers/paginationHelper";
import { IPaginationOptions } from "../../interface/pagination";
import { withCache } from "../../shared/redis";
import { generateSlug } from "../../utils/slug";
import User from "../user/user.model";
import {
  BLOG_CACHE,
  BLOG_KEYS,
  hashQuery,
  invalidateBlogCache,
} from "./blog.cache";
import {
  blogByAuthorSelectFields,
  blogListSelectFields,
  blogSearchableFields,
} from "./blog.constant";
import { IBlog } from "./blog.interface";
import { Blog } from "./blog.model";

const createBlog = async (payload: IBlog): Promise<IBlog> => {
  if (!payload.slug) {
    const slug = generateSlug(payload.title);
    payload.slug = slug;
  }
  const existing = await Blog.findOne({
    slug: payload.slug,
    is_deleted: false,
  });
  if (existing) {
    throw new AppError(
      StatusCodes.CONFLICT,
      "A blog with this title already exists."
    );
  }

  const created = await Blog.create(payload);
  await invalidateBlogCache();
  return created;
};

const getAllBlogs = async (params: any, options: IPaginationOptions) => {
  const cacheKey = BLOG_KEYS.list(
    hashQuery({ ...params, ...(options as Record<string, unknown>) })
  );

  return withCache({ key: cacheKey, ttl: BLOG_CACHE.LIST_TTL }, async () => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { keyword, startDate, endDate, ...filterData } = params;

  // Search condition
  const searchCondition =
    keyword && blogSearchableFields.length > 0
      ? {
          $or: blogSearchableFields.map((field) => ({
            [field]: { $regex: keyword, $options: "i" },
          })),
        }
      : {};

  // Date condition
  const dateCondition: Record<string, any> = {};
  if (startDate || endDate) {
    dateCondition.createdAt = {};
    if (startDate) dateCondition.createdAt.$gte = new Date(startDate);
    if (endDate) {
      // Set to end of day to include the end date fully
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateCondition.createdAt.$lte = end;
    }
  }

  // Filter condition
  const filterCondition =
    Object.keys(filterData).length > 0
      ? {
          $and: Object.entries(filterData).map(([key, value]) => {
            let val = value;
            if (value === 'true') val = true;
            if (value === 'false') val = false;
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
// console.log("getAllBlogs with conditions:", whereConditions, { page, limit, sortBy, sortOrder });
  const data = await Blog.find(whereConditions)
    .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
    .allowDiskUse(true)
    .skip(skip)
    .limit(limit)
    .populate({
      path: "author",
      select: "name email username -_id",
    })
    .populate({
      path: "last_update_by",
      select: "name email profilePhoto -_id",
    })
    .select("-_id -content -seo");

  const total = await Blog.countDocuments(whereConditions);

  return {
    meta: {
      page,
      limit,
      total,
    },
    data,
  };
  });
};

const getSingleBlog = async (slug: string): Promise<IBlog> => {
  // Cache-aside: fetch DB result only on miss. AppError still throws when
  // the blog is missing because withCache does not cache null/undefined.
  const cached = await withCache<IBlog | null>(
    { key: BLOG_KEYS.single(slug), ttl: BLOG_CACHE.SINGLE_TTL },
    async () => {
      const blog = await Blog.findOne({ slug: slug, is_deleted: false })
        .populate({ path: "author", select: "name email username -_id" })
        .populate({ path: "last_update_by", select: "name email -_id" });
      return blog;
    }
  );
  if (!cached) throw new AppError(StatusCodes.NOT_FOUND, "Blog not found.");
  return cached;
};

const updateBlog = async (
  slug: string,
  data: Partial<IBlog>,
  lastUpdatedBy?: string
): Promise<IBlog> => {
  if (!data.slug) {
    if (data.title) {
      data.slug = generateSlug(data.title);
    } else {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Title is required to generate slug."
      );
    }
  }

  const existingBlog = await Blog.findOne({
    slug: slug,
    is_deleted: false,
  }).select("author");

  if (!existingBlog) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "Blog not found or already deleted."
    );
  }

  // If blog has author, check if that user still exists; if not, replace with lastUpdatedBy
  let shouldSetAuthorToLastUpdatedBy = !existingBlog.author;
  if (existingBlog.author && lastUpdatedBy) {
    const authorUserExists = await User.exists({ _id: existingBlog.author });
    if (!authorUserExists) {
      shouldSetAuthorToLastUpdatedBy = true;
    }
  }

  const updatePayload: Record<string, unknown> = { ...data };
  if (lastUpdatedBy) {
    updatePayload.last_update_by = lastUpdatedBy;
    if (shouldSetAuthorToLastUpdatedBy) {
      updatePayload.author = lastUpdatedBy;
    }
  }

  // Remove undefined so $set doesn't unset fields
  const setObj: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(updatePayload)) {
    if (v !== undefined) setObj[k] = v;
  }

  const filter = { slug: slug, is_deleted: false };

  const updated = await Blog.findOneAndUpdate(
    filter,
    { $set: setObj },
    { new: true }
  );

  // When author was null or invalid (user deleted), ensure it is set (separate update if first $set didn't persist author)
  if (updated && lastUpdatedBy && shouldSetAuthorToLastUpdatedBy && !updated.author) {
    await Blog.updateOne(
      { _id: updated._id },
      { $set: { author: lastUpdatedBy } }
    );
  }

  if (!updated) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "Blog not found or already deleted."
    );
  }

  const blog = await Blog.findById(updated._id)
    .populate("author", "name email profilePhoto")
    .populate("last_update_by", "name email profilePhoto");

  // Update must reflect immediately — invalidate old slug and new slug if changed
  await invalidateBlogCache(slug);
  if (data.slug && data.slug !== slug) {
    await invalidateBlogCache(data.slug);
  }

  return blog!;
};

const deleteBlog = async (slug: string): Promise<IBlog> => {
  const blog = await Blog.findOneAndUpdate(
    { slug, is_deleted: false },
    { is_deleted: true, is_drafted: false, is_published: false },
    { new: true }
  );
  if (!blog)
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "Blog not found or already deleted."
    );
  await invalidateBlogCache(slug);
  return blog;
};

const updateStatus = async (slug: string, status: boolean) => {
  const blog = await Blog.findOneAndUpdate(
    { slug, is_deleted: false },
    { status },
    { new: true }
  );

  if (!blog) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "Blog not found or already deleted."
    );
  }

  // Status toggle must reflect immediately (publish/unpublish affects visibility)
  await invalidateBlogCache(slug);
  return blog;
};

const getCategoryList = async (): Promise<{ name: string; total: number }[]> => {
  return withCache(
    { key: BLOG_KEYS.categoryList, ttl: BLOG_CACHE.CATEGORIES_TTL },
    async () => {
      const result = await Blog.aggregate([
        { $match: { is_deleted: { $ne: true } } },
        { $group: { _id: "$category", total: { $sum: 1 } } },
        { $sort: { total: -1 } },
        {
          $project: {
            name: { $ifNull: ["$_id", "Uncategorized"] },
            total: 1,
            _id: 0,
          },
        },
      ]).allowDiskUse(true);
      return result;
    }
  );
};

const getBlogsByCategory = async (
  category: string,
  params: any,
  options: IPaginationOptions
) => {
  const decodedCategory = decodeURIComponent(category);
  const cacheKey = BLOG_KEYS.byCategory(
    decodedCategory,
    hashQuery({ ...params, ...(options as Record<string, unknown>) })
  );

  return withCache({ key: cacheKey, ttl: BLOG_CACHE.LIST_TTL }, async () => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { keyword, startDate, endDate, ...filterData } = params;

  // Exclude category from filter - we filter by category from URL param
  const { category: _cat, ...restFilter } = filterData;

  const searchCondition =
    keyword && blogSearchableFields.length > 0
      ? {
          $or: blogSearchableFields.map((field) => ({
            [field]: { $regex: keyword, $options: "i" },
          })),
        }
      : {};

  // Date condition
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
    Object.keys(restFilter).length > 0
      ? {
          $and: Object.entries(restFilter).map(([key, value]) => {
            let val = value;
            if (value === 'true') val = true;
            if (value === 'false') val = false;
            return { [key]: val };
          }),
        }
      : {};

  const whereConditions = {
    ...searchCondition,
    ...filterCondition,
    ...dateCondition,
    category: {
      $regex: new RegExp(
        `^${decodedCategory.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        "i"
      ),
    },
    is_deleted: { $ne: true },
  };

  const [data, total, recent_posts] = await Promise.all([
    Blog.find(whereConditions)
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
      .allowDiskUse(true)
      .skip(skip)
      .limit(limit)
      .populate({
        path: "author",
        select: "name email username -_id",
      })
      .select(blogListSelectFields)
      .lean(),
    Blog.countDocuments(whereConditions),
    Blog.find(whereConditions)
      .sort({ createdAt: -1 })
      .allowDiskUse(true)
      .limit(5)
      .populate({
        path: "author",
        select: "name email username -_id",
      })
      .select(blogListSelectFields)
      .lean(),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      category: decodedCategory,
    },
    data,
    recent_posts,
  };
  });
};

const getBlogsByAuthor = async (
  username: string,
  params: any,
  options: IPaginationOptions
) => {
  const cacheKey = BLOG_KEYS.byAuthor(
    username,
    hashQuery({ ...params, ...(options as Record<string, unknown>) })
  );

  return withCache({ key: cacheKey, ttl: BLOG_CACHE.LIST_TTL }, async () => {
  const author = await User.findOne({ username }).select("_id").lean();
  if (!author) {
    throw new AppError(StatusCodes.NOT_FOUND, "Author not found.");
  }
  const authorId = author._id;

  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { keyword, startDate, endDate, ...filterData } = params;

  const searchCondition =
    keyword && blogSearchableFields.length > 0
      ? {
          $or: blogSearchableFields.map((field) => ({
            [field]: { $regex: keyword, $options: "i" },
          })),
        }
      : {};

  // Date condition
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
            let val = value;
            if (value === 'true') val = true;
            if (value === 'false') val = false;
            return { [key]: val };
          }),
        }
      : {};

  const whereConditions = {
    ...searchCondition,
    ...filterCondition,
    ...dateCondition,
    author: authorId,
    is_deleted: { $ne: true },
  };

  const authorPopulate = {
    path: "author",
    select: "name profilePhoto username",
  };

  const mapAuthorToProfile = (items: any[]) =>
    items.map((item) => {
      const author = item.author;
      if (!author) return item;
      return {
        ...item,
        author: {
          name: author.name,
          profile: author.profilePhoto ?? "",
          username: author.username ?? "",
        },
      };
    });

  const [dataRaw, total, recent_postsRaw] = await Promise.all([
    Blog.find(whereConditions)
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
      .allowDiskUse(true)
      .skip(skip)
      .limit(limit)
      .populate(authorPopulate)
      .select(blogByAuthorSelectFields)
      .lean(),
    Blog.countDocuments(whereConditions),
    Blog.find({
      author: authorId,
      is_deleted: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .allowDiskUse(true)
      .limit(10)
      .populate(authorPopulate)
      .select(blogByAuthorSelectFields)
      .lean(),
  ]);

  const data = mapAuthorToProfile(dataRaw);
  const recent_posts = mapAuthorToProfile(recent_postsRaw);

  return {
    meta: {
      page,
      limit,
      total,
      username,
    },
    data,
    recent_posts,
  };
  });
};

const getAllAuthors = async (): Promise<
  { profile: string; name: string; blogs: number; role: string }[]
> => {
  return withCache(
    { key: BLOG_KEYS.authorList, ttl: BLOG_CACHE.AUTHORS_TTL },
    async () => {
      const authorCounts = await Blog.aggregate([
        { $match: { is_deleted: { $ne: true }, author: { $exists: true, $ne: null } } },
        { $group: { _id: "$author", blogs: { $sum: 1 } } },
      ]);

      const authorIds = authorCounts.map((a) => a._id);
      if (authorIds.length === 0) return [];

      const users = await User.find({ _id: { $in: authorIds } })
        .select("name profilePhoto role")
        .lean();

      const countByAuthorId = new Map(
        authorCounts.map((a) => [a._id.toString(), a.blogs])
      );

      return users.map((u) => ({
        profile: u.profilePhoto ?? "",
        name: u.name,
        blogs: countByAuthorId.get(u._id.toString()) ?? 0,
        role: u.role,
      }));
    }
  );
};

export const BlogServices = {
  createBlog,
  getAllBlogs,
  updateBlog,
  getSingleBlog,
  deleteBlog,
  updateStatus,
  getCategoryList,
  getBlogsByCategory,
  getBlogsByAuthor,
  getAllAuthors,
};

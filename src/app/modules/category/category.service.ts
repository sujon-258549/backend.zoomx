import { StatusCodes } from "http-status-codes";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/appError";
import { ICategory } from "./category.interface";
import { Category } from "./category.model";
import { r2PublicUrl } from "../../utils/r2";
import { generateSlug } from "../../utils/slug";

// Insert a category at serial `sl`: everything at/after `sl` shifts down by one,
// so serial numbers never collide.
const createCategory = async (payload: ICategory) => {
  if (!payload.slug && payload.name) {
    payload.slug = generateSlug(payload.name).toLowerCase();
  }

  const count = await Category.countDocuments({});
  let sl = Number(payload.slNumber);
  if (!sl || sl < 1) {
    // No serial given → append to the end.
    sl = count + 1;
  } else {
    sl = Math.min(sl, count + 1);
    // Make room: bump everything at/after this serial up by one.
    await Category.updateMany(
      { slNumber: { $gte: sl } },
      { $inc: { slNumber: 1 } }
    );
  }
  payload.slNumber = sl;

  return await Category.create(payload);
};

const getAllCategories = async (query: Record<string, unknown>) => {
  // Default to serial order unless the caller asked for something else.
  if (!query.sort) query.sort = "slNumber";
  const categoryQuery = new QueryBuilder(Category.find(), query)
    .search(["name", "slug"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await categoryQuery.countTotal();
  let data = await categoryQuery.modelQuery.populate("imageId").populate("image");

  data = data.map((item: any) => {
    const doc = item.toObject ? item.toObject() : item;
    
    // Handle the new imageId field
    if (doc.imageId && typeof doc.imageId === 'object' && doc.imageId.key) {
      doc.imageId = {
        _id: doc.imageId._id,
        url: r2PublicUrl(doc.imageId.key)
      };
    }
    
    // Handle the old image field for existing data
    if (doc.image && typeof doc.image === 'object' && doc.image.key) {
      doc.image = {
        _id: doc.image._id,
        url: r2PublicUrl(doc.image.key)
      };
    }
    
    return doc;
  });

  return { meta, data };
};

const updateCategoryFromDB = async (
  id: string,
  payload: Partial<ICategory>
) => {
  if (payload.name && !payload.slug) {
    payload.slug = generateSlug(payload.name).toLowerCase();
  }

  const existing = await Category.findById(id);
  if (!existing) {
    throw new AppError(StatusCodes.NOT_FOUND, "Category not found.");
  }

  // Re-order without collisions when the serial number changes.
  if (payload.slNumber !== undefined) {
    const count = await Category.countDocuments({});
    const oldS = existing.slNumber || 0;
    const newS = Math.max(1, Math.min(Number(payload.slNumber) || 1, count));

    if (newS !== oldS) {
      if (newS > oldS) {
        // Moving down — pull the ones in between up by one.
        await Category.updateMany(
          { _id: { $ne: id }, slNumber: { $gt: oldS, $lte: newS } },
          { $inc: { slNumber: -1 } }
        );
      } else {
        // Moving up — push the ones in between down by one.
        await Category.updateMany(
          { _id: { $ne: id }, slNumber: { $gte: newS, $lt: oldS } },
          { $inc: { slNumber: 1 } }
        );
      }
    }
    payload.slNumber = newS;
  }

  return await Category.findByIdAndUpdate(id, payload, { new: true });
};

const deleteCategoryFromDB = async (id: string) => {
  const doc = await Category.findByIdAndDelete(id);
  // Close the gap so serial numbers stay contiguous.
  if (doc?.slNumber) {
    await Category.updateMany(
      { slNumber: { $gt: doc.slNumber } },
      { $inc: { slNumber: -1 } }
    );
  }
  return doc;
};

export const CategoryService = {
  createCategory,
  getAllCategories,
  updateCategoryFromDB,
  deleteCategoryFromDB,
};


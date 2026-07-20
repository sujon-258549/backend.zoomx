import QueryBuilder from "../../builder/QueryBuilder";
import { isValidObjectId } from "mongoose";
import { generateSlug } from "../../utils/slug";
import { Category } from "../category/category.model";
import { IProduct } from "./product.interface";
import { Product } from "./product.model";
import { r2PublicUrl } from "../../utils/r2";
import { withCache } from "../../shared/redis";
import {
  PRODUCT_CACHE,
  PRODUCT_KEYS,
  invalidateProductCache,
} from "./product.cache";
import { revalidateFrontend } from "../../utils/revalidateFrontend";

// Discounted price = regular price minus the discount amount. Returns 0 (i.e.
// "no discount") when there is no discount. Never exceeds the regular price.
const discountedPrice = (price: number, discount: number) =>
  discount > 0 ? Math.max(price - discount, 0) : 0;

const createProduct = async (payload: IProduct) => {
  // Always store a URL-safe slug — slugify whatever was provided, or derive it
  // from the name. This prevents a raw name (with spaces/capitals) becoming the
  // slug and leaking into product URLs.
  if (payload.slug) {
    payload.slug = generateSlug(payload.slug).toLowerCase();
  } else if (payload.name) {
    payload.slug = generateSlug(payload.name).toLowerCase();
  }
  // in-stock is derived from stock quantity — 1 or more = in stock.
  payload.inStock = (Number(payload.stockQuantity) || 0) >= 1;

  // `price` is always the regular price (as entered). `discount` is the flat
  // amount off; `comparePrice` is the resulting discounted price (≤ price).
  const price = Number(payload.price) || 0;
  const discount = Number(payload.discount) || 0;
  payload.discount = discount;
  payload.comparePrice = discountedPrice(price, discount);

  const created = await Product.create(payload);
  await invalidateProductCache();
  await revalidateFrontend((created as any)?.slug);
  return created;
};

const getAllProducts = async (query: Record<string, unknown>) => {
  const productQuery = new QueryBuilder(
    Product.find().populate("categoryId", "name slug"),
    query
  )
    .search(["name", "slug", "sku", "brand"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await productQuery.countTotal();
  const docs = await productQuery.modelQuery
    .populate("thumbnailId", "key")
    .lean();

  // Return only the fields a product list/card actually needs — keeps the
  // payload light (no shortDescription, brand, colors, sizes, gallery, etc.).
  const data = docs.map((doc: any) => {
    const cat =
      doc.categoryId && typeof doc.categoryId === "object"
        ? {
            _id: doc.categoryId._id,
            name: doc.categoryId.name,
            slug: doc.categoryId.slug,
          }
        : doc.categoryId ?? null;

    const thumbnail =
      doc.thumbnailId && typeof doc.thumbnailId === "object" && doc.thumbnailId.key
        ? { _id: doc.thumbnailId._id, url: r2PublicUrl(doc.thumbnailId.key) }
        : null;

    return {
      _id: doc._id,
      name: doc.name,
      slug: doc.slug,
      sku: doc.sku,
      price: doc.price,
      discount: doc.discount,
      comparePrice: doc.comparePrice,
      inStock: doc.inStock,
      stockQuantity: doc.stockQuantity,
      status: doc.status,
      badge: doc.badge,
      categoryId: cat,
      thumbnailId: thumbnail,
      createdAt: doc.createdAt,
    };
  });

  return { meta, data };
};

const getSingleProduct = async (idOrSlug: string) => {
  // Accept either a Mongo id or a slug.
  const where = isValidObjectId(idOrSlug)
    ? { $or: [{ _id: idOrSlug }, { slug: idOrSlug }] }
    : { slug: idOrSlug };
  let doc = await Product.findOne(where)
    .populate("categoryId", "name slug")
    .populate("thumbnailId", "key")
    .populate("galleryIds", "key");

  if (doc) {
    const obj: any = doc.toObject();

    // Category: only id, name, slug.
    if (obj.categoryId && typeof obj.categoryId === "object") {
      obj.categoryId = {
        _id: obj.categoryId._id,
        name: obj.categoryId.name,
        slug: obj.categoryId.slug,
      };
    }

    // Thumbnail: only id + public url.
    if (obj.thumbnailId && typeof obj.thumbnailId === "object" && obj.thumbnailId.key) {
      obj.thumbnailId = {
        _id: obj.thumbnailId._id,
        url: r2PublicUrl(obj.thumbnailId.key),
      };
    }

    // Gallery: only id + public url per item.
    if (Array.isArray(obj.galleryIds)) {
      obj.galleryIds = obj.galleryIds.map((media: any) =>
        media && typeof media === "object" && media.key
          ? { _id: media._id, url: r2PublicUrl(media.key) }
          : media
      );
    }

    return obj;
  }

  return null;
};

const updateProduct = async (id: string, payload: Partial<IProduct>) => {
  // Keep the slug URL-safe on edits too — slugify a provided slug, or regenerate
  // from the name when the name changes without a new slug.
  if (payload.slug) {
    payload.slug = generateSlug(payload.slug).toLowerCase();
  } else if (payload.name) {
    payload.slug = generateSlug(payload.name).toLowerCase();
  }
  // Keep in-stock in sync whenever stock quantity is changed.
  if (payload.stockQuantity !== undefined) {
    payload.inStock = (Number(payload.stockQuantity) || 0) >= 1;
  }

  // Recompute the discounted price when the regular price or discount changes.
  if (payload.discount !== undefined || payload.price !== undefined) {
    const existing = await Product.findById(id).lean();
    const price =
      payload.price !== undefined
        ? Number(payload.price)
        : Number((existing as any)?.price) || 0;
    const discount =
      payload.discount !== undefined
        ? Number(payload.discount)
        : Number((existing as any)?.discount) || 0;
    payload.discount = discount;
    payload.comparePrice = discountedPrice(price, discount);
  }

  const updated = await Product.findByIdAndUpdate(id, payload, { new: true });
  await invalidateProductCache();
  await revalidateFrontend((updated as any)?.slug);
  return updated;
};

const deleteProduct = async (id: string) => {
  const deleted = await Product.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true }
  );
  await invalidateProductCache();
  await revalidateFrontend((deleted as any)?.slug);
  return deleted;
};

const withThumbUrl = (p: any) => {
  if (p?.thumbnailId && typeof p.thumbnailId === "object" && p.thumbnailId.key) {
    // Only expose the id + public url for the thumbnail.
    p.thumbnailId = {
      _id: p.thumbnailId._id,
      url: r2PublicUrl(p.thumbnailId.key),
    };
  }
  return p;
};

/**
 * Products grouped by category — for a homepage / catalog view. Each active
 * category returns its name + slug and up to `limit` (default 8) of its newest
 * active products in a `products` array. Categories with no products are
 * skipped. Runs the per-category queries in parallel so it stays fast.
 */
const getProductsByCategory = async (query: Record<string, unknown>) => {
  const perCategory = Math.min(Number(query.limit) || 8, 20);

  return withCache(
    {
      key: PRODUCT_KEYS.byCategory(perCategory),
      ttl: PRODUCT_CACHE.BY_CATEGORY_TTL,
    },
    async () => {
      const categories = await Category.find({
        status: "active",
        isHome: true,
      })
        .sort({ slNumber: 1, name: 1 })
        .lean();

      const groups = await Promise.all(
        categories.map(async (cat: any) => {
          const queryParams = {
            categoryId: cat._id,
            status: "active",
          };

          const total = await Product.countDocuments(queryParams);

          const products = await Product.find(queryParams)
            .sort({ createdAt: -1 })
            .limit(perCategory)
            .select(
              "name slug sku price comparePrice inStock stockQuantity status thumbnailId badge"
            )
            .populate("thumbnailId", "key")
            .lean();

          return {
            _id: cat._id,
            name: cat.name,
            slug: cat.slug,
            total,
            products: products.map(withThumbUrl),
          };
        })
      );

      // Only return categories that actually have products.
      return groups.filter((g) => g.products.length > 0);
    }
  );
};

/**
 * Products for a single category, looked up by the category slug. Returns up to
 * `limit` (default 8) of the newest active products in that category — handy for
 * a category landing page or a "related products" strip. An optional `exclude`
 * product id can be passed to leave the current product out of the list.
 */
const getProductsByCategorySlug = async (
  slug: string,
  query: Record<string, unknown> = {}
) => {
  const limit = Math.min(Number(query.limit) || 8, 20);

  const category = await Category.findOne({ slug, status: "active" }).lean();
  if (!category) {
    return null;
  }

  const where: Record<string, unknown> = {
    categoryId: (category as any)._id,
    status: "active",
    isDeleted: { $ne: true },
  };

  // Skip the current product when this is used as a "related products" list.
  if (query.exclude && isValidObjectId(query.exclude)) {
    where._id = { $ne: query.exclude };
  }

  const products = await Product.find(where)
    .sort({ createdAt: -1 })
    .limit(limit)
    .select(
      "name slug sku price comparePrice inStock stockQuantity status thumbnailId badge"
    )
    .populate("thumbnailId", "key")
    .lean();

  return {
    category: {
      _id: (category as any)._id,
      name: (category as any).name,
      slug: (category as any).slug,
    },
    products: products.map(withThumbUrl),
  };
};

// Active-product count per active category (one query) — used for the
// "All products" page category tabs, e.g. "Voile Fabrics (4)". Ordered by the
// category serial number so the tabs match the rest of the app.
const getCategoryProductCounts = async () => {
  return withCache(
    {
      key: PRODUCT_KEYS.categoryCounts(),
      ttl: PRODUCT_CACHE.CATEGORY_COUNTS_TTL,
    },
    async () => {
      const categories = await Category.find({ status: "active" })
        .sort({ slNumber: 1, name: 1 })
        .select("name slug")
        .lean();

      const grouped = await Product.aggregate([
        { $match: { status: "active", isDeleted: { $ne: true } } },
        { $group: { _id: "$categoryId", count: { $sum: 1 } } },
      ]);

      const countByCat: Record<string, number> = {};
      let total = 0;
      for (const g of grouped) {
        countByCat[String(g._id)] = g.count;
        total += g.count;
      }

      return {
        total,
        categories: categories.map((c: any) => ({
          _id: c._id,
          name: c.name,
          slug: c.slug,
          count: countByCat[String(c._id)] || 0,
        })),
      };
    }
  );
};

export const ProductServices = {
  createProduct,
  getAllProducts,
  getSingleProduct,
  getProductsByCategory,
  getProductsByCategorySlug,
  getCategoryProductCounts,
  updateProduct,
  deleteProduct,
};

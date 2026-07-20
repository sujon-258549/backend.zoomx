import { delByPattern } from "../../shared/redis";

export const PRODUCT_CACHE = {
  CATEGORY_COUNTS_TTL: 60 * 5, // 5 min — category tabs on /products
  BY_CATEGORY_TTL: 60 * 5, // 5 min — home page category groups
} as const;

export const PRODUCT_KEYS = {
  categoryCounts: () => `product:category-counts`,
  byCategory: (limit: number) => `product:by-category:${limit}`,
} as const;

// Any product create / update / delete can change the counts or the category
// groupings, so we clear every product cache entry at once.
export const invalidateProductCache = async () => {
  await delByPattern("product:*");
};

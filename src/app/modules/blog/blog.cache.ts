import { delByPattern, delKey } from "../../shared/redis";

// Blog cache TTLs (seconds)
export const BLOG_CACHE = {
  SINGLE_TTL: 60 * 10,      // 10 min — single blog details
  LIST_TTL: 60 * 3,         // 3 min — list/category queries
  CATEGORIES_TTL: 60 * 15,  // 15 min — category aggregation
  AUTHORS_TTL: 60 * 15,     // 15 min — author aggregation
} as const;

export const BLOG_KEYS = {
  single: (slug: string) => `blog:slug:${slug}`,
  list: (queryHash: string) => `blog:list:${queryHash}`,
  byCategory: (category: string, queryHash: string) =>
    `blog:cat:${category}:${queryHash}`,
  byAuthor: (username: string, queryHash: string) =>
    `blog:author:${username}:${queryHash}`,
  categoryList: "blog:categories:all",
  authorList: "blog:authors:all",
} as const;

export const hashQuery = (obj: Record<string, unknown>): string => {
  const sorted = Object.keys(obj)
    .sort()
    .map((k) => `${k}=${String(obj[k] ?? "")}`)
    .join("&");
  return sorted || "default";
};

// Called on any create/update/delete/status-change
export const invalidateBlogCache = async (slug?: string) => {
  const tasks: Promise<unknown>[] = [
    delByPattern("blog:list:*"),
    delByPattern("blog:cat:*"),
    delByPattern("blog:author:*"),
    delKey(BLOG_KEYS.categoryList, BLOG_KEYS.authorList),
  ];
  if (slug) tasks.push(delKey(BLOG_KEYS.single(slug)));
  await Promise.all(tasks);
};

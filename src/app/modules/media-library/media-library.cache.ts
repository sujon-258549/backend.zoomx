import { delByPattern } from "../../shared/redis";

export const MEDIA_CACHE = {
  LIST_TTL: 60 * 5, // 5 min — file list changes on upload/delete/rename
} as const;

export const MEDIA_KEYS = {
  list: (queryHash: string) => `media:list:${queryHash}`,
} as const;

export const hashQuery = (obj: Record<string, unknown>): string => {
  const sorted = Object.keys(obj)
    .sort()
    .map((k) => `${k}=${String(obj[k] ?? "")}`)
    .join("&");
  return sorted || "default";
};

// Any file mutation (upload/delete/rename) shifts the whole listing — so we
// blow away every list cache instead of trying to patch individual entries.
export const invalidateMediaLibraryCache = async () => {
  await delByPattern("media:list:*");
};

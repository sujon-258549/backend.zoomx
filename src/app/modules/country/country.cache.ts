import { delByPattern, delKey } from "../../shared/redis";

export const COUNTRY_CACHE = {
  SINGLE_TTL: 60 * 15,   // 15 min — countries change rarely
  LIST_TTL: 60 * 10,     // 10 min — list
} as const;

export const COUNTRY_KEYS = {
  single: (id: string) => `country:id:${id}`,
  list: (queryHash: string) => `country:list:${queryHash}`,
} as const;

export const hashQuery = (obj: Record<string, unknown>): string => {
  const sorted = Object.keys(obj)
    .sort()
    .map((k) => `${k}=${String(obj[k] ?? "")}`)
    .join("&");
  return sorted || "default";
};

// Serial-affecting operations (delete, updateSerial) shift many docs at once,
// so single-id cache for every affected country is not tracked here — we clear
// all list caches and let single caches expire naturally, since the ID never
// changes and only serial_no does (usually only shown on list views).
export const invalidateCountryCache = async (id?: string) => {
  const tasks: Promise<unknown>[] = [delByPattern("country:list:*")];
  if (id) tasks.push(delKey(COUNTRY_KEYS.single(id)));
  await Promise.all(tasks);
};

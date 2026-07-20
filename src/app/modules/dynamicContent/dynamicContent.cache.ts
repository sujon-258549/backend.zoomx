import { delByPattern, delKey } from "../../shared/redis";

export const DC_CACHE = {
  GROUP_TTL: 60 * 15,   // 15 min — group content (public read)
  MAP_TTL: 60 * 15,     // 15 min — content map
  ADMIN_LIST_TTL: 60 * 2, // 2 min — admin list (needs freshness)
  HISTORY_TTL: 60 * 5,  // 5 min — history entries
} as const;

export const DC_KEYS = {
  group: (group: string) => `dc:group:${group}`,
  mapAll: () => `dc:map:all`,
  mapByGroup: (group: string) => `dc:map:group:${group}`,
  adminList: (queryHash: string) => `dc:admin:list:${queryHash}`,
  history: (key: string, take: number) => `dc:history:${key}:${take}`,
} as const;

export const hashQuery = (obj: Record<string, unknown>): string => {
  const sorted = Object.keys(obj)
    .sort()
    .map((k) => `${k}=${String(obj[k] ?? "")}`)
    .join("&");
  return sorted || "default";
};

export const invalidateDynamicContentCache = async (
  key?: string,
  group?: string
) => {
  const tasks: Promise<unknown>[] = [
    delByPattern("dc:admin:list:*"),
    delKey(DC_KEYS.mapAll()),
  ];
  if (group) {
    tasks.push(delKey(DC_KEYS.group(group), DC_KEYS.mapByGroup(group)));
  } else {
    // Group unknown — nuke all group/map caches to be safe
    tasks.push(delByPattern("dc:group:*"), delByPattern("dc:map:group:*"));
  }
  if (key) tasks.push(delByPattern(`dc:history:${key}:*`));
  await Promise.all(tasks);
};

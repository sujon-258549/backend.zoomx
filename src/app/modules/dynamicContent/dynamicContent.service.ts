import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/appError';
import { withCache } from '../../shared/redis';
import {
  DC_CACHE,
  DC_KEYS,
  hashQuery,
  invalidateDynamicContentCache,
} from './dynamicContent.cache';
import {
  DynamicContent,
  DynamicContentHistory,
} from './dynamicContent.model';
import { IDynamicContent } from './dynamicContent.interface';

type UpsertPayload = Partial<IDynamicContent> & { key: string };

// Central upsert helper — takes the previous document (or null for creates)
// and records a history entry alongside the write. Used by both single and
// bulk upserts so history stays consistent.
async function upsertWithHistory(payload: UpsertPayload, userId?: string) {
  const { key, ...rest } = payload;

  const existing = await DynamicContent.findOne({ key }).lean();

  const update: Partial<IDynamicContent> = { ...rest };
  if (userId) update.updatedBy = userId;

  const saved = await DynamicContent.findOneAndUpdate(
    { key },
    { $set: update, $setOnInsert: { key } },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
  );

  // Skip history on true no-op writes (same value, same imageUrl). Keeps the
  // audit log meaningful instead of drowning it in dupes.
  const valueChanged =
    JSON.stringify(existing?.value ?? null) !==
    JSON.stringify(saved?.value ?? null);
  const imageChanged = (existing?.imageUrl || '') !== (saved?.imageUrl || '');

  if (valueChanged || imageChanged) {
    await DynamicContentHistory.create({
      dynamicContentId: saved._id,
      key: saved.key,
      oldValue: existing
        ? { value: existing.value, imageUrl: existing.imageUrl }
        : null,
      newValue: { value: saved.value, imageUrl: saved.imageUrl },
      updatedBy: userId,
    });
  }

  // Invalidate cache — pass both new and old group so both are cleared
  await invalidateDynamicContentCache(saved.key, saved.group);
  if (existing?.group && existing.group !== saved.group) {
    await invalidateDynamicContentCache(saved.key, existing.group);
  }

  return saved;
}

const upsertContent = async (payload: UpsertPayload, userId?: string) => {
  return upsertWithHistory(payload, userId);
};

const bulkUpsertContents = async (
  contents: UpsertPayload[],
  userId?: string
) => {
  // Sequential to keep history ordering predictable per key. If throughput
  // becomes a concern this can move to Promise.all — history will still be
  // correct per-doc, only cross-doc ordering shifts.
  const results = [];
  for (const item of contents) {
    results.push(await upsertWithHistory(item, userId));
  }
  return results;
};

// Public read — used by frontend to render a section. Only active items.
const getContentsByGroup = async (group: string) => {
  return withCache(
    { key: DC_KEYS.group(group), ttl: DC_CACHE.GROUP_TTL },
    async () => DynamicContent.find({ group, isActive: true }).lean()
  );
};

// Convenience shape for the frontend: `{ [key]: contentDoc }`. Optional
// group filter narrows to a single page/section.
const getContentsMap = async (group?: string) => {
  const cacheKey = group ? DC_KEYS.mapByGroup(group) : DC_KEYS.mapAll();

  return withCache({ key: cacheKey, ttl: DC_CACHE.MAP_TTL }, async () => {
    const where: Record<string, unknown> = { isActive: true };
    if (group) where.group = group;

    const contents = await DynamicContent.find(where).lean();
    return contents.reduce<Record<string, unknown>>((acc, curr) => {
      acc[curr.key] = curr;
      return acc;
    }, {});
  });
};

const deleteContent = async (key: string) => {
  const result = await DynamicContent.findOneAndDelete({ key });
  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, `No content found for key "${key}"`);
  }
  // History rows are kept — they remain useful even after the parent is
  // removed thanks to the denormalized `key` field on the history schema.
  await invalidateDynamicContentCache(key, result.group);
  return result;
};

const bulkDeleteContents = async (keys: string[]) => {
  const result = await DynamicContent.deleteMany({ key: { in: keys } });
  // Group unknown across bulk — invalidate broadly
  await invalidateDynamicContentCache();
  return { deletedCount: result.deletedCount };
};

// Admin list with filters + pagination.
const getAllContents = async (query: Record<string, unknown>) => {
  const cacheKey = DC_KEYS.adminList(hashQuery(query));

  return withCache(
    { key: cacheKey, ttl: DC_CACHE.ADMIN_LIST_TTL },
    async () => {
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 20;
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {};
      if (query.group) where.group = query.group;
      if (query.type) where.type = query.type;
      if (query.isActive !== undefined)
        where.isActive = query.isActive === 'true';

      if (query.searchTerm) {
        const term = String(query.searchTerm);
        where.$or = [
          { key: { $regex: term, $options: 'i' } },
          { name: { $regex: term, $options: 'i' } },
          { description: { $regex: term, $options: 'i' } },
        ];
      }

      const [contents, total] = await Promise.all([
        DynamicContent.find(where)
          .populate({ path: 'updatedBy', select: 'email name' })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        DynamicContent.countDocuments(where),
      ]);

      return {
        meta: {
          page,
          limit,
          total,
          totalPage: Math.ceil(total / limit),
        },
        data: contents,
      };
    }
  );
};

// Recent history for a single key — small pagination, newest first.
const getContentHistory = async (key: string, take = 20) => {
  return withCache(
    { key: DC_KEYS.history(key, take), ttl: DC_CACHE.HISTORY_TTL },
    async () =>
      DynamicContentHistory.find({ key })
        .populate({ path: 'updatedBy', select: 'email name' })
        .sort({ createdAt: -1 })
        .limit(take)
        .lean()
  );
};

export const DynamicContentService = {
  upsertContent,
  bulkUpsertContents,
  getContentsByGroup,
  getContentsMap,
  deleteContent,
  bulkDeleteContents,
  getAllContents,
  getContentHistory,
};

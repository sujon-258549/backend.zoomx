import { z } from 'zod';
import { DYNAMIC_CONTENT_TYPES } from './dynamicContent.interface';

const typeEnum = z.enum(DYNAMIC_CONTENT_TYPES as [string, ...string[]]);

// A single upsert payload. `value` is intentionally z.any() so callers can
// send strings, HTML, numbers, arrays, or nested objects — the `type` field
// tells the frontend how to render whatever is inside.
const contentBase = z.object({
  key: z
    .string({ required_error: 'key is required' })
    .trim()
    .min(1, 'key cannot be empty')
    .max(200),
  name: z.string().trim().max(200).optional(),
  value: z.any().optional(),
  imageUrl: z.string().trim().max(2000).optional(),
  group: z.string().trim().max(100).optional(),
  type: typeEnum.optional(),
  description: z.string().trim().max(2000).optional(),
  isActive: z.boolean().optional(),
});

const upsertZodSchema = z.object({
  body: contentBase,
});

const bulkUpsertZodSchema = z.object({
  body: z.object({
    contents: z
      .array(contentBase)
      .min(1, 'contents array cannot be empty')
      .max(500, 'bulk operations are capped at 500 items'),
  }),
});

const bulkDeleteZodSchema = z.object({
  body: z.object({
    keys: z
      .array(z.string().trim().min(1))
      .min(1, 'keys array cannot be empty')
      .max(500),
  }),
});

export const DynamicContentValidation = {
  upsertZodSchema,
  bulkUpsertZodSchema,
  bulkDeleteZodSchema,
};

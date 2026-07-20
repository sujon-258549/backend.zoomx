import { z } from "zod";

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid folder id");

// Create — `parent` optional: omit (or null) for a top-level folder, or pass a
// parent folder id to nest it inside that folder.
const createFolder = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    parent: objectId.nullable().optional(),
  }),
});

// Update — rename (`name`) and/or move (`parent`).
const updateFolder = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    parent: objectId.nullable().optional(),
  }),
});

export const FolderValidation = {
  createFolder,
  updateFolder,
};

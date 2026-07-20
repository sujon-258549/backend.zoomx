import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/appError";
import Media from "../media-library/media-library.model";
import { IFolder } from "./folder.interface";
import Folder from "./folder.model";

type FolderInput = Partial<IFolder> & { parent?: string | null };

const ensureParentExists = async (parent?: string | null) => {
  if (!parent) return;
  const exists = await Folder.findOne({ _id: parent, is_deleted: false });
  if (!exists) {
    throw new AppError(StatusCodes.NOT_FOUND, "Parent folder not found.");
  }
};

/**
 * Collect the ids of a folder PLUS every folder nested underneath it (the whole
 * subtree). Used to cascade-delete and to block cyclic moves.
 */
const collectSubtreeIds = async (rootId: string): Promise<string[]> => {
  const ids: string[] = [rootId];
  let frontier: string[] = [rootId];
  while (frontier.length) {
    const children = await Folder.find({
      parent: { $in: frontier },
      is_deleted: false,
    }).select("_id");
    const childIds = children.map((c) => String(c._id));
    if (!childIds.length) break;
    ids.push(...childIds);
    frontier = childIds;
  }
  return ids;
};

const createFolder = async (payload: FolderInput) => {
  const parent = payload.parent ?? null;
  await ensureParentExists(parent);

  // No two folders with the same name inside the same parent.
  const duplicate = await Folder.findOne({
    name: payload.name,
    parent,
    is_deleted: false,
  });
  if (duplicate) {
    throw new AppError(
      StatusCodes.CONFLICT,
      "A folder with this name already exists here."
    );
  }

  return Folder.create({ ...payload, parent });
};

/**
 * List folders. Query options:
 *  - ?parent=<id>        → direct children of that folder
 *  - ?parent=root|null   → top-level folders only
 *  - (omitted)           → every folder (flat)
 */
const getFolders = async (query: { parent?: string }) => {
  const filter: Record<string, unknown> = { is_deleted: false };
  if (query.parent === "root" || query.parent === "null") {
    filter.parent = null;
  } else if (query.parent) {
    filter.parent = query.parent;
  }
  return Folder.find(filter).sort({ name: 1 });
};

/** Whole nested tree (folders inside folders inside folders…). */
const getFolderTree = async () => {
  const all = await Folder.find({ is_deleted: false })
    .sort({ name: 1 })
    .lean();

  const byParent: Record<string, any[]> = {};
  for (const f of all) {
    const key = f.parent ? String(f.parent) : "root";
    (byParent[key] ||= []).push({ ...f, children: [] });
  }

  const attach = (nodes: any[]) => {
    for (const node of nodes) {
      node.children = byParent[String(node._id)] || [];
      attach(node.children);
    }
  };

  const roots = byParent["root"] || [];
  attach(roots);
  return roots;
};

const getFolderById = async (id: string) => {
  const folder = await Folder.findOne({ _id: id, is_deleted: false });
  if (!folder) {
    throw new AppError(StatusCodes.NOT_FOUND, "Folder not found.");
  }
  const children = await Folder.find({ parent: id, is_deleted: false }).sort({
    name: 1,
  });
  return { folder, children };
};

const updateFolder = async (
  id: string,
  payload: { name?: string; parent?: string | null }
) => {
  const folder = await Folder.findOne({ _id: id, is_deleted: false });
  if (!folder) {
    throw new AppError(StatusCodes.NOT_FOUND, "Folder not found.");
  }

  // Moving to a new parent — guard against cycles (a folder can't be moved into
  // itself or into one of its own descendants).
  if (payload.parent !== undefined) {
    const newParent = payload.parent ?? null;
    if (newParent && String(newParent) === String(id)) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "A folder can't be its own parent."
      );
    }
    if (newParent) {
      await ensureParentExists(String(newParent));
      const subtree = await collectSubtreeIds(id);
      if (subtree.includes(String(newParent))) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Can't move a folder into one of its own sub-folders."
        );
      }
    }
    folder.parent = newParent as any;
  }

  if (payload.name !== undefined) {
    folder.name = payload.name;
  }

  await folder.save();
  return folder;
};

/**
 * Soft-delete a folder AND everything nested inside it (the whole subtree).
 * Nothing is removed from the database — we just flag `is_deleted: true`, so
 * it stops showing up (all reads filter on `is_deleted: false`).
 */
const deleteFolder = async (id: string) => {
  const folder = await Folder.findOne({ _id: id, is_deleted: false });
  if (!folder) {
    throw new AppError(StatusCodes.NOT_FOUND, "Folder not found.");
  }
  const ids = await collectSubtreeIds(id);
  await Folder.updateMany({ _id: { $in: ids } }, { is_deleted: true });
  // Cascade: hide all media that lived in any of these folders.
  await Media.updateMany({ folder: { $in: ids } }, { is_deleted: true });
  return { deletedCount: ids.length, deletedIds: ids };
};

export const FolderService = {
  createFolder,
  getFolders,
  getFolderTree,
  getFolderById,
  updateFolder,
  deleteFolder,
};

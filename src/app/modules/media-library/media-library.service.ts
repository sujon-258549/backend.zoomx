import fs from "fs";
import { StatusCodes } from "http-status-codes";
import { imageSize } from "image-size";
import mime from "mime-types";
import path from "path";
import sharp from "sharp";
import AppError from "../../errors/appError";
import { withCache } from "../../shared/redis";
import { Category } from "../category/category.model";
import { Product } from "../product/product.model";
import Brand from "../brands/brands.model";
import { Blog } from "../blog/blog.model";
import { DynamicContent } from "../dynamicContent/dynamicContent.model";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  R2_BUCKET,
  r2,
  r2PublicUrl,
} from "../../utils/r2";
import {
  MEDIA_CACHE,
  MEDIA_KEYS,
  hashQuery,
  invalidateMediaLibraryCache,
} from "./media-library.cache";
import { MediaType } from "./media-library.interface";
import Media from "./media-library.model";

const MEDIA_TYPES: MediaType[] = [
  "image",
  "video",
  "audio",
  "document",
  "other",
];

const isAllowedType = (t: string): t is MediaType =>
  MEDIA_TYPES.includes(t as MediaType);

const classifyMediaType = (name: string, mimeType: string): MediaType => {
  const ext = path.extname(name).toLowerCase();
  if (
    /^image\//i.test(mimeType) ||
    /\.(png|jpe?g|gif|webp|svg|bmp|ico|avif)$/i.test(ext)
  )
    return "image";
  if (/^video\//i.test(mimeType) || /\.(mp4|webm|mov|avi|mkv|m4v|ogv)$/i.test(ext))
    return "video";
  if (/^audio\//i.test(mimeType) || /\.(mp3|wav|ogg|m4a|flac|aac|opus)$/i.test(ext))
    return "audio";
  if (
    /^application\/pdf$/i.test(mimeType) ||
    /^application\/(msword|vnd\.)/i.test(mimeType) ||
    /^text\/(plain|csv|rtf)/i.test(mimeType) ||
    /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|rtf|odt|ods|odp)$/i.test(ext)
  )
    return "document";
  return "other";
};

const formatFileSize = (bytes: number): string => {
  const units = ["Bytes", "KB", "MB", "GB"];
  let i = 0;
  let b = bytes;
  while (b >= 1024 && i < units.length - 1) {
    b /= 1024;
    i++;
  }
  return `${b.toFixed(1)} ${units[i]}`;
};

const formatDate = (date: Date): string =>
  new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

// Product/media images are often uploaded straight from a camera or design
// tool at 3000–6000px and 5–20MB. The storefront only ever shows them a few
// hundred px wide, so we downscale + recompress before storing in R2. This is
// the single biggest win for image load time. SVG/GIF are left untouched.
const MAX_IMAGE_DIMENSION = 1600;

type OptimizedImage = {
  buffer: Buffer;
  width: number | null;
  height: number | null;
  mime: string | null; // set when the format changed (e.g. → image/webp)
};

const optimizeImageBuffer = async (
  buffer: Buffer,
  ext: string
): Promise<OptimizedImage> => {
  // Only raster photos benefit; leave svg/gif (and anything else) untouched.
  if (!/\.(png|jpe?g|webp)$/i.test(ext)) {
    return { buffer, width: null, height: null, mime: null };
  }
  try {
    const meta = await sharp(buffer).metadata();
    let pipeline = sharp(buffer, { failOn: "none" }).rotate(); // honour EXIF
    if (
      (meta.width || 0) > MAX_IMAGE_DIMENSION ||
      (meta.height || 0) > MAX_IMAGE_DIMENSION
    ) {
      pipeline = pipeline.resize({
        width: MAX_IMAGE_DIMENSION,
        height: MAX_IMAGE_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      });
    }
    // WebP gives by far the smallest files (a 2–6MB PNG photo → ~100–300KB)
    // while keeping transparency. The R2 object key is left as-is; the
    // content-type is what browsers and next/image use to decode it.
    const out = await pipeline.webp({ quality: 80 }).toBuffer();
    const outMeta = await sharp(out).metadata();
    // Never let "optimization" produce a bigger file than the original.
    if (out.length < buffer.length) {
      return {
        buffer: out,
        width: outMeta.width ?? null,
        height: outMeta.height ?? null,
        mime: "image/webp",
      };
    }
    return {
      buffer,
      width: meta.width ?? null,
      height: meta.height ?? null,
      mime: null,
    };
  } catch {
    return { buffer, width: null, height: null, mime: null };
  }
};

const sanitizeFolderId = (folder?: unknown): string | null =>
  typeof folder === "string" && folder && folder !== "root" && folder !== "null"
    ? folder.replace(/[^a-fA-F0-9]/g, "")
    : null;

const toRow = (doc: any) => ({
  id: String(doc._id),
  name: doc.name,
  path: doc.key,
  size: formatFileSize(doc.size || 0),
  type: doc.type,
  mediaType: doc.mediaType,
  extension: path.extname(doc.name),
  folder: doc.folder ? String(doc.folder) : null,
  date: formatDate(doc.createdAt),
  createdAt: new Date(doc.createdAt).toISOString(),
  url: r2PublicUrl(doc.key),
  isPublic: true,
  ...(doc.width && doc.height
    ? { dimensions: { width: doc.width, height: doc.height, unit: "pixels" } }
    : {}),
});

// List media that belong to a given folder (or the root when no folder). This
// is the folder ↔ media relationship in action — a plain DB query.
const getAllMedia = async (query: Record<string, unknown>) => {
  const cacheKey = MEDIA_KEYS.list(hashQuery(query));

  return withCache({ key: cacheKey, ttl: MEDIA_CACHE.LIST_TTL }, async () => {
    const { page = 1, limit = 20, search, type, folder } = query;
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;

    const filter: Record<string, unknown> = {
      is_deleted: false,
      folder: sanitizeFolderId(folder), // null → root, else the folder id
    };
    if (typeof type === "string" && isAllowedType(type)) {
      filter.mediaType = type;
    }
    if (typeof search === "string" && search.trim()) {
      filter.name = { $regex: search.trim(), $options: "i" };
    }

    const totalItems = await Media.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limitNum) || 1;
    const validPage = Math.min(pageNum, totalPages);

    const docs = await Media.find(filter)
      .sort({ createdAt: -1 })
      .skip((validPage - 1) * limitNum)
      .limit(limitNum)
      .lean();

    return {
      meta: { total: totalItems, totalPages, page: validPage, limit: limitNum },
      data: docs.map(toRow),
    };
  });
};

const deleteMedia = async (keyOrPath: string) => {
  const key = String(keyOrPath).replace(/^\/+/, "");
  if (!key) throw new Error("Invalid media");

  const media = await Media.findOne({ key, is_deleted: false });
  if (!media) throw new Error("Media not found");

  // Don't allow deleting an image that's in use anywhere — tell the user
  // exactly where it's used (products, categories, blogs, brands, content…).
  const usage = await getMediaUsage(String(media._id));
  if (usage.length > 0) {
    const where = usage
      .map((u) => `${u.type.toLowerCase()} "${u.name}"`)
      .join(", ");
    throw new AppError(
      StatusCodes.CONFLICT,
      `This image can't be deleted — it's currently used by ${where}. Please remove it there first.`
    );
  }

  // Soft delete → moves the item to the Media Bin. The R2 object is kept so a
  // restore is always possible; it's only purged (hard-deleted from R2) when the
  // item is later deleted from the bin.
  media.is_deleted = true;
  await media.save();
  await invalidateMediaLibraryCache();
};

const uploadMedia = async (
  file: Express.Multer.File,
  customName?: string,
  folder?: string,
  createdBy?: string
) => {
  const tempPath = file.path;
  const ext = path.extname(file.originalname || file.filename || "");
  const base = customName
    ? customName.replace(/\.[^/.]+$/, "")
    : path.parse(file.originalname || file.filename || "file").name;

  const displayName = `${base}${ext}`;
  // Unique, flat object key (timestamped). Because the folder relationship
  // lives in the DB, the R2 key never needs to change when media is moved.
  const key = `${Date.now()}-${displayName}`.replace(/\s+/g, "_");

  const body = await fs.promises.readFile(tempPath);
  const mimeType =
    file.mimetype || (mime.lookup(displayName) || "application/octet-stream");
  const mediaType = classifyMediaType(displayName, mimeType);

  let uploadBuffer = body;
  let uploadMime = mimeType;
  let width: number | null = null;
  let height: number | null = null;
  if (mediaType === "image") {
    const optimized = await optimizeImageBuffer(body, ext);
    uploadBuffer = optimized.buffer;
    if (optimized.mime) uploadMime = optimized.mime; // e.g. → image/webp
    width = optimized.width;
    height = optimized.height;
    // Fallback to image-size if sharp couldn't read the dimensions.
    if (width == null) {
      try {
        const d = imageSize(body);
        width = d.width ?? null;
        height = d.height ?? null;
      } catch {
        /* not fatal */
      }
    }
  }

  try {
    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: uploadBuffer,
        ContentType: uploadMime,
      })
    );
  } finally {
    try {
      await fs.promises.unlink(tempPath);
    } catch (err) {
      console.error("Failed to delete temp file:", err);
    }
  }

  const doc = await Media.create({
    key,
    name: displayName,
    size: uploadBuffer.length,
    type: uploadMime,
    mediaType,
    width,
    height,
    folder: sanitizeFolderId(folder),
    createdBy: createdBy || null,
  });

  await invalidateMediaLibraryCache();

  return {
    id: String(doc._id),
    filename: displayName,
    path: key,
    url: r2PublicUrl(key),
    folder: doc.folder ? String(doc.folder) : null,
    customName: customName || displayName,
  };
};

// Rename = update the display name only. The R2 object (key) is untouched.
const renameMedia = async (keyOrPath: string, newName: string) => {
  const key = String(keyOrPath).replace(/^\/+/, "");
  const ext = path.extname(key.replace(/^\d+-/, "")) || path.extname(key);
  const base = String(newName).replace(/\.[^/.]+$/, "");
  const doc = await Media.findOneAndUpdate(
    { key },
    { name: `${base}${ext}` },
    { new: true }
  );
  if (!doc) throw new Error("Media not found");
  await invalidateMediaLibraryCache();
};

// Move media into a different folder (or to root with folder = null). This is a
// pure DB update — no R2 work needed.
const moveMedia = async (keyOrPath: string, folder?: string) => {
  const key = String(keyOrPath).replace(/^\/+/, "");
  const doc = await Media.findOneAndUpdate(
    { key, is_deleted: false },
    { folder: sanitizeFolderId(folder) },
    { new: true }
  );
  if (!doc) throw new Error("Media not found");
  await invalidateMediaLibraryCache();
  return doc;
};

// Also permanently remove the underlying R2 object (used only where a true
// purge is wanted; normal delete is soft).
const purgeFromR2 = async (key: string) => {
  await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
};

// ── Media Bin ────────────────────────────────────────────────────────────────

// List all soft-deleted media (the "bin" / trash).
const getBinnedMedia = async (query: Record<string, unknown> = {}) => {
  const { page = 1, limit = 50 } = query;
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 50;

  const filter = { is_deleted: true };
  const totalItems = await Media.countDocuments(filter);
  const totalPages = Math.ceil(totalItems / limitNum) || 1;
  const validPage = Math.min(pageNum, totalPages);

  const docs = await Media.find(filter)
    .sort({ updatedAt: -1 })
    .skip((validPage - 1) * limitNum)
    .limit(limitNum)
    .lean();

  return {
    meta: { total: totalItems, totalPages, page: validPage, limit: limitNum },
    data: docs.map(toRow),
  };
};

// Restore a soft-deleted media item (flip is_deleted back to false).
const restoreMedia = async (keyOrPath: string) => {
  const key = String(keyOrPath).replace(/^\/+/, "");
  const doc = await Media.findOneAndUpdate(
    { key, is_deleted: true },
    { is_deleted: false },
    { new: true }
  );
  if (!doc) throw new AppError(StatusCodes.NOT_FOUND, "Media not found in bin");
  await invalidateMediaLibraryCache();
  return toRow(doc);
};

// Permanently delete — remove DB record + purge R2 object.
const permanentDeleteMedia = async (keyOrPath: string) => {
  const key = String(keyOrPath).replace(/^\/+/, "");
  const doc = await Media.findOne({ key });
  if (!doc) throw new AppError(StatusCodes.NOT_FOUND, "Media not found");
  await purgeFromR2(key);
  await Media.deleteOne({ key });
  await invalidateMediaLibraryCache();
};

// Bulk restore — flip is_deleted = false for multiple keys at once.
const bulkRestoreMedia = async (keys: string[]) => {
  const cleanKeys = keys.map((k) => String(k).replace(/^\/+/, ""));
  const result = await Media.updateMany(
    { key: { $in: cleanKeys }, is_deleted: true },
    { is_deleted: false }
  );
  await invalidateMediaLibraryCache();
  return { restored: result.modifiedCount };
};

// Bulk permanent delete — purge from R2 + remove DB records.
const bulkPermanentDeleteMedia = async (keys: string[]) => {
  const cleanKeys = keys.map((k) => String(k).replace(/^\/+/, ""));
  const docs = await Media.find({ key: { $in: cleanKeys } });

  // Purge all from R2 in parallel — don't let one failure block the rest.
  const r2Results = await Promise.allSettled(
    docs.map((doc) => purgeFromR2(doc.key))
  );

  const r2Failed = r2Results.filter((r) => r.status === "rejected").length;

  // Remove DB records regardless of R2 outcome.
  await Media.deleteMany({ key: { $in: cleanKeys } });
  await invalidateMediaLibraryCache();

  return { deleted: docs.length, r2Failed };
};

const getMediaUsage = async (id: string) => {
  const usage: Array<{ type: string; name: string; id: string; url?: string }> = [];

  // 1. Check schemas that store ObjectId
  const products = await Product.find({
    $or: [{ thumbnailId: id }, { galleryIds: id }]
  }).select('name _id').lean();
  products.forEach(p => usage.push({ type: 'Product', name: p.name, id: p._id.toString(), url: `/products/edit/${p._id}` }));

  const categories = await Category.find({
    $or: [
      { imageId: id },
      // Legacy `image` field only counts when the category has no current
      // `imageId`. Otherwise a re-imaged category would keep falsely blocking
      // its previous image (imageId points to the new one; image is stale).
      { imageId: null, image: id },
    ],
  }).select('name _id').lean();
  categories.forEach(c => usage.push({ type: 'Category', name: c.name, id: c._id.toString(), url: `/categories` })); // They usually open modals, so just base url

  // 2. Resolve media URL for schemas that store image URLs
  const media = await Media.findById(id).lean();
  if (media) {
    const mediaUrl = r2PublicUrl(media.key);
    // Note: Due to domain configurations, we might want to check just the key or ending of the URL.
    // But since the frontend uses r2PublicUrl(key), the stored URL might exactly match it.
    // To be safe, let's search via regex on the key!
    const urlRegex = new RegExp(media.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const blogs = await Blog.find({ thumbnail: { $regex: urlRegex } }).select('title _id').lean();
    blogs.forEach(b => usage.push({ type: 'Blog', name: b.title, id: b._id.toString(), url: `/content/blog/edit/${b._id}` }));

    const brands = await Brand.find({ logo: { $regex: urlRegex } }).select('name _id').lean();
    brands.forEach(b => usage.push({ type: 'Brand', name: b.name, id: b._id.toString(), url: `/brands` }));

    const dynamics = await DynamicContent.find({ imageUrl: { $regex: urlRegex } }).select('name key _id').lean();
    dynamics.forEach(d => usage.push({ type: 'Content', name: d.name || d.key, id: d._id.toString() }));
  }

  return usage;
};

export const MediaLibraryServices = {
  getAllMedia,
  deleteMedia,
  uploadMedia,
  renameMedia,
  renameImage: renameMedia,
  moveMedia,
  purgeFromR2,
  getBinnedMedia,
  restoreMedia,
  permanentDeleteMedia,
  bulkRestoreMedia,
  bulkPermanentDeleteMedia,
  getMediaUsage,
};

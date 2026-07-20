import { Router } from "express";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import { upload } from "../../middleware/upload";
import { MediaLibraryControllers } from "./media-library.controller";

const router = Router();

router.get(
  "/",
  auth(),
  checkPermission("Media Library", "view"),
  MediaLibraryControllers.getAllMedia
);

router.post(
  "/",
  auth(),
  checkPermission("Media Library", "create"),
  upload.single("file"),
  MediaLibraryControllers.uploadMedia
);

router.patch(
  "/rename",
  auth(),
  checkPermission("Media Library", "create"),
  MediaLibraryControllers.renameImage
);

router.patch(
  "/move",
  auth(),
  checkPermission("Media Library", "create"),
  MediaLibraryControllers.moveMedia
);

// ── Usage info route ────────────────────────────────────────────────────────────
router.get(
  "/usage/:id",
  auth(),
  checkPermission("Media Library", "view"),
  MediaLibraryControllers.getMediaUsage
);

// ── Media Bin routes — MUST come before the catch-all DELETE regex ────────────
router.get(
  "/bin",
  auth(),
  checkPermission("Media Bin", "view"),
  MediaLibraryControllers.getBinnedMedia
);

router.patch(
  "/bin/bulk-restore",
  auth(),
  checkPermission("Media Bin", "restore"),
  MediaLibraryControllers.bulkRestoreMedia
);

router.delete(
  "/bin/bulk-purge",
  auth(),
  checkPermission("Media Bin", "delete"),
  MediaLibraryControllers.bulkPermanentDeleteMedia
);

router.patch(
  /^\/restore\/(.+)$/,
  auth(),
  checkPermission("Media Bin", "restore"),
  MediaLibraryControllers.restoreMedia
);

router.delete(
  /^\/purge\/(.+)$/,
  auth(),
  checkPermission("Media Bin", "delete"),
  MediaLibraryControllers.permanentDeleteMedia
);

// ── Catch-all soft-delete — keep LAST so specific routes above take priority ──
router.delete(
  /^\/(.+)$/,
  auth(),
  checkPermission("Media Library", "delete"),
  MediaLibraryControllers.deleteMedia
);

export const MediaLibraryRoutes = router;

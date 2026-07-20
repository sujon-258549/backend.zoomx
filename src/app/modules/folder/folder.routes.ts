import { Router } from "express";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import validateRequest from "../../middleware/validateRequest";
import { FolderController } from "./folder.controller";
import { FolderValidation } from "./folder.validation";

const router = Router();

// Read
router.get("", FolderController.getFolders); // ?parent=<id> | root
router.get("/tree", FolderController.getFolderTree); // full nested tree
router.get("/:id", FolderController.getFolderById); // folder + direct children

// Write (folders are part of the media library, so they share its permission)
router.post(
  "/create",
  auth(),
  checkPermission("Media Library", "create"),
  validateRequest(FolderValidation.createFolder),
  FolderController.createFolder
);

router.put(
  "/:id",
  auth(),
  checkPermission("Media Library", "update"),
  validateRequest(FolderValidation.updateFolder),
  FolderController.updateFolder
);

router.delete(
  "/:id",
  auth(),
  checkPermission("Media Library", "delete"),
  FolderController.deleteFolder
);

export const FolderRoutes = router;

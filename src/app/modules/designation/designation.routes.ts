import { Router } from "express";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import validateRequest from "../../middleware/validateRequest";
import { DesignationController } from "./designation.controller";
import { designationValidation } from "./designation.validation";

const router = Router();

// Anyone authenticated can list designations (used in the user-create dropdown).
router.get("/", auth(), DesignationController.getAllDesignations);

router.post(
  "/",
  auth(),
  checkPermission("Designations", "create"),
  validateRequest(designationValidation.create),
  DesignationController.createDesignation
);

router.put(
  "/:id",
  auth(),
  checkPermission("Designations", "update"),
  validateRequest(designationValidation.update),
  DesignationController.updateDesignation
);

router.patch(
  "/:id/status",
  auth(),
  checkPermission("Designations", "update"),
  DesignationController.toggleDesignationStatus
);

router.delete(
  "/:id",
  auth(),
  checkPermission("Designations", "delete"),
  DesignationController.deleteDesignation
);

export default router;

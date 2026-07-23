import { Router } from "express";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import validateRequest from "../../middleware/validateRequest";
import { MeetingSettingControllers } from "./meetingSetting.controller";
import { MeetingSettingValidation } from "./meetingSetting.validation";

const router = Router();

// Public — safe fields for the booking page.
router.get("/", MeetingSettingControllers.getPublicSettings);

// Admin — full config + update.
router.get(
  "/manage",
  auth(),
  checkPermission("Meeting Settings", "view"),
  MeetingSettingControllers.getSettings
);

router.put(
  "/",
  auth(),
  checkPermission("Meeting Settings", "update"),
  validateRequest(MeetingSettingValidation.update),
  MeetingSettingControllers.updateSettings
);

export const MeetingSettingRoutes = router;

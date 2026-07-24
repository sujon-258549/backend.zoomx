import { Router } from "express";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import { contactRateLimit } from "../../middleware/rateLimit";
import validateRequest from "../../middleware/validateRequest";
import { MeetingControllers } from "./meeting.controller";
import { MeetingValidation } from "./meeting.validation";

const router = Router();

// ── Public ──
router.get("/slots", MeetingControllers.getSlots);
router.post(
  "/book",
  contactRateLimit,
  validateRequest(MeetingValidation.book),
  MeetingControllers.bookMeeting
);

// Self-serve manage (reschedule / cancel) via opaque token — no auth.
router.get("/manage/:token", MeetingControllers.getByToken);
router.post("/manage/:token/cancel", contactRateLimit, MeetingControllers.cancelByToken);
router.post(
  "/manage/:token/reschedule",
  contactRateLimit,
  validateRequest(MeetingValidation.reschedule),
  MeetingControllers.rescheduleByToken
);

// ── Admin ──
router.get("/", auth(), checkPermission("Meetings", "view"), MeetingControllers.getAllMeetings);
router.get("/:id", auth(), checkPermission("Meetings", "view"), MeetingControllers.getMeeting);
router.patch(
  "/:id/status",
  auth(),
  checkPermission("Meetings", "update"),
  validateRequest(MeetingValidation.updateStatus),
  MeetingControllers.updateStatus
);
router.patch(
  "/:id/note",
  auth(),
  checkPermission("Meetings", "update"),
  validateRequest(MeetingValidation.note),
  MeetingControllers.updateNote
);
router.post(
  "/:id/followup",
  auth(),
  checkPermission("Meetings", "update"),
  validateRequest(MeetingValidation.followup),
  MeetingControllers.sendFollowup
);
router.delete(
  "/:id",
  auth(),
  checkPermission("Meetings", "delete"),
  MeetingControllers.deleteMeeting
);

export const MeetingRoutes = router;

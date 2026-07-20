import { Router } from "express";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import validateRequest from "../../middleware/validateRequest";
import { TeamMemberController } from "./teamMember.controller";
import { TeamMemberValidation } from "./teamMember.validation";

const router = Router();

router.get("/", TeamMemberController.getAllTeamMembers);
router.get("/:id", TeamMemberController.getTeamMemberById);

router.post(
  "/",
  auth(),
  checkPermission("Team Members", "create"),
  validateRequest(TeamMemberValidation.createTeamMember),
  TeamMemberController.createTeamMember
);

router.put(
  "/:id",
  auth(),
  checkPermission("Team Members", "update"),
  validateRequest(TeamMemberValidation.updateTeamMember),
  TeamMemberController.updateTeamMember
);

router.patch(
  "/:id/status",
  auth(),
  checkPermission("Team Members", "update"),
  TeamMemberController.toggleTeamMemberStatus
);

router.patch(
  "/:id/is-new",
  auth(),
  checkPermission("Team Members", "update"),
  TeamMemberController.toggleTeamMemberIsNew
);

router.patch(
  "/:id/is-team-lead",
  auth(),
  checkPermission("Team Members", "update"),
  TeamMemberController.toggleTeamMemberIsTeamLead
);

router.patch(
  "/:id/serial",
  auth(),
  checkPermission("Team Members", "update"),
  validateRequest(TeamMemberValidation.updateSerial),
  TeamMemberController.updateTeamMemberSerial
);

router.delete(
  "/:id",
  auth(),
  checkPermission("Team Members", "delete"),
  TeamMemberController.deleteTeamMember
);

export const TeamMemberRoutes = router;

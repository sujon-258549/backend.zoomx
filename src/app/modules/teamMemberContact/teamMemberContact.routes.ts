import { Router } from "express";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import validateRequest from "../../middleware/validateRequest";
import { TeamMemberContactController } from "./teamMemberContact.controller";
import { TeamMemberContactValidation } from "./teamMemberContact.validation";

const router = Router();

// Public — submit a contact request to a team member
router.post(
  "/",
  validateRequest(TeamMemberContactValidation.createTeamMemberContact),
  TeamMemberContactController.createTeamMemberContact
);

// Admin reads
router.get(
  "/",
  auth(),
  checkPermission("Team Contact", "view"),
  TeamMemberContactController.getAllTeamMemberContacts
);

router.get(
  "/:id",
  auth(),
  checkPermission("Team Contact", "view"),
  TeamMemberContactController.getTeamMemberContactById
);

router.delete(
  "/:id",
  auth(),
  checkPermission("Team Contact", "delete"),
  TeamMemberContactController.deleteTeamMemberContact
);

export const TeamMemberContactRoutes = router;

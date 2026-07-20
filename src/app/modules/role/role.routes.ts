import { Router } from "express";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import validateRequest from "../../middleware/validateRequest";
import { RoleController } from "./role.controller";
import { roleValidation } from "./role.validation";

const router = Router();

router.get(
  "/",
  auth(),
  checkPermission("Roles", "view"),
  RoleController.getAllRoles
);

router.get(
  "/:id",
  auth(),
  checkPermission("Roles", "view"),
  RoleController.getRoleById
);

router.post(
  "/",
  auth(),
  checkPermission("Roles", "create"),
  validateRequest(roleValidation.create),
  RoleController.createRole
);

router.put(
  "/:id",
  auth(),
  checkPermission("Roles", "update"),
  validateRequest(roleValidation.update),
  RoleController.updateRole
);

router.patch(
  "/:id/status",
  auth(),
  checkPermission("Roles", "update"),
  RoleController.toggleRoleStatus
);

router.delete(
  "/:id",
  auth(),
  checkPermission("Roles", "delete"),
  RoleController.deleteRole
);

export const RoleRoutes = router;

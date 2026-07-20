import { Router } from "express";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import validateRequest from "../../middleware/validateRequest";
import { RolePermissionController } from "./rolePermission.controller";
import { rolePermissionValidation } from "./rolePermission.validation";

const router = Router();

// Reads — anyone authenticated may need to read their own permissions; we
// scope reads to users that can manage roles.
router.get(
  "/",
  auth(),
  checkPermission("Roles", "view"),
  RolePermissionController.getAllRolePermissions
);

router.get(
  "/role/:roleId",
  auth(),
  checkPermission("Roles", "view"),
  RolePermissionController.getRolePermissionsByRoleId
);

// Writes — manage role permissions
router.post(
  "/",
  auth(),
  checkPermission("Roles", "update"),
  validateRequest(rolePermissionValidation.create),
  RolePermissionController.createRolePermission
);

router.put(
  "/:id",
  auth(),
  checkPermission("Roles", "update"),
  validateRequest(rolePermissionValidation.update),
  RolePermissionController.updateRolePermission
);

router.delete(
  "/:id",
  auth(),
  checkPermission("Roles", "update"),
  RolePermissionController.deleteRolePermission
);

export const RolePermissionRoutes = router;

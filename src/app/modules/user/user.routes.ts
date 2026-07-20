import { Router } from "express";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import clientInfoParser from "../../middleware/clientInfoParser";
import { authRateLimit } from "../../middleware/rateLimit";
import validateRequest from "../../middleware/validateRequest";
import { UserController } from "./user.controller";
import { UserValidation } from "./user.validation";

const router = Router();

// List users — requires Employees / View permission
router.get(
  "/",
  auth(),
  checkPermission("Employees", "view"),
  UserController.getAllUser
);

// Logged-in user's own profile — any authenticated user
router.get("/me", auth(), UserController.myProfile);

// Public registration — no auth
router.post(
  "/",
  authRateLimit,
  clientInfoParser,
  validateRequest(UserValidation.userValidationSchema),
  UserController.registerUser
);

// Toggle status — requires Employees / Update permission
router.patch(
  "/:id/status",
  auth(),
  checkPermission("Employees", "update"),
  UserController.updateUserStatus
);

// Update user — requires Employees / Update permission
router.patch(
  "/:id",
  auth(),
  checkPermission("Employees", "update"),
  validateRequest(UserValidation.updateUserValidationSchema),
  UserController.updateUser
);

// Delete user — requires Employees / Delete permission
router.delete(
  "/:id",
  auth(),
  checkPermission("Employees", "delete"),
  UserController.deleteUser
);

// Change password — requires Employees / Change Password permission
router.patch(
  "/:id/password",
  auth(),
  checkPermission("Employees", "change password"),
  validateRequest(UserValidation.changePasswordValidationSchema),
  UserController.changePassword
);

export const UserRoutes = router;

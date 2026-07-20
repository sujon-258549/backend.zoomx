import { Router } from "express";
import auth from "../../middleware/auth";
import clientInfoParser from "../../middleware/clientInfoParser";
import { authRateLimit } from "../../middleware/rateLimit";
import validateRequest from "../../middleware/validateRequest";
import { AuthController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";

const router = Router();

router.post("/login", authRateLimit, clientInfoParser, AuthController.loginUser);

router.post("/refresh-token", authRateLimit, AuthController.refreshToken);

// Any authenticated user — changing your own password is a per-user action,
// not a role-gated one.
router.post("/change-password", auth(), AuthController.changePassword);

// Public — sends a 6-digit reset code to the user's email. Always returns
// success to avoid leaking which emails exist.
router.post(
  "/forgot-password",
  authRateLimit,
  validateRequest(AuthValidation.forgotPasswordZodSchema),
  AuthController.forgotPassword
);

// Public — verifies the code and updates the password.
router.post(
  "/reset-password",
  authRateLimit,
  validateRequest(AuthValidation.resetPasswordZodSchema),
  AuthController.resetPassword
);

export const AuthRoutes = router;

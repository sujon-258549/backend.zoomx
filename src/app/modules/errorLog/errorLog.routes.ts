import express from "express";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import { ErrorLogControllers } from "./errorLog.controller";

const router = express.Router();

router.get(
  "/",
  auth(),
  checkPermission("Error Logs", "view"),
  ErrorLogControllers.getAllErrorLogs
);

router.delete(
  "/clear-all",
  auth(),
  checkPermission("Error Logs", "delete"),
  ErrorLogControllers.clearAllErrorLogs
);

router.delete(
  "/:id",
  auth(),
  checkPermission("Error Logs", "delete"),
  ErrorLogControllers.deleteErrorLog
);

export const ErrorLogRoutes = router;

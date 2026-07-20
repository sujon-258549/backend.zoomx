import express from "express";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import { ActionLogControllers } from "./actionLog.controller";

const router = express.Router();

router.get(
  "/",
  auth(),
  checkPermission("Action Logs", "view"),
  ActionLogControllers.getAllActionLogs
);

export const ActionLogRoutes = router;

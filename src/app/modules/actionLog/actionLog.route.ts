import express from "express";
import auth from "../../middleware/auth";
import { ActionLogControllers } from "./actionLog.controller";

const router = express.Router();

// Any authenticated user can hit this endpoint — the service scopes results:
// SUPER_ADMIN / ADMIN see every user's logs; everyone else only sees their own.
router.get("/", auth(), ActionLogControllers.getAllActionLogs);

export const ActionLogRoutes = router;

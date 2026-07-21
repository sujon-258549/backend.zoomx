import express from "express";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import validateRequest from "../../middleware/validateRequest";
import { ProjectControllers } from "./project.controller";
import { ProjectValidation } from "./project.validation";

const router = express.Router();

router.get("/", ProjectControllers.getAllProjects);
router.get("/:id", ProjectControllers.getProjectById);

router.post(
  "/",
  auth(),
  checkPermission("Projects", "create"),
  validateRequest(ProjectValidation.create),
  ProjectControllers.createProject
);

router.put(
  "/:id",
  auth(),
  checkPermission("Projects", "update"),
  validateRequest(ProjectValidation.update),
  ProjectControllers.updateProject
);

router.delete(
  "/:id",
  auth(),
  checkPermission("Projects", "delete"),
  ProjectControllers.deleteProject
);

export const ProjectRoutes = router;
export default router;

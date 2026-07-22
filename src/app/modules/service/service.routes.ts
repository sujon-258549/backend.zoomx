import express from "express";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import validateRequest from "../../middleware/validateRequest";
import { ServiceControllers } from "./service.controller";
import { ServiceValidation } from "./service.validation";

const router = express.Router();

// Public reads. `/featured` is placed before `/:slug` so it isn't captured as a slug.
router.get("/", ServiceControllers.getAllServices);
router.get("/featured", ServiceControllers.getFeaturedServices);
router.get("/:slug", ServiceControllers.getSingleService);

// Admin writes — permission-gated.
router.post(
  "/create",
  auth(),
  checkPermission("Services", "create"),
  validateRequest(ServiceValidation.create),
  ServiceControllers.createService
);

router.put(
  "/status/:slug",
  auth(),
  checkPermission("Services", "update"),
  ServiceControllers.updateStatus
);

router.patch(
  "/:slug",
  auth(),
  checkPermission("Services", "update"),
  validateRequest(ServiceValidation.update),
  ServiceControllers.updateService
);

router.delete(
  "/:slug",
  auth(),
  checkPermission("Services", "delete"),
  ServiceControllers.deleteService
);

export const ServiceRoutes = router;

import { Router } from "express";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import validateRequest from "../../middleware/validateRequest";
import { ServicesCountryController } from "./servicesCountry.controller";
import { ServicesCountryValidation } from "./servicesCountry.validation";

const router = Router();

// Public reads (list + by-id) — used by both admin UI and frontend filtering
router.get("/", ServicesCountryController.getAll);
router.get("/:id", ServicesCountryController.getById);

router.post(
  "/",
  auth(),
  checkPermission("Services Countries", "create"),
  validateRequest(ServicesCountryValidation.create),
  ServicesCountryController.create
);

router.patch(
  "/:id",
  auth(),
  checkPermission("Services Countries", "update"),
  validateRequest(ServicesCountryValidation.update),
  ServicesCountryController.update
);

router.delete(
  "/:id",
  auth(),
  checkPermission("Services Countries", "delete"),
  ServicesCountryController.remove
);

export const ServicesCountryRoutes = router;

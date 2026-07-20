import { Router } from "express";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import validateRequest from "../../middleware/validateRequest";
import { CountryController } from "./country.controller";
import { CountryValidation } from "./country.validation";

const router = Router();

router.get("/", CountryController.getAllCountries);
router.get("/:id", CountryController.getCountryById);

router.post(
  "/",
  auth(),
  checkPermission("Countries", "create"),
  validateRequest(CountryValidation.createCountry),
  CountryController.createCountry
);

router.put(
  "/:id",
  auth(),
  checkPermission("Countries", "update"),
  validateRequest(CountryValidation.updateCountry),
  CountryController.updateCountry
);

router.patch(
  "/:id/status",
  auth(),
  checkPermission("Countries", "update"),
  CountryController.toggleCountryStatus
);

router.patch(
  "/:id/serial",
  auth(),
  checkPermission("Countries", "update"),
  validateRequest(CountryValidation.updateSerial),
  CountryController.updateCountrySerial
);

router.delete(
  "/:id",
  auth(),
  checkPermission("Countries", "delete"),
  CountryController.deleteCountry
);

export const CountryRoutes = router;

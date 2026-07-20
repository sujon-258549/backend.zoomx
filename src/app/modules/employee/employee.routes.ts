import { Router } from "express";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import validateRequest from "../../middleware/validateRequest";
import { EmployeeController } from "./employee.controller";
import { employeeValidation } from "./employee.validation";

const router = Router();

// Employees are users with a roleId — they share the "Employees" permission module.

router.get(
  "/",
  auth(),
  checkPermission("Employees", "view"),
  EmployeeController.getAllEmployees
);

router.get(
  "/:id",
  auth(),
  checkPermission("Employees", "view"),
  EmployeeController.getEmployeeById
);

router.post(
  "/",
  auth(),
  checkPermission("Employees", "create"),
  validateRequest(employeeValidation.create),
  EmployeeController.createEmployee
);

router.patch(
  "/:id",
  auth(),
  checkPermission("Employees", "update"),
  validateRequest(employeeValidation.update),
  EmployeeController.updateEmployee
);

router.patch(
  "/:id/status",
  auth(),
  checkPermission("Employees", "update"),
  EmployeeController.toggleEmployeeStatus
);

router.patch(
  "/:id/password",
  auth(),
  checkPermission("Employees", "change password"),
  validateRequest(employeeValidation.changePassword),
  EmployeeController.changeEmployeePassword
);

router.delete(
  "/:id",
  auth(),
  checkPermission("Employees", "delete"),
  EmployeeController.deleteEmployee
);

export const EmployeeRoutes = router;

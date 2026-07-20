import { Router } from "express";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import { contactRateLimit } from "../../middleware/rateLimit";
import validateRequest from "../../middleware/validateRequest";
import { inquiriesController } from "./inquiries.controller";
import { inquiriesValidation } from "./inquiries.validation";

const router = Router();

// Public submissions
router.post(
  "/contact",
  contactRateLimit,
  validateRequest(inquiriesValidation.createContactMessage),
  inquiriesController.createContactMessage
);

router.post(
  "/quotation",
  validateRequest(inquiriesValidation.createQuotationRequest),
  inquiriesController.createQuotationRequest
);

// Admin reads
router.get(
  "/all-contact",
  auth(),
  checkPermission("Contact Messages", "view"),
  inquiriesController.allContactMessage
);

router.get(
  "/all-quotation",
  auth(),
  checkPermission("Quotation Requests", "view"),
  inquiriesController.allQuotationRequest
);

router.delete(
  "/quotation/:id",
  auth(),
  checkPermission("Quotation Requests", "delete"),
  inquiriesController.deleteQuotationRequest
);

router.post(
  "/quotation/:id/send-email",
  auth(),
  checkPermission("Quotation Requests", "view"),
  inquiriesController.sendQuotationEmail
);

router.post(
  "/contact/:id/send-email",
  auth(),
  checkPermission("Contact Messages", "view"),
  inquiriesController.sendContactEmail
);

export const InquiriesRoutes = router;

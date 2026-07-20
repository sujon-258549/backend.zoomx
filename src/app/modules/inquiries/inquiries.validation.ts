import { z } from "zod";
// inquiries.validation.ts

// Contact Form Validation
export const createContactMessage = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email format"),
    phone: z.string({ required_error: "Phone is required" }),
    subject: z.string({ required_error: "Subject is required" }),
    message: z.string({ required_error: "Message is required" }),
    type: z.string().optional(),
  }),
});

// Quotation Form Validation
export const createQuotationRequest = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email format"),
    phone: z.string().optional(),
    site_url: z.string().optional(),
    company_name: z.string().optional(),
    service: z.string().min(1, "Service is required"),
    budget: z.string().min(1, "Budget is required"),
    message: z.string().min(1, "Message is required"),
  }),
});

export const inquiriesValidation = {
  createContactMessage,
  createQuotationRequest,
};

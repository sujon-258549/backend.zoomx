import { Schema, model } from "mongoose";
import { IContactMessage, IQuotationRequest } from "./inquiries.interface";

// Contact Message Schema
const ContactMessageSchema = new Schema<IContactMessage>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Quotation Request Schema
const QuotationRequestSchema = new Schema<IQuotationRequest>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String },
    site_url: { type: String },
    company_name: { type: String },
    delivery_time: { type: String },
    start_date: { type: String },
    service: { type: String, required: true },
    budget: { type: String, required: true },
    message: { type: String, required: true },
    help: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
// Models
export const ContactMessage = model<IContactMessage>(
  "ContactMessage",
  ContactMessageSchema
);

export const QuotationRequest = model<IQuotationRequest>(
  "QuotationRequest",
  QuotationRequestSchema
);

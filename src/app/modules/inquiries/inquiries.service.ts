import config from "../../config";
import { paginationHelper } from "../../helpers/paginationHelper";
import { IPaginationOptions } from "../../interface/pagination";
import { EmailHelper } from "../../utils/emailHelper";
import {
  NotificationPriority,
  NotificationType,
} from "../notification/notification.interface";
import { NotificationService } from "../notification/notification.service";
import { inquiriesSearchableFields } from "./inquiries.constant";
import { IContactMessage, IQuotationRequest } from "./inquiries.interface";
import { ContactMessage, QuotationRequest } from "./inquiries.model";

const truncate = (text: string, max = 140) =>
  text.length > max ? `${text.slice(0, max).trim()}…` : text;

// Contact Message Service

// Create
const createContactMessage = async (
  payload: IContactMessage
): Promise<IContactMessage> => {
  try {
    const result = await ContactMessage.create(payload);

    // Fire-and-forget — admin dashboard notification. Failures are logged
    // inside NotificationService.emit and never break the public submission.
    void (async () => {
      try {
        await NotificationService.emit({
          type: NotificationType.CONTACT_MESSAGE,
          title: `New contact message from ${payload.name}`,
          message: `Subject: ${payload.subject}\n${truncate(payload.message)}`,
          priority: NotificationPriority.HIGH,
          source: {
            module: "inquiries",
            refModel: "ContactMessage",
            refId: (result as any)?._id,
          },
          metadata: {
            contactId: String((result as any)?._id ?? ""),
            name: payload.name,
            email: payload.email,
            phone: payload.phone,
            subject: payload.subject,
            messagePreview: truncate(payload.message, 200),
          },
          actionUrl: `/inquiries/contact-message`,
        });
      } catch (err) {
        console.error(
          "[inquiries.createContactMessage] failed to emit notification:",
          err
        );
      }
    })();

    // Send email notification to admin
    if (config.sender_email) {
      try {
        const emailContent = await EmailHelper.createEmailContent(
          {
            name: payload.name,
            email: payload.email,
            phone: payload.phone,
            subject: payload.subject,
            message: payload.message,
            timestamp: new Date().toLocaleString("en-US", {
              timeZone: "Asia/Dhaka",
              dateStyle: "full",
              timeStyle: "long",
            }),
          },
          "contactMessage"
        );

        await EmailHelper.sendEmail(
          config.sender_email as string,
          emailContent,
          `New Contact Message: ${payload.subject}`,
          payload.email,
          payload.name
        );
      } catch (emailError) {
        console.error("Error sending contact message email:", emailError);
        // Don't throw error, just log it so the main operation succeeds
      }
    }

    return result;
  } catch (err) {
    console.error("Error creating contact message:", err);
    throw err;
  }
};

const allContactMessage = async (params: any, options: IPaginationOptions) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { keyword, ...filterData } = params;

  // Search condition
  const searchCondition =
    keyword && inquiriesSearchableFields.length > 0
      ? {
          $or: inquiriesSearchableFields.map((field) => ({
            [field]: { $regex: keyword, $options: "i" },
          })),
        }
      : {};

  // Filter condition
  const filterCondition =
    Object.keys(filterData).length > 0
      ? {
          $and: Object.entries(filterData).map(([key, value]) => ({
            [key]: value,
          })),
        }
      : {};

  const whereConditions = {
    ...searchCondition,
    ...filterCondition,
  };

  const data = await ContactMessage.find(whereConditions)
    .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
    .skip(skip)
    .limit(limit);

  const total = await ContactMessage.countDocuments(whereConditions);

  return {
    meta: {
      page,
      limit,
      total,
    },
    data,
  };
};

// Quotation Requests Service
const createQuotationRequest = async (
  payload: IQuotationRequest
): Promise<IQuotationRequest> => {
  try {
    const result = await QuotationRequest.create(payload);

    // Send email notification to admin
    if (config.sender_email) {
      try {
        const emailContent = await EmailHelper.createEmailContent(
          {
            name: payload.name,
            email: payload.email,
            phone: payload.phone || "",
            company_name: payload.company_name || "",
            site_url: payload.site_url || "",
            service: payload.service,
            budget: payload.budget,
            delivery_time: payload.delivery_time || "",
            start_date: payload.start_date || "",
            help: payload.help || "",
            message: payload.message || "",
            timestamp: new Date().toLocaleString("en-US", {
              timeZone: "Asia/Dhaka",
              dateStyle: "full",
              timeStyle: "long",
            }),
          },
          "quotationRequest"
        );

        await EmailHelper.sendEmail(
          config.sender_email as string,
          emailContent,
          `Quotation Request - ${payload.service} - ${payload.name}`,
          payload.email,
          payload.name
        );
      } catch (emailError) {
        console.error("Error sending quotation request email:", emailError);
        // Don't throw error, just log it so the main operation succeeds
      }
    }

    return result;
  } catch (err) {
    console.error("Error creating quotation request:", err);
    throw err;
  }
};

const allQuotationRequest = async (
  params: any,
  options: IPaginationOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { keyword, ...filterData } = params;

  // Search condition
  const searchCondition =
    keyword && inquiriesSearchableFields.length > 0
      ? {
          $or: inquiriesSearchableFields.map((field) => ({
            [field]: { $regex: keyword, $options: "i" },
          })),
        }
      : {};

  // Filter condition
  const filterCondition =
    Object.keys(filterData).length > 0
      ? {
          $and: Object.entries(filterData).map(([key, value]) => ({
            [key]: value,
          })),
        }
      : {};

  const whereConditions = {
    ...searchCondition,
    ...filterCondition,
  };

  const data = await QuotationRequest.find(whereConditions)
    .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
    .skip(skip)
    .limit(limit);

  const total = await QuotationRequest.countDocuments(whereConditions);

  return {
    meta: {
      page,
      limit,
      total,
    },
    data,
  };
};

const deleteQuotationRequest = async (id: string) => {
  const result = await QuotationRequest.findByIdAndDelete(id);
  if (!result) {
    throw new Error("Quotation request not found");
  }
  return result;
};

// Wrap a user-composed email body in a branded HTML shell so every quotation
// reply we send has consistent branding (header + footer) without the admin
// having to paste boilerplate into the textarea.
const buildBrandedQuotationHTML = (
  recipientName: string,
  service: string,
  bodyHtml: string
): string => {
  return `
<div style="background:#ffffff;font-family:Inter,Segoe UI,Arial,sans-serif;color:#1f2937;margin:0;padding:0;width:100%;">
  <div style="width:100%;background:linear-gradient(135deg,#35ad0b 0%,#2f9a0a 100%);padding:32px 24px;color:#ffffff;box-sizing:border-box;">
    <p style="margin:0;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.85;">ZOOM IT — Quotations</p>
    <h1 style="margin:8px 0 0;font-size:22px;line-height:1.3;">Hi ${recipientName},</h1>
    <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">Regarding your request for <strong>${service}</strong></p>
  </div>
  <div style="width:100%;padding:32px 24px;font-size:15px;line-height:1.65;color:#1f2937;box-sizing:border-box;">
    ${bodyHtml}
  </div>
  <div style="width:100%;background:#f9fafb;border-top:1px solid #e5e7eb;padding:18px 24px;box-sizing:border-box;font-size:12px;color:#6b7280;text-align:center;">
    Sent by the ZOOM IT team · <a href="https://thezoomit.com" style="color:#35ad0b;text-decoration:none;">thezoomit.com</a>
  </div>
</div>`;
};

interface SendQuotationEmailInput {
  quotationId: string;
  subject: string;
  body: string; // HTML
}

const sendQuotationEmail = async (input: SendQuotationEmailInput) => {
  const quotation = await QuotationRequest.findById(input.quotationId);
  if (!quotation) {
    throw new Error("Quotation request not found");
  }

  const html = buildBrandedQuotationHTML(
    quotation.name,
    quotation.service,
    input.body
  );

  try {
    await EmailHelper.sendEmail(quotation.email, html, input.subject);
  } catch (err: any) {
    throw new Error(err?.message || "Failed to send email");
  }

  return {
    to: quotation.email,
    subject: input.subject,
  };
};

// Same branded shell as the quotation reply, but with a "Support" eyebrow and
// the customer's original subject in the header so they instantly recognize
// which conversation this email is part of.
const buildBrandedContactHTML = (
  recipientName: string,
  originalSubject: string,
  bodyHtml: string
): string => {
  return `
<div style="background:#ffffff;font-family:Inter,Segoe UI,Arial,sans-serif;color:#1f2937;margin:0;padding:0;width:100%;">
  <div style="width:100%;background:linear-gradient(135deg,#35ad0b 0%,#2f9a0a 100%);padding:32px 24px;color:#ffffff;box-sizing:border-box;">
    <p style="margin:0;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.85;">ZOOM IT — Support</p>
    <h1 style="margin:8px 0 0;font-size:22px;line-height:1.3;">Hi ${recipientName},</h1>
    <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">Regarding your message: <strong>${originalSubject}</strong></p>
  </div>
  <div style="width:100%;padding:32px 24px;font-size:15px;line-height:1.65;color:#1f2937;box-sizing:border-box;">
    ${bodyHtml}
  </div>
  <div style="width:100%;background:#f9fafb;border-top:1px solid #e5e7eb;padding:18px 24px;box-sizing:border-box;font-size:12px;color:#6b7280;text-align:center;">
    Sent by the ZOOM IT team · <a href="https://thezoomit.com" style="color:#35ad0b;text-decoration:none;">thezoomit.com</a>
  </div>
</div>`;
};

interface SendContactEmailInput {
  contactId: string;
  subject: string;
  body: string; // HTML
}

const sendContactEmail = async (input: SendContactEmailInput) => {
  const contact = await ContactMessage.findById(input.contactId);
  if (!contact) {
    throw new Error("Contact message not found");
  }

  const html = buildBrandedContactHTML(
    contact.name,
    contact.subject,
    input.body
  );

  try {
    await EmailHelper.sendEmail(contact.email, html, input.subject);
  } catch (err: any) {
    throw new Error(err?.message || "Failed to send email");
  }

  return {
    to: contact.email,
    subject: input.subject,
  };
};

export const inquiriesService = {
  createContactMessage,
  createQuotationRequest,
  allContactMessage,
  allQuotationRequest,
  deleteQuotationRequest,
  sendQuotationEmail,
  sendContactEmail,
};

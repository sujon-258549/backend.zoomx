import { z } from "zod";

const socialLinkItemSchema = z.object({
  name: z.string().max(50).optional(),
  link: z
    .string()
    .max(500)
    .url()
    .optional()
    .or(z.literal("")),
});

const createTeamMember = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().max(20).optional().or(z.literal("")),
    designation: z.string().min(1).max(100),
    department: z.string().max(100).optional(),
    photoId: z.string().min(1).max(255).optional(),
    bio: z.string().max(500).optional(),
    socialLinks: z.array(socialLinkItemSchema).optional(),
    is_new: z.boolean().optional(),
    isActive: z.boolean().optional(),
    isTeamLead: z.boolean().optional(),
  }),
});

const updateTeamMember = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().max(20).optional().or(z.literal("")),
    designation: z.string().min(1).max(100).optional(),
    department: z.string().max(100).optional(),
    photoId: z.string().min(1).max(255).optional(),
    bio: z.string().max(500).optional(),
    socialLinks: z.array(socialLinkItemSchema).optional(),
    is_new: z.boolean().optional(),
    isActive: z.boolean().optional(),
    isTeamLead: z.boolean().optional(),
  }),
});

const updateSerial = z.object({
  body: z.object({
    serial_no: z.number().int().min(1),
  }),
});

export const TeamMemberValidation = {
  createTeamMember,
  updateTeamMember,
  updateSerial,
};

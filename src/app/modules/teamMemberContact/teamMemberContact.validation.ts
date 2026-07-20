import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const createTeamMemberContact = z.object({
  body: z.object({
    phone: z.string().min(1).max(30),
    question: z.string().min(1).max(1000),
    memberId: z.string().regex(objectIdRegex, "Invalid member id"),
  }),
});

export const TeamMemberContactValidation = {
  createTeamMemberContact,
};

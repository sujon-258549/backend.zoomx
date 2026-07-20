import { z } from "zod";

const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

const createCountry = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    code: z.string().min(2).max(5),
    flag: z.string().min(1).max(500),
    role: z.string().min(1).max(100),
    address: z.string().min(1).max(300),
    email: z.string().email(),
    phone: z.string().min(1).max(40),
    accentSolid: z
      .string()
      .regex(HEX_COLOR, "accentSolid must be a valid hex color (e.g. #22c55e)"),
    isActive: z.boolean().optional(),
  }),
});

const updateCountry = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    code: z.string().min(2).max(5).optional(),
    flag: z.string().min(1).max(500).optional(),
    role: z.string().min(1).max(100).optional(),
    address: z.string().min(1).max(300).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(1).max(40).optional(),
    accentSolid: z.string().regex(HEX_COLOR).optional(),
    isActive: z.boolean().optional(),
  }),
});

const updateSerial = z.object({
  body: z.object({
    serial_no: z.number().int().min(1),
  }),
});

export const CountryValidation = {
  createCountry,
  updateCountry,
  updateSerial,
};

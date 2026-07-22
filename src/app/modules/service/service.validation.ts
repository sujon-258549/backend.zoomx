import { z } from "zod";

const action = z.object({
  label: z.string().optional(),
  href: z.string().optional(),
});

const hero = z.object({
  videoSrc: z.string().optional(),
  eyebrow: z.string().optional(),
  titleGradient: z.string().optional(),
  titleWhite: z.string().optional(),
  description: z.string().optional(),
  primaryAction: action.optional(),
  secondaryAction: action.optional(),
});

const details = z.object({
  eyebrow: z.string().optional(),
  titleGradient: z.string().optional(),
  titleWhite: z.string().optional(),
  image: z.string().optional(),
  body: z.string().optional(),
});

const logo = z.object({
  name: z.string().optional(),
  src: z.string().optional(),
});

const trustedBrands = z.object({
  eyebrow: z.string().optional(),
  titleGradient: z.string().optional(),
  titleWhite: z.string().optional(),
  logos: z.array(logo).optional(),
});

const galleryVideo = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  thumbnail: z.string().optional(),
});

const gallery = z.object({
  eyebrow: z.string().optional(),
  titleGradient: z.string().optional(),
  titleWhite: z.string().optional(),
  videos: z.array(galleryVideo).optional(),
});

const create = z.object({
  body: z.object({
    name: z.string().min(1, "Service name is required"),
    slug: z.string().optional(),
    thumbnail: z.string().optional(),
    cardImages: z.array(z.string()).optional(),
    categoryIds: z.array(z.string()).optional(),
    hero: hero.optional(),
    trustedBrands: trustedBrands.optional(),
    details: details.optional(),
    gallery: gallery.optional(),
    status: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    serial_no: z.number().int().nonnegative().optional(),
    is_deleted: z.boolean().optional(),
  }),
});

const update = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    slug: z.string().optional(),
    thumbnail: z.string().optional(),
    cardImages: z.array(z.string()).optional(),
    categoryIds: z.array(z.string()).optional(),
    hero: hero.optional(),
    trustedBrands: trustedBrands.optional(),
    details: details.optional(),
    gallery: gallery.optional(),
    status: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    serial_no: z.number().int().nonnegative().optional(),
    is_deleted: z.boolean().optional(),
  }),
});

export const ServiceValidation = { create, update };

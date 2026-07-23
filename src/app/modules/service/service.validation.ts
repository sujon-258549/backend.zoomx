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

const section = z.object({
  key: z.string().min(1),
  visible: z.boolean().optional(),
});

// ── Per-section content ──
const namedItem = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
});
const statItem = z.object({ value: z.string().optional(), label: z.string().optional() });
const process = z.object({
  title1: z.string().optional(),
  title2: z.string().optional(),
  steps: z.array(namedItem).optional(),
});
const whyUs = z.object({
  eyebrow: z.string().optional(),
  title1: z.string().optional(),
  title2: z.string().optional(),
  description: z.string().optional(),
  features: z.array(namedItem).optional(),
  stats: z.array(statItem).optional(),
});
const showcaseItem = z.object({
  tag: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  points: z.array(z.string()).optional(),
  image: z.string().optional(),
});
const showcase = z.object({ items: z.array(showcaseItem).optional() });
const headingList = z.object({
  title1: z.string().optional(),
  title2: z.string().optional(),
  sub: z.string().optional(),
  items: z.array(namedItem).optional(),
});
const platformItem = z.object({
  name: z.string().optional(),
  format: z.string().optional(),
  ratio: z.string().optional(),
});
const platforms = z.object({
  title1: z.string().optional(),
  title2: z.string().optional(),
  sub: z.string().optional(),
  items: z.array(platformItem).optional(),
});
const comparison = z.object({
  title1: z.string().optional(),
  title2: z.string().optional(),
  sub: z.string().optional(),
  oursLabel: z.string().optional(),
  othersLabel: z.string().optional(),
  items: z.array(z.string()).optional(),
});
const toolItem = z.object({ name: z.string().optional(), role: z.string().optional() });
const tools = z.object({
  title1: z.string().optional(),
  title2: z.string().optional(),
  sub: z.string().optional(),
  items: z.array(toolItem).optional(),
});
const faqItem = z.object({ q: z.string().optional(), a: z.string().optional() });
const faq = z.object({ items: z.array(faqItem).optional() });
const logos = z.object({ title: z.string().optional(), images: z.array(z.string()).optional() });

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
    sections: z.array(section).optional(),
    logos: logos.optional(),
    process: process.optional(),
    whyUs: whyUs.optional(),
    showcase: showcase.optional(),
    deliverables: headingList.optional(),
    platforms: platforms.optional(),
    comparison: comparison.optional(),
    tools: tools.optional(),
    faq: faq.optional(),
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
    sections: z.array(section).optional(),
    logos: logos.optional(),
    process: process.optional(),
    whyUs: whyUs.optional(),
    showcase: showcase.optional(),
    deliverables: headingList.optional(),
    platforms: platforms.optional(),
    comparison: comparison.optional(),
    tools: tools.optional(),
    faq: faq.optional(),
    status: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    serial_no: z.number().int().nonnegative().optional(),
    is_deleted: z.boolean().optional(),
  }),
});

export const ServiceValidation = { create, update };

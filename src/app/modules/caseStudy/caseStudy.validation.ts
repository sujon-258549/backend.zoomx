import { z } from "zod";

const stat = z.object({
  value: z.string().min(1, "Stat value is required"),
  label: z.string().min(1, "Stat label is required"),
});

const flowItem = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
});

const tag = z.object({
  label: z.string().min(1, "Tag label is required"),
  icon: z.string().optional(),
});

const hero = z.object({
  videoSrc: z.string().optional(),
  videoId: z.string().optional(),
  eyebrow: z.string().optional(),
  titleGradient: z.string().min(1, "Hero title is required"),
  description: z.string().optional(),
});

const block = z.object({
  // Section label (Problem / Solution) is fixed and rendered on the frontend.
  title: z.string().min(1, "Title is required"),
  summary: z.string().optional(),
  items: z.array(flowItem).default([]),
});

const growth = z.object({
  // Section label ("Growth") is fixed and rendered on the frontend.
  title: z.string().min(1, "Title is required"),
  summary: z.string().optional(),
  stats: z.array(stat).max(4, "No more than four growth stats are allowed").default([]),
});

const details = z.object({
  tags: z.array(tag).optional(),
  hero: hero,
  challenges: block,
  solutions: block,
  growth: growth,
});

const create = z.object({
  body: z.object({
    index: z.string().optional(),
    slug: z.string().optional(),
    quote: z.object({
      lead: z.string().min(1, "Quote lead is required"),
      punch: z.string().min(1, "Quote punch is required"),
    }),
    author: z.object({
      name: z.string().min(1, "Author name is required"),
      role: z.string().min(1, "Author role is required"),
      avatar: z.string().optional(),
      avatarId: z.string().optional(),
    }),
    stats: z
      .array(stat)
      .min(1, "At least one stat is required")
      .max(3, "No more than three stats are allowed"),
    video_url: z.string().optional(),
    videoId: z.string().optional(),
    categoryIds: z.array(z.string()).optional(),
    details: details.optional(),
    status: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    serial_no: z.number().int().nonnegative().optional(),
    is_deleted: z.boolean().optional(),
  }),
});

// Everything optional on update — partial patch semantics.
const update = z.object({
  body: z.object({
    index: z.string().optional(),
    slug: z.string().optional(),
    quote: z
      .object({
        lead: z.string().min(1),
        punch: z.string().min(1),
      })
      .optional(),
    author: z
      .object({
        name: z.string().min(1),
        role: z.string().min(1),
        avatar: z.string().optional(),
        avatarId: z.string().optional(),
      })
      .optional(),
    stats: z
      .array(stat)
      .min(1, "At least one stat is required")
      .max(3, "No more than three stats are allowed")
      .optional(),
    video_url: z.string().optional(),
    videoId: z.string().optional(),
    categoryIds: z.array(z.string()).optional(),
    details: details.optional(),
    status: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    serial_no: z.number().int().nonnegative().optional(),
    is_deleted: z.boolean().optional(),
  }),
});

export const CaseStudyValidation = {
  create,
  update,
};

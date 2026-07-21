export const caseStudyFilterableFields = [
  "keyword",
  "status",
  "isFeatured",
  "is_deleted",
  "startDate",
  "endDate",
];

// Fields the keyword search scans (nested paths use dot notation).
export const caseStudySearchableFields = [
  "author.name",
  "author.role",
  "quote.lead",
  "quote.punch",
  "slug",
];

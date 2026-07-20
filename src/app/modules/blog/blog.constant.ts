export const blogStatus = ["draft", "published"] as const;
export const blogFilterableFields = ["keyword", "status", "is_deleted", "category", "author", "last_update_by", "startDate", "endDate"];
export const blogSearchableFields = ["title", "sort_description", "content"];

/** Fields returned in blog list APIs (getAllBlogs, getBlogsByCategory) */
export const blogListSelectFields =
  "thumbnail title sort_description slug category tags author createdAt -_id";

/** Fields returned in getBlogsByAuthor (blogs + author with name, profile, username) */
export const blogByAuthorSelectFields =
  "slug thumbnail sort_description title createdAt author category";

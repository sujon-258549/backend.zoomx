export const generateSlug = (text: string): string => {
  return text
    .trim()
    .replace(/[~`!@#$%^&*()_+={}[\]|\\:;"'<>,.?/₹•–—]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/%/g, "");
};

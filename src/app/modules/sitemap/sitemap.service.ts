import { Blog } from "../blog/blog.model";

import { Service } from "../service/service.model";

type SitemapItem = {
  slug?: string;
  updatedAt?: Date;
  createdAt?: Date;
};

const normalizeBaseUrl = () => {
  const fallback = "https://thezoomit.com";
 return fallback;
};

const buildUrl = (baseUrl: string, path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`.replace(/([^:]\/)\/+/g, "$1");
};

const mapEntries = (items: SitemapItem[], baseUrl: string, prefix: string) =>
  items
    .filter((item) => Boolean(item.slug))
    .map((item) => {
      const lastModified = item.updatedAt || item.createdAt;
      const url = buildUrl(baseUrl, `${prefix}/${item.slug}`);
      return {
        slug: item.slug as string,
        url,
        lastModified,
      };
    });

const getSitemapData = async () => {
  const baseUrl = normalizeBaseUrl();
  const [blogs, services] = await Promise.all([
    Blog.find<SitemapItem>({
      status: true,
      is_deleted: false,
    })
      .select("slug updatedAt createdAt")
      .lean(),
    Service.find<SitemapItem>({
      status: true,
      is_deleted: false,
    })
      .select("slug updatedAt createdAt")
      .lean(),
  ]);
  const staticRoutes = [
    { label: "Home", url: buildUrl(baseUrl, "/") },
    { label: "About", url: buildUrl(baseUrl, "/about") },
    { label: "Blog", url: buildUrl(baseUrl, "/blog") },
    { label: "Leadership", url: buildUrl(baseUrl, "/about/leadership") },
    { label: "Talent", url: buildUrl(baseUrl, "/about/talent") },
    { label: "Book an Appointment", url: buildUrl(baseUrl, "/book-an-appoinment") },
    { label: "Careers", url: buildUrl(baseUrl, "/careers") },
    { label: "Case Studies", url: buildUrl(baseUrl, "/case-studies") },
    { label: "Contact Us", url: buildUrl(baseUrl, "/contact-us") },
    { label: "Get Quotation", url: buildUrl(baseUrl, "/get-quatation") },
    { label: "Portfolio", url: buildUrl(baseUrl, "/portfolio") },
  ];
  return {
    baseUrl,
    staticRoutes,
    blogs: mapEntries(blogs as SitemapItem[], baseUrl, "/blog"),
    services: mapEntries(services as SitemapItem[], baseUrl, "/"),
    caseStudies: [],
    generatedAt: new Date(),
  };
};

export const SitemapService = {
  getSitemapData,
};


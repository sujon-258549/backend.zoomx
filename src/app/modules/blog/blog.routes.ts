import express from "express";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import validateRequest from "../../middleware/validateRequest";
import { BlogControllers } from "./blog.controller";
import { BlogValidation } from "./blog.validation";

const router = express.Router();

// Public reads (used by the public site too)
router.get("/", BlogControllers.getAllBlogs);
router.get("/categories", BlogControllers.getCategoryList);
router.get("/categories/:category", BlogControllers.getBlogsByCategory);
router.get("/authors", BlogControllers.getAllAuthors);
router.get("/author/:username", BlogControllers.getBlogsByAuthor);
router.get("/:slug", BlogControllers.getSingleBlog);

// Admin writes — permission-gated
router.post(
  "/create",
  auth(),
  checkPermission("Blog Posts", "create"),
  validateRequest(BlogValidation.create),
  BlogControllers.createBlog
);

router.put(
  "/status/:slug",
  auth(),
  checkPermission("Blog Posts", "update"),
  BlogControllers.updateStatus
);

router.patch(
  "/:slug",
  auth(),
  checkPermission("Blog Posts", "update"),
  validateRequest(BlogValidation.update),
  BlogControllers.updateBlog
);

router.delete(
  "/:slug",
  auth(),
  checkPermission("Blog Posts", "delete"),
  BlogControllers.deleteBlog
);

export const BlogRoutes = router;

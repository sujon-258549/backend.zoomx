import { Router } from "express";
import { SitemapController } from "./sitemap.controller";

const router = Router();

router.get("/", SitemapController.getSitemapData);

export const SitemapRoutes = router;



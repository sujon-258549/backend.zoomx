import express from "express";
import validateRequest from "../../middleware/validateRequest";
import { ProductControllers } from "./product.controller";
import { ProductValidation } from "./product.validation";

const router = express.Router();

router.post(
  "/",
  validateRequest(ProductValidation.createProductValidationSchema),
  ProductControllers.createProduct
);

router.get("/", ProductControllers.getAllProducts);

// Must come before "/:id" so they aren't captured as a product id.
router.get("/by-category", ProductControllers.getProductsByCategory);
router.get("/category-counts", ProductControllers.getCategoryCounts);
router.get("/category/:slug", ProductControllers.getProductsByCategorySlug);

router.get("/:id", ProductControllers.getSingleProduct);

router.put(
  "/:id",
  validateRequest(ProductValidation.updateProductValidationSchema),
  ProductControllers.updateProduct
);

router.delete("/:id", ProductControllers.deleteProduct);

export const ProductRoutes = router;

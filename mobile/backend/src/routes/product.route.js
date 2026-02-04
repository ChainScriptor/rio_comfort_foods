import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getAllProducts } from "../controllers/admin.controller.js";
import { getProductById, getCategories, getBanners } from "../controllers/product.controller.js";

const router = Router();

// Public routes - no auth required
// IMPORTANT: These must be BEFORE the /:id route to avoid matching conflicts
router.get("/categories", getCategories);
router.get("/banners", getBanners);

router.get("/", protectRoute, getAllProducts);

// This route must be AFTER /categories and /banners to avoid matching conflicts
router.get("/:id", protectRoute, async (req, res, next) => {
  // Prevent "categories" and "banners" from being treated as an ID
  if (req.params.id === "categories" || req.params.id === "banners") {
    return res.status(404).json({ message: "Route not found" });
  }
  try {
    await getProductById(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;

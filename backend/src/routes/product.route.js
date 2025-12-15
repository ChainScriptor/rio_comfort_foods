import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getAllProducts } from "../controllers/admin.controller.js";
import { getProductById, getCategories } from "../controllers/product.controller.js";

const router = Router();

// Public route - no auth required
// IMPORTANT: This must be BEFORE the /:id route to avoid matching conflicts
router.get("/categories", getCategories);

router.get("/", protectRoute, getAllProducts);

// This route must be AFTER /categories to avoid matching conflicts
router.get("/:id", protectRoute, async (req, res, next) => {
  // Prevent "categories" from being treated as an ID
  if (req.params.id === "categories") {
    return res.status(404).json({ message: "Route not found" });
  }
  try {
    await getProductById(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;

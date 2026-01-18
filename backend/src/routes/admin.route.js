import { Router } from "express";
import {
  createProduct,
  getAllCustomers,
  deleteCustomer,
  getAllOrders,
  getAllProducts,
  getDashboardStats,
  updateOrderStatus,
  updateOrderDeliveryDate,
  updateProduct,
  deleteProduct,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllReviews,
  inviteCustomer,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} from "../controllers/admin.controller.js";
import { adminOnly, protectRoute } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();

// optimization - DRY
router.use(protectRoute, adminOnly);

router.post("/products", upload.array("images", 3), createProduct);
router.get("/products", getAllProducts);
router.put("/products/:id", upload.array("images", 3), updateProduct);
router.delete("/products/:id", deleteProduct);

router.get("/orders", getAllOrders);
router.patch("/orders/:orderId/status", updateOrderStatus);
router.patch("/orders/:orderId/delivery-date", updateOrderDeliveryDate);

router.get("/customers", getAllCustomers);
router.delete("/customers/:id", deleteCustomer);
router.post("/invite", inviteCustomer);

router.get("/stats", getDashboardStats);

// Category routes
router.get("/categories", getAllCategories);
router.post("/categories", upload.single("image"), createCategory);
router.put("/categories/:id", upload.single("image"), updateCategory);
router.delete("/categories/:id", deleteCategory);

// Review routes
router.get("/reviews", getAllReviews);

// Banner routes
router.get("/banners", getAllBanners);
router.post("/banners", upload.single("image"), createBanner);
router.put("/banners/:id", upload.single("image"), updateBanner);
router.delete("/banners/:id", deleteBanner);

// PUT: Used for full resource replacement, updating the entire resource
// PATCH: Used for partial resource updates, updating a specific part of the resource

export default router;

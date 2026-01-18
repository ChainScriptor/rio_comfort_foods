import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";
import { Banner } from "../models/banner.model.js";

export async function getProductById(req, res) {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) return res.status(404).json({ message: "Product not found" });

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getCategories(req, res) {
  try {
    // Check if Category model is available
    if (!Category) {
      throw new Error("Category model is not available");
    }
    
    // First, try to get all categories sorted by custom order (for mobile display)
    const allCategories = await Category.find().sort({ order: 1, createdAt: -1 });
    
    // Filter active categories (handle cases where isActive might be undefined)
    const categories = allCategories
      .filter((cat) => cat.isActive !== false)
      .map((cat) => ({
        name: cat.name,
        icon: cat.icon || "",
        image: cat.image || "",
        order: cat.order ?? 0,
      }));
    
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ 
      message: "Internal server error",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
}

export async function getBanners(req, res) {
  try {
    // Get only active banners, sorted by order
    const banners = await Banner.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .select("imageUrl linkUrl order");
    
    res.status(200).json(banners);
  } catch (error) {
    res.status(500).json({ 
      message: "Internal server error",
      error: error.message,
    });
  }
}

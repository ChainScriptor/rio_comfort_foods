import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";

export async function getProductById(req, res) {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) return res.status(404).json({ message: "Product not found" });

    res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getCategories(req, res) {
  try {
    console.log("🔍 Fetching categories...");
    console.log("Category model:", Category ? "loaded" : "NOT loaded");
    
    // Check if Category model is available
    if (!Category) {
      throw new Error("Category model is not available");
    }
    
    // First, try to get all categories sorted by custom order (for mobile display)
    const allCategories = await Category.find().sort({ order: 1, createdAt: -1 });
    console.log("📦 All categories found:", allCategories.length);
    
    // Filter active categories (handle cases where isActive might be undefined)
    const categories = allCategories
      .filter((cat) => cat.isActive !== false)
      .map((cat) => ({
        name: cat.name,
        icon: cat.icon || "",
        image: cat.image || "",
        order: cat.order ?? 0,
      }));
    
    console.log("✅ Active categories:", categories.length);
    console.log("Categories:", JSON.stringify(categories, null, 2));
    
    res.status(200).json(categories);
  } catch (error) {
    console.error("❌ Error fetching categories:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    res.status(500).json({ 
      message: "Internal server error",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
}

import cloudinary from "../config/cloudinary.js";
import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";
import { Category } from "../models/category.model.js";
import { Review } from "../models/review.model.js";

export async function createProduct(req, res) {
  try {
    const { name, description, price, stock, category, unitType, unitOptions, showPrice } = req.body;

    if (!name || !description || !stock || !category) {
      return res.status(400).json({ message: "Name, description, stock, and category are required" });
    }

    let parsedUnitOptions = [];
    if (unitOptions) {
      try {
        parsedUnitOptions = typeof unitOptions === "string" ? JSON.parse(unitOptions) : unitOptions;
      } catch (e) {
        parsedUnitOptions = [];
      }
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "At least one image is required" });
    }

    if (req.files.length > 3) {
      return res.status(400).json({ message: "Maximum 3 images allowed" });
    }

    const uploadPromises = req.files.map((file) => {
      return cloudinary.uploader.upload(file.path, {
        folder: "products",
      });
    });

    const uploadResults = await Promise.all(uploadPromises);

    const imageUrls = uploadResults.map((result) => result.secure_url);

    const product = await Product.create({
      name,
      description,
      price: price ? parseFloat(price) : undefined,
      stock: parseInt(stock),
      category,
      images: imageUrls,
      unitType: unitType || "pieces",
      unitOptions: parsedUnitOptions,
      showPrice: showPrice !== undefined ? showPrice === "true" || showPrice === true : true,
    });

    res.status(201).json(product);
  } catch (error) {
    console.error("Error creating product", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getAllProducts(_, res) {
  try {
    // -1 means in desc order: most recent products first
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const { name, description, price, stock, category, unitType, unitOptions, showPrice } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (name) product.name = name;
    if (description) product.description = description;
    if (price !== undefined && price !== "") {
      product.price = parseFloat(price);
    } else if (price === "") {
      product.price = undefined;
    }
    if (stock !== undefined) product.stock = parseInt(stock);
    if (category) product.category = category;
    if (unitType !== undefined) product.unitType = unitType;
    if (unitOptions !== undefined) {
      let parsedUnitOptions = [];
      try {
        parsedUnitOptions = typeof unitOptions === "string" ? JSON.parse(unitOptions) : unitOptions;
      } catch (e) {
        parsedUnitOptions = [];
      }
      product.unitOptions = parsedUnitOptions;
    }
    if (showPrice !== undefined) {
      product.showPrice = showPrice === "true" || showPrice === true;
    }

    // handle image updates if new images are uploaded
    if (req.files && req.files.length > 0) {
      if (req.files.length > 3) {
        return res.status(400).json({ message: "Maximum 3 images allowed" });
      }

      const uploadPromises = req.files.map((file) => {
        return cloudinary.uploader.upload(file.path, {
          folder: "products",
        });
      });

      const uploadResults = await Promise.all(uploadPromises);
      product.images = uploadResults.map((result) => result.secure_url);
    }

    await product.save();
    res.status(200).json(product);
  } catch (error) {
    console.error("Error updating products:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getAllOrders(_, res) {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("orderItems.product")
      .sort({ createdAt: -1 });

    res.status(200).json({ orders });
  } catch (error) {
    console.error("Error in getAllOrders controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateOrderStatus(req, res) {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!["pending", "shipped", "delivered"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    order.status = status;

    if (status === "shipped" && !order.shippedAt) {
      order.shippedAt = new Date();
    }

    if (status === "delivered" && !order.deliveredAt) {
      order.deliveredAt = new Date();
    }

    await order.save();

    res.status(200).json({ message: "Order status updated successfully", order });
  } catch (error) {
    console.error("Error in updateOrderStatus controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getAllCustomers(_, res) {
  try {
    const customers = await User.find().sort({ createdAt: -1 }); // latest user first
    res.status(200).json({ customers });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getDashboardStats(req, res) {
  try {
    const { period = "all", month, year } = req.query; // period: 'week', 'month', 'year', 'all', 'custom'
    
    // Calculate date range based on period
    let startDate = null;
    let endDate = null;
    const now = new Date();
    
    switch (period) {
      case "week":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case "custom":
        // Custom month/year selection
        if (month && year) {
          const monthNum = parseInt(month, 10) - 1; // JavaScript months are 0-indexed
          const yearNum = parseInt(year, 10);
          startDate = new Date(yearNum, monthNum, 1);
          endDate = new Date(yearNum, monthNum + 1, 0, 23, 59, 59, 999); // Last day of month
        }
        break;
      default:
        startDate = null; // all time
    }

    // Build match filter for orders
    let orderMatchFilter = {};
    if (startDate && endDate) {
      orderMatchFilter = { createdAt: { $gte: startDate, $lte: endDate } };
    } else if (startDate) {
      orderMatchFilter = { createdAt: { $gte: startDate } };
    }
    
    // Get orders count for the period
    const totalOrders = await Order.countDocuments(orderMatchFilter);

    // Get revenue for the period
    const revenueResult = await Order.aggregate([
      { $match: orderMatchFilter },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalPrice" },
        },
      },
    ]);

    const totalRevenue = revenueResult[0]?.total || 0;

    // For customers, filter by registration date if period is specified
    let customerMatchFilter = {};
    if (startDate && endDate) {
      customerMatchFilter = { createdAt: { $gte: startDate, $lte: endDate } };
    } else if (startDate) {
      customerMatchFilter = { createdAt: { $gte: startDate } };
    }
    const totalCustomers = await User.countDocuments(customerMatchFilter);
    
    // Products are not time-based, so always count all
    const totalProducts = await Product.countDocuments();

    res.status(200).json({
      totalRevenue,
      totalOrders,
      totalCustomers,
      totalProducts,
      period,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Delete images from Cloudinary
    if (product.images && product.images.length > 0) {
      const deletePromises = product.images.map((imageUrl) => {
        // Extract public_id from URL (assumes format: .../products/publicId.ext)
        const publicId = "products/" + imageUrl.split("/products/")[1]?.split(".")[0];
        if (publicId) return cloudinary.uploader.destroy(publicId);
      });
      await Promise.all(deletePromises.filter(Boolean));
    }

    await Product.findByIdAndDelete(id);
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Failed to delete product" });
  }
};

// Category Controllers
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, description, icon } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Category name is required" });
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({ name: name.trim() });
    if (existingCategory) {
      return res.status(400).json({ message: "Category already exists" });
    }

    let imageUrl = "";

    // Handle image upload if provided
    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "categories",
      });
      imageUrl = uploadResult.secure_url;
    }

    const category = await Category.create({
      name: name.trim(),
      description: description || "",
      icon: icon || "",
      image: imageUrl,
    });

    res.status(201).json(category);
  } catch (error) {
    console.error("Error creating category:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "Category already exists" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, isActive } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Check if new name conflicts with existing category
    if (name && name.trim() !== category.name) {
      const existingCategory = await Category.findOne({ name: name.trim() });
      if (existingCategory) {
        return res.status(400).json({ message: "Category name already exists" });
      }
      category.name = name.trim();
    }

    if (description !== undefined) category.description = description;
    if (icon !== undefined) category.icon = icon;
    if (isActive !== undefined) category.isActive = isActive;

    // Handle image update if new image is uploaded
    if (req.file) {
      // Delete old image from Cloudinary if exists
      if (category.image) {
        try {
          const publicId = "categories/" + category.image.split("/categories/")[1]?.split(".")[0];
          if (publicId) {
            await cloudinary.uploader.destroy(publicId);
          }
        } catch (error) {
          console.error("Error deleting old category image:", error);
        }
      }

      // Upload new image
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "categories",
      });
      category.image = uploadResult.secure_url;
    }

    await category.save();
    res.status(200).json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "Category name already exists" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Check if category is used by any products
    const productsCount = await Product.countDocuments({ category: category.name });
    if (productsCount > 0) {
      return res.status(400).json({
        message: `Cannot delete category. It is used by ${productsCount} product(s). Please update or remove those products first.`,
      });
    }

    // Delete image from Cloudinary if exists
    if (category.image) {
      try {
        const publicId = "categories/" + category.image.split("/categories/")[1]?.split(".")[0];
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (error) {
        console.error("Error deleting category image:", error);
      }
    }

    await Category.findByIdAndDelete(id);
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ message: "Failed to delete category" });
  }
};

export const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("productId", "name images")
      .populate("userId", "name email")
      .populate("orderId", "_id")
      .sort({ createdAt: -1 });

    res.status(200).json({ reviews });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

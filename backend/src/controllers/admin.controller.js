import cloudinary from "../config/cloudinary.js";
import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";
import { Category } from "../models/category.model.js";
import { Review } from "../models/review.model.js";
import { Banner } from "../models/banner.model.js";
import { createClerkClient } from "@clerk/backend";
import { ENV } from "../config/env.js";

const clerkClient = createClerkClient({ secretKey: ENV.CLERK_SECRET_KEY });

export async function createProduct(req, res) {
  try {
    const { name, description, price, category, unitType, unitOptions, showPrice } = req.body;

    if (!name || !description || !category) {
      return res.status(400).json({ message: "Name, description, and category are required" });
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
      category,
      images: imageUrls,
      unitType: unitType || "pieces",
      unitOptions: parsedUnitOptions,
      showPrice: showPrice !== undefined ? showPrice === "true" || showPrice === true : true,
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getAllProducts(req, res) {
  try {
    console.log("[Admin] GET /api/admin/products hit", { auth: !!req.auth?.userId });
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (error) {
    console.error("[Admin] getAllProducts error:", error?.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const { name, description, price, category, unitType, unitOptions, showPrice } = req.body;

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
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateOrderStatus(req, res) {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!["pending", "shipped", "delivered", "cancelled"].includes(status)) {
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
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateOrderDeliveryDate(req, res) {
  try {
    const { orderId } = req.params;
    const { deliveryDate } = req.body;

    if (!deliveryDate) {
      return res.status(400).json({ error: "Delivery date is required" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const newDeliveryDate = new Date(deliveryDate);
    if (isNaN(newDeliveryDate.getTime())) {
      return res.status(400).json({ error: "Invalid delivery date format" });
    }

    order.deliveryDate = newDeliveryDate;
    await order.save();

    res.status(200).json({ message: "Order delivery date updated successfully", order });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getAllCustomers(_, res) {
  try {
    const customers = await User.find().sort({ createdAt: -1 }); // latest user first

    // Fetch all invitations from Clerk
    let invitationsMap = new Map();
    let pendingInvitationsWithoutCustomer = [];
    try {
      const invitations = await clerkClient.invitations.getInvitationList({
        limit: 500, // Get all invitations
      });

      // Get all customer emails
      const customerEmails = new Set(customers.map((c) => c.email));

      // Create a map of email -> latest invitation status
      if (invitations.data && invitations.data.length > 0) {
        invitations.data.forEach((inv) => {
          const email = inv.emailAddress;
          // Keep the most recent invitation for each email
          if (!invitationsMap.has(email) || new Date(inv.createdAt) > new Date(invitationsMap.get(email).createdAt)) {
            invitationsMap.set(email, {
              status: inv.status, // pending, accepted, revoked
              createdAt: inv.createdAt,
            });
          }

          // Collect pending invitations that don't have a customer yet
          if (inv.status === "pending" && !customerEmails.has(email)) {
            pendingInvitationsWithoutCustomer.push({
              email: email,
              invitationId: inv.id,
              createdAt: inv.createdAt,
              publicMetadata: inv.publicMetadata,
            });
          }
        });
      }
    } catch (invError) {
      // Continue without invitation status if Clerk API fails
    }

    // Add invitation status to each customer
    const customersWithInvitations = customers.map((customer) => {
      const invitationInfo = invitationsMap.get(customer.email);
      return {
        ...customer.toObject(),
        invitationStatus: invitationInfo
          ? invitationInfo.status === "accepted"
            ? "approved"
            : invitationInfo.status === "revoked"
            ? "rejected"
            : "pending"
          : null, // null means no invitation found (user registered without invitation or invitation expired)
      };
    });

    // Add pending invitations without customers as "virtual" customers
    const pendingCustomers = pendingInvitationsWithoutCustomer.map((inv) => ({
      _id: `pending_${inv.invitationId}`,
      name: "Εκκρεμής Πρόσκληση",
      email: inv.email,
      invitationStatus: "pending",
      addresses: [],
      wishlist: [],
      createdAt: inv.createdAt,
      isPendingInvitation: true,
      invitationId: inv.invitationId,
      customerId: inv.publicMetadata?.customerId || null,
    }));

    // Combine customers and pending invitations, sort by createdAt
    const allCustomers = [...customersWithInvitations, ...pendingCustomers].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.status(200).json({ customers: allCustomers });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function deleteCustomer(req, res) {
  try {
    const { id } = req.params;

    const customer = await User.findById(id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Update all pending orders to "cancelled" status when customer is deleted
    await Order.updateMany(
      { user: id, status: "pending" },
      { status: "cancelled" }
    );

    // Delete the customer
    await User.findByIdAndDelete(id);
    res.status(200).json({ message: "Customer deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete customer" });
  }
}

export async function getDashboardStats(req, res) {
  try {
    console.log("[Admin] GET /api/admin/stats hit", { auth: !!req.auth?.userId, query: req.query });
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
    
    // Get reviews count for the period
    let reviewMatchFilter = {};
    if (startDate && endDate) {
      reviewMatchFilter = { createdAt: { $gte: startDate, $lte: endDate } };
    } else if (startDate) {
      reviewMatchFilter = { createdAt: { $gte: startDate } };
    }
    const totalReviews = await Review.countDocuments(reviewMatchFilter);

    res.status(200).json({
      totalRevenue,
      totalOrders,
      totalCustomers,
      totalProducts,
      totalReviews,
      period,
    });
  } catch (error) {
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
    res.status(500).json({ message: "Failed to delete product" });
  }
};

// Category Controllers
export const getAllCategories = async (req, res) => {
  try {
    // sort by custom order first, then by creation date as a fallback
    const categories = await Category.find().sort({ order: 1, createdAt: -1 });
    res.status(200).json(categories);
  } catch (error) {
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

    // find current max order to append new category at the end
    const lastCategory = await Category.findOne().sort({ order: -1 });
    const nextOrder = (lastCategory?.order ?? 0) + 1;

    const category = await Category.create({
      name: name.trim(),
      description: description || "",
      icon: icon || "",
      image: imageUrl,
      order: nextOrder,
    });

    res.status(201).json(category);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Category already exists" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, isActive, order } = req.body;

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
    if (order !== undefined && !Number.isNaN(Number(order))) {
      category.order = Number(order);
    }

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
      }
    }

    await Category.findByIdAndDelete(id);
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
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

export async function inviteCustomer(req, res) {
  try {
    const { email, customerId } = req.body;

    if (!email || !customerId) {
      return res.status(400).json({ error: "Email and customerId are required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Check for existing pending invitations for this email
    try {
      const existingInvitations = await clerkClient.invitations.getInvitationList({
        status: "pending",
        limit: 100,
      });

      // Find pending invitations for this email
      const pendingInvitations = existingInvitations.data?.filter(
        (inv) => inv.emailAddress === email
      );

      // Revoke all pending invitations for this email
      if (pendingInvitations && pendingInvitations.length > 0) {
        for (const pendingInv of pendingInvitations) {
          try {
            await clerkClient.invitations.revokeInvitation({
              invitationId: pendingInv.id,
            });
          } catch (revokeError) {
            // Continue with other invitations even if one fails
          }
        }
      }
    } catch (checkError) {
      // Continue with creating new invitation even if check fails
    }

    // Create invitation using Clerk
    // redirectUrl: Web sign-up page that accepts invitation token
    // After sign-up, user will be redirected to /welcome page
    const backendUrl =
      process.env.BACKEND_URL ||
      (ENV.NODE_ENV === "production"
        ? "https://riocomfortfoods-oksxz.sevalla.app"
        : `http://localhost:${ENV.PORT || 3000}`);
    const redirectUrl = `${backendUrl}/sign-up`;

    const invitation = await clerkClient.invitations.createInvitation({
      emailAddress: email,
      publicMetadata: {
        customerId: customerId,
      },
      redirectUrl: redirectUrl,
    });


    res.status(201).json({
      message: "Invitation sent successfully",
      invitation: {
        id: invitation.id,
        emailAddress: invitation.emailAddress,
        status: invitation.status,
      },
    });
  } catch (error) {

    // Handle Clerk-specific errors
    if (error.errors) {
      const clerkError = error.errors[0];
      const errorMessage =
        clerkError?.message || "Failed to create invitation";

      // Provide more helpful error message for duplicate invitations
      if (clerkError?.code === "duplicate_record") {
        return res.status(400).json({
          error:
            "Υπάρχει ήδη pending invitation για αυτό το email. Παρακαλώ δοκιμάστε ξανά σε λίγα δευτερόλεπτα ή revoke την προηγούμενη πρόσκληση από το Clerk Dashboard.",
        });
      }

      return res.status(400).json({ error: errorMessage });
    }

    res.status(500).json({ error: "Internal server error" });
  }
}

// Banner CRUD operations
export async function getAllBanners(_, res) {
  try {
    // Check if Banner model is available
    if (!Banner) {
      return res.status(500).json({ error: "Banner model not loaded" });
    }
    
    const banners = await Banner.find().sort({ order: 1, createdAt: -1 });
    res.status(200).json({ banners });
  } catch (error) {
    res.status(500).json({ 
      error: "Internal server error",
      message: error.message 
    });
  }
}

export async function createBanner(req, res) {
  try {
    const { linkUrl, isActive, order } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: "banners",
    });

    const banner = await Banner.create({
      imageUrl: uploadResult.secure_url,
      linkUrl: linkUrl || null,
      isActive: isActive !== undefined ? isActive === "true" || isActive === true : true,
      order: order ? parseInt(order) : 0,
    });

    res.status(201).json(banner);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateBanner(req, res) {
  try {
    const { id } = req.params;
    const { linkUrl, isActive, order } = req.body;

    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    // If new image is uploaded, update it
    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "banners",
      });
      banner.imageUrl = uploadResult.secure_url;
    }

    if (linkUrl !== undefined) banner.linkUrl = linkUrl || null;
    if (isActive !== undefined) banner.isActive = isActive === "true" || isActive === true;
    if (order !== undefined) banner.order = parseInt(order);

    await banner.save();
    res.status(200).json(banner);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteBanner(req, res) {
  try {
    const { id } = req.params;
    const banner = await Banner.findByIdAndDelete(id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }
    res.status(200).json({ message: "Banner deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete banner" });
  }
}

export async function updateCustomerAddress(req, res) {
  try {
    const { customerId, addressId } = req.params;
    const { storeLocation, fullName, streetAddress, city, state, zipCode, phoneNumber, isDefault } = req.body;

    const user = await User.findById(customerId);
    if (!user) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ error: "Address not found" });
    }

    // Validate storeLocation if provided
    const validStoreLocations = [
      "Θεσσαλονίκη",
      "Χαλκιδική Πρώτο Πόδι",
      "Χαλκιδική Δεύτερο Πόδι",
      "Χαλκιδική Τρίτο Πόδι",
      "Άλλο",
    ];
    if (storeLocation !== undefined && storeLocation !== null && storeLocation !== "") {
      if (!validStoreLocations.includes(storeLocation)) {
        return res.status(400).json({ error: `Invalid store location. Must be one of: ${validStoreLocations.join(", ")}` });
      }
      address.storeLocation = storeLocation;
    } else if (!address.storeLocation) {
      // If address doesn't have storeLocation and none is provided, set default
      address.storeLocation = "Άλλο";
    }

    // if this is set as default, unset all other defaults
    if (isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    if (fullName !== undefined) address.fullName = fullName;
    if (streetAddress !== undefined) address.streetAddress = streetAddress;
    if (city !== undefined) address.city = city;
    if (state !== undefined) address.state = state;
    if (zipCode !== undefined) address.zipCode = zipCode;
    if (phoneNumber !== undefined) address.phoneNumber = phoneNumber;
    address.isDefault = isDefault !== undefined ? isDefault : address.isDefault;

    // Fix any other addresses that might be missing storeLocation (for backward compatibility)
    user.addresses.forEach((addr) => {
      if (!addr.storeLocation) {
        // Set default value for old addresses without storeLocation
        addr.storeLocation = "Άλλο";
      }
    });

    await user.save();

    res.status(200).json({ message: "Address updated successfully", addresses: user.addresses });
  } catch (error) {
    console.error("Error updating customer address:", error);
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ error: errors.join(", ") });
    }
    res.status(500).json({ error: "Internal server error" });
  }
}

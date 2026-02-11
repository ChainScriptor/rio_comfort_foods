import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { Review } from "../models/review.model.js";

export async function createOrder(req, res) {
  try {
    const user = req.user;
    const { orderItems, shippingAddress, paymentResult, totalPrice, deliveryDate, comments } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ error: "No order items" });
    }

    // validate shipping address
    if (!shippingAddress) {
      return res.status(400).json({ error: "Shipping address is required" });
    }

    // Normalize and validate required shipping address fields so we can
    // return a helpful 400 instead of a generic error.
    const requiredFields = [
      "storeLocation",
      "fullName",
      "streetAddress",
      "city",
      "state",
      "zipCode",
      "phoneNumber",
    ];

    const missingFields = requiredFields.filter((field) => {
      const value = shippingAddress[field];
      return value == null || String(value).trim() === "";
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: "All shipping address fields are required",
        missingFields,
      });
    }

    // validate products exist
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ error: `Product ${item.name} not found` });
      }
    }

    // Helper function to compare shipping addresses
    const compareShippingAddresses = (addr1, addr2) => {
      return (
        addr1.streetAddress === addr2.streetAddress &&
        addr1.city === addr2.city &&
        addr1.zipCode === addr2.zipCode &&
        addr1.state === addr2.state
      );
    };

    // Calculate the delivery date for comparison
    // If after 7 AM, default to tomorrow. Otherwise, default to today.
    const now = new Date();
    const isAfter7AM = now.getHours() >= 7;
    
    let finalDeliveryDate = null;
    if (deliveryDate) {
      finalDeliveryDate = new Date(deliveryDate);
      finalDeliveryDate.setHours(0, 0, 0, 0); // Normalize to start of day for comparison
    } else {
      if (isAfter7AM) {
        // After 7 AM, default to tomorrow at noon
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(12, 0, 0, 0);
        finalDeliveryDate = tomorrow;
      } else {
        // Before 7 AM, default to today at noon
        const today = new Date();
        today.setHours(12, 0, 0, 0);
        finalDeliveryDate = today;
      }
      finalDeliveryDate.setHours(0, 0, 0, 0); // Normalize for comparison
    }

    // Check if there's an existing order from the same customer today with the SAME shipping address AND SAME delivery date
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const existingOrders = await Order.find({
      clerkId: user.clerkId,
      createdAt: {
        $gte: todayStart,
        $lte: todayEnd,
      },
      status: "pending", // Only merge with pending orders
    });

    // Helper function to compare delivery dates (normalized to start of day)
    const compareDeliveryDates = (date1, date2) => {
      if (!date1 && !date2) return true; // Both null/undefined
      if (!date1 || !date2) return false; // One is null, other is not
      const d1 = new Date(date1);
      d1.setHours(0, 0, 0, 0);
      const d2 = new Date(date2);
      d2.setHours(0, 0, 0, 0);
      return d1.getTime() === d2.getTime();
    };

    // Find order with matching shipping address AND delivery date
    const existingOrder = existingOrders.find((order) => {
      const addressMatches = compareShippingAddresses(order.shippingAddress, shippingAddress);
      const deliveryDateMatches = compareDeliveryDates(order.deliveryDate, finalDeliveryDate);
      return addressMatches && deliveryDateMatches;
    });

    let order;
    if (existingOrder) {
      // Merge new items into existing order (same address)
      // Check for duplicate products and update quantities
      const updatedOrderItems = [...existingOrder.orderItems];
      
      for (const newItem of orderItems) {
        const existingItemIndex = updatedOrderItems.findIndex(
          (item) => item.product.toString() === newItem.product.toString()
        );
        
        if (existingItemIndex >= 0) {
          // Product already exists, update quantity
          updatedOrderItems[existingItemIndex].quantity += newItem.quantity;
        } else {
          // New product, add it
          updatedOrderItems.push(newItem);
        }
      }

      // Recalculate total price
      let newTotalPrice = 0;
      for (const item of updatedOrderItems) {
        const product = await Product.findById(item.product);
        if (product && product.price) {
          newTotalPrice += product.price * item.quantity;
        }
      }

      existingOrder.orderItems = updatedOrderItems;
      existingOrder.totalPrice = newTotalPrice;
      
      // Merge comments if provided (append new comments to existing ones)
      if (comments && comments.trim()) {
        if (existingOrder.comments && existingOrder.comments.trim()) {
          // Both old and new comments exist, combine them with separator
          existingOrder.comments = `${existingOrder.comments}\n\n--- Νέα Σχόλια ---\n${comments}`;
        } else {
          // Only new comments exist
          existingOrder.comments = comments;
        }
      }
      
      await existingOrder.save();
      order = existingOrder;
    } else {
      // Use the finalDeliveryDate calculated above (already normalized)
      // But set it to noon for storage if it was default
      if (!deliveryDate) {
        if (isAfter7AM) {
          // After 7 AM, set to tomorrow at noon
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(12, 0, 0, 0);
          finalDeliveryDate = tomorrow;
        } else {
          // Before 7 AM, set to today at noon
          const today = new Date();
          today.setHours(12, 0, 0, 0);
          finalDeliveryDate = today;
        }
      } else {
        finalDeliveryDate = new Date(deliveryDate);
      }

      // Create new order (different address or no existing order)
      order = await Order.create({
        user: user._id,
        clerkId: user.clerkId,
        orderItems,
        shippingAddress,
        paymentResult: paymentResult || {
          id: `order-${Date.now()}`,
          status: "pending",
        },
        totalPrice,
        deliveryDate: finalDeliveryDate,
        comments: comments || null,
      });
    }

    res.status(201).json({ message: "Order created successfully", order });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getUserOrders(req, res) {
  try {
    const clerkId = req.user?.clerkId;
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const orders = await Order.find({ clerkId })
      .populate("orderItems.product")
      .sort({ createdAt: -1 })
      .lean();

    const orderIds = orders.map((order) => order._id);
    const reviews = await Review.find({ orderId: { $in: orderIds } });

    const ordersWithReviewStatus = orders.map((order) => {
      // Ασφαλής λίστα product IDs (διαγραμμένα προϊόντα → populate επιστρέφει null)
      const orderProductIds = (order.orderItems || [])
        .map((item) => item.product)
        .filter(Boolean)
        .map((p) => (typeof p === "object" && p._id ? p._id.toString() : String(p)));

      const orderReviews = reviews.filter(
        (review) => review.orderId.toString() === order._id.toString()
      );
      const reviewedProductIds = new Set(orderReviews.map((review) => review.productId.toString()));
      const allProductsReviewed =
        orderProductIds.length > 0 && orderProductIds.every((id) => reviewedProductIds.has(id));

      return {
        ...order,
        hasReviewed: allProductsReviewed,
      };
    });

    res.status(200).json({ orders: ordersWithReviewStatus });
  } catch (error) {
    console.error("getUserOrders error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

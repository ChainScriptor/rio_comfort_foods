import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { Review } from "../models/review.model.js";

export async function createOrder(req, res) {
  try {
    const user = req.user;
    const { orderItems, shippingAddress, paymentResult, totalPrice } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ error: "No order items" });
    }

    // validate products and stock
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ error: `Product ${item.name} not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      }
    }

    // Check if there's an existing order from the same customer today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const existingOrder = await Order.findOne({
      clerkId: user.clerkId,
      createdAt: {
        $gte: todayStart,
        $lte: todayEnd,
      },
      status: "pending", // Only merge with pending orders
    });

    let order;
    if (existingOrder) {
      // Merge new items into existing order
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
      await existingOrder.save();
      order = existingOrder;
    } else {
      // Create new order
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
      });
    }

    // update product stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    res.status(201).json({ message: "Order created successfully", order });
  } catch (error) {
    console.error("Error in createOrder controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getUserOrders(req, res) {
  try {
    const orders = await Order.find({ clerkId: req.user.clerkId })
      .populate("orderItems.product")
      .sort({ createdAt: -1 });

    // check if each order has been reviewed

    const orderIds = orders.map((order) => order._id);
    const reviews = await Review.find({ orderId: { $in: orderIds } });
    const reviewedOrderIds = new Set(reviews.map((review) => review.orderId.toString()));

    const ordersWithReviewStatus = await Promise.all(
      orders.map(async (order) => {
        return {
          ...order.toObject(),
          hasReviewed: reviewedOrderIds.has(order._id.toString()),
        };
      })
    );

    res.status(200).json({ orders: ordersWithReviewStatus });
  } catch (error) {
    console.error("Error in getUserOrders controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

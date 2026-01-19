import mongoose from "mongoose";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { Review } from "../models/review.model.js";

export async function createReview(req, res) {
  try {
    console.log("Review creation request received:", {
      productId: req.body?.productId,
      orderId: req.body?.orderId,
      rating: req.body?.rating,
      userId: req.user?._id,
    });

    const { productId, orderId, rating } = req.body;

    if (!productId || !orderId || !rating) {
      console.error("Missing required fields:", { productId, orderId, rating });
      return res.status(400).json({ error: "Product ID, Order ID, and rating are required" });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    const user = req.user;
    console.log("User found:", user._id);

    // verify order exists and is delivered
    const order = await Order.findById(orderId);
    if (!order) {
      console.error("Order not found:", orderId);
      return res.status(404).json({ error: "Order not found" });
    }
    console.log("Order found:", order._id, "Status:", order.status);

    if (order.clerkId !== user.clerkId) {
      console.error("Unauthorized: order.clerkId:", order.clerkId, "user.clerkId:", user.clerkId);
      return res.status(403).json({ error: "Not authorized to review this order" });
    }

    // Allow reviews for delivered orders or any order (removed restriction)
    // if (order.status !== "delivered") {
    //   return res.status(400).json({ error: "Can only review delivered orders" });
    // }

    // verify product is in the order
    const productInOrder = order.orderItems.find(
      (item) => item.product.toString() === productId.toString()
    );
    if (!productInOrder) {
      console.error("Product not found in order. ProductId:", productId, "Order items:", order.orderItems.map(i => i.product.toString()));
      return res.status(400).json({ error: "Product not found in this order" });
    }
    console.log("Product found in order");

    // Check if review already exists for this order and product combination
    const existingReview = await Review.findOne({ 
      orderId: orderId,
      productId: productId,
      userId: user._id 
    });
    
    if (existingReview) {
      console.log("Review already exists:", existingReview._id);
      return res.status(400).json({ error: "You have already reviewed this product for this order" });
    }
    console.log("No existing review found, creating new review");

    // Create new review
    const review = await Review.create({
      productId,
      userId: user._id,
      orderId,
      rating,
    });
    console.log("Review created successfully:", review._id);

    // update the product rating with atomic aggregation
    const reviews = await Review.find({ productId });
    const totalRating = reviews.reduce((sum, rev) => sum + rev.rating, 0);
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        averageRating: totalRating / reviews.length,
        totalReviews: reviews.length,
      },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      console.error("Product not found after review creation, deleting review");
      await Review.findByIdAndDelete(review._id);
      return res.status(404).json({ error: "Product not found" });
    }
    console.log("Product rating updated successfully");

    console.log("Sending success response");
    res.status(201).json({ message: "Review submitted successfully", review });
  } catch (error) {
    console.error("Error creating review:", error);
    console.error("Error stack:", error.stack);
    // Check if response was already sent
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error", details: error.message });
    } else {
      console.error("Response already sent, cannot send error response");
    }
  }
}

export async function deleteReview(req, res) {
  try {
    const { reviewId } = req.params;

    const user = req.user;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    if (review.userId.toString() !== user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to delete this review" });
    }

    const productId = review.productId;
    await Review.findByIdAndDelete(reviewId);

    const reviews = await Review.find({ productId });
    const totalRating = reviews.reduce((sum, rev) => sum + rev.rating, 0);
    await Product.findByIdAndUpdate(productId, {
      averageRating: reviews.length > 0 ? totalRating / reviews.length : 0,
      totalReviews: reviews.length,
    });

    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

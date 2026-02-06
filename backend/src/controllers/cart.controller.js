import mongoose from "mongoose";
import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";

export async function getCart(req, res) {
  try {
    let cart = await Cart.findOne({ clerkId: req.user.clerkId }).populate("items.product");

    if (!cart) {
      const user = req.user;

      cart = await Cart.create({
        user: user._id,
        clerkId: user.clerkId,
        items: [],
      });
    }

    res.status(200).json({ cart });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function addToCart(req, res) {
  try {
    const { productId, quantity = 1, selectedUnit } = req.body;

    // validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Validate unit selection if product has unit options
    if (product.unitOptions && product.unitOptions.length > 0 && !selectedUnit) {
      return res.status(400).json({ error: "Unit selection is required for this product" });
    }

    let cart = await Cart.findOne({ clerkId: req.user.clerkId });

    if (!cart) {
      const user = req.user;

      cart = await Cart.create({
        user: user._id,
        clerkId: user.clerkId,
        items: [],
      });
    }

    // Normalize selectedUnit for comparison (treat null, undefined, and empty string as equivalent)
    let normalizedSelectedUnit = selectedUnit ? String(selectedUnit).trim() : null;
    if (normalizedSelectedUnit === "") {
      normalizedSelectedUnit = null;
    }

    // Convert productId to ObjectId for proper comparison
    const productIdObj = new mongoose.Types.ObjectId(productId);

    // check if item already in the cart with same unit
    const existingItem = cart.items.find(
      (item) => {
        // Compare product IDs - handle both ObjectId and string cases
        let productMatches = false;
        const itemProductIdStr = item.product?.toString ? item.product.toString() : String(item.product);
        const requestProductIdStr = productIdObj.toString();

        if (item.product instanceof mongoose.Types.ObjectId) {
          productMatches = item.product.equals(productIdObj);
        } else {
          productMatches = itemProductIdStr === requestProductIdStr;
        }

        // Normalize item's selectedUnit
        const itemUnit = item.selectedUnit ? String(item.selectedUnit).trim() : null;
        const normalizedItemUnit = itemUnit === "" ? null : itemUnit;

        // Compare both productId and selectedUnit
        const unitMatches = normalizedItemUnit === normalizedSelectedUnit;

        return productMatches && unitMatches;
      }
    );

    if (existingItem) {
      // increment quantity by the requested quantity (not just 1)
      const newQuantity = existingItem.quantity + quantity;
      existingItem.quantity = newQuantity;
    } else {
      // add new item
      cart.items.push({
        product: productId,
        quantity,
        selectedUnit: normalizedSelectedUnit,
      });
    }

    await cart.save();

    res.status(200).json({ message: "Item added to cart", cart });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateCartItem(req, res) {
  try {
    const { productId } = req.params;
    const { quantity, selectedUnit } = req.body;

    if (quantity < 1) {
      return res.status(400).json({ error: "Quantity must be at least 1" });
    }

    const cart = await Cart.findOne({ clerkId: req.user.clerkId });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    // Normalize selectedUnit
    let normalizedSelectedUnit = selectedUnit ? String(selectedUnit).trim() : null;
    if (normalizedSelectedUnit === "") {
      normalizedSelectedUnit = null;
    }

    // Find the item based on productId AND selectedUnit
    const itemIndex = cart.items.findIndex((item) => {
      const productMatches = item.product.toString() === productId;
      const itemUnit = item.selectedUnit ? String(item.selectedUnit).trim() : null;
      const normalizedItemUnit = itemUnit === "" ? null : itemUnit;
      const unitMatches = normalizedItemUnit === normalizedSelectedUnit;

      return productMatches && unitMatches;
    });

    if (itemIndex === -1) {
      return res.status(404).json({ error: "Item not found in cart" });
    }

    // check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    res.status(200).json({ message: "Cart updated successfully", cart });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function removeFromCart(req, res) {
  try {
    const { productId } = req.params;
    // Support both body and query (some clients/proxies strip DELETE body)
    const selectedUnit = req.body?.selectedUnit ?? req.query?.selectedUnit;

    const cart = await Cart.findOne({ clerkId: req.user.clerkId });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    // Normalize selectedUnit
    let normalizedSelectedUnit = selectedUnit ? String(selectedUnit).trim() : null;
    if (normalizedSelectedUnit === "") {
      normalizedSelectedUnit = null;
    }

    // Remove only the item that matches both productId AND selectedUnit
    cart.items = cart.items.filter((item) => {
      const productMatches = item.product.toString() === productId;
      const itemUnit = item.selectedUnit ? String(item.selectedUnit).trim() : null;
      const normalizedItemUnit = itemUnit === "" ? null : itemUnit;
      const unitMatches = normalizedItemUnit === normalizedSelectedUnit;

      // Keep the item if it does NOT match both
      return !(productMatches && unitMatches);
    });

    await cart.save();

    res.status(200).json({ message: "Item removed from cart", cart });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ clerkId: req.user.clerkId });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({ message: "Cart cleared", cart });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

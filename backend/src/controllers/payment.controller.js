import Stripe from "stripe";
import { ENV } from "../config/env.js";
import { User } from "../models/user.model.js";
import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";
import { Cart } from "../models/cart.model.js";

const stripe = new Stripe(ENV.STRIPE_SECRET_KEY);

export async function createPaymentIntent(req, res) {
  try {
    const { cartItems, shippingAddress } = req.body;
    const user = req.user;

    // Validate cart items
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Calculate total from server-side (don't trust client - ever.)
    let subtotal = 0;
    const validatedItems = [];

    for (const item of cartItems) {
      const product = await Product.findById(item.product._id);
      if (!product) {
        return res.status(404).json({ error: `Product ${item.product.name} not found` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      }

      subtotal += product.price * item.quantity;
      validatedItems.push({
        product: product._id.toString(),
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.images[0],
      });
    }

    const shipping = 10.0; // $10
    const tax = subtotal * 0.08; // 8%
    const total = subtotal + shipping + tax;

    if (total <= 0) {
      return res.status(400).json({ error: "Invalid order total" });
    }

    // find or create the stripe customer
    let customer;
    if (user.stripeCustomerId) {
      // find the customer
      customer = await stripe.customers.retrieve(user.stripeCustomerId);
    } else {
      // create the customer
      customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          clerkId: user.clerkId,
          userId: user._id.toString(),
        },
      });

      // add the stripe customer ID to the  user object in the DB
      await User.findByIdAndUpdate(user._id, { stripeCustomerId: customer.id });
    }

    // create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // convert to cents
      currency: "usd",
      customer: customer.id,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        clerkId: user.clerkId,
        userId: user._id.toString(),
        orderItems: JSON.stringify(validatedItems),
        shippingAddress: JSON.stringify(shippingAddress),
        totalPrice: total.toFixed(2),
      },
      // in the webhooks section we will use this metadata
    });

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({ error: "Failed to create payment intent" });
  }
}

export async function handleWebhook(req, res) {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, ENV.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;

    console.log("Payment succeeded:", paymentIntent.id);

    try {
      const { userId, clerkId, orderItems, shippingAddress, totalPrice } = paymentIntent.metadata;

      // Check if order already exists (prevent duplicates)
      const existingOrderByPayment = await Order.findOne({ "paymentResult.id": paymentIntent.id });
      if (existingOrderByPayment) {
        console.log("Order already exists for payment:", paymentIntent.id);
        return res.json({ received: true });
      }

      const parsedOrderItems = JSON.parse(orderItems);
      const parsedShippingAddress = JSON.parse(shippingAddress);

      // Check if there's an existing order from the same customer today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const existingOrder = await Order.findOne({
        clerkId,
        createdAt: {
          $gte: todayStart,
          $lte: todayEnd,
        },
        status: "pending", // Only merge with pending orders
      });

      let order;
      if (existingOrder) {
        // Merge new items into existing order
        const updatedOrderItems = [...existingOrder.orderItems];
        
        for (const newItem of parsedOrderItems) {
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
        existingOrder.paymentResult = {
          id: paymentIntent.id,
          status: "succeeded",
        };
        await existingOrder.save();
        order = existingOrder;
      } else {
        // Create new order
        order = await Order.create({
          user: userId,
          clerkId,
          orderItems: parsedOrderItems,
          shippingAddress: parsedShippingAddress,
          paymentResult: {
            id: paymentIntent.id,
            status: "succeeded",
          },
          totalPrice: parseFloat(totalPrice),
        });
      }

      // update product stock
      for (const item of parsedOrderItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity },
        });
      }

      console.log("Order created/updated successfully:", order._id);
    } catch (error) {
      console.error("Error creating order from webhook:", error);
    }
  }

  res.json({ received: true });
}

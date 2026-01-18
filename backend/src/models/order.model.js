import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  image: {
    type: String,
    required: true,
  },
  selectedUnit: {
    type: String,
    default: null,
  },
});

const shippingAddressSchema = new mongoose.Schema({
  storeLocation: {
    type: String,
    enum: ["Θεσσαλονίκη", "Χαλκιδική Πρώτο Πόδι", "Χαλκιδική Δεύτερο Πόδι", "Χαλκιδική Τρίτο Πόδι", "Άλλο"],
    required: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  streetAddress: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  zipCode: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    clerkId: {
      type: String,
      required: true,
    },
    orderItems: [orderItemSchema],
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    paymentResult: {
      id: String,
      status: String,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    deliveryDate: {
      type: Date,
      default: null, // Will be set to next day if not provided
    },
    comments: {
      type: String,
      default: null,
    },
    deliveredAt: {
      type: Date,
    },
    shippedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);

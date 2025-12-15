import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: false,
      min: 0,
    },
    showPrice: {
      type: Boolean,
      default: true,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    category: {
      type: String,
      required: true,
    },
    images: [
      {
        type: String,
        required: true,
      },
    ],
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    unitType: {
      type: String,
      enum: ["pieces", "kg", "liters"],
      default: "pieces",
    },
    unitOptions: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);

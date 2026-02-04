import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      required: true,
    },
    linkUrl: {
      type: String,
      default: null, // Optional link when banner is clicked
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0, // For ordering multiple banners
    },
  },
  { timestamps: true }
);

export const Banner = mongoose.model("Banner", bannerSchema);

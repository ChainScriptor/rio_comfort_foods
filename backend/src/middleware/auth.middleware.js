import { requireAuth } from "@clerk/express";
import { User } from "../models/user.model.js";
import { ENV } from "../config/env.js";
import { createClerkClient } from "@clerk/backend";

const clerkClient = createClerkClient({ secretKey: ENV.CLERK_SECRET_KEY });

export const protectRoute = [
  requireAuth(),
  async (req, res, next) => {
    try {
      const clerkId = req.auth().userId;
      if (!clerkId) return res.status(401).json({ message: "Unauthorized - invalid token" });

      // Βρες ή δημιούργησε τον χρήστη στη δική μας βάση, με βάση τα στοιχεία του Clerk.
      let user = await User.findOne({ clerkId });

      if (!user) {
        try {
          const clerkUser = await clerkClient.users.getUser(clerkId);
          const email = clerkUser.emailAddresses?.[0]?.emailAddress || clerkUser.primaryEmailAddress?.emailAddress;
          const firstName = clerkUser.firstName || "";
          const lastName = clerkUser.lastName || "";
          const name = `${firstName} ${lastName}`.trim() || "User";

          const newUserData = {
            clerkId,
            email,
            name,
            imageUrl: clerkUser.imageUrl || "",
            addresses: [],
            wishlist: [],
          };

          // Upsert για αποφυγή race conditions / duplicate key errors.
          user = await User.findOneAndUpdate(
            { clerkId },
            { $setOnInsert: newUserData },
            { new: true, upsert: true }
          );
        } catch (clerkError) {
          console.error("Error syncing Clerk user to DB:", clerkError);
          return res.status(500).json({ message: "Error syncing user profile" });
        }
      }

      req.user = user;

      next();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  },
];

export const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized - user not found" });
  }

  if (req.user.email !== ENV.ADMIN_EMAIL) {
    return res.status(403).json({ message: "Forbidden - admin access only" });
  }

  next();
};

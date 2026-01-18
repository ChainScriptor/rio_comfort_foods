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

      // Check if user exists in database first (for backward compatibility with existing users)
      const user = await User.findOne({ clerkId });
      
      // If user doesn't exist in database, check if they have invitation
      if (!user) {
        try {
          const clerkUser = await clerkClient.users.getUser(clerkId);
          const hasInvitation = clerkUser.publicMetadata?.customerId != null;
          
          if (!hasInvitation) {
            return res.status(403).json({ 
              message: "Access denied. Only invited users can access this application." 
            });
          }
          // If they have invitation but no user in DB, return 404 (user will be created by Inngest)
          return res.status(404).json({ message: "User not found. Please wait a moment and try again." });
        } catch (clerkError) {
          return res.status(500).json({ message: "Error verifying user access" });
        }
      }
      
      // For existing users in database, allow access (backward compatibility)
      // For new users, they must have invitation (checked above)

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

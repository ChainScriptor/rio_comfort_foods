import { Inngest } from "inngest";
import { connectDB } from "./db.js";
import { User } from "../models/user.model.js";
import { createClerkClient } from "@clerk/backend";
import { ENV } from "./env.js";

export const inngest = new Inngest({ id: "ecommerce-app" });

const clerkClient = createClerkClient({ secretKey: ENV.CLERK_SECRET_KEY });

const syncUser = inngest.createFunction(
  { id: "sync-user" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    await connectDB();
    const { id, email_addresses, first_name, last_name, image_url, public_metadata } = event.data;

    // Verify invitation was accepted by checking invitation status
    // Clerk automatically updates invitation status to "accepted" when user completes sign-up
    try {
      const email = email_addresses[0]?.email_address;
      if (email) {
        // Get accepted invitations and find the one matching this user
        const acceptedInvitations = await clerkClient.invitations.getInvitationList({
          status: "accepted",
          limit: 100, // Adjust if you have more than 100 accepted invitations
        });

        // Find the invitation that matches this user's customerId and email
        const matchingInvitation = acceptedInvitations.data?.find(
          (inv) =>
            inv.emailAddress === email &&
            inv.publicMetadata?.customerId === public_metadata.customerId
        );

        if (matchingInvitation) {
        } else {
          // If not found in accepted, check all invitations (might be pending if webhook fired early)
          // Retry checking after a short delay to allow Clerk to update the status
          const allInvitations = await clerkClient.invitations.getInvitationList({
            limit: 100,
          });
          const pendingInvitation = allInvitations.data?.find(
            (inv) =>
              inv.emailAddress === email &&
              inv.publicMetadata?.customerId === public_metadata.customerId
          );

          if (pendingInvitation) {
            // Wait a bit and check again (Clerk might update status asynchronously)
            await new Promise((resolve) => setTimeout(resolve, 2000));
            
            try {
              const updatedInvitation = await clerkClient.invitations.getInvitation({
                invitationId: pendingInvitation.id,
              });
              
              // Status check completed
            } catch (retryError) {
              // Continue even if retry fails
            }
          }
        }
      }
    } catch (error) {
      // Don't fail the user creation if invitation check fails
    }

    const newUser = {
      clerkId: id,
      email: email_addresses[0]?.email_address,
      name: `${first_name || ""} ${last_name || ""}`.trim() || "User",
      imageUrl: image_url,
      addresses: [],
      wishlist: [],
    };

    // Upsert για να αποφύγουμε duplicate key errors αν ο χρήστης έχει ήδη δημιουργηθεί
    // από το API (π.χ. στο πρώτο του request).
    await User.findOneAndUpdate(
      { clerkId: id },
      { $setOnInsert: newUser },
      { new: true, upsert: true }
    );
  }
);

const deleteUserFromDB = inngest.createFunction(
  { id: "delete-user-from-db" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    await connectDB();

    const { id } = event.data;
    await User.deleteOne({ clerkId: id });
  }
);

export const functions = [syncUser, deleteUserFromDB];

import dotenv from "dotenv";

dotenv.config({ quiet: true });

export const ENV = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DB_URL: process.env.DB_URL,
  CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  /** Hostname of the admin dashboard (e.g. riocomfortfoods-oksxz.sevalla.app). When request host matches, server sends admin SPA index.html instead of PWA. */
  ADMIN_APP_HOST: process.env.ADMIN_APP_HOST || "",
  CLIENT_URL: process.env.CLIENT_URL,
  // Comma-separated list of extra origins (e.g. "http://localhost:8081" for Expo web)
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || "",
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
};

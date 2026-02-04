import express from "express";
import path from "path";
import { clerkMiddleware } from "@clerk/express";
import { serve } from "inngest/express";
import cors from "cors";

import { functions, inngest } from "./config/inngest.js";

import { ENV } from "./config/env.js";
import { connectDB } from "./config/db.js";

import adminRoutes from "./routes/admin.route.js";
import userRoutes from "./routes/user.route.js";
import orderRoutes from "./routes/order.route.js";
import reviewRoutes from "./routes/review.route.js";
import productRoutes from "./routes/product.route.js";
import cartRoutes from "./routes/cart.route.js";
import inviteRoutes from "./routes/invite.route.js";
import authRoutes from "./routes/auth.route.js";

const app = express();

const __dirname = path.resolve();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`, {
    body: req.body,
    headers: req.headers.authorization ? { authorization: "Bearer ***" } : {},
  });
  
  // Log response when it's sent
  const originalSend = res.send;
  res.send = function(data) {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Response sent:`, {
      statusCode: res.statusCode,
      dataLength: data ? data.length : 0,
    });
    return originalSend.call(this, data);
  };
  
  next();
});

app.use(clerkMiddleware()); // adds auth object under the req => req.auth

// CORS: permissive so Expo (localhost:8081) and mobile (no origin) work; log origin for debugging
const corsOptions = {
  origin: (origin, callback) => {
    if (origin) {
      console.log("[CORS] Request from origin:", origin);
    } else {
      console.log("[CORS] Request with no origin (e.g. mobile app, Postman)");
    }
    callback(null, true);
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
};

app.use(cors(corsOptions));

// Serve static files from admin/public (for logo, etc.)
app.use(express.static(path.join(__dirname, "../admin/public")));

app.use("/api/inngest", serve({ client: inngest, functions }));

app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/invite", inviteRoutes);
app.use("/", authRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "Success" });
});

// make our app ready for deployment
if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../admin/dist")));

  app.get("/{*any}", (req, res) => {
    res.sendFile(path.join(__dirname, "../admin", "dist", "index.html"));
  });
}

const startServer = async () => {
  await connectDB();
  app.listen(ENV.PORT, () => {
  });
};

startServer();

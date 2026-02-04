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

// 1. Debugging Middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use(clerkMiddleware()); 

// 2. Πιο "χαλαρή" ρύθμιση CORS για να σταματήσουν τα errors
const corsOptions = {
  origin: function (origin, callback) {
    // Εμφανίζουμε το origin στα logs του Sevalla για να δούμε τι φταίει
    if (origin) {
      console.log("CORS Request from:", origin);
    } else {
      console.log("CORS Request from: [No Origin / Mobile App]");
    }

    // ΕΠΙΤΡΕΠΟΥΜΕ ΤΑ ΠΑΝΤΑ προσωρινά για να δουλέψει η εφαρμογή
    // Μπορείς να το κλείσεις αφού δεις ποιο URL εμφανίζεται στα logs
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200 // Σημαντικό για παλιούς browsers και OPTIONS requests
};

app.use(cors(corsOptions));

// 3. Routes
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
  res.status(200).json({ message: "OK" });
});

if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../admin/dist")));
  app.get("/{*any}", (req, res) => {
    res.sendFile(path.join(__dirname, "../admin", "dist", "index.html"));
  });
}

const startServer = async () => {
  try {
    await connectDB();
    app.listen(ENV.PORT || 8080, () => {
      console.log(`Server running on port ${ENV.PORT || 8080}`);
    });
  } catch (error) {
    console.error("Startup error:", error);
  }
};

startServer();
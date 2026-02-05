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

// CORS: credentials + headers for Admin (Authorization, cookies)
const allowedOrigins = [
  "https://riocomfort-app.sevalla.app",
  "https://riocomfortfoodsapi-yelm3.sevalla.app",
  "https://riocomfortfoods-oksxz.sevalla.app",
  ...(ENV.ALLOWED_ORIGINS ? ENV.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean) : []),
];
const corsOptions = {
  origin: (origin, callback) => {
    if (origin) console.log("[CORS] Request from origin:", origin);
    else console.log("[CORS] Request with no origin (same-origin or mobile/Postman)");
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

// Production: μόνο redirect /dashboard → /admin/dashboard (το / θα σερβίρει PWA)
if (ENV.NODE_ENV === "production") {
  app.get("/dashboard", (req, res) => res.redirect("/admin/dashboard"));
}
app.use("/", authRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "Success" });
});

// Production: Admin + PWA static, μετά master router (API / admin / PWA)
if (ENV.NODE_ENV === "production") {
  const adminDistPath = path.resolve(process.cwd(), "../admin/dist");
  const pwaDistPath = path.resolve(process.cwd(), "../mobile/dist");

  const staticFileExtensions = [".js", ".css", ".ttf", ".woff", ".woff2", ".otf", ".eot", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp", ".json", ".map", ".webmanifest"];
  const isStaticFile = (urlPath) => {
    const lower = urlPath.toLowerCase().split("?")[0];
    return staticFileExtensions.some((ext) => lower.endsWith(ext));
  };

  app.use("/admin", express.static(adminDistPath));

  app.use(
    express.static(pwaDistPath, {
      setHeaders: (res, filePath) => {
        const ext = path.extname(filePath).toLowerCase();
        const fontTypes = { ".ttf": "font/ttf", ".woff": "font/woff", ".woff2": "font/woff2", ".otf": "font/otf", ".eot": "application/vnd.ms-fontobject" };
        if (fontTypes[ext]) res.setHeader("Content-Type", fontTypes[ext]);
      },
    })
  );

  // Master router: αν το request αφορά αρχείο (τελεία στο path: .js, .css, .ttf, .webmanifest κ.λπ.) → next() (static/404), όχι index.html
  app.get(/.*/, (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    if (isStaticFile(req.path)) return next();
    if (req.path.startsWith("/admin")) {
      return res.sendFile(path.join(adminDistPath, "index.html"));
    }
    res.sendFile(path.join(pwaDistPath, "index.html"));
  });
}

const startServer = async () => {
  await connectDB();
  app.listen(ENV.PORT, () => {
  });
};

startServer();

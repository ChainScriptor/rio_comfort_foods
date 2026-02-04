import cloudinary from "../src/config/cloudinary.js";
import { ENV } from "../src/config/env.js";
import { connectDB } from "../src/config/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function uploadLogo() {
  try {
    await connectDB();
    
    // Path to the logo file (adjust if needed)
    const logoPath = path.join(__dirname, "../admin/public/comfort1.svg");
    
    if (!fs.existsSync(logoPath)) {
      console.error("Logo file not found at:", logoPath);
      process.exit(1);
    }

    console.log("Uploading logo to Cloudinary...");
    
    const result = await cloudinary.uploader.upload(logoPath, {
      folder: "logos",
      resource_type: "image",
      public_id: "comfort1-logo",
    });

    console.log("\n✅ Logo uploaded successfully!");
    console.log("📎 URL:", result.secure_url);
    console.log("\n💡 Use this URL in your Clerk email template:");
    console.log(`   <img src="${result.secure_url}" alt="Rio Comfort Foods" style="max-width: 200px;" />`);
    
    process.exit(0);
  } catch (error) {
    console.error("Error uploading logo:", error);
    process.exit(1);
  }
}

uploadLogo();

/**
 * After `expo export --platform web`, copies PWA icons to dist/assets/
 * so that /assets/icon.png and /assets/favicon.png are available (e.g. for
 * apple-touch-icon and favicon on iPhone).
 */
const fs = require("fs");
const path = require("path");

const mobileRoot = path.resolve(__dirname, "..");
const distAssets = path.join(mobileRoot, "dist", "assets");
const sourceIcon = path.join(mobileRoot, "assets", "icon.png");
const sourceFavicon = path.join(mobileRoot, "assets", "favicon.png");

function main() {
  if (!fs.existsSync(path.join(mobileRoot, "dist"))) {
    console.warn("copy-pwa-icons: dist not found; run export:web first.");
    process.exit(0);
    return;
  }
  fs.mkdirSync(distAssets, { recursive: true });
  let copied = 0;
  if (fs.existsSync(sourceIcon)) {
    fs.copyFileSync(sourceIcon, path.join(distAssets, "icon.png"));
    copied++;
  } else {
    console.warn("copy-pwa-icons: assets/icon.png not found");
  }
  if (fs.existsSync(sourceFavicon)) {
    fs.copyFileSync(sourceFavicon, path.join(distAssets, "favicon.png"));
    copied++;
  } else {
    console.warn("copy-pwa-icons: assets/favicon.png not found");
  }
  console.log("copy-pwa-icons: copied", copied, "icon(s) to dist/assets/");
}

main();

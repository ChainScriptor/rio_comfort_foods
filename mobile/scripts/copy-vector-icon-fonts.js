/**
 * Copies @expo/vector-icons TTF fonts into dist after `expo export --platform web`.
 * The web bundle references hashed font paths (e.g. Ionicons.b4eb097d....ttf) but
 * Expo does not copy these files to dist; this script copies them so the PWA can load the icons.
 */
const fs = require("fs");
const path = require("path");

const mobileRoot = path.resolve(__dirname, "..");
const distRoot = path.join(mobileRoot, "dist");
const bundleDir = path.join(distRoot, "_expo", "static", "js", "web");
const assetsFontsDir = path.join(
  distRoot,
  "assets",
  "node_modules",
  "@expo",
  "vector-icons",
  "build",
  "vendor",
  "react-native-vector-icons",
  "Fonts"
);
const sourceFontsDir = path.join(
  mobileRoot,
  "node_modules",
  "@expo",
  "vector-icons",
  "build",
  "vendor",
  "react-native-vector-icons",
  "Fonts"
);

// Match paths like .../Fonts/Ionicons.b4eb097d35f44ed943676fd56f6bdc51.ttf
const fontPathRe = /Fonts\/([^.]+)\.([a-f0-9]+)\.ttf/g;

function main() {
  if (!fs.existsSync(bundleDir)) {
    console.warn(
      "copy-vector-icon-fonts: dist/_expo/static/js/web not found; run 'npx expo export --platform web' first."
    );
    process.exit(0);
    return;
  }

  const entryFiles = fs.readdirSync(bundleDir).filter((f) => f.startsWith("entry-") && f.endsWith(".js"));
  if (entryFiles.length === 0) {
    console.warn("copy-vector-icon-fonts: no entry-*.js bundle found.");
    process.exit(0);
    return;
  }

  const bundlePath = path.join(bundleDir, entryFiles[0]);
  const bundleContent = fs.readFileSync(bundlePath, "utf8");
  const matches = [...bundleContent.matchAll(fontPathRe)];
  const byBase = new Map();
  for (const m of matches) {
    const base = m[1];
    const hash = m[2];
    if (!byBase.has(base)) byBase.set(base, hash);
  }

  if (byBase.size === 0) {
    console.warn("copy-vector-icon-fonts: no hashed font paths found in bundle.");
    process.exit(0);
    return;
  }

  if (!fs.existsSync(sourceFontsDir)) {
    console.error("copy-vector-icon-fonts: source fonts dir not found:", sourceFontsDir);
    process.exit(1);
  }

  fs.mkdirSync(assetsFontsDir, { recursive: true });
  let copied = 0;
  for (const [base, hash] of byBase) {
    const src = path.join(sourceFontsDir, `${base}.ttf`);
    const dest = path.join(assetsFontsDir, `${base}.${hash}.ttf`);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      copied++;
    } else {
      console.warn("copy-vector-icon-fonts: source font not found:", src);
    }
  }
  console.log("copy-vector-icon-fonts: copied", copied, "font(s) to dist.");
}

main();

const { withNativeWind } = require("nativewind/metro");
const { getSentryExpoConfig } = require("@sentry/react-native/metro");

// Base Metro config (Expo 54, CommonJS)
const config = getSentryExpoConfig(__dirname);

// Optional SVG support via react-native-svg-transformer (as source, not asset)
try {
  const { transformer, resolver } = config;
  const svgTransformerPath = require.resolve("react-native-svg-transformer");

  config.transformer = {
    ...transformer,
    babelTransformerPath: svgTransformerPath,
  };
  config.resolver = {
    ...resolver,
    assetExts: resolver.assetExts.filter((ext) => ext !== "svg"),
    sourceExts: [...resolver.sourceExts, "svg"],
  };
} catch (error) {
  // If react-native-svg-transformer is not installed, keep default transformer/resolver
  console.warn(
    "[metro.config] react-native-svg-transformer not found or failed to configure; using default Metro config."
  );
}

module.exports = withNativeWind(config, { input: "./global.css" });
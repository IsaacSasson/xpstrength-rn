// metro.config.js
// Metro config: Expo + NativeWind + SVG transformer
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// --- SVG via react-native-svg-transformer ---
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer"),
};

config.resolver = {
  ...config.resolver,
  // Treat .svg as source, not asset
  assetExts: config.resolver.assetExts.filter((ext) => ext !== "svg"),
  // Ensure "svg" is present exactly once
  sourceExts: Array.from(new Set([...(config.resolver.sourceExts || []), "svg"])),
};

// Keep NativeWind
module.exports = withNativeWind(config, {
  input: "./global.css",
});

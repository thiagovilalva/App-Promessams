const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, {
  input: "./global.css",
  // Keep CSS virtual during production export so Metro does not hash a
  // transient node_modules cache file that can disappear in Cloud Build.
  forceWriteFileSystem: false,
});

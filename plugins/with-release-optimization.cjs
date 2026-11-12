const { withGradleProperties } = require("expo/config-plugins");

/**
 * Keeps the release optimization switches explicit in the generated Android
 * project. Expo's build-properties plugin writes the same values, but this
 * guard makes the intent unambiguous for EAS/prebuild regeneration.
 */
module.exports = function withReleaseOptimization(config) {
  return withGradleProperties(config, (config) => {
    const required = new Map([
      ["android.enableMinifyInReleaseBuilds", "true"],
      ["android.enableShrinkResourcesInReleaseBuilds", "true"],
      ["android.enablePngCrunchInReleaseBuilds", "true"],
    ]);

    const properties = config.modResults || [];
    for (const [key, value] of required) {
      const existing = properties.find((property) => property.key === key);
      if (existing) existing.value = value;
      else properties.push({ type: "property", key, value });
    }
    config.modResults = properties;
    return config;
  });
};

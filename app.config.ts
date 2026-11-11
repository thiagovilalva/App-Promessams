import "./scripts/load-env.js";
import type { ExpoConfig } from "expo/config";
const OAUTH_APP_SCHEME = "manuspromessams";

const rawBundleId = "promessams";
const bundleId = rawBundleId.replace(/[-_]/g, ".").replace(/[^a-zA-Z0-9.]/g, "").replace(/\.+/g, ".").replace(/^\.+|\.+$/g, "").toLowerCase().split(".").map((segment) => /^[a-zA-Z]/.test(segment) ? segment : `x${segment}`).join(".") || "space.manus.app";
const scheme = "promessams";

const config: ExpoConfig = {
  name: "PromessaMS",
  slug: "promessams",
  owner: "promessamsorg",
  version: "1.0.0",
  icon: "./assets/images/icon.png",
  scheme: [scheme, OAUTH_APP_SCHEME],
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: { supportsTablet: true, bundleIdentifier: `br.convencaosulmatogrossense.${bundleId}`, infoPlist: { ITSAppUsesNonExemptEncryption: false, UIBackgroundModes: ["audio"] } },
  android: { adaptiveIcon: { backgroundColor: "#E9F7F0", foregroundImage: "./assets/images/android-icon-foreground.png", backgroundImage: "./assets/images/android-icon-background.png", monochromeImage: "./assets/images/android-icon-monochrome.png" }, softwareKeyboardLayoutMode: "resize", predictiveBackGestureEnabled: false, versionCode: 23, package: `br.convencaosulmatogrossense.${bundleId}`, permissions: ["POST_NOTIFICATIONS", "FOREGROUND_SERVICE", "FOREGROUND_SERVICE_MEDIA_PLAYBACK"], blockedPermissions: ["android.permission.RECORD_AUDIO", "android.permission.FOREGROUND_SERVICE_MICROPHONE"], intentFilters: [{ action: "VIEW", autoVerify: true, data: [{ scheme, host: "*" }], category: ["BROWSABLE", "DEFAULT"] }, { action: "VIEW", data: [{ scheme: OAUTH_APP_SCHEME }], category: ["BROWSABLE", "DEFAULT"] }] },
  web: { bundler: "metro", output: "static", favicon: "./assets/images/favicon.png" },
  updates: { url: "https://u.expo.dev/152979a8-eeb4-4735-b069-c50c89b66b32", enabled: true, checkAutomatically: "ON_LOAD", fallbackToCacheTimeout: 3000 },
  runtimeVersion: { policy: "appVersion" },
  plugins: ["expo-router", ["expo-audio", { microphonePermission: false, recordAudioAndroid: false, enableBackgroundRecording: false }], "./plugins/with-playback-only.cjs", "expo-asset", "expo-font", "expo-web-browser", ["expo-splash-screen", { image: "./assets/images/splash-icon.png", imageWidth: 200, resizeMode: "contain", backgroundColor: "#FCFBF8", dark: { backgroundColor: "#151A17" } }], ["expo-build-properties", { android: { buildArchs: ["armeabi-v7a", "arm64-v8a"], minSdkVersion: 24, enableMinifyInReleaseBuilds: true, enableShrinkResourcesInReleaseBuilds: true } }]],
  extra: {
    privacyPolicyUrl: "https://sementesapp-8jp8nwu7.manus.space/politica-privacidade",
    eas: {
      projectId: "152979a8-eeb4-4735-b069-c50c89b66b32",
    },
  },
  experiments: { typedRoutes: true, reactCompiler: true },
};

export default config;

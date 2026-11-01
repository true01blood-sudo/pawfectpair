/**
 * expo-image-picker bundles its own AndroidManifest.xml that hardcodes
 * READ_EXTERNAL_STORAGE / WRITE_EXTERNAL_STORAGE (merged into the app's
 * final manifest regardless of app.json). The library's own config plugin
 * only maps `photosPermission` to iOS's NSPhotoLibraryUsageDescription —
 * it does nothing on Android. launchImageLibraryAsync() already uses the
 * Android Photo Picker without needing these, so we force the Android
 * Gradle manifest merger to drop them via tools:node="remove".
 */
const { withAndroidManifest } = require("expo/config-plugins");

const PERMISSIONS_TO_REMOVE = [
  "android.permission.READ_EXTERNAL_STORAGE",
  "android.permission.WRITE_EXTERNAL_STORAGE",
  "android.permission.READ_MEDIA_IMAGES",
];

function withRemoveMediaPermissions(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";

    if (!manifest["uses-permission"]) manifest["uses-permission"] = [];

    manifest["uses-permission"] = manifest["uses-permission"].filter(
      (perm) => !PERMISSIONS_TO_REMOVE.includes(perm.$["android:name"])
    );

    for (const name of PERMISSIONS_TO_REMOVE) {
      manifest["uses-permission"].push({
        $: { "android:name": name, "tools:node": "remove" },
      });
    }

    return config;
  });
}

module.exports = withRemoveMediaPermissions;

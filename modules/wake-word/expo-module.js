/**
 * Expo config plugin — adds RECORD_AUDIO permission needed for speech recognition.
 */
const { withAndroidManifest } = require("@expo/config-plugins");

function withWakeWord(config) {
  return withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;
    if (!manifest["uses-permission"]) manifest["uses-permission"] = [];

    const perms = [
      "android.permission.RECORD_AUDIO",
      "android.permission.FOREGROUND_SERVICE",
      "android.permission.FOREGROUND_SERVICE_MICROPHONE",
    ];

    for (const perm of perms) {
      if (!manifest["uses-permission"].find((p) => p.$["android:name"] === perm)) {
        manifest["uses-permission"].push({ $: { "android:name": perm } });
      }
    }
    return mod;
  });
}

module.exports = withWakeWord;

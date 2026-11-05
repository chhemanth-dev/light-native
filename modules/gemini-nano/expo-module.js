/**
 * Expo config plugin — adds AICore dependency to build.gradle if on Android 14+.
 */
const { withAppBuildGradle } = require("@expo/config-plugins");

function withGeminiNano(config) {
  return withAppBuildGradle(config, (mod) => {
    const gradle = mod.modResults.contents;
    if (!gradle.includes("play-services-aicore")) {
      mod.modResults.contents = gradle.replace(
        /dependencies\s*\{/,
        `dependencies {\n    implementation("com.google.android.gms:play-services-aicore:0.4.0")`
      );
    }
    return mod;
  });
}

module.exports = withGeminiNano;

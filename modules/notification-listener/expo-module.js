/**
 * Expo config plugin — patches AndroidManifest.xml to declare
 * the NotificationListenerService and required permissions.
 */
const { withAndroidManifest } = require("@expo/config-plugins");

function withNotificationListener(config) {
  return withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults;
    const app = manifest.manifest.application[0];

    if (!app.service) app.service = [];

    // Check if already added
    const existing = app.service.find(
      (s) =>
        s.$?.["android:name"] ===
        "com.lightnative.LightNotificationService"
    );

    if (!existing) {
      app.service.push({
        $: {
          "android:name": "com.lightnative.LightNotificationService",
          "android:label": "Light Notification Access",
          "android:exported": "false",
          "android:permission": "android.permission.BIND_NOTIFICATION_LISTENER_SERVICE",
        },
        "intent-filter": [
          {
            action: [
              {
                $: {
                  "android:name":
                    "android.service.notification.NotificationListenerService",
                },
              },
            ],
          },
        ],
      });
    }

    return mod;
  });
}

module.exports = withNotificationListener;

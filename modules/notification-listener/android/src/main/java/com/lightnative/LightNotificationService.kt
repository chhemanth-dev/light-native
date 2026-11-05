package com.lightnative

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import com.facebook.react.bridge.Arguments

/**
 * Android NotificationListenerService — receives every notification
 * from every app installed on the device.
 *
 * Registered in AndroidManifest.xml with BIND_NOTIFICATION_LISTENER_SERVICE permission.
 */
class LightNotificationService : NotificationListenerService() {

    companion object {
        @Volatile
        var instance: LightNotificationService? = null
    }

    // Apps to silently ignore
    private val ignoredPackages = setOf(
        "android",
        "com.android.systemui",
        "com.android.phone",
        "com.google.android.gms",
        "com.android.vending",
        "com.android.settings",
        "com.android.providers.downloads"
    )

    override fun onCreate() {
        super.onCreate()
        instance = this
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
    }

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        if (sbn.packageName in ignoredPackages) return
        if (!sbn.isClearable) return // Ongoing notifications (media player, etc.)

        val extras = sbn.notification.extras
        val title = extras.getString("android.title") ?: return
        val text = extras.getCharSequence("android.text")?.toString() ?: return
        if (text.isBlank()) return

        val appName = try {
            packageManager
                .getApplicationLabel(packageManager.getApplicationInfo(sbn.packageName, 0))
                .toString()
        } catch (e: Exception) {
            sbn.packageName
        }

        val params = Arguments.createMap().apply {
            putString("id", sbn.key)
            putString("packageName", sbn.packageName)
            putString("appName", appName)
            putString("title", title)
            putString("text", text)
            putDouble("timestamp", sbn.postTime.toDouble())
        }

        // Forward to React Native
        val module = getModule()
        module?.sendEvent(params)
    }

    private fun getModule(): NotificationListenerModule? {
        return try {
            val app = application as? com.facebook.react.ReactApplication ?: return null
            app.reactNativeHost.reactInstanceManager
                .currentReactContext
                ?.getNativeModule(NotificationListenerModule::class.java)
        } catch (e: Exception) {
            null
        }
    }
}

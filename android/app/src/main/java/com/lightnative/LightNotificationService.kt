package com.lightnative

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap

/**
 * LightNotificationService — intercepts all notifications from every app.
 *
 * Key fix: the original getModule() cast to ReactApplication without null
 * checks, and called reactNativeHost.reactInstanceManager when the React
 * bridge might not be initialised yet → crash. Now fully null-safe.
 */
class LightNotificationService : NotificationListenerService() {

    companion object {
        @Volatile var instance: LightNotificationService? = null
    }

    private val ignoredPackages = setOf(
        "android",
        "com.android.systemui",
        "com.android.phone",
        "com.google.android.gms",
        "com.android.vending",
        "com.android.settings",
        "com.android.providers.downloads",
        "com.samsung.android.service.livedrawing"
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
        if (!sbn.isClearable) return

        val extras = sbn.notification.extras
        val title = extras.getString("android.title") ?: return
        val text  = extras.getCharSequence("android.text")?.toString() ?: return
        if (text.isBlank()) return

        val appName = try {
            packageManager.getApplicationLabel(
                packageManager.getApplicationInfo(sbn.packageName, 0)
            ).toString()
        } catch (e: Exception) {
            sbn.packageName
        }

        val params: WritableMap = Arguments.createMap().apply {
            putString("id",          sbn.key)
            putString("packageName", sbn.packageName)
            putString("appName",     appName)
            putString("title",       title)
            putString("text",        text)
            putDouble("timestamp",   sbn.postTime.toDouble())
        }

        dispatchToModule(params)
    }

    /**
     * Safely forwards the notification to the JS layer.
     * Does nothing if the React bridge is not yet initialised.
     */
    private fun dispatchToModule(params: WritableMap) {
        try {
            val app = application as? com.facebook.react.ReactApplication ?: return
            // getCurrentReactContext() can return null before JS bundle loads
            val reactContext = app.reactNativeHost
                .reactInstanceManager
                .currentReactContext ?: return
            val module = reactContext
                .getNativeModule(NotificationListenerModule::class.java) ?: return
            module.sendEvent(params)
        } catch (e: Exception) {
            // Bridge not ready — the notification is silently dropped this time.
            // It will appear in the next getActive() poll.
        }
    }
}

package com.lightnative.app

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.provider.Settings
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class NotificationListenerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "NotificationListenerModule"

    /**
     * Check if our NotificationListenerService is enabled
     */
    @ReactMethod
    fun isEnabled(promise: Promise) {
        try {
            val enabled = isNotificationServiceEnabled(reactApplicationContext)
            promise.resolve(enabled)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to check notification listener status", e)
        }
    }

    /**
     * Open notification listener settings
     */
    @ReactMethod
    fun openSettings() {
        try {
            val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
        } catch (e: Exception) {
            // Fallback to general settings if specific settings not available
            try {
                val intent = Intent(Settings.ACTION_SETTINGS)
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                reactApplicationContext.startActivity(intent)
            } catch (fallbackE: Exception) {
                // Ignore if both fail
            }
        }
    }

    /**
     * Get currently active notifications (not implemented yet, placeholder)
     */
    @ReactMethod
    fun getActive(promise: Promise) {
        // Placeholder - would need to communicate with the service
        promise.resolve(Arguments.createArray())
    }

    /**
     * Check if notification listener service is enabled for our app
     */
    private fun isNotificationServiceEnabled(context: Context): Boolean {
        val packageName = context.packageName
        val flat = Settings.Secure.getString(
            context.contentResolver,
            "enabled_notification_listeners"
        )
        
        if (flat.isNullOrEmpty()) return false
        
        val names = flat.split(":").toTypedArray()
        for (name in names) {
            val cn = ComponentName.unflattenFromString(name)
            if (cn != null) {
                if (packageName == cn.packageName) {
                    return true
                }
            }
        }
        return false
    }

    /**
     * Send notification event to JavaScript
     */
    fun sendNotificationEvent(data: WritableMap) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("onNotification", data)
    }
}

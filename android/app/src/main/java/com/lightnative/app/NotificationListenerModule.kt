package com.lightnative.app

import android.content.Intent
import android.provider.Settings
import android.text.TextUtils
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class NotificationListenerModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "NotificationListenerModule"

    @ReactMethod
    fun isEnabled(promise: Promise) {
        try {
            val pkgName = reactContext.packageName
            val flat = Settings.Secure.getString(reactContext.contentResolver, "enabled_notification_listeners")
            promise.resolve(!TextUtils.isEmpty(flat) && flat.contains(pkgName))
        } catch (e: Exception) { promise.resolve(false) }
    }

    @ReactMethod
    fun openSettings() {
        val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).apply { addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) }
        reactContext.startActivity(intent)
    }

    @ReactMethod
    fun getActive(promise: Promise) {
        val service = LightNotificationService.instance
        if (service == null) { promise.resolve(Arguments.createArray()); return }
        try {
            val list = Arguments.createArray()
            for (sbn in service.activeNotifications) {
                val extras = sbn.notification.extras
                val map = Arguments.createMap().apply {
                    putString("id", sbn.key)
                    putString("packageName", sbn.packageName)
                    putString("appName", sbn.packageName)
                    putString("title", extras.getString("android.title") ?: "")
                    putString("text", extras.getCharSequence("android.text")?.toString() ?: "")
                    putDouble("timestamp", sbn.postTime.toDouble())
                }
                list.pushMap(map)
            }
            promise.resolve(list)
        } catch (e: Exception) { promise.resolve(Arguments.createArray()) }
    }

    fun sendEvent(params: WritableMap) {
        try {
            reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit("onNotification", params)
        } catch (e: Exception) { }
    }

    @ReactMethod fun addListener(eventName: String) {}
    @ReactMethod fun removeListeners(count: Int) {}
}

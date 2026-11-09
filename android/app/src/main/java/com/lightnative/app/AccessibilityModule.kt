package com.lightnative.app

import android.content.Intent
import android.net.Uri
import android.provider.Settings
import com.facebook.react.bridge.*

class AccessibilityModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "AccessibilityModule"

    @ReactMethod
    fun makePhoneCall(phoneNumber: String, promise: Promise) {
        try {
            val intent = Intent(Intent.ACTION_CALL).apply {
                data = Uri.parse("tel:$phoneNumber")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            reactContext.startActivity(intent)
            promise.resolve("Calling $phoneNumber")
        } catch (e: Exception) {
            promise.reject("CALL_ERROR", "Failed to make call: ${e.message}")
        }
    }

    @ReactMethod
    fun openApp(packageName: String, promise: Promise) {
        try {
            val intent = reactContext.packageManager.getLaunchIntentForPackage(packageName)
            if (intent != null) {
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                reactContext.startActivity(intent)
                promise.resolve("Opened $packageName")
            } else {
                promise.reject("APP_NOT_FOUND", "App not installed: $packageName")
            }
        } catch (e: Exception) {
            promise.reject("OPEN_ERROR", "Failed to open app: ${e.message}")
        }
    }

    @ReactMethod
    fun sendSMS(phoneNumber: String, message: String, promise: Promise) {
        try {
            val intent = Intent(Intent.ACTION_VIEW).apply {
                data = Uri.parse("sms:$phoneNumber")
                putExtra("sms_body", message)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            reactContext.startActivity(intent)
            promise.resolve("SMS intent opened")
        } catch (e: Exception) {
            promise.reject("SMS_ERROR", "Failed to send SMS: ${e.message}")
        }
    }

    @ReactMethod
    fun openSettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_SETTINGS).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            reactContext.startActivity(intent)
            promise.resolve("Settings opened")
        } catch (e: Exception) {
            promise.reject("SETTINGS_ERROR", "Failed to open settings: ${e.message}")
        }
    }

    @ReactMethod
    fun openAccessibilitySettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            reactContext.startActivity(intent)
            promise.resolve("Accessibility settings opened")
        } catch (e: Exception) {
            promise.reject("ACCESSIBILITY_ERROR", "Failed to open accessibility settings: ${e.message}")
        }
    }

    @ReactMethod
    fun checkInternetConnection(promise: Promise) {
        try {
            val connectivityManager = reactContext.getSystemService(android.content.Context.CONNECTIVITY_SERVICE) as android.net.ConnectivityManager
            val activeNetwork = connectivityManager.activeNetworkInfo
            val isConnected = activeNetwork?.isConnectedOrConnecting == true
            promise.resolve(isConnected)
        } catch (e: Exception) {
            promise.reject("CONNECTIVITY_ERROR", "Failed to check connectivity: ${e.message}")
        }
    }
}

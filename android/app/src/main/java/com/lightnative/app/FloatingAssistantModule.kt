package com.lightnative.app

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class FloatingAssistantModule(private val reactContext: ReactApplicationContext) : 
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "FloatingAssistantModule"

    @ReactMethod
    fun startFloating(promise: Promise) {
        try {
            val intent = Intent(reactContext, FloatingAssistantService::class.java).apply {
                action = FloatingAssistantService.ACTION_START
            }
            reactContext.startService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("START_FAILED", e.message, e)
        }
    }

    @ReactMethod
    fun stopFloating(promise: Promise) {
        try {
            val intent = Intent(reactContext, FloatingAssistantService::class.java).apply {
                action = FloatingAssistantService.ACTION_STOP
            }
            reactContext.startService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("STOP_FAILED", e.message, e)
        }
    }

    @ReactMethod
    fun showFloating(promise: Promise) {
        try {
            val intent = Intent(reactContext, FloatingAssistantService::class.java).apply {
                action = FloatingAssistantService.ACTION_SHOW
            }
            reactContext.startService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SHOW_FAILED", e.message, e)
        }
    }

    @ReactMethod
    fun hideFloating(promise: Promise) {
        try {
            val intent = Intent(reactContext, FloatingAssistantService::class.java).apply {
                action = FloatingAssistantService.ACTION_HIDE
            }
            reactContext.startService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("HIDE_FAILED", e.message, e)
        }
    }

    @ReactMethod
    fun updateStatus(status: String, promise: Promise) {
        try {
            // Send broadcast to service to update status
            val intent = Intent("com.lightnative.UPDATE_FLOATING_STATUS").apply {
                putExtra("status", status)
            }
            reactContext.sendBroadcast(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("UPDATE_FAILED", e.message, e)
        }
    }

    @ReactMethod
    fun checkOverlayPermission(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            promise.resolve(Settings.canDrawOverlays(reactContext))
        } else {
            promise.resolve(true) // Permission not needed on older Android
        }
    }

    @ReactMethod
    fun requestOverlayPermission(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val intent = Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:${reactContext.packageName}")
                ).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                reactContext.startActivity(intent)
                promise.resolve(true)
            } else {
                promise.resolve(true) // No permission needed
            }
        } catch (e: Exception) {
            promise.reject("PERMISSION_REQUEST_FAILED", e.message, e)
        }
    }

    @ReactMethod
    fun openMainApp(promise: Promise) {
        try {
            val intent = reactContext.packageManager.getLaunchIntentForPackage(reactContext.packageName)
            intent?.apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
            }
            reactContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("OPEN_APP_FAILED", e.message, e)
        }
    }
}

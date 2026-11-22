package com.lightnative.app

import android.content.Intent
import android.net.Uri
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class FloatingAssistantModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

  private val appContext: ReactApplicationContext = reactContext

  override fun getName(): String = "FloatingAssistantModule"

  @ReactMethod
  fun checkOverlayPermission(promise: Promise) {
    try {
      promise.resolve(Settings.canDrawOverlays(appContext))
    } catch (e: Exception) {
      promise.reject("FLOATING_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun requestOverlayPermission(promise: Promise) {
    try {
      val intent = Intent(
        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
        Uri.parse("package:${appContext.packageName}")
      ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      appContext.startActivity(intent)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("FLOATING_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun startFloating(promise: Promise) {
    try {
      if (!Settings.canDrawOverlays(appContext)) {
        promise.reject("NO_OVERLAY_PERMISSION", "Allow Light to display over other apps first.")
        return
      }
      FloatingOrbService.reactContext = appContext
      appContext.startService(Intent(appContext, FloatingOrbService::class.java))
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("FLOATING_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun stopFloating(promise: Promise) {
    try {
      appContext.stopService(Intent(appContext, FloatingOrbService::class.java))
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("FLOATING_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun showFloating(promise: Promise) {
    try {
      FloatingOrbService.show()
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("FLOATING_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun hideFloating(promise: Promise) {
    try {
      FloatingOrbService.hide()
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("FLOATING_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun updateStatus(status: String, promise: Promise) {
    try {
      FloatingOrbService.updateStatus(status)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("FLOATING_ERROR", e.message, e)
    }
  }
}

package com.lightnative.app

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.WritableArray

class LightScreenModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "LightScreen"

  private val notEnabledMessage = "Enable Light in Settings > Accessibility first."
  private val sessionInactiveMessage = "Screen access needs an active Light session. Tap the floating orb first."

  @ReactMethod
  fun isServiceEnabled(promise: Promise) {
    promise.resolve(LightAccessibilityService.instance != null)
  }

  @ReactMethod
  fun beginSession(durationMs: Double, promise: Promise) {
    if (LightAccessibilityService.instance == null) {
      promise.reject("SERVICE_NOT_ENABLED", notEnabledMessage)
      return
    }
    LightAccessibilityService.beginSession(durationMs.toLong())
    promise.resolve(true)
  }

  @ReactMethod
  fun endSession(promise: Promise) {
    LightAccessibilityService.endSession()
    promise.resolve(true)
  }

  @ReactMethod
  fun getScreenText(promise: Promise) {
    val svc = LightAccessibilityService.instance
    if (svc == null) {
      promise.reject("SERVICE_NOT_ENABLED", notEnabledMessage)
      return
    }
    if (!LightAccessibilityService.isSessionActive()) {
      promise.reject("SESSION_INACTIVE", sessionInactiveMessage)
      return
    }
    try {
      val array: WritableArray = Arguments.createArray()
      svc.getScreenText().forEach { array.pushString(it) }
      promise.resolve(array)
    } catch (e: Exception) {
      promise.reject("SCREEN_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun tapText(text: String, promise: Promise) {
    val svc = LightAccessibilityService.instance
    if (svc == null) {
      promise.reject("SERVICE_NOT_ENABLED", notEnabledMessage)
      return
    }
    if (!LightAccessibilityService.isSessionActive()) {
      promise.reject("SESSION_INACTIVE", sessionInactiveMessage)
      return
    }
    try {
      promise.resolve(svc.tapText(text))
    } catch (e: Exception) {
      promise.reject("SCREEN_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun tapAt(x: Double, y: Double, promise: Promise) {
    val svc = LightAccessibilityService.instance
    if (svc == null) {
      promise.reject("SERVICE_NOT_ENABLED", notEnabledMessage)
      return
    }
    if (!LightAccessibilityService.isSessionActive()) {
      promise.reject("SESSION_INACTIVE", sessionInactiveMessage)
      return
    }
    try {
      svc.tapAt(x.toFloat(), y.toFloat()) { ok -> promise.resolve(ok) }
    } catch (e: Exception) {
      promise.reject("SCREEN_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun scroll(direction: String, promise: Promise) {
    val svc = LightAccessibilityService.instance
    if (svc == null) {
      promise.reject("SERVICE_NOT_ENABLED", notEnabledMessage)
      return
    }
    if (!LightAccessibilityService.isSessionActive()) {
      promise.reject("SESSION_INACTIVE", sessionInactiveMessage)
      return
    }
    try {
      promise.resolve(svc.scroll(direction))
    } catch (e: Exception) {
      promise.reject("SCREEN_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun typeText(text: String, promise: Promise) {
    val svc = LightAccessibilityService.instance
    if (svc == null) {
      promise.reject("SERVICE_NOT_ENABLED", notEnabledMessage)
      return
    }
    if (!LightAccessibilityService.isSessionActive()) {
      promise.reject("SESSION_INACTIVE", sessionInactiveMessage)
      return
    }
    try {
      promise.resolve(svc.typeText(text))
    } catch (e: Exception) {
      promise.reject("SCREEN_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun globalAction(name: String, promise: Promise) {
    val svc = LightAccessibilityService.instance
    if (svc == null) {
      promise.reject("SERVICE_NOT_ENABLED", notEnabledMessage)
      return
    }
    if (!LightAccessibilityService.isSessionActive()) {
      promise.reject("SESSION_INACTIVE", sessionInactiveMessage)
      return
    }
    try {
      promise.resolve(svc.globalAction(name))
    } catch (e: Exception) {
      promise.reject("SCREEN_ERROR", e.message, e)
    }
  }
}

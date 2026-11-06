package com.lightnative.app

import android.os.Build
import com.facebook.react.bridge.*
import kotlinx.coroutines.*

class GeminiNanoModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "GeminiNanoModule"
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    @ReactMethod
    fun isAvailable(promise: Promise) {
        if (Build.VERSION.SDK_INT < 34) { promise.resolve(false); return }
        scope.launch {
            try {
                reactContext.packageManager.getPackageInfo("com.google.android.aicore", 0)
                promise.resolve(true)
            } catch (e: Exception) { promise.resolve(false) }
        }
    }

    @ReactMethod
    fun generateText(prompt: String, promise: Promise) {
        promise.reject("UNAVAILABLE", "Gemini Nano not supported on this device")
    }

    override fun invalidate() { scope.cancel(); super.invalidate() }
}

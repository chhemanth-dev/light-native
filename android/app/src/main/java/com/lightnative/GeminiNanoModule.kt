package com.lightnative

import android.os.Build
import com.facebook.react.bridge.*
import kotlinx.coroutines.*

/**
 * GeminiNanoModule — wraps on-device AI via Android AICore (Android 14+).
 *
 * Samsung A06 5G does NOT have AICore / Gemini Nano. This module therefore:
 *  1. Reports isAvailable() = false on devices without AICore.
 *  2. generateText() rejects cleanly so the JS side falls back to the
 *     offline rule engine without crashing.
 *
 * The reflection-based approach is kept but wrapped in comprehensive
 * try/catch so ClassNotFoundException on non-Pixel devices doesn't crash.
 */
class GeminiNanoModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "GeminiNanoModule"

    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    @ReactMethod
    fun isAvailable(promise: Promise) {
        // Require Android 14+ (API 34 = UPSIDE_DOWN_CAKE)
        if (Build.VERSION.SDK_INT < 34) {
            promise.resolve(false)
            return
        }
        scope.launch {
            try {
                // Check for Google AICore package
                reactContext.packageManager.getPackageInfo("com.google.android.aicore", 0)
                promise.resolve(true)
            } catch (e: Exception) {
                // Package not installed (most non-Pixel devices)
                promise.resolve(false)
            }
        }
    }

    @ReactMethod
    fun generateText(prompt: String, promise: Promise) {
        if (Build.VERSION.SDK_INT < 34) {
            promise.reject("UNAVAILABLE", "Gemini Nano requires Android 14+")
            return
        }
        scope.launch {
            try {
                val result = runGeminiNano(prompt)
                promise.resolve(result)
            } catch (e: ClassNotFoundException) {
                promise.reject("UNAVAILABLE", "AICore not installed on this device")
            } catch (e: Exception) {
                promise.reject("FAILED", e.message ?: "Generation failed")
            }
        }
    }

    /**
     * Calls Gemini Nano via reflection so we don't need a compile-time
     * dependency on play-services-aicore (which is not on most devices).
     */
    private suspend fun runGeminiNano(prompt: String): String = withContext(Dispatchers.IO) {
        // Build GenerationConfig
        val configCls  = Class.forName("com.google.android.gms.aicore.GenerationConfig")
        val cfgBuilder = configCls.getMethod("builder").invoke(null)!!
        cfgBuilder.javaClass.getMethod("setMaxOutputTokens", Int::class.java)
            .invoke(cfgBuilder, 512)
        cfgBuilder.javaClass.getMethod("setTemperature", Float::class.java)
            .invoke(cfgBuilder, 0.7f)
        val config = cfgBuilder.javaClass.getMethod("build").invoke(cfgBuilder)

        // Build GenerativeModel
        val modelCls   = Class.forName("com.google.android.gms.aicore.GenerativeModel")
        val mdlBuilder = modelCls.getMethod("builder").invoke(null)!!
        mdlBuilder.javaClass.getMethod("setModelName", String::class.java)
            .invoke(mdlBuilder, "gemini-nano")
        mdlBuilder.javaClass.getMethod("setGenerationConfig", configCls)
            .invoke(mdlBuilder, config)
        val model = mdlBuilder.javaClass.getMethod("build").invoke(mdlBuilder)!!

        // Build Content from text
        val contentCls = Class.forName("com.google.android.gms.aicore.content.Content")
        val content    = contentCls.getMethod("fromText", String::class.java)
            .invoke(null, prompt)

        // Generate
        val response = model.javaClass
            .getMethod("generateContent", Array<Any>::class.java)
            .invoke(model, arrayOf(content))!!

        response.javaClass.getMethod("getText").invoke(response) as? String
            ?: throw Exception("Empty response from Gemini Nano")
    }

    override fun invalidate() {
        scope.cancel()
        super.invalidate()
    }
}

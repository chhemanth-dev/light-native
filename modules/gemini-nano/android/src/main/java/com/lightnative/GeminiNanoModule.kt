package com.lightnative

import android.os.Build
import com.facebook.react.bridge.*
import kotlinx.coroutines.*

/**
 * Gemini Nano on-device AI via Android AICore.
 *
 * Requires:
 *   - Android 14+ (API 34+)
 *   - Device enrolled in AICore (Pixel 8+ out of box, others via Play Store update)
 *   - play-services-aicore:0.5.0 in build.gradle
 *
 * Falls back gracefully: isAvailable() returns false → JS uses rule-based engine.
 *
 * AICore docs: https://developer.android.com/ai/aicore
 */
class GeminiNanoModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "GeminiNanoModule"

    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    @ReactMethod
    fun isAvailable(promise: Promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            promise.resolve(false)
            return
        }
        scope.launch {
            try {
                // Check if AICore service is present
                val pm = reactContext.packageManager
                val aicoreInstalled = try {
                    pm.getPackageInfo("com.google.android.aicore", 0)
                    true
                } catch (e: Exception) { false }
                promise.resolve(aicoreInstalled)
            } catch (e: Exception) {
                promise.resolve(false)
            }
        }
    }

    @ReactMethod
    fun generateText(prompt: String, promise: Promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            promise.reject("UNAVAILABLE", "Gemini Nano requires Android 14+")
            return
        }

        scope.launch {
            try {
                // Use AICore GenerativeModel API
                // The actual class path after adding the play-services-aicore dependency:
                val result = callAiCore(prompt)
                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject("GENERATE_FAILED", e.message ?: "Generation failed")
            }
        }
    }

    /**
     * Calls Android AICore Gemini Nano.
     * Using the official API as documented at:
     * https://developer.android.com/ai/aicore/guide
     */
    @Suppress("UNCHECKED_CAST")
    private suspend fun callAiCore(prompt: String): String = withContext(Dispatchers.IO) {
        // Official AICore API classes (available after adding play-services-aicore dep)
        val generationConfigClass = Class.forName(
            "com.google.android.gms.aicore.GenerationConfig"
        )
        val generationConfigBuilder = generationConfigClass
            .getMethod("builder").invoke(null)

        // Configure: max 512 tokens, temperature 0.7 for natural responses
        generationConfigBuilder!!::class.java
            .getMethod("setMaxOutputTokens", Int::class.java)
            .invoke(generationConfigBuilder, 512)
        generationConfigBuilder::class.java
            .getMethod("setTemperature", Float::class.java)
            .invoke(generationConfigBuilder, 0.7f)

        val generationConfig = generationConfigBuilder::class.java
            .getMethod("build").invoke(generationConfigBuilder)

        // Build model
        val modelClass = Class.forName("com.google.android.gms.aicore.GenerativeModel")
        val modelBuilder = modelClass.getMethod("builder").invoke(null)
        modelBuilder!!::class.java.getMethod("setModelName", String::class.java)
            .invoke(modelBuilder, "gemini-nano")
        modelBuilder::class.java.getMethod("setGenerationConfig", generationConfigClass)
            .invoke(modelBuilder, generationConfig)
        val model = modelBuilder::class.java.getMethod("build").invoke(modelBuilder)

        // Generate content synchronously
        val contentClass = Class.forName("com.google.android.gms.aicore.content.Content")
        val content = contentClass.getMethod("fromText", String::class.java)
            .invoke(null, prompt)

        val resultClass = Class.forName("com.google.android.gms.aicore.GenerateContentResponse")
        val result = model!!::class.java
            .getMethod("generateContent", Array<Any>::class.java)
            .invoke(model, arrayOf(content))

        // Extract text from response
        val text = result!!::class.java.getMethod("getText").invoke(result) as? String
        text?.trim() ?: throw Exception("Empty response from Gemini Nano")
    }

    override fun invalidate() {
        scope.cancel()
        super.invalidate()
    }
}

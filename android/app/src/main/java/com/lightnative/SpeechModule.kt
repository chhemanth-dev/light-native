package com.lightnative

import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * SpeechModule — single-shot voice input using Android SpeechRecognizer.
 * Used when the user taps the orb or a wake word fires.
 *
 * Key fix: SpeechRecognizer MUST be created with an Activity context on
 * Android 13+, not the application context. We fall back to the application
 * context only when no activity is attached (e.g. during tear-down).
 */
class SpeechModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext), RecognitionListener {

    override fun getName() = "SpeechModule"

    private var recognizer: SpeechRecognizer? = null

    @ReactMethod
    fun startListening(language: String) {
        reactContext.runOnUiQueueThread {
            try {
                destroyRecognizer()

                if (!SpeechRecognizer.isRecognitionAvailable(reactContext)) {
                    sendError("Recognition not available on this device")
                    return@runOnUiQueueThread
                }

                // Use activity context for Android 13+ compatibility
                val ctx = currentActivity ?: reactContext
                recognizer = SpeechRecognizer.createSpeechRecognizer(ctx)
                recognizer?.setRecognitionListener(this)

                val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL,
                        RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE, language)
                    putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
                    putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true)
                    putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 5000L)
                    putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 3000L)
                }
                recognizer?.startListening(intent)
            } catch (e: Exception) {
                sendError(e.message ?: "Failed to start listening")
            }
        }
    }

    @ReactMethod
    fun stopListening() {
        reactContext.runOnUiQueueThread {
            try { recognizer?.stopListening() } catch (e: Exception) { /* ignore */ }
        }
    }

    private fun destroyRecognizer() {
        try {
            recognizer?.destroy()
        } catch (e: Exception) { /* ignore */ }
        recognizer = null
    }

    private fun send(eventName: String, params: WritableMap) {
        try {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
        } catch (e: Exception) { /* context may be torn down */ }
    }

    private fun sendError(message: String) {
        send("onSpeechError", Arguments.createMap().apply { putString("error", message) })
    }

    override fun onResults(results: Bundle) {
        val transcript = results
            .getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
            ?.firstOrNull() ?: ""
        send("onSpeechResult", Arguments.createMap().apply {
            putString("transcript", transcript)
        })
        destroyRecognizer()
    }

    override fun onError(error: Int) {
        sendError("SpeechRecognizer error code: $error")
        destroyRecognizer()
    }

    override fun onReadyForSpeech(params: Bundle?) {}
    override fun onBeginningOfSpeech() {}
    override fun onRmsChanged(rmsdB: Float) {}
    override fun onBufferReceived(buffer: ByteArray?) {}
    override fun onEndOfSpeech() {}
    override fun onPartialResults(partialResults: Bundle?) {}
    override fun onEvent(eventType: Int, params: Bundle?) {}

    @ReactMethod fun addListener(eventName: String) {}
    @ReactMethod fun removeListeners(count: Int) {}

    override fun invalidate() {
        reactContext.runOnUiQueueThread { destroyRecognizer() }
        super.invalidate()
    }
}

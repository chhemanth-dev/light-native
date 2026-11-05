package com.lightnative

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * Continuous wake-word detection using Android's on-device SpeechRecognizer.
 * Fires "onSpeechPartial" events with partial transcripts.
 * The JS side checks for "hey light" in the transcript.
 *
 * Uses PREFER_OFFLINE flag so it works without internet.
 */
class WakeWordModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), RecognitionListener {

    override fun getName() = "WakeWordModule"

    private var recognizer: SpeechRecognizer? = null
    private var isListening = false

    @ReactMethod
    fun start() {
        reactContext.runOnUiThread {
            stopInternal()
            if (!SpeechRecognizer.isRecognitionAvailable(reactContext)) return@runOnUiThread

            // Start foreground service to keep process alive
            val serviceIntent = Intent(reactContext, WakeWordForegroundService::class.java).apply {
                action = WakeWordForegroundService.ACTION_START
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactContext.startForegroundService(serviceIntent)
            } else {
                reactContext.startService(serviceIntent)
            }

            recognizer = SpeechRecognizer.createSpeechRecognizer(reactContext)
            recognizer?.setRecognitionListener(this)
            startListeningInternal()
            isListening = true
        }
    }

    @ReactMethod
    fun stop() {
        reactContext.runOnUiThread {
            isListening = false
            stopInternal()
        }
    }

    private fun startListeningInternal() {
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-US")
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
            // Prefer on-device recognition for lower latency & offline support
            putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true)
            // Keep listening — no silence timeout
            putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 3000L)
            putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 3000L)
        }
        recognizer?.startListening(intent)
    }

    private fun stopInternal() {
        recognizer?.stopListening()
        recognizer?.destroy()
        recognizer = null
    }

    private fun sendEvent(eventName: String, params: WritableMap) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    // ── RecognitionListener ──────────────────────────────────────

    override fun onPartialResults(partialResults: Bundle) {
        val results = partialResults.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
        val transcript = results?.firstOrNull() ?: return
        val map = Arguments.createMap().apply { putString("transcript", transcript) }
        sendEvent("onSpeechPartial", map)
    }

    override fun onResults(results: Bundle) {
        val texts = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
        val transcript = texts?.firstOrNull() ?: ""
        if (transcript.isNotBlank()) {
            val map = Arguments.createMap().apply { putString("transcript", transcript) }
            sendEvent("onSpeechPartial", map)
        }
        // Restart automatically for continuous listening
        if (isListening) {
            reactContext.runOnUiThread { startListeningInternal() }
        }
    }

    override fun onError(error: Int) {
        // Most errors are recoverable (silence timeout, network, etc.) — just restart
        if (isListening) {
            reactContext.runOnUiThread {
                try {
                    recognizer?.destroy()
                    recognizer = SpeechRecognizer.createSpeechRecognizer(reactContext)
                    recognizer?.setRecognitionListener(this)
                    Thread.sleep(500)
                    startListeningInternal()
                } catch (e: Exception) { /* ignore */ }
            }
        }
    }

    override fun onReadyForSpeech(params: Bundle?) {}
    override fun onBeginningOfSpeech() {}
    override fun onRmsChanged(rmsdB: Float) {}
    override fun onBufferReceived(buffer: ByteArray?) {}
    override fun onEndOfSpeech() {}
    override fun onEvent(eventType: Int, params: Bundle?) {}

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}
}

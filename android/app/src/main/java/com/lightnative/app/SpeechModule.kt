package com.lightnative.app

import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

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
                
                // Check if recognition is available
                if (!SpeechRecognizer.isRecognitionAvailable(reactContext)) {
                    sendError("Speech recognition not available on this device")
                    return@runOnUiQueueThread
                }
                
                // Explicitly check RECORD_AUDIO permission
                val ctx = currentActivity ?: reactContext
                val hasPermission = ctx.checkSelfPermission(android.Manifest.permission.RECORD_AUDIO) == 
                                    android.content.pm.PackageManager.PERMISSION_GRANTED
                
                if (!hasPermission) {
                    sendError("⚠️ MICROPHONE PERMISSION REQUIRED! Go to: Settings → Apps → Light → Permissions → Microphone → ALLOW")
                    return@runOnUiQueueThread
                }
                
                recognizer = SpeechRecognizer.createSpeechRecognizer(ctx)
                recognizer?.setRecognitionListener(this)
                val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE, language)
                    putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
                    putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, false) // Allow online recognition
                    putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 5000L)
                    putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 5000L)
                }
                recognizer?.startListening(intent)
            } catch (e: Exception) {
                sendError("Failed to start speech recognition: ${e.message}")
            }
        }
    }

    @ReactMethod
    fun stopListening() {
        reactContext.runOnUiQueueThread {
            try { recognizer?.stopListening() } catch (e: Exception) { }
        }
    }

    private fun destroyRecognizer() {
        try { recognizer?.destroy() } catch (e: Exception) { }
        recognizer = null
    }

    private fun send(name: String, params: WritableMap) {
        try {
            reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit(name, params)
        } catch (e: Exception) { }
    }

    private fun sendError(msg: String) {
        send("onSpeechError", Arguments.createMap().apply { putString("error", msg) })
    }

    override fun onResults(results: Bundle) {
        val t = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull() ?: ""
        send("onSpeechResult", Arguments.createMap().apply { putString("transcript", t) })
        destroyRecognizer()
    }

    override fun onError(error: Int) {
        val errorMsg = when(error) {
            SpeechRecognizer.ERROR_AUDIO -> "Audio recording error. Check if another app is using the microphone."
            SpeechRecognizer.ERROR_CLIENT -> "Client side error. Try restarting the app."
            13 -> "⚠️ MICROPHONE PERMISSION DENIED! Go to Settings → Apps → Light → Permissions → Microphone → Allow"
            SpeechRecognizer.ERROR_NETWORK -> "Network error. Speech recognition needs internet connection."
            SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Network timeout. Check your internet connection."
            SpeechRecognizer.ERROR_NO_MATCH -> "No speech detected. Try speaking louder and clearer."
            SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Speech recognizer is busy. Wait a moment and try again."
            SpeechRecognizer.ERROR_SERVER -> "Google speech server error. Try again later."
            SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "No speech heard. Mic timed out."
            else -> "Speech recognition error code: $error. Use TYPE INSTEAD button below."
        }
        sendError(errorMsg)
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

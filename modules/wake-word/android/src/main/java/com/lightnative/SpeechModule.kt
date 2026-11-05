package com.lightnative

import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * One-shot speech recognition module — used for capturing the user's
 * voice command after the wake word fires.
 * Fires "onSpeechResult" with the final transcript,
 * or "onSpeechError" on failure.
 */
class SpeechModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), RecognitionListener {

    override fun getName() = "SpeechModule"

    private var recognizer: SpeechRecognizer? = null

    @ReactMethod
    fun startListening(language: String) {
        reactContext.runOnUiThread {
            recognizer?.destroy()
            recognizer = SpeechRecognizer.createSpeechRecognizer(reactContext)
            recognizer?.setRecognitionListener(this)

            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, language)
                putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
                putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true)
            }
            recognizer?.startListening(intent)
        }
    }

    @ReactMethod
    fun stopListening() {
        reactContext.runOnUiThread {
            recognizer?.stopListening()
        }
    }

    private fun sendEvent(name: String, params: WritableMap) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(name, params)
    }

    override fun onResults(results: Bundle) {
        val texts = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
        val transcript = texts?.firstOrNull() ?: ""
        val map = Arguments.createMap().apply { putString("transcript", transcript) }
        sendEvent("onSpeechResult", map)
        recognizer?.destroy()
        recognizer = null
    }

    override fun onError(error: Int) {
        val map = Arguments.createMap().apply { putInt("error", error) }
        sendEvent("onSpeechError", map)
        recognizer?.destroy()
        recognizer = null
    }

    override fun onReadyForSpeech(params: Bundle?) {}
    override fun onBeginningOfSpeech() {}
    override fun onRmsChanged(rmsdB: Float) {}
    override fun onBufferReceived(buffer: ByteArray?) {}
    override fun onEndOfSpeech() {}
    override fun onPartialResults(partialResults: Bundle?) {}
    override fun onEvent(eventType: Int, params: Bundle?) {}

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}
}

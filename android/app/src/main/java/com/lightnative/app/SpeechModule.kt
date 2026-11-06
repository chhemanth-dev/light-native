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
                if (!SpeechRecognizer.isRecognitionAvailable(reactContext)) {
                    sendError("Recognition not available")
                    return@runOnUiQueueThread
                }
                val ctx = currentActivity ?: reactContext
                recognizer = SpeechRecognizer.createSpeechRecognizer(ctx)
                recognizer?.setRecognitionListener(this)
                val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE, language)
                    putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
                    putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true)
                    putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 5000L)
                }
                recognizer?.startListening(intent)
            } catch (e: Exception) {
                sendError(e.message ?: "Failed to start")
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
        sendError("Error code: $error")
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

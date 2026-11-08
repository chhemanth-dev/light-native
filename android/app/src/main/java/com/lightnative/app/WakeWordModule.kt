package com.lightnative.app

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class WakeWordModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext), RecognitionListener {

    override fun getName() = "WakeWordModule"
    private var recognizer: SpeechRecognizer? = null
    private var isListening = false
    private val uiHandler = Handler(Looper.getMainLooper())

    @ReactMethod
    fun start() {
        reactContext.runOnUiQueueThread {
            destroyRecognizer()
            if (!SpeechRecognizer.isRecognitionAvailable(reactContext)) return@runOnUiQueueThread
            val hasMic = ContextCompat.checkSelfPermission(reactContext, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED
            if (!hasMic) return@runOnUiQueueThread
            try {
                val svcIntent = Intent(reactContext, WakeWordForegroundService::class.java).apply { action = WakeWordForegroundService.ACTION_START }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) reactContext.startForegroundService(svcIntent)
                else reactContext.startService(svcIntent)
                recognizer = SpeechRecognizer.createSpeechRecognizer(reactContext)
                recognizer?.setRecognitionListener(this)
                isListening = true
                startRecognizing()
            } catch (e: Exception) { }
        }
    }

    @ReactMethod
    fun stop() {
        reactContext.runOnUiQueueThread {
            isListening = false
            uiHandler.removeCallbacksAndMessages(null)
            destroyRecognizer()
            try {
                val svcIntent = Intent(reactContext, WakeWordForegroundService::class.java).apply { action = WakeWordForegroundService.ACTION_STOP }
                reactContext.startService(svcIntent)
            } catch (e: Exception) { }
        }
    }

    private fun startRecognizing() {
        try {
            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-US")
                putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
                putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true)
                putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 4000L)
            }
            recognizer?.startListening(intent)
        } catch (e: Exception) { }
    }

    private fun destroyRecognizer() {
        try { recognizer?.stopListening(); recognizer?.destroy() } catch (e: Exception) { }
        recognizer = null
    }

    private fun scheduleRestart(delayMs: Long = 700L) {
        uiHandler.postDelayed({
            if (!isListening) return@postDelayed
            try {
                destroyRecognizer()
                recognizer = SpeechRecognizer.createSpeechRecognizer(reactContext)
                recognizer?.setRecognitionListener(this)
                startRecognizing()
            } catch (e: Exception) { }
        }, delayMs)
    }

    private fun sendPartial(transcript: String) {
        try {
            reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("onSpeechPartial", Arguments.createMap().apply { putString("transcript", transcript) })
        } catch (e: Exception) { }
    }

    override fun onPartialResults(partialResults: Bundle) {
        val t = partialResults.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull() ?: return
        sendPartial(t)
    }
    override fun onResults(results: Bundle) {
        val t = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull() ?: ""
        if (t.isNotBlank()) sendPartial(t)
        if (isListening) scheduleRestart(300)
    }
    override fun onError(error: Int) { if (isListening) scheduleRestart(700) }
    override fun onReadyForSpeech(params: Bundle?) {}
    override fun onBeginningOfSpeech() {}
    override fun onRmsChanged(rmsdB: Float) {}
    override fun onBufferReceived(buffer: ByteArray?) {}
    override fun onEndOfSpeech() {}
    override fun onEvent(eventType: Int, params: Bundle?) {}
    @ReactMethod fun addListener(eventName: String) {}
    @ReactMethod fun removeListeners(count: Int) {}

    override fun invalidate() {
        isListening = false
        uiHandler.removeCallbacksAndMessages(null)
        reactContext.runOnUiQueueThread { destroyRecognizer() }
        super.invalidate()
    }
}

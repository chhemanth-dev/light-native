package com.lightnative;

import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

/**
 * React Native Module for Wake Word Service
 * Allows JavaScript to start/stop always-on listening
 */
public class WakeWordModule extends ReactContextBaseJavaModule {
    private static final String TAG = "WakeWordModule";
    private final ReactApplicationContext reactContext;

    public WakeWordModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "WakeWordModule";
    }

    /**
     * Start wake word service (always-on listening)
     */
    @ReactMethod
    public void startWakeWordService(Promise promise) {
        try {
            Log.d(TAG, "Starting wake word service...");
            Context context = getReactApplicationContext();
            Intent serviceIntent = new Intent(context, WakeWordService.class);
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
            
            promise.resolve("Wake word service started");
            Log.d(TAG, "✓ Wake word service started");
        } catch (Exception e) {
            Log.e(TAG, "Failed to start wake word service", e);
            promise.reject("START_ERROR", "Failed to start wake word service: " + e.getMessage());
        }
    }

    /**
     * Stop wake word service
     */
    @ReactMethod
    public void stopWakeWordService(Promise promise) {
        try {
            Log.d(TAG, "Stopping wake word service...");
            Context context = getReactApplicationContext();
            Intent serviceIntent = new Intent(context, WakeWordService.class);
            context.stopService(serviceIntent);
            
            promise.resolve("Wake word service stopped");
            Log.d(TAG, "✓ Wake word service stopped");
        } catch (Exception e) {
            Log.e(TAG, "Failed to stop wake word service", e);
            promise.reject("STOP_ERROR", "Failed to stop wake word service: " + e.getMessage());
        }
    }

    /**
     * Check if wake word service is supported
     */
    @ReactMethod
    public void isWakeWordSupported(Promise promise) {
        try {
            // Check if speech recognition is available
            boolean supported = android.speech.SpeechRecognizer.isRecognitionAvailable(reactContext);
            promise.resolve(supported);
        } catch (Exception e) {
            promise.resolve(false);
        }
    }
}

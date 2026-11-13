package com.lightnative;

import android.content.Context;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.content.Intent;
import android.util.Log;
import java.util.ArrayList;

/**
 * Wake Word Detector - Listens for "Hey Google" or "Hey Light"
 * Uses Android's built-in speech recognition
 */
public class WakeWordDetector {
    private static final String TAG = "WakeWordDetector";
    
    private Context context;
    private SpeechRecognizer speechRecognizer;
    private WakeWordListener listener;
    private boolean isListening = false;

    public interface WakeWordListener {
        void onWakeWordDetected(String wakeWord);
    }

    public WakeWordDetector(Context context, WakeWordListener listener) {
        this.context = context;
        this.listener = listener;
    }

    public void startListening() {
        if (isListening) {
            Log.d(TAG, "Already listening");
            return;
        }

        if (!SpeechRecognizer.isRecognitionAvailable(context)) {
            Log.e(TAG, "Speech recognition not available");
            return;
        }

        Log.d(TAG, "Starting wake word detection...");
        
        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context);
        speechRecognizer.setRecognitionListener(new RecognitionListener() {
            @Override
            public void onReadyForSpeech(Bundle params) {
                Log.d(TAG, "Ready for speech");
            }

            @Override
            public void onBeginningOfSpeech() {
                Log.d(TAG, "Speech started");
            }

            @Override
            public void onRmsChanged(float rmsdB) {
                // Audio level changed
            }

            @Override
            public void onBufferReceived(byte[] buffer) {
                // Audio buffer received
            }

            @Override
            public void onEndOfSpeech() {
                Log.d(TAG, "Speech ended");
            }

            @Override
            public void onError(int error) {
                Log.d(TAG, "Recognition error: " + error);
                // Restart listening after error
                restartListening();
            }

            @Override
            public void onResults(Bundle results) {
                ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                if (matches != null) {
                    for (String match : matches) {
                        String lowerMatch = match.toLowerCase();
                        Log.d(TAG, "Heard: " + match);
                        
                        // Check for wake words
                        if (lowerMatch.contains("hey google") || 
                            lowerMatch.contains("ok google") ||
                            lowerMatch.contains("hey light") ||
                            lowerMatch.contains("ok light")) {
                            
                            Log.d(TAG, "✓ Wake word detected!");
                            if (listener != null) {
                                listener.onWakeWordDetected(match);
                            }
                            break;
                        }
                    }
                }
                
                // Restart listening
                restartListening();
            }

            @Override
            public void onPartialResults(Bundle partialResults) {
                // Partial results
            }

            @Override
            public void onEvent(int eventType, Bundle params) {
                // Event occurred
            }
        });

        startRecognition();
        isListening = true;
    }

    private void startRecognition() {
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, context.getPackageName());
        intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
        
        try {
            speechRecognizer.startListening(intent);
            Log.d(TAG, "Recognition started");
        } catch (Exception e) {
            Log.e(TAG, "Failed to start recognition", e);
        }
    }

    private void restartListening() {
        // Small delay before restarting
        new android.os.Handler().postDelayed(new Runnable() {
            @Override
            public void run() {
                if (isListening && speechRecognizer != null) {
                    startRecognition();
                }
            }
        }, 500);
    }

    public void stopListening() {
        Log.d(TAG, "Stopping wake word detection");
        isListening = false;
        
        if (speechRecognizer != null) {
            speechRecognizer.stopListening();
            speechRecognizer.destroy();
            speechRecognizer = null;
        }
    }
}

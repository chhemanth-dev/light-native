package com.lightnative;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import com.lightnative.app.MainActivity;

/**
 * Wake Word Service - Always-on listening for "Hey Google" / "Hey Light"
 * Runs in background even when app is closed
 */
public class WakeWordService extends Service {
    private static final String TAG = "WakeWordService";
    private static final String CHANNEL_ID = "light_wakeword_channel";
    private static final int NOTIFICATION_ID = 2000;
    
    private WakeWordDetector wakeWordDetector;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "WakeWordService created");
        
        createNotificationChannel();
        startForeground(NOTIFICATION_ID, createNotification());
        
        // Initialize wake word detector
        wakeWordDetector = new WakeWordDetector(this, new WakeWordDetector.WakeWordListener() {
            @Override
            public void onWakeWordDetected(String wakeWord) {
                Log.d(TAG, "Wake word detected: " + wakeWord);
                openApp();
            }
        });
        
        wakeWordDetector.startListening();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "WakeWordService started");
        return START_STICKY; // Restart if killed
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "WakeWordService destroyed");
        if (wakeWordDetector != null) {
            wakeWordDetector.stopListening();
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Light Voice Assistant",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Always listening for Hey Light / Hey Google");
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private Notification createNotification() {
        Intent intent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 
            0, 
            intent, 
            PendingIntent.FLAG_IMMUTABLE
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Light is listening")
            .setContentText("Say 'Hey Light' or 'Hey Google' to activate")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build();
    }

    private void openApp() {
        Intent intent = new Intent(this, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        intent.putExtra("wake_word_activated", true);
        startActivity(intent);
    }
}

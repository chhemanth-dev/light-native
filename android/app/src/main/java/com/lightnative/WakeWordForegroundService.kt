package com.lightnative

import android.app.*
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat

/**
 * Foreground service that keeps the wake-word SpeechRecognizer alive.
 *
 * Key fixes:
 *  - startForeground wrapped in try/catch (Android 14 can throw if delayed)
 *  - Uses START_NOT_STICKY on STOP action to avoid auto-restart issues
 */
class WakeWordForegroundService : Service() {

    companion object {
        const val CHANNEL_ID = "light_wake_word"
        const val NOTIFICATION_ID = 1001
        const val ACTION_START = "com.lightnative.WAKE_WORD_START"
        const val ACTION_STOP = "com.lightnative.WAKE_WORD_STOP"
        private const val TAG = "WakeWordFGService"
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        try {
            startForeground(NOTIFICATION_ID, buildNotification())
        } catch (e: Exception) {
            Log.w(TAG, "startForeground failed: ${e.message}")
            stopSelf()
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return when (intent?.action) {
            ACTION_STOP -> {
                stopSelf()
                START_NOT_STICKY
            }
            else -> START_STICKY
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        // Don't try to restart via broadcast on Android 14+ — it may crash
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            try {
                val restartIntent = Intent(applicationContext, BootReceiver::class.java)
                restartIntent.action = "com.lightnative.RESTART_WAKE_WORD"
                sendBroadcast(restartIntent)
            } catch (e: Exception) {
                Log.w(TAG, "Restart broadcast failed: ${e.message}")
            }
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Light — Always Listening",
                NotificationManager.IMPORTANCE_MIN
            ).apply {
                description = "Keeps Light listening for 'Hey Light'"
                setShowBadge(false)
                enableVibration(false)
                enableLights(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): Notification {
        val tapIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, tapIntent,
            PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Light is listening")
            .setContentText("Say \"Hey Light\" to activate")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .setOngoing(true)
            .setSilent(true)
            .build()
    }
}

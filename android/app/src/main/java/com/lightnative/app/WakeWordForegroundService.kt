package com.lightnative.app

import android.app.*
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat

class WakeWordForegroundService : Service() {

    companion object {
        const val CHANNEL_ID = "light_wake_word"
        const val NOTIFICATION_ID = 1001
        const val ACTION_START = "com.lightnative.WAKE_WORD_START"
        const val ACTION_STOP  = "com.lightnative.WAKE_WORD_STOP"
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        try { startForeground(NOTIFICATION_ID, buildNotification()) }
        catch (e: Exception) { Log.w("WakeWordFGService", "startForeground failed: ${e.message}"); stopSelf() }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return when (intent?.action) {
            ACTION_STOP -> { stopSelf(); START_NOT_STICKY }
            else -> START_STICKY
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(CHANNEL_ID, "Light — Always Listening", NotificationManager.IMPORTANCE_MIN).apply {
                setShowBadge(false); enableVibration(false); enableLights(false)
            }
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): Notification {
        val pi = PendingIntent.getActivity(this, 0, Intent(this, MainActivity::class.java), PendingIntent.FLAG_IMMUTABLE)
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Light is listening")
            .setContentText("Say \"Hey Light\" to activate")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentIntent(pi)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .setOngoing(true).setSilent(true).build()
    }
}

package com.lightnative.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.speech.tts.TextToSpeech
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import java.util.*

class ReminderReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val title = intent.getStringExtra("REMINDER_TITLE") ?: "Reminder"
        
        // Create notification channel (required for Android 8.0+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                "reminders",
                "Reminders",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Light Assistant Reminders"
                enableVibration(true)
                enableLights(true)
            }
            val notificationManager = context.getSystemService(NotificationManager::class.java)
            notificationManager?.createNotificationChannel(channel)
        }
        
        // Build and show notification
        val notification = NotificationCompat.Builder(context, "reminders")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("🔔 Reminder from Light")
            .setContentText(title)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setVibrate(longArrayOf(0, 500, 200, 500))
            .build()
        
        val notificationId = System.currentTimeMillis().toInt()
        NotificationManagerCompat.from(context).notify(notificationId, notification)
        
        // VOICE ANNOUNCEMENT - Speak the reminder
        speakReminder(context, title)
    }
    
    private fun speakReminder(context: Context, title: String) {
        try {
            var textToSpeech: TextToSpeech? = null
            textToSpeech = TextToSpeech(context) { status ->
                val tts = textToSpeech
                if (status == TextToSpeech.SUCCESS && tts != null) {
                    tts.language = Locale.US
                    tts.speak("Reminder: $title", TextToSpeech.QUEUE_FLUSH, null, "reminder")
                    
                    // Clean up after speaking
                    android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
                        tts.shutdown()
                    }, 5000)
                }
            }
        } catch (e: Exception) {
            android.util.Log.e("ReminderReceiver", "Failed to speak reminder", e)
        }
    }
}

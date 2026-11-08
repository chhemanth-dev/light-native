package com.lightnative.app

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import com.facebook.react.bridge.*
import java.util.*

class ReminderModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "ReminderModule"

    @ReactMethod
    fun setReminder(title: String, timestampMillis: Double, promise: Promise) {
        try {
            val alarmManager = reactContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            
            // Create intent for the reminder
            val intent = Intent(reactContext, ReminderReceiver::class.java).apply {
                putExtra("REMINDER_TITLE", title)
                putExtra("REMINDER_TIME", timestampMillis.toLong())
            }
            
            val pendingIntent = PendingIntent.getBroadcast(
                reactContext,
                timestampMillis.toInt(), // Use timestamp as unique request code
                intent,
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                } else {
                    PendingIntent.FLAG_UPDATE_CURRENT
                }
            )
            
            // Set exact alarm
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    timestampMillis.toLong(),
                    pendingIntent
                )
            } else {
                alarmManager.setExact(
                    AlarmManager.RTC_WAKEUP,
                    timestampMillis.toLong(),
                    pendingIntent
                )
            }
            
            promise.resolve("Reminder set for: $title")
        } catch (e: Exception) {
            promise.reject("REMINDER_ERROR", "Failed to set reminder: ${e.message}")
        }
    }

    @ReactMethod
    fun cancelReminder(timestampMillis: Double, promise: Promise) {
        try {
            val alarmManager = reactContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val intent = Intent(reactContext, ReminderReceiver::class.java)
            val pendingIntent = PendingIntent.getBroadcast(
                reactContext,
                timestampMillis.toInt(),
                intent,
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                } else {
                    PendingIntent.FLAG_UPDATE_CURRENT
                }
            )
            alarmManager.cancel(pendingIntent)
            promise.resolve("Reminder cancelled")
        } catch (e: Exception) {
            promise.reject("CANCEL_ERROR", "Failed to cancel reminder: ${e.message}")
        }
    }
}

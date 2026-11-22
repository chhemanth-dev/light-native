package com.lightnative.app

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.*

/**
 * ReminderModule - Sets alarms and notifications for reminders
 * Replaces the missing reminder functionality
 */
class ReminderModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "ReminderModule"

    /**
     * Set a reminder (alarm)
     */
    @ReactMethod
    fun setReminder(title: String, timestampMillis: Double, promise: Promise) {
        try {
            val context = reactContext
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            
            // Check if we can schedule exact alarms (Android 12+)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                if (!alarmManager.canScheduleExactAlarms()) {
                    // Need permission - open settings
                    val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM)
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    context.startActivity(intent)
                    promise.reject("PERMISSION_NEEDED", "Please allow Light to set exact alarms")
                    return
                }
            }
            
            // Create the alarm intent
            val intent = Intent(context, ReminderReceiver::class.java)
            intent.putExtra("title", title)
            intent.putExtra("timestamp", timestampMillis.toLong())
            
            val requestCode = (timestampMillis / 1000).toInt() // Use timestamp as unique ID
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                requestCode,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            
            // Schedule the alarm
            val triggerTime = timestampMillis.toLong()
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    triggerTime,
                    pendingIntent
                )
            } else {
                alarmManager.setExact(
                    AlarmManager.RTC_WAKEUP,
                    triggerTime,
                    pendingIntent
                )
            }
            
            android.util.Log.d("ReminderModule", "Reminder set: $title at $triggerTime")
            promise.resolve("Reminder set successfully")
        } catch (e: Exception) {
            android.util.Log.e("ReminderModule", "Failed to set reminder", e)
            promise.reject("SET_FAILED", "Failed to set reminder: ${e.message}", e)
        }
    }

    /**
     * Cancel a reminder
     */
    @ReactMethod
    fun cancelReminder(timestampMillis: Double, promise: Promise) {
        try {
            val context = reactContext
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            
            val intent = Intent(context, ReminderReceiver::class.java)
            val requestCode = (timestampMillis / 1000).toInt()
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                requestCode,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            
            alarmManager.cancel(pendingIntent)
            pendingIntent.cancel()
            
            android.util.Log.d("ReminderModule", "Reminder cancelled: $timestampMillis")
            promise.resolve("Reminder cancelled")
        } catch (e: Exception) {
            android.util.Log.e("ReminderModule", "Failed to cancel reminder", e)
            promise.reject("CANCEL_FAILED", "Failed to cancel reminder: ${e.message}", e)
        }
    }

    /**
     * Check if can schedule exact alarms (Android 12+)
     */
    @ReactMethod
    fun canScheduleExactAlarms(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val alarmManager = reactContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
                promise.resolve(alarmManager.canScheduleExactAlarms())
            } else {
                // On older Android, always can
                promise.resolve(true)
            }
        } catch (e: Exception) {
            promise.reject("CHECK_FAILED", "Failed to check alarm permission: ${e.message}", e)
        }
    }

    /**
     * Request exact alarm permission (Android 12+)
     */
    @ReactMethod
    fun requestExactAlarmPermission(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM)
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                reactContext.startActivity(intent)
                promise.resolve("Opened settings")
            } else {
                promise.resolve("Not needed on this Android version")
            }
        } catch (e: Exception) {
            promise.reject("REQUEST_FAILED", "Failed to open settings: ${e.message}", e)
        }
    }
}

package com.lightnative.app

import android.app.Notification
import android.content.Intent
import android.os.Bundle
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap

class NotificationListener : NotificationListenerService() {

    companion object {
        private const val TAG = "NotificationListener"
        
        // Apps to listen to
        private val MONITORED_APPS = setOf(
            "com.whatsapp",
            "com.instagram.android",
            "com.google.android.gm",
            "com.android.messaging",
            "com.google.android.apps.messaging",
            "com.facebook.orca",
            "com.snapchat.android",
            "com.twitter.android",
            "com.linkedin.android",
            "org.telegram.messenger",
            "com.discord"
        )
    }

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        try {
            val packageName = sbn.packageName
            
            // Only process notifications from monitored apps
            if (!MONITORED_APPS.contains(packageName)) {
                return
            }

            val notification = sbn.notification ?: return
            val extras = notification.extras ?: return

            // Extract notification details
            val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: ""
            val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""
            val bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString() ?: text
            val subText = extras.getCharSequence(Notification.EXTRA_SUB_TEXT)?.toString() ?: ""
            
            // Skip empty notifications
            if (title.isEmpty() && bigText.isEmpty()) {
                return
            }

            Log.d(TAG, "New notification from $packageName: $title - $bigText")

            // Send to React Native
            val data = Arguments.createMap().apply {
                putString("id", sbn.key)
                putString("package", packageName)
                putString("title", title)
                putString("text", bigText)
                putString("subText", subText)
                putDouble("timestamp", sbn.postTime.toDouble())
            }

            sendNotificationToReactNative(data)
        } catch (e: Exception) {
            Log.e(TAG, "Error processing notification", e)
        }
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification) {
        // Optional: handle notification removal
    }

    private fun sendNotificationToReactNative(data: WritableMap) {
        try {
            val intent = Intent(this, NotificationEventService::class.java).apply {
                putExtras(Arguments.toBundle(data) ?: Bundle())
            }
            
            val context = applicationContext
            HeadlessJsTaskService.acquireWakeLockNow(context)
            context.startService(intent)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send notification to React Native", e)
        }
    }
}

class NotificationEventService : HeadlessJsTaskService() {
    override fun getTaskConfig(intent: Intent): HeadlessJsTaskConfig? {
        return intent.extras?.let { extras ->
            HeadlessJsTaskConfig(
                "NotificationEvent",
                Arguments.fromBundle(extras),
                5000, // timeout
                true  // allow in foreground
            )
        }
    }
}

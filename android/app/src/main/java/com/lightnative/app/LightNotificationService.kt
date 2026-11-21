package com.lightnative.app

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log

class LightNotificationService : NotificationListenerService() {

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        super.onNotificationPosted(sbn)
        
        try {
            val packageName = sbn.packageName
            val notification = sbn.notification
            
            // Get notification details
            val title = notification.extras.getString("android.title") ?: ""
            val text = notification.extras.getCharSequence("android.text")?.toString() ?: ""
            
            Log.d("LightNotification", "Notification from $packageName: $title - $text")
            
            // You can send this to React Native via events if needed
            // For now, just logging
            
        } catch (e: Exception) {
            Log.e("LightNotification", "Error processing notification", e)
        }
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification) {
        super.onNotificationRemoved(sbn)
    }

    override fun onListenerConnected() {
        super.onListenerConnected()
        Log.d("LightNotification", "Notification Listener Connected")
    }

    override fun onListenerDisconnected() {
        super.onListenerDisconnected()
        Log.d("LightNotification", "Notification Listener Disconnected")
    }
}

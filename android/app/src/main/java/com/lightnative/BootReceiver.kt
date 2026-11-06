package com.lightnative

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log

/**
 * Starts WakeWordForegroundService after device reboot or app update.
 *
 * On Android 14+ (Samsung A06 5G), starting a foreground service from a
 * boot receiver throws ForegroundServiceStartNotAllowedException. We wrap
 * it in try/catch so the app doesn't crash — the service will start when
 * the user opens the app.
 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val validActions = setOf(
            Intent.ACTION_BOOT_COMPLETED,
            Intent.ACTION_MY_PACKAGE_REPLACED,
            "com.lightnative.RESTART_WAKE_WORD"
        )
        if (intent.action !in validActions) return

        try {
            val serviceIntent = Intent(context, WakeWordForegroundService::class.java).apply {
                action = WakeWordForegroundService.ACTION_START
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent)
            } else {
                context.startService(serviceIntent)
            }
        } catch (e: Exception) {
            // Android 14+ may block background foreground service starts.
            // This is expected — the service will start when the user opens the app.
            Log.w("BootReceiver", "Could not start wake-word service: ${e.message}")
        }
    }
}

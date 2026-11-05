package com.lightnative

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build

/**
 * Starts WakeWordForegroundService after device reboot or app update,
 * so "Hey Light" continues working without the user opening the app.
 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val validActions = setOf(
            Intent.ACTION_BOOT_COMPLETED,
            Intent.ACTION_MY_PACKAGE_REPLACED,
            "com.lightnative.RESTART_WAKE_WORD"
        )
        if (intent.action !in validActions) return

        val serviceIntent = Intent(context, WakeWordForegroundService::class.java).apply {
            action = WakeWordForegroundService.ACTION_START
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent)
        } else {
            context.startService(serviceIntent)
        }
    }
}

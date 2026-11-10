package com.lightnative.app

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import com.facebook.react.bridge.*
import kotlinx.coroutines.*

/**
 * Accessibility Auto-Click Module
 * Automates message sending across apps: WhatsApp, Instagram, Messenger, Telegram, SMS
 */
class AccessibilityAutoClickModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "AccessibilityAutoClickModule"

    companion object {
        private const val TAG = "AccessibilityAutoClick"
        
        // Package names for supported apps
        private val APP_PACKAGES = mapOf(
            "whatsapp" to "com.whatsapp",
            "instagram" to "com.instagram.android",
            "messenger" to "com.facebook.orca",
            "telegram" to "org.telegram.messenger",
            "sms" to "com.google.android.apps.messaging"
        )
    }

    /**
     * Send message via accessibility automation
     * Opens app → Finds contact → Types message → Clicks send
     */
    @ReactMethod
    fun sendMessage(app: String, recipient: String, message: String, promise: Promise) {
        try {
            val packageName = APP_PACKAGES[app.lowercase()]
            
            if (packageName == null) {
                promise.reject("UNSUPPORTED_APP", "App not supported: $app")
                return
            }

            // Check if accessibility service is enabled
            if (!isAccessibilityEnabled()) {
                promise.reject("ACCESSIBILITY_DISABLED", "Accessibility service is not enabled")
                return
            }

            // Step 1: Open the app
            val intent = reactContext.packageManager.getLaunchIntentForPackage(packageName)
            if (intent == null) {
                promise.reject("APP_NOT_FOUND", "App not installed: $app")
                return
            }

            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            reactContext.startActivity(intent)

            // Step 2: Wait for app to open, then find contact and send message
            // This is handled by the AccessibilityService (see below)
            
            // Store pending message for the service to handle
            pendingMessage = PendingMessage(packageName, recipient, message, promise)
            
            // Set timeout to reject if message doesn't send in 30 seconds
            GlobalScope.launch {
                delay(30000)
                if (pendingMessage?.promise == promise) {
                    pendingMessage?.promise?.reject("TIMEOUT", "Message sending timed out")
                    pendingMessage = null
                }
            }

        } catch (e: Exception) {
            promise.reject("SEND_ERROR", "Failed to send message: ${e.message}")
        }
    }

    /**
     * Check if accessibility service is enabled
     */
    @ReactMethod
    fun isEnabled(promise: Promise) {
        promise.resolve(isAccessibilityEnabled())
    }

    /**
     * Open accessibility settings
     */
    @ReactMethod
    fun openSettings() {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        reactContext.startActivity(intent)
    }

    private fun isAccessibilityEnabled(): Boolean {
        val serviceName = "${reactContext.packageName}/${LightAccessibilityService::class.java.canonicalName}"
        val enabledServices = Settings.Secure.getString(
            reactContext.contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: ""
        
        return enabledServices.contains(serviceName)
    }

    // Pending message data class
    data class PendingMessage(
        val packageName: String,
        val recipient: String,
        val message: String,
        val promise: Promise
    )

    companion object {
        var pendingMessage: PendingMessage? = null
    }
}

/**
 * Accessibility Service for automating UI interactions
 */
class LightAccessibilityService : AccessibilityService() {

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return

        // Check if we have a pending message to send
        val pending = AccessibilityAutoClickModule.pendingMessage ?: return
        
        // Handle based on which app is open
        when {
            event.packageName?.toString() == pending.packageName -> {
                handleMessageSending(event, pending)
            }
        }
    }

    private fun handleMessageSending(event: AccessibilityEvent, pending: AccessibilityAutoClickModule.PendingMessage) {
        try {
            val rootNode = rootInActiveWindow ?: return

            // Strategy varies by app
            when (pending.packageName) {
                "com.whatsapp" -> sendWhatsAppMessage(rootNode, pending)
                "com.instagram.android" -> sendInstagramMessage(rootNode, pending)
                "com.facebook.orca" -> sendMessengerMessage(rootNode, pending)
                "org.telegram.messenger" -> sendTelegramMessage(rootNode, pending)
                "com.google.android.apps.messaging" -> sendSMSMessage(rootNode, pending)
            }
        } catch (e: Exception) {
            pending.promise.reject("AUTOMATION_ERROR", "Failed: ${e.message}")
            AccessibilityAutoClickModule.pendingMessage = null
        }
    }

    private fun sendWhatsAppMessage(root: AccessibilityNodeInfo, pending: AccessibilityAutoClickModule.PendingMessage) {
        // 1. Find search box
        val searchBox = findNodeByText(root, "Search") ?: findNodeByResourceId(root, "search_contact")
        
        if (searchBox != null) {
            searchBox.performAction(AccessibilityNodeInfo.ACTION_CLICK)
            Thread.sleep(500)
            
            // 2. Type recipient name
            val editText = findNodeByClass(root, "android.widget.EditText")
            editText?.let {
                val args = Bundle()
                args.putString(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, pending.recipient)
                it.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args)
                Thread.sleep(1000)
            }
            
            // 3. Click first result
            val firstResult = findNodeByClass(root, "android.widget.TextView")
            firstResult?.parent?.performAction(AccessibilityNodeInfo.ACTION_CLICK)
            Thread.sleep(1000)
            
            // 4. Type message
            val messageBox = findNodeByResourceId(root, "entry")
            messageBox?.let {
                val args = Bundle()
                args.putString(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, pending.message)
                it.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args)
                Thread.sleep(500)
            }
            
            // 5. Click send button
            val sendButton = findNodeByResourceId(root, "send") ?: findNodeByDescription(root, "Send")
            if (sendButton != null) {
                sendButton.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                pending.promise.resolve("Message sent successfully via WhatsApp")
                AccessibilityAutoClickModule.pendingMessage = null
            }
        }
    }

    private fun sendInstagramMessage(root: AccessibilityNodeInfo, pending: AccessibilityAutoClickModule.PendingMessage) {
        // Similar logic for Instagram Direct
        pending.promise.resolve("Instagram message sending - implementation in progress")
        AccessibilityAutoClickModule.pendingMessage = null
    }

    private fun sendMessengerMessage(root: AccessibilityNodeInfo, pending: AccessibilityAutoClickModule.PendingMessage) {
        // Similar logic for Messenger
        pending.promise.resolve("Messenger message sending - implementation in progress")
        AccessibilityAutoClickModule.pendingMessage = null
    }

    private fun sendTelegramMessage(root: AccessibilityNodeInfo, pending: AccessibilityAutoClickModule.PendingMessage) {
        // Similar logic for Telegram
        pending.promise.resolve("Telegram message sending - implementation in progress")
        AccessibilityAutoClickModule.pendingMessage = null
    }

    private fun sendSMSMessage(root: AccessibilityNodeInfo, pending: AccessibilityAutoClickModule.PendingMessage) {
        // Similar logic for SMS
        pending.promise.resolve("SMS sending - implementation in progress")
        AccessibilityAutoClickModule.pendingMessage = null
    }

    // Helper functions
    private fun findNodeByText(root: AccessibilityNodeInfo, text: String): AccessibilityNodeInfo? {
        if (root.text?.toString()?.contains(text, ignoreCase = true) == true) {
            return root
        }
        for (i in 0 until root.childCount) {
            val child = root.getChild(i) ?: continue
            val found = findNodeByText(child, text)
            if (found != null) return found
        }
        return null
    }

    private fun findNodeByResourceId(root: AccessibilityNodeInfo, id: String): AccessibilityNodeInfo? {
        if (root.viewIdResourceName?.contains(id) == true) {
            return root
        }
        for (i in 0 until root.childCount) {
            val child = root.getChild(i) ?: continue
            val found = findNodeByResourceId(child, id)
            if (found != null) return found
        }
        return null
    }

    private fun findNodeByClass(root: AccessibilityNodeInfo, className: String): AccessibilityNodeInfo? {
        if (root.className?.toString() == className) {
            return root
        }
        for (i in 0 until root.childCount) {
            val child = root.getChild(i) ?: continue
            val found = findNodeByClass(child, className)
            if (found != null) return found
        }
        return null
    }

    private fun findNodeByDescription(root: AccessibilityNodeInfo, desc: String): AccessibilityNodeInfo? {
        if (root.contentDescription?.toString()?.contains(desc, ignoreCase = true) == true) {
            return root
        }
        for (i in 0 until root.childCount) {
            val child = root.getChild(i) ?: continue
            val found = findNodeByDescription(child, desc)
            if (found != null) return found
        }
        return null
    }

    override fun onInterrupt() {
        // Handle service interruption
    }
}

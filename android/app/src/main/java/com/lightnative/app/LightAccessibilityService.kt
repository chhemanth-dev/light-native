package com.lightnative.app

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path
import android.graphics.Rect
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

// Screen content is only readable during a user-started session (see beginSession). Never add background reading.
class LightAccessibilityService : AccessibilityService() {

    companion object {
        @Volatile
        var instance: LightAccessibilityService? = null

        private const val TAG = "LightAccessibility"

        @Volatile
        var sessionExpiresAt: Long = 0L

        fun isSessionActive(): Boolean = System.currentTimeMillis() < sessionExpiresAt

        fun beginSession(durationMs: Long) {
            sessionExpiresAt = System.currentTimeMillis() + durationMs
        }

        fun endSession() {
            sessionExpiresAt = 0L
        }
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
    }

    override fun onUnbind(intent: android.content.Intent?): Boolean {
        instance = null
        endSession()
        return super.onUnbind(intent)
    }

    override fun onDestroy() {
        instance = null
        endSession()
        super.onDestroy()
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {}

    override fun onInterrupt() {}

    /** Texts, content descriptions and view ids of visible nodes (passwords skipped). */
    fun getScreenText(): List<String> {
        if (!isSessionActive()) {
            Log.w(TAG, "screen access refused: no active session")
            return emptyList()
        }
        val result = mutableListOf<String>()
        val root = rootInActiveWindow ?: return result
        collectText(root, result)
        root.recycle()
        return result
    }

    private fun collectText(node: AccessibilityNodeInfo, out: MutableList<String>) {
        if (!node.isVisibleToUser) return
        if (!node.isPassword) {
            node.text?.toString()?.takeIf { it.isNotBlank() }?.let { out.add(it) }
            node.contentDescription?.toString()?.takeIf { it.isNotBlank() }?.let { out.add(it) }
            node.viewIdResourceName?.takeIf { it.isNotBlank() }?.let { out.add(it) }
        }
        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            collectText(child, out)
            child.recycle()
        }
    }

    /** Finds the first node whose text or content description contains [text] and taps it. */
    fun tapText(text: String): Boolean {
        if (!isSessionActive()) {
            Log.w(TAG, "screen access refused: no active session")
            return false
        }
        val root = rootInActiveWindow ?: return false
        val target = findNodeContaining(root, text)
        root.recycle()
        if (target == null) return false

        if (target.isClickable) {
            val ok = target.performAction(AccessibilityNodeInfo.ACTION_CLICK)
            target.recycle()
            return ok
        }

        val rect = Rect()
        target.getBoundsInScreen(rect)
        target.recycle()
        return tapAt(rect.centerX().toFloat(), rect.centerY().toFloat())
    }

    private fun findNodeContaining(node: AccessibilityNodeInfo, text: String): AccessibilityNodeInfo? {
        val matches =
            node.text?.toString()?.contains(text, ignoreCase = true) == true ||
                node.contentDescription?.toString()?.contains(text, ignoreCase = true) == true
        if (matches && node.isVisibleToUser) return AccessibilityNodeInfo.obtain(node)

        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            val found = findNodeContaining(child, text)
            child.recycle()
            if (found != null) return found
        }
        return null
    }

    /** Dispatches a 1ms tap at screen coordinates (x, y). */
    fun tapAt(x: Float, y: Float, callback: ((Boolean) -> Unit)? = null): Boolean {
        if (!isSessionActive()) {
            Log.w(TAG, "screen access refused: no active session")
            callback?.invoke(false)
            return false
        }
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
            callback?.invoke(false)
            return false
        }
        val path = Path().apply { moveTo(x, y) }
        val stroke = GestureDescription.StrokeDescription(path, 0L, 1L)
        val gesture = GestureDescription.Builder().addStroke(stroke).build()
        val dispatched = dispatchGesture(gesture, object : GestureResultCallback() {
            override fun onCompleted(gestureDescription: GestureDescription?) {
                callback?.invoke(true)
            }

            override fun onCancelled(gestureDescription: GestureDescription?) {
                callback?.invoke(false)
            }
        }, null)
        if (!dispatched) callback?.invoke(false)
        return dispatched
    }

    /** "down" scrolls forward, "up" scrolls backward on the first scrollable node. */
    fun scroll(direction: String): Boolean {
        if (!isSessionActive()) {
            Log.w(TAG, "screen access refused: no active session")
            return false
        }
        val action = when (direction.lowercase()) {
            "down" -> AccessibilityNodeInfo.ACTION_SCROLL_FORWARD
            "up" -> AccessibilityNodeInfo.ACTION_SCROLL_BACKWARD
            else -> return false
        }
        val root = rootInActiveWindow ?: return false
        val scrollable = findScrollable(root)
        root.recycle()
        if (scrollable == null) return false
        val ok = scrollable.performAction(action)
        scrollable.recycle()
        return ok
    }

    private fun findScrollable(node: AccessibilityNodeInfo): AccessibilityNodeInfo? {
        if (node.isScrollable) return AccessibilityNodeInfo.obtain(node)
        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            val found = findScrollable(child)
            child.recycle()
            if (found != null) return found
        }
        return null
    }

    /** Sets text on the focused editable field. Refuses password fields. */
    fun typeText(text: String): Boolean {
        if (!isSessionActive()) {
            Log.w(TAG, "screen access refused: no active session")
            return false
        }
        val root = rootInActiveWindow ?: return false
        val focused = root.findFocus(AccessibilityNodeInfo.FOCUS_INPUT)
        root.recycle()
        if (focused == null) return false
        if (focused.isPassword || !focused.isEditable) {
            focused.recycle()
            return false
        }
        val args = Bundle().apply {
            putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, text)
        }
        val ok = focused.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args)
        focused.recycle()
        return ok
    }

    /** Runs a system action: back, home, recents, or notifications. */
    fun globalAction(name: String): Boolean {
        if (!isSessionActive()) {
            Log.w(TAG, "screen access refused: no active session")
            return false
        }
        val action = when (name.lowercase()) {
            "back" -> GLOBAL_ACTION_BACK
            "home" -> GLOBAL_ACTION_HOME
            "recents" -> GLOBAL_ACTION_RECENTS
            "notifications" -> GLOBAL_ACTION_NOTIFICATIONS
            else -> return false
        }
        return performGlobalAction(action)
    }
}

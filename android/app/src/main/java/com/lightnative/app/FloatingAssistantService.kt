package com.lightnative.app

import android.app.Service
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.ImageView
import android.widget.TextView
import com.lightnative.app.R

/**
 * Floating Assistant Overlay
 * Shows a floating orb that stays on top of ALL apps
 * Tap it to give commands without switching apps!
 */
class FloatingAssistantService : Service() {

    private var windowManager: WindowManager? = null
    private var floatingView: View? = null
    private var params: WindowManager.LayoutParams? = null
    
    private var initialX = 0
    private var initialY = 0
    private var initialTouchX = 0f
    private var initialTouchY = 0f

    companion object {
        const val ACTION_START = "com.lightnative.START_FLOATING"
        const val ACTION_STOP = "com.lightnative.STOP_FLOATING"
        const val ACTION_SHOW = "com.lightnative.SHOW_FLOATING"
        const val ACTION_HIDE = "com.lightnative.HIDE_FLOATING"
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> startFloating()
            ACTION_STOP -> stopFloating()
            ACTION_SHOW -> showFloating()
            ACTION_HIDE -> hideFloating()
        }
        return START_STICKY
    }

    private fun startFloating() {
        if (floatingView != null) return // Already started

        // Inflate the floating view
        floatingView = LayoutInflater.from(this).inflate(R.layout.floating_assistant, null)

        // Set up window parameters
        val layoutFlag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            layoutFlag,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = 0
            y = 100
        }

        // Get window manager
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        windowManager?.addView(floatingView, params)

        // Set up touch listener for drag and tap
        floatingView?.findViewById<View>(R.id.floating_orb)?.setOnTouchListener { view, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = params?.x ?: 0
                    initialY = params?.y ?: 0
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    params?.x = initialX + (event.rawX - initialTouchX).toInt()
                    params?.y = initialY + (event.rawY - initialTouchY).toInt()
                    windowManager?.updateViewLayout(floatingView, params)
                    true
                }
                MotionEvent.ACTION_UP -> {
                    val deltaX = event.rawX - initialTouchX
                    val deltaY = event.rawY - initialTouchY
                    
                    // If minimal movement, treat as tap
                    if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
                        onFloatingOrbTapped()
                    }
                    true
                }
                else -> false
            }
        }
    }

    private fun stopFloating() {
        if (floatingView != null) {
            windowManager?.removeView(floatingView)
            floatingView = null
        }
        stopSelf()
    }

    private fun showFloating() {
        floatingView?.visibility = View.VISIBLE
    }

    private fun hideFloating() {
        floatingView?.visibility = View.GONE
    }

    private fun onFloatingOrbTapped() {
        // Broadcast tap event to React Native
        val intent = Intent("com.lightnative.FLOATING_ORB_TAPPED")
        sendBroadcast(intent)
        
        // Show listening indicator
        floatingView?.findViewById<TextView>(R.id.floating_status)?.text = "Listening..."
    }

    fun updateStatus(status: String) {
        floatingView?.findViewById<TextView>(R.id.floating_status)?.text = status
    }

    override fun onDestroy() {
        super.onDestroy()
        stopFloating()
    }
}

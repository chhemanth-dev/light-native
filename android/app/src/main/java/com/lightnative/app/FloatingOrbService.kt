package com.lightnative.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.provider.Settings
import android.view.Gravity
import android.view.WindowManager
import android.widget.LinearLayout
import android.widget.TextView
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule

class FloatingOrbService : Service() {

  companion object {
    private const val CHANNEL_ID = "light_floating"
    private const val NOTIFICATION_ID = 4711

    @Volatile var reactContext: ReactApplicationContext? = null
    @Volatile var instance: FloatingOrbService? = null

    private val mainHandler = Handler(Looper.getMainLooper())

    fun show() {
      mainHandler.post { instance?.setOrbVisible(true) }
    }

    fun hide() {
      mainHandler.post { instance?.setOrbVisible(false) }
    }

    fun updateStatus(text: String) {
      mainHandler.post { instance?.setStatus(text) }
    }
  }

  private var windowManager: WindowManager? = null
  private var root: LinearLayout? = null
  private var statusView: TextView? = null
  private var orbView: TextView? = null

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onCreate() {
    super.onCreate()
    if (!Settings.canDrawOverlays(this)) {
      stopSelf()
      return
    }
    try {
      startAsForeground()
    } catch (e: Exception) {
      stopSelf()
      return
    }

    val wm = getSystemService(WINDOW_SERVICE) as WindowManager
    windowManager = wm

    val density = resources.displayMetrics.density

    val status = TextView(this).apply {
      text = "Light ready"
      setTextColor(Color.WHITE)
      textSize = 12f
      setPadding(
        (10 * density).toInt(), (4 * density).toInt(),
        (10 * density).toInt(), (4 * density).toInt()
      )
      background = GradientDrawable().apply {
        cornerRadius = 12 * density
        setColor(0xB3000000.toInt())
      }
    }

    val orbSize = (64 * density).toInt()
    val orb = TextView(this).apply {
      text = "Light"
      setTextColor(Color.WHITE)
      textSize = 14f
      gravity = Gravity.CENTER
      layoutParams = LinearLayout.LayoutParams(orbSize, orbSize)
      background = GradientDrawable().apply {
        shape = GradientDrawable.OVAL
        setColor(0xFF6A4CFF.toInt())
      }
      setOnClickListener { emitOrbTapped() }
    }

    val container = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.END
      addView(status)
      addView(orb)
    }

    val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
    } else {
      WindowManager.LayoutParams.TYPE_PHONE
    }

    val params = WindowManager.LayoutParams(
      WindowManager.LayoutParams.WRAP_CONTENT,
      WindowManager.LayoutParams.WRAP_CONTENT,
      type,
      WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
      PixelFormat.TRANSLUCENT
    ).apply {
      gravity = Gravity.TOP or Gravity.END
      x = (16 * density).toInt()
      y = (200 * density).toInt()
    }

    wm.addView(container, params)
    root = container
    statusView = status
    orbView = orb
    instance = this
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int = START_NOT_STICKY

  override fun onDestroy() {
    root?.let {
      try {
        windowManager?.removeView(it)
      } catch (e: Exception) {
        // View was already removed or never attached; nothing else to clean up.
      }
    }
    root = null
    statusView = null
    orbView = null
    instance = null
    super.onDestroy()
  }

  private fun startAsForeground() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val nm = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
      nm.createNotificationChannel(
        NotificationChannel(CHANNEL_ID, "Light floating assistant", NotificationManager.IMPORTANCE_LOW)
      )
    }
    val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification.Builder(this, CHANNEL_ID)
    } else {
      Notification.Builder(this)
    }
    val notification = builder
      .setContentTitle("Light")
      .setContentText("Floating assistant is running")
      .setSmallIcon(android.R.drawable.ic_btn_speak_now)
      .setOngoing(true)
      .build()
    startForeground(NOTIFICATION_ID, notification)
  }

  internal fun setOrbVisible(visible: Boolean) {
    root?.visibility = if (visible) android.view.View.VISIBLE else android.view.View.GONE
  }

  internal fun setStatus(text: String) {
    statusView?.text = text
  }

  private fun emitOrbTapped() {
    val ctx = reactContext ?: return
    if (!ctx.hasActiveReactInstance()) return
    ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      ?.emit("FLOATING_ORB_TAPPED", null)
  }
}

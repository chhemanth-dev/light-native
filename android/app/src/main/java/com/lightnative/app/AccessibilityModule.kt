package com.lightnative.app

import android.content.*
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import com.facebook.react.bridge.*
import org.json.JSONObject

/**
 * AccessibilityModule - Core bridge for hands-free phone control
 * Enables Light to actually DO things (open apps, URLs, control UI)
 */
class AccessibilityModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val ACTION_TIMEOUT_MS = 5000L
    }

    private var pendingActionPromise: Promise? = null
    private val actionTimeoutHandler = Handler(Looper.getMainLooper())

    override fun getName(): String = "AccessibilityModule"

    override fun initialize() {
        super.initialize()
        // Register broadcast receiver to get results from accessibility service
        val filter = IntentFilter("com.lightnative.app.ACCESSIBILITY_RESULT")
        reactContext.registerReceiver(actionResultReceiver, filter)
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        try {
            reactContext.unregisterReceiver(actionResultReceiver)
        } catch (e: Exception) {
            // Receiver already unregistered
        }
    }

    private val actionResultReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            val success = intent.getBooleanExtra("success", false)
            val message = intent.getStringExtra("message") ?: "Unknown result"
            val screenText = intent.getStringArrayListExtra("screenText")

            actionTimeoutHandler.removeCallbacksAndMessages(null)

            if (success) {
                if (screenText != null) {
                    val map = WritableNativeMap()
                    map.putBoolean("success", true)
                    map.putString("message", message)
                    val textArray = WritableNativeArray()
                    screenText.forEach { textArray.pushString(it) }
                    map.putArray("screenText", textArray)
                    pendingActionPromise?.resolve(map)
                } else {
                    pendingActionPromise?.resolve(message)
                }
            } else {
                pendingActionPromise?.reject("ACTION_FAILED", message)
            }
            pendingActionPromise = null
        }
    }

    private fun timeoutAction() {
        pendingActionPromise?.reject("TIMEOUT", "Action timed out after ${ACTION_TIMEOUT_MS}ms")
        pendingActionPromise = null
    }

    /**
     * Open an app by package name
     */
    @ReactMethod
    fun openApp(packageName: String, promise: Promise) {
        try {
            val intent = reactContext.packageManager.getLaunchIntentForPackage(packageName)
            if (intent != null) {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                reactContext.startActivity(intent)
                promise.resolve("Opened $packageName")
            } else {
                promise.reject("APP_NOT_FOUND", "App $packageName is not installed")
            }
        } catch (e: Exception) {
            promise.reject("OPEN_FAILED", "Failed to open app: ${e.message}", e)
        }
    }

    /**
     * Open a URL in the default browser
     */
    @ReactMethod
    fun openURL(url: String, promise: Promise) {
        try {
            var finalUrl = url
            if (!url.startsWith("http://") && !url.startsWith("https://")) {
                finalUrl = "https://$url"
            }
            
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(finalUrl))
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactContext.startActivity(intent)
            promise.resolve("Opened URL: $finalUrl")
        } catch (e: Exception) {
            promise.reject("URL_FAILED", "Failed to open URL: ${e.message}", e)
        }
    }

    /**
     * Open Google search
     */
    @ReactMethod
    fun googleSearch(query: String, promise: Promise) {
        try {
            val encodedQuery = Uri.encode(query)
            val url = "https://www.google.com/search?q=$encodedQuery"
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactContext.startActivity(intent)
            promise.resolve("Searching for: $query")
        } catch (e: Exception) {
            promise.reject("SEARCH_FAILED", "Failed to search: ${e.message}", e)
        }
    }

    /**
     * Make a phone call
     */
    @ReactMethod
    fun makePhoneCall(phoneNumber: String, promise: Promise) {
        try {
            val intent = Intent(Intent.ACTION_CALL)
            intent.data = Uri.parse("tel:$phoneNumber")
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactContext.startActivity(intent)
            promise.resolve("Calling $phoneNumber")
        } catch (e: SecurityException) {
            promise.reject("PERMISSION_DENIED", "Phone call permission not granted", e)
        } catch (e: Exception) {
            promise.reject("CALL_FAILED", "Failed to make call: ${e.message}", e)
        }
    }

    /**
     * Open SMS app with optional number and message
     */
    @ReactMethod
    fun sendSMS(phoneNumber: String?, message: String?, promise: Promise) {
        try {
            val intent = Intent(Intent.ACTION_VIEW)
            
            if (phoneNumber != null) {
                intent.data = Uri.parse("sms:$phoneNumber")
            } else {
                intent.data = Uri.parse("sms:")
            }
            
            if (message != null) {
                intent.putExtra("sms_body", message)
            }
            
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactContext.startActivity(intent)
            promise.resolve("Opened SMS")
        } catch (e: Exception) {
            promise.reject("SMS_FAILED", "Failed to open SMS: ${e.message}", e)
        }
    }

    /**
     * Check if an app is installed
     */
    @ReactMethod
    fun isAppInstalled(packageName: String, promise: Promise) {
        try {
            reactContext.packageManager.getPackageInfo(packageName, 0)
            promise.resolve(true)
        } catch (e: PackageManager.NameNotFoundException) {
            promise.resolve(false)
        } catch (e: Exception) {
            promise.reject("CHECK_FAILED", "Failed to check app: ${e.message}", e)
        }
    }

    /**
     * Get list of installed apps (popular ones Light knows about)
     */
    @ReactMethod
    fun getInstalledApps(promise: Promise) {
        try {
            val knownApps = mapOf(
                "com.google.android.youtube" to "YouTube",
                "com.spotify.music" to "Spotify",
                "com.whatsapp" to "WhatsApp",
                "com.instagram.android" to "Instagram",
                "com.facebook.katana" to "Facebook",
                "com.facebook.orca" to "Messenger",
                "com.twitter.android" to "Twitter",
                "com.google.android.gm" to "Gmail",
                "com.google.android.apps.maps" to "Maps",
                "com.android.chrome" to "Chrome",
                "com.google.android.apps.photos" to "Photos",
                "com.amazon.mShop.android.shopping" to "Amazon",
                "com.netflix.mediaclient" to "Netflix",
                "com.google.android.youtube.tv" to "YouTube TV",
                "com.android.camera2" to "Camera"
            )

            val installedApps = WritableNativeArray()
            val pm = reactContext.packageManager

            for ((packageName, appName) in knownApps) {
                try {
                    pm.getPackageInfo(packageName, 0)
                    val app = WritableNativeMap()
                    app.putString("packageName", packageName)
                    app.putString("appName", appName)
                    installedApps.pushMap(app)
                } catch (e: PackageManager.NameNotFoundException) {
                    // App not installed, skip
                }
            }

            promise.resolve(installedApps)
        } catch (e: Exception) {
            promise.reject("GET_APPS_FAILED", "Failed to get installed apps: ${e.message}", e)
        }
    }

    /**
     * Check if accessibility service is enabled
     */
    @ReactMethod
    fun isAccessibilityEnabled(promise: Promise) {
        try {
            val enabled = isAccessibilityServiceEnabled(reactContext, LightAccessibilityService::class.java)
            promise.resolve(enabled)
        } catch (e: Exception) {
            promise.reject("CHECK_FAILED", "Failed to check accessibility: ${e.message}", e)
        }
    }

    /**
     * Open accessibility settings
     */
    @ReactMethod
    fun openAccessibilitySettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactContext.startActivity(intent)
            promise.resolve("Opened accessibility settings")
        } catch (e: Exception) {
            promise.reject("OPEN_FAILED", "Failed to open settings: ${e.message}", e)
        }
    }

    /**
     * Request accessibility permission to perform actions
     */
    @ReactMethod
    fun requestAccessibilityPermission(promise: Promise) {
        try {
            val enabled = isAccessibilityServiceEnabled(reactContext, LightAccessibilityService::class.java)
            if (enabled) {
                promise.resolve("Already enabled")
                return
            }

            // Open settings for user to enable
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactContext.startActivity(intent)
            promise.resolve("Opened settings - please enable Light")
        } catch (e: Exception) {
            promise.reject("REQUEST_FAILED", "Failed to request permission: ${e.message}", e)
        }
    }

    /**
     * Perform UI action (requires accessibility service)
     */
    @ReactMethod
    fun performAction(action: String, params: ReadableMap?, promise: Promise) {
        try {
            val enabled = isAccessibilityServiceEnabled(reactContext, LightAccessibilityService::class.java)
            if (!enabled) {
                promise.reject("NO_PERMISSION", "Accessibility service not enabled")
                return
            }

            val service = LightAccessibilityService.instance
            if (service == null) {
                promise.reject("SERVICE_UNAVAILABLE", "Accessibility service not running")
                return
            }

            // Check session
            if (!LightAccessibilityService.isSessionActive()) {
                // Start a 30-second session for this action
                LightAccessibilityService.beginSession(30000)
            }

            // Store promise for async result
            if (pendingActionPromise != null) {
                promise.reject("BUSY", "Another action is in progress")
                return
            }
            pendingActionPromise = promise

            // Set timeout
            actionTimeoutHandler.postDelayed({ timeoutAction() }, ACTION_TIMEOUT_MS)

            // Execute action based on type
            Handler(Looper.getMainLooper()).post {
                executeAccessibilityAction(service, action, params)
            }

        } catch (e: Exception) {
            actionTimeoutHandler.removeCallbacksAndMessages(null)
            pendingActionPromise = null
            promise.reject("ACTION_FAILED", "Failed to perform action: ${e.message}", e)
        }
    }

    private fun executeAccessibilityAction(service: LightAccessibilityService, action: String, params: ReadableMap?) {
        try {
            val result: Boolean
            val message: String
            var screenText: List<String>? = null

            when (action.lowercase()) {
                "click" -> {
                    val text = params?.getString("text") ?: ""
                    result = service.tapText(text)
                    message = if (result) "Clicked '$text'" else "Could not find '$text'"
                }
                "scroll_down" -> {
                    result = service.scroll("down")
                    message = if (result) "Scrolled down" else "No scrollable content"
                }
                "scroll_up" -> {
                    result = service.scroll("up")
                    message = if (result) "Scrolled up" else "No scrollable content"
                }
                "type_text" -> {
                    val text = params?.getString("text") ?: ""
                    result = service.typeText(text)
                    message = if (result) "Typed text" else "No focused text field"
                }
                "back" -> {
                    result = service.globalAction("back")
                    message = if (result) "Pressed back" else "Back action failed"
                }
                "home" -> {
                    result = service.globalAction("home")
                    message = if (result) "Went home" else "Home action failed"
                }
                "read_screen" -> {
                    screenText = service.getScreenText()
                    result = true
                    message = "Read ${screenText.size} elements"
                }
                else -> {
                    result = false
                    message = "Unknown action: $action"
                }
            }

            // Send result back
            val intent = Intent("com.lightnative.app.ACCESSIBILITY_RESULT")
            intent.putExtra("success", result)
            intent.putExtra("message", message)
            if (screenText != null) {
                intent.putStringArrayListExtra("screenText", ArrayList(screenText))
            }
            reactContext.sendBroadcast(intent)

        } catch (e: Exception) {
            val intent = Intent("com.lightnative.app.ACCESSIBILITY_RESULT")
            intent.putExtra("success", false)
            intent.putExtra("message", "Action error: ${e.message}")
            reactContext.sendBroadcast(intent)
        }
    }

    /**
     * Helper: Check if accessibility service is enabled
     */
    private fun isAccessibilityServiceEnabled(context: Context, service: Class<*>): Boolean {
        val expectedComponentName = ComponentName(context, service)
        val enabledServicesSetting = Settings.Secure.getString(
            context.contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: return false

        val colonSplitter = enabledServicesSetting.split(":")
        return colonSplitter.any { componentNameString ->
            val enabledService = ComponentName.unflattenFromString(componentNameString)
            enabledService != null && enabledService == expectedComponentName
        }
    }
}

package com.lightnative.app

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.provider.Settings
import com.facebook.react.bridge.*

/**
 * AccessibilityModule - Core bridge for hands-free phone control
 * Enables Light to actually DO things (open apps, URLs, control UI)
 */
class AccessibilityModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "AccessibilityModule"

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

            // Send action to accessibility service
            val intent = Intent("com.lightnative.app.ACCESSIBILITY_ACTION")
            intent.putExtra("action", action)
            if (params != null) {
                intent.putExtra("params", params.toHashMap().toString())
            }
            reactContext.sendBroadcast(intent)

            promise.resolve("Action sent: $action")
        } catch (e: Exception) {
            promise.reject("ACTION_FAILED", "Failed to perform action: ${e.message}", e)
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

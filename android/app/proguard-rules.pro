# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Expo modules
-keep class expo.modules.** { *; }
-keep class expo.modules.notifications.** { *; }

# Notification Listener Module (custom native module)
-keep class com.lightnative.app.NotificationListener { *; }
-keep class com.lightnative.app.NotificationListenerModule { *; }
-keep class com.lightnative.app.NotificationEventService { *; }
-keep class com.lightnative.app.ReminderReceiver { *; }

# Keep all native modules
-keep class * extends com.facebook.react.bridge.NativeModule { *; }
-keep class * extends com.facebook.react.bridge.ReactContextBaseJavaModule { *; }

# Keep notification-related classes
-keep class * extends android.service.notification.NotificationListenerService { *; }
-keep class android.app.Notification { *; }
-keep class android.app.NotificationManager { *; }

# SQLite
-keep class net.sqlcipher.** { *; }
-keep class net.sqlcipher.database.** { *; }

# Add any project specific keep options here:


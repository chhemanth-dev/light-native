# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Light custom modules — never strip these
-keep class com.lightnative.** { *; }

# AICore / Gemini Nano
-keep class com.google.android.gms.aicore.** { *; }
-keep class com.google.android.aicore.** { *; }

# AndroidX
-keep class androidx.** { *; }

# Expo
-keep class expo.modules.** { *; }

# Keep enums
-keepclassmembers enum * { *; }

# Keep Parcelables
-keep class * implements android.os.Parcelable { *; }

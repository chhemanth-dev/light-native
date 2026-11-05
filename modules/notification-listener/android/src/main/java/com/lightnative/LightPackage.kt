package com.lightnative

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/**
 * Registers all custom native modules with React Native.
 * Add this package in MainApplication.kt → getPackages().
 */
class LightPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
        listOf(
            NotificationListenerModule(reactContext),
            GeminiNanoModule(reactContext),
            WakeWordModule(reactContext),
            SpeechModule(reactContext),
        )

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
        emptyList()
}

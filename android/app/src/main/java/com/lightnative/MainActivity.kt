package com.lightnative

import com.lightnative.app.BuildConfig
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {
    override fun getMainComponentName(): String = "main"

    override fun createReactActivityDelegate(): ReactActivityDelegate {
        // Try to use Expo's ReactActivityDelegateWrapper via reflection
        // If not available, fall back to the standard delegate
        return try {
            val wrapperClass = Class.forName("expo.modules.ReactActivityDelegateWrapper")
            val constructor = wrapperClass.getConstructor(
                android.app.Activity::class.java,
                Boolean::class.javaPrimitiveType,
                ReactActivityDelegate::class.java
            )
            constructor.newInstance(
                this,
                BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
                DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
            ) as ReactActivityDelegate
        } catch (e: Exception) {
            // Expo wrapper not on classpath — use standard delegate
            DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
        }
    }
}

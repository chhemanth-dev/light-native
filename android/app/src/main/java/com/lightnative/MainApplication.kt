package com.lightnative

import android.app.Application
import android.content.res.Configuration
import com.lightnative.app.BuildConfig
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.soloader.SoLoader

class MainApplication : Application(), ReactApplication {

    override val reactNativeHost: ReactNativeHost =
        object : DefaultReactNativeHost(this) {
            override fun getPackages(): List<ReactPackage> =
                PackageList(this).packages.apply {
                    add(LightPackage())
                }

            override fun getJSMainModuleName(): String = "index"

            override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

            override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
            override val isHermesEnabled: Boolean  = BuildConfig.IS_HERMES_ENABLED
        }

    override val reactHost: ReactHost
        get() = getDefaultReactHost(applicationContext, reactNativeHost)

    override fun onCreate() {
        super.onCreate()
        SoLoader.init(this, false)
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            load()
        }
        // Initialize Expo modules via reflection — avoids compile-time dependency
        // on expo-modules-core while still initializing Expo at runtime
        try {
            val dispatcher = Class.forName("expo.modules.ApplicationLifecycleDispatcher")
            val method = dispatcher.getDeclaredMethod("onApplicationCreate", Application::class.java)
            method.invoke(dispatcher.getDeclaredField("INSTANCE").get(null), this)
        } catch (e: Exception) {
            // Expo modules not available — app will work without them
        }
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        try {
            val dispatcher = Class.forName("expo.modules.ApplicationLifecycleDispatcher")
            val method = dispatcher.getDeclaredMethod("onConfigurationChanged", Application::class.java, Configuration::class.java)
            method.invoke(dispatcher.getDeclaredField("INSTANCE").get(null), this, newConfig)
        } catch (e: Exception) {
            // ignore
        }
    }
}

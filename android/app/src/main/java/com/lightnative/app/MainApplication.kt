package com.lightnative.app

import android.app.Application
import android.content.res.Configuration
import android.util.Log

import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.ReactHost
import com.facebook.react.shell.MainReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.soloader.SoLoader

class MainApplication : Application(), ReactApplication {
  override val reactNativeHost: ReactNativeHost = object : DefaultReactNativeHost(this) {
    override fun getPackages(): List<ReactPackage> {
      val packages = mutableListOf<ReactPackage>()
      
      // Add React Native core
      packages.add(MainReactPackage())
      Log.d("LightApp", "Added MainReactPackage")
      
      // Try to load all packages via reflection
      val packagesToLoad = listOf(
        "expo.modules.ExpoModulesPackage",
        "com.swmansion.gesturehandler.RNGestureHandlerPackage",
        "com.swmansion.reanimated.ReanimatedPackage",
        "com.swmansion.rnscreens.RNScreensPackage",
        "com.th3rdwave.safeareacontext.SafeAreaContextPackage",
        "com.reactnativecommunity.asyncstorage.AsyncStoragePackage"
      )
      
      for (packageName in packagesToLoad) {
        try {
          val packageClass = Class.forName(packageName)
          val packageInstance = packageClass.getDeclaredConstructor().newInstance() as ReactPackage
          packages.add(packageInstance)
          Log.d("LightApp", "Successfully added: $packageName")
        } catch (e: Exception) {
          Log.w("LightApp", "Could not load package: $packageName - ${e.message}")
        }
      }
      
      // Add our custom native modules
      packages.add(LightPackage())
      Log.d("LightApp", "Added LightPackage. Total packages: ${packages.size}")
      
      return packages
    }

    override fun getJSMainModuleName(): String = "index"

    override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

    override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
    override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
  }

  override val reactHost: ReactHost?
    get() = null

  override fun onCreate() {
    super.onCreate()
    Log.d("LightApp", "Application onCreate called")
    SoLoader.init(this, false)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      load()
    }
    Log.d("LightApp", "Application initialization complete")
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
  }
}

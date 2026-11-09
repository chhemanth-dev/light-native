/**
 * Notification setup and permission handling for Android 13+
 * Ensures proper notification channels and permissions are configured
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Configure how notifications are handled when app is in foreground
 */
export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/**
 * Setup notification channels for Android
 * Channels are required for Android 8.0+ (API 26+)
 */
export async function setupNotificationChannels() {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    // Default channel for general notifications
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default Notifications',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3B82F6',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
      enableLights: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });

    // Reminders channel - higher priority
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: '#3B82F6',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
      enableLights: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });

    // Messages channel
    await Notifications.setNotificationChannelAsync('messages', {
      name: 'Messages',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3B82F6',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
      enableLights: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
    });

    console.log('✅ Notification channels configured successfully');
  } catch (error) {
    console.error('❌ Error setting up notification channels:', error);
  }
}

/**
 * Request notification permissions (required for Android 13+/API 33+)
 * For older Android versions, permissions are granted at install time
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Only request if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('⚠️ Notification permission not granted');
      return false;
    }

    console.log('✅ Notification permissions granted');
    return true;
  } catch (error) {
    console.error('❌ Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Initialize all notification settings
 * Call this at app startup
 */
export async function initializeNotifications(): Promise<boolean> {
  try {
    // Step 1: Configure notification handler
    configureNotificationHandler();
    console.log('✅ Notification handler configured');

    // Step 2: Setup notification channels (Android only)
    await setupNotificationChannels();

    // Step 3: Request permissions (Android 13+ / iOS)
    const hasPermission = await requestNotificationPermissions();

    if (!hasPermission) {
      console.warn('⚠️ Notifications will not work - permission denied');
    }

    return hasPermission;
  } catch (error) {
    console.error('❌ Error initializing notifications:', error);
    return false;
  }
}

/**
 * Check if notification permissions are granted
 */
export async function hasNotificationPermission(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Schedule a local notification (used for reminders)
 */
export async function scheduleNotification(
  title: string,
  body: string,
  trigger: Date | number,
  data?: Record<string, any>
): Promise<string | null> {
  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        vibrate: [0, 250, 250, 250],
      },
      trigger:
        typeof trigger === 'number'
          ? { seconds: trigger }
          : { date: trigger },
    });

    console.log(`✅ Notification scheduled: ${identifier}`);
    return identifier;
  } catch (error) {
    console.error('❌ Error scheduling notification:', error);
    return null;
  }
}

/**
 * Cancel a scheduled notification by ID
 */
export async function cancelNotification(identifier: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
    console.log(`✅ Notification cancelled: ${identifier}`);
  } catch (error) {
    console.error('❌ Error cancelling notification:', error);
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('✅ All notifications cancelled');
  } catch (error) {
    console.error('❌ Error cancelling all notifications:', error);
  }
}

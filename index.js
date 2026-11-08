import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import { saveMessage } from './src/lib/db';
import "expo-router/entry";

// Register headless task for background notification processing
AppRegistry.registerHeadlessTask('NotificationEvent', () => async (data) => {
  console.log('[HeadlessTask] ========== NOTIFICATION RECEIVED ==========');
  console.log('[HeadlessTask] Data:', JSON.stringify(data, null, 2));
  
  try {
    // Map package names to app names
    const appNameMap = {
      'com.whatsapp': 'WhatsApp',
      'com.instagram.android': 'Instagram',
      'com.google.android.gm': 'Gmail',
      'com.google.android.apps.messaging': 'Messages',
      'com.facebook.orca': 'Messenger',
      'org.telegram.messenger': 'Telegram',
      'com.snapchat.android': 'Snapchat',
      'com.twitter.android': 'Twitter',
      'com.linkedin.android': 'LinkedIn',
    };
    
    const appName = appNameMap[data.package] || data.package;
    console.log('[HeadlessTask] App name:', appName);
    
    const message = {
      source: data.package,
      app_name: appName,
      sender: data.title || 'Unknown',
      content: data.text || '',
      timestamp: data.timestamp || Date.now(),
      read: 0,
      session_id: null,
    };
    
    console.log('[HeadlessTask] Saving message:', JSON.stringify(message, null, 2));
    
    // Save to database
    await saveMessage(message);
    
    console.log('[HeadlessTask] ✅ Message saved successfully to DB');
  } catch (error) {
    console.error('[HeadlessTask] ❌ Error saving notification:', error);
    console.error('[HeadlessTask] Error stack:', error.stack);
  }
});

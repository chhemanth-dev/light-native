/**
 * Notification listener bridge — reads all incoming notifications from
 * every app on the device (WhatsApp, Gmail, Instagram, SMS, etc.)
 * via the Android NotificationListenerService.
 *
 * The native side is in modules/notification-listener/android/...
 * It fires a JS event "onNotification" whenever a new notification arrives.
 */
import { NativeModules, NativeEventEmitter, Platform } from "react-native";
import { saveMessage } from "./db";

const { NotificationListenerModule } = NativeModules;

export type RawNotification = {
  id: string;
  packageName: string;
  appName: string;
  title: string;
  text: string;
  subText?: string;
  timestamp: number;
};

let _emitter: NativeEventEmitter | null = null;
let _listener: ReturnType<NativeEventEmitter["addListener"]> | null = null;

/** App name prettifier */
const APP_NAME_MAP: Record<string, string> = {
  "com.whatsapp": "WhatsApp",
  "com.whatsapp.w4b": "WhatsApp Business",
  "com.instagram.android": "Instagram",
  "com.google.android.gm": "Gmail",
  "com.google.android.apps.messaging": "Messages",
  "com.samsung.android.messaging": "Messages",
  "com.microsoft.teams": "Teams",
  "com.slack": "Slack",
  "org.telegram.messenger": "Telegram",
  "com.twitter.android": "X (Twitter)",
  "com.facebook.katana": "Facebook",
  "com.facebook.orca": "Messenger",
  "com.snapchat.android": "Snapchat",
  "com.linkedin.android": "LinkedIn",
};

export function prettyAppName(packageName: string, fallback: string): string {
  return APP_NAME_MAP[packageName] ?? fallback;
}

/** Packages to ignore — system noise */
const IGNORED_PACKAGES = new Set([
  "android",
  "com.android.systemui",
  "com.android.phone",
  "com.google.android.gms",
  "com.android.vending",
  "com.android.settings",
]);

/**
 * Check if the NotificationListenerService is enabled.
 * If not, we need to guide the user to Settings.
 */
export async function isNotificationListenerEnabled(): Promise<boolean> {
  if (Platform.OS !== "android") return false;
  if (!NotificationListenerModule?.isEnabled) return false;
  try {
    return await NotificationListenerModule.isEnabled();
  } catch {
    return false;
  }
}

/**
 * Open Android Settings → Notification Access so the user can enable it.
 */
export function openNotificationListenerSettings() {
  if (!NotificationListenerModule?.openSettings) return;
  NotificationListenerModule.openSettings();
}

/**
 * Start listening. Saves each notification to the DB and calls onNotification.
 */
export function startListening(
  onNotification: (n: RawNotification) => void
) {
  if (Platform.OS !== "android" || !NotificationListenerModule) return;

  if (!_emitter) {
    _emitter = new NativeEventEmitter(NotificationListenerModule);
  }

  if (_listener) {
    _listener.remove();
    _listener = null;
  }

  _listener = _emitter.addListener(
    "onNotification",
    async (raw: RawNotification) => {
      if (IGNORED_PACKAGES.has(raw.packageName)) return;
      if (!raw.text?.trim()) return;

      const appName = prettyAppName(raw.packageName, raw.appName);
      const msg = {
        source: raw.packageName,
        app_name: appName,
        sender: raw.title ?? "Unknown",
        content: raw.text,
        timestamp: raw.timestamp ?? Date.now(),
        read: 0,
        session_id: null,
      };

      try {
        await saveMessage(msg);
      } catch {
        // DB might not be ready yet — skip
      }

      onNotification({ ...raw, appName });
    }
  );
}

export function stopListening() {
  _listener?.remove();
  _listener = null;
}

/**
 * Get currently active notifications (already posted, not just new ones).
 */
export async function getActiveNotifications(): Promise<RawNotification[]> {
  if (Platform.OS !== "android" || !NotificationListenerModule?.getActive) {
    return [];
  }
  try {
    const active: RawNotification[] = await NotificationListenerModule.getActive();
    return active.filter((n) => !IGNORED_PACKAGES.has(n.packageName));
  } catch {
    return [];
  }
}

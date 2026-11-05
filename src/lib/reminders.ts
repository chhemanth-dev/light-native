/**
 * Reminders — schedule local notifications that fire at the right time.
 * Works fully offline. No internet needed.
 */
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { saveReminder, getPendingReminders, markReminderFired, deleteReminder } from "./db";

export const REMINDER_TASK = "LIGHT_REMINDER_TASK";

/** Configure notification appearance */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Request permissions (must be called before scheduling) */
export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync({
    android: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });
  return status === "granted";
}

export type ParsedReminder = {
  title: string;
  fireAt: Date;
  repeat?: "daily" | "weekly" | null;
};

/**
 * Parse natural language reminder from voice input.
 * Examples:
 *   "remind me to call mum at 6pm"
 *   "set a reminder for the meeting tomorrow at 9am"
 *   "remind me every day at 8am to take my medicine"
 */
export function parseReminderFromSpeech(text: string): ParsedReminder | null {
  const lower = text.toLowerCase();

  // Extract title — everything after "remind me to/about" or "reminder for"
  let title = "";
  const titleMatch =
    /remind(?:er)? (?:me )?(?:to |about |for )?(.+?)(?:\s+at\s+|\s+in\s+|\s+tomorrow|\s+today|\s*$)/i.exec(
      text
    );
  if (titleMatch) title = titleMatch[1].trim();
  if (!title) title = text.slice(0, 60);

  // Extract time
  const now = new Date();
  let fireAt: Date | null = null;

  // "at HH:MM" or "at H am/pm"
  const timeMatch =
    /at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i.exec(lower);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const mins = parseInt(timeMatch[2] ?? "0", 10);
    const period = timeMatch[3]?.toLowerCase();
    if (period === "pm" && hours < 12) hours += 12;
    if (period === "am" && hours === 12) hours = 0;
    fireAt = new Date(now);
    fireAt.setHours(hours, mins, 0, 0);
    if (fireAt <= now) fireAt.setDate(fireAt.getDate() + 1); // next occurrence
  }

  // "in X minutes/hours"
  const inMatch = /in\s+(\d+)\s+(minute|hour)/i.exec(lower);
  if (!fireAt && inMatch) {
    const amount = parseInt(inMatch[1], 10);
    const unit = inMatch[2].toLowerCase();
    fireAt = new Date(now.getTime() + amount * (unit.startsWith("hour") ? 3600000 : 60000));
  }

  // "tomorrow" modifier
  if (lower.includes("tomorrow") && fireAt) {
    fireAt.setDate(fireAt.getDate() + 1);
  }

  // Default: 1 hour from now if no time found
  if (!fireAt) fireAt = new Date(now.getTime() + 3600000);

  // Repeat
  let repeat: "daily" | "weekly" | null = null;
  if (lower.includes("every day") || lower.includes("daily") || lower.includes("each day")) {
    repeat = "daily";
  } else if (lower.includes("every week") || lower.includes("weekly")) {
    repeat = "weekly";
  }

  return { title, fireAt, repeat };
}

/** Schedule a reminder notification and save to DB */
export async function scheduleReminder(parsed: ParsedReminder): Promise<string> {
  const trigger: Notifications.NotificationTriggerInput =
    parsed.repeat === "daily"
      ? {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: parsed.fireAt.getHours(),
          minute: parsed.fireAt.getMinutes(),
        }
      : parsed.repeat === "weekly"
      ? {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: parsed.fireAt.getDay() + 1,
          hour: parsed.fireAt.getHours(),
          minute: parsed.fireAt.getMinutes(),
        }
      : {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: parsed.fireAt,
        };

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Light — Reminder",
      body: parsed.title,
      sound: true,
      data: { type: "reminder" },
    },
    trigger,
  });

  const dbId = await saveReminder({
    title: parsed.title,
    body: parsed.title,
    fire_at: parsed.fireAt.getTime(),
    repeat_interval: parsed.repeat ?? null,
    fired: 0,
  });

  return dbId;
}

/** Cancel all scheduled notifications and clear DB reminders */
export async function cancelAllReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const pending = await getPendingReminders();
  for (const r of pending) {
    await markReminderFired(r.id);
  }
}

/** Get upcoming reminders as human-readable speech */
export function formatRemindersForSpeech(
  reminders: Array<{ title: string; fire_at: number }>
): string {
  if (reminders.length === 0) {
    return "You have no upcoming reminders, sir.";
  }
  const items = reminders
    .slice(0, 5)
    .map((r) => {
      const d = new Date(r.fire_at);
      const time = d.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const isToday = d.toDateString() === new Date().toDateString();
      return `${r.title} — ${isToday ? "today" : d.toLocaleDateString("en-GB", { weekday: "long" })} at ${time}`;
    })
    .join("; ");
  return `You have ${reminders.length} reminder${reminders.length > 1 ? "s" : ""}. ${items}.`;
}

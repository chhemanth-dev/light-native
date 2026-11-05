import { useEffect } from "react";
import { startListening, stopListening, type RawNotification } from "../lib/notifications";
import { useAppStore } from "../store/appStore";
import { getUnreadMessages } from "../lib/db";

export function useNotificationListener() {
  const { setUnreadCount, setHasNewNotification } = useAppStore();

  async function refreshUnread() {
    try {
      const unread = await getUnreadMessages();
      setUnreadCount(unread.length);
    } catch { /* DB not ready */ }
  }

  useEffect(() => {
    refreshUnread();

    startListening((_n: RawNotification) => {
      setHasNewNotification(true);
      refreshUnread();
    });

    return () => stopListening();
  }, []);

  return { refreshUnread };
}

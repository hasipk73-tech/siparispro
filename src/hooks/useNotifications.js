import { useState, useCallback } from "react";

export function useNotifications() {
  const [permission, setPermission] = useState(
    "Notification" in window ? Notification.permission : "unsupported"
  );

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return "unsupported";
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  const notify = useCallback(
    (title, options = {}) => {
      if (permission !== "granted") return;
      const n = new Notification(title, {
        icon: "/logo192.png",
        badge: "/logo192.png",
        ...options,
      });
      n.onclick = () => {
        window.focus();
        n.close();
      };
    },
    [permission]
  );

  return { permission, requestPermission, notify };
}

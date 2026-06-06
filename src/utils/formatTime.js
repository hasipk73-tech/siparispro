/**
 * Firestore Timestamp, { seconds }, veya Date → "Bugün 14:32" / "Dün 09:15" / "15 Haz 11:20"
 */
export function formatOrderTime(createdAt) {
  if (!createdAt) return null;

  let date;
  if (typeof createdAt.toDate === "function") {
    date = createdAt.toDate();
  } else if (createdAt.seconds) {
    date = new Date(createdAt.seconds * 1000);
  } else if (createdAt instanceof Date) {
    date = createdAt;
  } else {
    return null;
  }

  const now           = new Date();
  const todayStart    = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart - 86_400_000);
  const orderDayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const timeStr = date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

  if (orderDayStart.getTime() === todayStart.getTime()) {
    return `Bugün ${timeStr}`;
  } else if (orderDayStart.getTime() === yesterdayStart.getTime()) {
    return `Dün ${timeStr}`;
  } else {
    const dateStr = date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
    return `${dateStr} ${timeStr}`;
  }
}

/** createdAt'den milisaniye çıkarır — sıralama için */
export function getCreatedMs(order) {
  const c = order.createdAt;
  if (!c) return new Date(order.lastDelivery + "T00:00:00").getTime();
  if (c.seconds) return c.seconds * 1000;
  if (typeof c.toDate === "function") return c.toDate().getTime();
  if (c instanceof Date) return c.getTime();
  return 0;
}

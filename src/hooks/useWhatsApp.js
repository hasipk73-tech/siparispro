import { useState, useCallback } from "react";

const KEY = "su_dagitim_whatsapp";

function loadSettings() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
  catch { return {}; }
}

export function useWhatsApp() {
  const [settings, setSettings] = useState(loadSettings);

  const saveSettings = useCallback((s) => {
    setSettings(s);
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
  }, []);

  const notify = useCallback((order) => {
    const { phone, apiKey, enabled } = settings;
    if (!enabled || !phone || !apiKey) return;

    const dt = order.deliveryType === "gelAl" ? "Gel Al" : "Eve Teslim";
    const mah = order.neighborhood && order.neighborhood !== "Belirtilmemiş" && order.neighborhood !== "Gel Al"
      ? `\nMahalle: ${order.neighborhood}` : "";

    const text = [
      "🆕 Yeni Sipariş — SiparisPro",
      "",
      `👤 ${order.customerName}`,
      `📱 ${order.phone || "—"}`,
      `📦 ${order.product} ×${order.amount}`,
      `🏠 ${order.address}${mah}`,
      `🚚 ${dt}`,
    ].join("\n");

    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apiKey)}`;

    // no-cors: fire-and-forget — tarayıcı CORS hatası vermeden isteği gönderir
    fetch(url, { mode: "no-cors" }).catch(() => {});
  }, [settings]);

  const sendTest = useCallback(() => {
    const { phone, apiKey } = settings;
    if (!phone || !apiKey) return false;

    const text = "✅ SiparisPro — WhatsApp bildirimleri aktif!";
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apiKey)}`;
    fetch(url, { mode: "no-cors" }).catch(() => {});
    return true;
  }, [settings]);

  return { settings, saveSettings, notify, sendTest };
}

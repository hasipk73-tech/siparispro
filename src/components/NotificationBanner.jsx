export default function NotificationBanner({ permission, onRequest }) {
  if (permission === "granted" || permission === "unsupported") return null;

  if (permission === "denied") {
    return (
      <div className="notif-banner notif-banner--denied">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>
          Bildirimler engellendi. Tarayıcı adres çubuğundaki kilit ikonundan izin verin.
        </span>
      </div>
    );
  }

  return (
    <div className="notif-banner notif-banner--prompt">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 01-3.46 0"/>
      </svg>
      <span>Yeni sipariş bildirimlerini almak için izin verin.</span>
      <button className="notif-banner__btn" onClick={onRequest}>
        Bildirimlere İzin Ver
      </button>
    </div>
  );
}

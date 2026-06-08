import { serverTimestamp } from "firebase/firestore";

function formatTarih(ts) {
  if (!ts) return "";
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000);
    return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  } catch { return ""; }
}

export default function IptalView({ orders, onUpdate }) {
  const geriAl = (id) => {
    onUpdate(id, { status: "beklemede", iptalNedeni: null, iptalTarihi: null });
  };

  if (orders.length === 0) {
    return (
      <div className="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <p>İptal edilen sipariş yok.</p>
      </div>
    );
  }

  return (
    <div className="iptal-list">
      <div className="results-info">
        <span>{orders.length} iptal edilmiş sipariş</span>
      </div>
      {orders.map(o => (
        <div key={o.id} className="iptal-card">
          <div className="iptal-card__header">
            <div className="iptal-card__left">
              <span className="iptal-badge">İPTAL</span>
              <span className="iptal-card__name">{o.customerName}</span>
            </div>
            <button className="btn-geri-al" onClick={() => geriAl(o.id)}>
              ↩ Geri Al
            </button>
          </div>

          <div className="iptal-card__body">
            <div className="iptal-card__row">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {o.address}{o.neighborhood ? `, ${o.neighborhood}` : ""}
            </div>

            {o.iptalNedeni && (
              <div className="iptal-card__row iptal-card__neden">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {o.iptalNedeni}
              </div>
            )}

            {o.iptalTarihi && (
              <div className="iptal-card__row iptal-card__tarih">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
                {formatTarih(o.iptalTarihi)}
              </div>
            )}

            {(o.orderTotal > 0 || o.totalDebt > 0) && (
              <div className="iptal-card__row">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                </svg>
                {o.orderTotal || o.totalDebt} ₺
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

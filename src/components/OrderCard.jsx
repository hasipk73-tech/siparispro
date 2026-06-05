import { useState } from "react";
import OrderDetailModal from "./OrderDetailModal";
import { statusLabels } from "../data/mockData";

function daysSince(dateStr) {
  const diff = new Date() - new Date(dateStr);
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function fmtDate(dateStr) {
  try {
    return new Date(dateStr + "T12:00:00").toLocaleDateString("tr-TR", {
      day: "numeric", month: "long", year: "numeric",
    });
  } catch { return dateStr; }
}

function debtProductLabel(order) {
  if (order.items?.length) {
    return order.items.map(i => `${i.product} ×${i.qty}`).join(", ");
  }
  return `${order.product || "Ürün"} ×${order.amount}`;
}

const statusClass = {
  teslim_edildi: "badge--green",
  beklemede:     "badge--yellow",
  yolda:         "badge--blue",
  iptal:         "badge--red",
};

export default function OrderCard({ order, onUpdate }) {
  const [showModal,     setShowModal]     = useState(false);
  const [showDebtClose, setShowDebtClose] = useState(false);
  const [closeMethod,   setCloseMethod]   = useState("nakit");
  const [closeNote,     setCloseNote]     = useState("");

  const days = daysSince(order.lastDelivery);
  const hasDebt = order.totalDebt > 0;

  const handleDebtClose = () => {
    onUpdate(order.id, {
      totalDebt:     0,
      paymentStatus: closeMethod,
      paymentNote:   closeNote,
      paymentDate:   new Date().toISOString().split("T")[0],
    });
    setShowDebtClose(false);
    setCloseNote("");
  };

  return (
    <>
      <div className={`order-card${hasDebt ? " order-card--has-debt" : ""}`}>
        <div className="order-card__header">
          <div className="order-card__customer">{order.customerName}</div>
          <span className={`badge ${statusClass[order.status]}`}>
            {statusLabels[order.status]}
          </span>
        </div>

        <div className="order-card__address">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          {order.address}
        </div>

        <div className="order-card__meta">
          <div className="meta-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
              <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
            </svg>
            <span>{order.amount} damacana</span>
          </div>
          <div className={`meta-item days-chip ${days >= 14 ? "days-chip--urgent" : days >= 7 ? "days-chip--warning" : "days-chip--ok"}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
            <span>{days === 0 ? "Bugün" : `${days} gün önce`}</span>
          </div>
        </div>

        {/* Ödendi badge */}
        {order.paymentStatus && order.paymentStatus !== "borc" && !hasDebt && (
          <div className="order-card__payment order-card__payment--paid">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {order.paymentStatus === "nakit" ? "Nakit ödendi" : "Havale ödendi"}
          </div>
        )}

        {/* Borç bloğu */}
        {hasDebt && !showDebtClose && (
          <div className="order-card__debt-block">
            <div className="debt-block__top">
              <span className="debt-block__label">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Borç
              </span>
              <span className="debt-block__amount">{order.totalDebt} ₺</span>
            </div>
            <div className="debt-block__meta">
              <span className="debt-block__date">{fmtDate(order.lastDelivery)}</span>
              <span className="debt-block__product">{debtProductLabel(order)}</span>
            </div>
            <button className="debt-block__btn" onClick={() => setShowDebtClose(true)}>
              Borcu Kapat
            </button>
          </div>
        )}

        {/* Inline borç kapatma */}
        {hasDebt && showDebtClose && (
          <div className="debt-inline-close">
            <div className="debt-inline-close__info">
              Kapatılacak borç: <strong>{order.totalDebt} ₺</strong>
            </div>
            <div className="debt-inline-close__methods">
              {["nakit", "havale"].map(m => (
                <button
                  key={m}
                  className={`debt-method-btn${closeMethod === m ? " debt-method-btn--active" : ""}`}
                  onClick={() => setCloseMethod(m)}
                >
                  {m === "nakit" ? "Nakit" : "Havale"}
                </button>
              ))}
            </div>
            <input
              className="debt-inline-close__note"
              type="text"
              placeholder="Ödeme notu (isteğe bağlı)"
              value={closeNote}
              onChange={e => setCloseNote(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleDebtClose()}
            />
            <div className="debt-inline-close__actions">
              <button className="btn btn--outline" onClick={() => setShowDebtClose(false)}>İptal</button>
              <button className="btn-debt-close" style={{ flex: 1 }} onClick={handleDebtClose}>Onayla</button>
            </div>
          </div>
        )}

        <div className="order-card__actions">
          <button className="btn btn--outline" onClick={() => setShowModal(true)}>Detay</button>
          <button className="btn btn--primary"  onClick={() => setShowModal(true)}>Güncelle</button>
        </div>
      </div>

      {showModal && (
        <OrderDetailModal
          order={order}
          onClose={() => setShowModal(false)}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
}

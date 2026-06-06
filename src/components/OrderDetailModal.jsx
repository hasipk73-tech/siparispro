import { useState } from "react";
import { statusLabels } from "../data/mockData";
import MapView from "./MapView";

const PAYMENT_LABELS = { nakit: "Nakit", havale: "Havale", borc: "Borç" };

function computeOrderTotal(order) {
  if (order.orderTotal > 0) return order.orderTotal;
  if (order.items?.length) return order.items.reduce((s, i) => s + (i.total || 0), 0);
  return order.totalDebt || 0;
}

export default function OrderDetailModal({ order, onClose, onUpdate }) {
  const [form, setForm] = useState({
    status:       order.status,
    amount:       order.amount,
    totalDebt:    order.totalDebt,
    lastDelivery: order.lastDelivery,
    paymentStatus: order.paymentStatus ?? null,
  });

  // Borç kapatma state
  const [closeMethod, setCloseMethod] = useState("nakit");
  const [closeNote,   setCloseNote]   = useState(order.paymentNote || "");
  // Ödeme alınamadı - borç miktarı (düzenlenebilir)
  const [debtAmount, setDebtAmount] = useState(() => computeOrderTotal(order) || "");

  const beingDelivered =
    form.status === "teslim_edildi" &&
    (order.status !== "teslim_edildi" || form.paymentStatus === null) &&
    form.paymentStatus === null;

  const isPaid  = form.paymentStatus === "nakit" || form.paymentStatus === "havale";

  const handleSave = () => {
    const updates = {
      status:        form.status,
      amount:        Number(form.amount),
      lastDelivery:  form.lastDelivery,
      paymentStatus: form.paymentStatus,
    };

    if (form.paymentStatus === "nakit" || form.paymentStatus === "havale") {
      updates.totalDebt    = 0;
      updates.paymentDate  = new Date().toISOString().split("T")[0];
    } else if (form.paymentStatus === "borc") {
      updates.totalDebt   = Number(debtAmount) || computeOrderTotal(order);
      updates.paymentNote = "";
    } else {
      // No payment status yet (not teslim_edildi), keep manual debt value
      updates.totalDebt = Number(form.totalDebt);
    }

    onUpdate(order.id, updates);
    onClose();
  };

  const handleDebtClose = () => {
    onUpdate(order.id, {
      totalDebt:     0,
      paymentStatus: closeMethod,
      paymentNote:   closeNote,
      paymentDate:   new Date().toISOString().split("T")[0],
    });
    onClose();
  };

  const selectPayment = (method) => {
    setForm(f => ({ ...f, paymentStatus: method }));
  };

  const canSave =
    form.status !== "teslim_edildi" ||
    form.paymentStatus !== null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">{order.customerName}</h2>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="modal__body">
          <MapView address={order.address} neighborhood={order.neighborhood} />

          <div className="info-row">
            <span className="info-label">Adres</span>
            <span className="info-value">{order.address}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Mahalle</span>
            <span className="info-value">{order.neighborhood}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Telefon</span>
            <span className="info-value">{order.phone}</span>
          </div>
          <div className="info-row info-row--block">
            <span className="info-label">Ürünler</span>
            <div className="order-items-list">
              {order.items?.length ? (
                <>
                  {order.items.map((item, i) => (
                    <div key={i} className="order-item-row">
                      <span className="order-item-row__name">{item.product} <strong>× {item.qty}</strong></span>
                      <span className="order-item-row__price">{item.total ?? item.qty * (item.unitPrice || 0)} ₺</span>
                    </div>
                  ))}
                  <div className="order-item-row order-item-row--total">
                    <span>Toplam</span>
                    <span>{order.items.reduce((s, i) => s + (i.total ?? i.qty * (i.unitPrice || 0)), 0)} ₺</span>
                  </div>
                </>
              ) : (
                <div className="order-item-row">
                  <span className="order-item-row__name">{order.product} <strong>× {order.amount}</strong></span>
                  {order.orderTotal > 0 && <span className="order-item-row__price">{order.orderTotal} ₺</span>}
                </div>
              )}
            </div>
          </div>

          <hr className="modal-divider" />

          <div className="form-group">
            <label>Durum</label>
            <select
              value={form.status}
              onChange={e => {
                const newStatus = e.target.value;
                setForm(f => ({
                  ...f,
                  status: newStatus,
                  // Reset payment if un-delivering
                  paymentStatus: newStatus !== "teslim_edildi" ? null : f.paymentStatus,
                }));
              }}
            >
              {Object.entries(statusLabels).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Damacana Adedi</label>
              <input
                type="number" min="1"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Son Teslimat</label>
              <input
                type="date"
                value={form.lastDelivery}
                onChange={e => setForm(f => ({ ...f, lastDelivery: e.target.value }))}
              />
            </div>
          </div>

          {/* ── Ödeme Seçimi (teslim edildi + henüz ödeme yok) ── */}
          {beingDelivered && (
            <div className="payment-select-box">
              <div className="payment-select-box__title">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                  <line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
                Ödeme Yöntemi
              </div>
              <div className="payment-select-box__btns">
                <button
                  className={`pay-btn pay-btn--nakit${form.paymentStatus === "nakit" ? " pay-btn--active" : ""}`}
                  onClick={() => selectPayment("nakit")}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="6" width="20" height="12" rx="2"/>
                    <circle cx="12" cy="12" r="2"/>
                    <path d="M6 12h.01M18 12h.01"/>
                  </svg>
                  Nakit Alındı
                </button>
                <button
                  className={`pay-btn pay-btn--havale${form.paymentStatus === "havale" ? " pay-btn--active" : ""}`}
                  onClick={() => selectPayment("havale")}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                  Havale Alındı
                </button>
                <button
                  className={`pay-btn pay-btn--borc${form.paymentStatus === "borc" ? " pay-btn--active" : ""}`}
                  onClick={() => selectPayment("borc")}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  Ödeme Alınamadı
                </button>
              </div>

              {form.paymentStatus === "borc" && (
                <div className="form-group" style={{ marginTop: "0.5rem" }}>
                  <label>Borç Tutarı (₺)</label>
                  <input
                    type="number" min="0"
                    value={debtAmount}
                    onChange={e => setDebtAmount(e.target.value)}
                    placeholder="0"
                  />
                </div>
              )}
            </div>
          )}

          {/* ── Ödeme bilgisi (ödenmiş) ── */}
          {isPaid && (
            <div className="payment-info-box payment-info-box--paid">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>
                {PAYMENT_LABELS[form.paymentStatus]} ile ödendi
                {order.paymentDate && ` · ${order.paymentDate}`}
              </span>
              {order.paymentNote && (
                <span className="payment-info-note">{order.paymentNote}</span>
              )}
            </div>
          )}

          {/* ── Borç Kapatma (herhangi bir durum, totalDebt > 0) ── */}
          {order.totalDebt > 0 && (
            <div className="debt-close-box">
              <div className="debt-close-box__header">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>Mevcut Borç:</span>
                <strong>{order.totalDebt} ₺</strong>
              </div>
              <div className="debt-close-box__reason">
                <span className="debt-close-box__reason-date">
                  {(() => { try { return new Date(order.lastDelivery + "T12:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }); } catch { return order.lastDelivery; } })()}
                </span>
                <span className="debt-close-box__reason-product">
                  {order.items?.length
                    ? order.items.map(i => `${i.product} ×${i.qty}`).join(", ")
                    : `${order.product || "Ürün"} ×${order.amount}`}
                </span>
              </div>
              <div className="debt-close-box__methods">
                <span className="debt-close-box__label">Ödeme Yöntemi:</span>
                <div className="debt-close-box__btns">
                  {["nakit", "havale"].map(m => (
                    <button
                      key={m}
                      className={`debt-method-btn${closeMethod === m ? " debt-method-btn--active" : ""}`}
                      onClick={() => setCloseMethod(m)}
                    >
                      {PAYMENT_LABELS[m]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Ödeme Notu (İsteğe Bağlı)</label>
                <input
                  type="text"
                  placeholder="Ör: 15.06.2025 nakit ödeme alındı"
                  value={closeNote}
                  onChange={e => setCloseNote(e.target.value)}
                />
              </div>
              <button className="btn-debt-close" onClick={handleDebtClose}>
                Borcu Kapat
              </button>
            </div>
          )}

          {/* Borç yoksa ama eski sistemde manuel borç varsa */}
          {!beingDelivered && form.status !== "teslim_edildi" && (
            <div className="form-group">
              <label>Borç (₺)</label>
              <input
                type="number" min="0"
                value={form.totalDebt}
                onChange={e => setForm(f => ({ ...f, totalDebt: e.target.value }))}
              />
            </div>
          )}
        </div>

        <div className="modal__footer">
          <button className="btn btn--outline" onClick={onClose}>İptal</button>
          <button
            className="btn btn--primary"
            onClick={handleSave}
            disabled={!canSave}
            title={!canSave ? "Lütfen ödeme yöntemini seçin" : ""}
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}

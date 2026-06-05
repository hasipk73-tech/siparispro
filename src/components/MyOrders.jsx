import { useState } from "react";
import { CATALOG_PRODUCTS } from "../data/catalogProducts";

const STATUS_STEPS = ["beklemede", "yolda", "teslim_edildi"];
const STATUS_LABELS = {
  beklemede:     "Beklemede",
  yolda:         "Yolda",
  teslim_edildi: "Teslim Edildi",
  iptal:         "İptal Edildi",
};

function StatusBadge({ status }) {
  const cls = {
    beklemede:     "badge badge--yellow",
    yolda:         "badge badge--blue",
    teslim_edildi: "badge badge--green",
    iptal:         "badge badge--red",
  }[status] || "badge";
  return <span className={cls}>{STATUS_LABELS[status]}</span>;
}

function StatusTimeline({ status }) {
  if (status === "iptal") {
    return <div className="timeline-cancelled">İptal Edildi</div>;
  }
  const currentIdx = STATUS_STEPS.indexOf(status);
  return (
    <div className="status-timeline">
      {STATUS_STEPS.map((step, idx) => {
        const done   = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <div key={step} style={{ display: "flex", flex: 1, flexDirection: "column", alignItems: "center", gap: "0.3rem" }}>
            <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
              {idx > 0 && (
                <div className={`timeline-line${done || active ? " timeline-line--done" : ""}`} />
              )}
              <div className={`timeline-dot${active ? " timeline-dot--active" : done ? " timeline-dot--done" : ""}`}
                style={active || done ? { display: "flex", alignItems: "center", justifyContent: "center" } : {}}>
                {done && (
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </div>
              {idx < STATUS_STEPS.length - 1 && (
                <div className={`timeline-line${done ? " timeline-line--done" : ""}`} />
              )}
            </div>
            <div className={`timeline-label${active ? " timeline-label--active" : done ? " timeline-label--done" : ""}`}>
              {STATUS_LABELS[step]}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function MyOrders({ orders, updateOrder, notify, phone, onNewOrder }) {
  const [editingId, setEditingId] = useState(null);
  const [editCart, setEditCart] = useState({});
  const [confirmCancelId, setConfirmCancelId] = useState(null);

  const norm = (p) => (p || "").replace(/\s/g, "");
  const myOrders = orders
    .filter(o => norm(o.phone) === norm(phone))
    .sort((a, b) => new Date(b.lastDelivery) - new Date(a.lastDelivery));

  const openEdit = (order) => {
    const cart = {};
    if (order.items?.length) {
      order.items.forEach(item => {
        const p = CATALOG_PRODUCTS.find(p => p.name === item.product);
        if (p) cart[p.id] = item.qty;
      });
    } else {
      const p = CATALOG_PRODUCTS.find(p => p.name === order.product);
      if (p) cart[p.id] = order.amount;
    }
    setEditCart(cart);
    setEditingId(order.id);
  };

  const editPrice = (p, deliveryType) =>
    deliveryType === "gelAl" ? p.gelAl : p.eveTeslim;

  const editTotal = (order) =>
    CATALOG_PRODUCTS.reduce((s, p) => s + (editCart[p.id] || 0) * editPrice(p, order.deliveryType), 0);

  const handleUpdate = (order) => {
    const newItems = CATALOG_PRODUCTS
      .filter(p => (editCart[p.id] || 0) > 0)
      .map(p => ({
        product: p.name,
        qty: editCart[p.id],
        unitPrice: editPrice(p, order.deliveryType),
        total: editCart[p.id] * editPrice(p, order.deliveryType),
      }));

    if (newItems.length === 0) return;

    const newAmount = newItems.reduce((s, i) => s + i.qty, 0);
    const newTotal  = newItems.reduce((s, i) => s + i.total, 0);

    updateOrder(order.id, {
      items: newItems,
      amount: newAmount,
      product: newItems.length === 1 ? newItems[0].product : `${newItems.length} çeşit ürün`,
      totalDebt: newTotal,
    });
    notify?.("Sipariş Güncellendi", {
      body: `${order.customerName} siparişini güncelledi`,
      tag: `update-${order.id}`,
    });
    setEditingId(null);
  };

  const handleCancel = (order) => {
    updateOrder(order.id, { status: "iptal" });
    notify?.("Sipariş İptal Edildi", {
      body: `${order.customerName} siparişini iptal etti`,
      tag: `cancel-${order.id}`,
    });
    setConfirmCancelId(null);
  };

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr + "T12:00:00").toLocaleDateString("tr-TR", {
        day: "numeric", month: "long", year: "numeric",
      });
    } catch { return dateStr; }
  };

  if (myOrders.length === 0) {
    return (
      <div className="my-orders">
        <div className="my-orders__empty">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          <div className="my-orders__empty-title">Henüz siparişiniz yok</div>
          <div className="my-orders__empty-sub">
            Ürünlerimizi inceleyip sipariş verebilirsiniz.
          </div>
          <button className="btn--go-order" onClick={onNewOrder}>
            Sipariş Ver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-orders">
      <div className="my-orders__title">Siparişlerim ({myOrders.length})</div>

      {myOrders.map(order => {
        const isEditing    = editingId === order.id;
        const canAct       = order.status === "beklemede";
        const confirming   = confirmCancelId === order.id;
        const displayItems = order.items?.length
          ? order.items
          : [{ product: order.product, qty: order.amount, total: order.totalDebt }];

        return (
          <div key={order.id} className="order-row">
            {/* Header */}
            <div className="order-row__head">
              <span className="order-row__date">{formatDate(order.lastDelivery)}</span>
              <StatusBadge status={order.status} />
              <span className="delivery-chip">
                {order.deliveryType === "gelAl" ? "Gel Al" : "Eve Teslim"}
              </span>
            </div>

            {/* Items */}
            <div className="order-row__items">
              {displayItems.map((item, i) => (
                <div key={i} className="order-row__item">
                  <span className="order-row__item-name">
                    {item.product}
                    <span style={{ color: "var(--gray-400)", fontWeight: 400, marginLeft: "0.35rem" }}>
                      x{item.qty}
                    </span>
                  </span>
                  {item.total != null && (
                    <span className="order-row__item-price">{item.total} ₺</span>
                  )}
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="order-row__total">
              <span>Tutar</span>
              <span>{order.orderTotal || order.totalDebt || "—"}{(order.orderTotal || order.totalDebt) ? " ₺" : ""}</span>
            </div>

            {/* Borç */}
            {order.paymentStatus === "borc" && order.totalDebt > 0 && (
              <div className="order-row__debt-notice">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Ödeme alınamadı — Borç: <strong>{order.totalDebt} ₺</strong>
              </div>
            )}
            {(order.paymentStatus === "nakit" || order.paymentStatus === "havale") && (
              <div className="order-row__paid-notice">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {order.paymentStatus === "nakit" ? "Nakit" : "Havale"} ile ödendi
                {order.paymentNote ? ` · ${order.paymentNote}` : ""}
              </div>
            )}

            {/* Timeline */}
            <StatusTimeline status={order.status} />

            {/* Action buttons */}
            {canAct && !isEditing && (
              <div className="order-row__actions">
                {confirming ? (
                  <>
                    <span style={{ fontSize: "0.8rem", color: "var(--gray-600)", alignSelf: "center", flex: 1 }}>
                      Siparişi iptal etmek istediğinize emin misiniz?
                    </span>
                    <button className="btn btn--outline" style={{ flex: "0 0 auto" }} onClick={() => setConfirmCancelId(null)}>
                      Hayır
                    </button>
                    <button className="btn--cancel" style={{ flex: "0 0 auto" }} onClick={() => handleCancel(order)}>
                      Evet, İptal Et
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn--cancel" onClick={() => setConfirmCancelId(order.id)}>
                      İptal Et
                    </button>
                    <button className="btn btn--outline" style={{ flex: 1 }} onClick={() => openEdit(order)}>
                      Düzenle
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Inline edit panel */}
            {isEditing && (
              <div className="edit-panel">
                <div className="edit-panel__title">Siparişi Düzenle</div>
                {CATALOG_PRODUCTS.map(p => {
                  const qty = editCart[p.id] || 0;
                  const price = editPrice(p, order.deliveryType);
                  return (
                    <div key={p.id} className={`edit-item${qty > 0 ? " edit-item--active" : ""}`}>
                      <span className="edit-item__name">{p.name}</span>
                      <button
                        className="qty-btn"
                        style={{ width: 26, height: 26, fontSize: "0.95rem" }}
                        onClick={() => setEditCart(c => {
                          const n = Math.max(0, (c[p.id] || 0) - 1);
                          const next = { ...c, [p.id]: n };
                          if (next[p.id] === 0) delete next[p.id];
                          return next;
                        })}
                        disabled={qty === 0}
                      >−</button>
                      <span className="qty-value" style={{ minWidth: 20, fontSize: "0.88rem" }}>{qty}</span>
                      <button
                        className="qty-btn"
                        style={{ width: 26, height: 26, fontSize: "0.95rem" }}
                        onClick={() => setEditCart(c => ({ ...c, [p.id]: (c[p.id] || 0) + 1 }))}
                      >+</button>
                      <span className="edit-item__total" style={{ opacity: qty > 0 ? 1 : 0.35 }}>
                        {qty > 0 ? `${qty * price} ₺` : `${price} ₺`}
                      </span>
                    </div>
                  );
                })}
                <div className="edit-panel__total">
                  <span>Toplam</span>
                  <span>{editTotal(order)} ₺</span>
                </div>
                <div className="edit-panel__actions">
                  <button className="btn btn--outline" onClick={() => setEditingId(null)}>
                    Vazgeç
                  </button>
                  <button
                    className="btn btn--primary"
                    onClick={() => handleUpdate(order)}
                    disabled={editTotal(order) === 0}
                  >
                    Güncelle
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

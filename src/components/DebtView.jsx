import { useState } from "react";

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

const STATUS_CHIP = {
  beklemede:     { label: "Beklemede", cls: "debt-status-chip--yellow" },
  yolda:         { label: "Yolda",     cls: "debt-status-chip--blue"   },
  teslim_edildi: { label: "Teslim",    cls: "debt-status-chip--green"  },
};

export default function DebtView({ grouped, onUpdate }) {
  const [closingId,   setClosingId]   = useState(null);
  const [closeMethod, setCloseMethod] = useState("nakit");
  const [closeNote,   setCloseNote]   = useState("");

  // Flatten + group by customer phone
  const allOrders = Object.values(grouped).flat();

  const customerMap = {};
  allOrders.forEach(order => {
    const key = (order.phone || "").replace(/\s/g, "") || order.customerName;
    if (!customerMap[key]) {
      customerMap[key] = {
        name:       order.customerName,
        phone:      order.phone || "",
        orders:     [],
        totalDebt:  0,
      };
    }
    customerMap[key].orders.push(order);
    customerMap[key].totalDebt += order.totalDebt;
  });

  const customers = Object.values(customerMap)
    .filter(c => c.totalDebt > 0)
    .sort((a, b) => b.totalDebt - a.totalDebt);

  const openClose = (orderId) => {
    setClosingId(orderId);
    setCloseMethod("nakit");
    setCloseNote("");
  };

  const handleClose = (orderId) => {
    onUpdate(orderId, {
      totalDebt:     0,
      paymentStatus: closeMethod,
      paymentNote:   closeNote,
      paymentDate:   new Date().toISOString().split("T")[0],
    });
    setClosingId(null);
  };

  if (customers.length === 0) {
    return (
      <div className="empty-state">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <p>Borçlu müşteri bulunamadı.</p>
      </div>
    );
  }

  return (
    <div className="debt-view">
      <div className="debt-view__summary">
        {customers.length} müşteri · Toplam{" "}
        <strong>{customers.reduce((s, c) => s + c.totalDebt, 0)} ₺</strong> borç
      </div>

      {customers.map(customer => (
        <div key={customer.phone || customer.name} className="debt-customer-card">
          {/* Müşteri başlık */}
          <div className="debt-customer-card__header">
            <div className="debt-customer-card__info">
              <span className="debt-customer-card__name">{customer.name}</span>
              {customer.phone && (
                <span className="debt-customer-card__phone">{customer.phone}</span>
              )}
            </div>
            <div className="debt-customer-card__total">
              <span className="debt-customer-card__total-label">Toplam Borç</span>
              <span className="debt-customer-card__total-amount">{customer.totalDebt} ₺</span>
            </div>
          </div>

          {/* Borç listesi */}
          <div className="debt-customer-card__list">
            {customer.orders.filter(o => o.totalDebt > 0).map(order => {
              const sc = STATUS_CHIP[order.status];
              return (
                <div key={order.id} className="debt-order-row">
                  {closingId === order.id ? (
                    /* ── Inline kapatma formu ── */
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
                        onKeyDown={e => e.key === "Enter" && handleClose(order.id)}
                      />
                      <div className="debt-inline-close__actions">
                        <button className="btn btn--outline" onClick={() => setClosingId(null)}>İptal</button>
                        <button className="btn-debt-close" style={{ flex: 1 }} onClick={() => handleClose(order.id)}>
                          Onayla
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── Borç bilgi satırı ── */
                    <>
                      <div className="debt-order-row__info">
                        <div className="debt-order-row__top">
                          <span className="debt-order-row__date">{fmtDate(order.lastDelivery)}</span>
                          {sc && (
                            <span className={`debt-status-chip ${sc.cls}`}>{sc.label}</span>
                          )}
                        </div>
                        <div className="debt-order-row__product">{debtProductLabel(order)}</div>
                      </div>
                      <div className="debt-order-row__right">
                        <span className="debt-order-row__amount">{order.totalDebt} ₺</span>
                        <button className="debt-order-row__close-btn" onClick={() => openClose(order.id)}>
                          Kapat
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

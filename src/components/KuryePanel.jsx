import { useState, useMemo } from "react";
import { buildMapsUrl } from "./MapView";
import { formatOrderTime } from "../utils/formatTime";

const STATUS_LABEL = {
  beklemede:     "Beklemede",
  yolda:         "Yolda",
  teslim_edildi: "Teslim Edildi",
};

function IconTruck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="3" width="15" height="13" rx="1"/>
      <path d="M16 8h4l3 3v5h-7V8z"/>
      <circle cx="5.5" cy="18.5" r="2.5"/>
      <circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  );
}

function IconChevron({ up }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ transition: "transform .2s", transform: up ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}>
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

export default function KuryePanel({ auth, orders, updateOrder, onLogout }) {
  const [mahalle,     setMahalle]     = useState("hepsi");
  const [expandedId,  setExpandedId]  = useState(null);
  const [showPayment, setShowPayment] = useState(null);

  const activeOrders = useMemo(() =>
    orders.filter(o => o.status === "beklemede" || o.status === "yolda")
  , [orders]);

  const mahalleler = useMemo(() => {
    const set = new Set(
      activeOrders
        .map(o => o.neighborhood)
        .filter(m => m && m !== "Gel Al" && m !== "Belirtilmemiş")
    );
    return Array.from(set).sort();
  }, [activeOrders]);

  const filtered = useMemo(() =>
    mahalle === "hepsi"
      ? activeOrders
      : activeOrders.filter(o => o.neighborhood === mahalle)
  , [activeOrders, mahalle]);

  const countBeklemede = filtered.filter(o => o.status === "beklemede").length;
  const countYolda     = filtered.filter(o => o.status === "yolda").length;

  const toggle = (id) => {
    setExpandedId(prev => prev === id ? null : id);
    setShowPayment(null);
  };

  const startDelivery = (id) => {
    updateOrder(id, { status: "yolda" });
    setShowPayment(null);
  };

  const handleDeliver = (order, paymentStatus) => {
    updateOrder(order.id, {
      status:        "teslim_edildi",
      paymentStatus,
      totalDebt:     paymentStatus === "borc" ? (order.orderTotal || 0) : 0,
    });
    setShowPayment(null);
    setExpandedId(null);
  };

  return (
    <div className="kurye-panel">

      {/* ── Header ── */}
      <header className="kurye-header">
        <div className="kurye-header__inner">
          <div className="kurye-header__brand">
            <div className="kurye-header__truck"><IconTruck /></div>
            <div>
              <div className="kurye-header__title">Kurye Paneli</div>
              <div className="kurye-header__name">{auth.displayName}</div>
            </div>
          </div>
          <button className="kurye-logout" onClick={onLogout}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Çıkış
          </button>
        </div>
      </header>

      <div className="kurye-content">

        {/* ── İstatistikler ── */}
        <div className="kurye-stats">
          <div className="kurye-stat kurye-stat--beklemede">
            <span className="kurye-stat__num">{countBeklemede}</span>
            <span className="kurye-stat__label">Beklemede</span>
          </div>
          <div className="kurye-stat kurye-stat--yolda">
            <span className="kurye-stat__num">{countYolda}</span>
            <span className="kurye-stat__label">Yolda</span>
          </div>
          <div className="kurye-stat kurye-stat--toplam">
            <span className="kurye-stat__num">{filtered.length}</span>
            <span className="kurye-stat__label">Toplam</span>
          </div>
        </div>

        {/* ── Bölge filtresi ── */}
        {mahalleler.length > 0 && (
          <div className="kurye-filter">
            <button className={`kurye-chip${mahalle === "hepsi" ? " kurye-chip--active" : ""}`} onClick={() => setMahalle("hepsi")}>
              Tümü ({activeOrders.length})
            </button>
            {mahalleler.map(m => (
              <button key={m} className={`kurye-chip${mahalle === m ? " kurye-chip--active" : ""}`} onClick={() => setMahalle(m)}>
                {m} ({activeOrders.filter(o => o.neighborhood === m).length})
              </button>
            ))}
          </div>
        )}

        {/* ── Sipariş listesi ── */}
        {filtered.length === 0 ? (
          <div className="kurye-empty">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#86efac" strokeWidth="1.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <p>Bu bölgede bekleyen sipariş yok 🎉</p>
          </div>
        ) : (
          <div className="kurye-list">
            {filtered.map(order => {
              const isExpanded = expandedId === order.id;
              const mapsUrl    = buildMapsUrl(order.address, order.neighborhood);

              return (
                <div key={order.id} className={`kurye-card kurye-card--${order.status}${isExpanded ? " kurye-card--expanded" : ""}`}>

                  {/* ── Özet satırı (her zaman görünür, tıklanabilir) ── */}
                  <div className="kurye-card__summary" onClick={() => toggle(order.id)}>
                    <div className="kurye-card__summary-left">
                      {order.source === "trendyol" && (
                        <span className="badge-trendyol badge-trendyol--sm">T</span>
                      )}
                      <span className="kurye-card__cname">{order.customerName}</span>
                      <span className={`kurye-badge kurye-badge--${order.status}`}>
                        {STATUS_LABEL[order.status]}
                      </span>
                    </div>
                    <div className="kurye-card__summary-right">
                      <span className="kurye-card__brief-addr">{order.address?.slice(0, 28)}{order.address?.length > 28 ? "…" : ""}</span>
                      <IconChevron up={isExpanded} />
                    </div>
                    <div className="kurye-card__brief-product">
                      📦 {order.items?.length > 1
                        ? order.items.map(i => `${i.product.split(" ")[0]} ×${i.qty}`).join(" · ")
                        : `${order.product} × ${order.amount}`}
                      {order.totalDebt > 0 && <span className="kurye-card__debt-pill">{order.totalDebt} ₺ borç</span>}
                    </div>
                  </div>

                  {/* ── Genişletilmiş detay ── */}
                  {isExpanded && (
                    <div className="kurye-card__detail">

                      {/* Sipariş saati */}
                      {formatOrderTime(order.createdAt) && (
                        <div className="kurye-detail__row">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" style={{ flexShrink: 0 }}>
                            <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                          </svg>
                          <span className="kurye-detail__val">{formatOrderTime(order.createdAt)}</span>
                        </div>
                      )}

                      {/* Adres */}
                      <div className="kurye-detail__row">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" style={{ flexShrink: 0 }}>
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        <div>
                          <div className="kurye-detail__val">{order.address}</div>
                          {order.neighborhood && order.neighborhood !== "Gel Al" && (
                            <div className="kurye-detail__sub">{order.neighborhood}</div>
                          )}
                        </div>
                      </div>

                      {/* Telefon */}
                      <div className="kurye-detail__row">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" style={{ flexShrink: 0 }}>
                          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.63 19.79 19.79 0 01.25 2 2 2 0 012.24 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.29 6.29l1.28-1.28a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                        </svg>
                        <a className="kurye-detail__call" href={`tel:${order.phone}`}>{order.phone}</a>
                      </div>

                      {/* Ürünler */}
                      <div className="kurye-detail__row">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" style={{ flexShrink: 0 }}>
                          <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
                          <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
                        </svg>
                        <div className="kurye-detail__products">
                          {order.items?.length
                            ? order.items.map((item, i) => (
                                <div key={i} className="kurye-detail__item">
                                  <span>{item.product} × {item.qty}</span>
                                  <span>{item.total} ₺</span>
                                </div>
                              ))
                            : <span>{order.product} × {order.amount}</span>
                          }
                        </div>
                      </div>

                      {/* Borç durumu */}
                      {order.totalDebt > 0 && (
                        <div className="kurye-detail__debt">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                          </svg>
                          Mevcut Borç: <strong>{order.totalDebt} ₺</strong>
                        </div>
                      )}

                      {/* Not */}
                      {order.note && (
                        <div className="kurye-detail__note">💬 {order.note}</div>
                      )}

                      {/* Google Maps butonu */}
                      <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="kurye-maps-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        Google Maps'te Aç
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: "auto" }}>
                          <polyline points="15 3 21 3 21 9"/>
                          <line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                      </a>

                      {/* Aksiyon butonları */}
                      <div className="kurye-card__actions">
                        {order.status === "beklemede" && showPayment !== order.id && (
                          <button className="kurye-btn kurye-btn--start" onClick={() => startDelivery(order.id)}>
                            <IconTruck /> Yola Çık
                          </button>
                        )}

                        {order.status === "yolda" && showPayment !== order.id && (
                          <button className="kurye-btn kurye-btn--deliver" onClick={() => setShowPayment(order.id)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            Teslim Et
                          </button>
                        )}

                        {showPayment === order.id && (
                          <div className="kurye-payment">
                            <div className="kurye-payment__label">Ödeme şekli seçin:</div>
                            <div className="kurye-payment__btns">
                              <button className="kurye-pay kurye-pay--nakit"  onClick={() => handleDeliver(order, "nakit")}>💵 Nakit Aldım</button>
                              <button className="kurye-pay kurye-pay--havale" onClick={() => handleDeliver(order, "havale")}>📱 Havale/EFT</button>
                              <button className="kurye-pay kurye-pay--borc"   onClick={() => handleDeliver(order, "borc")}>📋 Borçlu Bırak</button>
                              <button className="kurye-pay kurye-pay--cancel" onClick={() => setShowPayment(null)}>✕ İptal</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

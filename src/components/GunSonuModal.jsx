export default function GunSonuModal({ gunSonuStats, onClose }) {
  const {
    date,
    todayTotal, todayDelivered, todayOnRoute, todayPending,
    todayAmountDelivered,
    todayTotalRevenue, todayGelAlRevenue, todayEveTeslimRevenue,
    productTotals,
    allTotal, allDelivered, allOnRoute, allPending,
  } = gunSonuStats;

  const formatted = new Date(date + "T12:00:00").toLocaleDateString("tr-TR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const fmt = (n) => n.toLocaleString("tr-TR");

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal gunsonu-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal__header gunsonu-header">
          <div>
            <div className="modal__title">Gün Sonu Özeti</div>
            <div className="gunsonu-date">{formatted}</div>
          </div>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="modal__body gunsonu-body">

          {/* ── Bugünkü Siparişler ── */}
          <div className="gunsonu-section">
            <div className="gunsonu-section__title">Bugünkü Siparişler</div>
            <div className="gunsonu-stats-row">
              <div className="gunsonu-stat gunsonu-stat--blue">
                <div className="gunsonu-stat__value">{todayTotal}</div>
                <div className="gunsonu-stat__label">Toplam</div>
              </div>
              <div className="gunsonu-stat gunsonu-stat--green">
                <div className="gunsonu-stat__value">{todayDelivered}</div>
                <div className="gunsonu-stat__label">Teslim</div>
              </div>
              <div className="gunsonu-stat gunsonu-stat--cyan">
                <div className="gunsonu-stat__value">{todayOnRoute}</div>
                <div className="gunsonu-stat__label">Yolda</div>
              </div>
              <div className="gunsonu-stat gunsonu-stat--yellow">
                <div className="gunsonu-stat__value">{todayPending}</div>
                <div className="gunsonu-stat__label">Beklemede</div>
              </div>
            </div>
          </div>

          {/* ── Ürün Bazlı Satış & Gelir ── */}
          <div className="gunsonu-section">
            <div className="gunsonu-section__title">
              Bugün Teslim Edilen Ürünler
              {todayAmountDelivered > 0 && (
                <span className="gunsonu-total-badge">{todayAmountDelivered} adet</span>
              )}
            </div>

            {productTotals.length === 0 ? (
              <div className="gunsonu-empty">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" style={{ marginBottom: "0.5rem" }}>
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <div>Bugün teslim edilen sipariş yok</div>
              </div>
            ) : (
              <div className="gunsonu-product-list">
                {productTotals.map(p => (
                  <div key={p.name} className="gunsonu-product-card">
                    <div className="gunsonu-product-card__name">{p.name}</div>
                    <div className="gunsonu-product-card__rows">
                      {p.gelAlQty > 0 && (
                        <div className="gunsonu-price-row">
                          <span className="gunsonu-price-row__label">
                            <span className="gunsonu-dt-chip gunsonu-dt-chip--gelal">Gel Al</span>
                            {p.gelAlQty} adet × {fmt(p.gelAlUnitPrice)} ₺
                          </span>
                          <span className="gunsonu-price-row__value">{fmt(p.gelAlRevenue)} ₺</span>
                        </div>
                      )}
                      {p.eveTeslimQty > 0 && (
                        <div className="gunsonu-price-row">
                          <span className="gunsonu-price-row__label">
                            <span className="gunsonu-dt-chip gunsonu-dt-chip--eve">Eve Teslim</span>
                            {p.eveTeslimQty} adet × {fmt(p.eveTeslimUnitPrice)} ₺
                          </span>
                          <span className="gunsonu-price-row__value">{fmt(p.eveTeslimRevenue)} ₺</span>
                        </div>
                      )}
                    </div>
                    {(p.gelAlQty > 0 && p.eveTeslimQty > 0) && (
                      <div className="gunsonu-product-card__subtotal">
                        <span>Ürün Toplamı</span>
                        <span>{fmt(p.totalRevenue)} ₺</span>
                      </div>
                    )}
                  </div>
                ))}

                {/* Gelir özeti */}
                <div className="gunsonu-revenue-summary">
                  {todayGelAlRevenue > 0 && (
                    <div className="gunsonu-revenue-row">
                      <span className="gunsonu-dt-chip gunsonu-dt-chip--gelal" style={{ fontSize: "0.72rem" }}>Gel Al</span>
                      <span className="gunsonu-revenue-row__label">Gel Al Geliri</span>
                      <span className="gunsonu-revenue-row__value">{fmt(todayGelAlRevenue)} ₺</span>
                    </div>
                  )}
                  {todayEveTeslimRevenue > 0 && (
                    <div className="gunsonu-revenue-row">
                      <span className="gunsonu-dt-chip gunsonu-dt-chip--eve" style={{ fontSize: "0.72rem" }}>Eve Teslim</span>
                      <span className="gunsonu-revenue-row__label">Eve Teslim Geliri</span>
                      <span className="gunsonu-revenue-row__value">{fmt(todayEveTeslimRevenue)} ₺</span>
                    </div>
                  )}
                  <div className="gunsonu-revenue-total">
                    <span>Bugünkü Toplam Gelir</span>
                    <span>{fmt(todayTotalRevenue)} ₺</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Genel Durum ── */}
          <div className="gunsonu-section">
            <div className="gunsonu-section__title">Genel Sipariş Durumu</div>
            <div className="gunsonu-stats-row">
              <div className="gunsonu-stat gunsonu-stat--blue">
                <div className="gunsonu-stat__value">{allTotal}</div>
                <div className="gunsonu-stat__label">Toplam</div>
              </div>
              <div className="gunsonu-stat gunsonu-stat--green">
                <div className="gunsonu-stat__value">{allDelivered}</div>
                <div className="gunsonu-stat__label">Teslim</div>
              </div>
              <div className="gunsonu-stat gunsonu-stat--cyan">
                <div className="gunsonu-stat__value">{allOnRoute}</div>
                <div className="gunsonu-stat__label">Yolda</div>
              </div>
              <div className="gunsonu-stat gunsonu-stat--yellow">
                <div className="gunsonu-stat__value">{allPending}</div>
                <div className="gunsonu-stat__label">Beklemede</div>
              </div>
            </div>
          </div>

        </div>

        <div className="modal__footer">
          <button className="btn btn--outline" onClick={onClose}>Kapat</button>
          <button className="btn btn--primary" onClick={() => window.print()}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: "0.35rem" }}>
              <polyline points="6 9 6 2 18 2 18 9"/>
              <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            Yazdır
          </button>
        </div>
      </div>
    </div>
  );
}

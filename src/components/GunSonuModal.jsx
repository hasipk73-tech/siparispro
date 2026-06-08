export default function GunSonuModal({ gunSonuStats, onClose }) {
  const {
    date,
    todayTotal, todayDelivered, todayOnRoute, todayPending,
    todayAmountDelivered,
    todayTotalRevenue, todayGelAlRevenue, todayEveTeslimRevenue,
    productTotals,
    todayIptal, todayIptalTutar,
    allTotal, allDelivered, allOnRoute, allPending, allIptal,
  } = gunSonuStats;

  const formatted = new Date(date + "T12:00:00").toLocaleDateString("tr-TR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const fmt = (n) => n.toLocaleString("tr-TR");

  const yazdir = () => {
    const urunlerHTML = productTotals.length === 0
      ? `<p style="color:#94a3b8;text-align:center;padding:1rem 0">Bugün teslim edilen sipariş yok</p>`
      : productTotals.map(p => `
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:0.75rem 1rem;margin-bottom:0.5rem">
            <div style="font-weight:700;color:#0f172a;margin-bottom:0.4rem">${p.name}</div>
            ${p.gelAlQty > 0 ? `
              <div style="display:flex;justify-content:space-between;font-size:0.85rem;color:#475569;margin-bottom:0.2rem">
                <span><span style="background:#dbeafe;color:#1e40af;border-radius:4px;padding:1px 6px;font-size:0.75rem;margin-right:6px">Gel Al</span>${p.gelAlQty} adet × ${fmt(p.gelAlUnitPrice)} ₺</span>
                <span style="font-weight:600">${fmt(p.gelAlRevenue)} ₺</span>
              </div>` : ""}
            ${p.eveTeslimQty > 0 ? `
              <div style="display:flex;justify-content:space-between;font-size:0.85rem;color:#475569;margin-bottom:0.2rem">
                <span><span style="background:#dcfce7;color:#166534;border-radius:4px;padding:1px 6px;font-size:0.75rem;margin-right:6px">Eve Teslim</span>${p.eveTeslimQty} adet × ${fmt(p.eveTeslimUnitPrice)} ₺</span>
                <span style="font-weight:600">${fmt(p.eveTeslimRevenue)} ₺</span>
              </div>` : ""}
            ${p.gelAlQty > 0 && p.eveTeslimQty > 0 ? `
              <div style="display:flex;justify-content:space-between;font-size:0.85rem;font-weight:700;color:#0f172a;border-top:1px solid #e2e8f0;margin-top:0.4rem;padding-top:0.4rem">
                <span>Ürün Toplamı</span><span>${fmt(p.totalRevenue)} ₺</span>
              </div>` : ""}
          </div>`).join("");

    const gelirHTML = `
      ${todayGelAlRevenue > 0 ? `
        <div style="display:flex;justify-content:space-between;padding:0.4rem 0;font-size:0.9rem;color:#475569">
          <span><span style="background:#dbeafe;color:#1e40af;border-radius:4px;padding:1px 6px;font-size:0.75rem;margin-right:6px">Gel Al</span>Gel Al Geliri</span>
          <span style="font-weight:600">${fmt(todayGelAlRevenue)} ₺</span>
        </div>` : ""}
      ${todayEveTeslimRevenue > 0 ? `
        <div style="display:flex;justify-content:space-between;padding:0.4rem 0;font-size:0.9rem;color:#475569">
          <span><span style="background:#dcfce7;color:#166534;border-radius:4px;padding:1px 6px;font-size:0.75rem;margin-right:6px">Eve Teslim</span>Eve Teslim Geliri</span>
          <span style="font-weight:600">${fmt(todayEveTeslimRevenue)} ₺</span>
        </div>` : ""}
      <div style="display:flex;justify-content:space-between;padding:0.6rem 0;font-size:1rem;font-weight:800;color:#0f172a;border-top:2px solid #0f172a;margin-top:0.4rem">
        <span>Bugünkü Toplam Gelir</span>
        <span>${fmt(todayTotalRevenue)} ₺</span>
      </div>`;

    const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Gün Sonu Raporu — ${formatted}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #0f172a; padding: 2cm; font-size: 14px; }
    h1 { font-size: 1.4rem; font-weight: 800; margin-bottom: 0.25rem; }
    .tarih { color: #64748b; font-size: 0.9rem; margin-bottom: 1.5rem; }
    .bolum { margin-bottom: 1.5rem; }
    .bolum-baslik { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 0.6rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.4rem; }
    .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; }
    .stat { border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.6rem 0.5rem; text-align: center; }
    .stat-val { font-size: 1.6rem; font-weight: 800; }
    .stat-lbl { font-size: 0.75rem; color: #64748b; margin-top: 0.1rem; }
    .blue  .stat-val { color: #2563eb; }
    .green .stat-val { color: #16a34a; }
    .cyan  .stat-val { color: #0891b2; }
    .yellow .stat-val { color: #d97706; }
    @media print { @page { margin: 1cm; } }
  </style>
</head>
<body>
  <h1>Gün Sonu Raporu</h1>
  <div class="tarih">${formatted}</div>

  <div class="bolum">
    <div class="bolum-baslik">Bugünkü Siparişler</div>
    <div class="stat-grid">
      <div class="stat blue"><div class="stat-val">${todayTotal}</div><div class="stat-lbl">Toplam</div></div>
      <div class="stat green"><div class="stat-val">${todayDelivered}</div><div class="stat-lbl">Teslim</div></div>
      <div class="stat cyan"><div class="stat-val">${todayOnRoute}</div><div class="stat-lbl">Yolda</div></div>
      <div class="stat yellow"><div class="stat-val">${todayPending}</div><div class="stat-lbl">Beklemede</div></div>
    </div>
  </div>

  <div class="bolum">
    <div class="bolum-baslik">Bugün Teslim Edilen Ürünler${todayAmountDelivered > 0 ? ` — ${todayAmountDelivered} adet` : ""}</div>
    ${urunlerHTML}
    ${productTotals.length > 0 ? `<div style="margin-top:0.75rem;border-top:1px solid #e2e8f0;padding-top:0.75rem">${gelirHTML}</div>` : ""}
  </div>

  ${(todayIptal > 0 || allIptal > 0) ? `
  <div class="bolum">
    <div class="bolum-baslik" style="color:#dc2626">İptal Edilen Siparişler</div>
    <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
      ${todayIptal > 0 ? `<div class="stat" style="border-color:#fca5a5"><div class="stat-val" style="color:#dc2626">${todayIptal}</div><div class="stat-lbl">Bugün İptal</div></div>` : ""}
      ${todayIptalTutar > 0 ? `<div class="stat" style="border-color:#fca5a5"><div class="stat-val" style="color:#dc2626;font-size:1.1rem">${fmt(todayIptalTutar)} ₺</div><div class="stat-lbl">İptal Tutarı</div></div>` : ""}
    </div>
  </div>` : ""}

  <div class="bolum">
    <div class="bolum-baslik">Genel Sipariş Durumu</div>
    <div class="stat-grid">
      <div class="stat blue"><div class="stat-val">${allTotal}</div><div class="stat-lbl">Toplam</div></div>
      <div class="stat green"><div class="stat-val">${allDelivered}</div><div class="stat-lbl">Teslim</div></div>
      <div class="stat cyan"><div class="stat-val">${allOnRoute}</div><div class="stat-lbl">Yolda</div></div>
      <div class="stat yellow"><div class="stat-val">${allPending}</div><div class="stat-lbl">Beklemede</div></div>
    </div>
  </div>
</body>
</html>`;

    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
    w.onafterprint = () => w.close();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal gunsonu-modal" id="gunsonu-print-area" onClick={e => e.stopPropagation()}>

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

          {/* ── İptal Edilen Siparişler ── */}
          {(todayIptal > 0 || allIptal > 0) && (
            <div className="gunsonu-section">
              <div className="gunsonu-section__title" style={{ color: "#dc2626" }}>
                İptal Edilen Siparişler
              </div>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                {todayIptal > 0 && (
                  <div className="gunsonu-stat" style={{ border: "1px solid #fca5a5", background: "#fff1f2" }}>
                    <div className="gunsonu-stat__value" style={{ color: "#dc2626" }}>{todayIptal}</div>
                    <div className="gunsonu-stat__label">Bugün İptal</div>
                  </div>
                )}
                {todayIptalTutar > 0 && (
                  <div className="gunsonu-stat" style={{ border: "1px solid #fca5a5", background: "#fff1f2" }}>
                    <div className="gunsonu-stat__value" style={{ color: "#dc2626", fontSize: "1.2rem" }}>{fmt(todayIptalTutar)} ₺</div>
                    <div className="gunsonu-stat__label">İptal Tutarı</div>
                  </div>
                )}
                {allIptal > 0 && (
                  <div className="gunsonu-stat" style={{ border: "1px solid #e2e8f0" }}>
                    <div className="gunsonu-stat__value" style={{ color: "#94a3b8" }}>{allIptal}</div>
                    <div className="gunsonu-stat__label">Toplam İptal</div>
                  </div>
                )}
              </div>
            </div>
          )}

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
          <button className="btn btn--primary" onClick={yazdir}>
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

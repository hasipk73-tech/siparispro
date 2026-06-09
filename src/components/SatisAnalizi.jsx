import { useState, useMemo } from "react";
import { useTenant } from "../tenant/TenantContext";

const FILTRELER = [
  { key: "tumu",  label: "Tümü"      },
  { key: "ay",    label: "Bu Ay"     },
  { key: "hafta", label: "Bu Hafta"  },
];

function para(n) { return Number(n || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 }); }

function tarihSiniri(filtre) {
  const now = new Date();
  if (filtre === "ay") {
    return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  }
  if (filtre === "hafta") {
    const d = new Date(now);
    d.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1));
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  return 0;
}

function siparisZamani(o) {
  if (!o.createdAt) return 0;
  if (o.createdAt.toDate) return o.createdAt.toDate().getTime();
  if (o.createdAt.seconds) return o.createdAt.seconds * 1000;
  return new Date(o.createdAt).getTime();
}

export default function SatisAnalizi({ orders = [] }) {
  const tenant    = useTenant();
  const markaRenk = tenant?.marka?.anaRenk || "#0284c7";

  const [filtre, setFiltre] = useState("ay");

  // İptal edilmeyenler + tarih filtresi
  const gecerliSiparisler = useMemo(() => {
    const sinir = tarihSiniri(filtre);
    return orders.filter(o =>
      o.status !== "iptal" &&
      siparisZamani(o) >= sinir
    );
  }, [orders, filtre]);

  // Ürün bazında toplama
  const urunIstatistik = useMemo(() => {
    const harita = {};

    gecerliSiparisler.forEach(o => {
      if (o.items?.length) {
        o.items.forEach(item => {
          const isim = item.product || "—";
          if (!harita[isim]) harita[isim] = { adet: 0, ciro: 0 };
          harita[isim].adet += (item.qty || 0);
          harita[isim].ciro += (item.total || item.qty * (item.unitPrice || 0));
        });
      } else if (o.product) {
        const isim = o.product;
        if (!harita[isim]) harita[isim] = { adet: 0, ciro: 0 };
        harita[isim].adet += (o.amount || 1);
        harita[isim].ciro += (o.orderTotal || o.totalDebt || 0);
      }
    });

    return Object.entries(harita)
      .map(([isim, d]) => ({ isim, ...d }))
      .sort((a, b) => b.adet - a.adet);
  }, [gecerliSiparisler]);

  const toplamAdet = urunIstatistik.reduce((s, u) => s + u.adet, 0);
  const toplamCiro = urunIstatistik.reduce((s, u) => s + u.ciro, 0);
  const maxAdet    = urunIstatistik[0]?.adet || 1;

  const S = {
    wrap:   { maxWidth: 960, margin: "0 auto", padding: "1.5rem 1rem" },
    ozet:   { display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" },
    ozKart: { flex: 1, minWidth: 160, background: "#fff", border: "1px solid #e2e8f0",
              borderRadius: 12, padding: "1rem 1.25rem", boxShadow: "0 1px 4px rgba(0,0,0,.05)" },
    ozNum:  { fontSize: "1.5rem", fontWeight: 700, color: markaRenk },
    ozLbl:  { fontSize: "0.8rem", color: "#64748b", marginTop: 2 },
    toolbar:{ display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" },
    chips:  { display: "flex", gap: "0.4rem" },
    chip:   (aktif) => ({
              padding: "0.35rem 0.9rem", borderRadius: 20, fontSize: "0.82rem", fontWeight: 600,
              border: `1.5px solid ${aktif ? markaRenk : "#e2e8f0"}`,
              background: aktif ? markaRenk : "#fff",
              color: aktif ? "#fff" : "#64748b", cursor: "pointer" }),
    tablo:  { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" },
    th:     { padding: "0.75rem 1rem", background: "#f8fafc", fontSize: "0.78rem", fontWeight: 700,
              color: "#475569", textTransform: "uppercase", letterSpacing: "0.04em",
              borderBottom: "1px solid #e2e8f0", textAlign: "left" },
    td:     { padding: "0.75rem 1rem", borderBottom: "1px solid #f1f5f9", fontSize: "0.87rem",
              color: "#334155", verticalAlign: "middle" },
    bar:    (pct, renk) => ({
              height: 8, borderRadius: 4, width: `${Math.max(pct * 100, 2)}%`,
              background: renk, minWidth: 4 }),
  };

  return (
    <div style={S.wrap}>

      {/* Özet kartları */}
      <div style={S.ozet}>
        <div style={S.ozKart}>
          <div style={S.ozNum}>{gecerliSiparisler.length}</div>
          <div style={S.ozLbl}>Sipariş Sayısı</div>
        </div>
        <div style={S.ozKart}>
          <div style={S.ozNum}>{toplamAdet}</div>
          <div style={S.ozLbl}>Toplam Ürün Adedi</div>
        </div>
        <div style={S.ozKart}>
          <div style={{ ...S.ozNum, color: "#16a34a" }}>{para(toplamCiro)} ₺</div>
          <div style={S.ozLbl}>Toplam Ciro</div>
        </div>
        <div style={S.ozKart}>
          <div style={S.ozNum}>{urunIstatistik.length}</div>
          <div style={S.ozLbl}>Farklı Ürün</div>
        </div>
      </div>

      {/* Araç çubuğu */}
      <div style={S.toolbar}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>Satış Analizi</h2>
        <div style={S.chips}>
          {FILTRELER.map(f => (
            <button key={f.key} style={S.chip(filtre === f.key)}
              onClick={() => setFiltre(f.key)}>{f.label}</button>
          ))}
        </div>
      </div>

      {urunIstatistik.length === 0 ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8", background: "#fff",
          border: "1px solid #e2e8f0", borderRadius: 12 }}>
          Bu dönemde teslim edilen sipariş bulunamadı.
        </div>
      ) : (
        <>
          {/* En çok satanlar */}
          <div style={{ marginBottom: "0.5rem", fontSize: "0.78rem", fontWeight: 700,
            color: "#475569", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Ürün Satış Sıralaması
          </div>
          <div style={{ ...S.tablo, marginBottom: "1.5rem", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["#", "Ürün Adı", "Satılan Adet", "", "Toplam Ciro"].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {urunIstatistik.map((u, i) => {
                  const pct   = u.adet / maxAdet;
                  const renk  = i < 3 ? markaRenk : i >= urunIstatistik.length - 3 ? "#f87171" : "#94a3b8";
                  return (
                    <tr key={u.isim}>
                      <td style={{ ...S.td, width: 36, fontWeight: 700,
                        color: i < 3 ? markaRenk : "#94a3b8" }}>
                        {i + 1}
                      </td>
                      <td style={{ ...S.td, fontWeight: i < 3 ? 700 : 400 }}>{u.isim}</td>
                      <td style={{ ...S.td, fontWeight: 600 }}>{u.adet} adet</td>
                      <td style={{ ...S.td, minWidth: 140 }}>
                        <div style={{ background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                          <div style={S.bar(pct, renk)} />
                        </div>
                      </td>
                      <td style={{ ...S.td, fontWeight: 600, color: "#16a34a" }}>
                        {para(u.ciro)} ₺
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Kısa özet alt */}
          {urunIstatistik.length >= 3 && (
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200, background: "#f0fdf4", border: "1px solid #bbf7d0",
                borderRadius: 10, padding: "1rem" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#15803d",
                  textTransform: "uppercase", marginBottom: 6 }}>En Çok Satan</div>
                {urunIstatistik.slice(0, 3).map((u, i) => (
                  <div key={u.isim} style={{ display: "flex", justifyContent: "space-between",
                    fontSize: "0.85rem", padding: "3px 0", color: "#166534" }}>
                    <span>{i + 1}. {u.isim}</span>
                    <span style={{ fontWeight: 700 }}>{u.adet} adet</span>
                  </div>
                ))}
              </div>
              <div style={{ flex: 1, minWidth: 200, background: "#fef2f2", border: "1px solid #fecaca",
                borderRadius: 10, padding: "1rem" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#dc2626",
                  textTransform: "uppercase", marginBottom: 6 }}>En Az Satan</div>
                {[...urunIstatistik].reverse().slice(0, 3).map((u, i) => (
                  <div key={u.isim} style={{ display: "flex", justifyContent: "space-between",
                    fontSize: "0.85rem", padding: "3px 0", color: "#7f1d1d" }}>
                    <span>{i + 1}. {u.isim}</span>
                    <span style={{ fontWeight: 700 }}>{u.adet} adet</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

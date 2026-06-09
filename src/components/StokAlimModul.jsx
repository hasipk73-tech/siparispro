import { useState, useEffect, useMemo } from "react";
import { useTenant } from "../tenant/TenantContext";
import { tenantDb } from "../lib/tenantDb";

const BIRIMLER = ["palet", "koli", "adet", "şişe", "kutu", "kasa"];

const BOS_FORM = {
  urunAdi: "", miktar: "", birim: "palet", birimFiyat: "",
  alisTarihi:   new Date().toISOString().split("T")[0],
  tedarikci: "", faturaNo: "", faturaTarihi: new Date().toISOString().split("T")[0],
  not: "",
};

// ── Yardımcılar ─────────────────────────────────────────────
function para(n)   { return Number(n || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 }); }
function tarih(d)  { if (!d) return "—"; return new Date(d + "T00:00:00").toLocaleDateString("tr-TR"); }
function toplamHesapla(m, b) { return (parseFloat(m) || 0) * (parseFloat(b) || 0); }

// ── Fatura metin özeti (paylaşım için) ───────────────────────
function faturaMetni(a, markaAd) {
  return [
    `${markaAd} — Stok Alım Faturası`,
    `Fatura No: ${a.faturaNo || "—"}`,
    `Fatura Tarihi: ${tarih(a.faturaTarihi)}`,
    `Alış Tarihi: ${tarih(a.alisTarihi)}`,
    `Tedarikçi: ${a.tedarikci || "—"}`,
    "",
    `Ürün: ${a.urunAdi}`,
    `Miktar: ${a.miktar} ${a.birim}`,
    `Birim Fiyat: ${para(a.birimFiyat)} ₺`,
    `TOPLAM: ${para(a.toplamTutar)} ₺`,
    a.not ? `Not: ${a.not}` : "",
  ].filter(Boolean).join("\n");
}

// ── Paylaşım aksiyonları ─────────────────────────────────────
async function paylasWebShare(a, markaAd, markaRenk) {
  const metin = faturaMetni(a, markaAd);
  const baslik = `Fatura ${a.faturaNo || ""}`.trim();

  if (navigator.share) {
    // Dosya paylaşımı destekleniyor mu?
    if (navigator.canShare) {
      const blob = new Blob([alimHTML(a, markaAd, markaRenk)], { type: "text/html" });
      const dosya = new File([blob], `fatura-${a.faturaNo || a.id}.html`, { type: "text/html" });
      if (navigator.canShare({ files: [dosya] })) {
        try { await navigator.share({ title: baslik, text: metin, files: [dosya] }); return; }
        catch (e) { if (e.name === "AbortError") return; }
      }
    }
    // Dosyasız metin paylaşımı
    try { await navigator.share({ title: baslik, text: metin }); return; }
    catch (e) { if (e.name === "AbortError") return; }
  }

  // Web Share yok → yazdır diyalogu
  yazdir(a, markaAd, markaRenk);
}

async function whatsappPaylas(a, markaAd, markaRenk) {
  const metin = faturaMetni(a, markaAd);

  // Mobil + dosya paylaşımı → share sheet (kullanıcı WhatsApp seçer)
  if (navigator.canShare) {
    const blob = new Blob([alimHTML(a, markaAd, markaRenk)], { type: "text/html" });
    const dosya = new File([blob], `fatura-${a.faturaNo || a.id}.html`, { type: "text/html" });
    if (navigator.canShare({ files: [dosya] })) {
      try { await navigator.share({ files: [dosya], text: metin }); return; }
      catch (e) { if (e.name === "AbortError") return; }
    }
  }

  // Masaüstü / fallback → PDF indir + WhatsApp Web'i metin ile aç
  yazdir(a, markaAd, markaRenk);
  setTimeout(() => {
    window.open(`https://wa.me/?text=${encodeURIComponent(metin)}`, "_blank");
  }, 600);
}

function emailPaylas(a, markaAd) {
  const konu  = `Stok Alım Faturası - ${a.urunAdi}`;
  const govde = faturaMetni(a, markaAd)
    + "\n\n(PDF faturayı ayrıca indirip bu e-postaya ekleyebilirsiniz.)";
  window.open(`mailto:?subject=${encodeURIComponent(konu)}&body=${encodeURIComponent(govde)}`);
}

// ── Yazdır / PDF ─────────────────────────────────────────────
function alimHTML(a, markaAd, markaRenk) {
  const renk = markaRenk || "#0284c7";
  return `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8">
<title>Fatura – ${a.faturaNo || ""}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;padding:40px;color:#1e293b;font-size:14px}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;
  padding-bottom:18px;margin-bottom:24px;border-bottom:3px solid ${renk}}
.firma{font-size:22px;font-weight:700;color:${renk}}
.baslik{text-align:right}.baslik h2{font-size:16px;color:#475569}
.baslik p{color:#64748b;font-size:12px;margin-top:3px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px}
.item label{font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#94a3b8}
.item p{font-size:14px;margin-top:3px}
table{width:100%;border-collapse:collapse}
th{background:${renk};color:#fff;padding:10px 14px;text-align:left;font-size:12px}
td{padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px}
.total td{font-weight:700;font-size:15px;background:#f8fafc}
.not{margin-top:20px;padding:12px;background:#f8fafc;border-radius:6px;font-size:13px;color:#475569}
</style></head><body>
<div class="hdr">
  <div class="firma">${markaAd}</div>
  <div class="baslik">
    <h2>STOK ALIM FATURASI</h2>
    <p>Fatura No: ${a.faturaNo || "—"}</p>
    <p>Fatura Tarihi: ${tarih(a.faturaTarihi)}</p>
  </div>
</div>
<div class="grid">
  <div class="item"><label>Tedarikçi</label><p>${a.tedarikci || "—"}</p></div>
  <div class="item"><label>Alış Tarihi</label><p>${tarih(a.alisTarihi)}</p></div>
</div>
<table>
  <thead><tr><th>Ürün Adı</th><th>Miktar</th><th>Birim</th><th>Birim Fiyat</th><th>Toplam</th></tr></thead>
  <tbody>
    <tr>
      <td>${a.urunAdi}</td><td>${a.miktar}</td><td>${a.birim}</td>
      <td>${para(a.birimFiyat)} ₺</td><td>${para(a.toplamTutar)} ₺</td>
    </tr>
    <tr class="total"><td colspan="4">TOPLAM TUTAR</td><td>${para(a.toplamTutar)} ₺</td></tr>
  </tbody>
</table>
${a.not ? `<div class="not"><strong>Not:</strong> ${a.not}</div>` : ""}
</body></html>`;
}

function yazdir(alim, markaAd, markaRenk) {
  const w = window.open("", "_blank", "width=820,height=680");
  if (!w) return;
  w.document.write(alimHTML(alim, markaAd, markaRenk));
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 400);
}

function topluYazdir(alimlar, markaAd, markaRenk) {
  const renk = markaRenk || "#0284c7";
  const rows = alimlar.map(a =>
    `<tr>
      <td>${tarih(a.alisTarihi)}</td>
      <td>${a.faturaNo || "—"}</td>
      <td>${a.urunAdi}</td>
      <td>${a.miktar} ${a.birim}</td>
      <td>${para(a.birimFiyat)} ₺</td>
      <td>${para(a.toplamTutar)} ₺</td>
      <td>${a.tedarikci || "—"}</td>
    </tr>`
  ).join("");
  const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8">
<title>Stok Alım Raporu</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;padding:32px;color:#1e293b;font-size:13px}
h1{color:${renk};margin-bottom:6px;font-size:20px}
p.sub{color:#64748b;margin-bottom:20px;font-size:12px}
table{width:100%;border-collapse:collapse}
th{background:${renk};color:#fff;padding:9px 12px;text-align:left;font-size:12px}
td{padding:9px 12px;border-bottom:1px solid #e2e8f0;font-size:12px}
.total{font-weight:700;background:#f8fafc}
</style></head><body>
<h1>${markaAd} — Stok Alım Raporu</h1>
<p class="sub">Toplam ${alimlar.length} kayıt · ${tarih(new Date().toISOString().split("T")[0])}</p>
<table>
  <thead><tr>
    <th>Tarih</th><th>Fatura No</th><th>Ürün</th>
    <th>Miktar</th><th>Birim Fiyat</th><th>Toplam</th><th>Tedarikçi</th>
  </tr></thead>
  <tbody>${rows}
    <tr class="total">
      <td colspan="5">GENEL TOPLAM</td>
      <td colspan="2">${para(alimlar.reduce((s, a) => s + (a.toplamTutar || 0), 0))} ₺</td>
    </tr>
  </tbody>
</table>
</body></html>`;
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 400);
}

// ── Ana bileşen ──────────────────────────────────────────────
export default function StokAlimModul() {
  const tenant = useTenant();
  const tdb    = useMemo(() => tenant?.id ? tenantDb(tenant.id) : null, [tenant?.id]);
  const markaAd   = tenant?.marka?.ad  || tenant?.ad  || "SiparisPro";
  const markaRenk = tenant?.marka?.anaRenk || "#0284c7";

  const [alimlar,    setAlimlar]   = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [form,       setForm]      = useState(BOS_FORM);
  const [formAcik,   setFormAcik]  = useState(false);
  const [duzId,      setDuzId]     = useState(null);
  const [kayitHata,  setKayitHata] = useState("");
  const [silOnay,    setSilOnay]   = useState(null);
  const [paylasMenu, setPaylasMenu] = useState(null); // { id, x, y }

  useEffect(() => {
    if (!tdb) { setLoading(false); return; }
    const unsub = tdb.dinle("stokAlimlar", (docs) => {
      const sirali = [...docs].sort((a, b) => {
        const ta = a.alisTarihi || "";
        const tb = b.alisTarihi || "";
        return tb.localeCompare(ta);
      });
      setAlimlar(sirali);
      setLoading(false);
    }, [], () => setLoading(false));
    return () => unsub();
  }, [tdb]);

  // ── Özet ────────────────────────────────────────────────────
  const toplamHarcama = alimlar.reduce((s, a) => s + (a.toplamTutar || 0), 0);

  // ── Form ────────────────────────────────────────────────────
  function formAc(alim = null) {
    if (alim) {
      setDuzId(alim.id);
      setForm({
        urunAdi:      alim.urunAdi || "",
        miktar:       alim.miktar || "",
        birim:        alim.birim || "palet",
        birimFiyat:   alim.birimFiyat || "",
        alisTarihi:   alim.alisTarihi || BOS_FORM.alisTarihi,
        tedarikci:    alim.tedarikci || "",
        faturaNo:     alim.faturaNo || "",
        faturaTarihi: alim.faturaTarihi || BOS_FORM.faturaTarihi,
        not:          alim.not || "",
      });
    } else {
      setDuzId(null);
      setForm(BOS_FORM);
    }
    setKayitHata("");
    setFormAcik(true);
  }

  async function kaydet() {
    if (!form.urunAdi.trim())  { setKayitHata("Ürün adı zorunlu");   return; }
    if (!form.miktar)          { setKayitHata("Miktar zorunlu");     return; }
    if (!form.birimFiyat)      { setKayitHata("Birim fiyat zorunlu"); return; }
    if (!form.faturaNo.trim()) { setKayitHata("Fatura no zorunlu");  return; }

    const veri = {
      ...form,
      miktar:       parseFloat(form.miktar),
      birimFiyat:   parseFloat(form.birimFiyat),
      toplamTutar:  toplamHesapla(form.miktar, form.birimFiyat),
    };

    try {
      if (duzId) {
        await tdb.guncelle("stokAlimlar", duzId, veri);
      } else {
        await tdb.ekle("stokAlimlar", veri);
      }
      setFormAcik(false);
    } catch (err) {
      setKayitHata("Kayıt hatası: " + err.message);
    }
  }

  async function sil(id) {
    await tdb.sil("stokAlimlar", id);
    setSilOnay(null);
  }

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  // ── Stiller ─────────────────────────────────────────────────
  const S = {
    wrap:    { maxWidth: 960, margin: "0 auto", padding: "1.5rem 1rem" },
    ozet:    { display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" },
    ozKart:  { flex: 1, minWidth: 160, background: "#fff", border: "1px solid #e2e8f0",
               borderRadius: 12, padding: "1rem 1.25rem", boxShadow: "0 1px 4px rgba(0,0,0,.05)" },
    ozNum:   { fontSize: "1.5rem", fontWeight: 700, color: markaRenk },
    ozLabel: { fontSize: "0.8rem", color: "#64748b", marginTop: 2 },
    toolbar: { display: "flex", justifyContent: "space-between", alignItems: "center",
               marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" },
    btn:     (bg, c="#fff") => ({
               padding: "0.5rem 1.1rem", borderRadius: 8, background: bg,
               color: c, border: "none", fontWeight: 600, fontSize: "0.85rem",
               cursor: "pointer", whiteSpace: "nowrap" }),
    table:   { width: "100%", borderCollapse: "collapse", background: "#fff",
               border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" },
    th:      { padding: "0.75rem 1rem", background: "#f8fafc", fontSize: "0.78rem",
               fontWeight: 700, color: "#475569", textTransform: "uppercase",
               letterSpacing: "0.04em", borderBottom: "1px solid #e2e8f0", textAlign: "left" },
    td:      { padding: "0.8rem 1rem", borderBottom: "1px solid #f1f5f9", fontSize: "0.87rem",
               color: "#334155" },
    modal:   { position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 500,
               display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" },
    panel:   { background: "#fff", borderRadius: 16, width: "100%", maxWidth: 560,
               maxHeight: "90vh", overflowY: "auto", padding: "1.75rem",
               boxShadow: "0 8px 40px rgba(0,0,0,.18)" },
    row:     { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" },
    fgrp:    { display: "flex", flexDirection: "column", gap: 4 },
    flabel:  { fontSize: "0.75rem", fontWeight: 600, color: "#64748b",
               textTransform: "uppercase", letterSpacing: "0.04em" },
    finput:  { padding: "0.55rem 0.9rem", border: "1px solid #e2e8f0", borderRadius: 8,
               fontSize: "0.9rem", outline: "none", width: "100%", boxSizing: "border-box" },
  };

  return (
    <div style={S.wrap}>

      {/* Özet */}
      <div style={S.ozet}>
        <div style={S.ozKart}>
          <div style={S.ozNum}>{alimlar.length}</div>
          <div style={S.ozLabel}>Toplam Alım</div>
        </div>
        <div style={S.ozKart}>
          <div style={{ ...S.ozNum, color: "#dc2626" }}>{para(toplamHarcama)} ₺</div>
          <div style={S.ozLabel}>Toplam Harcama</div>
        </div>
      </div>

      {/* Araç çubuğu */}
      <div style={S.toolbar}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>Stok Alımları</h2>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {alimlar.length > 0 && (
            <button style={S.btn("#64748b")} onClick={() => topluYazdir(alimlar, markaAd, markaRenk)}>
              Toplu Rapor (PDF)
            </button>
          )}
          <button style={S.btn(markaRenk)} onClick={() => formAc()}>+ Yeni Alım</button>
        </div>
      </div>

      {/* Tablo */}
      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>Yükleniyor…</div>
      ) : alimlar.length === 0 ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8", background: "#fff",
          border: "1px solid #e2e8f0", borderRadius: 12 }}>
          Henüz alım kaydı yok.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={S.table}>
            <thead>
              <tr>
                {["Tarih","Ürün","Miktar","Birim Fiyat","Toplam","Fatura No","Tedarikçi",""].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alimlar.map(a => (
                <tr key={a.id}>
                  <td style={S.td}>{tarih(a.alisTarihi)}</td>
                  <td style={{ ...S.td, fontWeight: 600 }}>{a.urunAdi}</td>
                  <td style={S.td}>{a.miktar} {a.birim}</td>
                  <td style={S.td}>{para(a.birimFiyat)} ₺</td>
                  <td style={{ ...S.td, fontWeight: 700, color: "#dc2626" }}>{para(a.toplamTutar)} ₺</td>
                  <td style={S.td}>{a.faturaNo || "—"}</td>
                  <td style={{ ...S.td, color: "#64748b" }}>{a.tedarikci || "—"}</td>
                  <td style={{ ...S.td, whiteSpace: "nowrap" }}>
                    {/* PDF + Paylaş dropdown tetikleyici */}
                    <button
                      style={S.btn("#e0f2fe", "#0369a1")}
                      onClick={e => {
                        e.stopPropagation();
                        const r = e.currentTarget.getBoundingClientRect();
                        setPaylasMenu(
                          paylasMenu?.id === a.id
                            ? null
                            : { id: a.id, x: r.left, y: r.bottom + 4 }
                        );
                      }}
                    >
                      PDF ▾
                    </button>{" "}
                    <button style={{ ...S.btn("#f1f5f9", "#475569"), marginLeft: 4 }} onClick={() => formAc(a)}>
                      Düzenle
                    </button>{" "}
                    <button style={{ ...S.btn("#fee2e2", "#dc2626"), marginLeft: 4 }} onClick={() => setSilOnay(a.id)}>
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Silme onayı */}
      {silOnay && (
        <div style={S.modal} onClick={() => setSilOnay(null)}>
          <div style={{ ...S.panel, maxWidth: 360, textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Bu alım kaydı silinsin mi?</p>
            <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "1.25rem" }}>Bu işlem geri alınamaz.</p>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
              <button style={S.btn("#dc2626")} onClick={() => sil(silOnay)}>Evet, Sil</button>
              <button style={S.btn("#f1f5f9", "#475569")} onClick={() => setSilOnay(null)}>Vazgeç</button>
            </div>
          </div>
        </div>
      )}

      {/* PDF / Paylaş dropdown (fixed — tablo overflow'dan etkilenmez) */}
      {paylasMenu && (() => {
        const a = alimlar.find(x => x.id === paylasMenu.id);
        if (!a) return null;
        const menuX = Math.min(paylasMenu.x, window.innerWidth - 196);

        const item = (icon, label, onClick) => (
          <button
            key={label}
            onClick={() => { setPaylasMenu(null); onClick(); }}
            style={{
              display: "flex", alignItems: "center", gap: "0.6rem",
              width: "100%", padding: "0.6rem 1rem",
              background: "none", border: "none", cursor: "pointer",
              fontSize: "0.87rem", color: "#334155", textAlign: "left",
              borderRadius: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#f0f9ff"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          >
            <span style={{ fontSize: "1rem", minWidth: 20 }}>{icon}</span>
            {label}
          </button>
        );

        return (
          <>
            {/* Dışarı tıklayınca kapat */}
            <div
              style={{ position: "fixed", inset: 0, zIndex: 299 }}
              onClick={() => setPaylasMenu(null)}
            />
            <div style={{
              position: "fixed",
              top:  paylasMenu.y,
              left: menuX,
              zIndex: 300,
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              boxShadow: "0 6px 24px rgba(0,0,0,.13)",
              minWidth: 192,
              padding: "0.3rem 0",
              overflow: "hidden",
            }}>
              <div style={{ padding: "0.4rem 1rem 0.35rem",
                fontSize: "0.72rem", fontWeight: 700, color: "#94a3b8",
                textTransform: "uppercase", letterSpacing: "0.05em",
                borderBottom: "1px solid #f1f5f9", marginBottom: "0.2rem" }}>
                {a.urunAdi} · {a.faturaNo || "Fatura"}
              </div>
              {item("⬇️", "İndir (PDF)",         () => yazdir(a, markaAd, markaRenk))}
              {item("💬", "WhatsApp ile Gönder",  () => whatsappPaylas(a, markaAd, markaRenk))}
              {item("✉️", "E-posta ile Gönder",   () => emailPaylas(a, markaAd))}
              {item("↗️", "Paylaş",               () => paylasWebShare(a, markaAd, markaRenk))}
            </div>
          </>
        );
      })()}

      {/* Form modal */}
      {formAcik && (
        <div style={S.modal} onClick={() => setFormAcik(false)}>
          <div style={S.panel} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700 }}>{duzId ? "Alım Düzenle" : "Yeni Alım Ekle"}</h3>
              <button onClick={() => setFormAcik(false)} style={S.btn("#f1f5f9", "#475569")}>✕</button>
            </div>

            {/* Satır 1: Ürün + Fatura No */}
            <div style={S.row}>
              <div style={S.fgrp}>
                <label style={S.flabel}>Ürün Adı *</label>
                <input style={S.finput} placeholder="19L Damacana Su" value={form.urunAdi}
                  onChange={e => f("urunAdi", e.target.value)} />
              </div>
              <div style={S.fgrp}>
                <label style={S.flabel}>Fatura No *</label>
                <input style={S.finput} placeholder="FTR-2024-001" value={form.faturaNo}
                  onChange={e => f("faturaNo", e.target.value)} />
              </div>
            </div>

            {/* Satır 2: Miktar + Birim */}
            <div style={S.row}>
              <div style={S.fgrp}>
                <label style={S.flabel}>Miktar *</label>
                <input style={S.finput} type="number" min="1" placeholder="10" value={form.miktar}
                  onChange={e => f("miktar", e.target.value)} />
              </div>
              <div style={S.fgrp}>
                <label style={S.flabel}>Birim</label>
                <select style={S.finput} value={form.birim} onChange={e => f("birim", e.target.value)}>
                  {BIRIMLER.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>

            {/* Satır 3: Birim Fiyat + Toplam (readonly) */}
            <div style={S.row}>
              <div style={S.fgrp}>
                <label style={S.flabel}>Birim Fiyat (₺) *</label>
                <input style={S.finput} type="number" min="0" step="0.01" placeholder="250.00" value={form.birimFiyat}
                  onChange={e => f("birimFiyat", e.target.value)} />
              </div>
              <div style={S.fgrp}>
                <label style={S.flabel}>Toplam Tutar (₺)</label>
                <input style={{ ...S.finput, background: "#f8fafc", fontWeight: 700 }}
                  value={para(toplamHesapla(form.miktar, form.birimFiyat)) + " ₺"} readOnly />
              </div>
            </div>

            {/* Satır 4: Alış Tarihi + Fatura Tarihi */}
            <div style={S.row}>
              <div style={S.fgrp}>
                <label style={S.flabel}>Alış Tarihi *</label>
                <input style={S.finput} type="date" value={form.alisTarihi}
                  onChange={e => f("alisTarihi", e.target.value)} />
              </div>
              <div style={S.fgrp}>
                <label style={S.flabel}>Fatura Tarihi *</label>
                <input style={S.finput} type="date" value={form.faturaTarihi}
                  onChange={e => f("faturaTarihi", e.target.value)} />
              </div>
            </div>

            {/* Satır 5: Tedarikçi */}
            <div style={{ ...S.fgrp, marginBottom: "1rem" }}>
              <label style={S.flabel}>Tedarikçi (opsiyonel)</label>
              <input style={S.finput} placeholder="ABC Su A.Ş." value={form.tedarikci}
                onChange={e => f("tedarikci", e.target.value)} />
            </div>

            {/* Not */}
            <div style={{ ...S.fgrp, marginBottom: "1.25rem" }}>
              <label style={S.flabel}>Not (opsiyonel)</label>
              <textarea style={{ ...S.finput, minHeight: 72, resize: "vertical" }}
                placeholder="Eklemek istediğiniz not..." value={form.not}
                onChange={e => f("not", e.target.value)} />
            </div>

            {kayitHata && (
              <div style={{ padding: "0.6rem 0.9rem", background: "#fee2e2", color: "#dc2626",
                borderRadius: 8, marginBottom: "1rem", fontSize: "0.85rem" }}>
                {kayitHata}
              </div>
            )}

            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button style={S.btn("#f1f5f9", "#475569")} onClick={() => setFormAcik(false)}>İptal</button>
              <button style={S.btn(markaRenk)} onClick={kaydet}>
                {duzId ? "Güncelle" : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";

// sekme: "yeni" | "kayitli"
// props:
//   siparis      – { id, orderTotal, customerName, phone, address, neighborhood }
//   kayitliKart  – { kartUserKey, kartToken, son4 } veya null
//   onBasarili   – (odemeId, { kartUserKey, kartToken }) => void
//   onKapat      – () => void
export default function OdemeFormu({ siparis, kayitliKart, onBasarili, onKapat }) {
  const [sekme,   setSekme]   = useState(kayitliKart ? "kayitli" : "yeni");
  const [kart,    setKart]    = useState({ sahip: "", numara: "", ay: "", yil: "", cvc: "" });
  const [errors,  setErrors]  = useState({});
  const [yukleme, setYukleme] = useState(false);
  const [hata,    setHata]    = useState("");

  const tutar = siparis.orderTotal || siparis.totalDebt || 0;

  const setK = (alan, deger) => {
    setKart(k => ({ ...k, [alan]: deger }));
    setErrors(e => ({ ...e, [alan]: undefined }));
    setHata("");
  };

  // kart numarası formatı: 4'lü gruplar
  const formatNumara = (val) =>
    val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

  const validate = () => {
    const e = {};
    if (!kart.sahip.trim())             e.sahip  = "Kart üzerindeki isim gerekli";
    if (kart.numara.replace(/\s/g, "").length < 16) e.numara = "Geçerli kart numarası girin";
    if (!kart.ay || kart.ay < 1 || kart.ay > 12)   e.ay     = "Ay hatalı";
    if (!kart.yil || kart.yil.length < 4)           e.yil    = "Yıl hatalı";
    if (!kart.cvc || kart.cvc.length < 3)           e.cvc    = "CVC hatalı";
    return e;
  };

  const odemeYap = async () => {
    setHata("");

    if (sekme === "yeni") {
      const e = validate();
      if (Object.keys(e).length) { setErrors(e); return; }
    }

    setYukleme(true);
    try {
      let url, body;
      if (sekme === "yeni") {
        url  = "/api/odeme-baslat";
        body = {
          siparisId: siparis.id,
          tutar,
          musteri: {
            ad:     siparis.customerName,
            telefon: siparis.phone || "05000000000",
            adres:  [siparis.address, siparis.neighborhood].filter(Boolean).join(", "),
          },
          kart: {
            sahip:  kart.sahip,
            numara: kart.numara,
            ay:     kart.ay,
            yil:    kart.yil,
            cvc:    kart.cvc,
          },
        };
      } else {
        url  = "/api/odeme-kayitli-kart";
        body = {
          siparisId:   siparis.id,
          tutar,
          musteri: {
            ad:     siparis.customerName,
            telefon: siparis.phone || "05000000000",
            adres:  [siparis.address, siparis.neighborhood].filter(Boolean).join(", "),
          },
          kartUserKey: kayitliKart.kartUserKey,
          kartToken:   kayitliKart.kartToken,
        };
      }

      const res    = await fetch(url, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const sonuc  = await res.json();

      if (sonuc.basarili) {
        onBasarili(sonuc.odemeId, {
          kartUserKey: sonuc.kartUserKey,
          kartToken:   sonuc.kartToken,
        });
      } else {
        setHata(sonuc.hata || "Ödeme başarısız oldu.");
      }
    } catch {
      setHata("Sunucuya bağlanılamadı. Lütfen tekrar deneyin.");
    } finally {
      setYukleme(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onKapat}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>

        {/* Başlık */}
        <div className="modal__header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            <h2 className="modal__title">Kart ile Ödeme</h2>
          </div>
          <button className="modal__close" onClick={onKapat}>✕</button>
        </div>

        <div className="modal__body">

          {/* Sipariş özeti */}
          <div style={{
            background: "var(--blue-50)",
            border:     "1px solid var(--blue-100)",
            borderRadius: "var(--radius-md)",
            padding:    "0.75rem 1rem",
            marginBottom: "1rem",
            display:    "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <span style={{ color: "var(--gray-700)", fontSize: "0.875rem" }}>
              {siparis.customerName} · Su Siparişi
            </span>
            <strong style={{ color: "var(--blue-700)", fontSize: "1.1rem" }}>
              {tutar} ₺
            </strong>
          </div>

          {/* Sekme seçici — sadece kayıtlı kart varsa göster */}
          {kayitliKart && (
            <div style={{
              display: "flex",
              borderRadius: "var(--radius-sm)",
              border:  "1px solid var(--gray-300)",
              overflow: "hidden",
              marginBottom: "1rem",
            }}>
              {[
                { key: "kayitli", label: `Kayıtlı Kart ···· ${kayitliKart.son4}` },
                { key: "yeni",    label: "Yeni Kart" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => { setSekme(key); setHata(""); }}
                  style={{
                    flex:       1,
                    padding:    "0.6rem",
                    fontSize:   "0.8rem",
                    fontWeight: sekme === key ? 600 : 400,
                    background: sekme === key ? "var(--blue-600)" : "var(--white)",
                    color:      sekme === key ? "var(--white)"    : "var(--gray-700)",
                    border:     "none",
                    cursor:     "pointer",
                    transition: "background 0.15s",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Kayıtlı kart bilgisi */}
          {sekme === "kayitli" && kayitliKart && (
            <div style={{
              background:   "var(--gray-50)",
              border:       "1px solid var(--gray-300)",
              borderRadius: "var(--radius-md)",
              padding:      "1rem",
              display:      "flex",
              alignItems:   "center",
              gap:          "0.75rem",
              marginBottom: "1rem",
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--blue-600)" strokeWidth="1.5">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              <div>
                <div style={{ fontWeight: 600, color: "var(--gray-900)", fontSize: "0.95rem" }}>
                  ···· ···· ···· {kayitliKart.son4}
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--gray-500)" }}>
                  Kayıtlı kart
                </div>
              </div>
            </div>
          )}

          {/* Yeni kart formu */}
          {sekme === "yeni" && (
            <>
              <div className="form-group">
                <label>Kart Üzerindeki İsim</label>
                <input
                  type="text"
                  placeholder="AHMET YILMAZ"
                  value={kart.sahip}
                  onChange={e => setK("sahip", e.target.value.toUpperCase())}
                  className={errors.sahip ? "input--error" : ""}
                  autoComplete="cc-name"
                />
                {errors.sahip && <span className="field-error">{errors.sahip}</span>}
              </div>

              <div className="form-group">
                <label>Kart Numarası</label>
                <input
                  type="text"
                  placeholder="0000 0000 0000 0000"
                  value={kart.numara}
                  onChange={e => setK("numara", formatNumara(e.target.value))}
                  className={errors.numara ? "input--error" : ""}
                  inputMode="numeric"
                  autoComplete="cc-number"
                  maxLength={19}
                />
                {errors.numara && <span className="field-error">{errors.numara}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Son Kullanma</label>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <input
                      type="text"
                      placeholder="AA"
                      value={kart.ay}
                      onChange={e => setK("ay", e.target.value.replace(/\D/g, "").slice(0, 2))}
                      className={errors.ay ? "input--error" : ""}
                      inputMode="numeric"
                      maxLength={2}
                      style={{ width: "70px" }}
                    />
                    <input
                      type="text"
                      placeholder="YYYY"
                      value={kart.yil}
                      onChange={e => setK("yil", e.target.value.replace(/\D/g, "").slice(0, 4))}
                      className={errors.yil ? "input--error" : ""}
                      inputMode="numeric"
                      maxLength={4}
                      style={{ width: "90px" }}
                    />
                  </div>
                  {(errors.ay || errors.yil) && (
                    <span className="field-error">{errors.ay || errors.yil}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>CVC</label>
                  <input
                    type="text"
                    placeholder="000"
                    value={kart.cvc}
                    onChange={e => setK("cvc", e.target.value.replace(/\D/g, "").slice(0, 4))}
                    className={errors.cvc ? "input--error" : ""}
                    inputMode="numeric"
                    maxLength={4}
                    style={{ width: "80px" }}
                  />
                  {errors.cvc && <span className="field-error">{errors.cvc}</span>}
                </div>
              </div>

              <div style={{
                fontSize:  "0.75rem",
                color:     "var(--gray-500)",
                display:   "flex",
                alignItems: "center",
                gap:       "0.4rem",
                marginBottom: "0.5rem",
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                Kart bilgileri iyzico güvencesiyle işlenir, sistemde saklanmaz.
              </div>
            </>
          )}

          {/* Hata mesajı */}
          {hata && (
            <div style={{
              background:   "var(--red-100)",
              color:        "#dc2626",
              border:       "1px solid #fca5a5",
              borderRadius: "var(--radius-sm)",
              padding:      "0.75rem 1rem",
              fontSize:     "0.875rem",
              marginBottom: "0.5rem",
            }}>
              {hata}
            </div>
          )}
        </div>

        <div className="modal__footer">
          <button className="btn btn--outline" onClick={onKapat} disabled={yukleme}>
            İptal
          </button>
          <button
            className="btn btn--primary"
            onClick={odemeYap}
            disabled={yukleme || tutar <= 0}
            style={{ minWidth: 140 }}
          >
            {yukleme ? (
              <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{
                  width: 14, height: 14,
                  border: "2px solid rgba(255,255,255,.4)",
                  borderTopColor: "white",
                  borderRadius: "50%",
                  animation: "spin 0.7s linear infinite",
                  display: "inline-block",
                }} />
                İşleniyor…
              </span>
            ) : (
              `${tutar} ₺ Öde`
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

import { useState, useEffect, useMemo } from "react";
import { useTenant } from "../tenant/TenantContext";
import { tenantDb } from "../lib/tenantDb";

const C = {
  white:    "#ffffff",
  bg:       "#f8fafc",
  border:   "#e2e8f0",
  sky:      "#0284c7",
  skyLight: "#f0f9ff",
  skyText:  "#0c4a6e",
  skyBdr:   "#bae6fd",
  slate9:   "#0f172a",
  slate7:   "#334155",
  slate5:   "#64748b",
  slate4:   "#94a3b8",
  slate2:   "#e2e8f0",
  slate1:   "#f8fafc",
  green:    "#059669",
  greenBg:  "#f0fdf4",
  greenBdr: "#a7f3d0",
  red:      "#dc2626",
  redBg:    "#fef2f2",
  redBdr:   "#fca5a5",
  yellow:   "#d97706",
  yellowBg: "#fffbeb",
  yellowBdr:"#fde68a",
};

const SONUC_LABEL = {
  siparis_olustu: { label: "Sipariş Oluştu", bg: C.greenBg,  bdr: C.greenBdr,  col: C.green  },
  admine_baglandi:{ label: "Admine Bağlandı",bg: C.yellowBg, bdr: C.yellowBdr, col: C.yellow },
  iptal:          { label: "İptal",           bg: C.redBg,   bdr: C.redBdr,    col: C.red    },
};

function Rozet({ sonuc }) {
  const s = SONUC_LABEL[sonuc] || { label: sonuc || "—", bg: C.slate1, bdr: C.border, col: C.slate5 };
  return (
    <span style={{
      padding: "2px 10px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600,
      background: s.bg, border: `1px solid ${s.bdr}`, color: s.col,
      whiteSpace: "nowrap",
    }}>
      {s.label}
    </span>
  );
}

function tarihStr(ts) {
  if (!ts?.seconds) return "—";
  return new Date(ts.seconds * 1000).toLocaleString("tr-TR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function IVRAramalar({ onSiparisGit, onYeniMusteri }) {
  const tenant = useTenant();
  const tdb    = useMemo(() => tenant?.id ? tenantDb(tenant.id) : null, [tenant?.id]);

  const [aramalar,   setAramalar]   = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [secili,     setSecili]     = useState(null);

  useEffect(() => {
    if (!tdb) { setYukleniyor(false); return; }
    const unsub = tdb.dinle("aramalar", (docs) => {
      const sirali = [...docs].sort((a, b) =>
        (b.tarih?.seconds ?? 0) - (a.tarih?.seconds ?? 0)
      );
      setAramalar(sirali);
      setYukleniyor(false);
    }, [], () => setYukleniyor(false));
    return () => unsub();
  }, [tdb]);

  if (yukleniyor) {
    return (
      <div style={{ display:"flex", justifyContent:"center", padding:"4rem 0" }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          border: `3px solid ${C.border}`, borderTopColor: C.sky,
          animation: "spin 0.8s linear infinite",
        }} />
      </div>
    );
  }

  if (aramalar.length === 0) {
    return (
      <div style={{ textAlign:"center", padding:"4rem 1rem", color: C.slate4 }}>
        <div style={{ fontSize:"2.5rem", marginBottom:"0.75rem" }}>📞</div>
        <p style={{ margin:0, fontWeight:500 }}>Henüz arama kaydı yok.</p>
        <p style={{ margin:"0.5rem 0 0", fontSize:"0.85rem" }}>
          IVR webhook aktif olduğunda aramalar burada listelenecek.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding:"1rem 1.25rem" }}>
      {/* Özet sayaçlar */}
      <div style={{ display:"flex", gap:"0.75rem", flexWrap:"wrap", marginBottom:"1.25rem" }}>
        {[
          { label:"Toplam Arama",     val: aramalar.length,                                             col: C.sky    },
          { label:"Sipariş Oluştu",   val: aramalar.filter(a => a.sonuc === "siparis_olustu").length,   col: C.green  },
          { label:"Admine Bağlandı",  val: aramalar.filter(a => a.sonuc === "admine_baglandi").length,  col: C.yellow },
          { label:"İptal",            val: aramalar.filter(a => a.sonuc === "iptal").length,            col: C.red    },
        ].map(({ label, val, col }) => (
          <div key={label} style={{
            padding:"0.6rem 1rem", borderRadius:10,
            border:`1px solid ${C.border}`, background:C.white,
            display:"flex", flexDirection:"column", gap:2, minWidth:100,
          }}>
            <span style={{ fontSize:"1.5rem", fontWeight:700, color: col }}>{val}</span>
            <span style={{ fontSize:"0.75rem", color: C.slate5 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Liste */}
      <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
        {aramalar.map(a => (
          <div
            key={a.id}
            onClick={() => setSecili(secili?.id === a.id ? null : a)}
            style={{
              background: C.white,
              border: `1px solid ${secili?.id === a.id ? C.skyBdr : C.border}`,
              borderRadius: 10, padding:"0.85rem 1rem", cursor:"pointer",
              transition:"border-color 0.1s",
            }}
          >
            {/* Satır */}
            <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", flexWrap:"wrap" }}>
              {/* Tarih */}
              <span style={{ fontSize:"0.8rem", color: C.slate5, minWidth:130 }}>
                {tarihStr(a.tarih)}
              </span>

              {/* Arayan numara */}
              <span style={{
                fontFamily:"monospace", fontSize:"0.85rem",
                color: C.slate9, fontWeight:500, minWidth:140,
              }}>
                {a.arayanNumara || "—"}
              </span>

              {/* Müşteri adı */}
              <span style={{ fontSize:"0.88rem", color: a.taninan ? C.slate7 : C.slate4, flex:1, minWidth:100 }}>
                {a.taninan ? a.musteriAdi || "Tanınan müşteri" : "Bilinmeyen numara"}
              </span>

              {/* Tuşlamalar */}
              {a.secim?.length > 0 && (
                <span style={{
                  fontSize:"0.75rem", fontFamily:"monospace",
                  color: C.slate5, background: C.slate1,
                  padding:"2px 8px", borderRadius:6,
                  border:`1px solid ${C.border}`,
                }}>
                  {a.secim.join(" → ")}
                </span>
              )}

              {/* Sonuç rozeti */}
              <Rozet sonuc={a.sonuc} />
            </div>

            {/* Detay (genişletilmiş) */}
            {secili?.id === a.id && (
              <div style={{
                marginTop:"0.75rem", paddingTop:"0.75rem",
                borderTop:`1px solid ${C.border}`,
                display:"flex", flexDirection:"column", gap:"0.5rem",
              }}
              onClick={e => e.stopPropagation()}
              >
                {/* Telefon siparişi → siparişe hızlı erişim */}
                {a.olusturulanSiparisId && (
                  <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", flexWrap:"wrap" }}>
                    <span style={{ fontSize:"0.8rem", color: C.slate5 }}>Oluşturulan sipariş:</span>
                    <span style={{
                      fontFamily:"monospace", fontSize:"0.78rem",
                      color: C.slate5, background: C.slate1,
                      padding:"1px 7px", borderRadius:5, border:`1px solid ${C.border}`,
                    }}>
                      {a.olusturulanSiparisId}
                    </span>
                    {onSiparisGit && (
                      <button
                        onClick={() => onSiparisGit(a.musteriAdi)}
                        style={{
                          padding:"3px 12px", borderRadius:6,
                          border:`1px solid ${C.skyBdr}`, background: C.skyLight,
                          color: C.skyText, fontSize:"0.78rem", fontWeight:600,
                          cursor:"pointer", whiteSpace:"nowrap",
                        }}
                      >
                        Siparişe Git →
                      </button>
                    )}
                  </div>
                )}

                {/* Bilinmeyen numara → yeni müşteri kısayolu */}
                {!a.taninan && (
                  <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", flexWrap:"wrap" }}>
                    <span style={{ fontSize:"0.8rem", color: C.slate5 }}>
                      Kayıt bulunamadı.
                    </span>
                    {onYeniMusteri && (
                      <button
                        onClick={() => onYeniMusteri(a.arayanNumara)}
                        style={{
                          padding:"3px 12px", borderRadius:6,
                          border:`1px solid ${C.greenBdr}`, background: C.greenBg,
                          color: C.green, fontSize:"0.78rem", fontWeight:600,
                          cursor:"pointer", whiteSpace:"nowrap",
                        }}
                      >
                        + Yeni Müşteri Ekle
                      </button>
                    )}
                  </div>
                )}

                <div style={{ fontSize:"0.75rem", color: C.slate4 }}>
                  Arama ID: <span style={{ fontFamily:"monospace" }}>{a.id}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

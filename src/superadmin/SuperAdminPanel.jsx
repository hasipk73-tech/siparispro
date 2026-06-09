// src/superadmin/SuperAdminPanel.jsx
// Sadece rol === "superadmin" olan kullanıcı erişebilir.

import { useEffect, useState } from "react";
import {
  collection, getDocs, getDoc, addDoc, updateDoc, doc, serverTimestamp,
} from "firebase/firestore";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { db, auth } from "../firebase";
import { VARSAYILAN_OZELLIKLER } from "../utils/ozellikler";

const OZELLIKLER = [
  { key: "trendyol",     label: "Trendyol"      },
  { key: "getir",        label: "Getir"         },
  { key: "yemeksepeti",  label: "YemekSepeti"   },
  { key: "ivr",          label: "IVR"           },
  { key: "odeme",        label: "Ödeme"         },
  { key: "stokTakibi",   label: "Stok Takibi"   },
  { key: "stokAlim",     label: "Stok Alım"     },
  { key: "satisAnalizi", label: "Satış Analizi" },
];

const BOSLUK_FORM = {
  ad: "", slug: "", domain: "", bolge: "",
  anaRenk: "#0284c7", logo: "",
  ozellikler: { ...VARSAYILAN_OZELLIKLER },
};

// ── Renkler ─────────────────────────────────────────────────
const C = {
  bg:        "#f8fafc",
  white:     "#ffffff",
  border:    "#e2e8f0",
  borderSky: "#bae6fd",
  sky:       "#0284c7",
  skyHover:  "#0369a1",
  skyLight:  "#f0f9ff",
  skyText:   "#0c4a6e",
  slate9:    "#0f172a",
  slate7:    "#334155",
  slate6:    "#475569",
  slate5:    "#64748b",
  slate4:    "#94a3b8",
  slate2:    "#e2e8f0",
  slate1:    "#f8fafc",
  green:     "#059669",
  greenBg:   "#f0fdf4",
  greenBdr:  "#a7f3d0",
  red:       "#dc2626",
  redBg:     "#fef2f2",
  redBdr:    "#fca5a5",
};

// ── Toggle switch ────────────────────────────────────────────
function Toggle({ acik, onChange }) {
  return (
    <div
      onClick={e => { e.stopPropagation(); onChange(); }}
      style={{
        position: "relative", width: 36, height: 20, flexShrink: 0,
        borderRadius: 10, cursor: "pointer",
        background: acik ? C.sky : C.slate2,
        transition: "background 0.15s",
      }}
    >
      <span style={{
        position: "absolute", top: 2,
        left: acik ? 18 : 2,
        width: 16, height: 16,
        borderRadius: "50%", background: "#fff",
        boxShadow: "0 1px 3px rgba(0,0,0,.2)",
        transition: "left 0.15s",
      }} />
    </div>
  );
}

// ── Input ────────────────────────────────────────────────────
function Inp({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && (
        <label style={{ fontSize: "0.75rem", fontWeight: 600, color: C.slate5,
          textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: "100%", boxSizing: "border-box",
          padding: "0.6rem 0.9rem",
          border: `1px solid ${C.border}`,
          borderRadius: 8, fontSize: "0.9rem", color: C.slate9,
          background: C.white, outline: "none",
        }}
      />
    </div>
  );
}

// ── Özellik satırı ───────────────────────────────────────────
function OzellikItem({ label, acik, onChange }) {
  return (
    <div
      onClick={onChange}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0.55rem 0.85rem",
        border: `1px solid ${acik ? C.borderSky : C.border}`,
        borderRadius: 8,
        background: acik ? C.skyLight : C.white,
        cursor: "pointer", userSelect: "none",
        transition: "background 0.1s, border-color 0.1s",
      }}
    >
      <span style={{ fontSize: "0.85rem", fontWeight: 500,
        color: acik ? C.skyText : C.slate6 }}>
        {label}
      </span>
      <Toggle acik={acik} onChange={onChange} />
    </div>
  );
}

// ── Buton ────────────────────────────────────────────────────
function Btn({ onClick, children, variant = "primary", small }) {
  const styles = {
    primary: { background: C.sky, color: "#fff", border: "none" },
    outline: { background: C.white, color: C.slate6, border: `1px solid ${C.border}` },
    sky:     { background: C.skyLight, color: C.skyText, border: `1px solid ${C.borderSky}` },
    danger:  { background: C.red, color: "#fff", border: "none" },
    ghost:   { background: C.slate1, color: C.slate6, border: `1px solid ${C.border}` },
  };
  return (
    <button
      onClick={onClick}
      style={{
        ...styles[variant],
        padding: small ? "0.35rem 0.8rem" : "0.55rem 1.1rem",
        borderRadius: 8, fontSize: small ? "0.8rem" : "0.88rem",
        fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

// ── Kart ─────────────────────────────────────────────────────
const CARD = {
  background: C.white,
  border: `1px solid ${C.border}`,
  borderRadius: 14,
  boxShadow: "0 1px 4px rgba(0,0,0,.06)",
  padding: "1.5rem",
  marginBottom: "1rem",
};

export default function SuperAdminPanel() {
  const [kullanici,  setKullanici]  = useState(undefined);
  const [superadmin, setSuperadmin] = useState(null);
  const [debugBilgi, setDebugBilgi] = useState([]);
  const [email,      setEmail]      = useState("");
  const [sifre,      setSifre]      = useState("");
  const [girisHata,  setGirisHata]  = useState("");
  const [girisYuk,   setGirisYuk]   = useState(false);

  const [tenantlar,   setTenantlar]   = useState([]);
  const [yeni,        setYeni]        = useState(BOSLUK_FORM);
  const [yukleniyor,  setYukleniyor]  = useState(true);
  const [formAcik,    setFormAcik]    = useState(false);
  const [duzId,       setDuzId]       = useState(null);
  const [duzForm,     setDuzForm]     = useState({});

  // ── Auth & rol ───────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u || u.isAnonymous) {
        setKullanici(null); setSuperadmin(null);
        setDebugBilgi(u?.isAnonymous ? ["Anonim oturum — giriş formu gösteriliyor"] : []);
        return;
      }
      setKullanici(u);
      try {
        const snap = await getDoc(doc(db, "users", u.uid));
        const log  = [`UID: ${u.uid}`];
        if (!snap.exists()) {
          log.push("users kaydı bulunamadı"); setSuperadmin(false);
        } else {
          const rol   = snap.data().rol ?? "";
          const temiz = rol.trim().toLowerCase();
          log.push(`rol: "${rol}" → "${temiz}"`);
          log.push(temiz === "superadmin" ? "✓ Erişim onaylandı" : `✗ Reddedildi`);
          setSuperadmin(temiz === "superadmin");
        }
        setDebugBilgi(log);
      } catch (err) {
        setDebugBilgi([`UID: ${u.uid}`, `HATA: ${err.code} — ${err.message}`]);
        setSuperadmin(false);
      }
    });
    return () => unsub();
  }, []);

  // ── Veri ────────────────────────────────────────────────
  async function girisYap(e) {
    e.preventDefault();
    setGirisHata(""); setGirisYuk(true);
    try { await signInWithEmailAndPassword(auth, email, sifre); }
    catch { setGirisHata("E-posta veya şifre hatalı."); }
    finally { setGirisYuk(false); }
  }

  async function yukle() {
    const snap = await getDocs(collection(db, "tenants"));
    setTenantlar(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setYukleniyor(false);
  }
  useEffect(() => { yukle(); }, []);

  async function isletmeEkle() {
    if (!yeni.ad || !yeni.slug) return alert("Ad ve slug zorunlu");
    await addDoc(collection(db, "tenants"), {
      slug: yeni.slug.trim().toLowerCase(),
      domains: yeni.domain ? [yeni.domain.trim().toLowerCase()] : [],
      ad: yeni.ad, bolge: yeni.bolge, aktif: true,
      ozellikler: yeni.ozellikler,
      marka: { ad: yeni.ad, anaRenk: yeni.anaRenk, logo: yeni.logo.trim(), favicon: "" },
      abonelik: { plan: "aylik", durum: "aktif", baslangic: serverTimestamp() },
      olusturmaTarihi: serverTimestamp(),
    });
    setYeni(BOSLUK_FORM); setFormAcik(false); yukle();
  }

  async function aktiflikDegistir(t) {
    await updateDoc(doc(db, "tenants", t.id), { aktif: !t.aktif });
    yukle();
  }

  const [ivrDuzId,   setIvrDuzId]   = useState(null);
  const [ivrForm,    setIvrForm]    = useState({});
  const [ivrKayit,   setIvrKayit]   = useState(false);

  function duzenlemeBaslat(t) {
    setDuzId(t.id);
    setDuzForm({
      ad: t.ad || "", slug: t.slug || "", domain: t.domains?.[0] || "",
      bolge: t.bolge || "", anaRenk: t.marka?.anaRenk || "#0284c7", logo: t.marka?.logo || "",
    });
  }

  function ivrDuzenlemeBaslat(t) {
    setIvrDuzId(t.id);
    setIvrForm({ karsilamaMetni: t.ivrAyarlari?.karsilamaMetni || "" });
  }

  async function ivrKaydet(t) {
    setIvrKayit(true);
    try {
      await updateDoc(doc(db, "tenants", t.id), {
        "ivrAyarlari.karsilamaMetni": ivrForm.karsilamaMetni.trim(),
      });
      setTenantlar(prev => prev.map(x =>
        x.id === t.id
          ? { ...x, ivrAyarlari: { ...x.ivrAyarlari, karsilamaMetni: ivrForm.karsilamaMetni.trim() } }
          : x
      ));
      setIvrDuzId(null);
    } catch (e) {
      alert("Kayıt hatası: " + e.message);
    } finally {
      setIvrKayit(false);
    }
  }

  async function isletmeGuncelle(t) {
    if (!duzForm.ad || !duzForm.slug) return alert("Ad ve slug zorunlu");
    await updateDoc(doc(db, "tenants", t.id), {
      ad: duzForm.ad, slug: duzForm.slug.trim().toLowerCase(),
      domains: duzForm.domain ? [duzForm.domain.trim().toLowerCase()] : [],
      bolge: duzForm.bolge,
      "marka.ad": duzForm.ad, "marka.anaRenk": duzForm.anaRenk, "marka.logo": duzForm.logo.trim(),
    });
    setTenantlar(prev => prev.map(x =>
      x.id === t.id
        ? { ...x, ad: duzForm.ad, slug: duzForm.slug.trim().toLowerCase(),
            domains: duzForm.domain ? [duzForm.domain.trim().toLowerCase()] : [],
            bolge: duzForm.bolge,
            marka: { ...x.marka, ad: duzForm.ad, anaRenk: duzForm.anaRenk, logo: duzForm.logo.trim() } }
        : x
    ));
    setDuzId(null);
  }

  async function ozellikToggle(t, key) {
    const mevcut = t.ozellikler?.[key] ?? VARSAYILAN_OZELLIKLER[key];
    await updateDoc(doc(db, "tenants", t.id), { [`ozellikler.${key}`]: !mevcut });
    setTenantlar(prev => prev.map(x =>
      x.id === t.id ? { ...x, ozellikler: { ...x.ozellikler, [key]: !mevcut } } : x
    ));
  }

  // ── Yükleniyor ─────────────────────────────────────────
  if (kullanici === undefined || (kullanici && superadmin === null)) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background: C.bg }}>
        <div style={{ width:32, height:32, borderRadius:"50%", border:`3px solid ${C.border}`,
          borderTopColor: C.sky, animation:"spin 0.8s linear infinite" }} />
      </div>
    );
  }

  // ── Giriş formu ────────────────────────────────────────
  if (!kullanici) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
        minHeight:"100vh", background: C.bg, padding:"1rem" }}>
        <form onSubmit={girisYap} style={{ ...CARD, width:"100%", maxWidth:380, padding:"2rem" }}>
          <h1 style={{ fontSize:"1.25rem", fontWeight:700, color: C.slate9, marginBottom:4 }}>SuperAdmin Girişi</h1>
          <p style={{ fontSize:"0.85rem", color: C.slate5, marginBottom:"1.5rem" }}>SiparisPro yönetim paneli</p>

          <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
            <Inp label="E-posta" type="email" value={email} placeholder="admin@siparispro.app"
              onChange={e => { setEmail(e.target.value); setGirisHata(""); }} />
            <Inp label="Şifre" type="password" value={sifre} placeholder="••••••••"
              onChange={e => { setSifre(e.target.value); setGirisHata(""); }} />
          </div>

          {girisHata && (
            <div style={{ marginTop:"1rem", padding:"0.65rem 1rem", background: C.redBg,
              border:`1px solid ${C.redBdr}`, borderRadius:8, color: C.red, fontSize:"0.85rem" }}>
              {girisHata}
            </div>
          )}

          <button type="submit" disabled={girisYuk} style={{
            width:"100%", marginTop:"1.25rem", padding:"0.75rem",
            background: C.sky, color:"#fff", border:"none",
            borderRadius:8, fontSize:"0.95rem", fontWeight:600, cursor:"pointer",
          }}>
            {girisYuk ? "Giriş yapılıyor…" : "Giriş Yap"}
          </button>

          {debugBilgi.length > 0 && (
            <div style={{ marginTop:"1rem", padding:"0.75rem", background: C.slate1,
              border:`1px solid ${C.border}`, borderRadius:8 }}>
              {debugBilgi.map((s, i) => (
                <p key={i} style={{ fontFamily:"monospace", fontSize:"0.78rem",
                  color: C.slate5, lineHeight:1.6, margin:0 }}>{s}</p>
              ))}
            </div>
          )}
        </form>
      </div>
    );
  }

  // ── Yetkisiz ───────────────────────────────────────────
  if (!superadmin) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
        minHeight:"100vh", background: C.redBg, padding:"1rem" }}>
        <div style={{ ...CARD, maxWidth:420, textAlign:"center", padding:"2.5rem" }}>
          <div style={{ fontSize:"2.5rem", marginBottom:"0.75rem" }}>🚫</div>
          <h2 style={{ fontSize:"1.15rem", fontWeight:700, color: C.slate9, marginBottom:"0.5rem" }}>
            Erişim Reddedildi
          </h2>
          <p style={{ fontSize:"0.88rem", color: C.slate5, marginBottom:"1rem" }}>
            Bu sayfaya erişim yetkiniz yok.<br />Sadece superadmin hesapları girebilir.
          </p>
          {debugBilgi.length > 0 && (
            <div style={{ padding:"0.75rem", background: C.slate1, border:`1px solid ${C.border}`,
              borderRadius:8, marginBottom:"1rem", textAlign:"left" }}>
              {debugBilgi.map((s, i) => (
                <p key={i} style={{ fontFamily:"monospace", fontSize:"0.78rem",
                  color: C.slate5, lineHeight:1.6, margin:0 }}>{s}</p>
              ))}
            </div>
          )}
          <Btn onClick={() => signOut(auth)} variant="danger">Çıkış Yap</Btn>
        </div>
      </div>
    );
  }

  // ── Ana Panel ──────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background: C.bg }}>
      <div style={{ maxWidth:860, margin:"0 auto", padding:"2rem 1rem" }}>

        {/* Başlık */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between",
          gap:"1rem", marginBottom:"2rem" }}>
          <div>
            <h1 style={{ fontSize:"1.5rem", fontWeight:700, color: C.slate9, margin:0 }}>
              İşletme Yönetimi
            </h1>
            <p style={{ fontSize:"0.875rem", color: C.slate5, margin:"4px 0 0" }}>
              Tüm müşterilerinizi tek panelden yönetin.
            </p>
          </div>
          <div style={{ display:"flex", gap:"0.5rem", flexShrink:0 }}>
            <Btn onClick={() => setFormAcik(v => !v)} variant={formAcik ? "ghost" : "primary"}>
              {formAcik ? "✕ Kapat" : "+ Yeni İşletme"}
            </Btn>
            <Btn onClick={() => signOut(auth)} variant="outline">Çıkış</Btn>
          </div>
        </div>

        {/* Firma listesi */}
        {yukleniyor ? (
          <div style={{ display:"flex", justifyContent:"center", padding:"4rem 0" }}>
            <div style={{ width:28, height:28, borderRadius:"50%", border:`3px solid ${C.border}`,
              borderTopColor: C.sky, animation:"spin 0.8s linear infinite" }} />
          </div>
        ) : tenantlar.length === 0 ? (
          <div style={{ ...CARD, textAlign:"center", color: C.slate4, padding:"4rem" }}>
            Henüz kayıtlı işletme yok.
          </div>
        ) : (
          tenantlar.map(t => {
            const duzMode = duzId === t.id;
            return (
              <div key={t.id} style={{
                ...CARD,
                border: duzMode ? `1px solid ${C.borderSky}` : `1px solid ${C.border}`,
              }}>

                {/* Görünüm modu */}
                {!duzMode && (
                  <div style={{ display:"flex", alignItems:"center",
                    justifyContent:"space-between", flexWrap:"wrap", gap:"0.75rem" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
                      <div style={{
                        width:44, height:44, borderRadius:10, flexShrink:0,
                        background: t.marka?.anaRenk || C.sky,
                        boxShadow:"0 1px 4px rgba(0,0,0,.15)",
                      }} />
                      <div>
                        <p style={{ fontSize:"1rem", fontWeight:600, color: C.slate9, margin:0 }}>
                          {t.ad}
                        </p>
                        <p style={{ fontSize:"0.8rem", color: C.slate4, margin:"2px 0 0" }}>
                          {t.domains?.[0] || `${t.slug}.siparispro.com`}
                          {t.bolge ? ` · ${t.bolge}` : ""}
                        </p>
                      </div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", flexWrap:"wrap" }}>
                      <span style={{
                        padding:"3px 10px", borderRadius:20, fontSize:"0.75rem", fontWeight:600,
                        background: t.aktif ? C.greenBg : C.slate1,
                        color: t.aktif ? C.green : C.slate4,
                        border: `1px solid ${t.aktif ? C.greenBdr : C.border}`,
                      }}>
                        {t.aktif ? "Aktif" : "Pasif"}
                      </span>
                      <Btn onClick={() => aktiflikDegistir(t)} variant="outline" small>
                        {t.aktif ? "Durdur" : "Aç"}
                      </Btn>
                      <Btn onClick={() => duzenlemeBaslat(t)} variant="sky" small>
                        Düzenle
                      </Btn>
                    </div>
                  </div>
                )}

                {/* Düzenleme modu */}
                {duzMode && (
                  <div>
                    <p style={{ fontSize:"0.75rem", fontWeight:700, color: C.sky,
                      textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"1rem" }}>
                      Düzenleniyor
                    </p>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:"0.85rem" }}>
                      <Inp label="İşletme Adı" value={duzForm.ad} placeholder="Uzunoğlu Su"
                        onChange={e => setDuzForm({ ...duzForm, ad: e.target.value })} />
                      <Inp label="Slug" value={duzForm.slug} placeholder="uzunoglu"
                        onChange={e => setDuzForm({ ...duzForm, slug: e.target.value })} />
                      <Inp label="Domain" value={duzForm.domain} placeholder="uzunoglususiparis.com"
                        onChange={e => setDuzForm({ ...duzForm, domain: e.target.value })} />
                      <Inp label="Bölge" value={duzForm.bolge} placeholder="İstanbul / Ümraniye"
                        onChange={e => setDuzForm({ ...duzForm, bolge: e.target.value })} />
                      <Inp label="Logo URL" value={duzForm.logo} placeholder="https://..."
                        onChange={e => setDuzForm({ ...duzForm, logo: e.target.value })} />
                      <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                        <label style={{ fontSize:"0.75rem", fontWeight:600, color: C.slate5,
                          textTransform:"uppercase", letterSpacing:"0.05em" }}>
                          Marka Rengi
                        </label>
                        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
                          <input type="color" value={duzForm.anaRenk}
                            onChange={e => setDuzForm({ ...duzForm, anaRenk: e.target.value })}
                            style={{ width:48, height:36, border:`1px solid ${C.border}`,
                              borderRadius:6, padding:2, cursor:"pointer" }} />
                          <span style={{ fontFamily:"monospace", fontSize:"0.85rem", color: C.slate5 }}>
                            {duzForm.anaRenk}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:"0.5rem", marginTop:"1.25rem" }}>
                      <Btn onClick={() => isletmeGuncelle(t)} variant="primary">Kaydet</Btn>
                      <Btn onClick={() => setDuzId(null)} variant="ghost">İptal</Btn>
                    </div>
                  </div>
                )}

                {/* Özellikler — her zaman görünür */}
                <div style={{ borderTop:`1px solid ${C.border}`, marginTop:"1.25rem", paddingTop:"1.25rem" }}>
                  <p style={{ fontSize:"0.8rem", fontWeight:600, color: C.slate5,
                    textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"0.75rem" }}>
                    Özellikler
                  </p>
                  <div style={{ display:"grid",
                    gridTemplateColumns:"repeat(auto-fill, minmax(150px, 1fr))", gap:"0.6rem" }}>
                    {OZELLIKLER.map(({ key, label }) => {
                      const acik = t.ozellikler?.[key] ?? VARSAYILAN_OZELLIKLER[key];
                      return (
                        <OzellikItem
                          key={key}
                          label={label}
                          acik={acik}
                          onChange={() => ozellikToggle(t, key)}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* IVR Ayarları — sadece ivr özelliği açıksa */}
                {(t.ozellikler?.ivr ?? VARSAYILAN_OZELLIKLER.ivr) && (
                  <div style={{ borderTop:`1px solid ${C.border}`, marginTop:"1.25rem", paddingTop:"1.25rem" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                      marginBottom:"0.75rem" }}>
                      <p style={{ fontSize:"0.8rem", fontWeight:600, color: C.slate5,
                        textTransform:"uppercase", letterSpacing:"0.05em", margin:0 }}>
                        IVR / Telesekreter
                      </p>
                      {ivrDuzId !== t.id && (
                        <Btn onClick={() => ivrDuzenlemeBaslat(t)} variant="sky" small>
                          Düzenle
                        </Btn>
                      )}
                    </div>

                    {/* Webhook URL */}
                    <div style={{ marginBottom:"0.75rem" }}>
                      <p style={{ fontSize:"0.75rem", color: C.slate5, margin:"0 0 0.3rem" }}>
                        Twilio Webhook URL
                      </p>
                      <div style={{ display:"flex", gap:"0.5rem", alignItems:"center" }}>
                        <input
                          readOnly
                          value={`https://DOMAIN/api/ivr-webhook?tenant=${t.id}`}
                          style={{
                            flex:1, padding:"0.45rem 0.75rem", borderRadius:7,
                            border:`1px solid ${C.borderSky}`, background: C.skyLight,
                            fontSize:"0.75rem", fontFamily:"monospace", color: C.skyText,
                            outline:"none",
                          }}
                        />
                        <button
                          onClick={() => navigator.clipboard.writeText(`https://DOMAIN/api/ivr-webhook?tenant=${t.id}`).catch(()=>{})}
                          style={{
                            padding:"0.45rem 0.75rem", borderRadius:7,
                            border:`1px solid ${C.borderSky}`, background: C.skyLight,
                            color: C.skyText, fontSize:"0.75rem", cursor:"pointer",
                          }}
                        >
                          Kopyala
                        </button>
                      </div>
                      <p style={{ margin:"0.3rem 0 0", fontSize:"0.72rem", color: C.slate4 }}>
                        DOMAIN kısmını gerçek deploy URL'iniz ile değiştirin.
                      </p>
                    </div>

                    {/* Karşılama metni düzenleme */}
                    {ivrDuzId === t.id ? (
                      <div>
                        <Inp
                          label="Karşılama Metni"
                          value={ivrForm.karsilamaMetni}
                          placeholder="{firmaAdi}'na hoş geldiniz, {musteriAdi}."
                          onChange={e => setIvrForm({ ...ivrForm, karsilamaMetni: e.target.value })}
                        />
                        <p style={{ margin:"0.3rem 0 0.75rem", fontSize:"0.72rem", color: C.slate4 }}>
                          Değişkenler: {"{firmaAdi}"}, {"{musteriAdi}"}
                        </p>
                        <div style={{ display:"flex", gap:"0.5rem" }}>
                          <Btn onClick={() => ivrKaydet(t)} variant="primary" small>
                            {ivrKayit ? "Kaydediliyor…" : "Kaydet"}
                          </Btn>
                          <Btn onClick={() => setIvrDuzId(null)} variant="ghost" small>İptal</Btn>
                        </div>
                      </div>
                    ) : (
                      t.ivrAyarlari?.karsilamaMetni && (
                        <p style={{ fontSize:"0.82rem", color: C.slate7,
                          background: C.skyLight, border:`1px solid ${C.borderSky}`,
                          borderRadius:7, padding:"0.5rem 0.75rem", margin:0 }}>
                          "{t.ivrAyarlari.karsilamaMetni}"
                        </p>
                      )
                    )}
                  </div>
                )}

              </div>
            );
          })
        )}

        {/* Yeni işletme formu */}
        {formAcik && (
          <div style={{ ...CARD, marginTop:"0.5rem" }}>
            <h2 style={{ fontSize:"1rem", fontWeight:600, color: C.slate9, marginBottom:"1.25rem" }}>
              Yeni İşletme Ekle
            </h2>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:"0.85rem" }}>
              <Inp label="İşletme Adı *" value={yeni.ad} placeholder="Uzunoğlu Su"
                onChange={e => setYeni({ ...yeni, ad: e.target.value })} />
              <Inp label="Slug *" value={yeni.slug} placeholder="uzunoglu"
                onChange={e => setYeni({ ...yeni, slug: e.target.value })} />
              <Inp label="Domain" value={yeni.domain} placeholder="uzunoglususiparis.com"
                onChange={e => setYeni({ ...yeni, domain: e.target.value })} />
              <Inp label="Bölge" value={yeni.bolge} placeholder="İstanbul / Ümraniye"
                onChange={e => setYeni({ ...yeni, bolge: e.target.value })} />
              <Inp label="Logo URL" value={yeni.logo} placeholder="https://..."
                onChange={e => setYeni({ ...yeni, logo: e.target.value })} />
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                <label style={{ fontSize:"0.75rem", fontWeight:600, color: C.slate5,
                  textTransform:"uppercase", letterSpacing:"0.05em" }}>
                  Marka Rengi
                </label>
                <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
                  <input type="color" value={yeni.anaRenk}
                    onChange={e => setYeni({ ...yeni, anaRenk: e.target.value })}
                    style={{ width:48, height:36, border:`1px solid ${C.border}`,
                      borderRadius:6, padding:2, cursor:"pointer" }} />
                  <span style={{ fontFamily:"monospace", fontSize:"0.85rem", color: C.slate5 }}>
                    {yeni.anaRenk}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ marginTop:"1.25rem" }}>
              <p style={{ fontSize:"0.8rem", fontWeight:600, color: C.slate5,
                textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"0.75rem" }}>
                Başlangıç Özellikleri
              </p>
              <div style={{ display:"grid",
                gridTemplateColumns:"repeat(auto-fill, minmax(150px, 1fr))", gap:"0.6rem" }}>
                {OZELLIKLER.map(({ key, label }) => {
                  const acik = yeni.ozellikler[key];
                  return (
                    <OzellikItem
                      key={key}
                      label={label}
                      acik={acik}
                      onChange={() => setYeni({ ...yeni, ozellikler: { ...yeni.ozellikler, [key]: !acik } })}
                    />
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop:"1.5rem" }}>
              <Btn onClick={isletmeEkle} variant="primary">İşletme Ekle</Btn>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

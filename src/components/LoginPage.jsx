import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getDoc, doc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useTenant, useSetTenant } from "../tenant/TenantContext";

function IconPhone() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.63 19.79 19.79 0 01.25 2 2 2 0 012.24 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.29 6.29l1.28-1.28a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  );
}

function IconEye({ off }) {
  if (off) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

// 0553 764 16 82 formatı: XXXX XXX XX XX
function formatTelefon(val) {
  const d = val.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 4) return d;
  if (d.length <= 7) return `${d.slice(0, 4)} ${d.slice(4)}`;
  if (d.length <= 9) return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
  return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9)}`;
}

// ── Müşteri Giriş Formu ──────────────────────────────────────
function CustomerForm({ onLogin }) {
  const setTenant             = useSetTenant();
  const currentTenant         = useTenant();
  const [phone, setPhone]     = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    const digits = phone.replace(/\D/g, "");
    if (!phone.trim()) { setError("Telefon numarası zorunlu"); return; }
    if (digits.length < 10) { setError("En az 10 haneli geçerli bir numara girin"); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (currentTenant) setTenant(currentTenant);
      onLogin({ type: "customer", phone: phone.trim() });
    }, 600);
  };

  return (
    <div className="login-form">
      <p className="login-form-desc">
        Sipariş vermek için telefon numaranızla giriş yapın.
      </p>
      <div className="form-group">
        <label>Telefon Numarası</label>
        <div className="login-icon-wrap">
          <span className="login-icon"><IconPhone /></span>
          <input
            className={`login-input${error ? " login-input--error" : ""}`}
            type="tel"
            placeholder="0532 123 45 67"
            value={phone}
            autoFocus
            onChange={e => { setPhone(formatTelefon(e.target.value)); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
          />
        </div>
        {error && <span className="field-error">{error}</span>}
      </div>
      <button className="btn-login" onClick={handleLogin} disabled={loading}>
        {loading ? <span className="login-spinner" /> : "Giriş Yap"}
      </button>
    </div>
  );
}

// ── Çalışan Giriş Formu ──────────────────────────────────────
function EmployeeForm({ onLogin }) {
  const setTenant     = useSetTenant();
  const currentTenant = useTenant();
  const [email,   setEmail]   = useState("");
  const [sifre,   setSifre]   = useState("");
  const [showPw,  setShowPw]  = useState(false);
  const [hata,    setHata]    = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!email.trim() || !sifre) { setHata("E-posta ve şifre zorunlu"); return; }
    setHata(""); setLoading(true);
    try {
      const cred     = await signInWithEmailAndPassword(auth, email.trim(), sifre);
      const userSnap = await getDoc(doc(db, "users", cred.user.uid));

      if (!userSnap.exists()) {
        setHata(`Kullanıcı kaydı bulunamadı (uid: ${cred.user.uid}). Firestore → users koleksiyonuna bu uid ile kayıt eklenmeli.`); return;
      }
      const { rol, tenantId, displayName } = userSnap.data();

      if (rol !== "admin" && rol !== "kurye" && rol !== "superadmin") {
        setHata(`Bu hesabın panel erişim yetkisi yok. (rol: "${rol ?? "tanımsız"}")`); return;
      }

      const isSuperAdmin = rol === "superadmin";
      const effectiveTenantId = isSuperAdmin ? (tenantId || currentTenant?.id) : tenantId;

      if (!isSuperAdmin) {
        if (!effectiveTenantId) {
          setHata("Kullanıcıya bağlı işletme kaydı yok. (users kaydında tenantId alanı eksik)"); return;
        }
        if (currentTenant && effectiveTenantId !== currentTenant.id) {
          setHata(`Bu işletmeye yetkiniz yok. (hesap tenantId: "${effectiveTenantId}" — URL tenant: "${currentTenant.id}")`); return;
        }
      } else if (!effectiveTenantId) {
        setHata("Kullanıcıya bağlı işletme kaydı yok."); return;
      }

      const tenantSnap = await getDoc(doc(db, "tenants", effectiveTenantId));
      if (!tenantSnap.exists()) {
        setHata(`İşletme kaydı bulunamadı. (tenants/${effectiveTenantId} yok)`); return;
      }
      setTenant({ id: tenantSnap.id, ...tenantSnap.data() });
      onLogin({ type: rol, uid: cred.user.uid, displayName: displayName || email });
    } catch (err) {
      const authHatalar = ["auth/user-not-found","auth/wrong-password","auth/invalid-credential","auth/invalid-email"];
      setHata(authHatalar.includes(err.code) ? "E-posta veya şifre hatalı." : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-form">
      <p className="login-form-desc">Yönetim paneline erişmek için giriş yapın.</p>

      {hata && <div className="login-error-box">{hata}</div>}

      <div className="form-group">
        <label>E-posta</label>
        <div className="login-icon-wrap">
          <span className="login-icon"><IconUser /></span>
          <input
            className="login-input"
            type="email"
            placeholder="admin@isletme.com"
            value={email}
            autoFocus
            onChange={e => { setEmail(e.target.value); setHata(""); }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
          />
        </div>
      </div>

      <div className="form-group">
        <label>Şifre</label>
        <div className="login-icon-wrap">
          <span className="login-icon"><IconLock /></span>
          <input
            className="login-input login-input--pw"
            type={showPw ? "text" : "password"}
            placeholder="••••••••"
            value={sifre}
            onChange={e => { setSifre(e.target.value); setHata(""); }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
          />
          <button type="button" className="login-pw-toggle" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
            <IconEye off={showPw} />
          </button>
        </div>
      </div>

      <button className="btn-login" onClick={handleLogin} disabled={loading}>
        {loading ? <span className="login-spinner" /> : "Giriş Yap"}
      </button>
    </div>
  );
}

// ── Ana bileşen ──────────────────────────────────────────────
export default function LoginPage({ onLogin, mode = "customer" }) {
  const isEmployee = mode === "employee";
  const tenant     = useTenant();

  const markaAd   = tenant?.marka?.ad  || tenant?.ad  || "SiparisPro";
  const markaRenk = tenant?.marka?.anaRenk             || null;
  const markaLogo = tenant?.marka?.logo                || null;

  // Sadece geçerli alfanumerik karakterler — URL birikmesini önler
  const rawSlug  = new URLSearchParams(window.location.search).get("tenant") || "";
  const tenantSlug = rawSlug.replace(/[^a-zA-Z0-9_-]/g, "");
  const query    = tenantSlug ? `?tenant=${tenantSlug}` : "";

  const goCalisanGirisi = () => { window.location.href = `/calisan${query}`; };
  const goMusteriGirisi = () => { window.location.href = `/${query}`; };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo-ring" style={markaRenk ? { background: markaRenk } : undefined}>
            {markaLogo ? (
              <img src={markaLogo} alt={markaAd} style={{ width: 34, height: 34, objectFit: "contain", borderRadius: 6 }} />
            ) : (
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 2C6 8 4 11 4 14a8 8 0 0016 0c0-3-2-6-8-12z"/>
              </svg>
            )}
          </div>
          <div className="login-app-name">{markaAd}</div>
          <div className="login-subtitle">Akıllı Sipariş ve Dağıtım Yönetimi</div>
          <div className="login-tagline">
            {isEmployee ? "Çalışan Paneli" : "Sipariş vermek için giriş yapın"}
          </div>
        </div>

<div className="login-body">
          {isEmployee
            ? <EmployeeForm onLogin={onLogin} />
            : <CustomerForm onLogin={onLogin} />
          }
        </div>

        <div style={{ textAlign:"center", padding:"0 1.5rem 1.5rem" }}>
          {isEmployee ? (
            <button
              onClick={goMusteriGirisi}
              style={{ background:"none", border:"none", color:"#94a3b8", fontSize:"0.8rem", cursor:"pointer", textDecoration:"underline" }}
            >
              Müşteri girişine dön
            </button>
          ) : (
            <button
              onClick={goCalisanGirisi}
              style={{ background:"none", border:"none", color:"#94a3b8", fontSize:"0.8rem", cursor:"pointer", textDecoration:"underline" }}
            >
              Personel / Yönetici Girişi
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

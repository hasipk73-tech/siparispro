import { useState } from "react";

const EMPLOYEES = [
  { username: "admin", password: "1234", displayName: "Yönetici", type: "admin" },
  { username: "kurye", password: "5678", displayName: "Kurye",    type: "kurye" },
];

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

// ── Müşteri Giriş Formu ──────────────────────────────────────
function CustomerForm({ onLogin }) {
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
            onChange={e => { setPhone(e.target.value); setError(""); }}
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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);

  const handleLogin = () => {
    const e = {};
    if (!username.trim()) e.username = "Kullanıcı adı zorunlu";
    if (!password)        e.password = "Şifre zorunlu";
    if (!Object.keys(e).length) {
      const emp = EMPLOYEES.find(em => em.username === username.trim() && em.password === password);
      if (!emp) e.general = "Kullanıcı adı veya şifre hatalı";
    }
    if (Object.keys(e).length) { setErrors(e); return; }

    const emp = EMPLOYEES.find(em => em.username === username.trim());
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin({ type: emp.type, username: emp.username, displayName: emp.displayName });
    }, 600);
  };

  const clr = (key) => setErrors(er => ({ ...er, [key]: undefined, general: undefined }));

  return (
    <div className="login-form">
      <p className="login-form-desc">
        Yönetim paneline erişmek için giriş yapın.
      </p>

      {errors.general && <div className="login-error-box">{errors.general}</div>}

      <div className="form-group">
        <label>Kullanıcı Adı</label>
        <div className="login-icon-wrap">
          <span className="login-icon"><IconUser /></span>
          <input
            className={`login-input${errors.username ? " login-input--error" : ""}`}
            type="text"
            placeholder="kullanici_adi"
            value={username}
            autoFocus
            onChange={e => { setUsername(e.target.value); clr("username"); }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
          />
        </div>
        {errors.username && <span className="field-error">{errors.username}</span>}
      </div>

      <div className="form-group">
        <label>Şifre</label>
        <div className="login-icon-wrap">
          <span className="login-icon"><IconLock /></span>
          <input
            className={`login-input login-input--pw${errors.password ? " login-input--error" : ""}`}
            type={showPw ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={e => { setPassword(e.target.value); clr("password"); }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
          />
          <button type="button" className="login-pw-toggle" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
            <IconEye off={showPw} />
          </button>
        </div>
        {errors.password && <span className="field-error">{errors.password}</span>}
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

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo-ring">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 2C6 8 4 11 4 14a8 8 0 0016 0c0-3-2-6-8-12z"/>
            </svg>
          </div>
          <div className="login-app-name">SiparisPro</div>
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
      </div>
    </div>
  );
}

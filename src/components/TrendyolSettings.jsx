import { useState, useEffect } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useTenant } from "../tenant/TenantContext";

export default function TrendyolSettings({ onClose }) {
  const tenant = useTenant();
  const [form, setForm]     = useState({ sellerId: "", apiKey: "", apiSecret: "", webhookSecret: "", enabled: false });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [hata,    setHata]    = useState("");

  useEffect(() => {
    if (!tenant?.id) { setLoading(false); return; }
    // Ayarlar tenants/{id} belgesinin "trendyolSettings" alanında saklanır.
    // Bu sayede mevcut rules (allow read: if true, write: if auth) yeterli.
    const unsub = onSnapshot(
      doc(db, "tenants", tenant.id),
      snap => {
        const data = snap.data()?.trendyolSettings;
        if (data) setForm(f => ({ ...f, ...data }));
        setLoading(false);
      },
      err => {
        setHata(`Ayarlar yüklenemedi: ${err.code}`);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [tenant?.id]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!tenant?.id) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "tenants", tenant.id), { trendyolSettings: form });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally { setSaving(false); }
  };

  const webhookUrl = tenant?.id
    ? `${window.location.origin}/api/trendyol-webhook?tenant=${tenant.id}`
    : `${window.location.origin}/api/trendyol-webhook?tenant=TENANT_ID`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal trendyol-modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <div className="modal__title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span className="ty-badge">T</span>
            Trendyol Entegrasyonu
          </div>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--gray-400)" }}>Yükleniyor…</div>
        ) : hata ? (
          <div style={{ padding: "2rem", color: "#dc2626", fontSize: "0.9rem" }}>{hata}</div>
        ) : (
          <div className="modal__body">

            {/* Aktif/Pasif toggle */}
            <div className="ty-status-row">
              <div>
                <div className="ty-status-label">Entegrasyon Durumu</div>
                <div className="ty-status-hint">Kapalıyken webhook siparişleri reddedilir</div>
              </div>
              <button
                className={`ty-toggle${form.enabled ? " ty-toggle--on" : ""}`}
                onClick={() => set("enabled", !form.enabled)}
              >
                <span className="ty-toggle__knob" />
                <span className="ty-toggle__label">{form.enabled ? "Aktif" : "Pasif"}</span>
              </button>
            </div>

            <div className="form-group">
              <label>Satıcı ID (Supplier ID)</label>
              <input type="text" placeholder="12345678"
                value={form.sellerId}
                onChange={e => set("sellerId", e.target.value)} />
            </div>

            <div className="form-group">
              <label>API Key</label>
              <input type="text" placeholder="xxxxxxxxxxxxxxxxxxxxxxxx"
                value={form.apiKey}
                onChange={e => set("apiKey", e.target.value)} />
            </div>

            <div className="form-group">
              <label>API Secret</label>
              <input type="password" placeholder="••••••••••••••••••••••••"
                value={form.apiSecret}
                onChange={e => set("apiSecret", e.target.value)} />
            </div>

            <div className="form-group">
              <label>Webhook İmza Anahtarı
                <span className="ty-optional">opsiyonel · güvenlik için önerilir</span>
              </label>
              <input type="text" placeholder="güçlü-gizli-anahtar"
                value={form.webhookSecret}
                onChange={e => set("webhookSecret", e.target.value)} />
            </div>

            {/* Webhook URL bilgisi */}
            <div className="ty-webhook-box">
              <div className="ty-webhook-box__title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Trendyol Webhook URL
              </div>
              <div className="ty-webhook-box__url">{webhookUrl}</div>
              <div className="ty-webhook-box__steps">
                <p>
                  Trendyol Satıcı Paneli → Entegrasyonlar → Webhook Ayarları → Yeni Webhook ekle
                  → <strong>yukarıdaki URL'yi olduğu gibi yapıştırın</strong> (firma ID'si zaten içinde).
                </p>
                <p>Her firma kendi URL'ini kullanır — tek sunucu, sınırsız firma.</p>
                <p>Webhook Secret varsa aynı değeri Vercel'de <code>TRENDYOL_WEBHOOK_SECRET</code> env var olarak da ekleyin.</p>
              </div>
            </div>

            <button
              className="btn btn--primary"
              style={{ width: "100%", padding: "0.7rem", fontSize: "0.9rem" }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Kaydediliyor…" : saved ? "✓ Kaydedildi" : "Kaydet"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

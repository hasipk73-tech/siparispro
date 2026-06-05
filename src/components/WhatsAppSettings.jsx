import { useState } from "react";

export default function WhatsAppSettings({ settings, onSave, onClose, onTest }) {
  const [form, setForm] = useState({
    enabled: settings.enabled ?? false,
    phone:   settings.phone   ?? "",
    apiKey:  settings.apiKey  ?? "",
  });
  const [testSent, setTestSent] = useState(false);

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  const handleTest = () => {
    onSave(form);          // önce kaydet ki notify güncel ayarları kullansın
    const ok = onTest();
    if (ok) { setTestSent(true); setTimeout(() => setTestSent(false), 3000); }
  };

  const ready = form.phone.trim() && form.apiKey.trim();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal__header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <h2 className="modal__title">WhatsApp Bildirimleri</h2>
          </div>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="modal__body">
          {/* Toggle */}
          <label className="wa-toggle">
            <div className={`wa-toggle__track${form.enabled ? " wa-toggle__track--on" : ""}`}
              onClick={() => setForm(f => ({ ...f, enabled: !f.enabled }))}>
              <div className="wa-toggle__thumb" />
            </div>
            <span className="wa-toggle__label">
              {form.enabled ? "Bildirimler Açık" : "Bildirimler Kapalı"}
            </span>
          </label>

          {/* Kurulum talimatları */}
          <div className="wa-instructions">
            <div className="wa-instructions__title">Kurulum (tek seferlik)</div>
            <ol className="wa-instructions__list">
              <li>
                Kurye WhatsApp'tan <strong>+34 644 60 04 88</strong> numarasına şu mesajı göndersin:
                <code className="wa-code">I allow callmebot to send me messages</code>
              </li>
              <li>CallMeBot, API anahtarını yanıt olarak gönderir.</li>
              <li>Aşağıya kurye numarasını ve API anahtarını gir.</li>
            </ol>
          </div>

          <div className="form-group">
            <label>Kurye WhatsApp Numarası</label>
            <input
              type="tel"
              placeholder="905551234567 (başında + olmadan)"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\s/g, "") }))}
            />
            <span style={{ fontSize: "0.72rem", color: "var(--gray-500)" }}>
              Uluslararası format, başında + olmadan. Türkiye: 90 ile başla
            </span>
          </div>

          <div className="form-group">
            <label>CallMeBot API Anahtarı</label>
            <input
              type="text"
              placeholder="CallMeBot'tan gelen anahtar"
              value={form.apiKey}
              onChange={e => setForm(f => ({ ...f, apiKey: e.target.value.trim() }))}
            />
          </div>

          {testSent && (
            <div className="wa-test-success">
              Test mesajı gönderildi! WhatsApp'ı kontrol et.
            </div>
          )}

          <button
            className="wa-btn-test"
            onClick={handleTest}
            disabled={!ready}
          >
            Test Mesajı Gönder
          </button>
        </div>

        <div className="modal__footer">
          <button className="btn btn--outline" onClick={onClose}>İptal</button>
          <button className="btn btn--primary" onClick={handleSave}>Kaydet</button>
        </div>
      </div>
    </div>
  );
}

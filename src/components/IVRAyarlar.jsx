import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useTenant } from "../tenant/TenantContext";

export default function IVRAyarlar({ onClose }) {
  const tenant  = useTenant();
  const ivrMev  = tenant?.ivrAyarlari || {};

  const [karsilamaMetni, setKarsilamaMetni] = useState(
    ivrMev.karsilamaMetni || ""
  );
  const [whatsappTelefon, setWhatsappTelefon] = useState(
    ivrMev.whatsappTelefon || ""
  );
  const [whatsappApiKey, setWhatsappApiKey] = useState(
    ivrMev.whatsappApiKey || ""
  );
  const [kayit,  setKayit]  = useState(false);
  const [hata,   setHata]   = useState("");
  const [basari, setBasari]  = useState(false);

  const webhookUrl = tenant?.id
    ? `${window.location.origin}/api/ivr-webhook?tenant=${tenant.id}`
    : "—";

  async function kaydet() {
    if (!tenant?.id) return;
    setKayit(true); setHata(""); setBasari(false);
    try {
      await updateDoc(doc(db, "tenants", tenant.id), {
        "ivrAyarlari.karsilamaMetni":  karsilamaMetni.trim(),
        "ivrAyarlari.whatsappTelefon": whatsappTelefon.trim(),
        "ivrAyarlari.whatsappApiKey":  whatsappApiKey.trim(),
      });
      setBasari(true);
      setTimeout(() => setBasari(false), 3000);
    } catch (e) {
      setHata("Kayıt başarısız: " + e.message);
    } finally {
      setKayit(false);
    }
  }

  function kopyala() {
    navigator.clipboard.writeText(webhookUrl).catch(() => {});
  }

  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,.45)",
      display:"flex", alignItems:"center", justifyContent:"center",
      zIndex:1000, padding:"1rem",
    }}>
      <div style={{
        background:"#fff", borderRadius:16, width:"100%", maxWidth:520,
        boxShadow:"0 8px 32px rgba(0,0,0,.18)", overflow:"hidden",
      }}>
        {/* Başlık */}
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"1.25rem 1.5rem", borderBottom:"1px solid #e2e8f0",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:"0.6rem" }}>
            <span style={{ fontSize:"1.3rem" }}>📞</span>
            <div>
              <h2 style={{ margin:0, fontSize:"1rem", fontWeight:700, color:"#0f172a" }}>
                IVR / Telesekreter Ayarları
              </h2>
              <p style={{ margin:0, fontSize:"0.78rem", color:"#64748b" }}>
                Twilio entegrasyonu için webhook URL ve özelleştirmeler
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              border:"none", background:"#f1f5f9", borderRadius:8,
              width:32, height:32, cursor:"pointer", fontSize:"1.1rem",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}
          >×</button>
        </div>

        <div style={{ padding:"1.5rem", display:"flex", flexDirection:"column", gap:"1.25rem" }}>

          {/* Webhook URL */}
          <div>
            <label style={{ display:"block", fontSize:"0.75rem", fontWeight:600,
              color:"#64748b", textTransform:"uppercase", letterSpacing:"0.05em",
              marginBottom:"0.4rem" }}>
              Webhook URL (Twilio paneline girin)
            </label>
            <div style={{ display:"flex", gap:"0.5rem", alignItems:"stretch" }}>
              <input
                readOnly
                value={webhookUrl}
                style={{
                  flex:1, padding:"0.55rem 0.9rem", borderRadius:8,
                  border:"1px solid #e2e8f0", fontSize:"0.78rem",
                  fontFamily:"monospace", background:"#f8fafc", color:"#334155",
                  outline:"none",
                }}
              />
              <button
                onClick={kopyala}
                style={{
                  padding:"0.55rem 0.85rem", borderRadius:8,
                  border:"1px solid #bae6fd", background:"#f0f9ff",
                  color:"#0c4a6e", fontSize:"0.8rem", fontWeight:600,
                  cursor:"pointer", whiteSpace:"nowrap",
                }}
              >
                Kopyala
              </button>
            </div>
            <p style={{ margin:"0.4rem 0 0", fontSize:"0.75rem", color:"#94a3b8" }}>
              Twilio → Phone Numbers → Webhook: A call comes in → bu URL
            </p>
          </div>

          {/* Karşılama metni */}
          <div>
            <label style={{ display:"block", fontSize:"0.75rem", fontWeight:600,
              color:"#64748b", textTransform:"uppercase", letterSpacing:"0.05em",
              marginBottom:"0.4rem" }}>
              Özel Karşılama Metni
            </label>
            <textarea
              rows={3}
              value={karsilamaMetni}
              onChange={e => setKarsilamaMetni(e.target.value)}
              placeholder="{firmaAdi}'na hoş geldiniz, {musteriAdi}."
              style={{
                width:"100%", boxSizing:"border-box",
                padding:"0.6rem 0.9rem", borderRadius:8,
                border:"1px solid #e2e8f0", fontSize:"0.88rem",
                color:"#0f172a", resize:"vertical", outline:"none",
                fontFamily:"inherit",
              }}
            />
            <p style={{ margin:"0.4rem 0 0", fontSize:"0.75rem", color:"#94a3b8" }}>
              Değişkenler: <code style={{ fontFamily:"monospace" }}>{"{firmaAdi}"}</code>,{" "}
              <code style={{ fontFamily:"monospace" }}>{"{musteriAdi}"}</code>. Boş bırakılırsa varsayılan kullanılır.
            </p>
          </div>

          {/* WhatsApp bildirim */}
          <div style={{
            background:"#f0fdf4", border:"1px solid #a7f3d0",
            borderRadius:10, padding:"1rem",
          }}>
            <p style={{ margin:"0 0 0.75rem", fontSize:"0.8rem", fontWeight:600, color:"#065f46" }}>
              Sipariş Onay Bildirimi (WhatsApp — CallMeBot)
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:"0.65rem" }}>
              <div>
                <label style={{ display:"block", fontSize:"0.75rem", fontWeight:600,
                  color:"#64748b", marginBottom:"0.3rem" }}>
                  WhatsApp Telefon (uluslararası format: +905551234567)
                </label>
                <input
                  type="tel"
                  value={whatsappTelefon}
                  onChange={e => setWhatsappTelefon(e.target.value)}
                  placeholder="+905551234567"
                  style={{
                    width:"100%", boxSizing:"border-box",
                    padding:"0.55rem 0.9rem", borderRadius:8,
                    border:"1px solid #e2e8f0", fontSize:"0.88rem",
                    color:"#0f172a", outline:"none",
                  }}
                />
              </div>
              <div>
                <label style={{ display:"block", fontSize:"0.75rem", fontWeight:600,
                  color:"#64748b", marginBottom:"0.3rem" }}>
                  CallMeBot API Key
                </label>
                <input
                  type="password"
                  value={whatsappApiKey}
                  onChange={e => setWhatsappApiKey(e.target.value)}
                  placeholder="callmebot.com'dan alınan key"
                  style={{
                    width:"100%", boxSizing:"border-box",
                    padding:"0.55rem 0.9rem", borderRadius:8,
                    border:"1px solid #e2e8f0", fontSize:"0.88rem",
                    color:"#0f172a", outline:"none",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Twilio SMS notu */}
          <div style={{
            background:"#f0f9ff", border:"1px solid #bae6fd",
            borderRadius:10, padding:"0.9rem 1rem", fontSize:"0.8rem", color:"#0c4a6e",
          }}>
            <strong>Twilio SMS:</strong> <code>TWILIO_ACCOUNT_SID</code>, <code>TWILIO_AUTH_TOKEN</code>,{" "}
            <code>TWILIO_FROM_NUMBER</code> env değişkenleri tanımlıysa otomatik aktif olur.
            Gerçek hesap bağlandığında ek ayar gerekmez.
          </div>

          {/* Hata / başarı */}
          {hata && (
            <div style={{ padding:"0.65rem 1rem", background:"#fef2f2",
              border:"1px solid #fca5a5", borderRadius:8, color:"#dc2626", fontSize:"0.85rem" }}>
              {hata}
            </div>
          )}
          {basari && (
            <div style={{ padding:"0.65rem 1rem", background:"#f0fdf4",
              border:"1px solid #a7f3d0", borderRadius:8, color:"#059669", fontSize:"0.85rem" }}>
              Ayarlar kaydedildi.
            </div>
          )}

          {/* Butonlar */}
          <div style={{ display:"flex", gap:"0.5rem", justifyContent:"flex-end" }}>
            <button
              onClick={onClose}
              style={{
                padding:"0.6rem 1.2rem", borderRadius:8,
                border:"1px solid #e2e8f0", background:"#f8fafc",
                color:"#64748b", fontSize:"0.88rem", fontWeight:600, cursor:"pointer",
              }}
            >
              İptal
            </button>
            <button
              onClick={kaydet}
              disabled={kayit}
              style={{
                padding:"0.6rem 1.4rem", borderRadius:8,
                border:"none", background: kayit ? "#94a3b8" : "#0284c7",
                color:"#fff", fontSize:"0.88rem", fontWeight:600, cursor:"pointer",
              }}
            >
              {kayit ? "Kaydediliyor…" : "Kaydet"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

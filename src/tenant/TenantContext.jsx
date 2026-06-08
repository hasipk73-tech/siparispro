import { createContext, useContext, useEffect, useState } from "react";
import { signInAnonymously } from "firebase/auth";
import { auth } from "../firebase";
import { resolveTenant } from "./resolveTenant";

const TenantCtx    = createContext(null);
const TenantSetCtx = createContext(() => {});

export const useTenant    = () => useContext(TenantCtx);
export const useSetTenant = () => useContext(TenantSetCtx);

export function TenantProvider({ children }) {
  const [urlTenant, setUrlTenant] = useState(null);
  const [override,  setOverride]  = useState(null);
  const [durum,     setDurum]     = useState("yukleniyor");
  const [hata,      setHata]      = useState("");

  useEffect(() => {
    let iptal = false;
    (async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        if (!iptal) setHata(`${err.code}: ${err.message}`);
        return;
      }
      try {
        const t = await resolveTenant();
        if (iptal) return;
        if (t) setUrlTenant(t);
        setDurum("hazir");
      } catch (err) {
        if (!iptal) setHata(err.message || String(err));
      }
    })();
    return () => { iptal = true; };
  }, []);

  const tenant = override || urlTenant;

  // Renk ve başlık her tenant değişiminde güncellensin (override dahil)
  // Hook'lar erken return'lerden ÖNCE çağrılmalı — Rules of Hooks
  useEffect(() => {
    if (tenant) uygulaMarka(tenant);
  }, [tenant]);

  if (hata) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#fff1f2" }}>
      <div style={{ background:"#fee2e2", border:"1px solid #fca5a5", borderRadius:12, padding:"1.5rem 2rem", maxWidth:480, color:"#dc2626", fontFamily:"monospace", fontSize:"0.9rem" }}>
        <strong>HATA:</strong> {hata}
      </div>
    </div>
  );

  if (durum === "yukleniyor") return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", color:"#64748b" }}>
      <div style={{ width:28, height:28, border:"3px solid #bfdbfe", borderTopColor:"#2563eb", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
    </div>
  );

  return (
    <TenantSetCtx.Provider value={setOverride}>
      <TenantCtx.Provider value={tenant}>
        {children}
      </TenantCtx.Provider>
    </TenantSetCtx.Provider>
  );
}

function uygulaMarka(t) {
  const renk = t.marka?.anaRenk || "#0284c7";
  document.documentElement.style.setProperty("--marka", renk);
  document.title = t.marka?.ad || t.ad || "Sipariş";
  if (t.marka?.favicon) {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
    link.href = t.marka.favicon;
  }
}

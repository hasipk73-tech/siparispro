// src/tenant/resolveTenant.js
// Gelinen adrese (domain veya subdomain) bakıp hangi tenant olduğunu çözer.
//
// Çalışma mantığı:
//   uzunoglususiparis.com        -> tenant: "uzunoglu"
//   gelalyavuzturksiparis.com    -> tenant: "gelalyavuzturk"
//   ahmetsu.siparispro.com       -> tenant: "ahmetsu"  (subdomain de desteklenir)
//   localhost?tenant=uzunoglu    -> tenant: "uzunoglu" (lokal test)
//
// Domain -> tenant eşleşmesi Firestore'daki "tenants" koleksiyonundan okunur,
// böylece yeni müşteri eklemek için KOD DEĞİŞTİRMEZSİN — sadece kayıt açarsın.

import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export async function resolveTenant() {
  const host   = window.location.hostname;
  const params = new URLSearchParams(window.location.search);

  if (host === "localhost" || host === "127.0.0.1") {
    const t = params.get("tenant");
    if (t) return await tenantBySlug(t);
    return null;
  }

  const byDomain = await tenantByDomain(host);
  if (byDomain) return byDomain;

  const parts = host.split(".");
  if (parts.length > 2) {
    const t = await tenantBySlug(parts[0]);
    if (t) return t;
  }

  return null;
}

async function tenantByDomain(domain) {
  const q = query(collection(db, "tenants"), where("domains", "array-contains", domain));
  try {
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() };
  } catch (err) {
    throw new Error(`tenantByDomain hatası: ${err.code} — ${err.message}`);
  }
}

async function tenantBySlug(slug) {
  const q = query(collection(db, "tenants"), where("slug", "==", slug));
  try {
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() };
  } catch (err) {
    throw new Error(`tenantBySlug hatası: ${err.code} — ${err.message}`);
  }
}

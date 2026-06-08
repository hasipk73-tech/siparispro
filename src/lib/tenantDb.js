// src/lib/tenantDb.js
// VERİ İZOLASYONUNUN KALBİ. Her sorgu otomatik tenantId ile filtrelenir.
// Doğrudan Firestore çağırmak yerine bunu kullan — bir tenant ASLA
// başka tenant'ın siparişini göremez/yazamaz.

import {
  collection, query, where, getDocs, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

export function tenantDb(tenantId) {
  if (!tenantId) throw new Error("tenantId zorunlu");

  async function listele(koleksiyon, ekstraKosullar = []) {
    const q = query(collection(db, koleksiyon), where("tenantId", "==", tenantId), ...ekstraKosullar);
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  function dinle(koleksiyon, callback, ekstraKosullar = [], onHata = null) {
    const q = query(collection(db, koleksiyon), where("tenantId", "==", tenantId), ...ekstraKosullar);
    return onSnapshot(
      q,
      (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err)  => { if (onHata) onHata(err); else callback([]); }
    );
  }

  async function ekle(koleksiyon, veri) {
    return await addDoc(collection(db, koleksiyon), {
      ...veri, tenantId, olusturmaTarihi: serverTimestamp(),
    });
  }
  async function guncelle(koleksiyon, id, veri) {
    return await updateDoc(doc(db, koleksiyon, id), veri);
  }
  async function sil(koleksiyon, id) {
    return await deleteDoc(doc(db, koleksiyon, id));
  }

  return { listele, dinle, ekle, guncelle, sil, tenantId };
}

// ── KULLANIM (senin orders koleksiyonun için) ──────────────────────
//
//  import { useTenant } from "../tenant/TenantContext";
//  import { tenantDb } from "../lib/tenantDb";
//
//  const tenant = useTenant();
//  const tdb = tenantDb(tenant.id);
//
//  // Siparişleri canlı dinle (eski onSnapshot(collection(db,"orders")) yerine):
//  useEffect(() => tdb.dinle("orders", setSiparisler), []);
//
//  // Yeni sipariş ekle (tenantId otomatik eklenir):
//  tdb.ekle("orders", { musteri, urunler, tutar, durum: "yeni" });
//
//  // Sipariş durumu güncelle:
//  tdb.guncelle("orders", siparisId, { durum: "yolda" });

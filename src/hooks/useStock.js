import { useState, useEffect } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase";

const STOCK_DOC = doc(db, "settings", "stock");

export function useStock() {
  const [closedIds, setClosedIds] = useState(new Set());

  useEffect(() => {
    const unsub = onSnapshot(STOCK_DOC, (snap) => {
      setClosedIds(new Set(snap.data()?.closedIds || []));
    });
    return () => unsub();
  }, []);

  const toggleProduct = async (id) => {
    const next = new Set(closedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    await setDoc(STOCK_DOC, { closedIds: [...next] });
  };

  return { closedIds, toggleProduct };
}

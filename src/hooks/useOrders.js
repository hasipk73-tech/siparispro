import { useState, useMemo, useEffect, useRef } from "react";
import {
  collection, onSnapshot, addDoc, updateDoc, doc,
  query, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { PRODUCTS } from "../data/products";
import { CATALOG_PRODUCTS } from "../data/catalogProducts";

const ORDERS_COL = "orders";

export function useOrders(onNewOrder) {
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [searchTerm, setSearchTerm]   = useState("");
  const [statusFilter, setStatusFilter] = useState("hepsi");

  // Track IDs known at initial load so we only fire onNewOrder for truly new orders
  const initialIdsRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, ORDERS_COL), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // First snapshot: record existing IDs, don't fire notifications
      if (initialIdsRef.current === null) {
        initialIdsRef.current = new Set(docs.map((o) => o.id));
        setOrders(docs);
        setLoading(false);
        return;
      }

      // Subsequent snapshots: detect brand-new documents and notify
      docs.forEach((order) => {
        if (!initialIdsRef.current.has(order.id)) {
          initialIdsRef.current.add(order.id);
          onNewOrder?.(order);
        }
      });

      setOrders(docs);
    });

    return () => unsub();
  }, [onNewOrder]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        o.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.neighborhood?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.address?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "hepsi"  ? true :
        statusFilter === "borclu" ? o.totalDebt > 0 :
        o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const grouped = useMemo(() => {
    return filtered.reduce((acc, order) => {
      if (!acc[order.neighborhood]) acc[order.neighborhood] = [];
      acc[order.neighborhood].push(order);
      return acc;
    }, {});
  }, [filtered]);

  const updateOrder = async (id, updates) => {
    await updateDoc(doc(db, ORDERS_COL, id), updates);
  };

  const addOrder = async (orderData) => {
    const newOrder = {
      ...orderData,
      status: "beklemede",
      paymentStatus: null,
      orderTotal: orderData.totalDebt || 0,
      totalDebt: 0,
      lastDelivery: new Date().toISOString().split("T")[0],
      createdAt: serverTimestamp(),
    };
    await addDoc(collection(db, ORDERS_COL), newOrder);
  };

  const stats = useMemo(() => ({
    total:      orders.length,
    delivered:  orders.filter((o) => o.status === "teslim_edildi").length,
    pending:    orders.filter((o) => o.status === "beklemede").length,
    onRoute:    orders.filter((o) => o.status === "yolda").length,
    totalDebt:  orders.reduce((sum, o) => sum + (o.totalDebt || 0), 0),
  }), [orders]);

  const gunSonuStats = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];

    const todayOrders    = orders.filter(o => o.lastDelivery === todayStr);
    const todayDelivered = todayOrders.filter(o => o.status === "teslim_edildi");
    const todayOnRoute   = todayOrders.filter(o => o.status === "yolda");
    const todayPending   = todayOrders.filter(o => o.status === "beklemede");

    const catalogMap = Object.fromEntries(CATALOG_PRODUCTS.map(p => [p.name, p]));
    const unitPrice = (name, dt) => {
      const p = catalogMap[name];
      if (!p) return 0;
      return dt === "gelAl" ? p.gelAl : p.eveTeslim;
    };

    const productStats = {};

    todayDelivered.forEach(order => {
      const dt = order.deliveryType || "eveTeslim";
      if (order.items?.length) {
        order.items.forEach(item => {
          const name = item.product;
          if (!productStats[name]) productStats[name] = { gelAl: { qty: 0, rev: 0 }, eveTeslim: { qty: 0, rev: 0 } };
          const rev = item.total ?? item.qty * (item.unitPrice || unitPrice(name, dt));
          productStats[name][dt].qty += item.qty;
          productStats[name][dt].rev += rev;
        });
      } else {
        const name = order.product;
        if (!name) return;
        if (!productStats[name]) productStats[name] = { gelAl: { qty: 0, rev: 0 }, eveTeslim: { qty: 0, rev: 0 } };
        const price = unitPrice(name, dt);
        productStats[name][dt].qty += order.amount;
        productStats[name][dt].rev += order.amount * price;
      }
    });

    const seenNames = new Set();
    const productTotals = [];

    PRODUCTS.forEach(name => {
      if (!productStats[name]) return;
      seenNames.add(name);
      const s = productStats[name];
      const cp = catalogMap[name];
      productTotals.push({
        name,
        gelAlQty:           s.gelAl.qty,
        gelAlRevenue:       s.gelAl.rev,
        gelAlUnitPrice:     cp?.gelAl ?? 0,
        eveTeslimQty:       s.eveTeslim.qty,
        eveTeslimRevenue:   s.eveTeslim.rev,
        eveTeslimUnitPrice: cp?.eveTeslim ?? 0,
        totalQty:     s.gelAl.qty + s.eveTeslim.qty,
        totalRevenue: s.gelAl.rev + s.eveTeslim.rev,
      });
    });

    Object.keys(productStats).forEach(name => {
      if (seenNames.has(name)) return;
      const s = productStats[name];
      productTotals.push({
        name,
        gelAlQty: s.gelAl.qty,         gelAlRevenue: s.gelAl.rev,         gelAlUnitPrice: 0,
        eveTeslimQty: s.eveTeslim.qty, eveTeslimRevenue: s.eveTeslim.rev, eveTeslimUnitPrice: 0,
        totalQty: s.gelAl.qty + s.eveTeslim.qty,
        totalRevenue: s.gelAl.rev + s.eveTeslim.rev,
      });
    });

    const todayGelAlRevenue     = productTotals.reduce((s, p) => s + p.gelAlRevenue, 0);
    const todayEveTeslimRevenue = productTotals.reduce((s, p) => s + p.eveTeslimRevenue, 0);
    const todayTotalRevenue     = todayGelAlRevenue + todayEveTeslimRevenue;

    return {
      date: todayStr,
      todayTotal:           todayOrders.length,
      todayDelivered:       todayDelivered.length,
      todayOnRoute:         todayOnRoute.length,
      todayPending:         todayPending.length,
      todayAmountDelivered: todayDelivered.reduce((s, o) => s + (o.amount || 0), 0),
      todayTotalRevenue,
      todayGelAlRevenue,
      todayEveTeslimRevenue,
      productTotals,
      allTotal:     orders.length,
      allDelivered: orders.filter(o => o.status === "teslim_edildi").length,
      allOnRoute:   orders.filter(o => o.status === "yolda").length,
      allPending:   orders.filter(o => o.status === "beklemede").length,
    };
  }, [orders]);

  return {
    orders,
    loading,
    grouped,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    updateOrder,
    addOrder,
    stats,
    gunSonuStats,
  };
}

import { useState } from "react";
import OrderCard from "./OrderCard";

export default function NeighborhoodSection({ name, orders, onUpdate }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <section className="neighborhood-section">
      <button
        className="neighborhood-header"
        onClick={() => setCollapsed((c) => !c)}
      >
        <div className="neighborhood-header__left">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span className="neighborhood-name">{name}</span>
          <span className="neighborhood-count">{orders.length} sipariş</span>
        </div>
        <svg
          className={`chevron ${collapsed ? "" : "chevron--open"}`}
          width="20" height="20" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {!collapsed && (
        <div className="order-grid">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} onUpdate={onUpdate} />
          ))}
        </div>
      )}
    </section>
  );
}

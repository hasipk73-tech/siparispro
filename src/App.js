import { useState, useCallback } from "react";
import "./App.css";
import { useOrders } from "./hooks/useOrders";
import { useNotifications } from "./hooks/useNotifications";
import { useStock } from "./hooks/useStock";
import StatCard from "./components/StatCard";
import NeighborhoodSection from "./components/NeighborhoodSection";
import NotificationBanner from "./components/NotificationBanner";
import AddOrderModal from "./components/AddOrderModal";
import CustomerOrderPage from "./components/CustomerOrderPage";
import MyOrders from "./components/MyOrders";
import LoginPage from "./components/LoginPage";
import GunSonuModal from "./components/GunSonuModal";
import DebtView from "./components/DebtView";
import WhatsAppSettings from "./components/WhatsAppSettings";
import StockModal from "./components/StockModal";
import KuryePanel from "./components/KuryePanel";
import { useWhatsApp } from "./hooks/useWhatsApp";

const WaterLogo = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <path d="M12 2C6 8 4 11 4 14a8 8 0 0016 0c0-3-2-6-8-12z"/>
  </svg>
);

export default function App() {
  const [auth, setAuth] = useState(null);

  // Hooks must always be called — not conditionally
  const { permission, requestPermission, notify } = useNotifications();
  const { settings: waSettings, saveSettings: saveWaSettings, notify: waNotify, sendTest: waSendTest } = useWhatsApp();

  const handleNewOrder = useCallback(
    (order) => {
      notify(`Yeni Sipariş: ${order.customerName}`, {
        body: `${order.neighborhood} · ${order.address} · ${order.amount} damacana`,
        tag: `order-${order.id}`,
      });
      waNotify(order);
    },
    [notify, waNotify]
  );

  const {
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
  } = useOrders(handleNewOrder);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showGunSonu, setShowGunSonu] = useState(false);
  const neighborhoods = Object.keys(grouped).sort();

  const { closedIds, toggleProduct } = useStock();

  const [activeTab,       setActiveTab]      = useState("catalog");
  const [showWaSettings,  setShowWaSettings]  = useState(false);
  const [showStockModal,  setShowStockModal]  = useState(false);

  const handleLogin  = (authData) => { setAuth(authData); setActiveTab("catalog"); };
  const handleLogout = () => setAuth(null);

  // ── Not logged in ──────────────────────────────
  if (!auth) {
    const path = window.location.pathname.replace(/\/$/, "");
    const loginMode = path === "/calisan" ? "employee" : "customer";
    return <LoginPage onLogin={handleLogin} mode={loginMode} />;
  }

  // ── Firestore loading ──────────────────────────
  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading__spinner" />
        <p>Yükleniyor…</p>
      </div>
    );
  }

  // ── Kurye view ────────────────────────────────
  if (auth.type === "kurye") {
    return (
      <KuryePanel
        auth={auth}
        orders={orders}
        updateOrder={updateOrder}
        onLogout={handleLogout}
      />
    );
  }

  // ── Customer view ──────────────────────────────
  if (auth.type === "customer") {
    const myPending = orders.filter(
      o => o.phone?.replace(/\s/g, "") === auth.phone.replace(/\s/g, "") && o.status === "beklemede"
    ).length;

    return (
      <div className="app">
        <header className="header">
          <div className="header__inner">
            <div className="header__brand">
              <WaterLogo />
              <div>
                <div className="header__title">SiparisPro</div>
                <div className="header__subtitle">Akıllı Sipariş ve Dağıtım Yönetimi</div>
              </div>
            </div>
            <div className="header__actions">
              <div className="nav-tabs">
                <button
                  className={`nav-tab${activeTab === "catalog" ? " nav-tab--active" : ""}`}
                  onClick={() => setActiveTab("catalog")}
                >
                  Sipariş Ver
                </button>
                <button
                  className={`nav-tab${activeTab === "myorders" ? " nav-tab--active" : ""}`}
                  onClick={() => setActiveTab("myorders")}
                >
                  Siparişlerim
                  {myPending > 0 && (
                    <span className="nav-tab-badge">{myPending}</span>
                  )}
                </button>
              </div>
              <div className="header__user-info">
                <div className="header__user-label">Hoşgeldiniz</div>
                <div className="header__user-name">{auth.phone}</div>
              </div>
              <button className="btn-logout" onClick={handleLogout}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                <span className="btn-logout__text">Çıkış</span>
              </button>
            </div>
          </div>
        </header>

        {activeTab === "catalog" ? (
          <CustomerOrderPage
            addOrder={addOrder}
            phone={auth.phone}
            closedIds={closedIds}
          />
        ) : (
          <MyOrders
            orders={orders}
            updateOrder={updateOrder}
            notify={notify}
            phone={auth.phone}
            onNewOrder={() => setActiveTab("catalog")}
          />
        )}
      </div>
    );
  }

  // ── Employee (admin) view ──────────────────────
  return (
    <div className="app">
      <header className="header">
        <div className="header__inner">
          <div className="header__brand">
            <WaterLogo />
            <div>
              <div className="header__title">SiparisPro</div>
              <div className="header__subtitle">Akıllı Sipariş ve Dağıtım Yönetimi</div>
            </div>
          </div>

          <div className="header__actions">
            <div className="header__date">
              {new Date().toLocaleDateString("tr-TR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
            <div className="header__user-info">
              <div className="header__user-label">Hoşgeldin</div>
              <div className="header__user-name">{auth.displayName}</div>
            </div>
            <button
              className={`btn-whatsapp${waSettings.enabled ? " btn-whatsapp--active" : ""}`}
              onClick={() => setShowWaSettings(true)}
              title="WhatsApp Bildirimleri"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </button>
            <button className="btn-stock" onClick={() => setShowStockModal(true)} title="Stok Yönetimi">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
                <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
              </svg>
              <span className="btn-stock__text">Stok</span>
            </button>
            <button className="btn-gunsonu" onClick={() => setShowGunSonu(true)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                <path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
              Gün Sonu
            </button>
            <button className="btn-new-order" onClick={() => setShowAddModal(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Yeni Sipariş
            </button>
            <button className="btn-logout" onClick={handleLogout}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span className="btn-logout__text">Çıkış</span>
            </button>
          </div>
        </div>
      </header>

      <NotificationBanner permission={permission} onRequest={requestPermission} />

      <main className="main">
        <div className="stats-grid">
          <StatCard icon="📦" label="Toplam Sipariş" value={stats.total} color="blue" />
          <StatCard icon="✅" label="Teslim Edildi" value={stats.delivered} color="green" />
          <StatCard icon="🚚" label="Yolda" value={stats.onRoute} color="cyan" />
          <StatCard icon="⏳" label="Beklemede" value={stats.pending} color="yellow" />
          <StatCard icon="💰" label="Toplam Borç" value={`${stats.totalDebt} ₺`} color="red" />
        </div>

        <div className="filters">
          <div className="search-wrapper">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="search-input"
              type="text"
              placeholder="Müşteri, mahalle veya adres ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="search-clear" onClick={() => setSearchTerm("")}>✕</button>
            )}
          </div>

          <div className="filter-tabs">
            {[
              { val: "hepsi",         label: "Hepsi"      },
              { val: "teslim_edildi", label: "Teslim"     },
              { val: "yolda",         label: "Yolda"      },
              { val: "beklemede",     label: "Beklemede"  },
              { val: "borclu",        label: "Borçlular", badge: stats.totalDebt > 0 },
            ].map(({ val, label, badge }) => (
              <button
                key={val}
                className={`filter-tab ${statusFilter === val ? "filter-tab--active" : ""}${val === "borclu" ? " filter-tab--debt" : ""}`}
                onClick={() => setStatusFilter(val)}
              >
                {label}
                {badge && <span className="filter-tab-debt-dot" />}
              </button>
            ))}
          </div>
        </div>

        {statusFilter === "borclu" ? (
          <DebtView grouped={grouped} onUpdate={updateOrder} />
        ) : neighborhoods.length === 0 ? (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <p>Sonuç bulunamadı.</p>
          </div>
        ) : (
          <>
            <div className="results-info">
              <span>{neighborhoods.length} mahalle</span>
              <span>·</span>
              <span>
                {Object.values(grouped).reduce((s, arr) => s + arr.length, 0)} sipariş
              </span>
            </div>
            {neighborhoods.map((name) => (
              <NeighborhoodSection
                key={name}
                name={name}
                orders={grouped[name]}
                onUpdate={updateOrder}
              />
            ))}
          </>
        )}
      </main>

      {showAddModal && (
        <AddOrderModal
          onClose={() => setShowAddModal(false)}
          onAdd={addOrder}
        />
      )}

      {showGunSonu && (
        <GunSonuModal
          gunSonuStats={gunSonuStats}
          onClose={() => setShowGunSonu(false)}
        />
      )}

      {showWaSettings && (
        <WhatsAppSettings
          settings={waSettings}
          onSave={saveWaSettings}
          onClose={() => setShowWaSettings(false)}
          onTest={waSendTest}
        />
      )}

      {showStockModal && (
        <StockModal
          closedIds={closedIds}
          onToggle={toggleProduct}
          onClose={() => setShowStockModal(false)}
        />
      )}
    </div>
  );
}

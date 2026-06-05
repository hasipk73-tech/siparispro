import { useState } from "react";
import { CATALOG_PRODUCTS as PRODUCTS } from "../data/catalogProducts";

function IconTruck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="3" width="15" height="13" rx="1"/>
      <path d="M16 8h4l3 3v5h-7V8z"/>
      <circle cx="5.5" cy="18.5" r="2.5"/>
      <circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  );
}

function IconStore() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

// Adres metninden mahalle adını çıkarır.
// "Yavuztürk Mahallesi Atatürk Cad. No:5" → "Yavuztürk"
// "Bağcılar Mah. No:12" → "Bağcılar"
// "Atatürk Cad. No:5" → "Belirtilmemiş"
function parseNeighborhood(address) {
  if (!address?.trim()) return "Belirtilmemiş";
  // 1-4 Türkçe kelimesi + Mahallesi / Mahalle / Mah. / Mah / Mh.
  const m = address.match(
    /([A-Za-zÇçĞğİıÖöŞşÜü]+(?:\s+[A-Za-zÇçĞğİıÖöŞşÜü]+){0,3})\s+[Mm](?:ah(?:alle(?:si)?)?|h)\.?(?=[\s,./\d]|$)/
  );
  return m ? m[1].trim() : "Belirtilmemiş";
}

const PROFILES_KEY = "su_dagitim_profiles";

function readProfile(phone) {
  if (!phone) return null;
  try {
    const map = JSON.parse(localStorage.getItem(PROFILES_KEY) || "{}");
    return map[phone.replace(/\s/g, "")] || null;
  } catch { return null; }
}

function writeProfile(phone, data) {
  try {
    const map = JSON.parse(localStorage.getItem(PROFILES_KEY) || "{}");
    map[phone.replace(/\s/g, "")] = data;
    localStorage.setItem(PROFILES_KEY, JSON.stringify(map));
  } catch {}
}

function profileToForm(phone) {
  const p = readProfile(phone);
  return {
    name:    p?.name    || "",
    phone:   phone      || "",
    address: p?.address || "",
    note:    "",
  };
}

export default function CustomerOrderPage({ addOrder, phone }) {
  const [deliveryType, setDeliveryType] = useState("gelAl");
  const [cart, setCart] = useState({});
  const [showCartSheet, setShowCartSheet] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [form, setForm] = useState(() => profileToForm(phone));
  const [errors, setErrors] = useState({});

  const getPrice = (p) => deliveryType === "gelAl" ? p.gelAl : p.eveTeslim;

  const cartItems = PRODUCTS.filter(p => (cart[p.id] || 0) > 0);
  const cartCount = cartItems.reduce((s, p) => s + cart[p.id], 0);
  const cartTotal = cartItems.reduce((s, p) => s + cart[p.id] * getPrice(p), 0);

  const setQty = (id, qty) =>
    setCart(prev => {
      const next = { ...prev, [id]: Math.max(0, qty) };
      if (next[id] === 0) delete next[id];
      return next;
    });

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Ad soyad zorunlu";
    if (!form.phone.trim()) e.phone = "Telefon zorunlu";
    else if (!/^\+?[\d\s\-()]{10,}$/.test(form.phone.trim())) e.phone = "Geçerli telefon girin";
    if (deliveryType === "eveTeslim" && !form.address.trim()) e.address = "Adres zorunlu";
    return e;
  };

  const handleSubmitOrder = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    const orderItems = cartItems.map(p => ({
      product: p.name,
      qty: cart[p.id],
      unitPrice: getPrice(p),
      total: cart[p.id] * getPrice(p),
    }));

    // Profili kaydet (ad, adres)
    writeProfile(form.phone, {
      name:    form.name,
      address: form.address || readProfile(form.phone)?.address || "",
    });

    if (addOrder) {
      addOrder({
        customerName: form.name,
        phone: form.phone,
        address: deliveryType === "eveTeslim" ? form.address : "Gel Al",
        neighborhood: deliveryType === "eveTeslim"
          ? parseNeighborhood(form.address)
          : "Gel Al",
        product: orderItems.length === 1
          ? orderItems[0].product
          : `${orderItems.length} çeşit ürün`,
        amount: orderItems.reduce((s, i) => s + i.qty, 0),
        items: orderItems,
        deliveryType,
        totalDebt: cartTotal,
      });
    }

    setSuccessData({
      name: form.name,
      phone: form.phone,
      deliveryType,
      total: cartTotal,
      items: orderItems.map(i => ({ name: i.product, qty: i.qty, price: i.total })),
    });
    setShowCheckout(false);
    setShowCartSheet(false);
    setOrderSuccess(true);
  };

  const handleReset = () => {
    setCart({});
    setForm(profileToForm(phone)); // profil varsa tekrar doldur
    setErrors({});
    setOrderSuccess(false);
    setSuccessData(null);
    setDeliveryType("gelAl");
  };

  const openCheckout = () => {
    setErrors({});
    setShowCheckout(true);
    setShowCartSheet(false);
  };

  const handleDeliveryTypeChange = (type) => {
    setDeliveryType(type);
    if (type === "gelAl") {
      setCart({});
      setShowCartSheet(false);
      setShowCheckout(false);
    }
  };

  const renderCartBody = (variant) => {
    const bodyClass = variant === "sheet" ? "cart-sheet__body" : "cart-sidebar__body";
    const footerClass = variant === "sheet" ? "cart-sheet__footer" : "cart-sidebar__footer";
    return (
      <>
        <div className={bodyClass}>
          {cartItems.length === 0 ? (
            <div className="cart-empty">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" style={{ marginBottom: "0.5rem" }}>
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              Sepetiniz boş
              <div style={{ fontSize: "0.75rem", marginTop: "0.25rem", color: "var(--gray-400)" }}>
                Ürün eklemek için + butonuna basın
              </div>
            </div>
          ) : (
            cartItems.map(p => (
              <div key={p.id} className="cart-item">
                <div className="cart-item__name">{p.name}</div>
                <div className="cart-item__qty">x{cart[p.id]}</div>
                <div className="cart-item__price">{cart[p.id] * getPrice(p)} ₺</div>
                <button
                  className="cart-item__remove"
                  onClick={() => setQty(p.id, 0)}
                  title="Kaldır"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
        <div className={footerClass}>
          <div className="cart-total-row">
            <span className="cart-total-label">Toplam</span>
            <span className="cart-total-value">{cartTotal} ₺</span>
          </div>
          <div className="cart-delivery-label">
            {deliveryType === "gelAl" ? "Gel Al fiyatlarıyla" : "Eve Teslim fiyatlarıyla"}
          </div>
          <button className="btn-checkout" onClick={openCheckout} disabled={cartItems.length === 0}>
            Sipariş Ver
          </button>
        </div>
      </>
    );
  };

  if (orderSuccess && successData) {
    return (
      <div className="customer-page">
        <div className="order-success">
          <div className="success-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div>
            <div className="success-title">Siparişiniz Alındı!</div>
            <div className="success-subtitle">
              En kısa sürede sizinle iletişime geçeceğiz.
            </div>
          </div>
          <div className="success-detail">
            <div className="success-detail-row">
              <span className="success-detail-label">Ad Soyad</span>
              <span className="success-detail-value">{successData.name}</span>
            </div>
            <div className="success-detail-row">
              <span className="success-detail-label">Telefon</span>
              <span className="success-detail-value">{successData.phone}</span>
            </div>
            <div className="success-detail-row">
              <span className="success-detail-label">Teslimat</span>
              <span className="success-detail-value">
                {successData.deliveryType === "gelAl" ? "Gel Al" : "Eve Teslim"}
              </span>
            </div>
            <div style={{ borderTop: "1px solid var(--gray-200)", paddingTop: "0.5rem", marginTop: "0.25rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              {successData.items.map((item, i) => (
                <div key={i} className="success-detail-row">
                  <span className="success-detail-label">{item.name} x{item.qty}</span>
                  <span className="success-detail-value">{item.price} ₺</span>
                </div>
              ))}
            </div>
            <div className="success-detail-row success-detail-total">
              <span>Toplam</span>
              <span>{successData.total} ₺</span>
            </div>
          </div>
          <button className="btn-new-order-page" onClick={handleReset}>
            Yeni Sipariş Ver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-page">
      {/* Delivery Type Toggle */}
      <div className="delivery-section">
        <div className="delivery-section__title">Teslimat Türünü Seçin</div>
        <div className="delivery-toggle">
          <button
            className={`delivery-btn${deliveryType === "gelAl" ? " delivery-btn--active" : ""}`}
            onClick={() => handleDeliveryTypeChange("gelAl")}
          >
            <IconStore />
            Gel Al
          </button>
          <button
            className={`delivery-btn${deliveryType === "eveTeslim" ? " delivery-btn--active" : ""}`}
            onClick={() => handleDeliveryTypeChange("eveTeslim")}
          >
            <IconTruck />
            Eve Teslim
          </button>
        </div>
        <div className="delivery-section__hint">
          {deliveryType === "gelAl"
            ? "Ürünleri mağazamıza gelerek satın alabilirsiniz"
            : "Ürünler adresinize teslim edilir"}
        </div>
      </div>

      {/* Gel Al info banner */}
      {deliveryType === "gelAl" && (
        <div className="gelal-banner">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <div>
            <div className="gelal-banner__title">Mağazamıza Gelerek Satın Alabilirsiniz</div>
            <div className="gelal-banner__sub">Aşağıdaki fiyatlar gel al fiyatlarıdır. Eve teslim için "Eve Teslim" seçeneğine geçin.</div>
          </div>
        </div>
      )}

      {/* Catalog + Cart Layout */}
      <div className="catalog-layout">
        {/* Product Grid */}
        <div className="catalog-grid-wrapper">
          <div className="product-grid">
            {PRODUCTS.map(p => {
              const qty = cart[p.id] || 0;
              const inCart = qty > 0;
              const isGelAl = deliveryType === "gelAl";
              return (
                <div key={p.id} className={`product-card${inCart ? " product-card--in-cart" : ""}`}>
                  <div className="product-card__name">{p.name}</div>

                  <div className="product-card__prices">
                    <div className={`price-chip${isGelAl ? " price-chip--active" : ""}`}>
                      <div className="price-chip__label">Gel Al</div>
                      <div className="price-chip__value">{p.gelAl} ₺</div>
                    </div>
                    <div className={`price-chip${!isGelAl ? " price-chip--active" : ""}`}>
                      <div className="price-chip__label">Eve Teslim</div>
                      <div className="price-chip__value">{p.eveTeslim} ₺</div>
                    </div>
                  </div>

                  {!isGelAl && (
                    <>
                      <div className="product-card__qty">
                        <button className="qty-btn" onClick={() => setQty(p.id, qty - 1)} disabled={qty === 0}>
                          −
                        </button>
                        <span className="qty-value">{qty}</span>
                        <button className="qty-btn" onClick={() => setQty(p.id, qty + 1)}>
                          +
                        </button>
                      </div>

                      <button
                        className="btn-add-cart"
                        style={inCart ? { background: "var(--green-500)" } : {}}
                        onClick={() => { if (!inCart) setQty(p.id, 1); }}
                      >
                        {inCart ? (
                          <><IconCheck /> Sepette</>
                        ) : (
                          <><IconPlus /> Sepete Ekle</>
                        )}
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Desktop Cart Sidebar — only Eve Teslim */}
        {deliveryType === "eveTeslim" && (
          <div className="cart-sidebar">
            <div className="cart-sidebar__header">
              <div className="cart-sidebar__title">
                Sepet
                {cartCount > 0 && <span className="cart-badge">{cartCount} ürün</span>}
              </div>
            </div>
            {renderCartBody("sidebar")}
          </div>
        )}
      </div>

      {/* Mobile Cart Bar — only Eve Teslim */}
      {deliveryType === "eveTeslim" && cartItems.length > 0 && (
        <div className="cart-mobile-bar">
          <div className="cart-mobile-bar__content">
            <div className="cart-mobile-bar__info">
              <div className="cart-mobile-bar__count">{cartCount} ürün seçildi</div>
              <div className="cart-mobile-bar__total">{cartTotal} ₺</div>
            </div>
            <button className="btn-view-cart" onClick={() => setShowCartSheet(true)}>
              Sepeti Gör
            </button>
          </div>
        </div>
      )}

      {/* Cart Sheet (Mobile) — only Eve Teslim */}
      {deliveryType === "eveTeslim" && showCartSheet && (
        <div className="cart-sheet-overlay" onClick={() => setShowCartSheet(false)}>
          <div className="cart-sheet" onClick={e => e.stopPropagation()}>
            <div className="cart-sheet__header">
              <div className="cart-sheet__title">
                Sepet
                {cartCount > 0 && <span className="cart-badge" style={{ background: "var(--blue-100)", color: "var(--blue-700)", marginLeft: "0.5rem" }}>{cartCount} ürün</span>}
              </div>
              <button className="modal__close" style={{ background: "var(--gray-100)", color: "var(--gray-700)" }} onClick={() => setShowCartSheet(false)}>✕</button>
            </div>
            {renderCartBody("sheet")}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="modal-overlay" onClick={() => setShowCheckout(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <div className="modal__title">Sipariş Bilgileri</div>
              <button className="modal__close" onClick={() => setShowCheckout(false)}>✕</button>
            </div>

            <div className="modal__body">
              <div className="checkout-note">
                {deliveryType === "gelAl"
                  ? "Gel Al — Siparişiniz hazır olduğunda sizi arayacağız."
                  : "Eve Teslim — Adresinize en kısa sürede teslim edeceğiz."}
              </div>

              <div className="checkout-order-summary">
                {cartItems.map(p => (
                  <div key={p.id} className="checkout-summary-item">
                    <span>
                      {p.name}
                      <span style={{ color: "var(--gray-400)", marginLeft: "0.35rem" }}>x{cart[p.id]}</span>
                    </span>
                    <span>{cart[p.id] * getPrice(p)} ₺</span>
                  </div>
                ))}
                <div className="checkout-summary-total">
                  <span>Toplam</span>
                  <span>{cartTotal} ₺</span>
                </div>
              </div>

              <div className="form-group">
                <label>Ad Soyad *</label>
                <input
                  type="text"
                  placeholder="Adınız Soyadınız"
                  value={form.name}
                  className={errors.name ? "input--error" : ""}
                  onChange={e => {
                    setForm(f => ({ ...f, name: e.target.value }));
                    setErrors(er => ({ ...er, name: undefined }));
                  }}
                />
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label>Telefon *</label>
                <input
                  type="tel"
                  placeholder="05XX XXX XX XX"
                  value={form.phone}
                  readOnly={!!phone}
                  style={phone ? { background: "var(--gray-100)", color: "var(--gray-600)" } : {}}
                  className={errors.phone ? "input--error" : ""}
                  onChange={e => {
                    if (phone) return;
                    setForm(f => ({ ...f, phone: e.target.value }));
                    setErrors(er => ({ ...er, phone: undefined }));
                  }}
                />
                {errors.phone && <span className="field-error">{errors.phone}</span>}
              </div>

              {deliveryType === "eveTeslim" && (
                <div className="form-group">
                  <label>Adres *</label>
                  <input
                    type="text"
                    placeholder="Mahalle, Sokak, Bina No..."
                    value={form.address}
                    className={errors.address ? "input--error" : ""}
                    onChange={e => {
                      setForm(f => ({ ...f, address: e.target.value }));
                      setErrors(er => ({ ...er, address: undefined }));
                    }}
                  />
                  {errors.address && <span className="field-error">{errors.address}</span>}
                </div>
              )}

              <div className="form-group">
                <label>Not (İsteğe Bağlı)</label>
                <input
                  type="text"
                  placeholder="Özel istek veya not..."
                  value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                />
              </div>
            </div>

            <div className="modal__footer">
              <button className="btn btn--outline" onClick={() => setShowCheckout(false)}>
                Geri Dön
              </button>
              <button className="btn btn--primary" onClick={handleSubmitOrder}>
                Siparişi Onayla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

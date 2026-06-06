import { CATALOG_PRODUCTS } from "../data/catalogProducts";

export default function StockModal({ closedIds, onToggle, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal stock-modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <div className="modal__title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
              <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
            </svg>
            Stok Yönetimi
          </div>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="stock-modal__hint">
          Kapatılan ürünler müşteri sayfasında <strong>Stokta Yok</strong> olarak görünür ve sepete eklenemez.
        </div>

        <div className="modal__body stock-modal__body">
          {CATALOG_PRODUCTS.map(p => {
            const isOpen = !closedIds.has(p.id);
            return (
              <div key={p.id} className={`stock-item${isOpen ? "" : " stock-item--closed"}`}>
                <div className="stock-item__info">
                  {p.image && (
                    <img src={p.image} alt={p.name} className="stock-item__img"
                      onError={e => { e.currentTarget.style.display = "none"; }}
                    />
                  )}
                  <span className="stock-item__name">{p.name}</span>
                </div>
                <button
                  className={`stock-toggle${isOpen ? " stock-toggle--open" : " stock-toggle--closed"}`}
                  onClick={() => onToggle(p.id)}
                >
                  {isOpen ? (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Açık
                    </>
                  ) : (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                      Kapalı
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

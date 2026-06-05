import { useState } from "react";
import { PRODUCTS } from "../data/products";

const NEIGHBORHOODS = ["Bağcılar", "Güneşli", "Mahmutbey", "Esenyurt"];

const empty = {
  customerName: "",
  address: "",
  neighborhood: NEIGHBORHOODS[0],
  phone: "",
  product: PRODUCTS[0],
  amount: 1,
};

export default function AddOrderModal({ onClose, onAdd }) {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.customerName.trim()) e.customerName = "Müşteri adı gerekli";
    if (!form.address.trim()) e.address = "Adres gerekli";
    if (!form.phone.trim()) e.phone = "Telefon gerekli";
    if (form.amount < 1) e.amount = "En az 1 damacana";
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onAdd({ ...form, amount: Number(form.amount) });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(ev) => ev.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">Yeni Sipariş</h2>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>

        <form className="modal__body" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label>Müşteri Adı</label>
            <input
              type="text"
              placeholder="Ahmet Yılmaz"
              value={form.customerName}
              onChange={(e) => set("customerName", e.target.value)}
              className={errors.customerName ? "input--error" : ""}
              autoFocus
            />
            {errors.customerName && <span className="field-error">{errors.customerName}</span>}
          </div>

          <div className="form-group">
            <label>Telefon</label>
            <input
              type="tel"
              placeholder="0532 000 0000"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className={errors.phone ? "input--error" : ""}
            />
            {errors.phone && <span className="field-error">{errors.phone}</span>}
          </div>

          <div className="form-group">
            <label>Mahalle</label>
            <select
              value={form.neighborhood}
              onChange={(e) => set("neighborhood", e.target.value)}
            >
              {NEIGHBORHOODS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Ürün</label>
            <select
              value={form.product}
              onChange={(e) => set("product", e.target.value)}
            >
              {PRODUCTS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Adres</label>
            <input
              type="text"
              placeholder="Atatürk Cad. No:12"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              className={errors.address ? "input--error" : ""}
            />
            {errors.address && <span className="field-error">{errors.address}</span>}
          </div>

          <div className="form-group">
            <label>Damacana Adedi</label>
            <input
              type="number"
              min="1"
              max="50"
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
              className={errors.amount ? "input--error" : ""}
            />
            {errors.amount && <span className="field-error">{errors.amount}</span>}
          </div>

          <div className="modal__footer" style={{ margin: "0 -1.5rem -1.5rem", padding: "1rem 1.5rem" }}>
            <button type="button" className="btn btn--outline" onClick={onClose}>İptal</button>
            <button type="submit" className="btn btn--primary">Siparişi Ekle</button>
          </div>
        </form>
      </div>
    </div>
  );
}

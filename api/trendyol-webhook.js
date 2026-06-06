const admin = require("firebase-admin");
const crypto = require("crypto");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = admin.firestore();

// Trendyol HMAC-SHA256 imza doğrulaması
function verifySignature(rawBody, signature, secret) {
  if (!secret || !signature) return true; // secret yoksa geç
  try {
    const computed = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("base64");
    return computed === signature;
  } catch { return false; }
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ── İmza doğrulama ─────────────────────────────────────────────
  const webhookSecret = process.env.TRENDYOL_WEBHOOK_SECRET;
  const signature     = req.headers["x-trendyol-signature"];
  const rawBody       = JSON.stringify(req.body);

  if (webhookSecret && signature && !verifySignature(rawBody, signature, webhookSecret)) {
    return res.status(401).json({ error: "Geçersiz imza" });
  }

  try {
    const payload = req.body;

    // ── Payload parse (Trendyol formatı) ──────────────────────────
    const addr = payload.shipmentAddress || payload.invoiceAddress || {};

    const firstName    = addr.firstName || "";
    const lastName     = addr.lastName  || "";
    const customerName = `${firstName} ${lastName}`.trim() || "Trendyol Müşterisi";

    const phone    = addr.phone || addr.fullName || "Belirtilmemiş";
    const address  = [addr.address1, addr.address2].filter(Boolean).join(", ") || "Trendyol Siparişi";
    const district = addr.district || addr.city || "Belirtilmemiş";

    // Ürün satırları: lines (v2) veya orderItems (v1)
    const lines = payload.lines || payload.orderItems || [];

    const items = lines.map(l => {
      const qty   = l.quantity || 1;
      const price = l.price ?? l.amount ?? 0;
      return {
        product:   l.productName || l.merchantSku || "Ürün",
        qty,
        unitPrice: price,
        total:     qty * price,
      };
    });

    const totalQty   = items.reduce((s, i) => s + i.qty, 0);
    const orderTotal = payload.totalPrice ?? payload.grossAmount ??
                       items.reduce((s, i) => s + i.total, 0);

    const productLabel = items.length === 1
      ? items[0].product
      : `${items.length} çeşit ürün`;

    const newOrder = {
      customerName,
      phone,
      address,
      neighborhood: district,
      product:      productLabel,
      amount:       totalQty,
      items,
      orderTotal,
      totalDebt:    0,
      paymentStatus: "havale",   // Trendyol siparişleri ön ödemeli
      status:        "beklemede",
      deliveryType:  "eveTeslim",
      source:        "trendyol",
      trendyolOrderId:     String(payload.id || payload.orderId || ""),
      trendyolOrderNumber: String(payload.orderNumber || payload.id || ""),
      lastDelivery:  new Date().toISOString().split("T")[0],
      createdAt:     admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("orders").add(newOrder);

    console.log("Trendyol sipariş alındı:", docRef.id, customerName);
    return res.status(200).json({ ok: true, id: docRef.id, customer: customerName });

  } catch (err) {
    console.error("Trendyol webhook hatası:", err);
    return res.status(500).json({ error: err.message });
  }
};

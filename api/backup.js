const admin = require("firebase-admin");

// Initialize Firebase Admin once (reused across warm invocations)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Vercel env variables escape newlines — restore them
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = admin.firestore();
const BACKUP_RETENTION_DAYS = 30;

module.exports = async (req, res) => {
  // Security: Vercel injects CRON_SECRET as Authorization header for cron calls.
  // The same header works for manual triggers too.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.authorization;
    if (auth !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: "Yetkisiz" });
    }
  }

  try {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // ── Fetch data ───────────────────────────────────────────────────────────
    const [ordersSnap, stockSnap] = await Promise.all([
      db.collection("orders").get(),
      db.doc("settings/stock").get(),
    ]);

    const orders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const stock  = stockSnap.exists ? stockSnap.data() : {};

    // ── Stats ────────────────────────────────────────────────────────────────
    const stats = {
      toplamSiparis:   orders.length,
      teslimEdildi:    orders.filter(o => o.status === "teslim_edildi").length,
      beklemede:       orders.filter(o => o.status === "beklemede").length,
      yolda:           orders.filter(o => o.status === "yolda").length,
      toplamBorc:      orders.reduce((s, o) => s + (o.totalDebt || 0), 0),
      kapaliUrunSayisi: (stock.closedIds || []).length,
    };

    // ── Save backup ──────────────────────────────────────────────────────────
    await db.collection("backups").doc(today).set({
      tarih:      today,
      olusturuldu: admin.firestore.FieldValue.serverTimestamp(),
      stats,
      orders,
      stock,
    });

    // ── Clean up old backups (> 30 days) ────────────────────────────────────
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - BACKUP_RETENTION_DAYS);
    const cutoffStr = cutoff.toISOString().split("T")[0];

    const oldSnap = await db.collection("backups")
      .where("tarih", "<", cutoffStr)
      .get();

    const deleteOps = oldSnap.docs.map(d => d.ref.delete());
    await Promise.all(deleteOps);

    return res.status(200).json({
      ok:          true,
      tarih:       today,
      siparisler:  orders.length,
      silinenYedek: oldSnap.docs.length,
    });

  } catch (err) {
    console.error("Yedekleme hatası:", err);
    return res.status(500).json({ error: err.message });
  }
};

const admin = require("firebase-admin");
const https  = require("https");

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

// ── TwiML yardımcıları ────────────────────────────────────────────────
function xml(...parts) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n${parts.join("\n")}\n</Response>`;
}
function say(text) {
  return `<Say language="tr-TR">${esc(text)}</Say>`;
}
function gather(actionUrl, numDigits, ...children) {
  return `<Gather action="${esc(actionUrl)}" numDigits="${numDigits}" timeout="10" method="POST">\n  ${children.join("\n  ")}\n</Gather>`;
}
function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Yardımcılar ───────────────────────────────────────────────────────
function normTel(t) {
  if (!t) return "";
  const d = String(t).replace(/\D/g, "");
  if (d.startsWith("90") && d.length === 12) return d.slice(2);
  if (d.startsWith("0")  && d.length === 11) return d.slice(1);
  return d.length === 10 ? d : d;
}

function baseUrl(req) {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host  = req.headers.host || req.headers["x-forwarded-host"] || "localhost:3000";
  return `${proto}://${host}`;
}

// En sık sipariş verilen ürün + son kullanılan adet
function enSikUrun(orders) {
  const freq = {};
  for (const o of orders) {
    if (!o.product) continue;
    if (!freq[o.product]) freq[o.product] = { name: o.product, count: 0, lastAmount: 1 };
    freq[o.product].count++;
    freq[o.product].lastAmount = o.amount || 1;
  }
  return Object.values(freq).sort((a, b) => b.count - a.count)[0] || null;
}

// ── Firestore: aramalar ───────────────────────────────────────────────
async function logArama(data) {
  const ref = await db.collection("aramalar").add({
    ...data,
    tarih:           admin.firestore.FieldValue.serverTimestamp(),
    olusturmaTarihi: admin.firestore.FieldValue.serverTimestamp(),
  });
  return ref.id;
}
async function aramaGuncelle(aramaId, data) {
  if (!aramaId) return;
  try { await db.collection("aramalar").doc(aramaId).update(data); } catch {}
}

// ── Bildirim ──────────────────────────────────────────────────────────
async function gonderBildirim(tenantId, musteriTel, urunAdi, urunAdet) {
  try {
    const snap = await db.collection("tenants").doc(tenantId).get();
    const ivr  = snap.data()?.ivrAyarlari || {};

    // WhatsApp (CallMeBot) — tenant ivrAyarlari'ndan
    if (ivr.whatsappApiKey && ivr.whatsappTelefon) {
      const text = encodeURIComponent(`✅ Siparişiniz alındı: ${urunAdet} ${urunAdi}. Yakında teslim edilecektir.`);
      const url  = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(ivr.whatsappTelefon)}&text=${text}&apikey=${encodeURIComponent(ivr.whatsappApiKey)}`;
      https.get(url, (r) => r.resume()).on("error", () => {});
    }

    // Twilio SMS — env aktifse otomatik devreye girer
    const sid  = process.env.TWILIO_ACCOUNT_SID;
    const tok  = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM_NUMBER;
    if (sid && tok && from && musteriTel) {
      const to   = musteriTel.startsWith("+") ? musteriTel : `+90${normTel(musteriTel)}`;
      const body = `Siparişiniz alındı: ${urunAdet} ${urunAdi}. Yakında teslim edilecektir.`;
      const form = new URLSearchParams({ From: from, To: to, Body: body }).toString();
      const opts = {
        hostname: "api.twilio.com",
        path:     `/2010-04-01/Accounts/${sid}/Messages.json`,
        method:   "POST",
        headers:  {
          "Content-Type":   "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(form),
          Authorization:    "Basic " + Buffer.from(`${sid}:${tok}`).toString("base64"),
        },
      };
      const r = https.request(opts, (res) => res.resume());
      r.on("error", () => {});
      r.write(form);
      r.end();
    }
  } catch (e) {
    console.error("IVR bildirim hatası:", e.message);
  }
}

// ── STEP: initial — ilk yanıt ────────────────────────────────────────
async function handleInitial(req, res, tenantId) {
  const from  = req.body?.From || req.query?.From || "";
  const base  = baseUrl(req);

  let tenant;
  try {
    const snap = await db.collection("tenants").doc(tenantId).get();
    if (!snap.exists) {
      return res.set("Content-Type", "text/xml")
        .send(xml(say("Bağlantı kurulamadı. Lütfen daha sonra tekrar arayın.")));
    }
    tenant = snap.data();
  } catch {
    return res.set("Content-Type", "text/xml")
      .send(xml(say("Teknik hata oluştu. Lütfen daha sonra arayın.")));
  }

  // Feature flag
  if (!tenant.ozellikler?.ivr) {
    return res.set("Content-Type", "text/xml")
      .send(xml(say("Bu hizmet şu an aktif değil.")));
  }

  const firmaAd = tenant.marka?.ad || tenant.ad || "Firmamız";
  const ivrAyar = tenant.ivrAyarlari || {};
  const callerN = normTel(from);

  // Müşteri sipariş geçmişi
  let gecmis = [];
  if (callerN) {
    try {
      const snap = await db.collection("orders")
        .where("tenantId", "==", tenantId)
        .orderBy("createdAt", "desc")
        .limit(300)
        .get();
      gecmis = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(o => normTel(o.phone) === callerN);
    } catch {}
  }

  const taninan      = gecmis.length > 0;
  const musteriAdi   = taninan ? gecmis[0].customerName : null;
  const referansOrdId = taninan ? gecmis[0].id : null;
  const kayitliAdres = taninan ? gecmis[0].address : null;

  const aramaId = await logArama({
    tenantId,
    arayanNumara:         from,
    taninan,
    musteriAdi:           musteriAdi || null,
    secim:                [],
    sonuc:                null,
    olusturulanSiparisId: null,
  });

  // Bilinmeyen numara → admine bağla
  if (!taninan) {
    await aramaGuncelle(aramaId, { sonuc: "admine_baglandi" });
    return res.set("Content-Type", "text/xml").send(xml(
      say(`${firmaAd}'na hoş geldiniz. Kaydınız bulunamadı, müşteri hizmetlerine bağlanıyorsunuz.`),
      say("Lütfen bekleyiniz.")
    ));
  }

  const enSik = enSikUrun(gecmis);
  if (!enSik) {
    await aramaGuncelle(aramaId, { sonuc: "admine_baglandi" });
    return res.set("Content-Type", "text/xml").send(xml(
      say(`${firmaAd}'na hoş geldiniz, ${musteriAdi}. Müşteri hizmetlerine bağlanıyorsunuz.`),
      say("Lütfen bekleyiniz.")
    ));
  }

  const urunAdi  = enSik.name;
  const urunAdet = String(enSik.lastAmount);
  const adres    = kayitliAdres || "";

  const karsilama = ivrAyar.karsilamaMetni
    ? ivrAyar.karsilamaMetni
        .replace("{musteriAdi}", musteriAdi)
        .replace("{firmaAdi}",   firmaAd)
    : `${firmaAd}'na hoş geldiniz, ${musteriAdi}.`;

  const menuUrl = `${base}/api/ivr-webhook?tenant=${encodeURIComponent(tenantId)}&step=menu`
    + `&aramaId=${encodeURIComponent(aramaId)}`
    + `&ordId=${encodeURIComponent(referansOrdId || "")}`
    + `&urun=${encodeURIComponent(urunAdi)}`
    + `&adet=${encodeURIComponent(urunAdet)}`
    + `&adres=${encodeURIComponent(adres)}`;

  const adresMesel = adres ? `${adres.slice(0, 60)} adresinize` : "kayıtlı adresinize";
  const metin = `${karsilama} Son siparişiniz ${urunAdet} ${urunAdi}'dı. `
    + `Aynısını ${adresMesel} göndermek için 1'e, `
    + `farklı sipariş için 2'ye, müşteri hizmetleri için sıfıra basın.`;

  return res.set("Content-Type", "text/xml").send(xml(
    gather(menuUrl, "1", say(metin)),
    say("Tuş algılanamadı. Müşteri hizmetlerine bağlanıyorsunuz.")
  ));
}

// ── STEP: menu — tuşlama sonucu ───────────────────────────────────────
async function handleMenu(req, res, tenantId) {
  const digits   = req.body?.Digits || "";
  const aramaId  = req.query.aramaId;
  const ordId    = req.query.ordId || "";
  const urunAdi  = decodeURIComponent(req.query.urun  || "");
  const urunAdet = req.query.adet  || "1";
  const adres    = decodeURIComponent(req.query.adres || "");
  const base     = baseUrl(req);

  await aramaGuncelle(aramaId, {
    secim: admin.firestore.FieldValue.arrayUnion(digits),
  });

  if (digits === "1") {
    const onayUrl = `${base}/api/ivr-webhook?tenant=${encodeURIComponent(tenantId)}&step=onay`
      + `&aramaId=${encodeURIComponent(aramaId)}`
      + `&ordId=${encodeURIComponent(ordId)}`
      + `&urun=${encodeURIComponent(urunAdi)}`
      + `&adet=${encodeURIComponent(urunAdet)}`
      + `&adres=${encodeURIComponent(adres)}`;

    const adresKisa = (adres || "kayıtlı adresinize").slice(0, 60);
    const metin = `${urunAdet} ${urunAdi}, ${adresKisa} adresine teslim edilecek. `
      + `Onaylıyorsanız 1'e, iptal için 2'ye basın.`;

    return res.set("Content-Type", "text/xml").send(xml(
      gather(onayUrl, "1", say(metin)),
      say("Tuş algılanamadı.")
    ));
  }

  // 0, 2 veya başka tuş → admin
  await aramaGuncelle(aramaId, { sonuc: "admine_baglandi" });
  return res.set("Content-Type", "text/xml").send(xml(
    say("Müşteri hizmetlerine bağlanıyorsunuz. Lütfen bekleyiniz.")
  ));
}

// ── STEP: onay — sipariş onayı ────────────────────────────────────────
async function handleOnay(req, res, tenantId) {
  const digits   = req.body?.Digits || "";
  const aramaId  = req.query.aramaId;
  const ordId    = req.query.ordId || "";
  const urunAdi  = decodeURIComponent(req.query.urun  || "");
  const urunAdet = parseInt(req.query.adet) || 1;
  const adres    = decodeURIComponent(req.query.adres || "");

  await aramaGuncelle(aramaId, {
    secim: admin.firestore.FieldValue.arrayUnion(digits),
  });

  if (digits !== "1") {
    await aramaGuncelle(aramaId, { sonuc: "iptal" });
    return res.set("Content-Type", "text/xml").send(xml(
      say("Siparişiniz iptal edildi. İyi günler.")
    ));
  }

  try {
    // Referans siparişten müşteri bilgilerini al
    let musteriAdi     = "Müşteri";
    let musteriTel     = "";
    let musteriMahalle = "";

    if (ordId) {
      try {
        const oSnap = await db.collection("orders").doc(ordId).get();
        if (oSnap.exists) {
          const od   = oSnap.data();
          musteriAdi     = od.customerName || musteriAdi;
          musteriTel     = od.phone        || "";
          musteriMahalle = od.neighborhood || "";
        }
      } catch {}
    }

    const yeniSiparis = {
      tenantId,
      customerName:  musteriAdi,
      phone:         musteriTel,
      address:       adres || "Kayıtlı adres",
      neighborhood:  musteriMahalle,
      product:       urunAdi,
      amount:        urunAdet,
      status:        "beklemede",
      paymentStatus: null,
      orderTotal:    0,
      totalDebt:     0,
      deliveryType:  "eveTeslim",
      source:        "telefon",
      lastDelivery:  new Date().toISOString().split("T")[0],
      createdAt:     admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("orders").add(yeniSiparis);
    await aramaGuncelle(aramaId, {
      sonuc:                "siparis_olustu",
      olusturulanSiparisId: docRef.id,
    });

    await gonderBildirim(tenantId, musteriTel, urunAdi, urunAdet);

    console.log(`IVR sipariş oluşturuldu [tenant:${tenantId}]:`, docRef.id, musteriAdi);

    return res.set("Content-Type", "text/xml").send(xml(
      say(`Siparişiniz alındı: ${urunAdet} ${urunAdi}. Teşekkürler, iyi günler.`)
    ));
  } catch (e) {
    console.error("IVR sipariş oluşturma hatası:", e);
    await aramaGuncelle(aramaId, { sonuc: "admine_baglandi" });
    return res.set("Content-Type", "text/xml").send(xml(
      say("Bir hata oluştu, müşteri hizmetlerine bağlanıyorsunuz.")
    ));
  }
}

// ── Ana handler ───────────────────────────────────────────────────────
module.exports = async (req, res) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).send("Method not allowed");
  }

  const tenantId = req.query.tenant;
  if (!tenantId) {
    return res.status(400).set("Content-Type", "text/xml").send(
      xml(say("Geçersiz yapılandırma. Lütfen yöneticinizle iletişime geçin."))
    );
  }

  const step = req.query.step || "initial";

  try {
    if (step === "initial") return await handleInitial(req, res, tenantId);
    if (step === "menu")    return await handleMenu(req, res, tenantId);
    if (step === "onay")    return await handleOnay(req, res, tenantId);
    return res.status(400).send("Geçersiz adım");
  } catch (err) {
    console.error("IVR webhook beklenmedik hata:", err);
    return res.set("Content-Type", "text/xml").status(500).send(
      xml(say("Teknik bir hata oluştu. Lütfen daha sonra arayın."))
    );
  }
};

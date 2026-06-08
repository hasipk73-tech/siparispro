const Iyzipay = require("iyzipay");
const iyzipay = require("./_iyzico");

// POST /api/odeme-kayitli-kart
// Body: { siparisId, tutar, musteri: { ad, soyad?, email?, telefon, adres? }, kartUserKey, kartToken }
// Response: { basarili, odemeId, hata? }
module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();

  const { siparisId, tutar, musteri, kartUserKey, kartToken } = req.body;

  if (!siparisId || !tutar || !musteri || !kartUserKey || !kartToken) {
    return res.status(400).json({ basarili: false, hata: "Eksik parametre" });
  }

  const request = {
    locale:         Iyzipay.LOCALE.TR,
    conversationId: siparisId,
    price:          String(tutar),
    paidPrice:      String(tutar),
    currency:       Iyzipay.CURRENCY.TRY,
    installment:    "1",
    basketId:       siparisId,
    paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
    paymentGroup:   Iyzipay.PAYMENT_GROUP.PRODUCT,
    paymentCard: {
      cardUserKey: kartUserKey,
      cardToken:   kartToken,
    },
    buyer: {
      id:                  musteri.telefon.replace(/\D/g, ""),
      name:                musteri.ad,
      surname:             musteri.soyad || "-",
      email:               musteri.email || `${musteri.telefon.replace(/\D/g, "")}@siparispro.app`,
      identityNumber:      "11111111111",
      ip:                  musteri.ip || "85.34.78.112",
      registrationAddress: musteri.adres || "Türkiye",
      city:                "Istanbul",
      country:             "Turkey",
    },
    shippingAddress: {
      contactName: musteri.ad,
      city:        "Istanbul",
      country:     "Turkey",
      address:     musteri.adres || "Türkiye",
    },
    billingAddress: {
      contactName: musteri.ad,
      city:        "Istanbul",
      country:     "Turkey",
      address:     musteri.adres || "Türkiye",
    },
    basketItems: [
      {
        id:        siparisId,
        name:      "Su Siparişi",
        category1: "Su Dağıtım",
        itemType:  Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
        price:     String(tutar),
      },
    ],
  };

  iyzipay.payment.create(request, (err, result) => {
    if (err) return res.status(500).json({ basarili: false, hata: err.message });

    if (result.status === "success") {
      return res.json({ basarili: true, odemeId: result.paymentId });
    }

    return res.json({ basarili: false, hata: result.errorMessage || "Ödeme başarısız" });
  });
};

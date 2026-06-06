# SiparisPro — CLAUDE.md

## Kullanıcı Profili

Web tasarımcı ve geliştirici. Uzmanlık alanları:

1. **Modern web sitesi tasarımı**
2. **Sipariş ve yönetim sistemleri**
3. **Restoran/cafe dijital menü sistemi** — QR kod ile açılan, kategori bazlı, fotoğraflı, fiyatlı menüler
4. **QR kod oluşturma ve yönetimi** — menü, ürün, lokasyon, iletişim için QR üretme
5. **E-ticaret** — ürün kataloğu, sepet, ödeme entegrasyonu
6. **Çoklu müşteri sistemi** — her işletme kendi panelinde yönetim
7. **Bildirim sistemi** — WhatsApp, SMS, tarayıcı bildirimleri
8. **Raporlama** — günlük, haftalık, aylık satış raporları

---

## Teknoloji Standartları

- **Framework:** React
- **Stil:** Tailwind CSS (yeni projelerde), mevcut projelerde CSS modülleri/App.css
- **Backend/DB:** Firebase (Firestore real-time, Authentication, Storage)
- **QR:** `qrcode.react` veya `qrcode` paketi
- **Dil:** Arayüzler her zaman Türkçe

---

## Tasarım İlkeleri

- **Mobil öncelikli** — her bileşen önce mobil için tasarlanır, sonra masaüstüne genişler
- **Her zaman hem masaüstü hem mobil test et** — geliştirme sonunda her iki görünümü kontrol et
- **Marka kimliğine uygun** — her projede müşterinin renk paleti ve fontunu kullan, logo entegre et
- Temiz, modern UI — gereksiz süsleme yok, işlevsellik ön planda
- Hızlı yükleme — gereksiz bağımlılıktan kaçın, lazy load uygula
- Kullanıcı dostu formlar ve butonlar — büyük dokunma alanı, net etiketler

---

## Kod Standartları

Her zaman uygulanacaklar:

1. **Loading state** — veri çekilirken veya işlem sürerken spinner/skeleton göster
2. **Hata kontrolü** — try/catch, Firestore işlemlerinde hata yakala
3. **Bildirimler** — işlem sonucu kullanıcıya başarı (yeşil) veya hata (kırmızı) bildirimi göster
4. **Form validasyonu** — submit öncesi gerekli alanları kontrol et, hatalı alanı vurgula
5. **Boş state** — liste boşsa kullanıcıya açıklayıcı mesaj göster

---

## Özellik Uygulama Notları

### Dijital Menü Sistemi
- QR kod tarandığında açılan, auth gerektirmeyen herkese açık sayfa
- Kategoriler sekme veya accordion ile listelenir
- Her ürün: fotoğraf, isim, açıklama, fiyat
- Firestore koleksiyonu: `menus/{businessId}/categories`, `menus/{businessId}/items`

### QR Kod
- `qrcode.react` ile SVG/PNG üret
- İndir butonu ekle (PNG olarak)
- Menü, ürün sayfası, Google Maps lokasyonu, vCard için ayrı şablonlar

### E-Ticaret
- Sepet state: React Context veya localStorage
- Ödeme: Stripe veya iyzico entegrasyonu
- Sipariş sonrası Firestore'a yaz, bildirim gönder

### Çoklu Müşteri (Multi-tenant)
- Firebase Auth ile giriş
- Firestore'da her işletme kendi `businesses/{businessId}` altında
- Kullanıcı sadece kendi verisini okuyup yazabilir (Security Rules)

### Bildirim Sistemi
- **Tarayıcı:** Web Push API (`useNotifications` hook)
- **WhatsApp:** CallMeBot API (`useWhatsApp` hook — mevcut)
- **SMS:** Netgsm veya Twilio API

### Raporlama
- Firestore sorguları: tarih aralığına göre filtrele (`where`, `orderBy`)
- Günlük/haftalık/aylık özet hesapla (`useMemo`)
- Grafik için `recharts` veya `chart.js` kullan
- PDF export: `jspdf` + `html2canvas`

---

## Firebase Projesi (SiparisPro)

- **Project ID:** gel-al-yavuzturk
- **Config dosyası:** `src/firebase.js`
- Firestore koleksiyonları: `orders`
- Real-time güncellemeler için `onSnapshot` kullan
- Yeni belge: `addDoc` + `serverTimestamp()`
- Güncelleme: `updateDoc`

---

## GitHub

- **Org:** hasipk73-tech
- **Repo:** https://github.com/hasipk73-tech/siparispro

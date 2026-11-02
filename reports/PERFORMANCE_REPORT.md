# Performans raporu

Bütün ölçümler bu oturumda, bulut kapsayıcısında **başsız Chromium** (Playwright) ile alındı. Gerçek telefon, Android WebView ya da iOS WKWebView ölçümü yapılamadı. Sayılar göreli karşılaştırma içindir; düşük güçlü bir telefonda mutlak değerler birkaç kat yüksek olabilir.

> **Güncelleme · 2026-11-02 — Expo kabuğu kaldırıldı, oyun PWA oldu.**
> - `app/` (Expo/React Native), APK ve Expo Go iş akışları ile eski APK sürümü silindi. Telefonda oynama artık ana ekrana eklenebilir web uygulaması (PWA) ile oluyor: manifest, ikonlar, service worker ve çevrimdışı açılış var.
> - Bu yüzden aşağıdaki şu maddeler artık geçerli değil: `app/` bağımlılık açıkları (G4: 13 açık, **kapandı**: projede npm bağımlılığı kalmadı), WebView gezinme kısıtı ve köprü doğrulaması (G2, G3, hata #9–10: kabukla birlikte kalktı), native geri tuşu (hata #8: web tarafındaki `SS.onBack` artık ana ekrandan açılan uygulamada tarayıcı geçmişiyle çalışıyor).
> - PWA, `ultimate.js` içinde yerel HTTP sunucusunda test ediliyor: manifest alanları, ikon boyutları, service worker etkinleşmesi, **çevrimdışı yeniden açılışta kaydın korunması**, telefonun paylaşım menüsü.
> - Yeni kısıtlar: web'de güvenilir zamanlanmış yerel bildirim yok (hatırlatmalar kalktı). iOS Safari, ana ekrana **eklenmemiş** sitelerin verisini uzun süre kullanılmazsa silebilir; ana ekrandaki uygulama bundan muaf.
> - Mağaza yayını için yol (Google Play: Trusted Web Activity; App Store: ince sarmalayıcı) README'de.

## Ölçümler

| Ölçüm | Değer | Kaynak |
|---|---|---|
| Açılış (sayfa yükleme → başlık ekranı hazır) | ort. **205–228 ms** (5 yükleme ortalaması, 4 ayrı tur) | `audit.js` · Performans |
| Ekran çizimi (bir görünümün tamamı) | en yavaş ekran **4,9–6,0 ms** (harita / seyir defteri); diğerleri daha hızlı | `audit.js` (11 görünüm × 20 çizim) |
| Ekran başına çizim (karışık) | **3,2–3,5 ms** | `ultimate.js` |
| Gece geçişi (akşam defteri + uyku + yeni gün) | **13–16 ms** | `audit.js` (200 gün) |
| Uzun oturum belleği | 3000 ekran çiziminde **+0,4 MB**; 200 oyun gününde ölçülebilir artış yok (`performance.memory` kaba ölçer) | `ultimate.js`, `audit.js` |
| Mini oyun kare süresi (%90 dilim) | **17–19 ms** (60 fps sınırında; hurda, savunma, kalkan, harita, teslimat, tamir) | `ultimate.js`, bu denetimdeki ölçüm |
| Kayıt boyutu | 200 gün sonra **11–12 KB**; 4 kez Yeni Oyun+ zincirinde en büyük kayıt 10 KB | `audit.js`, `ultimate.js` |
| Arka plan / ön plan geçişi | 100 geçiş, hata yok (her geçişte kayıt + bildirim planlama) | `audit.js` |
| Ağ istekleri | Oyun hiç ağ isteği yapmaz (yalnızca yazı tipi CSS'i ve paylaşım bağlantısı) | Kod incelemesi |

## Bu denetimde bulunan performans sorunu

**Mini oyun kenar dolgusu.** Siyah boşluk düzeltmesinin ilk hâli, kenarları her karede tuvalin kendi üstüne kopyalayarak dolduruyordu.
- **Maliyet:** vektör stilde kare başına **~1,23 ms** (piksel stilde 0,09 ms).
- **Belirti:** test ortamında mini oyun kazanılabilirlik testi 44 sn'den 435 sn'ye çıktı.
- **Çözüm:** kenarlar ilk karede boyanıyor, dolgu 6 karede bir yenileniyor. Ortalama maliyet ~0,2 ms/kare, test süresi 116 sn.
- **Sonrası:** dolgulu ve dolgusuz %90 kare süresi aynı (~18 ms).

## Yük senaryoları (oyun mantığı)

| Senaryo | Ölçek | Sonuç |
|---|---|---|
| Rastgele eylem fuzz'ı (güvenlik ağı olmadan) | 97 eylem, 4000 ve 8000 çağrı | 0 istisna, takılma yok |
| Hızlı rastgele oyunlar | 30 oyun (tam kapsamda 120) | 0 sorun |
| Rastgele arayüz oturumları | 4 oturum × 300 adım, 7 ekran boyutu | 0 hata |
| Uzun oyunlar | zorluk birleşimleri, Yeni Oyun+ | 0 hata, 0 ihlal |
| Denge simülasyonu (önceki döngü) | 48 senaryo, oyunun tamamı | sayfa hatası 0 |

## Darboğaz değerlendirmesi

- Darboğaz yok. En pahalı ekran (harita, animasyonlu tuval) ~5 ms; bu, 60 fps bütçesinin üçte biri.
- Piksel stilinde her karede `getImageData` ile palet indirgeme yapılıyor. Düşük güçlü telefonlarda kare hızını en çok bu düşürebilir. Önerim, cihazda ölçüp gerekirse indirgemeyi her 2 karede bir yapmak.
- Ölçülemeyenler: pil tüketimi, ısınma, gerçek cihazda açılış süresi (WebView başlatma + AsyncStorage köprüsü).

# Space Scrapper · Uygulama denetimi

Tarih: 2026-11-01 / 02 · Kapsam: `web/` (oyun), `app/` (Expo kabuğu), `tests/`, GitHub Actions.
Bu rapordaki her sayı bu oturumda gerçekten çalıştırılmış testlerden gelir. Ölçülemeyenler ayrıca belirtilmiştir.

> **Güncelleme · 2026-11-02 — Expo kabuğu kaldırıldı, oyun PWA oldu.**
> - `app/` (Expo/React Native), APK ve Expo Go iş akışları ile eski APK sürümü silindi. Telefonda oynama artık ana ekrana eklenebilir web uygulaması (PWA) ile oluyor: manifest, ikonlar, service worker ve çevrimdışı açılış var.
> - Bu yüzden aşağıdaki şu maddeler artık geçerli değil: `app/` bağımlılık açıkları (G4: 13 açık, **kapandı**: projede npm bağımlılığı kalmadı), WebView gezinme kısıtı ve köprü doğrulaması (G2, G3, hata #9–10: kabukla birlikte kalktı), native geri tuşu (hata #8: web tarafındaki `SS.onBack` artık ana ekrandan açılan uygulamada tarayıcı geçmişiyle çalışıyor).
> - PWA, `ultimate.js` içinde yerel HTTP sunucusunda test ediliyor: manifest alanları, ikon boyutları, service worker etkinleşmesi, **çevrimdışı yeniden açılışta kaydın korunması**, telefonun paylaşım menüsü.
> - Yeni kısıtlar: web'de güvenilir zamanlanmış yerel bildirim yok (hatırlatmalar kalktı). iOS Safari, ana ekrana **eklenmemiş** sitelerin verisini uzun süre kullanılmazsa silebilir; ana ekrandaki uygulama bundan muaf.
> - Mağaza yayını için yol (Google Play: Trusted Web Activity; App Store: ince sarmalayıcı) README'de.

Ayrıntılar:
- [TEST_COVERAGE.md](TEST_COVERAGE.md)
- [BUGS_AND_FIXES.md](BUGS_AND_FIXES.md)
- [PERFORMANCE_REPORT.md](PERFORMANCE_REPORT.md)
- [SECURITY_REPORT.md](SECURITY_REPORT.md)

## 1. Genel sağlık puanı: **88 / 100** (Expo kaldırıldıktan sonra: **91 / 100** — bağımlılık açıkları ve doğrulanamayan native kod ortadan kalktı; bildirim kaybı ve bulut yedeği eksikliği kaldı)

| Etken | Etki |
|---|---|
| Test edilen kapsamda bilinen kritik/yüksek hata yok; 10 hata bulundu ve düzeltildi | + |
| 638 denetim testi çalıştırması, 36.000 hatasız güvenlik ağsız eylem çağrısı, 330 kurcalanmış kayıt yüklemesi, 4 rastgele arayüz oturumu, uzun oyunlar | + |
| Native taraf (geri tuşu, bildirim, paylaşım, gezinme kısıtı) gerçek cihazda doğrulanamadı | −5 |
| Derleme aracı bağımlılıklarında 13 bilinen açık | −3 |
| Bulut yedeği yok: uygulama silinirse kayıt gider; kayıt şifresiz | −2 |
| Yatay ekranda mini oyunlar küçük (uygulama dikey kilitli) | −1 |
| Gerçek reklam akışı henüz yok | −1 |

## 2. Mimari ve özellik envanteri

- **Teknoloji:**
  - Oyun: framework kullanılmayan tek sayfa HTML/CSS/JS ve canvas; 16 dosyada ~6.700 satır.
  - Uygulama: Expo SDK 58 / React Native 0.88 kabuğu, `react-native-webview` içinde oyun.
  - Dağıtım: GitHub Actions ile APK (`apk` sürümü), web (`gh-pages`), EAS güncellemesi ve test iş akışı.
- **Ekranlar:**
  - Açılış ekranı ve 11 ana görünüm (26 alt sekme).
  - ~20 pencere türü.
  - 8 mini oyun ve Günün Avı.
  - 5 kumarhane oyunu.
- **Eylemler:** 97 kullanıcı eylemi (`SS.ACT`).
- **Veri:** üç `localStorage` anahtarı (kayıt, ayarlar, günlük skor). Uygulamada bunlar `ss:` önekiyle AsyncStorage'a köprülenir.
- **Kimlik doğrulama / sunucu / veritabanı / API:** **yok**. Oyun tamamen cihazda çalışır.
- **Bildirimler:** yerel, zamanlanmış (expo-notifications). Arka plan görevi yok.
- **Dış entegrasyon:**
  - Paylaşım sayfası, titreşim, Google Fonts.
  - Meydan okuma bağlantısı (yalnızca metin).
  - Reklam için yalnızca yer tutucu var.
- **Hata yönetimi:**
  - Her eylem genel bir `try/catch` ağıyla sarılı.
  - `SS.sanitize` sayıları onarır.
  - Bu denetimde eklenenler: `SS.repairSave` (kayıt türü ve kimlik doğrulaması) ve eylem giriş doğrulaması.

## 3–6. Çalıştırılan testler

| Koşu | Test | Geçti | Kaldı | Not |
|---|---|---|---|---|
| Denetim 1. tur (yarıda durduruldu) | 50 | 35 | 15 | 14 kurcalanmış kayıt çökmesi + fuzz; kök neden: tür onarımı yok |
| Denetim 2. tur | 62 | 59 | 3 | fuzz (gerçek) + 2 test düzeneği kusuru |
| Denetim 3. tur | 62 | 60 | 2 | karar hatası (gerçek) + düzenek |
| Denetim 4. tur (genişletilmiş: 60 kayıt, 8000 çağrı) | 92 | 90 | 2 | olay kimliği hatası (gerçek) + düzenek |
| Denetim, regresyon içinde | 62 | 61 | 1 | düzenek (kalıcılık testi yük altında) |
| Denetim, son 5 koşu (4'ü yük altında, paralel) | 310 | 309 | 1 | son düzenek düzeltmesinden sonra 2 paralel koşu 124/124 |
| **Denetim toplamı** | **638** | **614** | **24** | gerçek oyun hatası kaynaklı başarısızlıkların hepsi düzeltildi |
| Tam regresyon paketi (`run.js`, son koşu) | 10 bölüm | 9 | 1 | düşen bölüm: yukarıdaki kalıcılık testi (düzenek; düzeltildi, yeniden doğrulandı) |
| Kapsamlı paket (`ultimate.js`) | 16 kontrol × 3 koşu | 3. koşu 16/16 | 1. ve 2. koşuda yerleşim | dokunma alanı düzeltmesi |
| Mini oyun kazanılabilirliği (`winbots.js`) | 3 koşu | 3 | 0 | |
| Mini oyun doluluk ölçümü | 8 oyun × 5 ekran × 2 koşu | dikey 32/32 %100 | — | yatay bilerek dışarıda |
| Mini oyun ortasında kapanma araştırması | 68 deneme | gerçek zamanda 25/25 | — | hızlandırılmış zamanda kayıp: düzenek |
| Bağımlılık taraması (`npm audit`) | 1 | — | 13 bulgu | derleme araçları |

*Engellenen testler:* gerçek cihaz/emülatör gerektiren her şey (bkz. §15).

## 7. Önem derecesine göre sorunlar

| Önem | Bulunan | Düzeltilen | Kalan |
|---|---|---|---|
| Kritik | 0 | 0 | 0 |
| Yüksek | 2 (HTML enjeksiyonu, bozuk kayıtta açılış çökmesi) | 2 | 0 |
| Orta | 7 (karar/olay kimliği çökmeleri, eylem girdileri, mini oyun boşluğu, geri tuşu, WebView gezinmesi, bağımlılıklar) | 6 | 1 (bağımlılıklar) |
| Düşük | 4 (performans, köprü doğrulama, kurcalanabilir kayıt, yatay ekran) | 2 | 2 |

## 8–9. Düzeltilen ve kalan hatalar

[BUGS_AND_FIXES.md](BUGS_AND_FIXES.md) dosyasında her biri için yeniden üretim, kök neden, düzeltme ve doğrulama var.

## 10. Güvenlik

Ayrıntı: [SECURITY_REPORT.md](SECURITY_REPORT.md).
- **HTML enjeksiyonu:** kapatıldı.
- **WebView ve köprü:** sertleştirildi.
- **Kullanıcılar arası veri ve yetkilendirme:** uygulanamaz (sunucu yok).
- **Gizli bilgi:** sızıntısı yok.
- **Bağımlılıklar:** 13 bilinen açık, hepsi derleme araçlarında.

## 11. Performans

Ayrıntı: [PERFORMANCE_REPORT.md](PERFORMANCE_REPORT.md).

| Ölçüm | Değer |
|---|---|
| Açılış | ~0,2 sn |
| En yavaş ekran | ~5 ms |
| Gece geçişi | ~14 ms |
| Kare süresi | 60 fps sınırında |
| Bellek | uzun oturumda sabit |
| Kayıt | 200 günde 12 KB |

Kenar dolgusundaki 1,2 ms/kare'lik maliyet bulundu ve ~0,2 ms'ye indirildi.

## 12. Veri bütünlüğü

- **Kayıt onarımı:**
  - 330 rastgele bozulmuş kayıt yüklemesiyle doğrulandı: yanlış tür, `NaN`, sonsuz, negatif, HTML, `null`, boş nesne/dizi.
  - Son sürümde hiçbiri çökme ya da geçersiz sayı üretmiyor.
- **Kalıcılık:**
  - Oyna → yeniden aç → devam: gün, nakit, lisans, rota, kilometre taşı ve ayarlar aynı geliyor.
  - Depolama doluyken oyun sürüyor.
  - Depolama kapalıyken oyun açılıyor.
  - Eski kayıtlar geçiş katmanından geçiyor.
- **Bilinen kısıt:** kayıt yalnızca cihazda. Bulut yedeği ya da cihazlar arası taşıma yok.

## 13. Arayüz / UX

- **Mini oyunlar:** 8'inin hepsi dikey ekranlarda alanı %100 dolduruyor (önce siyah şeritler vardı).
- **Yerleşim:** 4 ekran boyutu × 2 stil × 3 temada taşan yazı, ekran dışı düğme ve 28 px altı dokunma alanı yok.
- **Android geri tuşu:** artık mini oyun → pencere → harita → çıkış sırasıyla çalışıyor.
- **Ad alanı:** emoji, Arapça, Türkçe karakterler ve sıfır genişlikli karakterler sorunsuz. Boş ad "Kaptan" oluyor.

## 14. Cihaz uyumluluğu

| Ortam | Durum |
|---|---|
| Chromium, 320×568 – 768×1024 dikey | Test edildi |
| Masaüstü 1280×800, yatay telefon 844×390 | Çizim test edildi; yatayda mini oyunlar küçük (uygulama dikey kilitli) |
| 7 saat dilimi, 4 yaz saati geçişi, yılbaşı | Test edildi |
| Android WebView / iOS WKWebView gerçek cihaz | **Test edilemedi** |

## 15. Test edilemeyen alanlar

- Gerçek Android/iOS cihazı ya da emülatör (kapsayıcıda yok). Bu kapsamda kalanlar:
  - native geri tuşu
  - gezinme kısıtı
  - bildirimler
  - paylaşım
  - titreşim
  - AsyncStorage kalıcılığı
  - sanal klavye
- Gerçek reklam SDK'sı (henüz eklenmedi).
- Expo Go yayını (depoda `EXPO_TOKEN` tanımlı değil).
- Satır/dal kapsam yüzdesi (ölçülmedi; uydurulmadı).

## 16. Önerilen sonraki adımlar

1. APK'yı bir Android telefonda kurup şu üç akışı elle doğrula:
   - geri tuşu: mini oyun, pencere, harita, çıkış
   - bildirim izni ve yarın hatırlatması
   - paylaşım kartı
2. Kaydı dışa aktarma/içe aktarma (ya da bulut yedeği): uygulama silinince ilerleme kaybolmasın.
3. Expo'nun yeni yama sürümü çıkınca `npm audit` açıklarını kapatmak için güncelle.
4. Web sürümüne İçerik Güvenliği Politikası (CSP) ekle.
5. Gerçek reklam SDK'sı eklenince `adEnergy` akışına zaman aşımı ve başarısızlık testleri ekle.
6. Düşük güçlü bir Android cihazda piksel stilinin kare hızını ölç.

## 17. Yayına hazırlık

- **Web sürümü:** herkese açık beta için hazır.
- **Android APK:** kapalı test (Play Console dahili test) için hazır. Önce 1. adımdaki üç akış gerçek cihazda doğrulanmalı, çünkü bu denetimde yalnızca web tarafı ve sözdizimi doğrulanabildi.
- **Mağaza yayını öncesi ayrıca gerekenler:**
  - reklam entegrasyonu ve testi
  - gizlilik politikası (yerel bildirimler ve paylaşım için)
  - imzalı sürüm derlemesi

## Tekrar çalıştırma

```bash
node tests/run.js           # hızlı kapsam (~35 dk)
node tests/run.js tam       # tam kapsam
node tests/audit.js 2       # yalnızca denetim, genişletilmiş
```

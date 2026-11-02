# Test kapsamı

Kapsam yüzdesi uydurulmadı: aşağıdaki tablo her özelliği hangi testin gerçekten çalıştırdığını gösterir. Satır ya da dal kapsamı ölçülmedi; kod tarayıcıda kaynak haritası olmadan çalıştığı için istanbul tipi bir araç kurulmadı.

> **Güncelleme · 2026-11-02 — Expo kabuğu kaldırıldı, oyun PWA oldu.**
> - `app/` (Expo/React Native), APK ve Expo Go iş akışları ile eski APK sürümü silindi. Telefonda oynama artık ana ekrana eklenebilir web uygulaması (PWA) ile oluyor: manifest, ikonlar, service worker ve çevrimdışı açılış var.
> - Bu yüzden aşağıdaki şu maddeler artık geçerli değil: `app/` bağımlılık açıkları (G4: 13 açık, **kapandı**: projede npm bağımlılığı kalmadı), WebView gezinme kısıtı ve köprü doğrulaması (G2, G3, hata #9–10: kabukla birlikte kalktı), native geri tuşu (hata #8: web tarafındaki `SS.onBack` artık ana ekrandan açılan uygulamada tarayıcı geçmişiyle çalışıyor).
> - PWA, `ultimate.js` içinde yerel HTTP sunucusunda test ediliyor: manifest alanları, ikon boyutları, service worker etkinleşmesi, **çevrimdışı yeniden açılışta kaydın korunması**, telefonun paylaşım menüsü.
> - Yeni kısıtlar: web'de güvenilir zamanlanmış yerel bildirim yok (hatırlatmalar kalktı). iOS Safari, ana ekrana **eklenmemiş** sitelerin verisini uzun süre kullanılmazsa silebilir; ana ekrandaki uygulama bundan muaf.
> - Mağaza yayını için yol (Google Play: Trusted Web Activity; App Store: ince sarmalayıcı) README'de.

## Özellik envanteri → test eşlemesi

| Alan | Öğeler | Hangi test çalıştırıyor |
|---|---|---|
| Açılış ekranı | ad girişi, 3 yol arkadaşı, 3 zorluk × 3, ton, görünüm, devam/yeni oyun | `edge.js`, `monkey.js`, `audit.js` (ad girdileri, devam) |
| 11 ana ekran + 26 alt sekme | harita, yaşam modülü (4), iş merkezi (5), hangar (3), pazar (2), kantin (2), klinik, Krell, akademi (2), kumarhane (2), seyir defteri (5) | `ultimate.js` (4 ekran × 2 stil yerleşim), `edge.js` (3 tema × 2 stil), `audit.js` (her turda bütün ekranlar ve sekmeler) |
| Pencereler | akşam defteri, bülten, menü, kılavuz, rehber, karar, hedefler, hane, borç takvimi, rota, gemi onayı, kumarhane masaları, pazarlık, kart masası, sınamalar, sonuç pencereleri, hikâye, oyun sonu | `audit.js` (defter, bülten, menü, borç, rota, rehber, karar/hedef/hane), `monkey.js` (rastgele), `ultimate.js` (içerik denetimi: 1002 sonuç metni iki tonda) |
| 97 eylem (`SS.ACT`) | gezinme, işler, alışveriş, ev, hane, kumarhane, akademi, ayarlar, paylaşım… | `audit.js` eylem fuzz'ı (97 eylem, 4000/8000 çağrı, güvenlik ağı olmadan), `ultimate.js` (16 eylemde çift dokunuş), `fast.js` (bütün eylemler rastgele) |
| Mini oyunlar | hurda avı (+Günün Avı), teslimat, tamir, ayrıştırma, 4 sınama oyunu (atış, kalkan, virüs, laboratuvar), evrak, güvenlik duvarı | `winbots.js` (kusursuz botlarla kazanılabilirlik), `lander.js`, `edge.js` (art arda aç-kapa), bu denetimde 8 oyun × 5 ekran doluluk ölçümü |
| Kumarhane | kart, çark, zar, meteor yarışı, slot; şanslı gece | `monkey.js`, `audit.js` fuzz |
| Ekonomi ve gün döngüsü | defter, gecikme, faiz, banka, masraflar, kilometre taşları, Rex, moral | `deep.js` (zorluk birleşimleri), `fast.js`, 48 senaryoluk denge simülasyonu |
| Kalıcılık | kayıt, ayarlar, günlük skor; eski kayıt geçişi; bozuk kayıt; depolama kapalı / dolu; mini oyun ortasında kapanma | `edge.js`, `audit.js` |
| Kayıt sağlamlığı | rastgele bozulmuş alanlar (tür, uç sayı, HTML, `null`, `NaN`) | `audit.js`: 30 (hızlı) / 60 (tam) kayıt |
| Saat ve tarih | 7 saat dilimi (UTC−11 … UTC+14, yarım/çeyrek saatli dilimler), 4 yaz saati geçişi, yılbaşı | `audit.js` |
| Uygulama köprüsü | `set/remove/clear`, `share`, `notify`, `haptic`, `exit` | `ultimate.js` (kayıt köprüsü yeniden açılış), `audit.js` (mesaj doğrulama, geri tuşu) |
| Erişilebilirlik ve yerleşim | taşan yazı, ekran dışı düğme, 28 px dokunma alanı, harita düğümü çakışması | `ultimate.js` (320×568, 360×740, 412×915, 768×1024) |
| Performans | açılış, çizim, gece, bellek, kare süresi, kayıt boyutu | `ultimate.js`, `audit.js` |

## Uygulanamayan kategoriler (mimari gereği)

Sunucu yok, API yok, veritabanı yok, hesap yok. Bu yüzden şunlar uygulanamaz:
- CRUD API testleri
- Yetkilendirme ve kullanıcı yalıtımı
- Satır düzeyi güvenlik
- Oturum süresi dolması
- Eşzamanlı yazma
- Çok cihaz eşitleme
- Ağ kesintisi (oyun ağ kullanmıyor)
- k6 yük testi

## Test edilemeyenler (ortam kısıtı)

| Konu | Neden | Ne yapıldı |
|---|---|---|
| Android/iOS gerçek cihaz, emülatör | Kapsayıcıda emülatör ya da cihaz yok | WebView mantığı Chromium'da; `App.js` sözdizimi Babel ile doğrulandı. APK CI'da derleniyor |
| Native bildirim, paylaşım, titreşim, AsyncStorage | Aynı | Köprüye giden mesajlar doğrulandı; kayıt köprüsü taklit edilerek yeniden açılış test edildi |
| Android geri tuşu (native taraf) | Aynı | Web tarafı `SS.onBack` test edildi |
| Klavye açılıp kapanması | Başsız tarayıcıda sanal klavye yok | Ad alanı `fill` ile test edildi |
| Gerçek reklam akışı | SDK henüz eklenmedi (kullanıcı kararı) | 5 sn yer tutucu test ediliyor |

## Tekrar çalıştırma

```bash
node tests/run.js        # hızlı kapsam
node tests/run.js tam    # tam kapsam
node tests/audit.js 2    # yalnızca denetim, genişletilmiş
```

# Güvenlik raporu

Kapsam: `web/` (oyun), `app/` (Expo kabuğu), GitHub Actions iş akışları. Savunma amaçlı değerlendirme; üretim verisine dokunulmadı (uygulamanın sunucusu ya da kullanıcı veritabanı yok).

> **Güncelleme · 2026-11-02 — Expo kabuğu kaldırıldı, oyun PWA oldu.**
> - `app/` (Expo/React Native), APK ve Expo Go iş akışları ile eski APK sürümü silindi. Telefonda oynama artık ana ekrana eklenebilir web uygulaması (PWA) ile oluyor: manifest, ikonlar, service worker ve çevrimdışı açılış var.
> - Bu yüzden aşağıdaki şu maddeler artık geçerli değil: `app/` bağımlılık açıkları (G4: 13 açık, **kapandı**: projede npm bağımlılığı kalmadı), WebView gezinme kısıtı ve köprü doğrulaması (G2, G3, hata #9–10: kabukla birlikte kalktı), native geri tuşu (hata #8: web tarafındaki `SS.onBack` artık ana ekrandan açılan uygulamada tarayıcı geçmişiyle çalışıyor).
> - PWA, `ultimate.js` içinde yerel HTTP sunucusunda test ediliyor: manifest alanları, ikon boyutları, service worker etkinleşmesi, **çevrimdışı yeniden açılışta kaydın korunması**, telefonun paylaşım menüsü.
> - Yeni kısıtlar: web'de güvenilir zamanlanmış yerel bildirim yok (hatırlatmalar kalktı). iOS Safari, ana ekrana **eklenmemiş** sitelerin verisini uzun süre kullanılmazsa silebilir; ana ekrandaki uygulama bundan muaf.
> - Mağaza yayını için yol (Google Play: Trusted Web Activity; App Store: ince sarmalayıcı) README'de.

## Saldırı yüzeyi

| Yüzey | Var mı | Not |
|---|---|---|
| Sunucu, API, veritabanı | **Yok** | Oyun tamamen cihazda çalışır |
| Kimlik doğrulama, oturum, belirteç | **Yok** | Hesap sistemi yok; IDOR, oturum ele geçirme, satır düzeyi güvenlik uygulanamaz |
| Kullanıcılar arası veri | **Yok** | Her kayıt yalnızca o cihazda; veri sızıntısı yolu yok |
| Kullanıcı girdisi | Var | Kaptan adı (18 karakter), gemi adı (20), meydan okuma kodu, URL `#meydan-…` parçası |
| Yerel depolama | Var | `localStorage` (web) / `AsyncStorage` `ss:` önekiyle (uygulama). Düz JSON, şifresiz |
| WebView ↔ native köprü | Var | `set/remove/clear/haptic/share/notify/ad/exit` mesajları |
| Üçüncü taraf | Az | Google Fonts CSS'i; GitHub Pages barındırma |

## Bulgular

| # | Önem | Bulgu | Durum |
|---|---|---|---|
| G1 | Yüksek | Oyuncu adı, akşam defteri ve bültende HTML olarak işleniyordu. Kayıtlı HTML enjeksiyonu; kurcalanmış kayıtla betik çalıştırılabiliyordu | **Düzeltildi**, 12 girdiyle doğrulandı |
| G2 | Orta | WebView herhangi bir adrese gidebiliyordu; dış sayfa açılırsa native köprüyü kullanabilirdi (depolamaya yazma, bildirim planlama) | **Düzeltildi**: `onShouldStartLoadWithRequest`; cihazda doğrulanmadı |
| G3 | Düşük | Native köprü mesajları doğrulanmıyordu (sınırsız bildirim, büyük değerler) | **Düzeltildi**: tür/boyut/adet sınırları; cihazda doğrulanmadı |
| G4 | Orta | `app/` bağımlılıklarında 13 bilinen açık (`npm audit --omit=dev`: 2 yüksek `@expo/cli`, `zod`; 10 orta; 1 düşük `deepmerge`) | **Açık**: hepsi derleme aracı bağımlılığı; telefondaki oyun koduna girmiyor. Otomatik düzeltme Expo'yu ana sürüm düşürüyor; uygulanmadı |
| G5 | Düşük | Kayıt şifresiz ve kurcalanabilir (para, gün…) | **Kabul**: tek oyunculu, skor tablosu yok. Kurcalanmış kayıt artık oyunu çökertmiyor (`repairSave`) |
| G6 | Bilgi | İçerik Güvenliği Politikası (CSP) yok | Öneri: web sürümüne `default-src 'self'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src fonts.gstatic.com; script-src 'self'` (uygulama paketi betikleri satır içine aldığı için orada `'unsafe-inline'` gerekir) |
| G7 | Bilgi | Meydan okuma kodu ve URL parçası yalnızca `^(MO-|meydan-)[0-9a-z]+-\d+` düzenli ifadesiyle ayrıştırılıyor; çıktı sayıya çevriliyor | Güvenli (`edge.js`: `#<script>` ve aşırı uzun kodlar denendi) |
| G8 | Bilgi | Hata ayıklama bilgisi: yalnızca `console.warn('Eylem hatası')`; gizli bilgi, anahtar, belirteç yok | Güvenli |
| G9 | Bilgi | Depoda gizli bilgi taraması: kodda API anahtarı ya da parola yok. `EXPO_TOKEN` yalnızca GitHub Secrets'ta bekleniyor (henüz tanımlı değil) | Güvenli |

## Yapılan güvenlik testleri

- **Ad alanı girdileri:** `<b>`, `"><i>`, `<svg onload>`, emoji, sağdan sola yazı, sıfır genişlikli ve satır ayırıcı karakterler, şablon dizesi, HTML varlıkları. Her biri bütün ekranlarda, akşam defterinde ve iki gece boyunca denendi.
- **Kurcalanmış kayıtta HTML:** 200 karakterlik `<img onerror>` adı ve `<i>` gemi adı.
- **Rastgele bozuk kayıtlar:** 330 kayıt yüklemesi (her birinde 4 alan rastgele değer, tür ve uç sayıyla bozuldu), ayrıca her birinde HTML enjeksiyonu kontrolü.
- **Köprü mesajları:** tür, liste uzunluğu, bildirim süresi ve görsel boyutu doğrulandı.

## Test edilemeyenler

- Native taraf (geri tuşu, gezinme kısıtı, köprü doğrulaması) gerçek cihazda ya da emülatörde çalıştırılamadı. Bu ortamda Android emülatörü yok. Değişiklikler sözdizimi düzeyinde doğrulandı ve APK derlemesi CI'da yapılacak.
- APK imzası, Play Store politikaları ve izinler incelenmedi.

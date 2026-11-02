# Space Scrapper

Borçlu bir hurdacının uzay istasyonundaki hayatı. Kancayla hurda avla, lisans al, iş kovala, haneni doyur, Krell'e olan borcunu kapat ve gemini büyüt.

Mobil öncelikli, Türkçe bir hayat simülasyonu. Çekirdeğinde kanca ile hurda toplama mini oyunu var. Saf HTML/CSS/JS ve canvas ile yazıldı; framework, sunucu ya da derleme adımı yok.

## Oyna

**https://ceomai.github.io/Space_Scrapper/**

Telefonda, tablette ve bilgisayarda tarayıcıdan açılır. Telefonda **ana ekrana eklenince** uygulama gibi çalışır: kendi simgesi olur, tam ekran ve dikey açılır, internet olmadan da çalışır. Ekleme yolu oyun içinde **☰ Menü → Ana ekrana ekle**:
- Android Chrome: menü (⋮) → *Uygulamayı yükle* / *Ana ekrana ekle*.
- iPhone Safari: *Paylaş* → *Ana Ekrana Ekle*.

Site, `main` dalındaki her güncellemede GitHub Actions ile yeniden yayınlanır (`.github/workflows/web-pages.yml`). Gereken ayar: Settings → Pages → Source: **Deploy from a branch**, Branch: **gh-pages** / **(root)**.

## Klasörler

| Klasör | İçerik |
| --- | --- |
| `web/` | Oyunun kendisi. `web/index.html` dosyasını tarayıcıda açmak yeterli. `manifest.webmanifest`, `sw.js` ve `icons/` PWA (ana ekrana ekleme, çevrimdışı) içindir. |
| `tests/` | Playwright ile otomatik testler: `node tests/run.js` (ayrıntı `tests/README.md`). |
| `reports/` | Uygulama denetimi raporları. |

## Uygulama mağazalarında yayın (ileride)

Oyun bir PWA olduğu için mağazalara **aynı web koduyla** çıkabilir; ayrı bir mobil kod tabanı gerekmez.

| Mağaza | Yol | Gerekenler |
| --- | --- | --- |
| **Google Play** | **Trusted Web Activity (TWA).** Site, Chrome'un tam ekran kabuğunda açılan bir Android uygulaması olarak paketlenir. Araç: [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) ya da [PWABuilder](https://www.pwabuilder.com/). | Play geliştirici hesabı. İmzalama anahtarı. Sitenin kökünde `/.well-known/assetlinks.json` (GitHub Pages proje sitesinde kök `ceomai.github.io` olduğu için kendi alan adı önerilir). Gizlilik politikası sayfası. |
| **App Store** | PWABuilder'ın iOS paketi ya da Capacitor gibi ince bir WKWebView sarmalayıcısı. | Apple geliştirici hesabı, Mac + Xcode. Apple salt web sarmalayıcılarına karşı titiz; oyunun çevrimdışı çalışması ve uygulamaya özel ek özellikler (bildirim, paylaşım) incelemeye yardımcı olur. |

**Hazır olanlar:**
- Manifest: ad, kısa ad, açıklama, dil, dikey yön, tam ekran, tema rengi.
- 192/512 px normal ve maskelenebilir ikonlar.
- Service worker ile çevrimdışı çalışma.
- `window.SS_NATIVE` köprüsü: ileride bir mağaza sarmalayıcısı bunu sağlarsa oyun native paylaşım, titreşim, bildirim ve reklam için ona geçer.

## Oyunun ana parçaları

- **Harita:** Yaşam Modülü, İş Merkezi, Rıhtım ve Hangar, Pazar Halkası, Gus'un Kantini, Klinik, Akademi, Nebula Kumarhanesi, Krell ve Banka. Yolculuk dakika ve enerji harcar; her yerin açılış saati var.
- **Akademi:** Oyun yalnızca hurda sözleşmeleriyle başlar. Teslimat, ayrıştırma, tamir, sipariş ve derin/tehlikeli hurda bölgeleri derslerle ve kısa sınavlarla açılır.
- **Kumarhane:** Yüksek mi alçak mı, Yıldız Çarkı, Kara Delik Zarı, Meteor Yarışı, Nebula Slotu. Günlük el limiti var; kasa uzun vadede kazanır, haftada bir şanslı gece.
- **Sınamalar:** 4–10 günde bir korsan haracı, meteor yağmuru, virüs, salgın ya da denetim. Ya ödersin ya da kısa bir mini oyunla savunursun.
- **Günün Avı:** Herkes için aynı tohumla üretilen 45 saniyelik hurda avı. Skor ızgarası, meydan okuma kodu ve paylaşım kartı.
- **Elde tutma:**
  - rehberli ilk gün ve yarın kancası
  - haftalık hikâye yayları ve haftalık özet
  - kilometre taşları
  - eser albümü ve set ödülleri
  - kişiselleştirme ve Yeni Oyun+

## Sabit kurallar

Herkes için aynı:
- Krell borcu ₡12.000
- aylık %2 faiz ve ₡700 taksit
- 120 gün süre
- 3 gecikmede oyun sonu

Zorluk ayarı yalnızca tehlike sıklığını, yaşam masraflarını ve pazar fiyatlarını değiştirir.

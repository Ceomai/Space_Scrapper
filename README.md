# Space Scrapper

Borçlu bir hurdacının uzay istasyonundaki hayatı. Kancayla hurda avla, lisans al, iş kovala, haneni doyur, Krell'e olan borcunu kapat ve gemini büyüt.

Mobil öncelikli, Türkçe bir hayat simülasyonu. Çekirdeğinde kanca ile hurda toplama mini oyunu var.

## Oyna

| Nasıl | Bağlantı |
| --- | --- |
| Tarayıcıda (her cihaz) | https://ceomai.github.io/Space_Scrapper/ |
| Android APK | [SpaceScrapper.apk](https://github.com/Ceomai/Space_Scrapper/releases/download/apk/SpaceScrapper.apk) |
| Expo Go QR kodu | [expo-go sürüm sayfası](https://github.com/Ceomai/Space_Scrapper/releases/tag/expo-go) |

Bu bağlantılar GitHub Actions ile her `main` güncellemesinde yeniden üretilir (`.github/workflows/`). Bağlantı adresleri değişmez.

- **Web:** Depo ayarlarında Settings → Pages → Source: **GitHub Actions** seçili olmalı.
- **APK:** Ek ayar gerekmez. Telefona indirip açınca Android "bilinmeyen kaynaklardan yükleme" izni ister.
- **Expo Go:** expo.dev'de ücretsiz bir hesap aç, Account settings → Access tokens'tan bir anahtar üret ve depoda Settings → Secrets and variables → Actions → **New repository secret** ile `EXPO_TOKEN` adıyla kaydet. Sonra Actions sekmesinden "Expo Go (EAS Update)" iş akışını bir kez çalıştır. QR kodu sürüm sayfasına yazılır ve her zaman en son yayını açar.

## Klasörler

| Klasör | İçerik |
| --- | --- |
| `web/` | Oyunun kendisi: tek sayfa HTML + canvas, framework yok. Tarayıcıda `web/index.html` açılarak oynanır. |
| `app/` | Expo (React Native) kabuğu. Oyunu bir WebView içinde çalıştırır; kayıt AsyncStorage'a, paylaşım, bildirim ve titreşim native köprüye gider. |

## Telefonda Expo Go ile çalıştırma

1. Bilgisayarına Node.js 20+ kur, telefonuna **Expo Go** uygulamasını indir.
2. Depoyu klonla ve uygulama klasörüne geç:

```bash
git clone https://github.com/Ceomai/Space_Scrapper.git
```

```bash
cd Space_Scrapper/app
```

```bash
npm install
```

```bash
npm start
```

3. Terminalde çıkan QR kodu Expo Go ile (iOS'ta Kamera ile) okut. Telefon ve bilgisayar aynı ağda değilse `npx expo start --tunnel` kullan.

`npm start`, önce `web/` klasöründeki oyunu `app/game/gameHtml.js` içine paketler, sonra Expo'yu başlatır. Yalnızca paketi yenilemek için `npm run build:game` yeterli.

## Oyunun ana parçaları

- **Harita:** Yaşam Modülü, İş Merkezi, Rıhtım ve Hangar, Pazar Halkası, Gus'un Kantini, Klinik, Akademi, Nebula Kumarhanesi, Krell ve Banka. Yolculuk dakika ve enerji harcar; her yerin açılış saati var.
- **Akademi:** Oyun yalnızca hurda sözleşmeleriyle başlar. Teslimat, ayrıştırma, tamir, sipariş ve derin/tehlikeli hurda bölgeleri derslerle ve kısa sınavlarla açılır.
- **Kumarhane:** Yüksek mi alçak mı, Yıldız Çarkı, Kara Delik Zarı, Meteor Yarışı, Nebula Slotu. Günlük el limiti var; kasa uzun vadede kazanır.
- **Sınamalar:** 4–10 günde bir korsan haracı, meteor yağmuru, virüs, salgın ya da denetim. Ya ödersin ya da kısa bir mini oyunla savunursun.
- **Günün Avı:** Herkes için aynı tohumla üretilen 45 saniyelik hurda avı. Skor ızgarası, meydan okuma kodu ve paylaşım kartı.
- **Elde tutma:** Rehberli ilk gün, yarın kancası, haftalık hikâye yayları, eser albümü ve set ödülleri, boya ve isim kişiselleştirmesi, Yeni Oyun+.

## Sabit kurallar

Krell borcu ₡12.000, aylık %2 faiz, ₡700 taksit, 196 gün süre ve 3 gecikmede oyun sonu herkes için aynıdır. Zorluk ayarı yalnızca tehlike sıklığını, yaşam masraflarını ve pazar fiyatlarını değiştirir.

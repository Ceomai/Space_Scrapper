# Google Play yayın paketi

Bu klasör Play Console'da istenen her şeyi içerir. Uygulama paketi (`.aab`) GitHub Actions'ta derlenir ve
[`android` sürümüne](https://github.com/Ceomai/Space_Scrapper/releases/tag/android) konur.

| Bilgi | Değer |
|---|---|
| Uygulama kimliği (package name) | `io.github.ceomai.spacescrapper` |
| Hedef Android sürümü | API 36 (minimum API 24, Android 7.0) |
| Sürüm | `1.0.<derleme no>`, versionCode = derleme no (her derlemede artar) |
| Gizlilik politikası | https://ceomai.github.io/Space_Scrapper/privacy.html |
| Kategori | Oyun › Simülasyon (alternatif: Gündelik) |
| Fiyat | Ücretsiz |

## Görseller

- `tr/` ve `en/`: 6 telefon ekran görüntüsü (1080×1920) ve tanıtım görseli `tanitim-1024x500.png`
- Uygulama ikonu (512×512): `web/icons/icon-512.png`
- Yeniden üretmek için: `node tools/store.js tr` ve `node tools/store.js en`

## Mağaza metinleri

### Türkçe
**Uygulama adı (30):** Space Scrapper

**Kısa açıklama (80):** Borçlu bir hurdacının uzay istasyonundaki hayatı: kanca at, iş kovala, borcunu öde.

**Tam açıklama:**
Koloni battı, elinde paslı bir gemi ve tefeci Krell'e ₡12.000 borç kaldı. Krell gülümsüyor. Krell hep gülümsüyor.

Space Scrapper, uzay istasyonunda geçen sıcak ve esprili bir yaşam simülasyonu:
• Kanca at, asteroit kuşağından gemi mezarlığına beş bölgede hurda avla
• Kargo teslimatı, devre tamiri ve ayrıştırma vardiyalarıyla para kazan
• Pıtırcık (robot kedi), küçük kardeşin Ela ve eski dostun Tolga'yla bir hane kur
• Evini dekor et, gemini geliştir, Gezgin Martı'ya ve Demir Balina'ya yüksel
• Rakibin Rex'le haftalık yarış, dalışlarda kanca kanca düello
• Akşam defterinde faturalara karar ver, sabah bülteninde istasyonun dedikodusunu oku
• Günün Avı ve Haftanın Avı: herkese aynı alan, skorunu arkadaşlarınla paylaş
• Albüm setleri, gemi çıkartmaları, yol arkadaşı görevleri, Yeni Oyun+

İnternetsiz oynanır, hesap gerekmez, kişisel veri toplanmaz. Türkçe ve İngilizce.

### English
**App name:** Space Scrapper

**Short description (80):** Life of an indebted space scrapper: cast the claw, chase jobs, pay off the debt.

**Full description:**
The colony went under. All you have left is a rusty ship and a ₡12,000 debt to Krell the loan shark. Krell smiles. Krell always smiles.

Space Scrapper is a warm, funny life sim set on a space station:
• Cast your claw and hunt scrap across five zones, from the asteroid belt to the ship graveyard
• Earn your keep with cargo deliveries, circuit repairs and sorting shifts
• Build a household with Pıtırcık the robot cat, your little sister Ela and your old friend Tolga
• Decorate your home, upgrade your ship, move up to the Wandering Gull and the Iron Whale
• Race your rival Rex every week, and duel him claw-to-claw in the field
• Decide which bills to pay in the evening ledger, catch station gossip in the morning bulletin
• Daily and Weekly Hunts: the same field for everyone, share your score with friends
• Album sets, ship decals, companion quests, New Game+

Plays offline, no account needed, no personal data collected. English and Turkish.

## Play Console formları

**Veri güvenliği (Data safety):**
- Uygulama kullanıcı verisi topluyor ya da paylaşıyor mu? **Hayır.**
- (Oyun kaydı yalnızca cihazda kalır; sunucu, analitik, reklam kimliği yok.)
- Gerçek reklam eklendiğinde bu form güncellenmelidir.

**İçerik derecelendirmesi (IARC anketi):**
- Şiddet: çizgi film tarzı patlamalar (insan yok) → hafif
- Kumar: **Simüle kumar var** (kumarhane bölümü; gerçek para yok, kazançlar oyun içi para). Bu soruya "evet" denmeli; derecelendirme genellikle PEGI 12 / 12+ çıkar.
- Kullanıcı etkileşimi/paylaşım: paylaşım cihazın kendi menüsüyle; sohbet yok
- Satın alma: yok

**Hedef kitle:** 13 yaş ve üzeri (simüle kumar nedeniyle çocuklara yönelik değil).

**Reklam içeriyor mu?** Şimdilik **Hayır**. Gerçek reklam eklenince "Evet" yapılmalı.

## İlk yükleme adımları

1. Play Console'da geliştirici hesabı (tek seferlik 25 USD) ve yeni uygulama: ad *Space Scrapper*, oyun, ücretsiz.
2. GitHub › Settings › Secrets and variables › Actions'a dört imza sırrını ekle (yükleme anahtarı sende); sonra Actions › *Android (Play Store paketi)* › Run workflow.
3. Derleme bitince [`android` sürümünden](https://github.com/Ceomai/Space_Scrapper/releases/tag/android) `.aab` dosyasını indir.
4. Play Console › Test et ve yayınla › **Dahili test** (önerilen ilk adım) › Yeni sürüm › `.aab`'yi yükle. Play App Signing'i kabul et.
5. Mağaza girişi, gizlilik politikası adresi, veri güvenliği, içerik derecelendirmesi ve hedef kitle formlarını yukarıdaki bilgilerle doldur.
6. Yeni kişisel hesaplarda Google, üretime geçmeden önce **en az 12 test kullanıcısıyla 14 gün kapalı test** ister. Dahili testten sonra kapalı teste geç.

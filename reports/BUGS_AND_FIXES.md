# Hatalar ve düzeltmeler

Denetim tarihi: 2026-11-01 / 02. Her kayıt: nasıl bulundu → kök neden → önem → düzeltme → doğrulama.
Önem ölçeği: **Kritik** (çökme/veri kaybı, yaygın), **Yüksek**, **Orta**, **Düşük**.

## Bu denetimde bulunan ve düzeltilenler

| # | Önem | Sorun | Nasıl bulundu | Kök neden | Düzeltme | Doğrulama |
|---|---|---|---|---|---|---|
| 1 | Yüksek | Oyuncu adı akşam defterine ve sabah bültenine **kaçışsız HTML** olarak basılıyordu (kayıtlı HTML enjeksiyonu; 18 karakter sınırıyla betik çalıştırmak zor ama `<b>`, `<i>` gibi etiketler arayüzü bozuyordu; kurcalanmış kayıtta uzun ad ile tam betik mümkündü) | Kod incelemesi + `audit.js` ad girdisi testleri | `ledgerModal` ve `bulletinModal` satır etiketleri `esc()` kullanmıyordu (`Akşam yemeği: ${S.name}`) | `web/js/ui.js`: defter satırları, seçmeli kalemler, `aria-label` ve bülten "dün gece" satırları `esc()` ile kaçışlanır | 10 farklı ad girdisi + 200 karakterlik `<img onerror>` adı + `<i>` gemi adı: hiçbir eleman/betik enjekte olmadı (4 tur) |
| 2 | Yüksek | **Bozuk/kurcalanmış kayıt açılışta çöküyordu**: bir alanın türü yanlışsa (dizi yerine sayı, `null` gemi kademesi, geçersiz konum, geçersiz zorluk dizisi…) "Devam et" ya da ilk gece hata veriyordu | `audit.js` kayıt kurcalama fuzz'ı: 1. turda 30 kayıttan 14'ü çöktü, 12 farklı hata imzası (`S.goals.filter is not a function`, `travelCost … reading 'x'`, `SS.dv … reading '1'`, `S.decor.filter`, `S.rexLog.push`, `ledger … billLater.filter`, `titleScreen … reading 'name'` vb.) | `SS.migrate` yalnızca **eksik** alanları dolduruyor, **yanlış türdekileri** onarmıyordu | `web/js/polish.js`: `SS.repairSave` — her alan yeni oyunun varsayılan türüyle karşılaştırılır; konum, görünüm, karar, hikâye yayı, kilometre taşı, rota, dekor, eser, ilan, stok, hedef, hane kimlikleri doğrulanır; sayılar aralığa çekilir. Geçişten önce ve sonra çalışır | 2.–4. turda 30+30+60 kurcalanmış kayıt: kalan çökme yalnızca #3 ve #4 (aşağıda), onlar da düzeltildi |
| 3 | Orta | Kayıttaki karar kimliği artık var olmayan bir hikâye adımını gösteriyorsa haritadaki karar penceresi çöküyordu (`reading 'who'`) | Kurcalanmış kayıt #20 | `SS.curDecision()` `null` dönebiliyor, çağıranlar kontrol etmiyordu | `core.js`: `curDecision` geçersiz kararı temizler; `ui.js` karar paneli ve `core.js` bülten `null` kontrolü yapar | Sonraki turlarda tekrar etmedi |
| 4 | Orta | Kayıttaki "yarının olayı" geçersizse gün geçişi çöküyordu (`reading 'run'`) | Kurcalanmış kayıt #44 (4. tur) | `newDay` `SS.EVENTS.find(...)` sonucunu kontrol etmiyordu | `core.js` olay yoksa atlar; `repairSave` `nextEvent`, `pitZone`, `morningKey` kimliklerini doğrular | Son regresyon turu |
| 5 | Orta | 20+ eylem geçersiz veriyle çağrılınca istisna atıyordu. İkisi **kalıcı bozulma** yaratıyordu: geçersiz konum rotaya eklenince üst şerit her çizimde hata veriyor; geçersiz ton seçimi açılış ekranını bozuyordu | `audit.js` eylem fuzz'ı (97 eylem, güvenlik ağı olmadan) | Eylemler `data-*` değerlerinin her zaman geçerli olduğunu varsayıyordu | `polish.js`: 21 eyleme giriş doğrulaması (`GUARD`); `world.js` `travelCost/travelCostFrom` bilinmeyen konumda güvenli; gün şeridi geçersiz rota durağını temizler | 4000 ve 8000 rastgele çağrıda 0 istisna |
| 6 | Orta | Mini oyunlar ayrılan alanı doldurmuyor, üstte/altta siyah boşluk kalıyordu (kullanıcı bildirdi: tamir oyunu; ölçümde **8 mini oyunun hepsinde** vardı) | Kullanıcı bildirimi + 8 oyun × 5 ekran ölçümü | Oyun tuvali sabit en-boy oranında (360×470 / 360×600) ölçekleniyordu | `stage.js`: tuval ekranın en-boy oranına genişler, içerik ortalanır, kenarlar oyunun kendi kenar pikselleriyle doldurulur; dokunma koordinatları kaydırılır | Dikey 4 ekran boyutunda 8/8 oyun %100 doluluk; mini oyun kazanılabilirlik testi (`winbots.js`) bütün oyunlarda geçti |
| 7 | Düşük (performans) | #6'nın ilk hâli kenar dolgusunu her karede yeniliyordu: vektör stilde kare başına ~1,2 ms, test ortamında mini oyun testi 44 sn → 435 sn | Regresyon süresi + doğrudan ölçüm | Tuvalin kendi üstüne her karede kopyalanması | Kenarlar ilk karede boyanır, dolgu 6 karede bir yenilenir (oyun kendi alanına kırpılı çizer) | `winbots.js` 116 sn; %90 kare süresi dolgulu/dolgusuz aynı (~18 ms, 60 fps) |
| 8 | Orta (UX) | Android geri tuşu oyunu doğrudan kapatıyordu | Keşif (App.js'te `BackHandler` yok) | — | `polish.js` `SS.onBack`: mini oyun → pencere → harita → çıkış; `App.js` geri tuşunu oyuna iletir, haritadaysa uygulamayı kapatır | Web tarafı `audit.js` ile doğrulandı. **Native taraf cihaz/emülatörde çalıştırılamadı** (sözdizimi doğrulandı) |
| 9 | Orta (güvenlik) | WebView her adrese gidebiliyordu; dış bir sayfa açılırsa köprüye (`SS_NATIVE`) erişebilirdi | Kod incelemesi | `originWhitelist=['*']`, gezinme kısıtı yok | `App.js` `onShouldStartLoadWithRequest`: yalnızca oyun sayfası; dış bağlantılar sistem tarayıcısında açılır | Sözdizimi doğrulandı; **cihazda çalıştırılamadı** |
| 10 | Düşük (güvenlik) | Native köprü gelen mesajları doğrulamıyordu (sınırsız bildirim listesi, her tür anahtar/değer) | Kod incelemesi | — | `App.js`: mesaj türü kontrolü, anahtar uzunluğu, değer boyutu, en fazla 10 bildirim, 1 dk – 30 gün aralığı, metin kırpma | Web tarafının ürettiği mesajlar `audit.js` ile doğrulandı (8 mesaj, 0 geçersiz) |

## Bu denetimden hemen önceki döngüde düzeltilenler (aynı oturum, commit `4c166e7`)

| Önem | Sorun | Düzeltme |
|---|---|---|
| Orta | Masraf kararı, kayıt boşken içerik denetiminde çöküyordu | `curBill()` güvenli varsayılan |
| Düşük | Borç düğmesi ve ayar onay kutularının dokunma alanı 21–26 px (alt sınır 28) | 28/34 px |

## Hata sanılıp test düzeneği kusuru çıkanlar (oyun kodu değişmedi)

| Bulgu | İnceleme | Sonuç |
|---|---|---|
| "Mini oyunun ortasında yeniden açılınca kayıt kayboluyor" (4. tur ve regresyonda tekrarladı) | Hızlandırılmış zaman düzeneğiyle 10 denemenin 2–6'sında kayıt anahtarı yeniden yüklemeden sonra boş geliyordu. Yüklemeden önce kayıt 8/8 denemede diskteydi. Gerçek zamanda 15/15 + 10/10 deneme sorunsuz | Testteki `MessageChannel` döngüsü olay döngüsünü doldurup Chromium'un localStorage yazma zamanlayıcısını aç bırakıyor. Uygulamada kayıt her yazımda doğrudan AsyncStorage'a gönderilir. Test gerçek zamanda koşacak şekilde değiştirildi |
| Kalıcılık testinde "ayar kayboldu" | Test başlangıç betiği her yeniden yüklemede ayarları sıfırlıyordu | Düzenek düzeltildi |
| Geri tuşu testinde "modal açık" | Başlangıçta kuyrukta bekleyen tanıtım pencereleri sırayla açılıyordu (doğru davranış) | Test kuyruğu boşaltacak şekilde düzeltildi |
| Yaz saati testi takıldı | `clock.install` oyunun zamanlayıcılarını donduruyordu | `setFixedTime` kullanıldı |

## Çözülmeden kalanlar

| Önem | Konu | Neden kaldı |
|---|---|---|
| Orta | `app/` bağımlılıklarında 13 bilinen açık (2 yüksek, 10 orta, 1 düşük) — hepsi Expo derleme araçlarının dolaylı bağımlılıkları (`@expo/cli`, `zod`, `glob`, `minimatch`, `deepmerge`…) | `npm audit fix` önerisi Expo'yu eski bir ana sürüme (53) düşürmek; APK derlemesini bozma riski. Telefona giden oyun kodunda bu paketler yok. Expo yama sürümü çıkınca güncellenmeli |
| Düşük | Yatay ekranda mini oyunlar alanın %29–41'ini kullanıyor | Uygulama dikey kilitli (`app.json`); yalnızca masaüstü/yatay tarayıcıda görülür. Yatay için ayrı yerleşim gerekir |
| Düşük | Kayıt dosyası cihazda düz JSON; kurcalanarak para/gün değiştirilebilir | Tek oyunculu, sunucusuz oyun; skor tablosu yok. Bilinçli kabul |
| Bilgi | Gerçek reklam SDK'sı yok (5 sn yer tutucu) | Kullanıcı kararı: testler bitmeden eklenmeyecek |

# Space Scrapper testleri

Oyunu gerçek tarayıcıda (Playwright + Chromium) binlerce farklı yoldan oynatan test paketi. GitHub'da her `main` güncellemesinde "Testler" iş akışı hızlı kapsamla çalışır; Actions sekmesinden `tam` kapsamla elle de başlatılabilir.

```bash
npm install --no-save playwright@1.63.0 && npx playwright install chromium
node tests/run.js        # hızlı (~15 dk)
node tests/run.js tam    # tam (~60 dk)
```

| Dosya | Ne yapar |
| --- | --- |
| `unit/run.js` | Tarayıcısız birim testleri (`node tests/unit/run.js`, Playwright gerekmez): oyunun `web/js` dosyaları bir `vm` bağlamına yüklenir; eski/bozuk kayıt göçü ve onarımı, kaydet-yükle, koruma ağı, tohumlu çok günlük uyku ekonomisi (değişmezler ve belirlenimcilik), iş ödeme hesapları, İngilizce çeviri (yer tutucular) |
| `ultimate.js` | İçerik denetimi (her karar, yay, sınama ve olay sonucunun iki tonda metni), çift dokunuş, 4 ekran boyutu × 2 stilde yerleşim (taşma, ekran dışı düğme, dokunma alanı, harita çakışması), bellek ve kare süresi, Günün Avı determinizmi, PWA (yerel sunucuda manifest, ikon boyutları, service worker, çevrimdışı yeniden açılış, paylaşım menüsü), 4×125 günlük Yeni Oyun+ zinciri, saat sınırları |
| `winbots.js` | Her mini oyunu kusursuz oynayan botlarla kazanılabilirliği doğrular (iniş, tamir, ayrıştırma, laboratuvar, kalkan, savunma, güvenlik duvarı, evrak) |
| `lander.js` | İniş oyununun bütün zorluk ve değiştirici birleşimlerini ölçer |
| `audit.js` | Denetim: ad alanına HTML/emoji/RTL girdileri, 30–60 rastgele kurcalanmış kayıt, 97 eylemin güvenlik ağı olmadan 4000+ rastgele çağrısı, 7 saat dilimi ve yaz saati geçişleri, kalıcılık ve depolama dolu durumu, mini oyun ortasında kapanma, köprü mesaj doğrulaması, geri tuşu (ana ekrandan açılan uygulama), açılış süresi ve bellek |
| `edge.js` | Depolama kapalı, bozuk kayıt, eski kayıt geçişi, garip bağlantılar, bütün ekranlar × 3 tema × 2 stil, masaüstü ve yatay ekran |
| `i18n.js` | İngilizce mod: bütün ekranlar, pencereler, 4 mini oyun ve sabah akışı; ekranda/tuvalde kalan Türkçe satırları listeler, Türkçe modun değişmediğini doğrular |
| `fast.js` | Mini oyunları atlayıp oyunun bütün eylemlerini rastgele girdilerle sürer; her adımda değerlerin geçerliliğini denetler |
| `monkey.js` | Gerçek arayüzde rastgele dokunan oturumlar (7 ekran boyutu, rastgele ayarlar) |
| `deep.js` + `bot.js` | 27 zorluk birleşimi × hane seçenekleriyle oyunu baştan sona oynar; rastgele kararlar, sınamalar, banka kredisi, kaydet-yükle ve Yeni Oyun+ |

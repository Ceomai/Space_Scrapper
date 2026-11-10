// Space Scrapper — ek anlatı içeriği: yeni kararlar, hikâye yayları, sınamalar, sohbet satırları ve haberler
(function(SS){
const { fmt, clamp, rint, pick } = SS;
const has = id => () => SS.hasCrew(id);
const capPay = n => { const p = Math.min(S.cash, Math.round(n)); S.cash -= p; return p; };
const D = SS.DECISIONS;

/* =========================================================
   KARARLAR (+9)
   ========================================================= */
D.push({ id: 'bankrep', title: 'Banka Temsilcisi', when: () => S.lender === 'bank' && S.loan > 2000,
  text: { easy: 'Bankanın temsilcisi kravatını üç kez düzeltti: "Erken ödeme kampanyası! Bugün ₡1.000 öderseniz borcunuzdan ₡1.250 düşüyoruz. Kampanya bitince kravatımı da çıkaracağım."', hard: 'Banka temsilcisi kapıda. Bugün ₡1.000 öderseniz borçtan ₡1.250 düşülecek. Teklif yarın geçerli değil.' },
  opts: [
    { label: '₡1.000 öde, ₡1.250 düşsün', need: () => S.cash >= 1000, run() { S.cash -= 1000; S.loan = Math.max(0, S.loan - 1250); SS.loanCheck(); return { easy: 'Temsilci kravatını çıkardı ve havaya fırlattı. Borcun ₡1.250 azaldı.', hard: 'Makbuz imzalandı. Borç ₡1.250 azaldı.' }; } },
    { label: 'Şimdi olmaz', run() { return { easy: 'Temsilci kravatını geri bağladı. Hayal kırıklığı belli.', hard: 'Temsilci bir sonraki kapıya yürüdü.' }; } },
  ] });
D.push({ id: 'oldowner', title: 'Martı\'nın Eski Sahibi', when: () => S.tier === 1,
  text: { easy: 'Gezgin Martı\'nın eski sahibi kapıda. Kokpitte unuttuğu peluş ahtapotu istiyor. Ahtapot artık Pıtırcık\'ın yatağı.', hard: 'Martı\'nın eski sahibi geldi. Kokpitte bir fotoğraf unutmuş. Karısının son fotoğrafıymış.' },
  opts: [
    { label: 'Geri ver', run() { SS.mood(10); SS.earn(80); return { easy: 'Ahtapot sahibine kavuştu. Sana ₡80 bahşiş bıraktı. Moral +10.', hard: 'Adam fotoğrafı göğsüne bastırdı. Gitmeden ₡80 bıraktı. Moral +10.' }; } },
    { label: '₡200\'e sat', run() { SS.earn(200); SS.mood(-4); return { easy: '₡200 aldın. Adam ahtapotla birlikte ağladı. Moral -4.', hard: '₡200. Adam bir şey demedi. Moral -4.' }; } },
  ] });
D.push({ id: 'lostkid', title: 'Kayıp Çocuk',
  text: { easy: 'Rıhtımda ağlayan bir çocuk var. Annesini kaybetmiş, elinde yarısı yenmiş bir kurabiye. Kurabiyeyi de kaybetmek üzere.', hard: 'Rıhtımda tek başına bir çocuk. Kimse durmuyor. Ailesini bulmak bir saatini alır.' },
  opts: [
    { label: 'Ailesini bul (1 saat)', need: () => SS.timeOk(60), run() { SS.passTime(60); SS.mood(8); S.aff.gus = Math.min(100, S.aff.gus + 6); S.karma++; return { easy: 'Annesi kantindeymiş. Gus ikinize de sıcak çikolata verdi. Moral +8.', hard: 'Annesi aramaktan bitkin düşmüş. Sana sarıldı. Gus her şeyi görmüş. Moral +8.' }; } },
    { label: 'Güvenliğe haber ver', run() { SS.mood(-3); return { easy: 'Güvenlik geldi. Çocuk güvenliğe de ağladı. Moral -3.', hard: 'Güvenlik çocuğu götürdü. Doğru mu yaptın, bilmiyorsun. Moral -3.' }; } },
  ] });
D.push({ id: 'gusrecipe', title: 'Gus\'un Tarifi',
  text: { easy: 'Gus yeni bir güveç deniyor ve bir tadımcı arıyor. "Ölmezsin. Büyük ihtimalle." Bir saat sürer.', hard: 'Gus yeni bir yemek deniyor, malzemesi kısıtlı. Tadımcı arıyor. Bir saat sürer.' },
  opts: [
    { label: 'Tadımcı ol (1 saat)', need: () => SS.timeOk(60), run() { SS.passTime(60); S.aff.gus = Math.min(100, S.aff.gus + 10); S.hunger = clamp(S.hunger + 30, 0, 100); return { easy: 'Güveç mor çıktı ama lezzetliydi. Gus yakınlığı +10, tokluk +30.', hard: 'Yemek iyiydi. Gus ilk kez sana adınla seslendi. Yakınlık +10, tokluk +30.' }; } },
    { label: 'Aç değilim', run() { return { easy: 'Gus güveci Rex\'e verdi. Rex hâlâ mor.', hard: 'Gus omuz silkti ve tencereyi kapattı.' }; } },
  ] });
D.push({ id: 'zarapartner', title: 'Zara\'nın Ortaklık Teklifi', when: () => S.aff.zara >= 20,
  text: { easy: 'Zara yeni bir tezgâh açmak istiyor: "₡300 koy, ay sonu ₡480 al. Ya da hiç alma. Ama genelde alırsın."', hard: 'Zara ortak arıyor: ₡300 yatırırsan kâr payı alırsın. Pazar riskli, Zara değil. Belki.' },
  opts: [
    { label: 'Yatır (₡300)', need: () => S.cash >= 300, run() { S.cash -= 300; if (Math.random() < .65) { SS.earn(480); S.aff.zara = Math.min(100, S.aff.zara + 8); return { easy: 'Tezgâh patladı! (İyi anlamda.) ₡480 geri geldi.', hard: 'Kâr geldi: ₡480. Zara sana ilk kez gülümsedi.' }; } return { easy: 'Tezgâh patladı. (Kötü anlamda.) ₡300 gitti, Zara bir özür kartı yolladı.', hard: 'Tezgâh battı. ₡300 gitti.' }; } },
    { label: 'Hayır', run() { return { easy: 'Zara "kaybeden sensin" dedi. Sonra hesap makinesine baktı ve emin olamadı.', hard: 'Zara başka birini buldu.' }; } },
  ] });
D.push({ id: 'vidaproto', title: 'Vida Usta\'nın Prototipi',
  text: { easy: 'Vida Usta deneysel bir kanca yağı yapmış: "%70 HARİKA, %30 BOM. İSTATİSTİK DOSTUMUZ."', hard: 'Vida Usta deneysel bir kanca yağı denemek istiyor. Bazen işe yarıyor. Bazen patlıyor.' },
  opts: [
    { label: 'Dene', run() { if (Math.random() < .7) { S.buffs.clawoil = (S.buffs.clawoil || 0) + 2; S.aff.vida = Math.min(100, S.aff.vida + 6); return { easy: 'HARİKA tarafı çıktı! İki kutu kanca yağı kazandın.', hard: 'Çalıştı. Elinde iki kutu kanca yağı var.' }; } const d = SS.hurt ? SS.hurt(8, 'Prototip') : 0; return { easy: `BOM tarafı çıktı. Kaşların biraz kısaldı. Sağlık -${d || 8}.`, hard: `Patladı. Sağlık -${d || 8}.` }; } },
    { label: 'Teşekkürler, hayır', run() { return { easy: 'Vida Usta prototipi Rex\'in gemisine sürdü.', hard: 'Vida Usta prototipi kaldırdı.' }; } },
  ] });
D.push({ id: 'pit_update', who: 'pit', title: 'Pıtırcık\'ın Güncellemesi', when: has('pit'),
  text: { easy: 'Pıtırcık\'ın ekranında "GÜNCELLEME VAR (₡60)" yazıyor. Altında küçük harflerle: "lütfen".', hard: 'Pıtırcık\'ın yazılımı eskimiş. Güncelleme ₡60.' },
  opts: [
    { label: 'Güncelle (₡60)', need: () => S.cash >= 60, run() { S.cash -= 60; SS.bond('pit', 8); return { easy: 'Güncelleme tamam. Pıtırcık artık iki dilde miyavlıyor. Bağ +8.', hard: 'Pıtırcık daha hızlı tepki veriyor. Bağ +8.' }; } },
    { label: 'Sonra', run() { if (Math.random() < .5) { S.crew.pit.down = Math.max(S.crew.pit.down || 0, 1); return { easy: 'Pıtırcık güncellemeyi kendi denedi. Bir gün boyunca kendi kuyruğunu kovaladı.', hard: 'Pıtırcık hata verdi ve bir gün kapalı kaldı.' }; } return { easy: 'Pıtırcık ekrana "peki" yazdı. Küçük harflerle.', hard: 'Pıtırcık bekledi.' }; } },
  ] });
D.push({ id: 'ela_friend', who: 'ela', title: 'Ela\'nın Arkadaşı', when: has('ela'),
  text: { easy: 'Ela\'nın arkadaşı Deniz bu gece bizde kalmak istiyor. İki çocuk, bir kedi robot, sıfır uyku.', hard: 'Ela\'nın arkadaşı Deniz\'in evinde elektrik kesik. Bu gece sizde kalmak istiyor. Fazladan yemek gerekir.' },
  opts: [
    { label: 'Tabii (₡30)', need: () => S.cash >= 30, run() { S.cash -= 30; SS.bond('ela', 10); SS.mood(4); return { easy: 'Gece boyunca kıkırdama sesleri geldi. Sabah ikisi de uyuyordu, sen değil. Bağ +10.', hard: 'Ela uzun zamandır böyle gülmemişti. Bağ +10.' }; } },
    { label: 'Bu gece olmaz', run() { SS.bond('ela', -5); return { easy: 'Ela "zaten sıkıcı biriydi" dedi. Değildi. Bağ -5.', hard: 'Ela sessizce mesaj yazdı. Bağ -5.' }; } },
  ] });
D.push({ id: 'tolga_brother', who: 'tolga', title: 'Tolga\'nın Kardeşi', when: has('tolga'),
  text: { easy: 'Tolga\'nın kardeşi Kaan istasyona gelmiş ve iş arıyor. Tolga senden referans olmanı istiyor. Kaan\'ın CV\'sinde "kumar" yazıyor, hobi kısmında.', hard: 'Tolga\'nın kardeşi Kaan iş arıyor. Tolga senden referans istiyor. Kaan\'ın geçmişi temiz değil.' },
  opts: [
    { label: 'Referans ol', run() { SS.bond('tolga', 10); if (Math.random() < .3) { SS.charge(120); return { easy: 'Kaan işe girdi ve ilk gün forkliftle Zara\'nın tezgâhına çarptı. Fatura senin adına: ₡120. Tolga bağı +10.', hard: 'Kaan ilk hafta sorun çıkardı. Hasarı sen ödedin: ₡120. Tolga bağı +10.' }; } return { easy: 'Kaan işe girdi ve gerçekten çalışıyor. Tolga gururdan şişti. Bağ +10.', hard: 'Kaan düzgün çalışıyor. Tolga sana minnettar. Bağ +10.' }; } },
    { label: 'Riskli', run() { SS.bond('tolga', -6); return { easy: 'Tolga "kardeşim bir melek" dedi. Kimse inanmadı. Bağ -6.', hard: 'Tolga anlayışla karşıladı. Ama kırıldı. Bağ -6.' }; } },
  ] });

/* =========================================================
   HİKÂYE YAYLARI (+3)
   ========================================================= */
SS.ARCS.push(
  { id: 'vidalast', who: null, title: 'Vida Usta\'nın Son Eseri', steps: [
    { text: { easy: 'Vida Usta gizli bir proje yapıyor: "EN İYİ MOTOR. PARÇA LAZIM. SEN LAZIM." ₡120 ya da iki saat hurda toplamak.', hard: 'Vida Usta yıllardır bir motor üzerinde çalışıyor. Son parçaları eksik. Ya ₡120 verirsin ya da iki saat birlikte parça ararsınız.' },
      opts: [{ label: 'Parçaya para ver (₡120)', need: () => S.cash >= 120, run() { S.cash -= 120; S.arcScore++; return { easy: 'Vida Usta parayı aldı ve bir sevinç bip\'i çıkardı.', hard: 'Vida Usta parayı aldı. "TEŞEKKÜR EDERİM." İlk kez.' }; } },
        { label: 'Birlikte ara (2 saat)', need: () => SS.timeOk(120), run() { SS.passTime(120); S.arcScore++; S.aff.vida = Math.min(100, S.aff.vida + 6); return { easy: 'Çöplükte iki saat geçirdiniz. Vida Usta bir parça buldu, sen bir çorap.', hard: 'Parçaları bulduk. Vida Usta seni ustası gibi izledi.' }; } },
        { label: 'Vaktim yok', run() { return { easy: 'Vida Usta "SORUN YOK" dedi. Sorun var.', hard: 'Vida Usta başını çevirdi.' }; } }] },
    { text: { easy: 'Motor hazır! Test uçuşu için bir pilot lazım. Pilot sensin. Paraşüt yok, çünkü uzay.', hard: 'Test uçuşu. Motor patlarsa ikiniz de yanarsınız. İki saat sürer.' },
      opts: [{ label: 'Test et (2 saat)', need: () => SS.timeOk(120), run() { SS.passTime(120); if (Math.random() < .75) { S.arcScore++; return { easy: 'Motor uçtu, sen uçtun, Vida Usta ağladı (yağ).', hard: 'Motor sorunsuz çalıştı. Vida Usta sessizce not aldı.' }; } const d = SS.hurt ? SS.hurt(10, 'Test uçuşu') : 10; return { easy: `Motor biraz fazla uçtu. Sağlık -${d}.`, hard: `Motor tekledi, sert indiniz. Sağlık -${d}.` }; } },
        { label: 'Başkası test etsin', run() { return { easy: 'Rex test etti. Rex hâlâ dönüyor.', hard: 'Vida Usta motoru kendisi denedi. Bir kolu eksik döndü.' }; } }] },
    { text: { easy: 'Vida Usta seni atölyeye çağırdı. Masada kurdeleli bir kutu var.', hard: 'Vida Usta atölyede bekliyor. Yüzündeki ekran gülümsüyor.' },
      opts: [{ label: 'Kutuyu aç', run() { if (S.arcScore >= 2) { S.aff.vida = Math.max(S.aff.vida, 60); return { easy: '"SEN BENİM EN İYİ MÜŞTERİMSİN." Vida Usta artık geliştirmelerde %20 indirim yapıyor.', hard: 'Vida Usta seni ortağı sayıyor. Geliştirmelerde artık %20 indirim var.' }; } SS.earn(100); return { easy: 'Kutudan ₡100 ve bir vida çıktı. Vida "hatıra".', hard: 'İçinde ₡100 var. "Emeğin için."' }; } }] },
  ] },
  { id: 'bankeye', who: null, title: 'Bankanın Gözü', when: () => S.lender === 'bank' && S.loan > 0, steps: [
    { text: { easy: 'Bankadan bir denetçi geldi. Defterlerini görmek istiyor. Defterlerin bir peçete ve iki makbuzdan ibaret.', hard: 'Banka denetçisi kayıtlarını istiyor. Düzgün göstermek bir saatini alır.' },
      opts: [{ label: 'Kayıtları düzenle (1 saat)', need: () => SS.timeOk(60), run() { SS.passTime(60); S.arcScore++; return { easy: 'Peçeteyi Excel\'e geçirdin. Denetçi etkilendi.', hard: 'Kayıtlar düzenli. Denetçi not aldı.' }; } },
        { label: 'Denetçiye kahve ısmarla (₡40)', need: () => S.cash >= 40, run() { S.cash -= 40; if (Math.random() < .5) S.arcScore++; return { easy: 'Denetçi kahveyi sevdi. Seni sevip sevmediği belirsiz.', hard: 'Denetçi kahveyi aldı ama kalemini bırakmadı.' }; } }] },
    { text: { easy: 'Banka yapılandırma teklif ediyor: süreye 28 gün eklensin, borç %5 artsın. "Herkes kazanır!" Banka biraz daha çok kazanır.', hard: 'Banka krediyi yapılandırmayı öneriyor: süre 28 gün uzar, borç %5 artar.' },
      opts: [{ label: 'Kabul et', run() { S.loan = Math.round(S.loan * 1.05); S.bankDeadline = (S.bankDeadline || S.day) + 28; return { easy: 'İmzaladın. Süre uzadı, borç büyüdü. Banka temsilcisi dans etti.', hard: 'Süre 28 gün uzadı. Borç %5 büyüdü.' }; } },
        { label: 'Reddet', run() { S.arcScore++; return { easy: 'Reddettin. Temsilci "cesur" dedi. Hakaret mi övgü mü, belirsiz.', hard: 'Reddettin. Banka bunu kaydetti.' }; } }] },
    { text: { easy: 'Bankadan resmi bir mektup geldi. Zarfın üstünde gülen surat var. Bu iyi mi kötü mü?', hard: 'Bankadan resmi değerlendirme geldi.' },
      opts: [{ label: 'Mektubu aç', run() { if (S.arcScore >= 2) { S.loanBase = Math.round(S.loanBase * .8); return { easy: 'Banka seni "örnek müşteri" ilan etti. Aylık taksitin %20 azaldı.', hard: 'Güvenilir bulundun. Aylık taksit %20 azaldı.' }; } SS.mood(-5); return { easy: 'Mektupta "sizi izliyoruz :)" yazıyor. Moral -5.', hard: 'Değerlendirme olumsuz. Bir sonraki gecikmede tolerans yok. Moral -5.' }; } }] },
  ] },
  { id: 'gusdanger', who: null, title: 'Gus\'un Kantini Tehlikede', steps: [
    { text: { easy: 'İstasyon yönetimi kantine kapatma uyarısı astı: "havalandırma yetersiz". Gus dört koluyla tabelayı tutuyor.', hard: 'Kantine kapatma kararı geldi. Havalandırma eski. Gus\'un tamirciye parası yok.' },
      opts: [{ label: 'Havalandırmayı tamir et (2 saat)', need: () => SS.timeOk(120), run() { SS.passTime(120); S.arcScore++; S.aff.gus = Math.min(100, S.aff.gus + 8); return { easy: 'Havalandırmadan üç fare, bir çorap ve Rex\'in kayıp şapkası çıktı. Artık çalışıyor.', hard: 'Havalandırma çalışıyor. Gus elini omzuna koydu.' }; } },
        { label: 'Vaktim yok', run() { return { easy: 'Gus tabelaya bir sticker yapıştırdı: "Kapalı değiliz (yazıyor ama)."', hard: 'Gus tabelaya baktı ve bir şey demedi.' }; } }] },
    { text: { easy: 'Ceza da gelmiş: ₡200. Gus utanarak soruyor: "Borç verir misin? Güveçle öderim."', hard: 'Gus ₡200 ceza ödemek zorunda. Borç istiyor.' },
      opts: [{ label: 'Borç ver (₡200)', need: () => S.cash >= 200, run() { S.cash -= 200; S.arcScore++; return { easy: 'Gus seni dört koluyla aynı anda kucakladı. Kemiklerin sağlam, çoğunlukla.', hard: 'Gus parayı aldı. "Unutmayacağım."' }; } },
        { label: 'Param yok', run() { return { easy: 'Gus ceza için kantin sandalyelerini sattı. Artık herkes ayakta yiyor.', hard: 'Gus sandalyeleri sattı.' }; } }] },
    { text: { easy: 'Kantin yeniden açılıyor! Gus bir konuşma hazırlamış.', hard: 'Kantin açık kalacak mı? Gus seni çağırıyor.' },
      opts: [{ label: 'Kantine git', run() { if (S.arcScore >= 2) { S.aff.gus = Math.min(100, S.aff.gus + 25); SS.earn(200); SS.mood(12); return { easy: 'Gus borcunu ₡200 olarak geri ödedi ve duvara adını yazdı: "Bu kantin onun sayesinde açık." Moral +12.', hard: 'Kantin açık. Gus borcunu ödedi ve seni masanın başına oturttu. Moral +12.' }; } SS.mood(-5); S.aff.gus = Math.min(100, S.aff.gus + 5); return { easy: 'Kantin açık ama sandalye yok. Gus yine de sana bir güveç verdi. Moral -5.', hard: 'Kantin zor açık kaldı. Gus yorgun. Moral -5.' }; } }] },
  ] },
);

/* =========================================================
   SINAMALAR (+3)
   ========================================================= */
SS.TRIALS.push(
  { id: 'drones', icon: 'ship', title: 'Kaçak dron sürüsü', game: 'shooter', gameName: 'Dronları düşür',
    demand: () => clamp(Math.round((150 + S.day * 6) / 10) * 10, 170, 1000),
    text: { easy: 'Kontrolden çıkmış bir dron sürüsü rıhtımı sardı. Kargo kapaklarını tırmalıyorlar. Biri Pıtırcık\'a âşık oldu.', hard: 'Sahipsiz bir dron sürüsü rıhtıma kilitlendi. Kargo bölmelerini söküyorlar. Güvenlik firması para istiyor.' },
    loseDesc: 'Kargodan parçalar ve para gider, moral düşer',
    lose(T) { const out = [], n = Math.min(S.cargo.length, 4); if (n) { S.cargo.splice(0, n); out.push(`Dronlar kargodan ${n} parça söktü.`); } out.push(`Güvenlik firması faturası: ${fmt(capPay(T.demand * 1.2))}.`); SS.mood(-8); out.push('Moral −8.'); return out; },
    win(T) { const b = Math.round(T.demand * .25); SS.earn(b); S.torps++; SS.mood(6); return [`Düşürdüğün dronların hurdası ${fmt(b)} etti; içlerinden birinde sağlam bir torpido vardı. Moral +6.`]; } },
  { id: 'reactor', icon: 'part', title: 'Reaktör dengesiz', game: 'memory', gameName: 'Reaktörü kalibre et',
    demand: () => clamp(Math.round((130 + S.day * 5) / 10) * 10, 150, 900),
    text: { easy: 'İstasyon reaktörü hıçkırıyor. Işıklar disko modunda. Teknisyenler para istiyor ya da kalibrasyon sırasını kendin girebilirsin.', hard: 'Reaktör dengesiz. Enerji kesintileri başladı. Teknisyen pahalı; sırayı kendin girmeyi deneyebilirsin.' },
    loseDesc: 'Para, enerji ve moral kaybı',
    lose(T) { const out = [`Acil onarım payın: ${fmt(capPay(T.demand * 1.4))}.`]; S.energy = Math.max(0, S.energy - 20); SS.mood(-8); out.push('Kesinti uykunu böldü: enerji −20, moral −8.'); return out; },
    win(T) { SS.earn(Math.round(T.demand * .25)); S.rep.repair = (S.rep.repair || 0) + 1; SS.mood(6); return [`Reaktör dengelendi. Yönetim ${fmt(Math.round(T.demand * .25))} teşekkür ödemesi yaptı; tamir itibarın arttı. Moral +6.`]; } },
  { id: 'collector', icon: 'box', title: 'Tahsildar kapıda', game: 'audit', gameName: 'Hesapları kontrol et', when: () => S.loan > 0,
    demand: () => clamp(Math.round(SS.M().installment * .4 / 10) * 10, 150, 1200),
    text: { easy: 'Tahsildar kapıda, elinde kalın bir dosya: "Hesabınızda bir hata var. Bizim lehimize, tabii." Ya ödersin ya da hesapları satır satır kontrol edersiniz.', hard: 'Tahsildar hesabında eksik ödeme olduğunu iddia ediyor. Ödemezsen kayıtları birlikte kontrol edeceksiniz.' },
    loseDesc: 'Talep gecikmiş borca eklenir, moral düşer',
    lose(T) { const add = Math.round(T.demand * 1.5); S.arrears += add; SS.mood(-8); return [`Tahsildar haklı çıktı: ${fmt(add)} gecikmiş borca eklendi. Gecikmiş borcu Krell ve Banka'dan öde.`, 'Moral −8.']; },
    win() { SS.mood(8); return ['Hata tahsildarın dosyasındaymış. Özür diledi ve dosyasını alıp gitti. Moral +8.']; } },
);

/* =========================================================
   SOHBET SATIRLARI (+2 her tonda) ve HABERLER (+4 her tonda)
   ========================================================= */
const L = SS.NPC_LINES;
L.gus.easy.push('"Bugünün çorbası dünün çorbası. Yarınki de bugünkü olacak. Gelenek."', 'Gus dört koluyla aynı anda dört bardak siliyor: "Verimlilik, kaptan. Krell bile kıskanıyor."');
L.gus.hard.push('"Kolonide de kantinim vardı. Sonra koloni kalmadı. Kantin de."', 'Gus sesini alçaltıyor: "Banka adamları Krell\'den daha kibar. Daha tehlikeli."');
L.vida.easy.push('"YENİ BİR VİDA İCAT ETTİM. ESKİSİNİN AYNISI. AMA YENİ."', '"MOTORUNA ŞARKI SÖYLÜYORUM. DAHA İYİ ÇALIŞIYOR. KANITIM YOK."');
L.vida.hard.push('"BALİNA SAHİPLERİ GELİR, GİDER. GEMİLER KALIR. ÇOĞUNLUKLA."', '"BANKA KREDİSİ Mİ? GEMİYİ KİM TAMİR EDECEK, BANKA MI?"');
L.zara.easy.push('"Bu uydu enkazının içinde bir kuş yuvası var. Fiyata dahil."', '"Rex bugün bana bir taş sattı. Taş. Ben aldım. Ne günlere kaldık."');
L.zara.hard.push('"Fiyatlar yarın düşer. Ya da düşmez. Bilseydim burada olmazdım."', '"Martı\'yla gelenler daha az pazarlık yapar. Sen öyle olma."');
L.rex.easy.push('"Bu hafta seni yeneceğim. Geçen hafta da demiştim. Bu sefer ciddiyim. Biraz."', '"Gemime yeni boya yaptım. Adı \'Rex Kırmızısı\'. Sadece kırmızı."');
L.rex.hard.push('"Bankaya borçlanan Krell\'den kurtulduğunu sanır. Faiz aynı ağırlıkta."', '"Kayıp Yıldız\'a giden üç kişi tanıdım. Biri döndü. Konuşmuyor."');
SS.NEWS.easy.push(
  'Banka yeni kampanya başlattı: "İkinci geminize ilk taksit bizden!" İlk taksit ₡1.',
  'Kumarhanede bir robot slot makinesine evlenme teklif etti. Makine "×0,9" dedi.',
  'Gezgin Martı sahipleri derneği kuruldu. İlk toplantıda kimin daha temiz gemisi olduğu tartışıldı.',
  'Akademi\'nin sınav sorularında yazım hatası bulundu. Hatayı bulan öğrenciye lisans verildi.',
);
SS.NEWS.hard.push(
  'Banka geçen ay dört gemiye el koydu. Biri Demir Balina\'ydı.',
  'Kumarhanede borç batağına düşen bir hurdacı rıhtımdan kayboldu.',
  'Reaktör bakımı ertelendi. Gece kesintileri sürecek.',
  'Akademi burs kontenjanını yarıya indirdi.',
);

/* =========================================================
   GEMİYE GÖRE OYUN SONLARI
   ========================================================= */
Object.assign(SS.ENDINGS, {
  evict_station: {
    easy: 'Borcun yoktu ama kira, rıhtım ve faturalar üst üste bindi. İstasyon yönetimi gemini "geçici olarak" çekti. Geçici kalıcı oldu. Gus sana yol için bir paket güveç verdi.',
    hard: 'Üç ödeme kaçtı. Borcun yoktu ama istasyon affetmez. Gemin çekildi, kapsülün kilitlendi. İlk mekikle istasyondan ayrıldın.',
  },
  repo: {
    marti: {
      easy: 'Banka sonunda Gezgin Martı\'ya el koydu. Haciz memuru deri koltuklara oturup "çok rahatmış" dedi. Pıtırcık memurun ayakkabısına küstü. Yürüyerek değil ama yürüyormuş gibi istasyondan ayrıldın.',
      hard: 'Üçüncü gecikmede banka Gezgin Martı\'yı haczetti. Kayıp Yıldız\'a uçabilecek gemi artık bir kredi kâğıdında satır. Elinde ne varsa bir çantaya sığdı.',
    },
    balina: {
      easy: 'Demir Balina çekiciye bağlandı. O kadar büyük ki üç çekici gerekti. Banka müdürü kaptan şapkanı da istedi. Vermedin. Şapka seninle, Balina onlarla.',
      hard: 'Üç gecikme. Banka Demir Balina\'ya el koydu. Bir hurdacının rüyası bir hacizle bitti. İstasyonun ışıkları arkanda küçülürken Balina hâlâ rıhtımdaydı.',
    },
  },
  bankdue: {
    marti: {
      easy: 'Kredinin süresi doldu. Banka Martı\'yı "kampanyalı fiyatla" satışa çıkardı. Alıcı Rex. Rex el sallıyor.',
      hard: 'Kredi süresi doldu, borç kapanmadı. Banka Martı\'yı aldı ve açık artırmaya koydu. Alıcının kim olduğunu öğrenmek istemedin.',
    },
    balina: {
      easy: 'Süre doldu. Banka Balina\'yı aldı ve kapısına "ŞUBE" tabelası astı. Artık Demir Balina bir banka şubesi. İçinde senin eski ranzan var.',
      hard: 'Süre doldu. Demir Balina bankanın oldu. Yıllarca çalıştığın gemi artık bir bilançoda rakam.',
    },
  },
});
SS.ENDING_TITLES = { evict: 'İstasyondan atıldın', evict_station: 'Gemin çekildi', deadline: 'Süre doldu', repo: 'Banka gemine el koydu', bankdue: 'Kredi süresi doldu' };
SS.endingText = () => { const E = SS.ENDINGS[S.over]; if (!E) return ''; const byShip = E[(SS.SHIPS[S.tier] || {}).id]; return SS.tx(byShip || E); };

})(window.SS);

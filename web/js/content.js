// Space Scrapper — anlatı içeriği: yol arkadaşları, karar anları, gemiler, hikâye bölümleri, kılavuz
(function(SS){

/* ---------- yol arkadaşları ---------- */
SS.COMPANIONS = [
  { id: 'pit', name: 'Pıtırcık', kind: 'Robot gemi kedisi', daily: 5, weekly: 0, weeklyName: '',
    pros: ['Seninle: hurda avında kara kutuların içini gösterir, ayrıştırmada tehlikelileri işaretler', 'Seninle: her iş sonrası moral +3', 'Çalışsın: fare avı, gecede ₡20–40', 'Bağ 60+: her sabah moral +5'],
    cons: ['Her gece şarj ve yağ ister (₡5); şarjsız kalırsa ertesi gün kapalıdır', 'Ara sıra bir şeyleri bozar'],
    work: { name: 'Fare avı', pay: [20, 40] } },
  { id: 'ela', name: 'Ela', kind: '12 yaşındaki kardeşin', daily: 9, weekly: 60, weeklyName: 'Ela\'nın okul ücreti',
    pros: ['Seninle: tamirde +2 ipucu ve +15 saniye', 'Seninle: ayrıştırmada her doğru +₡2', 'Çalışsın: kantinde garsonluk, gecede ₡25–45', 'Bağ 60+: her gece moral +5'],
    cons: ['Her gece yemek (₡9), her hafta okul (₡60)', 'Aç kalırsa hastalanır; ilaçsız 3 gece geçerse yanından alınır', 'Bağ 30 altı: her gece moral -4'],
    work: { name: 'Kantinde garsonluk', pay: [25, 45] } },
  { id: 'tolga', name: 'Tolga', kind: 'Eski mürettebat dostun', daily: 12, weekly: 0, weeklyName: '',
    pros: ['Çalışsın: ayrıştırma vardiyası, gecede ₡70–110', 'Seninle: hurda avında vinç %40 hızlı', 'Seninle: teslimatta +40 yakıt ve daha geniş pist', 'Pazarlıkta Zara daha yüksek fiyata razı olur'],
    cons: ['Her gece yemek (₡12)', 'Riskli planlar önerir; bağı 25\'in altına düşerse gitmek ister'],
    work: { name: 'Ayrıştırma vardiyası', pay: [70, 110] } },
];
// Sabah bülteni için istasyon haberleri
SS.NEWS = {
  easy: ['Krell yeni bir şube açtı. Açılışta kurdeleyi faiziyle kesti.', 'Kantinde "en uzun süre kahve içmeden duran hurdacı" yarışması: kazanan bayıldı.', 'Rex yine "dünyanın en hızlı hurdacısı" olduğunu iddia etti. Kimse sormamıştı.', 'İstasyon yönetimi oksijene "premium hava" seçeneği getirdi. Aynı hava, daha pahalı.', 'Gus menüye yeni bir yemek ekledi: "Dünkü Güveç".', 'Vida Usta tamir ettiği asansöre "Hayatımın Eseri" adını verdi. Asansör ikinci katta takılı.', 'Zara tezgâhına "Pazarlık yapana yüzde sıfır indirim" tabelası astı.', 'Bir hurdacı uzay böceğini evcilleştirdiğini iddia ediyor. Böcek iddiasını yalanladı.'],
  hard: ['Gece vardiyasında bir işçi ayrıştırma bandına sıkıştı. Tesis çalışmaya devam ediyor.', 'Oksijen birim fiyatı bu ay üçüncü kez gözden geçirildi.', 'Krell\'in tahsildarları doğu rıhtımında görüldü. Üç kapsül boşaltıldı.', 'Kolonilerden gelen mülteci gemisi limana alınmadı.', 'Korsan Sektörü\'nde iki hurda gemisi kayıp. Arama yapılmayacak.', 'Klinik ilaç stoklarının azaldığını duyurdu. Fiyatlar yükselebilir.', 'Bir hurdacı borçlarını ödeyemeyince gemisini ateşe verdi.', 'Yönetim, isyan söylentilerine karşı sokağa çıkma saatini erkene aldı.'],
};
SS.TASKS = [
  { id: 'with', name: 'Seninle', desc: 'İşlerinde yardım eder' },
  { id: 'work', name: 'Çalışsın', desc: 'Gece ücret getirir' },
  { id: 'rest', name: 'Dinlensin', desc: 'Bağ ve moral artar' },
];

// Sabah sohbetleri: anlatıcı günün başında konuşur
SS.MORNING = {
  pit: {
    easy: ['Pıtırcık yüzüne bir vida bıraktı. Hediyesi bu. Kabul etmezsen küser.', 'Pıtırcık: "Miyav. Bu bir tehdit değil, sistem güncellemesi."', 'Pıtırcık bütün gece oksijen tüpünün kapağıyla oynamış. Tüp hâlâ çalışıyor. Kapak kayıp.', 'Pıtırcık kokpitte güneşleniyor. Güneş yok. Kendi lambasını açmış.', 'Pıtırcık\'ın ekranında "GÜNAYDIN KAPTAN :3" yazıyor. Bazı harfler ters.'],
    hard: ['Pıtırcık\'ın gözleri karanlıkta yanıp sönüyor. Bütün gece kapıyı izlemiş.', 'Pıtırcık hafifçe tıkırdıyor. Eklemleri paslanıyor ama şikâyet etmiyor.', 'Pıtırcık başını koluna yaslıyor. Sıcaklık sensörü düşük gösteriyor.', 'Pıtırcık bir uyarı sesi çıkarıyor: oksijen yüzde 19. Yüzde 18 olmadan bir şey yapman gerek.', 'Pıtırcık kapının önüne bir fare robotu bırakmış. Ölü. Avcılık içgüdüsü sağlam.'],
  },
  ela: {
    easy: ['Ela kahvaltıda tayın çubuğunu bir roket gibi uçuruyor. Pist senin çayın.', 'Ela: "Bugün büyük hurda bulursan bana da bir parça ayır. Robot yapacağım. Kötü bir robot."', 'Ela okul ödevine "Ablam/Abim uzay hurdacısı, gurur duyuyorum" yazmış. Altına bir kanca çizmiş.', 'Ela, Pıtırcık olmasa bile bir kediye isim bulmuş: "Vidalı". Kedi yok. İsim hazır.', 'Ela: "Krell\'e bir mektup yazdım. Kibar değil."'],
    hard: ['Ela uyandığında yanına geliyor. Bir şey demiyor, sadece elini tutuyor.', 'Ela ayakkabısının tabanını bantlamış. Yenisini istemedi.', 'Ela pencereden koloninin olduğu yöne bakıyor. "Annem orada mı hâlâ?" diye soruyor.', 'Ela yemeğinin yarısını sana bırakmış. "Tokum" diyor. Değil.', 'Ela okul kartını gösteriyor: "Burs için başvurabilirim. Sınavı geçersem."'],
  },
  tolga: {
    easy: ['Tolga konsolun üstünde uyuyor. Ayakları yine radarın üstünde.', 'Tolga: "Bugün şanslı günüm. Hissediyorum. Dün de hissetmiştim, yanılmışım."', 'Tolga kantinden sana kahve getirmiş. Parasını senin hesabına yazdırmış.', 'Tolga bir plan anlatıyor. Plan üç adım. İkinci adım "bir şekilde".', 'Tolga Krell\'in karikatürünü çizmiş. Çok benzemiş. Biraz korkunç.'],
    hard: ['Tolga sabaha kadar uyumamış. Gözleri kan çanağı. "Bir yolunu bulacağız" diyor.', 'Tolga\'nın elleri titriyor. Koloniyi düşünmemeye çalışıyor.', 'Tolga: "Rex dün iki hurdacıyı kaybetmiş. Dikkatli ol bugün."', 'Tolga sessizce ekipmanları kontrol ediyor. Senin yerine.', 'Tolga: "Krell\'e borcumuz bitince ne yapacağız? Hiç düşündün mü?"'],
  },
};

/* ---------- karar anları ---------- */
// run() bir {easy, hard} sonuç metni döndürür; need() false ise seçenek pasif olur
const D = SS.DECISIONS = [];
const has = id => () => SS.hasCrew(id);
D.push({ id: 'crate', title: 'Mühürlü Kasa',
  text: { easy: 'Kargonun dibinde üstünde istasyon damgası olan mühürlü bir kasa buldun. Üstünde "KIRILACAK, AÇMA, CİDDİYİM" yazıyor.', hard: 'Kargoda tanımadığın mühürlü bir kasa var. Üstünde bir istasyon damgası. Birinin kaybı, senin şansın.' },
  opts: [
    { label: 'Sahibine götür (+₡60)', run() { SS.earn(60); S.aff.zara = Math.min(100, S.aff.zara + 10); SS.mood(5); return { easy: 'Sahibi sana ₡60 ve bir sarılma verdi. Sarılmayı satamazsın ama moral +5. Zara duydu, sana daha sıcak bakıyor.', hard: 'Sahibi ₡60 uzattı. Az ama temiz para. Moral +5. Zara bunu duydu.' }; } },
    { label: 'Pazarda sat (riskli)', run() { if (Math.random() < .3 * SS.dv('hazard')) { SS.charge(150); return { easy: 'Kasa bir güvenlik görevlisinin doğum günü hediyesiymiş. Ceza: ₡150. Pasta da ezildi.', hard: 'Kasa takipteymiş. Güvenlik seni buldu. Ceza: ₡150.' }; } SS.earn(260); return { easy: 'Kasadan antika bir kahve makinesi çıktı. Zara ₡260 verdi ve hiç soru sormadı.', hard: 'Kimse sormadı. ₡260 cebinde. Vicdanın sesi de sustu sonunda.' }; } },
  ] });
D.push({ id: 'rexdeal', title: 'Rex\'in Teklifi',
  text: { easy: 'Rex büyük bir enkazın yerini bildiğini söylüyor. Kazancı bölüşmeyi teklif ediyor, önce ₡100 yakıt parası istiyor. Gözleri dürüst görünüyor. Biri yamuk.', hard: 'Rex büyük bir enkazın yerini bildiğini söylüyor. Önce ₡100 yakıt parası istiyor. Rex\'e güvenmek bir kumar.' },
  opts: [
    { label: 'Ortak ol (₡100)', need: () => S.cash >= 100, run() { S.cash -= 100; if (Math.random() < .7) { const n = SS.rint(260, 460); SS.earn(n); S.aff.rex = Math.min(100, S.aff.rex + 10); return { easy: `Enkaz gerçekmiş! Payına ${SS.fmt(n)} düştü. Rex sana sarıldı, sonra utandı.`, hard: `Enkaz gerçekti. Payına ${SS.fmt(n)} düştü. Rex ilk kez sana gülümsedi.` }; } S.aff.rex = Math.max(0, S.aff.rex - 5); return { easy: 'Rex ortadan kayboldu. Bir not bırakmış: "Yakıt bitti, enkaz da yokmuş, özür. Ama yine de ₡100 teşekkürler."', hard: 'Rex ortadan kayboldu. ₡100 de onunla.' }; } },
    { label: 'Reddet', run() { S.aff.rex = Math.max(0, S.aff.rex - 3); return { easy: 'Rex omuz silkti: "Kaybeden sensin." Muhtemelen haklı. Muhtemelen değil.', hard: 'Rex bir şey demeden gitti.' }; } },
  ] });
D.push({ id: 'krelldeal', title: 'Krell\'in Muhasebecisi', when: () => S.lender === 'krell' && S.loan > 1500,
  text: { easy: 'Krell\'in muhasebecisi (üç gözlü, hepsi ciddi) bir teklif getirdi: bugün ₡800 ödersen borcundan ₡1.000 düşülecek.', hard: 'Krell\'in muhasebecisi kapıda. Bugün ₡800 ödersen borcundan ₡1.000 düşecekler. Neden bu kadar cömertler, sormak istemiyorsun.' },
  opts: [
    { label: '₡800 öde, ₡1.000 düşsün', need: () => S.cash >= 800, run() { S.cash -= 800; S.loan = Math.max(0, S.loan - 1000); SS.loanCheck(); return { easy: 'Muhasebeci üç gözüyle de onayladı. Borcun ₡1.000 azaldı.', hard: 'Kâğıtlar imzalandı. Borç ₡1.000 azaldı. Bir yerde bir tuzak var mı, bilmiyorsun.' }; } },
    { label: 'Şimdi olmaz', run() { return { easy: 'Muhasebeci iç çekti, üç kere.', hard: 'Muhasebeci not aldı. Hep not alırlar.' }; } },
  ] });
D.push({ id: 'injured', title: 'Yaralı Hurdacı',
  text: { easy: 'Rıhtımda bir hurdacı kendi kancasına dolanmış. Kliniğe taşımak iki saatini alır.', hard: 'Rıhtımda kanlar içinde bir hurdacı yatıyor. Kimse durmuyor. Onu kliniğe taşımak iki saatini alır.' },
  opts: [
    { label: 'Yardım et (2 saat)', need: () => SS.timeOk(120), run() { SS.passTime(120); SS.mood(10); S.aff.rex = Math.min(100, S.aff.rex + 8); S.karma++; return { easy: 'Hurdacı teşekkür etti ve sana kancasını hediye etmek istedi. Kancası hâlâ ona dolanıktı. Moral +10.', hard: 'Hurdacı yaşayacak. Rex bunu duydu, sana artık farklı bakıyor. Moral +10.' }; } },
    { label: 'Yoluna devam et', run() { SS.mood(-4); return { easy: 'Başkası yardım eder diye düşündün. Etmedi. Moral -4.', hard: 'Arkana bakmadın. Bu gece uyumak zor olacak. Moral -4.' }; } },
  ] });
D.push({ id: 'black', title: 'Kaçak Kristal',
  text: { easy: 'Pelerinli bir yabancı, yarı fiyatına bir enerji kristali satıyor: ₡150. Pelerin çok parlak. Kristal biraz daha az.', hard: 'Karanlık bir köşede bir yabancı yarı fiyatına enerji kristali satıyor: ₡150.' },
  opts: [
    { label: 'Satın al (₡150)', need: () => S.cash >= 150, run() { S.cash -= 150; if (Math.random() < .6 && SS.addCargo('crystal', 330)) return { easy: 'Kristal gerçek çıktı! Kargoda, ışıl ışıl.', hard: 'Kristal gerçek. Kargoya koydun. Yabancı çoktan kaybolmuştu.' }; return { easy: 'Kristal boyanmış bir şeker çıktı. Tadı güzel ama ₡150 etmez.', hard: 'Kristal sahteydi. ₡150 gitti.' }; } },
    { label: 'Uzak dur', run() { return { easy: 'Yabancı başka bir saf arıyor.', hard: 'Akıllıca.' }; } },
  ] });
D.push({ id: 'overtime', title: 'Gece Mesaisi',
  text: { easy: 'Ayrıştırma tesisinin müdürü gece vardiyası için yalvarıyor: ₡120. Yorucu ama para para.', hard: 'Tesis gece vardiyası için adam arıyor: ₡120. Yorucu, sağlığa zararlı.' },
  opts: [
    { label: 'Kabul et (+₡120)', run() { SS.earn(120); S.energy = Math.max(0, S.energy - 25); S.health = Math.max(1, S.health - 5); return { easy: 'Sabaha kadar vida ayırdın. ₡120 kazandın, enerji -25, sağlık -5. Rüyanda bile vida var.', hard: '₡120. Enerji -25, sağlık -5. Ellerin hâlâ titriyor.' }; } },
    { label: 'Reddet', run() { return { easy: 'Müdür ağlayarak başkasını aradı.', hard: 'Başka biri kabul eder. Hep eder.' }; } },
  ] });
D.push({ id: 'charity', title: 'Kreş Bağışı',
  text: { easy: 'İstasyon kreşi oksijen filtresi için bağış topluyor. Çocuklar sana çizdikleri resmi gösteriyor: sen ve kocaman bir kanca.', hard: 'İstasyon kreşinin oksijen filtresi bozuk. Bağış topluyorlar.' },
  opts: [
    { label: 'Bağış yap (₡50)', need: () => S.cash >= 50, run() { S.cash -= 50; SS.mood(8); S.karma++; return { easy: 'Çocuklar sana bir alkış verdi. Moral +8.', hard: 'Filtre değişti. Bir anne sana başını eğdi. Moral +8.' }; } },
    { label: 'Şimdi olmaz', run() { return { easy: 'Çocuklar resmi Rex\'e gösterdi. Rex bağış yaptı. Hmm.', hard: 'Kendi oksijenini zor ödüyorsun.' }; } },
  ] });
// Pıtırcık
D.push({ id: 'pit_mouse', who: 'pit', title: 'Pıtırcık\'ın Avı', when: has('pit'),
  text: { easy: 'Pıtırcık ağzında canlı (!) bir robot fareyle geldi. Fare çok tatlı. Pıtırcık gururlu.', hard: 'Pıtırcık bir robot fare yakalamış. Fare hâlâ çalışıyor. Zara bunlara para veriyor.' },
  opts: [
    { label: 'Fareyi sakla', run() { SS.bond('pit', 10); SS.mood(4); return { easy: 'Fareye "Peynir" adını verdin. Pıtırcık ve Peynir artık arkadaş. Bağ +10.', hard: 'Fareyi bıraktın. Pıtırcık sana uzun uzun baktı. Bağ +10.' }; } },
    { label: 'Zara\'ya sat (+₡90)', run() { SS.earn(90); SS.bond('pit', -8); return { easy: '₡90 aldın. Pıtırcık bir gün boyunca sana sırtını döndü. Bağ -8.', hard: '₡90. Pıtırcık kenara çekildi. Bağ -8.' }; } },
  ] });
D.push({ id: 'pit_battery', who: 'pit', title: 'Şişen Pil', when: has('pit'),
  text: { easy: 'Pıtırcık\'ın pili şişmiş. Artık yuvarlak bir kedi. Daha tatlı ama tehlikeli.', hard: 'Pıtırcık\'ın pili şişmiş. Patlayabilir.' },
  opts: [
    { label: 'Yeni pil al (₡120)', need: () => S.cash >= 120, run() { S.cash -= 120; SS.bond('pit', 6); return { easy: 'Yeni pille Pıtırcık iki kat hızlı mırlıyor. Bağ +6.', hard: 'Pil değişti. Pıtırcık güvende. Bağ +6.' }; } },
    { label: 'Bantla geç', run() { if (Math.random() < .5) { S.crew.pit.down = 3; return { easy: 'Bant tutmadı. Pıtırcık 3 gün şarjda yatacak. Horluyor.', hard: 'Bant tutmadı. Pıtırcık 3 gün çalışamayacak.' }; } return { easy: 'Bant tuttu! Pıtırcık artık bantlı bir kedi. Moda olabilir.', hard: 'Şimdilik tuttu.' }; } },
  ] });
// Ela
D.push({ id: 'ela_trip', who: 'ela', title: 'Okul Gezisi', when: has('ela'),
  text: { easy: 'Ela\'nın sınıfı Satürn halkalarına geziye gidiyor. ₡120. Ela "istemiyorum zaten" diyor ama gözleri başka söylüyor.', hard: 'Ela\'nın sınıfı geziye gidiyor: ₡120. Ela "gerek yok" diyor. Sesi kırık.' },
  opts: [
    { label: 'Gönder (₡120)', need: () => S.cash >= 120, run() { S.cash -= 120; SS.bond('ela', 15); SS.mood(6); return { easy: 'Ela döndüğünde sana halka şeklinde bir taş getirdi. Bağ +15, moral +6.', hard: 'Ela döndüğünde gülümsüyordu. Uzun zamandır görmediğin bir şey. Bağ +15.' }; } },
    { label: 'Bu sefer olmaz', run() { SS.bond('ela', -10); return { easy: 'Ela "zaten Satürn abartılıyor" dedi. Odasına gitti. Bağ -10.', hard: 'Ela bir şey demedi. Demesine gerek yoktu. Bağ -10.' }; } },
  ] });
D.push({ id: 'ela_sick', who: 'ela', title: 'Ela Hasta', when: has('ela'),
  text: { easy: 'Ela\'nın ateşi var. "Uzay gribi" diyor, "ya da sınavdan kaçma gribi."', hard: 'Ela\'nın ateşi yüksek. İstasyonda bu hastalıktan ölen çocuklar oldu.' },
  opts: [
    { label: 'Kliniğe götür (₡80, 2 saat)', need: () => S.cash >= 80 && SS.timeOk(120), run() { S.cash -= 80; SS.passTime(120); SS.bond('ela', 8); return { easy: 'Doktor robot Ela\'ya şeker verdi. İyileşti. Bağ +8.', hard: 'İlaç zamanında geldi. Ela iyileşecek. Bağ +8.' }; } },
    { label: 'Evde dinlensin', run() { if (Math.random() < .6) return { easy: 'Ela bir gün yatıp iyileşti. Sınavı da kaçırdı. Mutlu.', hard: 'Ateşi gece düştü. Şanslıydınız.' }; SS.charge(200); SS.bond('ela', -10); SS.mood(-10); return { easy: 'Ela kötüleşti, gece kliniğe koşturdunuz. Fatura ₡200. Bağ -10.', hard: 'Gece kötüleşti. Acil klinik: ₡200. Ela sana bakmıyor. Bağ -10.' }; } },
  ] });
D.push({ id: 'ela_homework', who: 'ela', title: 'Uzay Mühendisliği Ödevi', when: has('ela'),
  text: { easy: 'Ela\'nın ödevi "kendi uzay gemini tasarla". Senden yardım istiyor. Bir vardiyanı alır.', hard: 'Ela ödevinde takılmış. Burs sınavı yakında. Yardım etmek iki saatini alır.' },
  opts: [
    { label: 'Yardım et (2 saat)', need: () => SS.timeOk(120), run() { SS.passTime(120); SS.bond('ela', 12); SS.mood(5); return { easy: 'Ela\'nın gemisinde sekiz motor, bir kaydırak ve Krell için hapishane var. Bağ +12.', hard: 'Ela konuyu anladı. Gözlerinde umut var. Bağ +12.' }; } },
    { label: 'Kendisi yapsın', run() { SS.bond('ela', -6); return { easy: 'Ela gemiye sadece bir kanca çizdi. "Abla/Abi gibi" yazmış. Bağ -6.', hard: 'Ela sessizce masaya döndü. Bağ -6.' }; } },
  ] });
// Tolga
D.push({ id: 'tolga_gamble', who: 'tolga', title: 'Tolga\'nın Borcu', when: has('tolga'),
  text: { easy: 'Tolga kart masasında ₡150 kaybetmiş. "Teknik olarak kazanıyordum" diyor.', hard: 'Tolga kumarda ₡150 kaybetmiş. Alacaklılar kapıda.' },
  opts: [
    { label: 'Öde (₡150)', need: () => S.cash >= 150, run() { S.cash -= 150; SS.bond('tolga', 15); return { easy: 'Tolga sana sarıldı ve bir daha oynamayacağına söz verdi. Yarın oynayacak. Bağ +15.', hard: 'Tolga başını eğdi. "Ödeyeceğim." Bağ +15.' }; } },
    { label: 'Kendi çözsün', run() { SS.bond('tolga', -15); return { easy: 'Tolga borcunu kantinde bulaşık yıkayarak ödüyor. Gus çok memnun. Tolga değil. Bağ -15.', hard: 'Tolga gece geç döndü. Yüzünde bir morluk var. Bağ -15.' }; } },
  ] });
D.push({ id: 'tolga_scheme', who: 'tolga', title: 'Tolga\'nın Planı', when: () => SS.hasCrew('tolga') && S.lender === 'krell',
  text: { easy: 'Tolga\'nın bir planı var: Krell\'in deposundan yakıt "ödünç" almak. Plan üç adım. İkinci adım "bir şekilde".', hard: 'Tolga Krell\'in yakıt deposuna gece girmeyi öneriyor. Yakalanırsanız bedeli ağır.' },
  opts: [
    { label: 'Katıl', run() { if (Math.random() < .5) { S.fuel = Math.min(SS.tankCap(), S.fuel + 60); SS.bond('tolga', 10); return { easy: '"Bir şekilde" işe yaradı! +60 yakıt. Tolga dans ediyor.', hard: 'Kimse görmedi. +60 yakıt. Tolga ilk kez rahat uyudu.' }; } S.arrears += 300; S.strikes++; SS.bond('tolga', 5); return { easy: 'Krell sizi depoda pijamalarınızla yakaladı. Ceza ₡300 ve bir gecikme sayıldı.', hard: 'Yakalandınız. Krell borcuna ₡300 ekledi ve bir gecikme yazdı.' }; } },
    { label: 'Hayır', run() { SS.bond('tolga', -5); return { easy: 'Tolga planı kâğıt uçak yapıp attı. Bağ -5.', hard: 'Tolga sana korkak dedi. Sonra özür diledi. Bağ -5.' }; } },
  ] });
D.push({ id: 'tolga_leave', who: 'tolga', title: 'Tolga Gitmek İstiyor', urgent: true, when: () => SS.hasCrew('tolga') && S.crew.tolga.bond < 25,
  text: { easy: 'Tolga çantasını toplamış: "Bir maden gemisinde iş buldum. Kalmam için bir sebep ver."', hard: 'Tolga kapının önünde, çantası elinde. "Burada boğuluyorum. Bir sebep ver."' },
  opts: [
    { label: 'Kalmasını iste (₡100 ver)', need: () => S.cash >= 100, run() { S.cash -= 100; SS.bond('tolga', 25); return { easy: 'Tolga çantayı yere bıraktı. "Ama bu son!" Bağ +25.', hard: 'Tolga kaldı. Şimdilik. Bağ +25.' }; } },
    { label: 'Git, şansın açık olsun', run() { SS.leave('tolga'); return { easy: 'Tolga sana bir kart bıraktı: "Borçlarını öde. Benimkileri de." Hane küçüldü, masraflar da.', hard: 'Tolga gitti. Gemi daha sessiz. Masraflar azaldı, yalnızlık arttı.' }; } },
  ] });

/* ---------- gemiler ---------- */
SS.SHIPS = [
  { id: 'pelikan', name: 'Paslı Pelikan', price: 0, trade: 4000, cargo: 20, cargoStep: 10, tank: 50, tankStep: 30, base: { claw: 0, winch: 0, magnet: 0, hull: 0, radar: 0 },
    desc: 'Külüstür ama senin. Çoğunlukla.' },
  { id: 'marti', name: 'Gezgin Martı', price: 22000, trade: 9000, cargo: 35, cargoStep: 12, tank: 90, tankStep: 35, base: { claw: 1, winch: 1, magnet: 0, hull: 1, radar: 0 },
    desc: 'Hızlı, temiz, sızdırmıyor. Kayıp Yıldız\'a kadar uçabilir.' },
  { id: 'balina', name: 'Demir Balina', price: 52000, trade: 20000, cargo: 60, cargoStep: 15, tank: 150, tankStep: 40, base: { claw: 2, winch: 2, magnet: 1, hull: 2, radar: 1 },
    desc: 'Dev ambar, dahili radar. Bir hurdacının rüyası.' },
];
SS.BANK = { interest: .01, rate: .06 }; // banka kredisi: aylık %1 faiz, taksit kredinin %6'sı, süre yok

/* ---------- hikâye bölümleri ---------- */
Object.assign(SS.STORY, {
  intro: {
    title: 'Paslı Pelikan',
    easy: 'Koloni battığında elinde sadece bu gemi kaldı: "Paslı Pelikan". Galaksinin en külüstür hurda gemisi. Parasını da tefeci Krell\'den borç aldın. Krell gülümsüyor. Krell hep gülümsüyor.\n\nPlan basit: hurda topla, sat, borcu öde. Sonra bu tenekeyi satıp gerçek bir gemi al.',
    hard: 'Koloni battığında elinde sadece bu gemi kaldı: "Paslı Pelikan". Onu da Krell\'den aldığın borçla aldın. Oksijen her gün, kira her ay. İstasyon kimseye ikinci şans vermez.\n\nBorcu kapat. Gemiyi sat. Daha iyisini al. Hayatta kal.',
  },
  free: {
    title: 'Krell\'e Elveda',
    easy: 'SON ÖDEME! Krell ağlıyor, sen dans ediyorsun, Gus bedava güveç dağıtıyor. Paslı Pelikan artık tamamen senin.\n\nTersanede bir gemi gözüne çarptı: Gezgin Martı. Pelikan\'ı satıp onu almanın vakti geldi mi?',
    hard: 'Son ödemeyi yaptığında Krell sadece başını salladı. "Bir dahaki sefere." Bir dahaki sefer olmayacak.\n\nTersanede Gezgin Martı duruyor. Pelikan\'ı satarsan ona yaklaşırsın. Belki banka da yardım eder.',
  },
  marti: {
    title: 'Gezgin Martı',
    easy: 'Pelikan\'ı sattın. Yeni sahibi onu "vintage" diye övdü. Gezgin Martı\'nın koltukları deri, kapıları sızdırmıyor, radyosu çalışıyor. Ağlayabilirsin, kimse görmüyor.',
    hard: 'Pelikan\'ı son kez kilitledin. Martı temiz kokuyor. Yeni bir başlangıç. Kayıp Yıldız artık menzilinde.',
  },
  balina: {
    title: 'Demir Balina',
    easy: 'Demir Balina\'nın ambarı o kadar büyük ki içinde kaybolabilirsin. Gus açılış için güveç yaptı, Rex kıskançlıktan mor oldu, Krell tebrik kartı gönderdi (içinde kredi teklifi var).\n\nKoloniden çıktığın o günden bu yana uzun yol geldin. Hikâye burada biter ama hayat devam ediyor. İstediğin kadar oynamaya devam edebilirsin.',
    hard: 'Demir Balina rıhtımda bekliyor. Bir zamanlar kolonideki fabrikanın vinçlerine bakıp hayal ettiğin şey buydu.\n\nBorçsuz, güçlü, ayakta. Hikâye burada biter. Hayat ise sürüyor; istediğin kadar devam edebilirsin.',
  },
});
// Bölümlerde yol arkadaşlarının tepkileri
SS.COMP_STORY = {
  pit: {
    intro: { easy: 'Pıtırcık konsolun üstüne zıplıyor: "Kaptan, ben de borcun bir parçasıyım. Ama sevimli parçası."', hard: 'Pıtırcık ayaklarının dibine kıvrılıyor. Eski kolonide de seninleydi. Şimdi de.' },
    frag1: { easy: 'Pıtırcık kayda kulak kesiliyor: "Bu sesi tanıyorum. Hayır tanımıyorum. Ama heyecanlıyım."', hard: 'Pıtırcık kaydı dinlerken tüyleri (kabloları) diken diken.' },
    frag5: { easy: 'Pıtırcık haritanın üstüne oturdu. Kayıp Yıldız tam kuyruğunun altında.', hard: 'Pıtırcık koordinatları belleğine yazıyor. "Kaybolursak eve dönüş yolunu bilirim."' },
    free: { easy: 'Pıtırcık Krell\'in makbuzunu yırtıp yatağı yaptı.', hard: 'Pıtırcık ilk kez gece boyunca kapıyı izlemedi.' },
    marti: { easy: 'Pıtırcık yeni geminin her köşesine sürtündü. Artık onun.', hard: 'Pıtırcık Pelikan\'ın kapısında bir süre bekledi. Sonra seni takip etti.' },
    balina: { easy: 'Pıtırcık Balina\'nın ambarında kendine bir krallık kurdu.', hard: 'Pıtırcık yeni köprü üstünde, yanında. Hep olduğu gibi.' },
  },
  ela: {
    intro: { easy: 'Ela gemiyi inceliyor: "Burası paslı ama benim odam var mı? Varsa paslı değil."', hard: 'Ela elini sıkıca tutuyor. "Burada mı yaşayacağız?" Evet. Şimdilik.' },
    frag1: { easy: 'Ela: "Hazine mi?! Bana poni alırız. Uzay ponisi."', hard: 'Ela kaydı tekrar tekrar dinliyor. "Ya gerçekse?"' },
    frag5: { easy: 'Ela haritayı okul defterine kopyaladı. Kenarına "KİMSEYE SÖYLEME" yazdı.', hard: 'Ela: "Gidecek misin? Söz ver, döneceksin."' },
    free: { easy: 'Ela Krell\'e yazdığı kaba mektubu nihayet gönderebildi.', hard: 'Ela ilk kez sana borç sormadan yemek yedi.' },
    marti: { easy: 'Ela Martı\'nın kokpitinde fotoğraf çektirdi. Pozu "kaptan".', hard: 'Ela yeni odasının kapısını kapattı ve uzun süre açmadı. Ağladığını duydun. Mutluluktan.' },
    balina: { easy: 'Ela Balina\'yı görünce "ben de büyüyünce bundan alacağım" dedi.', hard: 'Ela burs sınavını kazandı. Ve ablasının/abisinin gemisi bir balina.' },
  },
  tolga: {
    intro: { easy: 'Tolga: "Krell\'e borç mu? Harika. Ben de ona borçluyum. Aile olduk."', hard: 'Tolga gemiyi kontrol ediyor. "Kötü değil. Ölümcül değil. Çoğunlukla."' },
    frag1: { easy: 'Tolga: "Hazine. Ben demiştim. Hiç dememiştim ama demiştim."', hard: 'Tolga kaydı dinleyip sessizleşiyor. "Bu bizi kurtarabilir. Ya da öldürebilir."' },
    frag5: { easy: 'Tolga koordinatları koluna dövme yaptırmak istiyor. Kalemle yazdırdın.', hard: 'Tolga: "Gideceksek beraber gideriz."' },
    free: { easy: 'Tolga, Krell\'in ofisinin önünde zafer dansı yaptı. Güvenlik onu çıkardı.', hard: 'Tolga sana bir içki ısmarladı. Kendi parasıyla. İlk kez.' },
    marti: { easy: 'Tolga Martı\'nın direksiyonunu bırakmıyor. Henüz hareket etmiyorsunuz.', hard: 'Tolga Martı\'nın motorlarını dinledi. "Bu gemi bizi yarı yolda bırakmaz."' },
    balina: { easy: 'Tolga Balina\'ya kendi adını vermek istedi. Reddedildi.', hard: 'Tolga köprüde, yanında. "Koloniden bu yana ilk kez geleceği görebiliyorum."' },
  },
};

/* ---------- kılavuz ---------- */
SS.GUIDE = [
  { id: 'start', title: 'Amaç ve gün akışı', body: `
<p><b>Amaç:</b> Krell'e olan ₡12.000 borcu 196 gün içinde kapat. Sonra Paslı Pelikan'ı satıp Gezgin Martı'yı, en sonunda Demir Balina'yı al. Yol boyunca Halcyon gemisinin kayıp kayıtlarını topla.</p>
<p><b>Gün:</b> Her gün 3 vardiyadan oluşur (Sabah, Öğle, Akşam). İşler, eğitim, sohbet ve kestirme birer vardiya harcar. Üst bardaki 3 kare kalan vardiyaları gösterir.</p>
<p><b>Akşam defteri:</b> <b>Uyu</b>'ya basınca bu gecenin hesabı açılır. Zorunlu kalemler (oksijen, kira, taksit…) otomatik ödenir. Akşam yemeği, ısıtma, arkadaşlarının yemeği ya da şarjı, ilaç ve okul ücreti için ödeyip ödemeyeceğine sen karar verirsin. Her atlanan kalemin bir bedeli vardır.</p>
<p><b>Sabah bülteni:</b> Uyandığında günün manşeti, istasyon haberleri, hanenin durumu, dünkü kararların ve gecenin sonuçları önüne gelir.</p>
<p><b>Kararlar:</b> Bazı sabahlar İstasyon'da bir <b>Karar</b> kartı çıkar. Seçimin para, moral, karakterlerle bağ ve hikâye üzerinde etkili olur. Karar vermezsen gün sonunda kaybolur.</p>` },
  { id: 'stats', title: 'Göstergeler', body: `
<ul>
<li><b>Enerji</b>: Her iş enerji harcar (Hurda Avı 30, Teslimat 20, Tamir 15, Ayrıştırma 10). Uyku, yemek, kahve, enerji içeceği, Oksijen Barı ve kestirme ile dolar. Kondisyon becerisi üst sınırı artırır.</li>
<li><b>Tokluk</b>: Her gece düşer. 25'in altındaysa uyku daha az enerji verir; 12'nin altında sağlığın bozulur. Kantinden yemek al ya da hidroponik bahçe kur.</li>
<li><b>Sağlık</b>: Patlamalar, sert inişler ve hastalıklar düşürür. 0 olursa hastaneye kaldırılır, günü kaybeder ve fatura ödersin. Klinikte iyileşebilirsin.</li>
<li><b>Moral</b>: 70 ve üstündeyse mini oyunlarda +5 saniye kazanırsın; 30'un altındaysa 6 saniye kaybedersin. Sohbet, iyi yemek, Oksijen Barı ve iyi kararlar yükseltir.</li>
</ul>` },
  { id: 'hub', title: 'İstasyon sekmesi', body: `
<p>Günün özeti ve işler burada.</p>
<ul>
<li><b>Anlatıcı ve olay</b>: Yol arkadaşının sabah sözü ve günün rastgele olayı (fiyat patlaması, fırtına, korsan…).</li>
<li><b>Hane</b>: Her yol arkadaşına günlük görev ver: <i>Seninle</i> (işlerinde yardım eder), <i>Çalışsın</i> (gece ücret getirir), <i>Dinlensin</i> (bağ ve moral artar).</li>
<li><b>Günlük hedefler</b>: 3 küçük hedef, her biri para ve moral verir.</li>
<li><b>Yaklaşan ödemeler</b>: Bu gece, bu hafta ve bu ay kesilecek tutarlar.</li>
<li><b>İşler</b>: Dört işin ödülü, riski ve becerisi farklıdır:
  <ul>
  <li><b>Hurda Avı</b>: Sallanan kancayla hurda toplarsın. Para değil <i>mal</i> verir; pazarda satman gerekir. Yakıt harcar. Aynı bölgeye sık dalarsan bölge tükenir (her gece kısmen yenilenir). Aynı gün aynı türden çok satarsan fiyat düşer.</li>
  <li><b>Kargo Teslimatı</b>: İtkiyle yavaşlayıp piste düz inersin. Nakit öder; uzak sefer ve VIP en çok kazandırır, kaza sağlığa mal olur. Pilotluk, İtici ve Jiroskop işe yarar.</li>
  <li><b>Tamir İşi</b>: Kabloları döndürüp akımı lambaya ulaştırırsın. Risksiz nakit. Mühendislik ve Takım Çantası süre ve ipucu verir.</li>
  <li><b>Ayrıştırma Tesisi</b>: Düşen hurdayı doğru kutuya atarsın. Başlamadan önce hangi eşyanın hangi kutuya gittiği gösterilir. Az enerjiyle garanti para.</li>
  <li><b>İtibar</b>: Teslimat, tamir ve ayrıştırmada her başarı itibar kazandırır (0–5). Her seviye ödemeyi %8 artırır; 3. seviyede VIP sefer ve reaktör tamiri açılır.</li>
  </ul></li>
</ul>` },
  { id: 'market', title: 'Pazar sekmesi', body: `
<ul>
<li><b>Fiyatlar</b>: Her kategorinin (metal, parça, mineral, kristal, biyo-numune) günlük fiyat yüzdesi. ▲ yükseliyor, ▼ düşüyor. İyi günü bekleyip satabilirsin.</li>
<li><b>Kargo</b>: Hurda avından getirdiklerin. Tek tek ya da toplu sat. Antik eserler albüme kaydedilir; satsan da kayıt kalır.</li>
<li><b>Doygunluk</b>: Aynı gün aynı kategoriden her satış o kategorinin fiyatını %3 düşürür (en fazla %40). Fiyatlar ertesi gün toparlanır; satışı günlere yay.</li>
<li><b>Pazarlık</b>: Pazarlık becerisi her satışa seviye başına %3 ekler. Günde bir kez Zara'yla tüm kargo için pazarlık edebilirsin. Çok yüksek istersen sabrı tükenir. Pazarlık becerisi ve Tolga yardım eder.</li>
<li><b>Malzeme</b>: Yakıt ve torpido al. Torpido, hurda avında yanlış şeyi tuttuğunda onu patlatıp kancanı hızla geri getirir.</li>
</ul>` },
  { id: 'ship', title: 'Gemi sekmesi', body: `
<ul>
<li><b>Geliştirmeler</b> dört gruptur: <i>Hurda donanımı</i> (kanca, vinç, pençe, radar) sadece hurda avını; <i>Uçuş ve gövde</i> (itici, jiroskop, zırh, tank) teslimatı ve güvenliği; <i>Ambar</i> taşıma kapasitesini; <i>Atölye</i> (takım çantası) tamiri etkiler. Vida Usta ile yakınlaştıkça indirim alırsın.</li>
<li><b>Tersane</b>: Krell borcu bitince eski gemini satıp yenisini alabilirsin. Satış değeri fiyattan düşülür; kalanı nakit ya da banka kredisiyle (aylık %1 faiz, süre yok) ödersin. Yeni gemi daha büyük ambar, daha geniş tank ve hazır geliştirmelerle gelir; geliştirme seviyeleri sıfırlanır.</li>
</ul>` },
  { id: 'life', title: 'Yaşam sekmesi', body: `
<ul>
<li><b>Kantin</b>: Yemekler tokluk ve enerji verir. İçecekler vardiya harcamadan enerji verir (kahve günde 3, enerji içeceği 2, Oksijen Barı 1). <b>Kestirme</b> bir vardiya harcar ama ücretsiz 35 enerji verir.</li>
<li><b>Masalar</b>: Gus, Vida Usta, Zara ve Rex ile sohbet et (1 vardiya). Yakınlık 30 ve 60'ta kalıcı ayrıcalıklar açılır.</li>
<li><b>Kart masası</b>: Yüksek mi alçak mı. Bildikçe pot büyür, istediğin an çekilirsin.</li>
<li><b>Klinik ve Akademi</b>: Sağlık al; Pilotluk, Mühendislik, Pazarlık, Kondisyon becerilerini geliştir.</li>
<li><b>Ev</b>: Kapsülden daireye, sonra eve taşın: uyku daha çok enerji verir, kira artar. Bahçe yemek derdini azaltır, atölye metali parçaya çevirir.</li>
<li><b>İşletme</b>: Drone ve dükkân her gece pasif gelir getirir, aylık bakım ister.</li>
</ul>` },
  { id: 'me', title: 'Kaptan sekmesi', body: `
<ul>
<li><b>Finans</b>: Borç, taksit, faiz ve gecikmiş ödemeler. İstediğin an fazladan ödeme yapabilirsin.</li>
<li><b>Hane</b>: Yol arkadaşlarının bağı, artıları ve eksileri.</li>
<li><b>Hikâye, albüm, başarımlar</b>: Açılan bölümleri tekrar oku, bulduğun eserleri ve başarımları gör.</li>
<li><b>Görünüm</b>: Renk teması, görsel stil, metin tonu ve ses.</li>
</ul>` },
  { id: 'money', title: 'Masraflar ve gecikmeler', body: `
<ul>
<li><b>Her gece</b>: Oksijen ve su (zorunlu); akşam yemeği, ısıtma, arkadaşların yemeği/şarjı ve gerekirse ilaç (senin seçimin).</li>
<li><b>Her 7 günde</b>: Rıhtım ücreti (zorunlu), Ela varsa okul ücreti (seçim).</li>
<li><b>Her 28 günde</b>: Kira, kredi taksiti (₡700), işletme bakımı; borca aylık %2 faiz eklenir.</li>
<li><b>Gecikme</b>: Para yetmezse kalan tutar %10 cezayla <i>gecikmiş borca</i> yazılır ve bir gecikme sayılır. 3 gecikmede oyun biter. Gecikmiş borcu tamamen ödersen sayaç bir azalır.</li>
<li><b>Süre</b>: Krell borcu 196. günün sonunda bitmemişse oyun biter.</li>
</ul>` },
  { id: 'crew', title: 'Yol arkadaşları', body: `
<p>Oyun başında birini, ikisini ya da üçünü seçersin. Daha çok arkadaş daha çok iş gücü ve yardım demek; ama daha çok masraf ve daha çok karar.</p>
<ul>
<li><b>Pıtırcık</b> (robot kedi): Ucuz. Hurda avında kara kutuların içini gösterir. Bazen bir şey bozar.</li>
<li><b>Ela</b> (kardeşin): Tamirde ve ayrıştırmada yardımcı, morali yükseltir. Okul ücreti var, vakit ister.</li>
<li><b>Tolga</b> (eski dostun): En güçlü iş gücü, vinç ve yakıt bonusu. Pahalı ve riskli; bağı düşerse gidebilir.</li>
</ul>
<p><b>Bağ</b> (0–100): Dinlendirmek, birlikte çalışmak ve iyi kararlar artırır; her gece 1 azalır. Düşük bağın bedeli olur.</p>
<p><b>İhtiyaçlar</b>: Her gece akşam defterinde doyurulmaları (Pıtırcık'ın şarj edilmesi) gerekir. İki gece aç kalan hastalanır; hasta ya da kapalı olan yardım etmez ve çalışmaz. İlaçsız üç gece geçerse hane seni terk eder.</p>
<p>Bir arkadaş <i>Seninle</i> görevindeyken yaptığı yardım, mini oyunun üstünde yazar.</p>` },
];

})(window.SS);

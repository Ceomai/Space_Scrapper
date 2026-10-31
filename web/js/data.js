// Space Scrapper — oyun verileri: modlar, eşyalar, bölgeler, geliştirmeler, karakterler, metinler
window.SS = window.SS || {};
(function(SS){

// Herkes için aynı başlangıç kuralları (zorluk ayarı bunları değiştirmez)
SS.RULES = { loan: 12000, interest: .02, installment: 700, deadline: 196, strikesMax: 3 };
// Oyuncunun ayarlayabildiği zorluk: her satırda 3 seçenek
SS.DIFF = [
  { id: 'hazard', name: 'Tehlike',          desc: 'Patlayıcı tank, korsan, kaza ve hastalık sıklığı; hasar miktarı.', opts: [['Az', .6], ['Normal', 1], ['Çok', 1.4]] },
  { id: 'costs',  name: 'Yaşam masrafları', desc: 'Oksijen, rıhtım, kira, yemek ve hane giderleri.',                    opts: [['Düşük', .75], ['Normal', 1], ['Yüksek', 1.35]] },
  { id: 'market', name: 'Pazar fiyatları',  desc: 'Topladığın hurdayı Zara\'ya kaça satabildiğin.',                     opts: [['Cömert', 1.15], ['Normal', 1], ['Cimri', .88]] },
];
SS.TONES = [
  { id: 'fun',  name: 'Esprili', desc: 'Karakterler şakacı, olaylar absürt.',
    sample: 'Krell kapını çaldı, borcunu hatırlattı ve buzdolabındaki pudingini yedi.' },
  { id: 'grim', name: 'Ciddi',   desc: 'Karakterler yorgun, olaylar sert.',
    sample: 'Krell\'in adamları gece geldi. Bir şey söylemediler. Gerek yoktu.' },
];
SS.TONE_NOTE = 'Ton sadece yazıları değiştirir: karakter konuşmaları, olay ve hikâye anlatımı, kararların sonuç metinleri. Kurallar, fiyatlar ve zorluk aynı kalır. Oyun sırasında da değiştirebilirsin.';

// Renk temaları: arayüz renkleri + oyun sahnelerinin paleti
SS.THEMES = [
  { id: 'lavanta', name: 'Lavanta', pal: 'bright', sw: ['#efeafc', '#ff4f9a', '#18b4d1'] },
  { id: 'gece',    name: 'Gece',    pal: 'bright', sw: ['#120d2b', '#ff5fa8', '#3fd0ea'] },
  { id: 'pas',     name: 'Pas',     pal: 'rust',   sw: ['#11100d', '#d9a441', '#7fc9b8'] },
];

// size: kargo birimi, r: çarpışma yarıçapı, wt: ağırlık (çekme hızını böler)
SS.ITEMS = {
  bolts:   { name: 'Vida Yığını',        cat: 'metal',   r: 13, val: 30,  wt: 1.2, size: 1 },
  plate:   { name: 'Metal Levha',        cat: 'metal',   r: 20, val: 80,  wt: 2.2, size: 2 },
  sat:     { name: 'Uydu Enkazı',        cat: 'metal',   r: 34, val: 280, wt: 4.6, size: 4 },
  part:    { name: 'Motor Parçası',      cat: 'part',    r: 16, val: 130, wt: 1.8, size: 2 },
  rock:    { name: 'Küçük Asteroit',     cat: 'mineral', r: 16, val: 12,  wt: 2.6, size: 2 },
  boulder: { name: 'Dev Asteroit',       cat: 'mineral', r: 30, val: 35,  wt: 5.2, size: 4 },
  crystal: { name: 'Enerji Kristali',    cat: 'crystal', r: 11, val: 320, wt: 1,   size: 1 },
  box:     { name: 'Kara Kutu',          cat: null,      r: 16, val: 0,   wt: 1.5, size: 0 },
  bug:     { name: 'Uzay Böceği',        cat: 'bio',     r: 12, val: 25,  wt: 1,   size: 1, move: 1 },
  slime:   { name: 'Kristalli Sümüksü',  cat: 'crystal', r: 16, val: 340, wt: 1.3, size: 1, move: 1 },
  tank:    { name: 'Patlayıcı Tank',     cat: null,      r: 15, val: 0,   wt: 1,   size: 0 },
  relic:   { name: 'Antik Eser',         cat: 'relic',   r: 14, val: 520, wt: 1.6, size: 1 },
  debris:  { name: 'Kömür Olmuş Hurda',  cat: 'metal',   r: 8,  val: 4,   wt: .7,  size: 1 },
};
SS.CATS = { metal: 'Metal', part: 'Parça', mineral: 'Mineral', crystal: 'Kristal', bio: 'Biyo-numune', relic: 'Antika' };

SS.ZONES = [
  { id: 'belt', name: 'Asteroit Kuşağı', fuel: 10, mult: 1, desc: 'Sakin. Bol taş, biraz metal, nadiren kristal.',
    mix: { bolts: 5, plate: 3, sat: 1, part: 1, rock: 5, boulder: 2, crystal: 1, box: 1, bug: 2, tank: 0, slime: 0 }, relics: ['r1', 'r2', 'r3'] },
  { id: 'yard', name: 'Gemi Mezarlığı', fuel: 22, mult: 1.35, desc: 'Batık filolar. Bol metal ve parça, arada patlayıcı tank.',
    mix: { bolts: 4, plate: 4, sat: 2, part: 3, rock: 2, boulder: 1, crystal: 1, box: 2, bug: 1, tank: 1, slime: 0 }, relics: ['r4', 'r5', 'r6'] },
  { id: 'gas', name: 'Gaz Devi Halkası', fuel: 38, mult: 1.7, desc: 'Kristal cenneti. Sümüksüler kristalleri sırtında taşır.',
    mix: { bolts: 2, plate: 2, sat: 1, part: 1, rock: 4, boulder: 2, crystal: 3, box: 2, bug: 2, tank: 1, slime: 2 }, relics: ['r7', 'r8', 'r9'] },
  { id: 'pirate', name: 'Korsan Sektörü', fuel: 60, mult: 2.3, desc: 'Çok zengin, çok tehlikeli. Tanklar her yerde.',
    mix: { bolts: 2, plate: 3, sat: 2, part: 3, rock: 2, boulder: 2, crystal: 3, box: 3, bug: 1, tank: 3, slime: 2 }, relics: ['r10', 'r11', 'r12'] },
  { id: 'lost', name: 'Kayıp Yıldız', fuel: 75, mult: 3.2, desc: 'Halcyon gemisinin enkazı. Efsane gerçekmiş.', story: true,
    mix: { bolts: 2, plate: 2, sat: 3, part: 3, rock: 1, boulder: 1, crystal: 4, box: 3, bug: 0, tank: 2, slime: 2 }, relics: [] },
];

SS.RELICS = {
  r1: { name: 'Paslı Astronot Kaskı', hue: '#c7c9cf' },  r2: { name: 'Eski Dünya Plakası', hue: '#e0b45c' },
  r3: { name: 'Donmuş Çay Bardağı', hue: '#d65a4a' },    r4: { name: 'Kaptan Köşkü Zili', hue: '#e6c25a' },
  r5: { name: 'Kırık Robot Kalbi', hue: '#ff6f91' },     r6: { name: 'İlk Hiper Sürücü Vidası', hue: '#9fd3ff' },
  r7: { name: 'Fırtına İncisi', hue: '#e9e4ff' },        r8: { name: 'Gaz Balinası Dişi', hue: '#f2ead0' },
  r9: { name: 'Halka Pusulası', hue: '#7fe0c9' },        r10: { name: 'Korsan Bayrağı', hue: '#3b3b3b' },
  r11: { name: 'Altın Göz Bandı', hue: '#ffd34d' },      r12: { name: 'Hazine Haritası Parçası', hue: '#d9b77a' },
};

// group: hangi işi etkilediği
SS.SHIP = [
  { id: 'claw',     group: 'scrap',  name: 'Fırlatıcı Kanca', desc: 'Hurda avı: kanca daha hızlı fırlar.',                 costs: [500, 1100, 2200, 4000] },
  { id: 'winch',    group: 'scrap',  name: 'Vinç Motoru',     desc: 'Hurda avı: ağır yükler daha hızlı sarılır.',          costs: [600, 1300, 2600, 4800] },
  { id: 'magnet',   group: 'scrap',  name: 'Manyetik Pençe',  desc: 'Hurda avı: yakalama alanı genişler.',                 costs: [800, 1800, 3400] },
  { id: 'radar',    group: 'scrap',  name: 'Tarayıcı Radar',  desc: 'Hurda avı: kara kutuların içi önceden görünür.',      costs: [1100] },
  { id: 'thruster', group: 'flight', name: 'İtici Motorlar',  desc: 'Teslimat: itki %15 güçlü, yakıt %10 az harcanır (seviye başına).', costs: [450, 1000, 2000] },
  { id: 'gyro',     group: 'flight', name: 'Jiroskop',        desc: 'Teslimat: iniş hızı ve açı toleransı artar.',         costs: [500, 1200] },
  { id: 'hull',     group: 'flight', name: 'Gövde Zırhı',     desc: 'Patlama ve sert inişlerde %20 daha az hasar (seviye başına).', costs: [700, 1600, 3200] },
  { id: 'tank',     group: 'flight', name: 'Yakıt Tankı',     desc: 'Uzak bölgelere ve uzun teslimatlara yeter.',          costs: [500, 1300, 2800] },
  { id: 'cargo',    group: 'cargo',  name: 'Kargo Bölmesi',   desc: 'Ambar büyür, bir dalışta daha çok taşırsın.',         costs: [350, 900, 2000, 4000] },
  { id: 'toolkit',  group: 'tools',  name: 'Takım Çantası',   desc: 'Tamir: seviye başına +1 ipucu ve +8 saniye.',         costs: [400, 900, 1800] },
];
SS.SHIP_GROUPS = [['scrap', 'Hurda donanımı', 'Sadece hurda avını etkiler'], ['flight', 'Uçuş ve gövde', 'Teslimatı ve güvenliği etkiler'], ['cargo', 'Ambar', 'Taşıma kapasitesi'], ['tools', 'Atölye', 'Tamir işlerini etkiler']];
SS.CARGO_CAP = [20, 30, 45, 65, 90];
SS.TANK_CAP = [50, 80, 120, 180];

SS.HOMES = [
  { name: 'Uyku Kapsülü',  sleep: 55,  rent: 1,   morale: -3, cost: 0 },
  { name: 'Küçük Daire',   sleep: 80,  rent: 1.6, morale: 0,  cost: 2500 },
  { name: 'İstasyon Evi',  sleep: 100, rent: 2.4, morale: 4,  cost: 7000 },
];
SS.EXTRAS = [
  { id: 'garden',   name: 'Hidroponik Bahçe', desc: 'Her sabah bedavaya +25 tokluk.',                        cost: 1500, needHome: 1 },
  { id: 'workshop', name: 'Atölye',           desc: 'Metal hurdayı işleyip motor parçasına çevirirsin (x1.8).', cost: 3000, needHome: 1 },
];
SS.BIZ = [
  { id: 'drone', name: 'Toplayıcı Drone', desc: 'Her gece senin yerine hurda toplar.',            cost: 4000,  income: [40, 90],   upkeep: 120 },
  { id: 'shop',  name: 'Hurda Dükkânı',   desc: 'Günlük gelir getirir, satışlarına %10 ekler.',   cost: 12000, income: [150, 320], upkeep: 400 },
];
SS.SKILLS = [
  { id: 'pilot', name: 'Pilotluk',    desc: 'Teslimatta daha çok yakıt, daha toleranslı iniş.' },
  { id: 'eng',   name: 'Mühendislik', desc: 'Tamir işlerinde ek süre ve ipucu hakkı.' },
  { id: 'trade', name: 'Pazarlık',    desc: 'Tüccar daha yüksek fiyata razı olur.' },
  { id: 'fit',   name: 'Kondisyon',   desc: 'Maksimum enerjin 10 artar.' },
];
SS.FOOD = [
  { id: 'ration',  name: 'Tayın Çubuğu',        price: 10, hunger: 35,  morale: 0,  energy: 10 },
  { id: 'meal',    name: 'Sıcak Yemek',         price: 28, hunger: 60,  morale: 6,  energy: 20 },
  { id: 'special', name: 'Gus\'un Özel Güveci', price: 50, hunger: 100, morale: 15, energy: 35 },
];
// Enerji odaklı seçenekler: içecekler (vardiya harcamaz) ve dinlenme
SS.DRINKS = [
  { id: 'coffee', name: 'Kara Delik Kahvesi', price: 6,  energy: 15, health: 0,  morale: 0,  limit: 3, desc: 'Günde en fazla 3 fincan.' },
  { id: 'boost',  name: 'Nebula Enerji İçeceği', price: 20, energy: 30, health: -4, morale: 0, limit: 2, desc: 'Hızlı ama sağlığa zararlı. Günde 2.' },
  { id: 'spa',    name: 'Oksijen Barı',       price: 70, energy: 40, health: 5,  morale: 10, limit: 1, desc: 'Saf oksijen ve masaj koltuğu. Günde 1.' },
];
SS.NAP = { energy: 35, morale: 2 }; // kestirme: 1 vardiya, ücretsiz

SS.NPCS = [
  { id: 'gus',  name: 'Gus',       role: 'Kantin sahibi, dört kollu', perks: [[30, 'Her gün bir bedava tayın'], [60, 'Yarının olayını önceden fısıldar']] },
  { id: 'vida', name: 'Vida Usta', role: 'Tamirci robot',              perks: [[30, 'Gemi geliştirmelerinde %10 indirim'], [60, 'İndirim %20 olur']] },
  { id: 'zara', name: 'Zara',      role: 'Hurda tüccarı',              perks: [[30, 'Satışlarda +%5'], [60, 'Satışlarda +%10']] },
  { id: 'rex',  name: 'Rex',       role: 'Rakip hurdacı',              perks: [[30, 'Pazar fiyatları için ipucu verir'], [60, 'Bir kara kutu parçası hediye eder']] },
];

SS.NPC_LINES = {
  gus: {
    easy: ['"Dört kolum var ama hepsi bulaşık yıkıyor. Hayat bu." diyor Gus.', '"Güveci yiyen ağlıyor. Mutluluktan. Çoğunlukla." diye göz kırpıyor.', '"Krell mi? Geçen hafta kaşığımı borç aldı. Hâlâ faiz ödüyorum."'],
    hard: ['Gus bardağı silmeyi bırakmıyor. "Burada herkes bir şeye borçlu, kaptan."', '"Geçen ay üç hurdacı gitti. Biri geri döndü. Yarısı."', '"Ye. Aç karnına karar veren adam ölü adamdır."'],
  },
  vida: {
    easy: ['Vida Usta bip bip ediyor: "GEMİN BİR SANAT ESERİ. MODERN SANAT. KİMSE ANLAMIYOR."', '"VİDALARINI SAYDIM. ÜÇÜ EKSİK. BİRİ CEBİNDE."', '"BEN DE BİR ZAMANLAR HURDAYDIM. ŞİMDİ HURDA TAMİR EDİYORUM. ÇEMBER TAMAMLANDI."'],
    hard: ['Vida Usta\'nın gözü titriyor. "PARÇA YOK. PARA VAR MI? O DA YOK."', '"GÖVDEN İNCE. BİR PATLAMA DAHA, SONRA SESSİZLİK."', '"ESKİ SAHİBİMİ KRELL ALDI. BENİ İSTEMEDİ. ŞANSLIYIM."'],
  },
  zara: {
    easy: ['Zara gözlüğünü indiriyor: "Bu vida antika mı yoksa sadece paslı mı? İkisi de satar."', '"Bugün kristal fiyatları uçuyor. Ya da ben öyle söylüyorum."', '"Pazarlık sanattır. Ben Picasso\'yum, sen de... boya."'],
    hard: ['"Fiyat bu. Beğenmezsen Krell\'e sat."', 'Zara teraziyi parmağıyla bastırıyor. Fark etmemiş gibi yapıyorsun.', '"Herkes hayatta kalmaya çalışıyor. Ben biraz daha iyi kalıyorum."'],
  },
  rex: {
    easy: ['Rex sırıtıyor: "En iyi hurdayı ben buldum. Sana da bir vida bıraktım. Rica ederim."', '"Gemin o kadar yavaş ki dün çıktığını bugün gördüm."', '"Bir gün beraber çalışırız. Sen taşırsın, ben izlerim."'],
    hard: ['Rex sana bakmadan konuşuyor: "Gemi Mezarlığı\'nda iki kişi kaybettik. Sen olma üçüncü."', '"Krell\'e iki ay borçlu kaldım. Bir parmağım daha az. Şaka değil."', '"Kara kutular... bazıları konuşuyor. Dinleme demem gerekir ama dinle."'],
  },
};

SS.KRELL = {
  easy: [
    'Krell kapını çaldı, borcunu hatırlattı ve buzdolabındaki pudingini yedi.',
    'Krell bir bayram kartı bıraktı: "Paramı özledim."',
  ],
  hard: [
    'Krell\'in adamları gece geldi. Bir şey söylemediler. Gerek yoktu.',
    'Kapının önünde kırık bir kask var. Krell mesaj vermeyi sever.',
  ],
};

SS.STORY = {
  intro: {
    title: 'Paslı Pelikan',
    easy: 'Tebrikler! Galaksinin en külüstür hurda gemisi "Paslı Pelikan" artık senin. Tek bir küçük sorun var: parasını tefeci Krell\'den borç aldın. Krell gülümsüyor. Krell hep gülümsüyor.\n\nHurda topla, sat, borcunu öde. Belki bir gün yatağın bir dolap kadar geniş olur.',
    hard: 'Kolonin battığında elinde sadece bu gemi kaldı: "Paslı Pelikan". Onu da Krell\'den aldığın borçla aldın. Oksijen her gün, kira her ay. İstasyon kimseye ikinci şans vermez.',
  },
  frag1: {
    title: 'Fısıldayan Kutu',
    easy: 'Kara kutudan bir ses kaydı çıktı: "...Halcyon... hazine bölmesi... kimse bulmasın..." Sonra biri hapşırıyor. Gizemli. Ve biraz da iğrenç.',
    hard: 'Kara kutudaki kayıt cızırdıyor: "Halcyon\'dan herkese... hazine bölmesi mühürlendi... rotayı beş parçaya böldük..." Ardından uzun bir sessizlik ve nefes sesi.',
  },
  frag3: {
    title: 'Halcyon\'un İzi',
    easy: 'Üç parça birleşti! Halcyon, yüz yıl önce kaybolan bir zengin yatıymış. Kaptanı, kedisine gömülü hazinenin yerini söylemiş. Kedi kimseye söylememiş.',
    hard: 'Üç parça. Halcyon bir kaçakçı gemisiymiş, mürettebatı birbirini hazine için öldürmüş. Son kayıtta bir kadın rotayı parçalara bölüp boşluğa atıyor.',
  },
  frag5: {
    title: 'Kayıp Yıldız',
    easy: 'Beş parça tamam! Koordinatlar ortaya çıktı: Kayıp Yıldız. Yakıtını doldur, kancanı yağla, kedi maması al. Ne olur ne olmaz.',
    hard: 'Beş parça. Koordinatlar net: Kayıp Yıldız. Oraya gidenlerin dönmediği söylenir. Ama sen zaten batıyorsun. Kaybedecek ne kaldı?',
  },
  lost: {
    title: 'Halcyon\'un Enkazı',
    easy: 'Halcyon karşında! Gövdesinde dev harflerle "BURADA HAZİNE YOK" yazıyor. Bu kesin hazine var demek.',
    hard: 'Halcyon karanlıkta asılı duruyor. Kapakları açık, kokpitte hâlâ birileri oturuyor. Sessizce çalışmaya başlıyorsun.',
  },
  free: {
    title: 'Özgür Kaptan',
    easy: 'BORÇ BİTTİ! Krell ağlıyor, sen dans ediyorsun, Gus bedava güveç dağıtıyor. Paslı Pelikan artık tamamen senin. Oyuna devam edebilirsin; artık her kredi senin.',
    hard: 'Son ödemeyi yaptığında Krell sadece başını sallıyor. "Bir dahaki sefere." Bir dahaki sefer olmayacak. Pelikan senin. Hayattasın. Devam et; bu istasyonda zenginlik tek kalkandır.',
  },
};

SS.ENDINGS = {
  evict: {
    easy: 'Krell sonunda sabrını kaybetti. Paslı Pelikan\'ı bir kurdeleyle bağladı, kapsülünü de kendi kedisine verdi. Seni istasyondan çıkan ilk mekiğe bindirdiler. Mekik müziği bile kötüydü.',
    hard: 'Üçüncü gecikme. Krell\'in adamları gece geldi. Paslı Pelikan bağlandı, kapsülün boşaltıldı. Seni bir kargo gemisine koyup istasyondan uzaklaştırdılar.',
  },
  deadline: {
    easy: 'Süre doldu. Krell bir pasta getirdi, üstünde "Gemi artık benim" yazıyordu. Pasta güzeldi. Haber değil.',
    hard: 'Süre doldu, borç hâlâ duruyor. Krell sözleşmeyi çerçevelemiş: "Gemi benim, sen de bana çalışacaksın." Hurdacılık burada bitiyor.',
  },
};

// Mod paletleri: oyun sahneleri ve piksel nicelemesi bunları kullanır
SS.PAL = {
  bright: {
    space0: '#140c35', space1: '#3a1f6e', star: '#fff1e8', neb1: 'rgba(255,119,168,.28)', neb2: 'rgba(41,173,255,.22)',
    metal: '#c2c3c7', metalD: '#5f6b8a', metalL: '#fff1e8', crystal: '#5ef0ff', crystal2: '#ff77a8',
    rock: '#ab7a5a', rockD: '#5f4436', box: '#ffa300', boxD: '#ab5236', bug: '#00e436', bugD: '#008751',
    slime: '#c17bff', slimeD: '#83479f', tank: '#ff004d', tankD: '#7e2553', warn: '#ffec27',
    hull: '#ff8a3d', hullD: '#ab5236', hull2: '#ffccaa', glass: '#7ef3ff', rope: '#fff1e8', text: '#fff1e8',
    accent: '#ffec27', good: '#00e436', bad: '#ff004d', flame: '#ffa300', ground: '#83769c', groundD: '#5a4f78', pad: '#00e436',
    ui: '#1d2b53',
  },
  rust: {
    space0: '#070807', space1: '#1a1813', star: '#a9a28a', neb1: 'rgba(122,42,34,.22)', neb2: 'rgba(63,92,82,.18)',
    metal: '#8d8f87', metalD: '#43413a', metalL: '#c9c2a8', crystal: '#7fc9b8', crystal2: '#b35a4a',
    rock: '#5f5548', rockD: '#2e2a22', box: '#b4782f', boxD: '#5e3c19', bug: '#7c9a4e', bugD: '#3f5c32',
    slime: '#7a5a86', slimeD: '#463352', tank: '#c0392b', tankD: '#7a2a22', warn: '#d9a441',
    hull: '#7a6a55', hullD: '#433d31', hull2: '#b9ab8f', glass: '#6f9c8f', rope: '#c9c2a8', text: '#e6dfc8',
    accent: '#d9a441', good: '#8db255', bad: '#c0392b', flame: '#d98c2b', ground: '#433d31', groundD: '#2e2a22', pad: '#8db255',
    ui: '#1d1a14',
  },
};
// Piksel stilin sınırlı renk paleti (her mod için ayrı)
SS.PIXPAL = {
  bright: ['#000000', '#140c35', '#1d2b53', '#3a1f6e', '#7e2553', '#008751', '#ab5236', '#5f574f', '#5f6b8a', '#83769c', '#c2c3c7', '#fff1e8',
    '#ff004d', '#ffa300', '#ffec27', '#00e436', '#29adff', '#5ef0ff', '#ff77a8', '#ffccaa', '#c17bff', '#83479f', '#ab7a5a', '#5f4436', '#ff8a3d', '#5a4f78'],
  rust: ['#070807', '#1a1813', '#2e2a22', '#433d31', '#5f5548', '#7a6a55', '#8d8f87', '#b9ab8f', '#c9c2a8', '#e6dfc8', '#7a2a22', '#c0392b',
    '#5e3c19', '#b4782f', '#d98c2b', '#d9a441', '#3f5c52', '#6f9c8f', '#7fc9b8', '#3f5c32', '#7c9a4e', '#8db255', '#463352', '#7a5a86', '#b35a4a', '#43413a'],
};

})(window.SS);

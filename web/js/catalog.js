// Space Scrapper — dünya kataloğu: harita, iş havuzları, pazar ürünleri, satıcılar, dekor, yetenekler, rütbeler
(function(SS){

/* ---------- harita ---------- */
// x, y: haritada 0–1 konum; open: açılış–kapanış saati (24+ = gece yarısından sonra)
SS.LOCS = [
  { id: 'home',    code: 'H-01', name: 'Yaşam Modülü',      sub: 'Ev, hane, dekor, uyku',                 x: 0.2,  y: 0.66, open: [0, 26] },
  { id: 'jobs',    code: 'İ-04', name: 'İş Merkezi',        sub: 'Hurda sözleşmeleri ve lisanslı işler',   x: 0.5, y: 0.12, open: [6, 25] },
  { id: 'hangar',  code: 'R-07', name: 'Rıhtım ve Hangar',  sub: 'Gemi, geliştirme, tersane, hurda avı',   x: 0.84, y: 0.56, open: [0, 26] },
  { id: 'market',  code: 'P-02', name: 'Pazar Halkası',     sub: 'Zara, günlük stok, seyyar satıcılar',    x: 0.42, y: 0.8, open: [8, 22] },
  { id: 'cantina', code: 'K-03', name: 'Gus\'un Kantini',   sub: 'Yemek, içecek, sohbet',                  x: 0.16, y: 0.4, open: [7, 26] },
  { id: 'clinic',  code: 'S-05', name: 'Klinik',            sub: 'Tedavi, aşı, kontrol',                   x: 0.84, y: 0.1, open: [8, 20] },
  { id: 'krell',   code: 'F-06', name: 'Krell ve Banka',    sub: 'Borç, taksit, gecikmiş ödemeler',        x: 0.16, y: 0.1, open: [9, 18] },
  { id: 'academy', code: 'A-08', name: 'Akademi',           sub: 'Lisanslar, beceri eğitimi, sınavlar',    x: 0.85, y: 0.33, open: [8, 21] },
  { id: 'casino',  code: 'Q-09', name: 'Nebula Kumarhanesi', sub: 'Kartlar, çark, zar, yarış, slot',       x: 0.77, y: 0.8, open: [14, 26] },
];
SS.LOG_LOC = { id: 'log', name: 'Seyir Defteri', sub: 'Kaptan, hikâye, albüm, ayarlar' };

/* ---------- iş havuzları ---------- */
SS.CLIENTS = ['Ay Madencileri Birliği', 'Dr. Selin Arat', 'Neon Kumarhane', 'Tetra Hastanesi', 'Kuyrukluyıldız Çiftliği', 'Bay Okuyan', 'Halka Postası', 'Buz Kırıcılar Kooperatifi', 'Kaptan Yıldırım', 'Mavi Nebula Oteli', 'Krell\'in yeğeni', 'Rıhtım İdaresi', 'Profesör Gök', 'Satürn Fırını', 'Orbital Okulu', 'Sarı Kask Ekibi', 'Hacer Teyze', 'Vega Müzesi', 'Kayıp Eşya Bürosu', 'Titan Su Şirketi', 'Galaktik Sirk', 'Leyla Hanım', 'Kızıl Gezegen Postası', 'Zirve Madencilik', 'Asteroit Belediyesi', 'Gece Pazarı Derneği', 'Kozmik Kafe', 'Ateş Böceği Turizm', 'Yıldız Tozu Atölyesi', 'Bilinmeyen gönderici'];
SS.DESTS = ['Ay Üssü Tetra', 'Buz Madeni K-9', 'Çiftlik Uydusu Bereket', 'Kayalık Karakol', 'Neon Kumarhane', 'Hastane Gemisi Şifa', 'Kuyrukluyıldız Kampı', 'Titan İskelesi', 'Halka Köyü', 'Gözlemevi Vega', 'Ceres Garnizonu', 'Kızıl Vadi Kolonisi', 'Sessiz Liman', 'Kristal Mağarası', 'Eski Fabrika 9', 'Yüzen Pazar', 'Mavi Nebula Oteli', 'Kuzey Kutbu Üssü', 'Sürgün Adası', 'Demir Köprü', 'Volkan Gözetleme', 'Okyanus Ayı Europa', 'Kervan Durağı', 'Son Durak'];
SS.CARGOS = [
  ['tıbbi malzeme', 'fragile'], ['dondurulmuş pizza', 'cold'], ['yedek reaktör', 'heavy'], ['canlı uzay tavuğu', 'live'], ['gizli paket', 'secret'], ['düğün pastası', 'fragile'],
  ['maden matkabı', 'heavy'], ['aşı kutuları', 'cold'], ['antika piyano', 'fragile'], ['hidroponik fideler', 'live'], ['su arıtma filtresi', ''], ['okul kitapları', ''],
  ['oksijen tüpleri', 'heavy'], ['kristal avize', 'fragile'], ['yaz kampı malzemesi', ''], ['arı kovanı', 'live'], ['radyo vericisi', ''], ['doğum günü hediyeleri', ''],
  ['yedek kalp pili', 'fragile'], ['buz heykeli', 'cold'], ['robot köpek', 'live'], ['güneş paneli', 'heavy'], ['mektup çuvalı', ''], ['tüp bebek kuluçkası', 'fragile'],
  ['patlayıcı numune', 'secret'], ['kahve çekirdeği', ''], ['çikolata stoğu', 'cold'], ['emekli astronot', 'live'], ['tarihi belgeler', 'fragile'], ['kayıp kedi', 'live'],
];
SS.REPAIR_OBJ = ['Oksijen pompası', 'Asansör kontrol kartı', 'Kantin buzdolabı', 'Rıhtım kapısı', 'Su arıtıcı', 'Radyo vericisi', 'Yerçekimi jeneratörü', 'Okul projektörü', 'Sera ışıkları', 'Klinik monitörü',
  'Kumarhane slot makinesi', 'Hava kilidi sensörü', 'Bant motoru', 'Robot garson', 'Uydu anteni', 'Isı eşanjörü', 'Fırın termostatı', 'Güvenlik kamerası', 'Çamaşır robotu', 'Navigasyon çipi',
  'Müzik kutusu', 'Akvaryum filtresi', 'Kargo vinci', 'Gözlemevi teleskopu', 'Sokak lambası', 'Sinema projektörü', 'Kapı kilidi', 'Çocuk parkı salıncağı', 'Acil durum sireni', 'Bebek monitörü'];
SS.DELIVERY_MODS = [
  { id: 'rush',   name: 'Acil',            pay: 1.4,  desc: 'Müşteri bekliyor, ödeme %40 fazla.' },
  { id: 'heavy',  name: 'Ağır yük',        pay: 1.2,  grav: .004, desc: 'Gemi daha hızlı düşer.' },
  { id: 'windy',  name: 'Fırtınalı iniş',  pay: 1.25, wind: true, desc: 'Yanal rüzgâr var.' },
  { id: 'tip',    name: 'Bahşişçi müşteri', pay: 1,   tip: true, desc: 'Yumuşak inişe bahşiş verir.' },
  { id: 'narrow', name: 'Dar pist',        pay: 1.3,  pad: -14, desc: 'Pist normalden dar.' },
];
SS.REPAIR_MODS = [
  { id: 'nohint', name: 'İpucu yok',     pay: 1.3,  nohint: true, desc: 'İpucu hakkın kullanılamaz.' },
  { id: 'rush',   name: 'Acil arıza',    pay: 1.25, time: -12, desc: 'Süre 12 saniye kısa.' },
  { id: 'loyal',  name: 'Sadık müşteri', pay: 1.1,  aff: 'vida', desc: 'Vida Usta\'nın müşterisi, yakınlık +5.' },
];
SS.SORT_VARIANTS = [
  { id: 'std',   name: 'Standart bant',   mix: null,  speed: 1,    bonus: 0, desc: 'Her türden hurda.' },
  { id: 'rad',   name: 'Radyoaktif gün',  mix: 2,     speed: 1.05, bonus: 3, desc: 'Tehlikeli madde ağırlıklı, doğru başına +₡3.' },
  { id: 'bio',   name: 'Organik hafta',   mix: 1,     speed: .95,  bonus: 1, desc: 'Organik ağırlıklı, sakin bant.' },
  { id: 'fast',  name: 'Hızlı bant',      mix: null,  speed: 1.4,  bonus: 4, desc: 'Bant çok hızlı, doğru başına +₡4.' },
];
SS.ORDER_BUYERS = ['Zara\'nın kuzeni', 'Vega Müzesi', 'Titan Su Şirketi', 'Yıldız Tozu Atölyesi', 'Kayalık Karakol kantini', 'Bir koleksiyoncu', 'Rıhtım İdaresi', 'Profesör Gök', 'Galaktik Sirk', 'Kozmik Kafe'];
// İlan metinleri: {c}=müşteri, {d}=varış, {g}=kargo, {o}=nesne
SS.JOB_LINES = {
  deliver: {
    easy: ['{c}, {d}\'ya {g} yolluyor. "Dikkatli ol" dedi, üç kez.', '{g} {d}\'ya gidecek. {c} paketin üstüne "ACELE YOK (VAR)" yazmış.', '{c}: "{g} sağ salim {d}\'ya ulaşırsa sana bir kartpostal atarız."', '{d}\'da biri {g} bekliyor. Bekleyen kişi biraz sabırsız.'],
    hard: ['{c} için {d}\'ya {g}. Soru sorma.', '{g}, {d}\'ya. Geç kalırsan bir sonraki işi başkası alır.', '{c}: "{g} {d}\'ya ulaşmazsa ödeme yok."', '{d} yolu tehlikeli. {g} taşıyacak kimse bulunamadı.'],
  },
  repair: {
    easy: ['{c}\'nin {o} yine bozuldu. Ağlamaklı bir mesaj bıraktılar.', '{o} kendi kendine konuşmaya başlamış. {c} tamir istiyor, konuşma kalabilir.', '{c}: "{o} tamir olursa sana dondurma."', '{o} kıvılcım saçıyor. {c} bunu "parti modu" sanmış.'],
    hard: ['{c}\'nin {o} çalışmıyor. Bugün düzelmezse insanlar zarar görecek.', '{o} arızalı. {c} bekleyecek vakti olmadığını söylüyor.', '{c} için {o}. Ücret peşin değil.', '{o} çöktü. Yedek parça yok, sadece sen varsın.'],
  },
  hunt: {
    easy: ['{c}, {d} bölgesinde {g} arıyor. "Gerisi senin olsun, biz cimri değiliz. Biraz cimriyiz."', '{d}\'da {g} varmış. {c} birinin gidip getirmesini istiyor, tercihen sen.', '{c}: "{g} getirene ödül! Ödül para. Ve bir teşekkür. Çoğunlukla para."'],
    hard: ['{c}, {d} bölgesinden {g} istiyor. Geri kalan hurda senin.', '{d}\'da {g} bekliyor. {c} teslimde öder, fazlasını sorma.', '{c} için {d}\'ya git, {g} topla. Yakıt senden.'],
  },
  sort: {
    easy: ['Tesis müdürü kahvesini döktü, bant durmuyor. Yardım lazım.', 'Bant bugün "ilginç" şeyler taşıyor. Müdür detay vermedi.'],
    hard: ['Dün bir işçi yaralandı. Bant yine de çalışıyor.', 'Tesis eksik eleman çalışıyor. Ödeme gün sonu.'],
  },
};

/* ---------- pazar ---------- */
// use: eat (hemen tüketilir), inv (envantere), buff (sıradaki işe etki), decor (eve), gift (birine hediye)
SS.GOODS = [
  // sabit ürünler
  { id: 'ration',   name: 'Tayın Çubuğu',        cat: 'Yemek',  price: 10, use: 'eat', fx: { hunger: 35, energy: 10 }, staple: true },
  { id: 'coffee',   name: 'Kara Delik Kahvesi',  cat: 'İçecek', price: 8,  use: 'eat', fx: { energy: 15 }, staple: true },
  { id: 'medkit',   name: 'İlaç Kutusu',         cat: 'Sağlık', price: 40, use: 'inv', desc: 'Hasta bir hane üyesini iyileştirir.', staple: true },
  { id: 'bandage',  name: 'Bandaj Seti',         cat: 'Sağlık', price: 30, use: 'inv', fx: { health: 20 }, desc: 'Sağlık +20, istediğin an kullan.', staple: true },
  { id: 'torp',     name: 'Torpido',             cat: 'Gemi',   price: 70, use: 'torp', desc: 'Hurda avında yanlış yükü patlatır.', staple: true },
  // dönen yiyecek ve içecekler
  { id: 'soup',     name: 'Mercimek Çorbası',    cat: 'Yemek',  price: 18, use: 'eat', fx: { hunger: 45, energy: 12, morale: 3 } },
  { id: 'sandwich', name: 'Kuşak Sandviçi',      cat: 'Yemek',  price: 22, use: 'eat', fx: { hunger: 50, energy: 15 } },
  { id: 'noodle',   name: 'Uzay Eriştesi',       cat: 'Yemek',  price: 16, use: 'eat', fx: { hunger: 40, energy: 14 } },
  { id: 'kebab',    name: 'Asteroit Kebabı',     cat: 'Yemek',  price: 38, use: 'eat', fx: { hunger: 75, energy: 20, morale: 6 } },
  { id: 'fruit',    name: 'Hidroponik Meyve',    cat: 'Yemek',  price: 14, use: 'eat', fx: { hunger: 20, health: 4, morale: 2 } },
  { id: 'pastry',   name: 'Satürn Böreği',       cat: 'Yemek',  price: 20, use: 'eat', fx: { hunger: 40, morale: 5 } },
  { id: 'tea',      name: 'Nebula Çayı',         cat: 'İçecek', price: 6,  use: 'eat', fx: { energy: 8, morale: 3 } },
  { id: 'boost',    name: 'Süpernova Enerji',    cat: 'İçecek', price: 22, use: 'eat', fx: { energy: 30, health: -4 } },
  { id: 'cocoa',    name: 'Sıcak Kakao',         cat: 'İçecek', price: 12, use: 'eat', fx: { energy: 10, morale: 6 } },
  { id: 'vitamin',  name: 'Vitamin Kapsülü',     cat: 'Sağlık', price: 26, use: 'eat', fx: { health: 10, energy: 8 } },
  { id: 'calm',     name: 'Sakinleştirici Şurup', cat: 'Sağlık', price: 30, use: 'eat', fx: { morale: 14, energy: -5 } },
  // gemi sarf malzemeleri (sıradaki işe etki eder)
  { id: 'clawoil',  name: 'Kanca Yağı',          cat: 'Gemi',   price: 45, use: 'buff', desc: 'Sıradaki hurda avında kanca +1 seviye hızlı.' },
  { id: 'sensor',   name: 'Sensör Pili',         cat: 'Gemi',   price: 55, use: 'buff', desc: 'Sıradaki hurda avında kara kutuların içi görünür.' },
  { id: 'bait',     name: 'Sümüksü Yemi',        cat: 'Gemi',   price: 60, use: 'buff', desc: 'Sıradaki hurda avında +2 kristalli sümüksü.' },
  { id: 'shield',   name: 'Kalkan Jeli',         cat: 'Gemi',   price: 50, use: 'buff', desc: 'Sıradaki teslimatta kaza hasarı yarıya iner.' },
  { id: 'solder',   name: 'Lehim Seti',          cat: 'Gemi',   price: 40, use: 'buff', desc: 'Sıradaki tamirde +2 ipucu.' },
  { id: 'gloves',   name: 'Ayrıştırma Eldiveni', cat: 'Gemi',   price: 35, use: 'buff', desc: 'Sıradaki ayrıştırmada yanlışlar ceza vermez.' },
  { id: 'fuelcan',  name: 'Yedek Yakıt Bidonu',  cat: 'Gemi',   price: 70, use: 'fuel', desc: '+30 yakıt.' },
  // hediyeler
  { id: 'book',     name: 'Bilim Kitabı',        cat: 'Hediye', price: 45, use: 'gift', target: 'ela',   desc: 'Ela\'ya: bağ +15.' },
  { id: 'laser',    name: 'Lazer Fare',          cat: 'Hediye', price: 35, use: 'gift', target: 'pit',   desc: 'Pıtırcık\'a: bağ +15.' },
  { id: 'deck',     name: 'Altın Kenarlı Deste', cat: 'Hediye', price: 50, use: 'gift', target: 'tolga', desc: 'Tolga\'ya: bağ +15.' },
  { id: 'choco',    name: 'Titan Çikolatası',    cat: 'Hediye', price: 25, use: 'gift', target: 'any',   desc: 'Herhangi birine: bağ +8.' },
  { id: 'kite',     name: 'Güneş Uçurtması',     cat: 'Hediye', price: 40, use: 'gift', target: 'ela',   desc: 'Ela\'ya: bağ +12, moral +4.' },
  { id: 'oilcan',   name: 'Premium Motor Yağı',  cat: 'Hediye', price: 30, use: 'gift', target: 'pit',   desc: 'Pıtırcık\'a: bağ +10, 2 gün şarj gerekmez.' },
];
// Menşe varyasyonları: dönen yiyecek ve içeceklere eklenir, fiyat ve etkiyi değiştirir
SS.ORIGINS = [
  { name: 'Mars usulü', price: 1.15, morale: 2 }, { name: 'Titan malı', price: 1.2, energy: 4 }, { name: 'Kuşak işi', price: .85, morale: -1 },
  { name: 'Ev yapımı', price: 1.1, morale: 4 }, { name: 'Fabrika', price: .8, health: -1 }, { name: 'Organik', price: 1.3, health: 3 },
  { name: 'Kaçak', price: .7, health: -3 }, { name: 'Antika tarif', price: 1.25, morale: 3, hunger: 5 }, { name: 'Dünya özlemi', price: 1.4, morale: 6 },
];
// Seyyar satıcılar: bazı saat pencerelerinde pazara uğrar
SS.VENDORS = [
  { id: 'nuri',  name: 'Gezgin Nuri',      line: { easy: '"Bu lamba Ay\'dan geldi. Ya da Ay\'a gidiyordu. Önemli olan ışığı."', hard: '"Az bulunur mal. Yarın burada olmam."' } },
  { id: 'mira',  name: 'Mira Kuzey',       line: { easy: '"Her eşyanın bir hikâyesi var. Bunların hepsinin hikâyesi biraz garip."', hard: '"Kolonilerden kurtarabildiklerim bunlar."' } },
  { id: 'baron', name: 'Hurda Baronu Ozan', line: { easy: '"Pazarlık yok. Pazarlık yapanlara ayrıca pazarlık yok."', hard: '"Fiyat sabit. Hayat değil."' } },
  { id: 'twins', name: 'İkizler Ada ve Efe', line: { easy: '"Biri satar, biri reklamını yapar. Hangisi hangisi, sır."', hard: '"İkimiz de aç. Bir şey al."' } },
  { id: 'monk',  name: 'Sessiz Keşiş',     line: { easy: 'Keşiş sadece başını sallıyor. Fiyatlar kâğıtta yazılı. Kâğıt şiir gibi.', hard: 'Keşiş konuşmuyor. Gözleri yorgun.' } },
  { id: 'krellj', name: 'Krell Jr.',       line: { easy: '"Babamın haberi yok. Olmasın da."', hard: '"Babam bilirse ikimiz de biteriz. Çabuk seç."' } },
];

/* ---------- dekor ---------- */
// fx: morale (gecelik), sleep (uyku enerjisi), heat (ısıtma indirimi), bond (gecelik tüm hane), energyMax
SS.DECOR = [
  { id: 'plant',    name: 'Saksı Bitkisi',      price: 60,  fx: { morale: 1 },           desc: 'Her gece moral +1.' },
  { id: 'lamp',     name: 'Yıldız Lambası',     price: 90,  fx: { sleep: 5 },            desc: 'Uyku +5 enerji.' },
  { id: 'rug',      name: 'Eski Dünya Halısı',  price: 120, fx: { heat: 3, morale: 1 },  desc: 'Isıtma ₡3 ucuz, moral +1.' },
  { id: 'aquarium', name: 'Akvaryum',           price: 260, fx: { morale: 2, bond: 1 },  desc: 'Moral +2, hane bağı +1 (gecelik).' },
  { id: 'musicbox', name: 'Müzik Kutusu',       price: 150, fx: { morale: 2 },           desc: 'Her gece moral +2.' },
  { id: 'poster',   name: 'Koloni Posteri',     price: 40,  fx: { morale: 1 },           desc: 'Eski evin bir hatırası. Moral +1.' },
  { id: 'curtain',  name: 'Termal Perde',       price: 140, fx: { heat: 6 },             desc: 'Isıtma ₡6 ucuz.' },
  { id: 'hammock',  name: 'Hamak',              price: 180, fx: { sleep: 8 },            desc: 'Uyku +8 enerji.' },
  { id: 'telescope', name: 'Küçük Teleskop',    price: 300, fx: { morale: 3 },           desc: 'Her gece moral +3.' },
  { id: 'gym',      name: 'Katlanır Koşu Bandı', price: 420, fx: { energyMax: 10 },      desc: 'Maksimum enerji +10.' },
  { id: 'bonsai',   name: 'Uzay Bonsaisi',      price: 220, fx: { morale: 2, sleep: 3 }, desc: 'Moral +2, uyku +3.' },
  { id: 'table',    name: 'Aile Masası',        price: 260, fx: { bond: 2 },             desc: 'Hane bağı her gece +2.' },
  { id: 'heater',   name: 'Antika Soba',        price: 200, fx: { heat: 8, morale: 1 },  desc: 'Isıtma ₡8 ucuz, moral +1.' },
  { id: 'globe',    name: 'Dünya Küresi',       price: 110, fx: { morale: 1, sleep: 2 }, desc: 'Moral +1, uyku +2.' },
  { id: 'jukebox',  name: 'Retro Müzik Dolabı', price: 480, fx: { morale: 4, bond: 1 },  desc: 'Moral +4, hane bağı +1.', rare: true },
  { id: 'starmap',  name: 'Halcyon Yıldız Haritası', price: 520, fx: { morale: 3, sleep: 5 }, desc: 'Gizemli bir harita. Moral +3, uyku +5.', rare: true },
  { id: 'chair',    name: 'Kaptan Koltuğu',     price: 380, fx: { sleep: 6, morale: 2 }, desc: 'Uyku +6, moral +2.', rare: true },
  { id: 'robotpet', name: 'Mekanik Kuş',        price: 340, fx: { morale: 3 },           desc: 'Sabahları ötüyor. Moral +3.', rare: true },
];
SS.DECOR_SLOTS = [6, 9, 12]; // ev seviyesine göre

/* ---------- hane: odalar, yetenekler, bağ ayrıcalıkları ---------- */
SS.ROOMS = {
  pit:   { name: 'Şarj Yuvası',      price: 600, desc: 'Pıtırcık\'ın şarj masrafı sıfırlanır, bağı her gece +2.' },
  ela:   { name: 'Çalışma Masası',   price: 800, desc: 'Ela\'nın garsonluk geliri %50 artar, bağı her gece +2.' },
  tolga: { name: 'Tamir Tezgâhı',    price: 900, desc: 'Tolga\'nın geliri %30 artar; Tolga seninleyken tamir ödemesi %15 fazla.' },
};
SS.ABILITIES = {
  pit:   { name: 'Hurda Koklama',   desc: 'Bugün bir bölgeyi koklar: o bölgede değerler %30 fazla, +1 kristal.' },
  ela:   { name: 'Moral Konuşması', desc: 'Sana sarılır, bir şeyler anlatır: moral +15, enerji +10.' },
  tolga: { name: 'Bağlantılar',     desc: 'Tanıdığını arar: iş merkezine ödemesi %80 fazla özel bir iş düşer.' },
};
SS.BOND_PERKS = {
  pit:   [[30, 'Seninleyken iş sonrası moral +3'], [60, 'Her sabah moral +5'], [90, 'Kara kutuların içi her zaman görünür']],
  ela:   [[30, 'Tamirde +2 ipucu, +15 sn (seninle)'], [60, 'Her gece moral +5'], [90, 'Tüm tamirlerde +1 ipucu, moral 40\'ın altına düşmez']],
  tolga: [[30, 'Vinç %40 hızlı, teslimatta +40 yakıt (seninle)'], [60, 'Pazarlıkta Zara yumuşar'], [90, 'Çalışma geliri iki katı']],
};

/* ---------- rütbe ve rekabet ---------- */
SS.RANKS = [
  { name: 'Çaylak',        at: 0,      perk: '' },
  { name: 'Hurdacı',       at: 3000,   perk: 'Tüm iş ödemeleri +%5' },
  { name: 'Usta Hurdacı',  at: 10000,  perk: 'Tüm iş ödemeleri +%10, 1 ek dekor yuvası' },
  { name: 'Kaptan',        at: 25000,  perk: 'Tüm iş ödemeleri +%15, pazarda %5 indirim' },
  { name: 'Filo Sahibi',   at: 50000,  perk: 'Tüm iş ödemeleri +%20, pazarda %10 indirim' },
  { name: 'Efsane',        at: 100000, perk: 'Tüm iş ödemeleri +%25, pazarda %15 indirim' },
];
SS.REX_LINES = {
  win:  { easy: ['Rex skor tabelasına baktı, sonra bir daha baktı. "Tabela bozuk."', 'Rex: "Bu hafta sana izin verdim. Cömertliğimden."'], hard: ['Rex sana bir şişe uzattı. "Hak ettin." Kısa, ama samimi.', 'Rex: "Fena değil. Gelecek hafta yok öyle."'] },
  lose: { easy: ['Rex kazandı ve bunu kantinde şarkıyla duyurdu. Gus kulaklarını kapattı.', 'Rex: "Yenilgi seni olgunlaştırır. Beni zaten olgunlaştırdı."'], hard: ['Rex kazandı. Gülümsemedi bile.', 'Rex: "Bu tempoyla Krell seni yer."'] },
};

})(window.SS);

/* ---------- kılavuz (harita sürümü) ---------- */
(function(SS){
SS.GUIDE = [
  { id: 'start', title: 'Amaç ve gün', body: `
<p><b>Amaç:</b> Krell'e olan ₡12.000 borcu 196 gün içinde kapat. Sonra Paslı Pelikan'ı satıp Gezgin Martı'yı, en sonunda Demir Balina'yı al. Yolda rütbe atla, Rex'i haftalık yarışta yen, Halcyon'un kayıtlarını topla.</p>
<p><b>Saat:</b> Gün 07:00'de başlar. Her iş, yolculuk, sohbet ve yemek dakika harcar; süresi kartlarında yazar. 01:00'den sonra iş yapılamaz. Gün bitince Yaşam Modülü'ne dön ve akşam defterini kapatıp uyu.</p>
<p><b>Akşam defteri:</b> Zorunlu ödemeler (oksijen, kira, taksit) otomatik düşer. Akşam yemeği, ısıtma, hanenin yemeği ya da şarjı, ilaç ve okul ücreti senin kararın; atladığın her kalemin bir bedeli var.</p>
<p><b>Sabah bülteni:</b> Uyanınca manşet, gece olanlar, hanenin durumu, dünün kararları ve piyasa önüne gelir.</p>` },
  { id: 'map', title: 'Harita ve yolculuk', body: `
<p>Ana ekran istasyon haritasıdır. Bir modüle dokununca oraya gidersin; yol 10–50 dakika ve 1–5 enerji tutar, düğmenin altında yazar.</p>
<ul><li>Bazı yerler belli saatlerde kapalıdır: Pazar 08–22, Klinik 08–20, Krell 09–18. Yaşam Modülü, Kantin ve Hangar gece de açıktır.</li>
<li>Haritanın altındaki panolar: karar anı, anlatıcının sabah sözü, Rex ile haftalık yarış, sıradaki gemiye ilerleme, rütbe, günlük hedefler ve hane durumu.</li>
<li>Alttaki çubuk: Harita, bulunduğun yer ve Seyir Defteri (her yerden açılır, yolculuk gerektirmez).</li></ul>` },
  { id: 'stats', title: 'Göstergeler', body: `
<ul><li><b>Enerji</b>: İşler ve yolculuk harcar. Uyku, yemek, kahve, kestirme (90 dk, +35) ve Oksijen Barı ile dolar. Kondisyon becerisi ve koşu bandı üst sınırı artırır.</li>
<li><b>Tokluk</b>: Her gece düşer, akşam yemeği biraz geri verir. 25'in altında uyku daha az dinlendirir; 12'nin altında sağlık bozulur.</li>
<li><b>Sağlık</b>: Patlama, sert iniş, soğuk ve açlık düşürür. 0 olursa hastanelik olursun, gün biter ve fatura gelir. Klinik ve bandaj iyileştirir.</li>
<li><b>Moral</b>: 70 ve üstü mini oyunlarda +5 saniye; 30 altı −6 saniye. Dekor, sohbet, iyi yemek ve kararlar etkiler.</li></ul>` },
  { id: 'home', title: 'Yaşam Modülü', body: `
<ul><li><b>Hane</b>: Her arkadaşa günlük görev ver (Seninle, Çalışsın, Dinlensin), günde bir kez özel yeteneğini kullan, odasını kur.</li>
<li><b>Dolap</b>: İlaç, bandaj ve hediyeler burada; sarf malzemeleri sıradaki işe otomatik uygulanır.</li>
<li><b>Dekor</b>: Ev seviyesine göre 3, 5 ya da 8 yuva. Her dekor moral, uyku, ısıtma ya da bağ etkisi verir. Kaldırınca parasının %40'ı geri gelir.</li>
<li><b>Ev</b>: Daha büyük eve taşın, bahçe ve atölye kur. Kestir ya da akşam defterini açıp uyu.</li></ul>` },
  { id: 'jobs', title: 'İş Merkezi', body: `
<p>İlanlar 3 saatlik pencerelerde değişir (07, 10, 13, 16, 19, 22). Akşam 19:00 sonrası gece zammı %15'tir.</p>
<ul><li><b>Hurda sözleşmesi</b>: Bir müşteri belirli bölgeden belirli hurdayı istiyor (parça, kristal, enkaz, kara kutu). Hedefler sahada işaretlidir ve müşteriye gider; topladığın diğer her şey senin. Ücret + hedef başına ödeme, hepsini getirirsen +%50 prim ve hurda itibarı.</li>
<li><b>Teslimat</b>: Kısa, orta, uzak ve (itibar 3'te) VIP. Acil, ağır yük, fırtınalı iniş, dar pist, bahşişçi müşteri gibi değiştiriciler ödemeyi ve zorluğu değiştirir.</li>
<li><b>Tamir</b>: 4×4'ten 7×7 reaktöre. İpucu yok, acil arıza, sadık müşteri gibi değiştiriciler olabilir.</li>
<li><b>Ayrıştırma</b>: Standart, radyoaktif, organik ve hızlı bant çeşitleri. Başlamadan önce hangi eşyanın hangi kutuya gittiği gösterilir.</li>
<li><b>Sipariş</b>: Bir alıcı belirli hurdayı istiyor. Kargonda varsa 30 dakikada teslim et; pazardan çok daha iyi öder.</li>
<li><b>İtibar</b>: Teslimat, tamir ve ayrıştırmada başarı itibar kazandırır; her seviye ödemeyi %8 artırır.</li></ul>` },
  { id: 'hangar', title: 'Rıhtım ve Hangar', body: `
<ul><li><b>Hurda avı</b>: 3 saat ve 30 enerji. Aynı bölgeye sık dalarsan stok düşer, her gece yarısı kadar yenilenir. Pıtırcık'ın kokladığı bölgede değerler %30 fazladır.</li>
<li><b>Yakıt</b>: Burada alınır.</li>
<li><b>Geliştirmeler</b>: Hurda donanımı sadece hurda avını, Uçuş ve gövde teslimatı ve güvenliği, Atölye tamiri etkiler.</li>
<li><b>Tersane</b>: Borcun bitince eski gemini satıp yenisini al; nakit ya da en az %20 peşinatla banka kredisi.</li></ul>` },
  { id: 'market', title: 'Pazar Halkası', body: `
<ul><li><b>Satış</b>: Aynı gün aynı türden her satış fiyatı %3 düşürür. Pazarlık becerisi her satışa %3 ekler; günde bir kez Zara'yla pazarlık edebilirsin.</li>
<li><b>Sabit raf</b>: Tayın, kahve, ilaç, bandaj ve torpido her zaman var.</li>
<li><b>Günün tezgâhı</b>: Her 3 saatte değişen yiyecekler, içecekler, sarf malzemeleri, hediyeler ve dekorlar. Aynı ürün farklı menşelerle (Mars usulü, Titan malı, kaçak…) farklı fiyat ve etkiyle gelir.</li>
<li><b>Seyyar satıcılar</b>: Bazı pencerelerde uğrar; nadir dekorlar ve indirimli malzeme getirir.</li></ul>` },
  { id: 'cantina', title: 'Kantin, Klinik, Krell', body: `
<ul><li><b>Kantin</b>: Gus'un yemekleri ve içecekleri, istasyon sakinleriyle sohbet (1 saat), kart masası.</li>
<li><b>Klinik ve Akademi</b>: Sağlık al; Pilotluk, Mühendislik, Pazarlık ve Kondisyon becerilerini geliştir (3 saat). Her becerinin etkisi sayıyla yazar.</li>
<li><b>Krell ve Banka</b>: Borç durumu, ek ödeme ve gecikmiş borç. Gecikmiş borcu kapatınca gecikme sayacı bir azalır.</li></ul>` },
  { id: 'log', title: 'Seyir Defteri', body: `<p>Rütbe merdiveni, Rex yarışı geçmişi, hanenin kayıtları, hikâye bölümleri, eser albümü, başarımlar; renk teması, görsel stil, metin tonu ve ses ayarları.</p>` },
  { id: 'crew', title: 'Yol arkadaşları', body: `
<ul><li><b>Görevler</b>: Seninle (işlerinde yardım eder, mini oyunun üstünde yazar), Çalışsın (gece ücret getirir), Dinlensin (bağ +4, moral +2).</li>
<li><b>Yetenekler</b> (günde bir): Pıtırcık bir bölgeyi koklar, Ela moral konuşması yapar, Tolga özel bir iş bulur.</li>
<li><b>Bağ</b> 30, 60 ve 90'da kalıcı ayrıcalıklar açar. Her gece 1 azalır; dinlenme, hediye, oda, dekor ve iyi kararlar artırır.</li>
<li><b>İhtiyaçlar</b>: Akşam defterinde doyurulmazsa (Pıtırcık şarj edilmezse) bağ düşer; iki gece aç kalan hastalanır. Hasta olan yardım etmez; ilaçsız üç gece geçerse ayrılır.</li></ul>` },
  { id: 'money', title: 'Masraflar ve gecikmeler', body: `
<ul><li><b>Her gece</b>: Oksijen ve su zorunlu; yemek, ısıtma, hane ihtiyaçları senin seçimin.</li>
<li><b>Her 7 günde</b>: Rıhtım ücreti; Ela varsa okul. Haftanın sonunda Rex yarışı sonuçlanır.</li>
<li><b>Her 28 günde</b>: Kira, taksit, işletme bakımı ve faiz.</li>
<li><b>Gecikme</b>: Zorunlu ödemeye para yetmezse kalan %10 cezayla gecikmiş borca yazılır ve bir gecikme sayılır. 3 gecikmede oyun biter.</li></ul>` },
];
})(window.SS);

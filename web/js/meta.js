// Space Scrapper — uzun vadeli oyun: rehberli ilk gün, yarın kancası, hikâye dizileri,
// genişletilmiş albüm ve setler, gemi/ev kişiselleştirme, Yeni Oyun+, telefon bildirimleri
(function(SS){
const { pick, rint, fmt, clamp } = SS;

/* ---------- telefon köprüsü ---------- */
SS.native = () => window.SS_NATIVE || null;
SS.haptic = strong => { const n = SS.native(); if (n) n.post({ type: 'haptic', strong: !!strong }); };

/* ---------- rehberli ilk gün ---------- */
// Her adımın anlatıcı metni, tamamlanma koşulu ve haritada vurgulanacak yer
SS.TUTORIAL = [
  { to: 'jobs', text: { easy: 'Kaptan! Para lazım, hem de dün. Haritada İş Merkezi\'ne dokun, bakalım bugün kim bize iş verecek.', hard: 'Önce iş. Haritada İş Merkezi\'ne git.' },
    done: () => S.loc === 'jobs' },
  { text: { easy: 'İlanlardan birini kabul et. Tamir İşi riskisizdir, Hurda sözleşmesi daha çok öder. Ben ikisini de sevdim, karar senin.', hard: 'Bir işi kabul et ve bitir. Tamir risksiz, hurda sözleşmesi daha kazançlı.' },
    done: () => (S.stats.repair + S.stats.deliver + S.stats.sort + (S.stats.hunts || 0) + S.stats.runs) > 0 },
  { to: 'cantina', text: { easy: 'İş yorar. Gus\'un Kantini\'ne uğra, bir şeyler ye ya da kahve iç. Enerji olmadan kanca kalkmaz.', hard: 'Enerjin düşüyor. Kantin\'e git, bir şey ye.' },
    done: () => (S.today.meal || 0) > 0 || Object.values(S.drinks || {}).some(Boolean) || S.hunger >= 90 },
  { to: 'home', text: { easy: 'Eve dönelim. Yaşam Modülü\'nde odalarımızı gör; pazardan alacağın dekorları oraya yerleştireceğiz.', hard: 'Eve dön. Odalar sekmesine bir göz at.' },
    done: () => S.loc === 'home' },
  { text: { easy: 'Gün bitiyor. "Akşam defteri ve uyku"ya bas. Haneyi doyurmayı ve ısıtmayı unutma, ben üşürüm. Robotum ama yine de.', hard: 'Akşam defterini aç. Kimin doyacağına sen karar vereceksin. Sonra uyu.' },
    done: () => S.day >= 2 },
];
SS.tutStep = () => (S.tut != null && S.tut < SS.TUTORIAL.length) ? SS.TUTORIAL[S.tut] : null;
SS.tutCheck = () => {
  const st = SS.tutStep(); if (!st || !st.done()) return false;
  S.tut++;
  if (S.tut >= SS.TUTORIAL.length) { S.tut = null; SS.earn(100); SS.toast('İlk gün tamam: ₡100 başlangıç primi', 'ach'); }
  else SS.toast(`Görev ${S.tut + 1}/${SS.TUTORIAL.length}`, 'good');
  return true;
};

/* ---------- yarın kancası ---------- */
// Her gece yarın için küçük bir merak bırakılır; ertesi gün gerçekten olur
const TEASES = [
  { id: 'vendor', text: { easy: 'Kulis: Yarın sabah pazara bir seyyar satıcı geliyor. Nadir dekor getiriyormuş.', hard: 'Yarın sabah pazara bir seyyar satıcı uğrayacak.' } },
  { id: 'yard', text: { easy: 'Tersane yarın %10 indirim yapacak. Vida Usta "sadece bir gün" dedi, üç kez.', hard: 'Tersanede yarın bir günlük %10 indirim var.' } },
  { id: 'rexzone', text: { easy: 'Rex yarın Gemi Mezarlığı\'nı süpürecekmiş. Oraya erken git ya da hiç gitme.', hard: 'Rex yarın Gemi Mezarlığı\'na gidiyor. Orası yarın yarı yarıya boşalacak.' } },
  { id: 'crystal', text: { easy: 'Zara fısıldadı: yarın kristal fiyatları uçacak.', hard: 'Yarın kristal fiyatları yükselecek. Elindekileri bekletebilirsin.' } },
  { id: 'bonusjob', text: { easy: 'Yarın İş Merkezi\'ne VIP bir müşteri gelecekmiş. Ceketini ütüle.', hard: 'Yarın İş Merkezi\'nde yüksek ödemeli bir iş çıkacak.' } },
];
SS.rollTease = () => { const t = pick(TEASES); S.tease = { id: t.id, text: SS.tx(t.text) }; };
SS.applyTease = () => {
  const t = S.tease; S.teaseToday = t || null; S.tease = null; if (!t) return;
  if (t.id === 'vendor') S.flags.vendor = true;
  if (t.id === 'yard') S.flags.yardSale = true;
  if (t.id === 'rexzone') S.zoneUse.yard = (S.zoneUse.yard || 0) + 2.3;
  if (t.id === 'crystal') S.prices.crystal = clamp(S.prices.crystal * 1.5, .5, 2.4);
  if (t.id === 'bonusjob') S.tolgaJob = true;
};

/* ---------- hikâye dizileri (birkaç güne yayılan) ---------- */
// Her dizi adımları birer karar olarak gelir; adımlar arası 2 gün
const ARC = (id, who, title, steps) => ({ id, who, title, steps });
SS.ARCS = [
  ARC('scholar', 'ela', 'Ela\'nın Burs Sınavı', [
    { text: { easy: 'Ela burs sınavına hazırlanmak için sessiz bir köşe istiyor. "Pıtırcık\'ın mırlaması bile dikkatimi dağıtıyor."', hard: 'Ela burs sınavına çalışacak. Sessiz bir köşeye ve bir masa lambasına ihtiyacı var.' },
      opts: [{ label: 'Masa lambası al (₡80)', need: () => S.cash >= 80, run() { S.cash -= 80; S.arcScore++; SS.bond('ela', 8); return { easy: 'Ela lambayı yaktı ve "artık dahiyim" dedi.', hard: 'Ela lambanın altında saatlerce çalıştı.' }; } },
        { label: 'İdare etsin', run() { return { easy: 'Ela el feneriyle çalışıyor. Romantik ama verimsiz.', hard: 'Ela loş ışıkta gözlerini kısıyor.' }; } }] },
    { text: { easy: 'Sınav haftası. Ela gece çalışıyor ve senden soru sormanı istiyor. İki saat sürer.', hard: 'Sınav haftası. Ela yorgun, birinin ona soru sormasını istiyor. İki saat.' },
      opts: [{ label: 'Birlikte çalış (2 saat)', need: () => SS.timeOk(120), run() { SS.passTime(120); S.arcScore++; SS.bond('ela', 10); return { easy: 'Ela her soruyu bildi. Sen yarısını bilmiyordun.', hard: 'Ela sorulara tek tek cevap verdi. Gözlerinde umut var.' }; } },
        { label: 'İşim var', run() { SS.bond('ela', -6); return { easy: 'Ela soruları Pıtırcık\'a sordu. Pıtırcık "miyav" dedi.', hard: 'Ela tek başına çalıştı.' }; } }] },
    { text: { easy: 'Sonuçlar açıklandı! Ela zarfı titreyen ellerle açıyor…', hard: 'Sonuç zarfı geldi. Ela açmaya korkuyor.' },
      opts: [{ label: 'Zarfı birlikte aç', run() {
        if (S.arcScore >= 1) { S.perks = S.perks || {}; S.perks.scholar = true; SS.bond('ela', 20); SS.mood(15); return { easy: 'BURS! Okul ücreti artık sıfır. Ela tavana zıpladı, tavan alçak.', hard: 'Burs kazandı. Okul ücreti bitti. Ela sana uzun uzun sarıldı.' }; }
        SS.mood(-6); return { easy: 'Bu sefer olmadı. Ela "Gelecek yıl!" dedi ve bir kurabiye yedi.', hard: 'Olmadı. Ela sessizce zarfı katladı.' }; } }] },
  ]),
  ARC('ghostship', null, 'Kayıtsız Gemi', [
    { text: { easy: 'Rıhtıma kayıtsız, ışıkları sönük bir gemi yanaştı. Kimse inmiyor. Kimse binmiyor. Ürkütücü ve biraz da havalı.', hard: 'Rıhtıma kayıtsız bir gemi yanaştı. Işıkları kapalı. İstasyon güvenliği görmezden geliyor.' },
      opts: [{ label: 'İncele (2 saat)', need: () => SS.timeOk(120), run() { SS.passTime(120); S.arcScore++; return { easy: 'İçeride yaşlı bir kaptan buldun. Çay ikram etti. Çay soğuktu.', hard: 'İçeride yaşlı bir kaptan seni bekliyordu. "Seni gözlüyordum."' }; } },
        { label: 'Uzak dur', run() { return { easy: 'Uzak durdun. Gemi de senden uzak durdu.', hard: 'Akıllıca. Belki.' }; } }] },
    { text: { easy: 'Yaşlı kaptan bir harita satıyor: "Kayıp bir eserin yeri. ₡200, pazarlık yok, emeklilik fonu."', hard: 'Kaptan sana bir harita uzatıyor. "₡200. Bir eserin yeri yazıyor."' },
      opts: [{ label: 'Haritayı al (₡200)', need: () => S.cash >= 200, run() { S.cash -= 200; S.arcScore++; S.flags.relicNext = true; S.relicNext = true; return { easy: 'Harita kahve lekeli ama gerçek görünüyor. Bir sonraki hurda avında bir eser kesin çıkacak.', hard: 'Harita doğruysa, bir sonraki hurda avında bir eser bulacaksın.' }; } },
        { label: 'Teşekkürler, hayır', run() { return { easy: 'Kaptan omuz silkti ve haritayı Rex\'e sattı. Hmm.', hard: 'Kaptan haritayı cebine koydu.' }; } }] },
    { text: { easy: 'Kayıtsız gemi gece sessizce ayrıldı. Kapının önüne bir paket bırakmışlar.', hard: 'Gemi gece ayrıldı. Kapında bir paket var.' },
      opts: [{ label: 'Paketi aç', run() {
        if (S.arcScore >= 2 && SS.addFragment()) return { easy: `İçinden Halcyon\'un kayıt parçası çıktı! (${S.fragments}/5) Not: "Çay için teşekkürler."`, hard: `Halcyon\'un kayıt parçası. (${S.fragments}/5)` };
        SS.earn(80); return { easy: 'İçinden ₡80 ve bir kartpostal çıktı: "Hoşça kal, meraklı kaptan."', hard: 'İçinde ₡80 var. Not yok.' }; } }] },
  ]),
  ARC('oldflame', 'tolga', 'Tolga\'nın Geçmişi', [
    { text: { easy: 'Tolga\'nın eski sevgilisi Selin istasyona geldi. Tolga saçını üç kez taradı. Saçı yok.', hard: 'Tolga\'nın eski sevgilisi Selin istasyonda. Tolga gergin.' },
      opts: [{ label: 'Akşam yemeği ver (₡60)', need: () => S.cash >= 60, run() { S.cash -= 60; S.arcScore++; SS.bond('tolga', 10); return { easy: 'Yemek güzel geçti. Tolga sadece iki kez çorbayı döktü.', hard: 'Yemek sessiz ama sıcaktı. Tolga uzun zamandır böyle gülmemişti.' }; } },
        { label: 'Kendi halletsin', run() { SS.bond('tolga', -4); return { easy: 'Tolga Selin\'i kantine götürdü. Gus ikisine de güveç verdi.', hard: 'Tolga gece geç döndü.' }; } }] },
    { text: { easy: 'Selin, Tolga\'ya kendi madencilik gemisinde iş teklif etti. Tolga sana bakıyor. Gözleri "kal de" diyor. Ya da "git de". Belirsiz.', hard: 'Selin Tolga\'ya başka bir gemide iş teklif etti. Tolga kararı sana bırakıyor gibi.' },
      opts: [{ label: '"Burada ailen var"', run() { SS.bond('tolga', 18); SS.mood(6); return { easy: 'Tolga kaldı ve Selin\'e her hafta mektup yazacağına söz verdi. İlk mektup "naber" olacak.', hard: 'Tolga kaldı. Gözleri dolu ama kararlı.' }; } },
        { label: '"Kendi kararın"', run() { if (Math.random() < .5) { SS.leave('tolga'); SS.earn(300); return { easy: 'Tolga gitti ama sana ₡300 ve "en iyi kaptan" yazan bir kupa bıraktı.', hard: 'Tolga gitti. Masada ₡300 ve bir not: "Borcumu ödedim."' }; } SS.bond('tolga', 10); return { easy: 'Tolga düşündü ve kaldı. "Burada daha komik."', hard: 'Tolga kaldı. Kendi seçimiyle.' }; } }] },
  ]),
  ARC('signal', 'pit', 'Pıtırcık\'ın Sinyali', [
    { text: { easy: 'Pıtırcık\'ın antenleri dikildi. Havalandırma borularından tuhaf bir sinyal geliyormuş. "Mrr-bip?"', hard: 'Pıtırcık havalandırmalardan gelen zayıf bir sinyal yakaladı.' },
      opts: [{ label: 'Peşinden git (2 saat)', need: () => SS.timeOk(120), run() { SS.passTime(120); S.arcScore++; SS.bond('pit', 8); return { easy: 'Borularda süründünüz. Sinyal güçleniyor. Dizlerin zayıflıyor.', hard: 'Sinyal bir depoya çıkıyor. Yarın tekrar bakmalısın.' }; } },
        { label: 'Boş ver', run() { SS.bond('pit', -6); return { easy: 'Pıtırcık bütün gece boruya miyavladı.', hard: 'Pıtırcık sinyali dinlemeye devam etti. Yalnız.' }; } }] },
    { text: { easy: 'Sinyalin kaynağı bulundu: kayıp, minicik bir robot kedi yavrusu! Pıtırcık ona bakıyor. Sen Pıtırcık\'a bakıyorsun.', hard: 'Depoda terk edilmiş küçük bir robot kedi buldunuz. Pili bitmek üzere.' },
      opts: [{ label: 'Evlat edin', run() { SS.bond('pit', 20); SS.mood(10); (S.decorStore = S.decorStore || []).push('robotpet'); return { easy: 'Yavruya "Somun" adını verdin. Depoya bir oyuncak kuş da koydular, odana yerleştirebilirsin.', hard: 'Yavru artık sizinle. Pıtırcık onu hiç yalnız bırakmıyor.' }; } },
        { label: 'Zara\'ya sat (₡250)', run() { SS.earn(250); SS.bond('pit', -15); return { easy: '₡250 aldın. Pıtırcık seninle bir hafta konuşmayacak. Zaten konuşmuyordu.', hard: '₡250. Pıtırcık kapının önünde bekledi, uzun süre.' }; } }] },
  ]),
];
SS.arcDecision = () => {
  const a = S.arc; if (!a || S.day < a.next) return null;
  const arc = SS.ARCS.find(x => x.id === a.id); if (!arc || (arc.who && !SS.hasCrew(arc.who)) || (arc.when && a.step === 0 && !arc.when())) { S.arc = null; return null; }
  const st = arc.steps[a.step];
  return { id: `arc:${a.id}:${a.step}`, who: arc.who, title: `${arc.title} · ${a.step + 1}/${arc.steps.length}`, text: st.text, opts: st.opts, arc: true };
};
SS.arcAdvance = () => { const a = S.arc; const arc = SS.ARCS.find(x => x.id === a.id); a.step++; a.next = S.day + 2; if (a.step >= arc.steps.length) { (S.arcsDone = S.arcsDone || []).push(a.id); S.arc = null; } };
SS.maybeStartArc = () => {
  if (S.arc || S.day < 3 || S.day % 5 !== 0) return;
  const pool = SS.ARCS.filter(a => !(S.arcsDone || []).includes(a.id) && (!a.who || SS.hasCrew(a.who)) && (!a.when || a.when()));
  if (pool.length) { const a = pick(pool); S.arc = { id: a.id, step: 0, next: S.day }; S.arcScore = 0; }
};

/* ---------- genişletilmiş albüm ve setler ---------- */
const MORE = {
  belt: [['Kayıp Kumanda', '#9aa3a6'], ['Kuyrukluyıldız Bileziği', '#ffd34d'], ['Taşlaşmış Sandviç', '#ab7a5a'], ['Eski Pusula Saati', '#e0b45c'], ['Mars Seçim Afişi', '#ff6f59'], ['Plastik Uzaylı Bebek', '#8ef06b']],
  yard: [['Kaptan Şapkası', '#3b3b3b'], ['Paslı Madalya', '#c48a1d'], ['Seyir Defteri Sayfası', '#e9e4d0'], ['Kırık Teleskop Merceği', '#7fe0c9'], ['Gemi Aşçısının Kepçesi', '#c7c9cf'], ['Mürettebat Fotoğrafı', '#d9b77a']],
  gas: [['Bulut Kristali', '#e9e4ff'], ['Fırtına Kavanozu', '#7fc9b8'], ['Halka Taşı', '#c17bff'], ['Gaz Balinası Pulu', '#5ef0ff'], ['Basınç Ölçer', '#9fd3ff'], ['Mor Yağmur Damlası', '#ff77a8']],
  pirate: [['Korsan Kancası', '#8d8f87'], ['Sahte Altın Sikke', '#ffd34d'], ['Kurukafa Yüzük', '#e6dfc8'], ['Korsan Papağan Robotu', '#00e436'], ['Ödül Posteri', '#d65a4a'], ['Gizli Hazine Sandığı', '#b4782f']],
  lost: [['Halcyon Dümeni', '#e0a43a'], ['Kaptanın Mektubu', '#e9e4d0'], ['Altın Pusula', '#ffd34d'], ['Kristal Kalp', '#5ef0ff'], ['Mühürlü Kasa Anahtarı', '#c9a44a'], ['Kayıp Yıldız Haritası', '#c17bff']],
};
let n = 13;
for (const [zone, list] of Object.entries(MORE)) {
  const Z = SS.ZONES.find(z => z.id === zone);
  for (const [name, hue] of list) { const id = 'r' + n++; SS.RELICS[id] = { name, hue }; Z.relics.push(id); }
}
SS.SETS = [
  { zone: 'belt', name: 'Kuşak Hatıraları', reward: { decor: 'set_belt', cash: 300, title: 'Kuşak Arkeoloğu' } },
  { zone: 'yard', name: 'Batık Filo Koleksiyonu', reward: { decor: 'set_yard', cash: 500, title: 'Mezarlık Bekçisi' } },
  { zone: 'gas', name: 'Halka Mücevherleri', reward: { decor: 'set_gas', cash: 800, title: 'Fırtına Toplayıcısı' } },
  { zone: 'pirate', name: 'Korsan Ganimeti', reward: { decor: 'set_pirate', cash: 1200, title: 'Korsan Avcısı' } },
  { zone: 'lost', name: 'Halcyon\'un Mirası', reward: { decor: 'set_lost', cash: 2000, title: 'Efsane Kaşif' } },
];
SS.DECOR.push(
  { id: 'set_belt', name: 'Kuşak Vitrini', price: 600, fx: { morale: 3, sleep: 3 }, desc: 'Set ödülü. Moral +3, uyku +3.', rare: true, set: true },
  { id: 'set_yard', name: 'Batık Gemi Çanı', price: 800, fx: { morale: 3, bond: 2 }, desc: 'Set ödülü. Moral +3, hane bağı +2.', rare: true, set: true },
  { id: 'set_gas', name: 'Gaz Devi Küresi', price: 1000, fx: { morale: 4, sleep: 6 }, desc: 'Set ödülü. Moral +4, uyku +6.', rare: true, set: true },
  { id: 'set_pirate', name: 'Korsan Sandığı', price: 1200, fx: { morale: 4, energyMax: 10 }, desc: 'Set ödülü. Moral +4, maks. enerji +10.', rare: true, set: true },
  { id: 'set_lost', name: 'Halcyon Maketi', price: 2000, fx: { morale: 6, bond: 3, sleep: 6 }, desc: 'Set ödülü. Moral +6, bağ +3, uyku +6.', rare: true, set: true },
);
SS.setProgress = s => { const Z = SS.ZONES.find(z => z.id === s.zone); return [Z.relics.filter(r => S.album[r]).length, Z.relics.length]; };
SS.checkSets = () => {
  S.setsDone = S.setsDone || {};
  for (const s of SS.SETS) {
    const [have, all] = SS.setProgress(s);
    if (have >= all && !S.setsDone[s.zone]) {
      S.setsDone[s.zone] = S.day; (S.decorStore = S.decorStore || []).push(s.reward.decor); SS.earn(s.reward.cash);
      (S.titles = S.titles || []).push(s.reward.title);
      SS.notes.push(`Set tamamlandı: ${s.name}! Ödül: ${fmt(s.reward.cash)}, "${SS.DECOR.find(d => d.id === s.reward.decor).name}" dekoru ve "${s.reward.title}" unvanı.`);
    }
  }
};

/* ---------- kişiselleştirme ---------- */
SS.PAINTS = [
  { id: 'klasik', name: 'Klasik turuncu', price: 0, hull: null },
  { id: 'gece', name: 'Gece mavisi', price: 300, hull: ['#3a5bd9', '#1d2b6b', '#b8c7ff'] },
  { id: 'zumrut', name: 'Zümrüt', price: 400, hull: ['#1fa463', '#0e5a37', '#b8f0d2'] },
  { id: 'kizil', name: 'Kızıl yarış', price: 500, hull: ['#d92e4f', '#6b1222', '#ffc2cd'] },
  { id: 'mor', name: 'Nebula moru', price: 600, hull: ['#8e4fd6', '#43206e', '#e1c9ff'] },
  { id: 'altin', name: 'Altın kaplama', price: 1500, hull: ['#e0a43a', '#7a5414', '#fff0c2'] },
  { id: 'korsan', name: 'Korsan karası', price: 0, hull: ['#2a2a30', '#0b0b0e', '#c9c2a8'], unlock: 'pirate' },
];
SS.paintPalette = P => {
  const p = window.S && SS.PAINTS.find(x => x.id === S.paint);
  if (!p || !p.hull) return P;
  return { ...P, hull: p.hull[0], hullD: p.hull[1], hull2: p.hull[2] };
};
SS.HOME_TINTS = [
  { id: 'std', name: 'Varsayılan', price: 0, tint: null },
  { id: 'sicak', name: 'Sıcak kehribar', price: 200, tint: '#e0a43a' },
  { id: 'orman', name: 'Orman yeşili', price: 200, tint: '#3fae6a' },
  { id: 'okyanus', name: 'Okyanus mavisi', price: 200, tint: '#2f8fd8' },
  { id: 'gul', name: 'Gül pembesi', price: 200, tint: '#e0558c' },
];
SS.homeTint = () => { const h = window.S && SS.HOME_TINTS.find(x => x.id === S.homeTint); return h && h.tint; };
SS.shipName = () => (S.shipNames && S.shipNames[S.tier]) || SS.SHIPS[S.tier].name;

/* ---------- Yeni Oyun+ ---------- */
SS.canNGPlus = () => !!(S && S.finale);
SS.newGamePlus = () => {
  const keep = { album: S.album, ach: S.ach, titles: S.titles || [], setsDone: S.setsDone || {}, paints: S.paints || {}, ng: (S.ng || 0) + 1,
    diff: S.diff, tone: S.tone, name: S.name, crew: S.crewOrder.filter(id => !S.crew[id].gone) };
  const s = SS.newState(keep.diff, keep.tone, keep.name, keep.crew.length ? keep.crew : ['pit']);
  Object.assign(s, { album: keep.album, ach: keep.ach, titles: keep.titles, setsDone: keep.setsDone, paints: keep.paints, ng: keep.ng, tut: null });
  s.loan = s.loanStart = Math.round(SS.RULES.loan * (1 + keep.ng * .25));
  s.cash += 1000 * keep.ng;
  window.S = s; S.nextEvent = null; SS.newDay([]);
  SS.notes.push(`Yeni Oyun+ ${keep.ng}: Albümün, unvanların ve boyaların seninle. Borç ${fmt(S.loan)}, başlangıç primi ${fmt(1000 * keep.ng)}, bütün işler %${keep.ng * 10} daha fazla öder.`);
};
SS.ngPay = () => 1 + (window.S && S.ng ? S.ng * .1 : 0);

/* ---------- telefon bildirimleri ---------- */
SS.scheduleNotes = () => {
  const n = SS.native(); if (!n || !S) return;
  const list = [], fun = SS.fun(), nar = SS.narrator(), who = nar ? SS.comp(nar).name : 'İstasyon';
  list.push({ inMinutes: 20 * 60, title: `${who}: Gün ${S.day} başladı`, body: fun ? 'Hurda kendini toplamıyor kaptan. Ben denedim.' : 'Yeni ilanlar düştü. Hane seni bekliyor.' });
  if (SS.daysTo(28) <= 1 && S.loan > 0) list.push({ inMinutes: 22 * 60, title: 'Kira ve taksit yarın', body: `${fmt(SS.M().rent + SS.M().installment)} hazır olsun.` });
  const rx = SS.rexWeek(); if ((S.weekEarned || 0) < rx) list.push({ inMinutes: 26 * 60, title: 'Rex önde', body: `Haftalık yarışta ${fmt(rx - (S.weekEarned || 0))} gerideysin.` });
  list.push({ inMinutes: 24 * 60, title: 'Günün Avı hazır', body: 'Herkes aynı asteroit alanında. Skorunu paylaş.' });
  n.post({ type: 'notify', list });
};

})(window.SS);

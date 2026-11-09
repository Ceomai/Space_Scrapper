// Space Scrapper — oyun zevki ve kolaylık paketi:
// beklenmedik masraflar, ara kilometre taşları, günün işi, eser takası, hane barışması ve pasifleri,
// gemi alımı uyarısı, kumarhane şanslı gecesi; uyku kısayolu, rota planı, otomatik yakıt/satış,
// borç takvimi, benzer iş düğmesi, erişilebilirlik ayarları, bağlama duyarlı rehber.
(function(SS){
const { fmt, rint, rnd, pick, clamp } = SS;
const { btn, esc, face, panel, dur } = SS.ui;
const ACT = SS.ACT;
const render = () => SS.render();
const cmul = () => SS.dv('costs');

/* =========================================================
   HANE PASİFLERİ
   ========================================================= */
SS.PASSIVES = {
  pit: { name: 'Kısa yol', desc: 'Seninleyken istasyon içi yolculuk %20 kısa.', on: () => SS.assist('pit') },
  ela: { name: 'Tatlı dil', desc: 'Seninleyken tüm satışlar +%3.', on: () => SS.assist('ela') },
  tolga: { name: 'Usta eller', desc: 'Seninleyken tamir süresi +15 saniye, teslimat ödemesi +%10.', on: () => SS.assist('tolga') },
};

/* =========================================================
   A3 · BEKLENMEDİK MASRAFLAR
   ========================================================= */
const BILLS = [
  { id: 'engine', name: 'Motor arızası', easy: 'Paslı Pelikan sabah öksürerek uyandı. Motor bloğundan "tık-tık-pıss" sesi geliyor. Vida Usta\'nın ilk tahmini: {a}.', hard: 'Motor bloğunda çatlak var. Uçmaya devam edersen ortada kalırsın. Onarım bedeli: {a}.' },
  { id: 'tax', name: 'Vergi denetimi', easy: 'İstasyon vergi dairesi "hurdacılık geliri beyanı" diye bir form keşfetti. Formun kendisi bile {a}.', hard: 'Vergi memuru kapına dayandı. Beyan etmediğin gelir için ceza ve harç: {a}.' },
  { id: 'medical', name: 'Tıbbi fatura', easy: 'Geçen haftaki "küçük" sıyrığın faturası geldi. Klinik yara bandına lüks vergisi koymuş: {a}.', hard: 'Klinik geçmiş tedavilerin faturasını kesti. Sigortan kapsamıyor: {a}.' },
  { id: 'leak', name: 'Kapsülde su kaçağı', easy: 'Yatağının altından küçük bir şelale akıyor. Çok huzurlu, çok pahalı: {a}.', hard: 'Su borusu patladı, komşunun tavanına sızdı. Hasar bedeli: {a}.' },
  { id: 'customs', name: 'Gümrük cezası', easy: 'Gümrük robotu ambarında "şüpheli derecede sevimli" bir parça buldu. Ceza: {a}.', hard: 'Gümrük ambarındaki bir parçanın evrakını eksik buldu. Ceza: {a}.' },
  { id: 'filter', name: 'Hava filtresi', easy: 'Oksijen filtresi pes etti. Pıtırcık\'ın tüyleri de suçlu ama o inkâr ediyor. Değişim: {a}.', hard: 'Hava filtren tıkandı. Değiştirmezsen nefesin kesilecek. Fiyat: {a}.' },
];
SS.BILLS = BILLS;
SS.billAmount = () => {
  const cap = (320 + S.day * 16) * (1 + S.tier * .6) * cmul();
  return Math.round(clamp(S.cash * rnd(.2, .3), 100 * cmul(), cap) / 5) * 5;
};
// Karar durumu bir şekilde boşsa (eski kayıt, test) güvenli bir fatura üret
const curBill = () => S.bill || (S.bill = { id: BILLS[0].id, name: BILLS[0].name, amt: SS.billAmount(), day: S.day, done: false });
const billText = (b, amt) => ({ easy: b.easy.replace('{a}', fmt(amt)), hard: b.hard.replace('{a}', fmt(amt)) });
SS.DECISIONS.push({ id: 'bill', urgent: true, title: 'Beklenmedik Masraf',
  when: () => !!(S.bill && !S.bill.done),
  get text() { const b = S.bill ? BILLS.find(x => x.id === S.bill.id) || BILLS[0] : BILLS[0]; return billText(b, S.bill ? S.bill.amt : 0); },
  opts: [
    { label: 'Hemen öde', need: () => S.bill && S.cash >= S.bill.amt, run() { const a = curBill().amt; S.cash -= a; S.bill.done = true; return { easy: `Ödedin: ${fmt(a)}. Cüzdanın kısa bir yas tuttu.`, hard: `${fmt(a)} ödendi. Bir sorun daha kapandı.` }; } },
    { label: 'Ertele (7 gün sonra %25 fazlası)', run() { const a = Math.round(curBill().amt * 1.25); (S.billLater = S.billLater || []).push({ amt: a, due: S.day + 7, name: S.bill.name }); S.bill.done = true; return { easy: `Erteledin. 7 gün sonra akşam defterine ${fmt(a)} olarak düşecek.`, hard: `Ödeme ${S.day + 7}. güne kaldı: ${fmt(a)}. Unutma, unutmazlar.` }; } },
    { label: 'Kendin uğraş (tamir mini oyunu)', run() { const B = curBill(); S.billFix = { amt: B.amt, name: B.name }; S.bill.done = true; return { easy: 'Kolları sıvadın. Haritadaki 🔧 düğmesiyle onarıma başla: başarırsan faturanın sadece %40\'ını ödersin. Bu gece başlamazsan fatura tam ödenir.', hard: 'Kendin yapacaksın. Haritadaki 🔧 düğmesinden başla: başarırsan %40, başaramazsan tamamı. Bu gece yapmazsan tamamı.' }; } },
  ] });
// Kendin onar: 1 saat, 10 enerji; başarıda %40, başarısızlıkta tamamı ödenir
ACT.billFix = () => {
  const f = S.billFix; if (!f) return;
  const blk = SS.jobBlock(10, 60); if (blk) return SS.toast(blk, 'bad');
  SS.closeModal(); SS.useJob(10, 60); SS.save();
  SS.Games.repair({ size: 5, what: f.name, mods: [], pay: 0 }, res => {
    const amt = res.ok ? Math.round(f.amt * .4) : f.amt; S.billFix = null; SS.charge(amt);
    SS.ui.resultModal(res.ok ? `Onarıldı · ${fmt(amt)} ödendi` : `Olmadı · ${fmt(amt)} ödendi`, `<p>${res.ok ? `Kendi ellerinle hallettin; ${fmt(f.amt - amt)} cebinde kaldı.` : 'Usta çağırmak zorunda kaldın. Faturanın tamamı ödendi.'}</p>`, res.ok);
  });
};

/* =========================================================
   B5 · ARA KİLOMETRE TAŞLARI (8–10 günde bir)
   ========================================================= */
const albumN = () => Object.keys(S.album || {}).length;
const repSum = () => ['scrap', 'deliver', 'repair', 'sort'].reduce((a, k) => a + SS.repLvl(k), 0);
const MILES = [
  { id: 'variety', ok: () => SS.hasLic('deliver') && SS.hasLic('repair') && SS.hasLic('sort'), txt: () => 'Teslimat, tamir ve ayrıştırmadan en az birer iş yap',
    snap: () => ({ d: S.stats.deliver, r: S.stats.repair, s: S.stats.sort }), prog: b => [(S.stats.deliver > b.d) + (S.stats.repair > b.r) + (S.stats.sort > b.s), 3] },
  { id: 'album', ok: () => SS.hasLic('scrap2') && albumN() < 40, txt: () => '2 yeni antik eser bul', snap: () => ({ a: albumN() }), prog: b => [albumN() - b.a, 2] },
  { id: 'rex', ok: () => true, txt: () => 'Haftalık yarışta Rex\'i bir kez yen', snap: () => ({ w: S.stats.rexWins || 0 }), prog: b => [(S.stats.rexWins || 0) - b.w, 1] },
  { id: 'earn', ok: () => true, txt: m => `Bu dönemde ${fmt(m.n)} kazan`, n: () => Math.round((280 + S.day * 11) * (1 + S.tier * .5) * 6 / 50) * 50, snap: () => ({ e: S.stats.earned }), prog: (b, m) => [S.stats.earned - b.e, m.n] },
  { id: 'rep', ok: () => repSum() < 20, txt: () => 'Herhangi bir iş itibarını 1 seviye yükselt', snap: () => ({ r: repSum() }), prog: b => [repSum() - b.r, 1] },
  { id: 'orders', ok: () => SS.hasLic('order'), txt: () => '3 sipariş teslim et', snap: () => ({ o: S.stats.orders || 0 }), prog: b => [(S.stats.orders || 0) - b.o, 3] },
  { id: 'hunts', ok: () => true, txt: () => '3 hurda sözleşmesi tamamla', snap: () => ({ h: S.stats.hunts || 0 }), prog: b => [(S.stats.hunts || 0) - b.h, 3] },
  { id: 'debt', ok: () => S.loan > 0, txt: m => `Borçtan ${fmt(m.n)} öde`, n: () => Math.min(S.loan, Math.round((300 + S.day * 10) * (1 + S.tier * .5) * 3 / 50) * 50), snap: () => ({ l: S.loan }), prog: (b, m) => [Math.max(0, b.l - S.loan), m.n] },
];
SS.MILES = MILES;
const mileDef = () => S.mile && MILES.find(x => x.id === S.mile.id);
SS.mileProgress = () => { const d = mileDef(); if (!d) return [0, 1]; const [c, t] = d.prog(S.mile.base, S.mile); return [clamp(c, 0, t), t]; };
SS.startMile = () => {
  const last = S.mile && S.mile.id, pool = MILES.filter(m => m.ok() && m.id !== last);
  if (!pool.length) return;
  const d = pick(pool), m = { id: d.id, start: S.day, due: S.day + rint(8, 10) - 1, reward: Math.round((220 + S.day * 9) * (1 + S.tier * .5) / 10) * 10 };
  if (d.n) m.n = d.n();
  m.base = d.snap(); m.txt = d.txt(m); S.mile = m;
};
SS.checkMile = () => {
  if (!S.mile || S.mile.done) return;
  const [c, t] = SS.mileProgress();
  if (c >= t) {
    S.mile.done = true; SS.earn(S.mile.reward); SS.mood(6); S.stats.miles = (S.stats.miles || 0) + 1; S.mileNext = S.day + 1;
    SS.toast(`Kilometre taşı: ${S.mile.txt} (+${fmt(S.mile.reward)})`, 'ach'); SS.sfx && SS.sfx('big');
  }
};
const _goals = SS.checkGoals;
SS.checkGoals = () => { _goals(); try { SS.checkMile(); } catch (e) {} };

/* =========================================================
   B8 · BARIŞMA KARARLARI
   ========================================================= */
const RECON = {
  pit: { title: 'Pıtırcık Küstü', easy: 'Pıtırcık bütün gün kanepenin altında. Ekranında sadece "…" yazıyor. Seni görünce kuyruğunu çevirdi.', hard: 'Pıtırcık şarj yuvasından çıkmıyor. Sana bakmıyor bile. Yalnız kaldığını hissediyor.' },
  ela: { title: 'Ela Kırgın', easy: 'Ela kapısına "KAPTANLAR GİREMEZ" yazmış. Altına küçük harflerle: "belki kurabiyeyle".', hard: 'Ela seninle konuşmuyor. Masada yarım bırakılmış bir resim var: ikiniz, ama sen silinmişsin.' },
  tolga: { title: 'Tolga Mesafeli', easy: 'Tolga son günlerde espri yapmıyor. Bu çok korkutucu. Bir şeyler ters.', hard: 'Tolga kantinde başka mürettebatlarla konuşuyor. Bir şeyler arıyor gibi.' },
};
for (const [id, R] of Object.entries(RECON)) SS.DECISIONS.push({ id: 'recon_' + id, who: id, urgent: true, title: R.title,
  when: () => SS.hasCrew(id) && S.crew[id].bond < 35 && !(id === 'tolga' && S.crew[id].bond < 25),
  text: { easy: R.easy, hard: R.hard },
  opts: [
    { label: 'Birlikte vakit geçir (1 saat)', need: () => SS.timeOk(60), run() { SS.passTime(60); SS.bond(id, 15); SS.mood(3); return { easy: `${SS.comp(id).name} ile bir saat geçirdin. Buz çözüldü. Bağ +15.`, hard: `Konuştunuz. Kolay değildi ama gerekliydi. Bağ +15.` }; } },
    { label: 'Küçük bir hediye al (₡80)', need: () => S.cash >= 80, run() { S.cash -= 80; SS.bond(id, 18); return { easy: `Hediye tam isabet. ${SS.comp(id).name} hâlâ küs gibi yapıyor ama gülümsüyor. Bağ +18.`, hard: `Hediyeyi sessizce aldı. Bir şey demedi ama gözleri yumuşadı. Bağ +18.` }; } },
    { label: 'Şimdi olmaz', run() { SS.bond(id, -3); return { easy: 'Ertelemek çözüm değil ama bugünlük öyle oldu. Bağ -3.', hard: 'Yine erteledin. Bağ -3.' }; } },
  ] });

/* =========================================================
   GÜN DÖNGÜSÜ KANCALARI
   ========================================================= */
const JOB_NAMES = { deliver: 'Teslimat', repair: 'Tamir', sort: 'Ayrıştırma', hunt: 'Hurda sözleşmesi' };
SS.JOB_NAMES = JOB_NAMES;
const _newDay = SS.newDay;
SS.newDay = notes => {
  // günün işi (ilan panosu yenilenmeden önce seçilir)
  const types = ['deliver', 'repair', 'sort'].filter(t => SS.hasLic(t));
  S.dailyJob = types.length ? pick(types) : null;
  // beklenmedik masraf
  if (!S.nextBill) S.nextBill = S.day + rint(8, 12);
  if (S.day >= S.nextBill && S.day >= 6 && (!S.bill || S.bill.done)) {
    const b = pick(BILLS); S.bill = { id: b.id, name: b.name, amt: SS.billAmount(), day: S.day, done: false };
    S.nextBill = S.day + rint(10, 14);
  }
  _newDay(notes);
  if (S.decision === 'bill' && S.bill) S.bill.shown = true;
  // kilometre taşı
  if (S.mile && !S.mile.done && S.day > S.mile.due) { notes.push(`Kilometre taşı kaçtı: ${S.mile.txt}. Yenisi geldi.`); S.mile = null; }
  if ((!S.mile || S.mile.done) && S.day >= 3 && S.day >= (S.mileNext || 0)) SS.startMile();
  if (S.bulletin) { S.bulletin.notes = notes.slice(); S.bulletin.mile = S.mile && !S.mile.done && S.mile.start === S.day ? S.mile.txt : null; S.bulletin.dailyJob = S.dailyJob; S.bulletin.lucky = SS.luckyNight(); }
};
SS.billLaterDue = () => (S.billLater || []).filter(b => b.due === S.day);
const _ledger = SS.ledger;
SS.ledger = () => {
  const L = _ledger();
  SS.billLaterDue().forEach((b, i) => L.splice(1, 0, { id: 'billlate' + i, name: `Ertelenen masraf: ${b.name}`, amt: b.amt, req: true }));
  if (S.bill && !S.bill.done && S.bill.shown) L.splice(1, 0, { id: 'billnow', name: `Ödenmemiş masraf: ${S.bill.name}`, amt: S.bill.amt, req: true });
  if (S.billFix) L.splice(1, 0, { id: 'billfix', name: `Onarılmayan arıza: ${S.billFix.name}`, amt: S.billFix.amt, req: true });
  return L;
};
const _sleep = SS.sleep;
SS.sleep = sel => {
  const d0 = S.day, bonds = Object.fromEntries(SS.crewList().map(id => [id, S.crew[id].bond]));
  const res = _sleep(sel);
  S.billLater = (S.billLater || []).filter(b => b.due > d0);
  if (S.bill && !S.bill.done && S.bill.shown) S.bill.done = true;
  S.billFix = null;
  // bağ uyarısı: 40'ın altına ilk düşüşte haber ver
  S.bondWarn = S.bondWarn || {};
  for (const id of SS.crewList()) {
    const b = S.crew[id].bond;
    if (b < 40 && (bonds[id] || 0) >= 40 && !(S.bondWarn[id] && S.day - S.bondWarn[id] < 5)) {
      S.bondWarn[id] = S.day;
      const msg = `${SS.comp(id).name} ile bağın zayıflıyor (bağ ${b}). 35'in altında küser${id === 'tolga' ? ', 25\'in altında gitmek ister' : ''}. "Dinlensin" görevi, hediye ya da birlikte vakit bağı toparlar.`;
      res.notes.push(msg); if (S.bulletin && S.bulletin.day === S.day) S.bulletin.notes.push(msg);
    }
  }
  return res;
};

/* =========================================================
   B6 · ESER TAKASI (Zara'nın koleksiyon masası)
   ========================================================= */
SS.tradeRelics = () => S.cargo.map((c, i) => c.kind === 'relic' ? i : -1).filter(i => i >= 0);
SS.tradeTarget = () => {
  // en az eseri eksik kalan setten başlayarak, henüz bulunmamış bir eser
  const sets = SS.SETS.map(s => { const Z = SS.ZONES.find(z => z.id === s.zone); return Z.relics.filter(r => !S.album[r]); }).filter(a => a.length).sort((a, b) => a.length - b.length);
  return sets.length ? sets[0][0] : null;
};
ACT.relicTrade = () => {
  const idx = SS.tradeRelics(), target = SS.tradeTarget();
  if (idx.length < 2 || !target) return SS.toast('Takas için kargonda en az 2 eser olmalı.', 'bad');
  const give = idx.slice(0, 2).sort((a, b) => b - a), names = give.map(i => SS.RELICS[S.cargo[i].relic].name);
  give.forEach(i => S.cargo.splice(i, 1));
  const Z = SS.ZONES.find(z => z.relics.includes(target));
  SS.addCargo('relic', SS.ITEMS.relic.val * Z.mult * .8, { relic: target });
  S.aff.zara = Math.min(100, (S.aff.zara || 0) + 2);
  SS.save(); SS.flow();
  SS.toast(`${names.join(' + ')} → ${SS.RELICS[target].name}`, 'good');
};
const _market = SS.VIEWS.market;
SS.VIEWS.market = () => {
  let h = _market();
  const idx = SS.tradeRelics(), target = SS.tradeTarget();
  if (target && (idx.length || Object.keys(S.album).length)) {
    const setsN = Object.keys(S.setsDone || {}).length;
    h += panel('Koleksiyon masası', `<div class="row-i">${face('zara', 44)}<p>${SS.fun() ? '"İki eser getir, sana albümünde olmayan birini vereyim. Koleksiyoncular arası dayanışma! Biraz da kâr."' : '"İki eser ver, bir eksiğini al. Pazarlık yok."'}</p></div>
      <p class="muted">Kargondaki 2 eseri, albümünde olmayan 1 eserle değiştirir (en çok tamamlanmaya yakın setten). Yeni eser kargona girer; istersen satarsın. Tamamlanan her set satışlara kalıcı +%3 verir${setsN ? ` · şu an +%${setsN * 3}` : ''}.</p>
      <div class="row">${btn(`Takas et (kargoda ${idx.length} eser)`, 'relicTrade', {}, 'sm primary', idx.length < 2)}</div>`, { code: 'TKS' });
  }
  return h;
};

/* =========================================================
   A1 · GEMİ ALIMI ÖNCESİ MASRAF UYARISI
   ========================================================= */
SS.weeklyCost = tier => {
  const m = SS.M(), cm = m.cm;
  return Math.round(m.dock * [1, 2.5, 4][tier]) + Math.round([45, 120, 210][tier] * cm);
};
SS.shipReserve = tier => {
  const m = SS.M(), cm = m.cm, daily = Math.round(m.oxygen * (S.home === 2 ? 1.3 : 1)) + Math.round(14 * cm) + Math.round(SS.crewDaily()) + Math.round([12, 16, 22][S.home] * cm);
  return Math.round((SS.weeklyCost(tier) * 2 + daily * 14 + m.rent * SS.HOMES[S.home].rent + [0, 140, 300][S.home] * cm) / 50) * 50;
};
const _buyShip = ACT.buyShip;
ACT.buyShip = d => {
  if (d.ok) { SS.closeModal(); return _buyShip(d); }
  const nx = SS.nextShip(); if (!nx || SS.shipBlock()) return _buyShip(d);
  const t = S.tier + 1, cost = SS.shipCost(), bank = d.b === '1' && S.cash < cost;
  const after = bank ? 0 : S.cash - cost, reserve = SS.shipReserve(t), wNow = SS.weeklyCost(S.tier), wNew = SS.weeklyCost(t);
  const inst = bank ? Math.max(300, Math.round((cost - S.cash) * SS.BANK.rate / 10) * 10) : 0;
  SS.modal(`<p class="eyebrow">Tersane · son kontrol</p><h2>${nx.name}</h2>
    <ul class="kv"><li><span>Ödenecek</span><b>${fmt(bank ? S.cash : cost)}${bank ? ` + banka kredisi ${fmt(cost - S.cash)}` : ''}</b></li>
    <li><span>Satın aldıktan sonra nakit</span><b>${fmt(after)}</b></li>
    <li><span>Haftalık rıhtım + bakım</span><b>${fmt(wNow)} → ${fmt(wNew)}</b></li>
    ${bank ? `<li><span>Aylık banka taksiti</span><b>${fmt(inst)}</b></li>` : ''}
    <li><span>Önerilen rezerv (2 hafta)</span><b>${fmt(reserve)}</b></li></ul>
    <p class="muted">İlk 7 gece rıhtım ve gemi bakımı yarı fiyat. Yeni gemi daha büyük kazandırır ama masrafı da büyüktür.</p>
    ${after < reserve ? `<div class="alert">Satın aldıktan sonra elinde ${fmt(after)} kalacak; önerilen rezervin altında. Gecikme riskine dikkat: birkaç gün daha biriktirmek isteyebilirsin.</div>` : '<div class="alert info">Rezervin yeterli görünüyor.</div>'}
    <div class="row">${btn('Satın al', 'buyShip', { b: d.b || '0', ok: 1 }, 'primary')}${btn('Vazgeç', 'close', {}, 'ghost')}</div>`);
};

/* =========================================================
   C10 · KUMARHANE: KASA AVANTAJI VE ŞANSLI GECE
   ========================================================= */
SS.luckyNight = () => !!window.S && S.day % 7 === 5;

/* =========================================================
   ARAYÜZ · 1 uyku kısayolu
   ========================================================= */
// 18:00'den önce basılırsa önce sorar (yanlışlıkla erken uyumayı önler)
SS.EARLY_SLEEP = 18 * 60;
ACT.goSleep = d => {
  if (S.over) return SS.flow();
  if (S.time < SS.EARLY_SLEEP && !(d && d.ok)) return SS.modal(`<p class="eyebrow">Erken uyku · ${SS.clock()}</p><h2>Şimdiden uyumak mı?</h2>
    <p>Daha ${dur(SS.EARLY_SLEEP - S.time)} var, erken uyumak istediğine emin misin?</p>
    <div class="row">${btn('Devam et', 'goSleep', { ok: 1 }, 'primary')}${btn('Vazgeç', 'close', {}, 'ghost')}</div>`, '', { dismiss: true });
  SS.closeModal();
  if (S.loc !== 'home') { ACT.go({ to: 'home' }); if (S.loc !== 'home') return; }
  S.view = 'home'; render(); ACT.ledger();
};

/* =========================================================
   ARAYÜZ · 2 rota planı
   ========================================================= */
let RT = null;
const routeCost = list => { let from = S.loc, min = 0, en = 0, t = S.time; const legs = [];
  for (const id of list) { const c = SS.travelCostFrom(from, id); min += c.min; en += c.energy; t += c.min; legs.push({ id, min: c.min, en: c.energy, open: id === 'home' || SS.isOpen(id, t) }); from = id; }
  return { min, en, legs }; };
function routeModal() {
  const rc = routeCost(RT);
  SS.modal(`<p class="eyebrow">Rota planı · ${SS.clock()}</p><h2>Nereye uğrayacaksın?</h2>
    <p class="muted">Sırayla dokun; durak eklenir, tekrar dokununca çıkar. Plan ekranın üstündeki şeritte "Sıradaki" olarak görünür.</p>
    <div class="gnav">${SS.LOCS.filter(l => l.id !== S.loc).map(l => { const k = RT.indexOf(l.id); return `<button class="chip ${k >= 0 ? 'on' : ''}" data-act="routeTog" data-id="${l.id}">${k >= 0 ? `${k + 1}. ` : ''}${l.name}</button>`; }).join('')}</div>
    ${RT.length ? `<ul class="kv">${rc.legs.map((g, i) => `<li class="${g.open ? '' : 'neg'}"><span>${i + 1}. ${SS.loc(g.id).name}${g.open ? '' : ' · varışta kapalı'}</span><b>${g.min} dk · ${g.en} en</b></li>`).join('')}<li><span>Toplam yol</span><b>${dur(rc.min)} · ${rc.en} enerji</b></li></ul>` : ''}
    <div class="row">${btn(RT.length ? 'Rotayı başlat' : 'Durak seç', 'routeGo', {}, 'primary', !RT.length)}${S.route && S.route.length ? btn('Rotayı sil', 'routeClear', {}, 'ghost') : ''}${btn('Kapat', 'close', {}, 'ghost')}</div>`, '', { dismiss: true });
}
ACT.route = () => { RT = (S.route || []).slice(); routeModal(); };
ACT.routeTog = d => { if (!RT) RT = []; const k = RT.indexOf(d.id); if (k >= 0) RT.splice(k, 1); else if (RT.length < 5) RT.push(d.id); routeModal(); };
ACT.routeClear = () => { S.route = []; RT = []; SS.closeModal(); render(); };
ACT.routeGo = () => { S.route = (RT || []).slice(); SS.closeModal(); ACT.routeNext(); };
ACT.routeNext = () => {
  if (!S.route || !S.route.length) return;
  const to = S.route[0];
  if (to === S.loc) { S.route.shift(); return ACT.routeNext(); }
  ACT.go({ to });
  if (S.loc === to) S.route.shift();
  render();
};

/* =========================================================
   ARAYÜZ · 3 otomatik yakıt ve satış
   ========================================================= */
const prefs = SS.prefs;
if (prefs.autoFuel === undefined) prefs.autoFuel = true;
if (prefs.autoSell === undefined) prefs.autoSell = false;
if (prefs.haptic === undefined) prefs.haptic = true;
SS.savePrefs = () => { try { localStorage.setItem('space-scrapper-prefs', JSON.stringify(prefs)); } catch (e) {} };
// Otomatik yakıt: ihtiyaç varsa tankı (parası yettiğince) doldurur
SS.autoFuelFor = need => {
  if (!prefs.autoFuel || S.fuel >= SS.tankCap()) return 0;
  if (S.fuel >= need && S.fuel >= SS.tankCap() * .5) return 0;
  // akşam masrafları için en az ₡150 bırakır; buna yetmezse yalnızca gereken kadar alır
  const p = SS.fuelPrice(), want = SS.tankCap() - S.fuel, spare = Math.floor(Math.max(0, S.cash - 150) / p);
  let n = Math.min(want, spare);
  if (S.fuel + n < need) n = Math.min(want, Math.floor(S.cash / p), need - S.fuel);
  if (n <= 0 || S.fuel + n < need) return 0;
  SS.spend(n * p); S.fuel += n; SS.toast(`Otomatik yakıt: +${n} (${fmt(n * p)})`);
  return n;
};
SS.fuelShort = need => S.fuel < need && !(prefs.autoFuel && S.fuel + Math.floor(S.cash / SS.fuelPrice()) >= need);
// Otomatik satış: ambar %60'tan doluysa eser ve açık siparişlerde istenenler dışındakileri %5 aracı payıyla satar
SS.autoSellCargo = () => {
  if (!prefs.autoSell || SS.cargoUsed() < SS.cargoCap() * .6) return 0;
  const keep = {}; (S.board || []).filter(b => b.type === 'order' && !b.done).forEach(b => { keep[b.kind] = Math.max(keep[b.kind] || 0, b.qty); });
  const idx = []; S.cargo.forEach((c, i) => { if (c.kind === 'relic') return; if (keep[c.kind] > 0) { keep[c.kind]--; return; } idx.push(i); });
  if (!idx.length) return 0;
  const n = idx.length, got = SS.sellIdx(idx, .95); SS.toast(`Otomatik satış: ${n} parça, ${fmt(got)} (%5 aracı payı)`, 'good');
  return got;
};
const _job = ACT.job;
ACT.job = d => {
  const b = S.board.find(x => x.id === d.id);
  if (b && !b.done && (b.type === 'hunt' || b.type === 'deliver') && !SS.jobBlock(b.energy, b.dur)) { SS.autoFuelFor(b.fuel); if (b.type === 'hunt') SS.autoSellCargo(); }
  return _job(d);
};
const _scrap = ACT.scrap;
ACT.scrap = d => {
  const z = SS.ZONES.find(x => x.id === d.z);
  if (z && !SS.jobBlock(SS.COST.scrap, SS.DUR.scrap)) { SS.autoFuelFor(z.fuel); SS.autoSellCargo(); }
  SS._lastDive = d.z;
  return _scrap(d);
};

/* =========================================================
   ARAYÜZ · 4 iş verimi
   ========================================================= */
SS.jobEst = b => {
  const mins = b.dur || 60;
  let pay = b.pay || 0;
  if (b.type === 'hunt') pay = b.fee + b.per * b.qty * .85 + b.fee * .5 * .6;
  else if (b.type === 'sort') pay = b.per * b.time * .42; // bant %25 yavaş: saniyede daha az parça
  else if (b.type === 'deliver') pay = b.pay * 1.0;
  else if (b.type === 'repair') pay = b.pay * .9;
  return { pay, mins, perHour: pay / mins * 60, perEn: b.energy ? pay / b.energy : 0 };
};

/* =========================================================
   ARAYÜZ · 5 günlük plan şeridi
   ========================================================= */
SS.planStrip = () => {
  if (!window.S || S.over) return '';
  const left = Math.max(0, SS.DAY_END - S.time), jobs = Math.max(0, Math.min(Math.floor(left / 100), Math.floor(S.energy / 18)));
  const here = SS.loc(S.view) || SS.loc(S.loc), closeIn = here && here.id !== 'home' && here.open[1] < 26 ? here.open[1] * 60 - S.time : 999;
  const parts = [`<span>⏱ <b>${left >= 60 ? Math.floor(left / 60) + ' sa ' : ''}${left % 60} dk</b> kaldı</span>`, `<span>≈ <b>${jobs}</b> iş daha</span>`];
  if (closeIn > 0 && closeIn <= 60) parts.push(`<span class="neg">${here.name} ${closeIn} dk sonra kapanıyor</span>`);
  if (S.dailyJob) parts.push(`<span>Günün işi: <b>${JOB_NAMES[S.dailyJob]}</b> +%25</span>`);
  if (S.route && S.route.some(id => !SS.loc(id))) S.route = S.route.filter(id => SS.loc(id));
  const route = S.route && S.route.length ? `<button class="plan-go" data-act="routeNext">▶ ${SS.loc(S.route[0]).name}${S.route.length > 1 ? ` <small>+${S.route.length - 1}</small>` : ''}</button>` : '';
  return `<div class="plan">${parts.join('')}${route}</div>`;
};

/* =========================================================
   ARAYÜZ · 7 borç takvimi
   ========================================================= */
SS.upcoming = days => {
  const d0 = S.day, out = [];
  try {
    for (let d = d0; d < d0 + days; d++) {
      S.day = d;
      const L = SS.ledger().filter(i => i.req && i.id !== 'oxy' && i.id !== 'billnow' && i.id !== 'billfix');
      if (SS.hasCrew('ela') && d % 7 === 0) { const s = SS.ledger().find(i => i.id === 'school'); if (s) L.push(s); }
      if (L.length) out.push({ day: d, items: L.map(i => ({ name: i.name, amt: i.amt })) });
    }
  } finally { S.day = d0; }
  return out;
};
ACT.debtCal = () => {
  const m = SS.M(), up = SS.upcoming(28), oxy = Math.round(m.oxygen * (S.home === 2 ? 1.3 : 1));
  const left = m.deadline && S.loan > 0 ? m.deadline - S.day + 1 : 0;
  SS.modal(`<p class="eyebrow">Borç ve ödeme takvimi · Gün ${S.day}</p><h2>${S.loan > 0 ? (S.lender === 'bank' ? 'Banka kredisi' : 'Krell borcu') : 'Borcun yok'}</h2>
    <ul class="kv">${S.loan > 0 ? `<li><span>Kalan borç</span><b>${fmt(S.loan)}</b></li><li><span>Aylık taksit</span><b>${fmt(Math.min(S.loan, m.installment))}</b></li><li><span>Aylık faiz</span><b>%${Math.round(m.interest * 100)}</b></li>${left ? `<li class="${left <= 14 ? 'neg' : ''}"><span>Son gün</span><b>${m.deadline}. gün · ${left} gün kaldı</b></li>` : ''}` : ''}
    <li class="${S.arrears ? 'neg' : ''}"><span>Gecikmiş borç</span><b>${fmt(S.arrears)}</b></li><li class="${S.strikes ? 'neg' : ''}"><span>Gecikme sayısı</span><b>${S.strikes}/${m.strikesMax}</b></li>
    <li><span>Her gece: oksijen ve su</span><b>${fmt(oxy)}</b></li></ul>
    <p class="label">Önümüzdeki 28 gün · zorunlu ödemeler</p>
    ${up.length ? `<ul class="kv cal">${up.map(x => `<li><span><b>${x.day === S.day ? 'Bu gece' : x.day === S.day + 1 ? 'Yarın gece' : `${x.day}. gün`}</b><small>${x.items.map(i => esc(i.name)).join(' · ')}</small></span><b>${fmt(x.items.reduce((a, i) => a + i.amt, 0))}</b></li>`).join('')}</ul>` : '<p class="empty">Yakında zorunlu ödeme yok.</p>'}
    <div class="row">${S.arrears ? btn('Gecikmiş borcu öde', 'arrears', {}, 'ghost') : ''}${btn('Tamam', 'close', {}, 'primary')}</div>`, '', { dismiss: true });
};

/* =========================================================
   ARAYÜZ · 8 benzer iş
   ========================================================= */
SS.againBtn = type => {
  if (!window.S || S.over) return '';
  if (type === 'dive') {
    const z = SS.ZONES.find(x => x.id === SS._lastDive);
    if (!z || S.flags.storm || SS.jobBlock(SS.COST.scrap, SS.DUR.scrap) || SS.fuelShort(z.fuel)) return '';
    return btn(`Tekrar dal · ${z.name}`, 'scrap', { z: z.id }, 'ghost');
  }
  const b = (S.board || []).find(x => x.type === type && !x.done && !SS.jobBlock(x.energy, x.dur) && !((x.type === 'deliver' || x.type === 'hunt') && SS.fuelShort(x.fuel)) && !(x.type === 'hunt' && S.flags.storm));
  if (!b) return '';
  const pay = b.type === 'sort' ? `${fmt(b.per)}/doğru` : b.type === 'hunt' ? `${fmt(b.fee)}+` : fmt(b.pay);
  return btn(`Benzer iş · ${pay}`, 'job', { id: b.id }, 'ghost');
};

/* =========================================================
   ARAYÜZ · 9 erişilebilirlik
   ========================================================= */
SS.a11yPanel = () => {
  const tog = (k, label, desc) => `<div class="row-item"><div><b>${label}</b><small>${desc}</small></div><button class="chk ${prefs[k] ? 'on' : ''}" data-act="pref" data-k="${k}" aria-pressed="${!!prefs[k]}" aria-label="${label}">${prefs[k] ? '✓' : ''}</button></div>`;
  return panel('Kolaylık ve erişilebilirlik', `<div class="list">
    <div class="row-item"><div><b>Dil · Language</b><small>Türkçe / English</small></div><div class="row">${btn('TR', 'lang', { l: 'tr' }, SS.lang() === 'tr' ? 'primary sm' : 'ghost sm')}${btn('EN', 'lang', { l: 'en' }, SS.lang() === 'en' ? 'primary sm' : 'ghost sm')}</div></div>
    ${tog('autoFuel', 'Otomatik yakıt', 'Dalış ve teslimattan önce yakıt azsa tankı doldurur.')}
    ${tog('autoSell', 'Otomatik satış', 'Dalıştan önce ambar %60\'tan doluysa eser ve sipariş eşyaları dışındakileri %5 aracı payıyla satar.')}
    ${tog('slow', 'Yavaş mini oyunlar', 'Mini oyunlar %80 hızda akar (süreler de aynı oranda uzar).')}
    ${tog('big', 'Büyük yazı', 'Menü ve panellerde yazılar büyür.')}
    <div class="row-item"><div><b>Hareketi azalt</b><small>Geçiş, sarsıntı ve parlama efektleri kapanır. İlk açılışta telefonun ayarını izler.</small></div><button class="chk ${SS.reduceMotion() ? 'on' : ''}" data-act="motionPref" aria-pressed="${SS.reduceMotion()}" aria-label="Hareketi azalt">${SS.reduceMotion() ? '✓' : ''}</button></div>
    ${'vibrate' in navigator || SS.native() ? tog('haptic', 'Titreşim', 'Önemli anlarda telefon titrer.') : ''}
    ${tog('left', 'Solak düzeni', 'Alt çubuk, düğme sıraları ve mini oyun kontrolleri ters sıralanır.')}
  </div>`, { code: 'KL' });
};
// Hareketi azalt: ayar hiç değiştirilmediyse telefonun ayarını izler; dokununca o anki durumun tersi kalıcı olarak seçilir
ACT.motionPref = () => { prefs.reduceMotion = !SS.reduceMotion(); SS.savePrefs(); SS.applyLook(); SS.sfx && SS.sfx('click'); render(); };
ACT.pref = d => { prefs[d.k] = !prefs[d.k]; SS.savePrefs(); SS.applyLook(); SS.sfx && SS.sfx('click'); render(); };
const _look = SS.applyLook;
SS.applyLook = () => { _look(); const r = document.documentElement; r.dataset.big = prefs.big ? '1' : ''; r.dataset.left = prefs.left ? '1' : ''; };
SS.applyLook();
SS.miniSpeed = () => prefs.slow ? .8 : 1;

/* =========================================================
   ARAYÜZ · 10 bağlama duyarlı rehber
   ========================================================= */
SS.VIEW_REHBER = { map: 'where', home: 'home', jobs: 'jobs', hangar: 'ship', market: 'items', cantina: 'energy', clinic: 'energy', krell: 'costs', academy: 'academy', casino: 'casino', log: 'where' };
ACT.ctxHelp = () => SS.rehberModal(SS.VIEW_REHBER[S.view] || 'where');


/* =========================================================
   MÜŞTERİ HEDİYESİ: teslimat ve tamirde %4 şansla eser
   ========================================================= */
SS.relicGift = () => {
  if (Math.random() >= .04) return '';
  const id = SS.tradeTarget(); if (!id) return '';
  const Z = SS.ZONES.find(z => z.relics.includes(id));
  if (!SS.addCargo('relic', SS.ITEMS.relic.val * Z.mult * .8, { relic: id })) return '';
  S.stats.gifts = (S.stats.gifts || 0) + 1;
  return `<div class="alert info">Müşteri teşekkür olarak bir eser hediye etti: <b>${SS.RELICS[id].name}</b>. Albüme eklendi.</div>`;
};

/* =========================================================
   TOLGA'YA SON ŞANS: ilk "git" kararında bir kez daha kalır
   ========================================================= */
(() => {
  const d = SS.DECISIONS.find(x => x.id === 'tolga_leave'); if (!d) return;
  const go = d.opts[1], run0 = go.run;
  go.run = function () {
    if (!S.flags2) S.flags2 = {};
    if (!S.flags2.tolgaLast) { S.flags2.tolgaLast = S.day; SS.bond('tolga', 12);
      return { easy: 'Tolga kapıda durdu, çantayı yere koydu. "Bir hafta daha. Ama bir şey değişmezse gerçekten giderim." Bağ +12. Bu son şansın.', hard: 'Tolga eşikte durdu. "Bir hafta. Sonra yokum." Bağ +12. Bir daha sormayacak.' }; }
    return run0.call(this);
  };
  go.label = 'Git, şansın açık olsun';
})();

/* =========================================================
   HAFTALIK ÖZET (her 7. günün ardından bültende)
   ========================================================= */
const weekSnap = () => ({ deliver: S.stats.deliver, repair: S.stats.repair, sort: S.stats.sort, runs: S.stats.runs, hunts: S.stats.hunts || 0, earned: S.stats.earned, album: albumN(), miles: S.stats.miles || 0, decisions: S.stats.decisions });
const _newDay2 = SS.newDay;
SS.newDay = notes => {
  _newDay2(notes);
  if (!S.weekSnap) S.weekSnap = weekSnap();
  if (S.day > 1 && S.day % 7 === 1) {
    const a = S.weekSnap, b = weekSnap(), rx = (S.rexLog || []).slice(-1)[0];
    const jobs = { 'Teslimat': b.deliver - a.deliver, 'Tamir': b.repair - a.repair, 'Ayrıştırma': b.sort - a.sort, 'Hurda avı': b.runs - a.runs };
    const top = Object.entries(jobs).sort((x, y) => y[1] - x[1])[0];
    S.weekSum = { week: Math.floor((S.day - 1) / 7), earned: b.earned - a.earned, jobs, top: top && top[1] ? top[0] : null, album: b.album - a.album, miles: b.miles - a.miles,
      rex: rx ? { win: rx.win, mine: rx.mine, rex: rx.rex } : null, loan: S.loan, next: SS.nextShip() ? SS.nextShip().name : null };
    S.weekSnap = b;
    if (S.bulletin) S.bulletin.week = S.weekSum;
  }
};
SS.weekSumHtml = W => !W ? '' : `<div class="weeksum"><p class="label">${W.week}. haftanın özeti</p>
  <ul class="kv"><li><span>Kazanç</span><b>${fmt(W.earned)}</b></li>
  ${W.rex ? `<li class="${W.rex.win ? '' : 'neg'}"><span>Rex yarışı</span><b>${W.rex.win ? 'kazandın' : 'kaybettin'} · ${fmt(W.rex.mine)} / ${fmt(W.rex.rex)}</b></li>` : ''}
  <li><span>İşler</span><b>${Object.entries(W.jobs).filter(x => x[1]).map(([k, v]) => `${k} ${v}`).join(' · ') || '—'}</b></li>
  ${W.top ? `<li><span>Haftanın işi</span><b>${W.top}</b></li>` : ''}
  ${W.album ? `<li><span>Yeni eser</span><b>${W.album}</b></li>` : ''}${W.miles ? `<li><span>Kilometre taşı</span><b>${W.miles}</b></li>` : ''}
  <li><span>${W.loan > 0 ? 'Kalan borç' : 'Sıradaki hedef'}</span><b>${W.loan > 0 ? fmt(W.loan) : W.next || 'Filo tamam'}</b></li></ul>
  <div class="row">${btn('Haftayı paylaş', 'shareWeek', {}, 'sm ghost')}</div></div>`;

/* =========================================================
   YENİ KOLAYLIKLAR İPUCU (bir kez)
   ========================================================= */
const _flow = SS.flow;
SS.flow = () => {
  if (window.S && !S.over && !S.easeSeen && S.day >= 2 && S.tut == null && !SS.notes.length && !SS.pendingStory) {
    S.easeSeen = 1; SS.render();
    return SS.modal(`<p class="eyebrow">İpucu · kolaylıklar</p><h2>İşini kolaylaştıracak düğmeler</h2>
      <ul class="tips"><li><b>☾ Uyu</b> (alt çubuk): nerede olursan ol eve gidip akşam defterini açar.</li>
      <li><b>Rota</b> (haritanın altı): 5 durağa kadar plan yap; üst şeritteki ▶ seni sıradakine götürür.</li>
      <li><b>Borç</b> (üstteki çip): kalan borç, son gün ve önümüzdeki 28 günün ödeme takvimi.</li>
      <li><b>Konum adı</b> (sol üst): dokununca o yerin rehberi açılır.</li>
      <li><b>★ En verimli</b> iş kartında, <b>Benzer iş</b> iş bitince. Otomatik yakıt açık; ayarlar Seyir Defteri → Ayarlar'da.</li></ul>
      <div class="row">${btn('Anladım', 'close', {}, 'primary')}</div>`);
  }
  return _flow();
};

/* =========================================================
   ANDROID GERİ TUŞU: mini oyun → modal → harita → uygulamadan çık
   ========================================================= */
SS.onBack = () => {
  try {
    // mini oyunda: önce duraklatıp "Çık / Devam" sorar; soru açıkken geri tuşu oyuna döner
    if (document.getElementById('mini') && SS.Stage.active()) { SS.Stage.back(); return 'mini'; }
    const m = document.getElementById('modal');
    if (m && !m.hidden) { if (window.S && S.over) return 'over'; ACT.close(); return 'modal'; }
    if (window.S && S.view !== 'map') { S.view = 'map'; render(); return 'map'; }
  } catch (e) {}
  try { window.S && SS.save(); } catch (e) {}
  const n = SS.native && SS.native(); if (n) n.post({ type: 'exit' });
  return 'exit';
};

/* =========================================================
   EYLEM GİRİŞ DOĞRULAMASI: geçersiz veriyle gelen eylem sessizce yok sayılır
   ========================================================= */
const isLoc = v => !!SS.loc(v);
const has = (list, key = 'id') => v => Array.isArray(list) && list.some(x => x[key] === v);
const GUARD = {
  go: d => isLoc(d.to),
  view: d => d.v === 'map' || d.v === 'log' || isLoc(d.v),
  routeTog: d => isLoc(d.id),
  scrap: d => SS.ZONES.some(z => z.id === d.z),
  drink: d => has(SS.DRINKS)(d.id),
  eat: d => has(SS.FOOD)(d.id),
  upgrade: d => has(SS.SHIP)(d.id),
  extra: d => has(SS.EXTRAS)(d.id),
  story: d => !!(SS.STORY && SS.STORY[d.id]),
  talk: d => !!(SS.NPCS ? SS.NPCS.some(n => n.id === d.id) : S && S.aff && d.id in S.aff),
  pickTone: d => SS.TONES.some(t => t.id === d.t),
  pickDiff: d => +d.i >= 0 && +d.i < 3 && +d.j >= 0 && +d.j < 3,
  casPlay: d => ['cards', 'wheel', 'dice', 'race', 'slot'].includes(d.g),
  renameShip: () => !!document.getElementById('shipName'),
  hagOffer: () => !!document.getElementById('hagRange'),
  ltog: d => !!document.querySelector('#modal .ledger') && typeof d.id === 'string',
  task: d => ['with', 'work', 'rest'].includes(d.t),
  theme: d => SS.THEMES.some(t => t.id === d.t),
  style: d => d.s === 'pixel' || d.s === 'vector',
  tone: d => SS.TONES.some(t => t.id === d.t),
  pref: d => ['autoFuel', 'autoSell', 'slow', 'big', 'haptic', 'left'].includes(d.k),
};
for (const [k, ok] of Object.entries(GUARD)) {
  const f = ACT[k]; if (!f) continue;
  ACT[k] = (d = {}) => { let pass = false; try { pass = !!ok(d || {}); } catch (e) {} if (!pass) return; return f(d); };
}
})(window.SS);

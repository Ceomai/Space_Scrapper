// Space Scrapper — oyun durumu, ekonomi, zaman, hane, kararlar, gemiler, olaylar, hedefler, başarımlar, kayıt
(function(SS){
const KEY = 'space-scrapper-save-v3';
const rnd = SS.rnd = (a, b) => a + Math.random() * (b - a);
const rint = SS.rint = (a, b) => Math.floor(rnd(a, b + 1));
const pick = SS.pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = SS.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmt = SS.fmt = n => '₡' + Math.round(n).toLocaleString(SS.lang && SS.lang() === 'en' ? 'en-US' : 'tr-TR');

window.S = null;

/* ---------- zorluk ve ton ---------- */
// S.diff: SS.DIFF satırlarında seçilen seçeneğin sırası (0–2)
SS.dv = id => { const i = SS.DIFF.findIndex(d => d.id === id); return SS.DIFF[i].opts[S.diff[i]][1]; };
SS.hard = () => SS.dv('hazard') > 1;
SS.fun = () => S.tone !== 'grim';
SS.tx = o => (o && typeof o === 'object') ? o[SS.fun() ? 'easy' : 'hard'] : o;
SS.M = () => {
  const cm = SS.dv('costs'), hz = SS.dv('hazard'), R = SS.RULES, bank = S.lender === 'bank';
  return {
    interest: bank ? SS.BANK.interest : R.interest,
    installment: bank ? Math.max(300, Math.round(S.loanBase * SS.BANK.rate / 10) * 10) : R.installment,
    deadline: S.lender === 'krell' ? (S.deadlineOverride || R.deadline) : S.lender === 'bank' ? (S.bankDeadline || 0) : 0, strikesMax: R.strikesMax,
    cm, oxygen: Math.round(12 * cm), dock: Math.round(100 * cm), rent: Math.round(480 * cm),
    hungerDrop: cm < 1 ? 20 : cm > 1 ? 30 : 25, foodMult: cm, hospital: Math.round(350 * cm * cm),
    priceMult: SS.dv('market'), hazard: hz, dmg: hz < 1 ? .5 : hz > 1 ? 1 : .75, jobTime: hz < 1 ? 55 : hz > 1 ? 46 : 50,
  };
};
// Saat: dakika cinsinden. Gün 07:00'de başlar, 01:00'den sonra iş yapılamaz
SS.DAY_START = 420; SS.DAY_END = 1500;
SS.clock = (t = S.time) => { const h = Math.floor(t / 60) % 24, m = t % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; };
SS.timeOk = mins => S.time + mins <= SS.DAY_END;
SS.passTime = mins => { S.time += Math.round(mins); };
SS.win = () => Math.max(0, Math.min(5, Math.floor((S.time - SS.DAY_START) / 180)));
SS.winLabel = (w = SS.win()) => `${SS.clock(SS.DAY_START + w * 180)}–${SS.clock(SS.DAY_START + (w + 1) * 180)}`;
SS.DUR = { scrap: 120, deliver: [60, 80, 120, 150], repair: [45, 60, 80, 100], sortShort: 45, sortLong: 75, talk: 45, nap: 90, train: 120, workshop: 45, order: 20, decision: 90 };
SS.COST = { scrap: 25, deliver: 17, repair: 13, sortShort: 7, sortLong: 12, workshop: 10, train: 15 };
SS.SORTS = [
  { id: 'short', name: 'Kısa vardiya', time: 35, per: 2.6, speed: .9, energy: SS.COST.sortShort, desc: '35 saniye, yavaş bant, doğru başına ~₡3' },
  { id: 'long', name: 'Uzun vardiya', time: 65, per: 3.8, speed: 1.25, energy: SS.COST.sortLong, desc: '65 saniye, hızlanan bant, doğru başına ~₡4' },
];

SS.blankShip = () => Object.fromEntries(SS.SHIP.map(u => [u.id, 0]));
SS.SCRAP_VAL = .27; // hurda avı değer çarpanı (nakit işlerle denge için)
SS.newState = (diff, tone, name, crewIds) => {
  const s = {
    v: 3, diff: diff.slice(), tone, name: name || 'Kaptan', day: 1, time: 420, loc: 'home', view: 'map',
    inv: {}, buffs: {}, decor: [], rooms: {}, ability: {}, weekEarned: 0, rexTarget: 0, rexLog: [], board: [], boardWin: -1, stock: [], stockWin: -1, tolgaJob: false, pitZone: null, cooked: {},
    cash: 0, loan: SS.RULES.loan, loanStart: SS.RULES.loan, loanBase: 0, lender: 'krell', arrears: 0, strikes: 0,
    energy: 100, hunger: 70, health: 100, morale: 60, fuel: 50, cargo: [], torps: 1,
    tier: 0, ship: SS.blankShip(), upSpent: 0,
    rep: { scrap: 0, deliver: 0, repair: 0, sort: 0 }, zoneUse: {}, satur: {}, echo: [], bulletin: null,
    home: 0, extras: {}, biz: {}, skills: { pilot: 0, eng: 0, trade: 0, fit: 0 },
    aff: { gus: 0, vida: 0, zara: 0, rex: 0 }, perkGiven: {},
    crew: {}, crewOrder: crewIds.slice(), karma: 0,
    album: {}, fragments: 0, chapters: ['intro'], lostVisited: false,
    prices: { metal: 1, part: 1, mineral: 1, crystal: 1, bio: 1, relic: 1 }, trend: {},
    event: null, nextEvent: null, flags: {}, decision: null, decisionLog: {}, morning: '',
    contracts: [], repairs: [], goals: [], today: {}, drinks: {},
    ach: {}, stats: { earned: 0, runs: 0, deliver: 0, repair: 0, sort: 0, cardsBest: 0, sold: 0, decisions: 0 },
    haggleUsed: false, cardsToday: 0, freeRation: false, talked: {},
    over: null, won: false, finale: false, tab: 'hub', guideSeen: false,
    tut: 0, tease: null, teaseToday: null, arc: null, arcScore: 0, arcsDone: [], titles: [], ng: 0, perks: {},
    paint: 'klasik', paints: { klasik: true }, homeTint: 'std', shipNames: {}, daily: {}, decorStore: [],
    rules2: 1, lic: {}, course: {}, trial: null, nextTrial: 0, trialLog: [], casino: { today: 0, net: 0, chips: 0, best: 0 },
    rexMult: 1, flags2: {}, weekSnap: null, weekSum: null, easeSeen: 0, shipGrace: 0, dailyJob: null, nextBill: 0, bill: null, billLater: [], billFix: null, mile: null, mileNext: 0, bondWarn: {}, route: [],
  };
  crewIds.forEach(id => { s.crew[id] = { bond: 50, task: 'with', down: 0, gone: false, hunger: 0, sick: false, sickDays: 0 }; });
  const prev = window.S; window.S = s;
  const cm = SS.dv('costs');
  s.cash = cm < 1 ? 320 : cm > 1 ? 160 : 240;
  window.S = prev;
  return s;
};
// Koruma ağı: geçersiz (NaN/sonsuz) ya da aralık dışı değerleri onarır; hiçbir durumda oyunu bozmaz
SS.sanitize = () => {
  if (!window.S) return;
  const fix = (k, def, lo, hi) => { let v = S[k]; if (typeof v !== 'number' || !isFinite(v)) v = def; if (lo != null) v = Math.max(lo, v); if (hi != null) v = Math.min(hi, v); S[k] = v; };
  try {
    fix('cash', 0, 0); fix('loan', 0, 0); fix('arrears', 0, 0); fix('strikes', 0, 0, 3); fix('torps', 0, 0); fix('day', 1, 1);
    fix('hunger', 50, 0, 100); fix('health', 50, 0, 100); fix('morale', 50, 0, 100); fix('energy', 50, 0, SS.maxEnergy()); fix('fuel', 0, 0, SS.tankCap()); fix('time', 420, 0);
    for (const id of S.crewOrder || []) { const c = S.crew && S.crew[id]; if (c && (typeof c.bond !== 'number' || !isFinite(c.bond))) c.bond = 50; }
    for (const k in S.aff) if (typeof S.aff[k] !== 'number' || !isFinite(S.aff[k])) S.aff[k] = 0;
    if (Array.isArray(S.cargo)) S.cargo = S.cargo.filter(it => it && SS.ITEMS[it.kind] && isFinite(it.value));
  } catch (e) {}
};
// Depolama sınaması: açılışta bir kez yazıp okur. Başarısızsa arayüz kalıcı bir uyarı şeridi gösterir (SS.storeBand).
SS.storageOk = (() => { try { const k = 'space-scrapper-probe'; localStorage.setItem(k, '1'); const ok = localStorage.getItem(k) === '1'; localStorage.removeItem(k); return ok; } catch (e) { return false; } })();
let saveWarned = false;
SS.save = () => { try { if (S) { SS.sanitize(); localStorage.setItem(KEY, JSON.stringify(S)); } } catch (e) {
  // kayıt yazılamadı (depolama dolu ya da kapalı): oyuncuya bir kez söyle (açılışta kapalı bulunduysa şerit zaten söylüyor)
  if (!saveWarned) { saveWarned = true; if (SS.storageOk !== false) try { SS.toast && SS.toast('Kayıt yapılamadı: tarayıcı depolaması dolu ya da kapalı. İlerlemen bu oturumla sınırlı kalabilir.', 'bad'); } catch (e2) {} }
} };
// Okunamayan kayıt silinmez: ham metin bir kez '.bak' anahtarına kopyalanır ve başlık ekranı oyuncuya söyler (SS.loadError)
SS.BAK_KEY = KEY + '.bak';
SS.loadError = null;
SS.load = () => {
  let raw = null;
  try { raw = localStorage.getItem(KEY); } catch (e) { return null; }
  if (!raw) { SS.loadError = null; return null; }
  try { const s = JSON.parse(raw); if (s && s.v === 3) { const m = SS.migrate ? SS.migrate(s) : s; if (m) { SS.loadError = null; return m; } } throw new Error('bad save'); }
  catch (e) {
    SS.loadError = 'corrupt';
    try { if (!localStorage.getItem(SS.BAK_KEY)) localStorage.setItem(SS.BAK_KEY, raw); SS.loadError = localStorage.getItem(SS.BAK_KEY) ? 'backup' : 'corrupt'; } catch (e2) {}
  }
  return null;
};
SS.wipe = () => { try { localStorage.removeItem(KEY); } catch (e) {} };

/* ---------- gemi ve türetilmiş değerler ---------- */
SS.shipT = () => SS.SHIPS[S.tier];
SS.lvl = k => (S.ship[k] || 0) + (SS.shipT().base[k] || 0);
// Ekipman primi: hurda donanımının her seviyesi (gemiyle gelenler dahil) satışta hurda değerine +%2,5 ekler
SS.GEAR = ['claw', 'winch', 'magnet', 'radar'];
SS.gearLvl = () => SS.GEAR.reduce((a, k) => a + SS.lvl(k), 0);
SS.gearMult = () => 1 + SS.gearLvl() * .025;
// Dekorlardan gelen uyku enerjisi en fazla +15 (uyku en büyük enerji kaynağı; sınırsız yığılınca bütün dekorları eziyordu)
SS.DECOR_SLEEP_CAP = 15;
SS.sleepBonus = () => Math.min(SS.DECOR_SLEEP_CAP, (SS.decorFx ? SS.decorFx().sleep || 0 : 0)) + S.skills.fit * 3;
SS.maxEnergy = () => 100 + S.skills.fit * 10 + (SS.decorFx ? (SS.decorFx().energyMax || 0) : 0);
SS.cargoCap = () => SS.shipT().cargo + S.ship.cargo * SS.shipT().cargoStep;
SS.tankCap = () => SS.shipT().tank + S.ship.tank * SS.shipT().tankStep;
SS.upCost = (u, lv) => Math.round(u.costs[lv] * (1 + S.tier * .6) * SS.upgradeDiscount());
SS.cargoUsed = () => S.cargo.reduce((a, i) => a + Math.max(1, SS.ITEMS[i.kind].size), 0);
SS.sellMult = () => {
  let m = SS.M().priceMult;
  if (S.aff.zara >= 60) m *= 1.10; else if (S.aff.zara >= 30) m *= 1.05;
  if (S.biz.shop) m *= 1.10;
  if (SS.assist('ela')) m *= 1.03;
  return m * (1 + S.skills.trade * .03) * (1 + Object.keys(S.setsDone || {}).length * .03);
};
// Pazar doygunluğu: aynı gün aynı kategoriden her satış fiyatı %3 düşürür (en fazla %40)
SS.saturation = cat => cat === 'relic' ? 1 : Math.max(.6, 1 - .03 * (S.satur[cat] || 0));
SS.priceOf = it => Math.round(it.value * (S.prices[it.cat] || 1) * SS.sellMult() * SS.saturation(it.cat) * (it.cat === 'relic' ? 1 : SS.gearMult()));
// Bölge stoku: her dalış o bölgeyi %22 tüketir, her gece yarısı kadar yenilenir
SS.zoneStock = z => clamp(1 - (S.zoneUse[z] || 0) * .22, .35, 1);
// İş itibarı: başarılı iş sayısıyla seviye atlar, ödemeyi artırır
SS.REP_T = [0, 2, 5, 9, 14, 20];
SS.repLvl = k => SS.REP_T.filter(t => (S.rep[k] || 0) >= t).length - 1;
SS.repMult = k => 1 + SS.repLvl(k) * .04;
SS.repGain = k => { const b = SS.repLvl(k); S.rep[k] = (S.rep[k] || 0) + 1; const a = SS.repLvl(k); if (a > b) SS.toast(`İtibar yükseldi: ${{ scrap: 'Hurda', deliver: 'Teslimat', repair: 'Tamir', sort: 'Ayrıştırma' }[k]} ${a}/5`, 'ach'); };
SS.upgradeDiscount = () => S.aff.vida >= 60 ? .8 : S.aff.vida >= 30 ? .9 : 1;
SS.foodPrice = f => Math.round(f.price * SS.M().foodMult);
SS.fuelPrice = () => Math.round(3 * (SS.hard() ? 1.3 : 1) * (S.flags.fuelHike ? 1.8 : 1));
// Moral iş ücretini etkiler: 85+ ise +%5, 50 altıysa −%10
SS.moralePay = () => S.morale >= 85 ? 1.05 : S.morale < 50 ? .9 : 1;
SS.moraleTime = () => S.morale >= 70 ? 5 : S.morale < 30 ? -6 : 0;
SS.monthDay = () => (S.day - 1) % 28 + 1;
SS.daysTo = n => { const r = S.day % n; return r === 0 ? 0 : n - r; };

SS.earn = n => { n = Math.round(n); if (!isFinite(n) || n <= 0) return; S.cash += n; S.today.earned = (S.today.earned || 0) + n; S.stats.earned += n; S.weekEarned = (S.weekEarned || 0) + n; };
SS.spend = n => { n = Math.round(n); if (!isFinite(n) || n < 0 || S.cash < n) return false; S.cash -= n; return true; };
SS.charge = n => { n = Math.round(n); if (!isFinite(n) || n <= 0) return; if (S.cash >= n) S.cash -= n; else { S.arrears += Math.round((n - S.cash) * 1.1); S.cash = 0; } };
// Hurda yorgunluğu: günün ilk 3 dalışı tam değer, sonrakiler %15'er azalır (sözleşmeler dahil, Günün Avı hariç)
SS.scrapFatigue = start => { if (start) S.today.dives = (S.today.dives || 0) + 1; const n = (S.today.dives || 0) + (start ? 0 : 1); return Math.pow(.85, Math.max(0, n - 3)); };
SS.bump = (k, n = 1) => { S.today[k] = (S.today[k] || 0) + n; };
// Moral: günün ilk +10 kazanımı tam, sonrası dörtte bir işler (moral kolayca tavana yapışmasın)
SS.mood = n => {
  if (!isFinite(n)) return;
  if (n > 0 && S.today) { const used = S.today.moodUp || 0, full = Math.max(0, Math.min(n, 10 - used)); S.today.moodUp = used + n; n = full + (n - full) * .25; }
  S.morale = clamp(S.morale + n, 0, 100);
};

/* ---------- hane ---------- */
SS.comp = id => SS.COMPANIONS.find(c => c.id === id);
SS.hasCrew = id => !!(S.crew[id] && !S.crew[id].gone);
SS.crewList = () => S.crewOrder.filter(SS.hasCrew);
SS.narrator = () => SS.crewList()[0] || null;
SS.assist = id => SS.hasCrew(id) && S.crew[id].task === 'with' && !S.crew[id].down && !S.crew[id].sick;
SS.bond = (id, n) => { if (SS.hasCrew(id)) S.crew[id].bond = clamp(S.crew[id].bond + n, 0, 100); };
SS.leave = id => { if (S.crew[id]) S.crew[id].gone = true; };
SS.crewDaily = () => SS.crewList().reduce((a, id) => a + SS.comp(id).daily, 0) * SS.M().cm;
SS.afterJobCrew = () => { SS.crewList().forEach(id => { if (SS.assist(id)) SS.bond(id, 2); }); if (SS.assist('pit')) SS.mood(3); };

/* ---------- işler ve beden ---------- */
SS.jobBlock = (energy, mins = 0) => {
  if (S.over) return 'Oyun bitti.';
  if (mins && !SS.timeOk(mins)) return `Bu iş ${Math.round(mins / 60 * 10) / 10} saat sürer; gece yarısından sonrasına sarkar.`;
  if (S.time >= SS.DAY_END) return 'Gece yarısını çok geçti. Eve gidip uyuman gerek.';
  if (S.energy < energy) return `Enerjin yetmiyor (${energy} gerekli). ${SS.adsLeft && SS.adsLeft() > 0 ? `Üstteki ⚡ düğmesiyle reklam izleyip +${SS.AD.energy} enerji al, ` : ''}kestir ya da kantinde bir şeyler ye.`;
  return null;
};
SS.useJob = (energy, mins = 0) => { SS.passTime(mins); S.energy = Math.max(0, S.energy - energy); };
SS.notes = [];
SS.hurt = (n, why) => {
  n = Math.round(n * SS.M().dmg * (1 - Math.min(3, SS.lvl('hull')) * .2));
  if (n <= 0) return 0;
  S.health -= n;
  if (S.health <= 0) SS.hospital(why);
  return n;
};
SS.hospital = why => {
  const bill = SS.M().hospital;
  S.health = 45; S.time = Math.max(S.time, 1380); S.loc = 'home'; SS.mood(-15);
  SS.charge(bill);
  SS.notes.push(SS.fun()
    ? `Bayıldın ve gözlerini klinikte açtın. Hemşire robot sana yıldızlı yara bandı yapıştırdı. Fatura: ${fmt(bill)}.`
    : `Kendini klinikte buldun. ${why || 'Yaraların'} pahalıya patladı: ${fmt(bill)}. Gün bitti.`);
};
// Yiyecek ve içecekten gün içinde en fazla FOOD_E_CAP enerji gelir; kestirme ve reklam bu sınıra dahil değil
SS.FOOD_E_CAP = 35;
SS.AD = { energy: 40, perDay: 3 };
SS.foodEnergyLeft = () => Math.max(0, SS.FOOD_E_CAP - ((S.today && S.today.eatE) || 0));
SS.eat = f => {
  S.hunger = clamp(S.hunger + (f.hunger || 0), 0, 100);
  SS.mood(f.morale || 0);
  let e = f.energy || 0;
  if (e > 0 && !f.free) { e = Math.min(e, SS.foodEnergyLeft()); S.today.eatE = (S.today.eatE || 0) + e; }
  S.energy = clamp(S.energy + e, 0, SS.maxEnergy());
  S.health = clamp(S.health + (f.health || 0), 1, 100);
  if (f.id === 'meal' || f.id === 'special') SS.bump('meal');
};

/* ---------- kargo ---------- */
SS.addCargo = (kind, value, extra = {}) => {
  const T = SS.ITEMS[kind];
  if (SS.cargoUsed() + Math.max(1, T.size) > SS.cargoCap()) return false;
  S.cargo.push({ kind, value: Math.round(value), cat: T.cat, ...extra });
  if (kind === 'crystal' || kind === 'slime') SS.bump('crystal');
  if (kind === 'relic' && extra.relic && !S.album[extra.relic]) { S.album[extra.relic] = S.day; SS.checkSets(); SS.toast(`Albüme eklendi: ${SS.RELICS[extra.relic].name}`, 'good'); }
  return true;
};
SS.sellIdx = (idxs, mult = 1) => {
  let total = 0;
  idxs.sort((a, b) => b - a).forEach(i => { const it = S.cargo[i]; total += Math.round(SS.priceOf(it) * mult); S.satur[it.cat] = (S.satur[it.cat] || 0) + 1; S.cargo.splice(i, 1); });
  SS.earn(total); SS.bump('sold', idxs.length); S.stats.sold += idxs.length;
  return total;
};

/* ---------- günlük iş ilanları (kademeli) ---------- */
const DESTS = ['Ay Üssü Tetra', 'Buz Madeni K-9', 'Çiftlik Uydusu Bereket', 'Kayalık Karakol', 'Neon Kumarhane', 'Hastane Gemisi Şifa', 'Kuyruklu Yıldız Kampı'];
const CARGOS = ['tıbbi malzeme', 'dondurulmuş pizza', 'yedek reaktör', 'canlı tavuk (uzay ırkı)', 'gizli paket', 'düğün pastası', 'maden matkabı'];
SS.DELIVERY_TIERS = [
  { name: 'Kısa mesafe', diff: 1, pay: [45, 60], fuel: 6 },
  { name: 'Orta mesafe', diff: 2, pay: [75, 95], fuel: 10 },
  { name: 'Uzak sefer', diff: 3, pay: [115, 145], fuel: 15 },
  { name: 'VIP sefer', diff: 3, pay: [170, 210], fuel: 18, vip: true },
];
SS.REPAIR_TIERS = [
  { name: 'Basit', size: 4, pay: [45, 60] },
  { name: 'Standart', size: 5, pay: [70, 90] },
  { name: 'Karmaşık', size: 6, pay: [110, 135] },
  { name: 'Reaktör çekirdeği', size: 7, pay: [170, 215], vip: true },
];
const WHATS = ['Oksijen pompası', 'Asansör kontrol kartı', 'Kantin buzdolabı', 'Rıhtım kapısı', 'Su arıtıcı', 'Radyo vericisi', 'Yerçekimi jeneratörü'];
SS.genJobs = () => {
  const g = (1 + S.day / 90 + S.tier * .25) * (SS.hard() ? .95 : 1);
  const dOk = t => !t.vip || SS.repLvl('deliver') >= 3, rOk = t => !t.vip || SS.repLvl('repair') >= 3;
  S.contracts = SS.DELIVERY_TIERS.map((t, i) => ({ t, i })).filter(x => dOk(x.t)).map(({ t, i }) => {
    const fragile = t.vip || Math.random() < .3;
    return { tier: i, dest: pick(DESTS), what: pick(CARGOS), diff: t.diff, fragile, fuel: t.fuel, done: false,
      pay: Math.round(rint(t.pay[0], t.pay[1]) * g * SS.repMult('deliver') * (fragile && !t.vip ? 1.3 : 1)) };
  });
  S.repairs = SS.REPAIR_TIERS.map((t, i) => ({ t, i })).filter(x => rOk(x.t)).map(({ t, i }) => ({ tier: i, size: t.size, what: t.vip ? 'İstasyon reaktörü' : pick(WHATS), done: false, pay: Math.round(rint(t.pay[0], t.pay[1]) * g * SS.repMult('repair')) }));
};

const GOALS = [
  () => { const x = Math.round(240 * (1 + S.day / 40 + S.tier * .3) / 10) * 10; return { key: 'earned', target: x, txt: `Bugün ${fmt(x)} kazan` }; },
  () => ({ key: 'scrap', target: 1, txt: 'Bir hurda avına çık' }),
  () => ({ key: 'deliver', target: 1, txt: 'Bir kargo teslim et' }),
  () => ({ key: 'repair', target: 1, txt: 'Bir tamir işi bitir' }),
  () => ({ key: 'sort', target: 1, txt: 'Ayrıştırma tesisinde vardiya al' }),
  () => ({ key: 'crystal', target: 1, txt: 'Bir enerji kristali topla' }),
  () => ({ key: 'sold', target: 5, txt: 'Pazarda 5 eşya sat' }),
  () => ({ key: 'meal', target: 1, txt: 'Sıcak bir yemek ye' }),
  () => ({ key: 'talk', target: 1, txt: 'Kantinde biriyle sohbet et' }),
  () => ({ key: 'order', target: 1, txt: 'Bir siparişi teslim et' }),
  () => ({ key: 'hunt', target: 1, txt: 'Bir hurda sözleşmesi bitir' }),
  () => ({ key: 'travel', target: 4, txt: 'İstasyonda 4 farklı yere uğra' }),
];
SS.genGoals = () => {
  const pool = GOALS.slice(1).sort(() => Math.random() - .5);
  S.goals = [GOALS[0](), ...pool.slice(0, 2).map(f => f())].map(g => ({ ...g, done: false, reward: rint(4, 9) * 10 }));
};
SS.checkGoals = () => {
  for (const g of S.goals) if (!g.done && (S.today[g.key] || 0) >= g.target) {
    g.done = true; SS.earn(g.reward); SS.mood(4);
    SS.toast(`Günlük hedef tamam: ${g.txt} (+${fmt(g.reward)})`, 'good');
  }
};

/* ---------- olaylar ---------- */
const CAT_KEYS = ['metal', 'part', 'mineral', 'crystal', 'bio'];
SS.EVENTS = [
  { id: 'storm', bad: 1, title: 'Güneş Fırtınası',
    text: { easy: 'Güneş bugün biraz huysuz. Hurda bölgelerine çıkış yasak. İstasyonda iş bul ya da kek ye.', hard: 'Radyasyon fırtınası. Dışarı çıkan geri dönmüyor. Hurda avı bugün kapalı.' },
    run() { S.flags.storm = true; } },
  { id: 'boom', title: 'Fiyat Patlaması',
    run() { const c = pick(CAT_KEYS); S.prices[c] = clamp(S.prices[c] * 1.6, .5, 2.4); return { easy: `${SS.CATS[c]} fiyatları uçtu! Zara heyecandan gözlüğünü düşürdü.`, hard: `${SS.CATS[c]} fiyatı yükseldi. Bir şirket stok yapıyor. Fırsat bu.` }; } },
  { id: 'crash', bad: 1, title: 'Piyasa Çöküşü',
    run() { const c = pick(CAT_KEYS); S.prices[c] = clamp(S.prices[c] * .55, .4, 2); return { easy: `${SS.CATS[c]} fiyatları yerlerde. Biri pazara bir dağ dolusu boşaltmış.`, hard: `${SS.CATS[c]} değersizleşti. Elinde varsa bekle ya da zararına sat.` }; } },
  { id: 'pirates', bad: 1, title: 'Korsan Baskını',
    run() {
      if (!SS.hard()) { S.hunger = clamp(S.hunger - 20, 0, 100); return { easy: 'Korsanlar gece gemine girdi ve... sadece sandviçini çaldılar. Not bırakmışlar: "Mayonez az." Tokluk -20.', hard: 'Korsanlar gece gemine girdi ve erzağını aldı. Tokluk -20.' }; }
      const loss = Math.min(400, Math.round(S.cash * .15)); S.cash -= loss;
      let extra = '';
      if (S.cargo.length) { const i = Math.floor(Math.random() * S.cargo.length); extra = ` Kargodan ${SS.ITEMS[S.cargo[i].kind].name} da gitti.`; S.cargo.splice(i, 1); }
      return { easy: `Korsanlar rıhtımı bastı, ${fmt(loss)} götürdü ve giderken el salladı.${extra}`, hard: `Korsanlar rıhtımı bastı. ${fmt(loss)} kaybettin.${extra}` };
    } },
  { id: 'sick', bad: 1, title: 'Uzay Gribi',
    run() { S.health = clamp(S.health - 15, 1, 100); return { easy: 'Uzay gribine yakalandın. Hapşırdıkça hafifçe süzülüyorsun. Sağlık -15.', hard: 'Ateşin var. İstasyonun havası yine kirli. Sağlık -15.' }; } },
  { id: 'found', title: 'Kayıp Cüzdan',
    run() { const n = rint(30, 120); SS.earn(n); return { easy: `Kantinin koltuğunun altında ${fmt(n)} buldun. Ve bir de kanepe yaratığı. O kalsın.`, hard: `Ölü bir hurdacının dolabı boşaltılıyordu. Kimse görmeden ${fmt(n)} aldın.` }; } },
  { id: 'rain', title: 'Hurda Yağmuru',
    run() { S.flags.scrapBoost = 1.3; return { easy: 'Bir kargo gemisi gece takla atmış! Bugün hurdalar %30 daha değerli.', hard: 'Bir yolcu gemisi parçalanmış. Bugün hurdalar %30 daha değerli. Kimse sormuyor neden.' }; } },
  { id: 'festival', title: 'İstasyon Festivali',
    run() { SS.mood(15); return { easy: 'Yıldönümü festivali! Konfeti var, müzik var, robot dans yarışması var. Moral +15.', hard: 'Yönetim "Dayanışma Günü" ilan etti. Bedava çorba var. Moral +15.' }; } },
  { id: 'rexfirst', bad: 1, title: 'Rex Önden Gitti',
    run() { S.flags.rexFirst = true; return { easy: 'Rex Asteroit Kuşağı\'nı sabah 5\'te süpürmüş. Bugün orada az şey kaldı.', hard: 'Rex ve ekibi Asteroit Kuşağı\'nı boşaltmış. Bugün orada az şey var.' }; } },
  { id: 'fuel', bad: 1, title: 'Yakıt Zammı',
    run() { S.flags.fuelHike = true; return { easy: 'Yakıt bugün pahalı. Bir yakıt bürokratı hapşırmış, fiyat kaçmış.', hard: 'Yakıt kartelleri bugün fiyatı ikiye katladı.' }; } },
  { id: 'inspect', bad: 1, title: 'Lisans Denetimi',
    run() { const n = SS.hard() ? 90 : 30; SS.charge(n); return { easy: `Denetçi geminin selfie çekmeye uygun olmadığını söyledi. Ceza: ${fmt(n)}.`, hard: `Denetçi ruhsatında bir "eksik" buldu. Rüşvet ya da ceza: ${fmt(n)}.` }; } },
];
SS.rollEvent = () => {
  if (Math.random() > .45) return null;
  const hz = SS.dv('hazard');
  const pool = SS.EVENTS.map(e => ({ e, w: e.bad ? hz : 1 }));
  let r = Math.random() * pool.reduce((a, p) => a + p.w, 0);
  for (const p of pool) { r -= p.w; if (r <= 0) return p.e.id; }
  return null;
};

/* ---------- kararlar ---------- */
SS.pickDecision = () => {
  const ok = d => (!d.who || SS.hasCrew(d.who)) && (!d.when || d.when()) && !(S.decisionLog[d.id] && S.day - S.decisionLog[d.id] < 8);
  const urgent = SS.DECISIONS.find(d => d.urgent && ok(d));
  if (urgent) return urgent.id;
  if (S.day < 2 || Math.random() > .5) return null;
  const pool = SS.DECISIONS.filter(d => !d.urgent && ok(d));
  return pool.length ? pick(pool).id : null;
};
SS.curDecision = () => { if (!S.decision) return null; const d = S.decision.startsWith('arc:') ? SS.arcDecision() : SS.DECISIONS.find(x => x.id === S.decision); if (!d) S.decision = null; return d || null; };
SS.decide = i => {
  const d = SS.curDecision(); if (!d) return null;
  const o = d.opts[i]; if (!o || (o.need && !o.need())) return null;
  const res = o.run();
  S.decisionLog[d.id] = S.day; S.decision = null; S.stats.decisions++;
  if (d.arc) SS.arcAdvance();
  S.echo.push(`${d.title}: ${o.label.replace(/ \(.*\)$/, '')}`);
  SS.loanCheck();
  return { title: d.title, who: d.who, text: SS.tx(res) };
};

/* ---------- gün döngüsü ---------- */
SS.newDay = notes => {
  const echoes = S.echo.splice(0);
  S.ability = {}; S.pitZone = null; S.tolgaJob = false; S.boardWin = -1; S.stockWin = -1; S.flags = {};
  SS.applyTease();
  S.today = {}; S.haggleUsed = false; S.cardsToday = 0; S.talked = {}; S.drinks = {}; S.satur = {}; S.incomeRoll = null;
  const movers = [];
  for (const k of Object.keys(S.prices)) {
    if (k === 'relic') continue;
    const old = S.prices[k];
    S.prices[k] = clamp(old * rnd(.86, 1.16) + (1 - old) * .12, .5, 1.9);
    S.trend[k] = S.prices[k] - old;
    movers.push([k, S.trend[k]]);
  }
  S.event = null;
  const ev = S.nextEvent && SS.EVENTS.find(e => e.id === S.nextEvent);
  if (ev) {
    const res = ev.run(), text = SS.tx(res || ev.text);
    if (text) S.event = { id: ev.id, title: ev.title, text, bad: !!ev.bad };
  }
  S.nextEvent = SS.rollEvent();
  S.freeRation = S.aff.gus >= 30;
  if (S.extras.garden) S.hunger = clamp(S.hunger + 25, 0, 100);
  if (SS.perk('pit', 60)) SS.mood(5);
  const n = SS.narrator();
  S.morning = n ? pick(SS.MORNING[n][SS.fun() ? 'easy' : 'hard']) : '';
  S.morningKey = n; S.morningSeen = false;
  SS.maybeStartArc();
  const ad = SS.arcDecision(); S.decision = ad ? ad.id : SS.pickDecision();
  if (SS.rollTrial) SS.rollTrial();
  S.casino && (S.casino.today = 0);
  SS.genJobs(); SS.genGoals(); SS.refreshBoard(true); SS.refreshStock(true); SS.rexWeek(); SS.rollTease();
  const m = SS.M();
  if (m.deadline && S.loan > 0) {
    const left = m.deadline - S.day + 1;
    if (left === 28 || left === 7 || left === 3) notes.push(S.lender === 'bank' ? `Banka kredisinin süresi ${left} gün sonra doluyor. Kalan borç ${fmt(S.loan)}; dolarsa banka ${SS.SHIPS[S.tier].name}'ya el koyar.` : `Krell'in süresinin bitmesine ${left} gün kaldı.`);
  }
  movers.sort((x, y) => y[1] - x[1]);
  S.bulletin = {
    day: S.day, event: S.event, echoes, notes: notes.slice(),
    news: pick(SS.NEWS[SS.fun() ? 'easy' : 'hard']),
    up: movers[0], down: movers[movers.length - 1],
    crew: SS.crewList().map(id => ({ id, status: SS.crewStatus(id) })),
    decision: S.decision && SS.curDecision() ? SS.curDecision().title : null, tease: S.teaseToday,
  };
};

// Hane durumu: aç / hasta / arızalı / iyi
SS.crewStatus = id => {
  const c = S.crew[id];
  if (c.down) return { label: `Kapalı (${c.down} gün)`, cls: 'bad' };
  if (c.sick) return { label: `Hasta (${c.sickDays}. gece)`, cls: 'bad' };
  if (c.hunger >= 1) return { label: id === 'pit' ? 'Şarjı düşük' : 'Aç', cls: 'warn' };
  if (c.bond < 30) return { label: 'Küskün', cls: 'warn' };
  return { label: c.bond >= 70 ? 'Mutlu' : 'İyi', cls: 'good' };
};
// Gece gelirleri bir kez hesaplanır, defterde ve uykuda aynı tutar kullanılır
SS.nightIncome = () => {
  if (S.incomeRoll && S.incomeRoll.day === S.day) return S.incomeRoll.list;
  const list = [];
  for (const b of SS.BIZ) if (S.biz[b.id]) list.push({ name: b.name + ' geliri', amt: Math.round(rint(b.income[0], b.income[1]) * (SS.hard() ? .85 : 1)) });
  for (const id of SS.crewList()) {
    const c = S.crew[id], cp = SS.comp(id);
    if (c.task === 'work' && !c.down && !c.sick) {
      let mult = SS.M().priceMult;
      if (id === 'ela' && S.rooms.ela) mult *= 1.5;
      if (id === 'tolga' && S.rooms.tolga) mult *= 1.3;
      if (id === 'tolga' && c.bond >= 90) mult *= 2;
      list.push({ name: `${cp.name}: ${cp.work.name.toLowerCase()}`, amt: Math.round(rint(cp.work.pay[0], cp.work.pay[1]) * mult) });
    }
  }
  S.incomeRoll = { day: S.day, list };
  return list;
};
// Akşam defteri: bu gece ödenecek kalemler. req = zorunlu, diğerleri oyuncunun seçimi
SS.ledger = () => {
  const m = SS.M(), cm = m.cm, L = [];
  L.push({ id: 'oxy', name: 'Oksijen ve su', amt: Math.round(m.oxygen * (S.home === 2 ? 1.3 : 1)), req: true });
  const sg = SS.shipGraceOn() ? .5 : 1, sgT = sg < 1 ? ' · yeni gemi indirimi %50' : '';
  if (S.day % 7 === 0) L.push({ id: 'dock', name: 'Rıhtım ücreti (haftalık)' + sgT, amt: Math.round(m.dock * [1, 2.5, 4][S.tier || 0] * sg), req: true });
  if (S.day % 28 === 0) {
    L.push({ id: 'rent', name: 'Kira: ' + SS.HOMES[S.home].name, amt: Math.round(m.rent * SS.HOMES[S.home].rent), req: true });
    const up = SS.BIZ.reduce((a, b) => a + (S.biz[b.id] ? b.upkeep : 0), 0);
    if (up) L.push({ id: 'upkeep', name: 'İşletme bakımı', amt: up, req: true });
    if (S.loan > 0) L.push({ id: 'loan', name: (S.lender === 'bank' ? 'Banka' : 'Krell') + ' taksiti', amt: Math.min(S.loan, m.installment), req: true });
  }
  if (S.day % 7 === 0) L.push({ id: 'shipcare', name: `Gemi bakımı ve sigortası: ${SS.SHIPS[S.tier].name}${sgT}`, amt: Math.round([45, 120, 210][S.tier || 0] * cm * sg), req: true });
  if (S.day % 28 === 0 && S.home > 0) L.push({ id: 'dues', name: `Ev aidatı: ${SS.HOMES[S.home].name}`, amt: Math.round([0, 140, 300][S.home] * cm), req: true });
  if (S.day % 28 === 0 && S.extras && Object.keys(S.extras).some(k => S.extras[k])) L.push({ id: 'extras', name: 'Bahçe ve atölye bakımı', amt: Math.round(Object.keys(S.extras).filter(k => S.extras[k]).length * 60 * cm), req: true });
  L.push({ id: 'dinner', name: `Akşam yemeği: ${S.name}`, amt: Math.round(14 * cm), warn: 'Atlarsan tokluğun 15 daha düşer.' });
  L.push({ id: 'heat', name: 'Isıtma', amt: Math.max(0, Math.round([12, 16, 22][S.home] * cm) - (SS.decorFx().heat || 0)), warn: 'Kapatırsan moral -6, sağlık -3; arkadaşların hastalanabilir.' });
  for (const id of SS.crewList()) {
    const c = S.crew[id], cp = SS.comp(id);
    if (id === 'pit') L.push({ id: 'feed_pit', name: 'Pıtırcık: şarj ve yağ' + (S.rooms.pit ? ' (şarj yuvası)' : S.pitFree ? ' (premium yağ)' : ''), amt: S.rooms.pit || S.pitFree ? 0 : Math.round(cp.daily * cm), warn: 'Şarj edilmezse yarın kapalı kalır, bağ -6.' });
    else L.push({ id: 'feed_' + id, name: `${cp.name}: yemek`, amt: Math.round(cp.daily * cm), warn: 'Aç kalırsa bağ -10. İki gece üst üste aç kalan hastalanır.' });
    if (c.sick) L.push({ id: 'med_' + id, name: `İlaç: ${cp.name}`, amt: Math.round(45 * cm), warn: `İlaçsız ${3 - c.sickDays} gece daha geçerse seni terk eder.` });
  }
  if (SS.hasCrew('ela') && S.day % 7 === 0 && !(S.perks && S.perks.scholar)) L.push({ id: 'school', name: SS.comp('ela').weeklyName, amt: Math.round(SS.comp('ela').weekly * cm), warn: 'Ödemezsen Ela okuldan uzaklaştırılır: bağ -12, moral -4.' });
  return L;
};

SS.sleep = (sel) => {
  S.lastDay = { day: S.day, earned: S.today.earned || 0 };
  const m = SS.M(), R = [], notes = SS.notes.splice(0), L = SS.ledger();
  if (!sel) sel = new Set(L.filter(i => !i.req).map(i => i.id));
  let missed = false;
  // gelirler
  for (const inc of SS.nightIncome()) { SS.earn(inc.amt); R.push([inc.name, inc.amt, true]); }
  // zorunlu kalemler
  for (const it of L.filter(i => i.req)) {
    if (it.id === 'loan') {
      if (S.cash >= it.amt) { S.cash -= it.amt; S.loan -= it.amt; R.push([it.name, -it.amt, true]); }
      else { const pen = Math.round(it.amt * .1); S.loan += pen; missed = true; R.push([`${it.name} (ödenemedi, ceza ${fmt(pen)})`, -it.amt, false]); }
    } else if (S.cash >= it.amt) { S.cash -= it.amt; R.push([it.name, -it.amt, true]); }
    else { const rem = Math.round((it.amt - S.cash) * 1.1); S.cash = 0; S.arrears += rem; missed = true; R.push([it.name + ' (ödenemedi)', -it.amt, false]); }
  }
  if (S.day % 28 === 0 && S.loan > 0) { const i = Math.round(S.loan * m.interest); S.loan += i; R.push([`Borca eklenen faiz (%${Math.round(m.interest * 100)})`, i, null]); }
  SS.loanCheck();
  // seçmeli kalemler ve sonuçları
  const paid = id => sel.has(id) && L.some(i => i.id === id);
  for (const it of L.filter(i => !i.req)) {
    if (sel.has(it.id) && S.cash >= it.amt) { S.cash -= it.amt; R.push([it.name, -it.amt, true]); }
    else sel.delete(it.id);
  }
  const fun = SS.fun();
  if (!paid('dinner')) { S.hunger = clamp(S.hunger - 15, 0, 100); notes.push(fun ? 'Akşam yemeğini atladın. Mideni "tasarruf modu"na aldın.' : 'Aç yattın. Tasarruf, karnı doyurmuyor.'); }
  if (!paid('heat')) {
    SS.mood(-6); S.health = clamp(S.health - 3, 1, 100);
    notes.push(fun ? 'Isıtmayı kapattın. Pencerede buz çiçekleri var, çok estetik, çok soğuk.' : 'Isıtma kapalıydı. Gece boyunca nefesin buhar oldu.');
    for (const id of SS.crewList()) if (id !== 'pit' && !S.crew[id].sick && Math.random() < .25) { S.crew[id].sick = true; S.crew[id].sickDays = 0; notes.push(`${SS.comp(id).name} soğuktan hastalandı.`); }
  }
  for (const id of SS.crewList()) {
    const c = S.crew[id], cp = SS.comp(id);
    if (paid('feed_' + id)) c.hunger = 0;
    else if (id === 'pit') { c.down = Math.max(c.down, 1); SS.bond(id, -6); notes.push(fun ? 'Pıtırcık\'ın şarjı bitti. Sabah ekranında sadece "zZz" yazıyor.' : 'Pıtırcık şarjsız kaldı ve kapandı.'); }
    else {
      c.hunger++; SS.bond(id, -10);
      notes.push(c.hunger >= 2 ? `${cp.name} ikinci gece de aç yattı.` : (fun ? `${cp.name} aç yattı. Midesinin sesini duvardan duyabiliyorsun.` : `${cp.name} aç yattı. Bir şey demedi.`));
      if (c.hunger >= 2 && !c.sick) { c.sick = true; c.sickDays = 0; notes.push(`${cp.name} açlıktan hastalandı.`); }
    }
    if (c.sick) {
      if (paid('med_' + id)) { c.sick = false; c.sickDays = 0; notes.push(`${cp.name} ilacı aldı, iyileşiyor.`); }
      else {
        c.sickDays++; SS.bond(id, -4);
        if (c.sickDays >= 3) {
          SS.leave(id);
          notes.push(id === 'ela' ? (fun ? 'Ela teyzesinin yanına gönderildi. Giderken sana bir resim bıraktı: sen, kocaman bir kanca ve "iyileşince dönerim" yazısı.' : 'Sosyal hizmetler Ela\'yı aldı. Kapı kapandığında ev hiç olmadığı kadar sessizdi.')
            : id === 'tolga' ? (fun ? 'Tolga "ben bir hastane gemisine katılıyorum, hem tedavi hem iş" dedi ve gitti.' : 'Tolga hastalığını taşıyamadı, bir hastane gemisine bindi. Geri döneceğini sanmıyorsun.')
            : 'Pıtırcık tamir edilemedi. Hurdacılar onu parça parça aldı.');
        }
      }
    }
    if (c.down && paid('feed_pit') && id === 'pit') c.down--;
  }
  if (SS.hasCrew('ela') && S.day % 7 === 0 && !paid('school')) { SS.bond('ela', -12); SS.mood(-4); notes.push(fun ? 'Ela okul ücreti ödenmediği için bir hafta evde. "Tatil!" diyor. Sevinmiyor.' : 'Ela\'nın okul kaydı donduruldu. Sessizce kitaplarını topladı.'); }
  // hane ilişkileri
  for (const id of SS.crewList()) {
    const c = S.crew[id];
    if (c.task === 'rest') { SS.bond(id, 4); SS.mood(2); }
    c.bond = clamp(c.bond - 1, 0, 100);
  }
  if (SS.hasCrew('ela')) { const b = S.crew.ela.bond; if (b >= 60) SS.mood(5); else if (b < 30) { SS.mood(-4); notes.push(fun ? 'Ela bütün akşam odasından çıkmadı. Kapıya "GİRMEK YASAK (SEN)" yazmış.' : 'Ela akşam yemeğine gelmedi. Kapısının ardından ağladığını duydun.'); } }
  if (SS.hasCrew('pit') && Math.random() < .07 * SS.dv('hazard')) {
    const n = rint(40, 90); SS.charge(n);
    notes.push(fun ? `Pıtırcık gece mutfak robotuyla güreşmiş. Kazanan Pıtırcık, kaybeden bütçe: ${fmt(n)}.` : `Pıtırcık bir kabloyu kemirmiş, sigorta yandı. Tamir: ${fmt(n)}.`);
  }
  for (const z in S.zoneUse) S.zoneUse[z] = Math.max(0, S.zoneUse[z] - .5);
  const dfx = SS.decorFx();
  if (dfx.morale) SS.mood(dfx.morale);
  for (const id of SS.crewList()) { if (dfx.bond) SS.bond(id, dfx.bond); if (S.rooms[id]) SS.bond(id, 2); }
  if (S.pitFree) S.pitFree--;
  if (SS.perk('ela', 90)) S.morale = Math.max(40, S.morale);
  if (S.day % 7 === 0) SS.rexSettle(notes);
  if (missed) {
    S.strikes++;
    notes.push(pick(SS.KRELL[fun ? 'easy' : 'hard']));
    notes.push(`Gecikme sayın: ${S.strikes}/${m.strikesMax}. ${m.strikesMax}. gecikmede oyun biter. Gecikmiş borcu Kaptan > Finans'tan ödeyebilirsin.`);
  }
  // beden ve ruh
  const hungry = S.hunger < 25;
  S.energy = Math.min(SS.maxEnergy(), S.energy + (SS.HOMES[S.home].sleep + SS.sleepBonus()) * (hungry ? .6 : 1));
  if (S.hunger < 12) { S.health -= 10; notes.push(fun ? 'Midenin guruldaması komşuları uyandırdı. Sağlık -10.' : 'Açlık vücudunu kemiriyor. Sağlık -10.'); }
  S.hunger = clamp(S.hunger - m.hungerDrop + (paid('dinner') ? 20 : 0), 0, 100);
  S.health = clamp(S.health + (S.hunger > 50 ? 4 : 0), 0, 100);
  SS.mood(SS.HOMES[S.home].morale + (S.loan > 0 && SS.hard() ? -2 : 0) + (S.arrears > 0 ? -5 : 0));
  // Moral kendiliğinden azalır; yüksekken daha hızlı (eğlence, sohbet ve dinlenme onu yukarıda tutar)
  S.morale = clamp(S.morale - (3 + Math.max(0, S.morale - 55) / 2.5), 0, 100);
  if (S.health <= 0) SS.hospital('Açlık ve yorgunluk');
  S.day++; S.time = 420; S.loc = 'home'; S.view = 'map'; S.weekEarned = S.day % 7 === 1 ? 0 : S.weekEarned;
  if (S.strikes >= m.strikesMax) S.over = S.lender === 'bank' ? 'repo' : S.lender === 'krell' ? 'evict' : 'evict_station';
  else if (m.deadline && S.day > m.deadline && S.loan > 0) S.over = S.lender === 'krell' ? 'deadline' : 'bankdue';
  SS.sanitize();
  if (!S.over) SS.newDay(notes);
  SS.checkAch();
  return { R, notes };
};

/* ---------- finans ve gemiler ---------- */
SS.loanCheck = () => {
  if (S.loan > 0) return;
  S.loan = 0;
  if (S.lender === 'krell' && !S.won) { S.won = true; SS.unlockChapter('free'); }
  if (S.lender === 'bank') { S.bankDeadline = 0; SS.notes.push(SS.fun() ? 'Banka kredisi kapandı! Temsilci sana bir kalem hediye etti. Kalem yazmıyor.' : 'Banka kredisi kapandı. Gemi artık tamamen senin.'); SS.mood(10); }
  S.lender = null;
};
SS.payLoan = n => {
  n = Math.min(n, S.loan, S.cash); if (!isFinite(n) || n <= 0) return 0;
  S.cash -= n; S.loan -= n; SS.loanCheck(); SS.checkAch();
  return n;
};
SS.payArrears = () => {
  const n = Math.min(S.arrears, S.cash); if (n <= 0) return 0;
  S.cash -= n; S.arrears -= n;
  if (S.arrears <= 0) { S.arrears = 0; S.strikes = Math.max(0, S.strikes - 1); }
  return n;
};
SS.tradeValue = () => SS.shipT().trade + Math.round(S.upSpent * .35);
// Yeni gemi alındıktan sonraki 7 gece rıhtım ve gemi bakımı yarı fiyat
SS.shipGraceOn = () => !!(S.shipGrace && S.day < S.shipGrace);
SS.shipCost = () => { const nx = SS.nextShip(); return nx ? Math.round((nx.price - SS.tradeValue()) * (S.flags.yardSale ? .9 : 1)) : 0; };
SS.nextShip = () => SS.SHIPS[S.tier + 1] || null;
SS.shipBlock = () => {
  const nx = SS.nextShip(); if (!nx) return 'En büyük gemiye sahipsin.';
  if (S.loan > 0) return S.lender === 'krell' ? 'Önce Krell borcunu kapatmalısın.' : 'Önce banka kredisini kapatmalısın.';
  return null;
};
SS.buyShip = useBank => {
  const nx = SS.nextShip(); if (!nx || SS.shipBlock()) return false;
  const cost = SS.shipCost();
  if (S.cash >= cost) S.cash -= cost;
  else {
    if (!useBank || S.cash < cost * .2) return false;
    const debt = cost - S.cash; S.cash = 0;
    S.lender = 'bank'; S.loan = S.loanStart = S.loanBase = debt;
    // Banka kredisinin de süresi var: Martı 112, Balina 140 gün; yeni kredi gecikme sayacını sıfırlar
    S.bankDeadline = S.day + (nx.id === 'marti' ? 112 : 140); S.strikes = 0;
  }
  S.tier++; S.shipGrace = S.day + 8;
  S.ship = SS.blankShip(); S.upSpent = 0;
  S.fuel = SS.tankCap();
  // Yeni geminin ambarına sığmayan yük Zara'ya satılır
  let extra = 0, n = 0;
  while (S.cargo.length && SS.cargoUsed() > SS.cargoCap()) { const it = S.cargo.pop(); extra += SS.priceOf(it); n++; }
  if (n) { SS.earn(extra); SS.notes.push(`Yeni ambara sığmayan ${n} parça Zara'ya satıldı: ${fmt(extra)}.`); }
  SS.unlockChapter(nx.id);
  if (nx.id === 'balina') S.finale = true;
  SS.checkAch();
  return true;
};

/* ---------- hikâye ---------- */
SS.unlockChapter = id => { if (S.chapters.includes(id)) return; S.chapters.push(id); SS.pendingStory = id; };
SS.addFragment = () => {
  if (S.fragments >= 5) return false;
  S.fragments++;
  if (S.fragments === 1) SS.unlockChapter('frag1');
  if (S.fragments === 3) SS.unlockChapter('frag3');
  if (S.fragments === 5) SS.unlockChapter('frag5');
  return true;
};

/* ---------- başarımlar ---------- */
SS.ACH = [
  { id: 'run1', name: 'İlk Dalış', desc: 'İlk hurda avını tamamla.', test: () => S.stats.runs >= 1 },
  { id: 'crys', name: 'Parıltı', desc: 'Bir enerji kristali topla.', test: () => S.cargo.some(c => c.cat === 'crystal') },
  { id: 'k1', name: 'Bin Kredi', desc: 'Cebinde ₡1.000 olsun.', test: () => S.cash >= 1000 },
  { id: 'half', name: 'Yarı Yol', desc: 'Krell borcunun yarısını öde.', test: () => S.won || (S.lender === 'krell' && S.loan <= S.loanStart / 2) },
  { id: 'free', name: 'Krell\'e Elveda', desc: 'Krell borcunu tamamen kapat.', test: () => S.won },
  { id: 'marti', name: 'Yeni Kanatlar', desc: 'Gezgin Martı\'yı al.', test: () => S.tier >= 1 },
  { id: 'balina', name: 'Balina Kaptanı', desc: 'Demir Balina\'yı al.', test: () => S.tier >= 2 },
  { id: 'pilot5', name: 'Usta Pilot', desc: '5 kargo teslim et.', test: () => S.stats.deliver >= 5 },
  { id: 'fix5', name: 'Altın Eller', desc: '5 tamir işi bitir.', test: () => S.stats.repair >= 5 },
  { id: 'sort3', name: 'Bant Ustası', desc: 'Ayrıştırmada 3 vardiya tamamla.', test: () => S.stats.sort >= 3 },
  { id: 'luck', name: 'Şanslı Gece', desc: 'Kart masasında tek elde ₡200+ kâr et.', test: () => S.stats.cardsBest >= 200 },
  { id: 'house', name: 'Ev Sahibi', desc: 'Kapsülden çık, bir eve taşın.', test: () => S.home >= 1 },
  { id: 'boss', name: 'Patron', desc: 'Bir işletme satın al.', test: () => Object.keys(S.biz).length > 0 },
  { id: 'family', name: 'Aile Gibi', desc: 'Bir yol arkadaşıyla bağı 90\'a çıkar.', test: () => SS.crewList().some(id => S.crew[id].bond >= 90) },
  { id: 'friend', name: 'Kantin Müdavimi', desc: 'Bir istasyon sakiniyle 60 yakınlığa ulaş.', test: () => Object.values(S.aff).some(v => v >= 60) },
  { id: 'album6', name: 'Koleksiyoncu', desc: '10 antik eser bul.', test: () => Object.keys(S.album).length >= 10 },
  { id: 'set1', name: 'Set Ustası', desc: 'Bir eser setini tamamla.', test: () => Object.keys(S.setsDone || {}).length >= 1 },
  { id: 'album12', name: 'Müze Kuratörü', desc: 'Albümdeki 42 eserin hepsini bul.', test: () => Object.keys(S.album).length >= 42 },
  { id: 'lost', name: 'Efsane Avcısı', desc: 'Kayıp Yıldız\'a ulaş.', test: () => S.lostVisited },
];
SS.checkAch = () => {
  for (const a of SS.ACH) if (!S.ach[a.id] && a.test()) { S.ach[a.id] = S.day; SS.toast(`Başarım: ${a.name}`, 'ach'); }
};

})(window.SS);

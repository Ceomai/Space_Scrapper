// Birim testleri (tarayıcısız): node tests/unit/run.js
// Oyunun gerçek web/js dosyaları bir vm bağlamına yüklenir (tests/unit/env.js); kayıt göçü/onarımı, tohumlu çok günlük
// ekonomi, iş ödeme hesapları ve İngilizce çeviri (yer tutucular dahil) sınanır.
const assert = require('assert');
const { load, seeded } = require('./env');

let pass = 0, fail = 0;
const test = (name, fn) => {
  try { fn(); pass++; console.log('✓ ' + name); }
  catch (e) { fail++; console.log('✗ ' + name + '\n    ' + String(e && e.stack || e).split('\n').slice(0, 4).join('\n    ')); }
};
// vm bağlamındaki nesneler başka bir realm'den gelir: yapısal karşılaştırma JSON üzerinden yapılır
const same = (a, b, m) => assert.deepStrictEqual(JSON.parse(JSON.stringify(a)), b, m);
const finite = (S, keys) => keys.forEach(k => assert.ok(typeof S[k] === 'number' && Number.isFinite(S[k]), `${k} sonlu değil: ${S[k]}`));
const NUMS = ['cash', 'loan', 'arrears', 'strikes', 'energy', 'hunger', 'health', 'morale', 'fuel', 'time', 'day', 'torps'];
const newGame = (W, crew = ['pit', 'ela', 'tolga'], diff = [1, 1, 1]) => {
  W.S = W.SS.newState(diff, 'fun', 'Test', crew); W.S.nextEvent = null; W.SS.newDay([]); W.S.tut = null; return W.S;
};

/* ---------- kayıt: göç, onarım, koruma ağı ---------- */
const W = load();
const SS = W.SS;

test('Yüklenme: kayıt işlevleri tanımlı (save.js)', () => {
  for (const f of ['migrate', 'repairSave', 'sanitize', 'save', 'load', 'newState', 'sleep']) assert.strictEqual(typeof SS[f], 'function', f);
});

test('Göç: çok eski, yarım kayıt yeni oyunun varsayılanlarıyla tamamlanır', () => {
  const old = { v: 3, name: 'Eski', day: 14, cash: 812, loan: 9000, lender: 'krell', tier: 0, diff: [1, 1, 1], tone: 'fun', crewOrder: ['pit'], crew: { pit: { bond: 70 } }, cargo: [{ kind: 'plate', value: 20, cat: 'metal' }] };
  const s = SS.migrate(JSON.parse(JSON.stringify(old)));
  assert.ok(s, 'göç null döndü');
  assert.strictEqual(s.name, 'Eski'); assert.strictEqual(s.day, 14); assert.strictEqual(s.cash, 812);
  same(s.lic, { deliver: 1, repair: 1, sort: 1, order: 1, scrap2: 1, scrap3: 1 }, 'eski kayıt bütün lisanslarla gelmeli');
  assert.ok(s.deadlineOverride >= SS.RULES.deadline, 'eski Krell borcuna ek süre verilmeli');
  assert.strictEqual(s.crew.pit.bond, 70); assert.strictEqual(s.crew.pit.task, 'with');
  for (const k of ['casino', 'course', 'trialLog', 'skills', 'stats', 'route', 'decorStore']) assert.ok(s[k] != null, 'eksik alan: ' + k);
  finite(s, NUMS);
  // göçmüş kayıtla oyun sürer
  W.S = s; SS.newDay([]); const r = SS.sleep(null); assert.ok(r); finite(W.S, NUMS);
});

test('Onarım: bozuk türler ve geçersiz kimlikler temizlenir', () => {
  const s = SS.migrate({
    v: 3, name: 42, day: 'x', cash: 'abc', loan: NaN, arrears: Infinity, tier: 99, home: -3, strikes: 12, time: 99999,
    diff: 'zor', tone: 'çılgın', loc: 'mars', view: 'yok', lender: 'mafya', crewOrder: ['pit', 'pit', 'uzaylı'], crew: 5,
    cargo: 'x', decision: 42, nextEvent: 'yok-olay', mile: { id: 'yok' }, bill: { amt: 'çok' }, prices: { metal: -1, part: 50 },
    route: ['market', 'mars', 7], inv: { choco: -2, bandage: 1 }, album: { sahte: 1 }, shipNames: { 0: 'x'.repeat(40), 1: 5 },
  });
  assert.ok(s);
  assert.strictEqual(s.name, 'Kaptan'); assert.strictEqual(s.day, 1); assert.strictEqual(s.tier, SS.SHIPS.length - 1); assert.strictEqual(s.home, 0);
  assert.strictEqual(s.strikes, 3); assert.strictEqual(s.time, 1700); same(s.diff, [1, 1, 1]); assert.strictEqual(s.tone, 'fun');
  assert.strictEqual(s.loc, 'home'); assert.strictEqual(s.view, 'map'); same(s.crewOrder, ['pit']); assert.ok(s.crew.pit && s.crew.pit.bond === 50);
  same(s.cargo, []); assert.strictEqual(s.decision, null); assert.strictEqual(s.nextEvent, null); assert.strictEqual(s.mile, null); assert.strictEqual(s.bill, null);
  assert.strictEqual(s.prices.metal, 1); assert.strictEqual(s.prices.part, 5); same(s.route, ['market']);
  assert.ok(!('choco' in s.inv) && s.inv.bandage === 1); same(s.album, {}); assert.strictEqual(s.shipNames[0].length, 20); assert.ok(!(1 in s.shipNames));
  finite(s, NUMS);
});

test('Onarım: nesne olmayan kayıt reddedilir', () => {
  for (const bad of [null, 5, 'kayıt', [1, 2]]) assert.strictEqual(SS.migrate(bad), null);
  assert.strictEqual(SS.repairSave(null), null);
});

test('Yükleme: okunamayan kayıt silinmez, yedeğe alınır', () => {
  const W2 = load({ storage: { 'space-scrapper-save-v3': '{bozuk json' } });
  assert.strictEqual(W2.SS.load(), null);
  assert.strictEqual(W2.SS.loadError, 'backup');
  assert.strictEqual(W2.localStorage.getItem(W2.SS.BAK_KEY), '{bozuk json');
  assert.strictEqual(W2.localStorage.getItem('space-scrapper-save-v3'), '{bozuk json');
});

test('Kaydet → yükle: durum aynen geri gelir', () => {
  newGame(W); W.S.cash = 1234; W.S.day = 9; SS.save();
  const back = SS.load(); assert.ok(back); assert.strictEqual(back.cash, 1234); assert.strictEqual(back.day, 9);
  same(Object.keys(back).sort(), Object.keys(JSON.parse(JSON.stringify(W.S))).sort());
});

test('Koruma ağı: NaN ve aralık dışı değerler onarılır', () => {
  newGame(W); Object.assign(W.S, { cash: NaN, hunger: 250, health: -5, energy: Infinity, strikes: 7, fuel: 1e9 });
  SS.sanitize();
  assert.strictEqual(W.S.cash, 0); assert.strictEqual(W.S.hunger, 100); assert.strictEqual(W.S.health, 0); assert.strictEqual(W.S.strikes, 3);
  assert.strictEqual(W.S.fuel, SS.tankCap()); assert.ok(W.S.energy <= SS.maxEnergy());
  W.S = null; SS.sanitize(); // S yokken sessiz
});

/* ---------- tohumlu çok günlük ekonomi ---------- */
function economy(seed, days = 45, diff = [1, 1, 1]) {
  const E = load(); E.Math.random = seeded(seed);
  const T0 = Date.UTC(2026, 0, 5, 10); E.Date = class extends Date { constructor(...a) { super(...(a.length ? a : [T0])); } static now() { return T0; } };
  const S = newGame(E, ['pit', 'ela', 'tolga'], diff), log = [];
  for (let i = 0; i < days && !E.S.over; i++) {
    const S = E.S, d0 = S.day;
    // basit bir gün: bir iş geliri, yemek, bazen borç ödemesi
    E.SS.earn(150 + Math.floor(E.Math.random() * 250)); E.SS.passTime(480);
    if (S.cash > 400 && S.loan > 0) E.SS.payLoan(100);
    E.SS.sleep(null);
    finite(E.S, NUMS);
    assert.ok(E.S.cash >= 0, 'nakit eksi: ' + E.S.cash);
    assert.ok(E.S.over || E.S.day === d0 + 1, `gün ilerlemedi: ${d0} → ${E.S.day}`);
    assert.ok(E.S.hunger >= 0 && E.S.hunger <= 100 && E.S.health >= 0 && E.S.health <= 100 && E.S.morale >= 0 && E.S.morale <= 100, 'göstergeler aralık dışı');
    assert.ok(!/NaN|undefined/.test(JSON.stringify(E.S)), 'durumda NaN/undefined metni');
    log.push([E.S.day, E.S.cash, E.S.loan, E.S.arrears]);
  }
  return { S: E.S, log };
}
test('Ekonomi: 45 günlük tohumlu uyku döngüsü (değişmezler)', () => {
  const r = economy(7);
  assert.ok(r.log.length >= 10, 'çok erken bitti: ' + r.log.length + ' gün');
});
test('Ekonomi: aynı tohum aynı sonucu verir (belirlenimci)', () => {
  const a = economy(99, 25), b = economy(99, 25);
  same(a.log, b.log);
});
test('Ekonomi: zor ayarlarla da değişmezler korunur', () => { economy(3, 30, [2, 2, 2]); });

/* ---------- olay veriyolu (events.js) ---------- */
test('Olaylar: sıra, eşit sırada kayıt sırası, kaydı silme', () => {
  const E = load(), log = [];
  E.SS.on('t:x', () => log.push('b0'));
  E.SS.on('t:x', () => log.push('c5'), { order: 5 });
  E.SS.on('t:x', () => log.push('a-5'), { order: -5 });
  const off = E.SS.on('t:x', () => log.push('d0'));
  E.SS.on('t:x', (a, b) => log.push('args:' + a + b), { order: 9 });
  E.SS.emit('t:x', 1, 2);
  same(log, ['a-5', 'b0', 'd0', 'c5', 'args:12']);
  off(); off(); log.length = 0;
  E.SS.emit('t:x', 3, 4);
  same(log, ['a-5', 'b0', 'c5', 'args:34']);
  E.SS.emit('t:yok');
});
test('Olaylar: hatalı işleyici diğerlerini durdurmaz, bir kez raporlanır', () => {
  const E = load(), log = [], errs = [];
  E.console = { ...console, error: (...a) => errs.push(a) };
  E.SS.on('t:e', () => log.push(1), { order: 1 });
  E.SS.on('t:e', () => { throw new Error('boom'); }, { order: 2 });
  E.SS.on('t:e', () => log.push(3), { order: 3 });
  E.SS.emit('t:e'); E.SS.emit('t:e');
  same(log, [1, 3, 1, 3]);
  assert.strictEqual(errs.length, 1, 'hata işleyici başına bir kez yazılmalı');
});
test('Olaylar: SS.newDay sırası (fun → polish günün işi → çekirdek → polish taşı/bülten → haftalık özet)', () => {
  const E = load(), SS = E.SS;
  same(SS.hooks['day:before'].map(h => h.order), [10, 20]);
  same(SS.hooks['day:after'].map(h => h.order), [10, 20]);
  const S = newGame(E), log = [];
  SS.on('day:before', n => log.push(['before-first', n.includes('gec'), S.bulletin.day]), { order: -1 });
  SS.on('day:before', n => { log.push(['before-mid', n.includes('gec')]); S.dailyJob = 'X'; }, { order: 15 });
  SS.on('day:before', () => log.push(['before-last', S.dailyJob !== 'X', S.bulletin.day]), { order: 99 });
  SS.on('day:after', () => log.push(['after-first', S.bulletin.day, 'dailyJob' in S.bulletin]), { order: -1 });
  SS.on('day:after', () => log.push(['after-mid', 'dailyJob' in S.bulletin, 'week' in S.bulletin]), { order: 15 });
  SS.on('day:after', n => log.push(['after-last', 'week' in S.bulletin, n === S.bulletin.notes]), { order: 99 });
  S.day = 8; S.weekSnap = null; S.cqLater = [{ day: 1, cash: 0, text: 'gec' }];
  SS.newDay(['not']);
  same(log, [['before-first', false, 1], ['before-mid', true], ['before-last', true, 1], ['after-first', 8, false], ['after-mid', true, false], ['after-last', true, false]]);
  assert.ok(S.bulletin.notes.includes('not'), 'notlar bültene taşınmalı');
  assert.strictEqual(SS.newDay(), undefined, 'notes verilmezse de çalışır, değer döndürmez');
});

test('Süzgeç: değer sırayla aktarılır, undefined değiştirmez, hata önceki değerle devam eder', () => {
  const E = load(), errs = [];
  E.console = { ...console, error: (...a) => errs.push(a) };
  assert.strictEqual(E.SS.filter('t:f', 5), 5, 'işleyicisiz süzgeç değeri aynen döndürür');
  E.SS.on('t:f', (v, k) => v * k, { order: 2 });
  E.SS.on('t:f', v => v + 1, { order: 1 });
  E.SS.on('t:f', () => undefined, { order: 3 });
  E.SS.on('t:f', () => { throw new Error('boom'); }, { order: 4 });
  const off = E.SS.on('t:f', v => v - 100, { order: 5 });
  assert.strictEqual(E.SS.filter('t:f', 2, 10), 30 - 100);
  off();
  assert.strictEqual(E.SS.filter('t:f', 2, 10), 30);
  assert.strictEqual(errs.length, 1);
});
test('Olaylar: SS.sleep (önce → gövde → newDay → sonra), ledger süzgeci ve goals:after', () => {
  const E = load(), SS = E.SS;
  same(SS.hooks['sleep:before'].map(h => h.order), [10]);
  same(SS.hooks['sleep:after'].map(h => h.order), [10]);
  same(SS.hooks.ledger.map(h => h.order), [10]);
  same(SS.hooks['goals:after'].map(h => h.order), [10]);
  const S = newGame(E), log = [];
  SS.on('sleep:before', ctx => log.push(['sb-first', ctx.sel === null, 'day0' in ctx]), { order: -1 });
  SS.on('sleep:before', ctx => log.push(['sb-last', ctx.day0, typeof ctx.bonds0]), { order: 99 });
  SS.on('day:before', () => log.push(['day:before', S.day]), { order: 99 });
  SS.on('sleep:after', ctx => log.push(['sa-first', S.day, !!ctx.res, !!S.billFix]), { order: -1 });
  SS.on('sleep:after', ctx => log.push(['sa-last', S.billFix]), { order: 99 });
  S.billFix = { name: 'Arıza', amt: 0 };
  let res;
  SS.on('sleep:after', ctx => { res = ctx.res; }, { order: 100 });
  const out = SS.sleep(null);
  same(log, [['sb-first', true, false], ['sb-last', 1, 'object'], ['day:before', 2], ['sa-first', 2, true, true], ['sa-last', null]]);
  assert.ok(out === res && Array.isArray(out.R) && Array.isArray(out.notes), 'sleep ctx.res döner');
  // ledger: polish (10) kalemleri L[1]'e ekler; daha sonraki süzgeç onları görür
  S.billFix = { name: 'Arıza', amt: 7 };
  SS.on('ledger', L => { log.push(['ledger-last', L[1].id]); return L.concat({ id: 'probe', amt: 0 }); }, { order: 99 });
  const L = SS.ledger();
  assert.strictEqual(L[1].id, 'billfix'); assert.strictEqual(L[L.length - 1].id, 'probe');
  same(log.slice(-1), [['ledger-last', 'billfix']]);
  // goals:after hedeflerden sonra
  S.goals = [{ key: 'zz', target: 1, txt: 'x', reward: 10, done: false }]; S.today.zz = 1;
  SS.on('goals:after', () => log.push(['goals:after', S.goals[0].done]), { order: 99 });
  SS.checkGoals();
  same(log.slice(-1), [['goals:after', true]]);
});

test('Olaylar: passTime → time:after (acil süresi → çıkartma), refreshBoard → board:new yalnızca yenilenince', () => {
  const E = load(), SS = E.SS;
  same(SS.hooks['time:after'].map(h => h.order), [10, 20]);
  same(SS.hooks['board:new'].map(h => h.order), [10]);
  const S = newGame(E), log = [];
  S.board = [{ id: 'r1', type: 'deliver', rush: true, until: S.time + 10, done: false, pay: 100 }];
  SS.on('time:after', m => log.push(['t-first', m, S.board[0].done]), { order: -1 });
  SS.on('time:after', () => log.push(['t-mid', S.board[0].expired === true]), { order: 15 });
  SS.on('time:after', () => log.push(['t-last']), { order: 99 });
  SS.passTime(30);
  same(log, [['t-first', 30, false], ['t-mid', true], ['t-last']]);
  log.length = 0;
  SS.on('board:new', B => log.push(['b-first', B === S.board, B.some(b => b.rush)]), { order: -1 });
  SS.on('board:new', B => log.push(['b-last', B === S.board]), { order: 99 });
  SS.refreshBoard();
  same(log, [], 'aynı pencerede pano yenilenmez, olay yayılmaz');
  SS.refreshBoard(true);
  same(log, [['b-first', true, false], ['b-last', true]]);
  // acil ilan işleyicisi (10) Math.random ile seçer: random 0 → her zaman acil
  E.Math.random = () => 0; log.length = 0; S.lic = { deliver: 1, repair: 1, sort: 1, order: 1 }; S.time = 480;
  SS.on('board:new', B => log.push(['b-mid', B.some(b => b.rush)]), { order: 15 });
  SS.refreshBoard(true);
  same(log[1], ['b-mid', true]);
});

test('Soru (SS.ask): ilk false durdurur, hata izin sayılır', () => {
  const E = load(), errs = [], log = [];
  E.console = { ...console, error: (...a) => errs.push(a) };
  assert.strictEqual(E.SS.ask('t:a', 1), true, 'işleyicisiz soru izin verir');
  E.SS.on('t:a', () => { throw new Error('boom'); }, { order: 1 });
  E.SS.on('t:a', x => { log.push(['a', x]); return undefined; }, { order: 2 });
  const off = E.SS.on('t:a', () => { log.push(['b']); return false; }, { order: 3 });
  E.SS.on('t:a', () => { log.push(['c']); }, { order: 4 });
  assert.strictEqual(E.SS.ask('t:a', 7), false);
  same(log, [['a', 7], ['b']]);
  off(); log.length = 0;
  assert.strictEqual(E.SS.ask('t:a', 8), true);
  same(log, [['a', 8], ['c']]);
  assert.strictEqual(errs.length, 1);
});
test('Olaylar: ACT.job (izin → önce: acil → otomatik yakıt → iş → sonra), ACT.scrap, avlanma kipleri', () => {
  const E = load(), SS = E.SS, ACT = SS.ACT;
  same(SS.hooks['job:allow'].map(h => h.order), [10]);
  same(SS.hooks['job:before'].map(h => h.order), [10, 20]);
  same(SS.hooks['job:after'].map(h => h.order), [10]);
  same(SS.hooks['scrap:before'].map(h => h.order), [10]);
  const S = newGame(E), log = [];
  SS.render = () => {}; // DOM yok
  SS.on('job:allow', ctx => { log.push(['allow-last', ctx.d.id]); }, { order: 99 });
  SS.on('job:before', ctx => log.push(['before-mid', ctx.wasRush]), { order: 15 });
  SS.on('job:before', () => log.push(['before-last']), { order: 99 });
  SS.on('job:after', ctx => log.push(['after-first', ctx.res]), { order: -1 });
  // süresi dolmuş acil ilan: fun (10) engeller, sonraki izin/önce/sonra çağrılmaz
  S.board = [{ id: 'r1', type: 'deliver', rush: true, until: S.time - 1, done: false, pay: 100, energy: 1, dur: 1, fuel: 0 }];
  assert.strictEqual(ACT.job({ id: 'r1' }), undefined);
  same(log, []); assert.ok(S.board[0].expired, 'süresi dolan ilan kapanmalı');
  // olmayan ilan: bütün aşamalar sırayla, iş undefined döner
  ACT.job({ id: 'yok' });
  same(log, [['allow-last', 'yok'], ['before-mid', null], ['before-last'], ['after-first', null]]); // JSON: undefined → null
  // scrap:before doğrulamadan (GUARD) sonra: geçersiz bölge hiç yayılmaz
  log.length = 0; SS.on('scrap:before', d => log.push(['scrap', d.z, SS._lastDive]), { order: 99 });
  ACT.scrap({ z: 'yok' }); same(log, []);
  S.energy = 0; ACT.scrap({ z: SS.ZONES[0].id }); same(log, [['scrap', SS.ZONES[0].id, SS.ZONES[0].id]]);
  // kip kaydı: weekly fun.js'ten, bilinmeyen kip varsayılan tura düşer
  const calls = []; SS.Games.scrap = (zone, cb, ct) => calls.push([zone, !!ct.weekly, ct.title]);
  assert.ok(typeof SS.HUNT_MODES.weekly === 'function');
  SS.startHunt({ seed: 4, mode: 'weekly' }); SS.startHunt({ seed: 4, mode: 'practice' });
  SS.HUNT_MODES.test = o => calls.push(['test', o.seed]); SS.startHunt({ seed: 9, mode: 'test' });
  same(calls.map(c => c.slice(0, 2)), [['gas', true], [SS.seedZone(4), false], ['test', 9]]);
  assert.strictEqual(calls[1][2], 'Antrenman');
});

test('Olaylar: ödüllü reklam (ad:needed → ad:start → ad:end tam bir kez → done/cancel; ad:native-done önce)', () => {
  const E = load(), SS = E.SS, log = [];
  same(SS.hooks['ad:needed'].map(h => h.order), [10]);
  same(SS.hooks['ad:start'].map(h => h.order), [10]);
  same(SS.hooks['ad:end'].map(h => h.order), [10]);
  same(SS.hooks['ad:native-done'].map(h => h.order), [10]);
  newGame(E); SS.music.update = () => log.push(['music', SS.inAd]);
  E.SS_NATIVE = { ads: true, post: m => log.push(['post', m.type]) };
  SS.on('ad:start', ad => log.push(['start', ad.ok]), { order: 99 });
  SS.on('ad:end', ad => log.push(['end', ad.ok, SS.inAd]), { order: 99 });
  SS.on('ad:native-done', ok => log.push(['native', ok]), { order: 99 });
  const done = () => log.push(['done']), cancel = () => log.push(['cancel']);
  // başarı: müzik susar → başlar → yerel köprü → bitiş (ok) → done; ikinci SS_AD_DONE yalnızca native-done
  SS.showRewardedAd(done, cancel); E.SS_AD_DONE(true); E.SS_AD_DONE(true);
  same(log, [['music', true], ['start', null], ['post', 'ad'], ['music', false], ['native', true], ['music', false], ['end', true, false], ['done'], ['music', false], ['native', true]]);
  // başarısız: cancel, done yok
  log.length = 0; SS.showRewardedAd(done, cancel); E.SS_AD_DONE(false);
  same(log.filter(x => ['end', 'done', 'cancel'].includes(x[0])), [['end', false, false], ['cancel']]);
  // destekçi (ad:needed false): reklam ve müzik molası yok, done değeri döner
  log.length = 0; const off = SS.on('ad:needed', () => false, { order: 1 });
  assert.strictEqual(SS.showRewardedAd(() => { log.push(['done']); return 'R'; }, cancel), 'R');
  same(log, [['done']]); off();
});

test('Arayüz olayları ve çizim kayıtları: sıralar, süzgeç bileşimi, kısa devre', () => {
  const E = load(), SS = E.SS;
  const ord = n => (SS.hooks[n] || []).map(h => h.order);
  for (const n of ['view:market', 'panel:a11y', 'ship:allow', 'flow:allow', 'look:applied', 'panel:daily', 'panel:menu', 'prefs:sound']) same(ord(n), [10], n);
  same(Object.keys(SS.Art.ITEM_DRAW).sort(), ['amber', 'egg', 'gold', 'ice', 'jelly', 'mimic']);
  same(Object.keys(SS.DECAL_DRAW).sort(), ['crown', 'paw']);
  assert.strictEqual(SS.Art.SHIP_AFTER.length, 1);
  assert.strictEqual(typeof SS.shareVia, 'function'); assert.strictEqual(typeof SS.shareBasic, 'function');
  const S = newGame(E);
  // a11y: destekçi paneli erişilebilirlik panelinin önünde; sonraki süzgeç ikisini de görür
  let seen = ''; SS.on('panel:a11y', h => { seen = h; return h + '<!--son-->'; }, { order: 99 });
  const a = SS.a11yPanel();
  assert.ok(seen.indexOf('Destekçi paketi') >= 0 && seen.indexOf('Destekçi paketi') < seen.indexOf('Kolaylık ve erişilebilirlik'), 'sıra: destekçi → kolaylık');
  assert.ok(a.endsWith('<!--son-->'));
  // flow:allow false → sıra ilerlemez (ui.js gövdesi çalışmaz)
  SS.pendingStory = 'x'; const off = SS.on('flow:allow', () => false, { order: -1 });
  SS.flow(); assert.strictEqual(SS.pendingStory, 'x', 'kısa devre'); off(); SS.pendingStory = null;
  // ship:allow: polish engel yoksa (borç var) izin verir, çekirdek uyarır; probe sırası
  const log = []; SS.on('ship:allow', d => log.push(['ship', d.b]), { order: 99 }); SS.toast = m => log.push(['toast', m]);
  S.loan = 100; SS.ACT.buyShip({ b: '0' });
  same(log, [['ship', '0'], ['toast', 'Bu gemiyi şu an alamazsın.']]);
});

/* ---------- iş ödemeleri ve fiyatlar (ui.js'ten ayrıldı) ---------- */
test('İş ödemeleri: sözleşme, teslimat, tamir, fiyatlar', () => {
  const S = newGame(W, ['pit']);
  const b = { fee: 100, per: 30, qty: 3 };
  assert.strictEqual(SS.huntContractPay(b, 0, 1), 0);
  assert.strictEqual(SS.huntContractPay(b, 2, 1), 160);
  assert.strictEqual(SS.huntContractPay(b, 3, 1), 240);
  assert.strictEqual(SS.huntContractPay(b, 3, .85), Math.round(240 * .85));
  assert.strictEqual(SS.huntContractPay(b, 3), 240);
  assert.strictEqual(SS.deliverPay(101), 101, 'Tolga yokken teslimat primi yok');
  assert.strictEqual(SS.repairPay(101), 101);
  const T = newGame(W, ['tolga']);
  assert.strictEqual(SS.deliverPay(101), Math.round(101 * 1.1));
  assert.strictEqual(SS.repairPay(100), 100, 'atölye yokken tamir primi yok');
  T.rooms.tolga = true; assert.strictEqual(SS.repairPay(100), 115);
  assert.strictEqual(SS.trainCost(0), Math.round(250 * SS.dv('costs'))); assert.strictEqual(SS.healPrice(), Math.round(70 * SS.dv('costs')));
  const est = SS.cargoEstimate([{ kind: 'plate', value: 20 }, { kind: 'bolts', value: 10 }]);
  assert.ok(Number.isFinite(est) && est > 0);
  // gecikme cezası kuralı
  T.cash = 50; T.arrears = 0; SS.charge(150); assert.strictEqual(T.arrears, Math.round(100 * SS.RULES.arrearsFee)); assert.strictEqual(T.cash, 0);
  void S;
});

/* ---------- İngilizce çeviri ---------- */
test('Çeviri: Türkçe modda T birebir döner', () => {
  assert.strictEqual(SS.T('Haber'), 'Haber');
  assert.strictEqual(SS.T('₡500 borç ödendi.'), '₡500 borç ödendi.');
});
test('Çeviri: İngilizce sözlük, yer tutucu ve yüzde', () => {
  const E = load({ lang: 'en' });
  assert.strictEqual(E.SS.lang(), 'en');
  assert.strictEqual(E.SS.T('Haber'), 'News');
  assert.strictEqual(E.SS.T('Satın alma tamamlanamadı.'), "The purchase couldn't be completed.");
  assert.strictEqual(E.SS.T('₡500 borç ödendi.'), '₡500 of debt paid.');
  assert.strictEqual(E.SS.T('  Haber  '), '  News  ', 'baştaki/sondaki boşluk korunmalı');
  assert.strictEqual(E.SS.T('12345'), '12345', 'harfsiz metne dokunulmaz');
  assert.ok(/%/.test(E.SS.T('%25')) && E.SS.T('%25').startsWith('25'), 'yüzde İngilizce yazımına dönmeli: ' + E.SS.T('%25'));
});

console.log(`\n${pass} geçti, ${fail} başarısız`);
process.exit(fail ? 1 : 0);

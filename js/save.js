// Space Scrapper — kayıt bütünlüğü: koruma ağı (sanitize), eski kayıt göçü (migrate) ve tür/kimlik onarımı (repairSave).
// Bu işlevler yalnızca çağrıldıklarında (kayıt okuma/yazma) çalışır; tanımlar tek dosyada toplanır.
// Çağrı anında kullandıkları veriler (SS.SHIPS, SS.MILES, SS.ARCS, SS.VIEWS…) sonraki dosyalarda tanımlanır.
(function(SS){

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

/* =========================================================
   KAYIT GÖÇÜ: eski kayıtlar bütün lisanslarla gelir
   ========================================================= */
SS.migrate = s => {
  if (!s.lic) s.lic = { deliver: 1, repair: 1, sort: 1, order: 1, scrap2: 1, scrap3: 1 };
  if (!s.rules2) { s.rules2 = 1; if (s.day > 1 && s.lender === 'krell' && s.loan > 0) s.deadlineOverride = Math.max(SS.RULES.deadline, Math.min(196, s.day + 60)); }
  // Eksik her alanı yeni oyunun varsayılanlarıyla doldur (eski ya da yarım kalmış kayıtlar için)
  try {
    const prev = window.S, def = SS.newState(Array.isArray(s.diff) && s.diff.length === 3 ? s.diff : [1, 1, 1], s.tone || 'fun', s.name, Array.isArray(s.crewOrder) ? s.crewOrder : []); window.S = prev;
    for (const k in def) {
      if (s[k] === undefined || (s[k] === null && def[k] !== null && typeof def[k] === 'object')) s[k] = def[k];
      else if (def[k] && typeof def[k] === 'object' && !Array.isArray(def[k]) && s[k] && typeof s[k] === 'object' && !Array.isArray(s[k])) { for (const kk in def[k]) if (s[k][kk] === undefined) s[k][kk] = def[k][kk]; }
    }
    for (const id of s.crewOrder || []) { const c = s.crew[id] = s.crew[id] || {}; const d0 = { bond: 50, task: 'with', down: 0, gone: false, hunger: 0, sick: false, sickDays: 0 }; for (const kk in d0) if (c[kk] === undefined) c[kk] = d0[kk]; }
    ['cash', 'energy', 'hunger', 'health', 'morale', 'loan', 'arrears', 'fuel', 'time', 'day', 'torps'].forEach(k => { if (typeof s[k] !== 'number' || !isFinite(s[k])) s[k] = def[k]; });
    if (!Array.isArray(s.cargo)) s.cargo = []; s.cargo = s.cargo.filter(c => c && SS.ITEMS[c.kind] && isFinite(c.value));
  } catch (e) {}
  s.course = s.course || {}; s.trialLog = s.trialLog || [];
  s.casino = s.casino || { today: 0, net: 0, chips: 0, best: 0 };
  if (s.nextTrial == null) s.nextTrial = 0;
  if (s.trial === undefined) s.trial = null;
  return s;
};

/* =========================================================
   KAYIT ONARIMI: tür ve kimlik doğrulaması (bozuk / kurcalanmış / yarım kayıt asla çökertmez)
   ========================================================= */
const clone = o => JSON.parse(JSON.stringify(o));
const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v);
const NULL_OBJ = ['trial', 'bill', 'billFix', 'mile', 'arc', 'bulletin', 'event', 'tease', 'teaseToday', 'weekSnap', 'weekSum', 'incomeRoll', 'lastDay'];
const NULL_STR = ['decision', 'nextEvent', 'pitZone', 'morningKey', 'over', 'dailyJob'];
SS.repairSave = s => {
  if (!isObj(s)) return null;
  const prev = window.S; let def;
  try { def = SS.newState([1, 1, 1], 'fun', 'Kaptan', []); } finally { window.S = prev; }
  for (const k in def) {
    const d = def[k], v = s[k];
    if (v === undefined) continue;
    if (k === 'tut' && v === null) continue;
    if (k === 'lender' && v === null) continue;
    if (Array.isArray(d)) { if (!Array.isArray(v)) s[k] = clone(d); }
    else if (isObj(d)) { if (!isObj(v)) s[k] = clone(d); else for (const kk in d) if (typeof d[kk] === 'number' && (typeof v[kk] !== 'number' || !isFinite(v[kk]))) v[kk] = d[kk]; }
    else if (typeof d === 'number') { if (typeof v !== 'number' || !isFinite(v)) s[k] = d; }
    else if (typeof d === 'string') { if (typeof v !== 'string') s[k] = d; }
    else if (typeof d === 'boolean') { if (typeof v !== 'boolean') s[k] = d; }
  }
  for (const k of NULL_OBJ) if (s[k] != null && !isObj(s[k])) s[k] = null;
  for (const k of NULL_STR) if (s[k] != null && typeof s[k] !== 'string') s[k] = null;
  for (const k of ['bankDeadline', 'deadlineOverride']) if (s[k] != null && !(typeof s[k] === 'number' && isFinite(s[k]))) delete s[k];
  if (s.lender != null && !['krell', 'bank'].includes(s.lender)) s.lender = s.loan > 0 ? 'krell' : null;
  // alan değerleri
  const int = (v, lo, hi, d) => Number.isFinite(v) ? Math.max(lo, Math.min(hi, Math.round(v))) : d;
  s.tier = int(s.tier, 0, SS.SHIPS.length - 1, 0); s.home = int(s.home, 0, SS.HOMES.length - 1, 0);
  s.day = int(s.day, 1, 1e6, 1); s.strikes = int(s.strikes, 0, 3, 0); s.time = int(s.time, 0, 1700, 420);
  if (!Array.isArray(s.diff) || s.diff.length !== 3) s.diff = [1, 1, 1]; s.diff = s.diff.map(x => int(x, 0, 2, 1));
  if (!SS.TONES.some(t => t.id === s.tone)) s.tone = 'fun';
  if (!SS.loc(s.loc)) s.loc = 'home';
  if (!SS.VIEWS[s.view]) s.view = 'map';
  if (!isObj(s.crew)) s.crew = {};
  s.crewOrder = [...new Set((s.crewOrder || []).filter(id => SS.COMPANIONS.some(c => c.id === id)))];
  for (const id of Object.keys(s.crew)) if (!s.crewOrder.includes(id) || !isObj(s.crew[id])) { if (s.crewOrder.includes(id)) s.crew[id] = {}; else delete s.crew[id]; }
  for (const id of s.crewOrder) { const c = s.crew[id] = isObj(s.crew[id]) ? s.crew[id] : {}; if (!['with', 'work', 'rest'].includes(c.task)) c.task = 'with'; c.bond = int(c.bond, 0, 100, 50); c.down = int(c.down, 0, 9, 0); c.hunger = int(c.hunger, 0, 9, 0); c.sickDays = int(c.sickDays, 0, 9, 0); c.sick = c.sick === true; c.gone = c.gone === true; }
  if (typeof s.decision === 'string' && !s.decision.startsWith('arc:') && !SS.DECISIONS.some(d => d.id === s.decision)) s.decision = null;
  if (s.arc && !(SS.ARCS || []).some(a => a.id === s.arc.id && Number.isInteger(s.arc.step) && s.arc.step >= 0 && s.arc.step < a.steps.length)) { s.arc = null; if (typeof s.decision === 'string' && s.decision.startsWith('arc:')) s.decision = null; }
  if (s.decision && s.decision.startsWith('arc:') && !s.arc) s.decision = null;
  if (s.mile && (!(SS.MILES || []).some(m => m.id === s.mile.id) || !isObj(s.mile.base) || !Number.isFinite(s.mile.due))) s.mile = null;
  if (s.bill && !(Number.isFinite(s.bill.amt) && typeof s.bill.name === 'string')) s.bill = null;
  if (s.billFix && !(Number.isFinite(s.billFix.amt) && typeof s.billFix.name === 'string')) s.billFix = null;
  if (s.trial && typeof s.trial.head !== 'string') s.trial = null;
  if (s.dailyJob && !['deliver', 'repair', 'sort'].includes(s.dailyJob)) s.dailyJob = null;
  if (s.nextEvent && !SS.EVENTS.some(e => e.id === s.nextEvent)) s.nextEvent = null;
  if (s.pitZone && !SS.ZONES.some(z => z.id === s.pitZone)) s.pitZone = null;
  if (s.morningKey && !SS.COMPANIONS.some(c => c.id === s.morningKey)) s.morningKey = null;
  s.route = s.route.filter(id => typeof id === 'string' && SS.loc(id)).slice(0, 5);
  s.billLater = s.billLater.filter(b => isObj(b) && Number.isFinite(b.amt) && Number.isFinite(b.due)).map(b => ({ ...b, name: String(b.name || 'Masraf') }));
  s.decor = s.decor.map(id => (typeof id === 'string' && SS.DECOR.some(d => d.id === id)) ? id : null);
  s.decorStore = s.decorStore.filter(id => typeof id === 'string' && SS.DECOR.some(d => d.id === id));
  s.rexLog = s.rexLog.filter(x => isObj(x) && Number.isFinite(x.mine) && Number.isFinite(x.rex));
  for (const r of Object.keys(s.album)) if (!SS.RELICS[r]) delete s.album[r];
  s.board = s.board.filter(b => isObj(b) && typeof b.id === 'string' && ['hunt', 'deliver', 'repair', 'sort', 'order'].includes(b.type));
  s.stock = s.stock.filter(x => isObj(x) && typeof x.key === 'string' && typeof x.name === 'string' && Number.isFinite(x.price));
  s.goals = s.goals.filter(g => isObj(g) && typeof g.txt === 'string' && typeof g.key === 'string' && Number.isFinite(g.target));
  for (const k of ['stats', 'today', 'aff', 'prices', 'skills', 'ship', 'rep', 'inv', 'buffs', 'zoneUse', 'satur']) if (isObj(s[k])) for (const kk of Object.keys(s[k])) if (typeof s[k][kk] === 'number' && !isFinite(s[k][kk])) s[k][kk] = 0;
  for (const k of ['inv', 'buffs']) for (const kk of Object.keys(s[k])) if (!(Number.isFinite(s[k][kk]) && s[k][kk] >= 0)) delete s[k][kk];
  for (const k of Object.keys(s.prices)) s.prices[k] = Number.isFinite(s.prices[k]) && s.prices[k] > 0 ? Math.min(5, s.prices[k]) : 1;
  if (!isObj(s.shipNames)) s.shipNames = {}; for (const k of Object.keys(s.shipNames)) if (typeof s.shipNames[k] !== 'string') delete s.shipNames[k]; else s.shipNames[k] = s.shipNames[k].slice(0, 20);
  if (typeof s.name !== 'string' || !s.name.trim()) s.name = 'Kaptan'; s.name = s.name.slice(0, 40);
  if (s.sub && isObj(s.sub)) for (const k of Object.keys(s.sub)) if (typeof s.sub[k] !== 'string') delete s.sub[k];
  return s;
};
const _migrate = SS.migrate;
SS.migrate = s => {
  if (!isObj(s)) return null;
  try { SS.repairSave(s); } catch (e) {}
  s = _migrate(s);
  try { SS.repairSave(s); } catch (e) {}
  return s;
};

})(window.SS);

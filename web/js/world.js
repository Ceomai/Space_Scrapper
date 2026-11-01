// Space Scrapper — dünya mantığı: yolculuk, saatler, ilan panosu, pazar stoku, envanter, dekor, hane yetenekleri, rütbe, Rex yarışı
(function(SS){
const { rnd, rint, pick, clamp, fmt } = SS;

/* ---------- harita ve yolculuk ---------- */
SS.loc = id => SS.LOCS.find(l => l.id === id);
SS.isOpen = (id, t = S.time) => { const l = SS.loc(id); if (!l) return true; const h = t / 60; return h >= l.open[0] && h < l.open[1]; };
SS.openLabel = id => { const l = SS.loc(id); return l.open[0] === 0 && l.open[1] >= 26 ? 'Her zaman açık' : `${String(l.open[0]).padStart(2, '0')}:00–${String(l.open[1] % 24).padStart(2, '0')}:00`; };
SS.travelCost = to => {
  if (to === S.loc) return { min: 0, energy: 0 };
  const a = SS.loc(S.loc), b = SS.loc(to), d = Math.hypot(a.x - b.x, a.y - b.y);
  const min = 10 + Math.round(d * 45 / 5) * 5;
  return { min: SS.assist('pit') ? Math.round(min * .8 / 5) * 5 : min, energy: 1 + Math.round(d * 4) };
};
SS.travelCostFrom = (from, to) => {
  if (to === from) return { min: 0, energy: 0 };
  const a = SS.loc(from), b = SS.loc(to), d = Math.hypot(a.x - b.x, a.y - b.y), min = 10 + Math.round(d * 45 / 5) * 5;
  return { min: SS.assist('pit') ? Math.round(min * .8 / 5) * 5 : min, energy: 1 + Math.round(d * 4) };
};
SS.travelBlock = to => {
  if (to === S.loc) return null;
  const c = SS.travelCost(to);
  if (!SS.isOpen(to, S.time + c.min)) return `${SS.loc(to).name} şu an kapalı (${SS.openLabel(to)}).`;
  if (S.time + c.min > SS.DAY_END + 60) return 'Bu saatte yolculuk yapamazsın.';
  if (S.energy < c.energy) return 'Yürüyecek enerjin bile yok. Bir şey ye ya da kestir.';
  return null;
};
SS.travel = to => {
  const b = SS.travelBlock(to); if (b) return b;
  const c = SS.travelCost(to);
  SS.passTime(c.min); S.energy = Math.max(0, S.energy - c.energy); S.loc = to;
  return null;
};

/* ---------- rütbe ---------- */
SS.rankIdx = () => SS.RANKS.reduce((a, r, i) => S.stats.earned >= r.at ? i : a, 0);
SS.rank = () => SS.RANKS[SS.rankIdx()];
SS.nextRank = () => SS.RANKS[SS.rankIdx() + 1] || null;
SS.rankPay = () => 1 + Math.min(.15, SS.rankIdx() * .03);
SS.rankDiscount = () => [1, 1, 1, .95, .9, .85][SS.rankIdx()];

/* ---------- hane yardımcıları ---------- */
SS.perk = (id, lv) => SS.hasCrew(id) && S.crew[id].bond >= lv;
SS.canAct = id => SS.hasCrew(id) && !S.crew[id].sick && !S.crew[id].down;
SS.useAbility = id => {
  if (!SS.canAct(id) || S.ability[id]) return null;
  S.ability[id] = true; SS.bond(id, 3);
  const fun = SS.fun();
  if (id === 'pit') {
    const zs = SS.ZONES.filter(z => !z.story && z.fuel <= SS.tankCap());
    const z = pick(zs); S.pitZone = z.id;
    return fun ? `Pıtırcık burnunu haritaya sürttü ve ${z.name} üstünde mırladı. Bugün orada değerler %30 fazla, bir de kristal kokusu var.` : `Pıtırcık sensörlerini ${z.name} yönüne çevirdi. Bugün orası bereketli.`;
  }
  if (id === 'ela') {
    SS.mood(15); S.energy = Math.min(SS.maxEnergy(), S.energy + 10);
    return fun ? 'Ela sana okulda öğrendiği bir şakayı anlattı. Şaka berbattı. Güldün. Moral +15, enerji +10.' : 'Ela yanına oturdu, başını omzuna koydu. "Başaracağız." Moral +15, enerji +10.';
  }
  if (id === 'tolga') {
    S.tolgaJob = true; S.boardWin = -1;
    return fun ? 'Tolga telefonu açtı: "Kanka, bir işin var mı? Hayır, bu sefer yasal." İş Merkezi\'nde özel bir iş seni bekliyor.' : 'Tolga eski bir tanıdığını aradı. İş Merkezi\'nde ödemesi yüksek bir iş var.';
  }
};
SS.buyRoom = id => { const r = SS.ROOMS[id]; if (!SS.hasCrew(id) || S.rooms[id] || !SS.spend(r.price)) return false; S.rooms[id] = true; SS.bond(id, 10); return true; };

/* ---------- ilan panosu (3 saatlik pencereler) ---------- */
const fill = (t, o) => t.replace(/\{(\w)\}/g, (_, k) => o[k] || '');
const line = (type, o) => { const t = fill(pick(SS.JOB_LINES[type][SS.fun() ? 'easy' : 'hard']), o); return t.charAt(0).toLocaleUpperCase('tr') + t.slice(1); };
SS.jobPayMult = () => (1 + Math.min(S.day, 200) / 250 + S.tier * .1) * SS.rankPay() * SS.ngPay() * (SS.win() >= 4 ? 1.1 : 1) * (SS.hard() ? .95 : 1) * SS.moralePay() * .86;
function mkDeliver(tierIdx, special) {
  const t = SS.DELIVERY_TIERS[tierIdx], [g, tag] = pick(SS.CARGOS);
  const mods = [];
  if (tag === 'fragile' || t.vip) mods.push({ id: 'fragile', name: 'Kırılacak', pay: 1.3, desc: 'İniş hızı toleransı düşük.' });
  if (Math.random() < .45) mods.push(pick(SS.DELIVERY_MODS));
  const c = pick(SS.CLIENTS), d = pick(SS.DESTS);
  let pay = rint(t.pay[0], t.pay[1]) * SS.jobPayMult() * SS.repMult('deliver');
  mods.forEach(m => pay *= m.pay);
  if (special) pay *= 1.8;
  return { type: 'deliver', id: Math.random().toString(36).slice(2), tier: tierIdx, tierName: special ? 'Tolga\'nın tanıdığı' : t.name, diff: t.diff, fuel: t.fuel,
    dest: d, what: g, client: c, mods: mods.map(m => m.id), modNames: mods.map(m => m.name), fragile: mods.some(m => m.id === 'fragile'),
    pay: Math.round(pay), dur: SS.DUR.deliver[tierIdx], energy: SS.COST.deliver, text: line('deliver', { c, d, g }), special: !!special, done: false };
}
function mkRepair(tierIdx, special) {
  const t = SS.REPAIR_TIERS[tierIdx], o = t.vip ? 'İstasyon reaktörü' : pick(SS.REPAIR_OBJ), c = pick(SS.CLIENTS);
  const mods = Math.random() < .4 ? [pick(SS.REPAIR_MODS)] : [];
  let pay = rint(t.pay[0], t.pay[1]) * SS.jobPayMult() * SS.repMult('repair');
  mods.forEach(m => pay *= m.pay);
  if (special) pay *= 1.8;
  return { type: 'repair', id: Math.random().toString(36).slice(2), tier: tierIdx, tierName: special ? 'Tolga\'nın tanıdığı' : t.name, size: t.size, what: o, client: c,
    mods: mods.map(m => m.id), modNames: mods.map(m => m.name), pay: Math.round(pay), dur: SS.DUR.repair[tierIdx], energy: SS.COST.repair,
    text: line('repair', { c, o }), special: !!special, done: false };
}
function mkSort() {
  const v = pick(SS.SORT_VARIANTS), long = Math.random() < .5, base = SS.SORTS[long ? 1 : 0];
  const per = Math.round((base.per + v.bonus) * SS.rankPay() * SS.moralePay() * (SS.win() >= 4 ? 1.1 : 1));
  return { type: 'sort', id: Math.random().toString(36).slice(2), name: `${v.name} · ${long ? 'uzun' : 'kısa'}`, variant: v.id, mix: v.mix,
    time: base.time, per, speed: base.speed * v.speed, energy: base.energy, dur: long ? SS.DUR.sortLong : SS.DUR.sortShort,
    text: `${v.desc} ${line('sort', {})}`, done: false };
}
// Hurda sözleşmesi: belirli bölgede belirli eşyaları topla; hedefler müşteriye gider, kalanı senin
const HUNTS = [
  { id: 'salvage', name: 'Parça kurtarma', opts: [[['part'], 2, 3], [['plate'], 3, 4], [['sat'], 1, 1]], per: k => SS.ITEMS[k].val * SS.SCRAP_VAL * .7 },
  { id: 'crystal', name: 'Kristal siparişi', opts: [[['crystal', 'slime'], 2, 2]], per: () => 300 * SS.SCRAP_VAL * .65, zone: 'gas' },
  { id: 'clear', name: 'Enkaz temizliği', opts: [[['rock', 'boulder'], 4, 5]], per: () => 16 },
  { id: 'rescue', name: 'Kara kutu kurtarma', opts: [[['box'], 2, 2]], per: () => 35 },
];
function mkHunt() {
  const lic = SS.zoneLic || (() => true), deep = !SS.hasLic || SS.hasLic('scrap2');
  const pool = HUNTS.filter(h => deep || h.id !== 'crystal'), H = pick(pool);
  const opts = H.opts.filter(o => deep || !o[0].some(k => k === 'sat' || k === 'crystal' || k === 'slime')), [kinds, q0, q1] = pick(opts.length ? opts : H.opts), qty = rint(q0, q1);
  const zones = SS.ZONES.filter(z => !z.story && z.fuel <= SS.tankCap() && lic(z.id));
  const Z = (H.zone && zones.find(z => z.id === H.zone)) || pick(zones);
  const m = Math.sqrt(Z.mult) * SS.repMult('scrap') * (1 + S.tier * .1);
  const c = pick(SS.CLIENTS), names = kinds.map(k => SS.ITEMS[k].name).join(' / ');
  return { type: 'hunt', id: Math.random().toString(36).slice(2), hunt: H.id, name: H.name, zone: Z.id, zoneName: Z.name, kinds, qty, client: c,
    per: Math.round(H.per(kinds[0]) * m), fee: Math.round((25 + Z.mult * 15) * m), fuel: Z.fuel, dur: SS.DUR.scrap, energy: SS.COST.scrap,
    label: `${qty} × ${names}`, text: line('hunt', { c, d: Z.name, g: names.toLocaleLowerCase('tr') }), done: false };
}
function mkOrder() {
  const opts = [['bolts', 3], ['plate', 2], ['part', 2], ['crystal', 1], ['sat', 1], ['bug', 2], ['rock', 3], ['boulder', 1], ['slime', 1]];
  const [kind, maxQ] = pick(opts), qty = rint(1, maxQ), T = SS.ITEMS[kind];
  const pay = Math.round(T.val * SS.SCRAP_VAL * qty * rnd(1.55, 1.95) * (1 + S.tier * .2) * SS.rankPay());
  return { type: 'order', id: Math.random().toString(36).slice(2), kind, qty, buyer: pick(SS.ORDER_BUYERS), pay, dur: SS.DUR.order, energy: 0, done: false };
}
SS.refreshBoard = (force) => {
  const w = SS.win();
  if (!force && S.boardWin === w && S.board.length) return;
  S.boardWin = w;
  const night = w >= 4, B = [];
  const dRep = SS.repLvl('deliver') >= 3, rRep = SS.repLvl('repair') >= 3;
  const dN = night ? 1 : rint(2, 3), rN = night ? 2 : rint(1, 2);
  const L = SS.hasLic || (() => true);
  if (L('deliver')) for (let i = 0; i < dN; i++) B.push(mkDeliver(dRep && Math.random() < .3 ? 3 : rint(0, 2)));
  if (L('repair')) for (let i = 0; i < rN; i++) B.push(mkRepair(rRep && Math.random() < .3 ? 3 : rint(0, 2)));
  if (L('sort')) { B.push(mkSort()); if (night || Math.random() < .4) B.push(mkSort()); }
  if (w % 2 === 0 || Math.random() < .5) B.unshift(mkHunt());
  if (B.length < 3) B.push(mkHunt());
  if (L('order')) { B.push(mkOrder()); if (Math.random() < .5) B.push(mkOrder()); }
  // Günün işi: seçilen türdeki ilanlar %25 fazla öder (çeşitliliği ödüllendirir)
  if (S.dailyJob) B.forEach(b => { if (b.type !== S.dailyJob || b.hot) return; b.hot = true; if (b.type === 'sort') b.per = Math.round(b.per * 1.25); else b.pay = Math.round(b.pay * 1.25); });
  if (S.tolgaJob && L('deliver') && L('repair')) { B.unshift(Math.random() < .5 ? mkDeliver(rint(1, 2), true) : mkRepair(rint(1, 2), true)); S.tolgaJob = false; }
  S.board = B;
};
SS.orderHave = o => S.cargo.filter(c => c.kind === o.kind).length;
SS.fulfilOrder = id => {
  const o = S.board.find(b => b.id === id); if (!o || o.done || SS.orderHave(o) < o.qty) return false;
  let n = o.qty;
  for (let i = S.cargo.length - 1; i >= 0 && n > 0; i--) if (S.cargo[i].kind === o.kind) { S.cargo.splice(i, 1); n--; }
  SS.earn(o.pay); SS.passTime(o.dur); o.done = true; S.stats.orders = (S.stats.orders || 0) + 1;
  return true;
};

/* ---------- pazar stoku ---------- */
SS.refreshStock = (force) => {
  const w = SS.win();
  if (!force && S.stockWin === w && S.stock.length) return;
  S.stockWin = w;
  const L = [], disc = SS.rankDiscount();
  const add = (g, extra = {}) => {
    let name = g.name, price = g.price, fx = { ...(g.fx || {}) };
    if (extra.origin) { const o = extra.origin; name = `${o.name} ${g.name.toLocaleLowerCase('tr')}`; price *= o.price; ['morale', 'energy', 'health', 'hunger'].forEach(k => { if (o[k]) fx[k] = (fx[k] || 0) + o[k]; }); }
    price = Math.max(3, Math.round(price * (extra.pm || 1) * disc * (g.use === 'eat' ? SS.M().foodMult : 1)));
    L.push({ key: Math.random().toString(36).slice(2), gid: g.id, name, price, fx, use: g.use, target: g.target, desc: g.desc, cat: g.cat, qty: extra.qty || 99, vendor: extra.vendor || null, decor: !!extra.decor });
  };
  SS.GOODS.filter(g => g.staple).forEach(g => add(g));
  const pool = SS.GOODS.filter(g => !g.staple);
  pool.slice().sort(() => Math.random() - .5).slice(0, 6).forEach(g =>
    add(g, { origin: (g.use === 'eat' && Math.random() < .6) ? pick(SS.ORIGINS) : null, pm: rnd(.85, 1.2), qty: rint(1, 4) }));
  SS.DECOR.filter(d => !d.rare).sort(() => Math.random() - .5).slice(0, 2).forEach(d => add({ ...d, use: 'decor', cat: 'Dekor' }, { pm: rnd(.9, 1.15), qty: 1, decor: true }));
  if ((S.flags.vendor && w <= 1) || Math.random() < .35) {
    const v = pick(SS.VENDORS);
    const rare = SS.DECOR.filter(d => d.rare && !S.decor.includes(d.id) && !(S.decorStore || []).includes(d.id));
    if (rare.length) add({ ...pick(rare), use: 'decor', cat: 'Dekor' }, { vendor: v.id, qty: 1, decor: true, pm: rnd(.9, 1.1) });
    pool.filter(g => g.use === 'buff' || g.use === 'gift').sort(() => Math.random() - .5).slice(0, 2).forEach(g => add(g, { vendor: v.id, pm: rnd(.6, .8), qty: rint(1, 2) }));
  }
  S.stock = L;
};
SS.buyStock = key => {
  const it = S.stock.find(s => s.key === key); if (!it || it.qty <= 0) return null;
  if (!SS.spend(it.price)) return 'Paran yetmiyor.';
  it.qty--;
  switch (it.use) {
    case 'eat': SS.eat({ id: it.gid, ...it.fx }); if (it.gid === 'kebab' || it.gid === 'soup') SS.bump('meal'); break;
    case 'inv': case 'gift': S.inv[it.gid] = (S.inv[it.gid] || 0) + 1; break;
    case 'buff': S.buffs[it.gid] = (S.buffs[it.gid] || 0) + 1; break;
    case 'decor': (S.decorStore = S.decorStore || []).push(it.gid); break;
    case 'torp': S.torps++; break;
    case 'fuel': S.fuel = Math.min(SS.tankCap(), S.fuel + 30); break;
  }
  return null;
};

/* ---------- envanter ---------- */
SS.takeBuff = k => { if (!S.buffs[k]) return false; S.buffs[k]--; return true; };
SS.useInv = (gid, target) => {
  if (!S.inv[gid]) return null;
  const g = SS.GOODS.find(x => x.id === gid), fun = SS.fun();
  let msg = null;
  if (gid === 'medkit') {
    const id = target || SS.crewList().find(c => S.crew[c].sick);
    if (!id || !S.crew[id].sick) return 'Kimse hasta değil.';
    S.crew[id].sick = false; S.crew[id].sickDays = 0; S.crew[id].hunger = 0; SS.bond(id, 5);
    msg = `${SS.comp(id).name} ilacını aldı ve iyileşti.`;
  } else if (gid === 'bandage') { SS.eat({ health: 20 }); msg = 'Bandajı sardın. Sağlık +20.'; }
  else if (g.use === 'gift') {
    const id = g.target === 'any' ? target : g.target;
    if (!id || !SS.hasCrew(id)) return 'Bu hediyeyi verecek kimse yok.';
    const amt = gid === 'choco' ? 8 : gid === 'kite' ? 12 : gid === 'oilcan' ? 10 : 15;
    SS.bond(id, amt); if (gid === 'kite') SS.mood(4); if (gid === 'oilcan') S.pitFree = 2;
    msg = fun ? `${SS.comp(id).name} hediyeye bayıldı. Bağ +${amt}.` : `${SS.comp(id).name} hediyeyi sessizce aldı, gözleri parladı. Bağ +${amt}.`;
  }
  if (msg) S.inv[gid]--;
  return msg;
};

/* ---------- dekor ---------- */
SS.decorSlots = () => SS.DECOR_SLOTS[S.home] + (SS.rankIdx() >= 2 ? 1 : 0);
// S.decor yuva sırasına göre (boş yuva = null); satın alınan dekor önce depoya (S.decorStore) gider
SS.decorPlaced = () => S.decor.filter(Boolean);
SS.decorFree = () => SS.decorSlots() - SS.decorPlaced().length;
SS.decorFx = () => SS.decorPlaced().reduce((a, id) => { const d = SS.DECOR.find(x => x.id === id); for (const k in d.fx) a[k] = (a[k] || 0) + d.fx[k]; return a; }, {});
SS.placeDecor = (slot, si) => { S.decorStore = S.decorStore || []; const id = S.decorStore[si]; if (!id || S.decor[slot] || slot >= SS.decorSlots()) return false; S.decor[slot] = id; S.decorStore.splice(si, 1); return true; };
SS.storeDecor = slot => { const id = S.decor[slot]; if (!id) return null; S.decor[slot] = null; (S.decorStore = S.decorStore || []).push(id); return SS.DECOR.find(x => x.id === id); };
SS.sellDecor = si => { const id = (S.decorStore || [])[si]; if (!id) return null; S.decorStore.splice(si, 1); const d = SS.DECOR.find(x => x.id === id); SS.earn(Math.round(d.price * .4)); return d; };

/* ---------- Rex yarışı ---------- */
// Rex her yenilgisinden ders alır: hedefi her galibiyetinde artar, her kaybında biraz geriler
SS.REX_STEP = { win: 1.1, lose: .95 };
SS.rexWeek = () => {
  if (!S.rexTarget) {
    // Rex seni izler: hedefi hem kendi tabanı hem senin geçen haftanın kazancı üzerinden belirlenir
    const base = rint(1600, 2800) * (1 + Math.floor((S.day - 1) / 7) * .18) * (1 + S.tier * .3) * (S.rexMult || 1);
    const last = (S.rexLog || []).slice(-1)[0], chase = last ? last.mine * rnd(.86, 1.08) * Math.pow(S.rexMult || 1, .3) : 0;
    S.rexTarget = Math.round(Math.max(base, chase) / 50) * 50;
  }
  return S.rexTarget;
};
SS.rexSettle = notes => {
  const target = SS.rexWeek(), mine = S.weekEarned || 0, fun = SS.fun();
  if (mine >= target) {
    const prize = Math.round(150 + target * .08);
    SS.earn(prize); SS.mood(8); S.rexMult = Math.min(5, (S.rexMult || 1) * SS.REX_STEP.win); S.aff.rex = Math.min(100, S.aff.rex + 5); S.stats.rexWins = (S.stats.rexWins || 0) + 1;
    notes.push(`Haftalık yarışı kazandın: ${fmt(mine)} / Rex ${fmt(target)}. Ödül ${fmt(prize)}. ${pick(SS.REX_LINES.win[fun ? 'easy' : 'hard'])}`);
  } else {
    SS.mood(-5); S.rexMult = Math.max(.7, (S.rexMult || 1) * SS.REX_STEP.lose);
    notes.push(`Haftalık yarışı Rex kazandı: ${fmt(target)} / sen ${fmt(mine)}. ${pick(SS.REX_LINES.lose[fun ? 'easy' : 'hard'])}`);
  }
  S.rexLog.push({ week: Math.ceil(S.day / 7), mine, rex: target, win: mine >= target });
  S.rexTarget = 0;
};

})(window.SS);

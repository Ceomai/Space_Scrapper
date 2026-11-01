// Space Scrapper — canvas mini oyunları: Hurda Avı, Kargo Teslimatı, Tamir İşi, Ayrıştırma Tesisi
(function(SS){
const G = SS.Games = {};
const { rnd, rint, pick, clamp } = SS;
const TAU = Math.PI * 2;

/* =====================================================================
   HURDA AVI ÇEŞİTLİLİĞİ — saha koşulları, yaratıklar, arka plan sahneleri
   ===================================================================== */
Object.assign(SS.ITEMS, {
  gold:  { name: 'Altın Damarlı Kaya',  cat: 'mineral', r: 18, val: 210, wt: 3.8, size: 2 },
  ice:   { name: 'Buz Kometi Parçası',  cat: 'mineral', r: 14, val: 60,  wt: 1.1, size: 1 },
  jelly: { name: 'Nebula Denizanası',   cat: 'bio',     r: 15, val: 170, wt: .8,  size: 1 },
  egg:   { name: 'Uzaylı Yumurtası',    cat: 'bio',     r: 13, val: 260, wt: 1.4, size: 1 },
  amber: { name: 'Balina Amberi',       cat: 'bio',     r: 12, val: 420, wt: 1,   size: 1 },
  mimic: { name: 'Taklitçi Kutu',       cat: null,      r: 16, val: 0,   wt: 1.5, size: 0 },
});
const DEEP_KINDS = ['jelly', 'egg', 'amber'];
// Her dalışta bir saha koşulu seçilir; bölgeye göre ağırlıklar değişir
const HUNT_VARIANTS = [
  { id: 'calm', name: 'Sakin saha', hint: 'Bugün uzay sessiz. Acele etmeden topla.', w: { belt: 3, yard: 2, gas: 2, pirate: 1, lost: 1 } },
  { id: 'drift', name: 'Akıntı', hint: 'Güneş rüzgârı her şeyi yana sürüklüyor. Hedefi önden karşıla.', w: { belt: 2, yard: 2, gas: 2, pirate: 1, lost: 1 } },
  { id: 'dark', name: 'Karanlık bölge', hint: 'Işık yalnızca kancanın etrafında. Kristaller hafifçe parlar.', w: { belt: 1, yard: 2, gas: 1, pirate: 1, lost: 2 } },
  { id: 'storm', name: 'Meteor yağmuru', hint: 'Kırmızı oklar meteor habercisi. Halata çarparsa yük düşer.', w: { belt: 2, yard: 1, gas: 1, pirate: 1, lost: 1 } },
  { id: 'eels', name: 'Yılan yuvası', hint: 'Yıldız yılanları yükü kapar. Geçmelerini bekle.', w: { belt: 0, yard: 2, gas: 2, pirate: 1, lost: 2 } },
  { id: 'whale', name: 'Balina göçü', hint: 'Bir uzay balinası geçiyor; arkasında değerli amber bırakabilir.', w: { belt: 1, yard: 0, gas: 2, pirate: 0, lost: 1 }, deep: 1 },
  { id: 'raiders', name: 'Korsan dronları', hint: 'Dronlar değerli parçaları çalmaya çalışır. Kancayla düşür.', w: { belt: 0, yard: 1, gas: 0, pirate: 3, lost: 1 } },
  { id: 'rich', name: 'Zengin damar', hint: 'Altın damarlı kayalar var; tanklar da her zamankinden çok.', w: { belt: 1.5, yard: 1, gas: 1, pirate: 1.5, lost: 1 },
    mix: m => { m.gold = (m.gold || 0) + 2; m.tank = (m.tank || 0) + 1; } },
  { id: 'frozen', name: 'Buz kuşağı', hint: 'Buz kometi parçaları hafif ve hızlı toplanır.', w: { belt: 2, yard: 0, gas: 1, pirate: 0, lost: 0 },
    mix: m => { m.ice = (m.ice || 0) + 5; m.rock = Math.max(0, (m.rock || 0) - 2); } },
  { id: 'nursery', name: 'Yuva', hint: 'Denizanaları parlarken dokunma, çarpar. Yumurtalar çok değerli.', w: { belt: 0, yard: 0, gas: 3, pirate: 0, lost: 2 }, deep: 1,
    mix: m => { m.jelly = (m.jelly || 0) + 3; m.egg = (m.egg || 0) + 2; m.slime = Math.max(0, (m.slime || 0) - 1); } },
];
const ZONE_EXTRA = { belt: { gold: .5, ice: 1 }, yard: { mimic: .6, gold: .4 }, gas: { jelly: 1, ice: .5 }, pirate: { mimic: .7, gold: 1 }, lost: { egg: 1, mimic: .5, jelly: .5 } };
SS.HUNT_VARIANTS = HUNT_VARIANTS; SS.ZONE_EXTRA = ZONE_EXTRA;
function pickVariant(zoneId, deepOK) {
  if (SS._forceVariant) return HUNT_VARIANTS.find(v => v.id === SS._forceVariant);
  const L = HUNT_VARIANTS.filter(v => (v.w[zoneId] || 0) > 0 && (!v.deep || deepOK));
  let r = Math.random() * L.reduce((a, v) => a + v.w[zoneId], 0);
  for (const v of L) { r -= v.w[zoneId]; if (r <= 0) return v; }
  return L[0];
}
const SCENE_HUES = [['#ff9a5c', '#7a2e3b'], ['#7ee0ff', '#1d3b78'], ['#c49bff', '#3d1f6e'], ['#9cf08a', '#1f5b46'], ['#ffd36b', '#7a4b1d']];
function mkScene(zoneId) {
  const [a, b] = pick(SCENE_HUES);
  return { planet: Math.random() < .7 ? { x: rnd(.1, .9), y: rnd(.18, .45), r: rnd(18, 54), a, b, ring: Math.random() < .45, tilt: rnd(-.5, .5) } : null,
    moon: Math.random() < .5 ? { x: rnd(.05, .95), y: rnd(.2, .35), r: rnd(5, 10) } : null,
    comet: Math.random() < .5 ? { x: rnd(.2, .9), y: rnd(.18, .3), ang: rnd(2.4, 2.9), len: rnd(40, 90) } : null,
    station: zoneId !== 'lost' && Math.random() < .35 ? { x: rnd(.15, .85), y: rnd(.22, .4) } : null,
    aurora: Math.random() < .35 ? { y: rnd(.3, .6), hue: pick([a, b]) } : null,
    snow: Array.from({ length: 40 }, () => ({ x: Math.random(), y: Math.random(), s: rnd(.4, 1.2) })) };
}
function drawScene(c, W, H, t, P, sc, V) {
  if (sc.aurora) { c.globalAlpha = .12; c.fillStyle = sc.aurora.hue; c.beginPath(); c.moveTo(0, sc.aurora.y * H);
    for (let x = 0; x <= W; x += 20) c.lineTo(x, sc.aurora.y * H + Math.sin(x * .02 + t * .4) * 18); c.lineTo(W, sc.aurora.y * H + 70); c.lineTo(0, sc.aurora.y * H + 70); c.fill(); c.globalAlpha = 1; }
  if (sc.planet) { const p = sc.planet, x = p.x * W, y = p.y * H, gr = c.createRadialGradient(x - p.r * .35, y - p.r * .35, p.r * .1, x, y, p.r);
    gr.addColorStop(0, p.a); gr.addColorStop(1, p.b); c.globalAlpha = .55; c.fillStyle = gr; c.beginPath(); c.arc(x, y, p.r, 0, TAU); c.fill();
    if (p.ring) { c.strokeStyle = p.a; c.lineWidth = 2; c.beginPath(); c.ellipse(x, y, p.r * 1.7, p.r * .35, p.tilt, 0, TAU); c.stroke(); }
    c.globalAlpha = 1; }
  if (sc.moon) { c.globalAlpha = .5; c.fillStyle = P.metalL; c.beginPath(); c.arc(sc.moon.x * W, sc.moon.y * H, sc.moon.r, 0, TAU); c.fill(); c.globalAlpha = 1; }
  if (sc.comet) { const k = sc.comet, x = k.x * W, y = k.y * H, gr = c.createLinearGradient(x, y, x - Math.cos(k.ang) * k.len, y - Math.sin(k.ang) * k.len);
    gr.addColorStop(0, 'rgba(255,255,255,.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.strokeStyle = gr; c.lineWidth = 2;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x - Math.cos(k.ang) * k.len, y - Math.sin(k.ang) * k.len); c.stroke(); }
  if (sc.station) { const x = sc.station.x * W, y = sc.station.y * H; c.globalAlpha = .4; c.fillStyle = P.metalD;
    c.fillRect(x - 18, y - 2, 36, 4); c.fillRect(x - 3, y - 10, 6, 20); c.beginPath(); c.arc(x, y, 6, 0, TAU); c.fill();
    if (Math.sin(t * 3) > 0) { c.fillStyle = P.bad; c.fillRect(x - 1, y - 12, 2, 2); } c.globalAlpha = 1; }
  if (V.id === 'frozen') { c.fillStyle = '#ffffff'; for (const s of sc.snow) { c.globalAlpha = .25 + s.s * .3; c.fillRect(s.x * W, ((s.y * H + t * 14 * s.s) % H), 1.5 * s.s, 1.5 * s.s); } c.globalAlpha = 1;
    c.fillStyle = 'rgba(160,220,255,.08)'; c.fillRect(0, 0, W, H); }
  if (V.id === 'storm') { c.fillStyle = 'rgba(255,90,60,.06)'; c.fillRect(0, 0, W, H); }
}
// Yeni eşyaların çizimi
const itemBase = SS.Art.item;
SS.Art.item = (c, it, t, P) => {
  const { x, y, r } = it;
  switch (it.kind) {
    case 'gold': itemBase(c, { ...it, kind: 'rock' }, t, P);
      c.save(); c.translate(x, y); c.rotate(it.rot || 0); c.strokeStyle = P.accent === P.warn ? '#ffd35a' : '#ffd35a'; c.lineWidth = 2.2;
      c.beginPath(); c.moveTo(-r * .6, -r * .2); c.lineTo(-r * .1, r * .1); c.lineTo(r * .5, -r * .3); c.moveTo(-r * .2, r * .5); c.lineTo(r * .3, r * .3); c.stroke();
      const sp = .5 + .5 * Math.sin(t * 4 + (it.seed || 0)); c.fillStyle = '#fff6c4'; c.globalAlpha = sp; c.fillRect(r * .3 - 1, -r * .4, 3, 3); c.globalAlpha = 1; c.restore(); return;
    case 'ice': c.save(); c.translate(x, y); c.rotate(it.rot || 0);
      c.fillStyle = 'rgba(190,240,255,.9)'; c.beginPath(); c.moveTo(0, -r); c.lineTo(r * .9, -r * .2); c.lineTo(r * .6, r * .8); c.lineTo(-r * .5, r * .9); c.lineTo(-r, 0); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.moveTo(-r * .3, -r * .5); c.lineTo(r * .2, -r * .6); c.lineTo(-r * .1, -r * .1); c.fill();
      c.strokeStyle = 'rgba(80,170,220,.8)'; c.lineWidth = 1; c.stroke(); c.restore(); return;
    case 'jelly': { const ch = it.charged, bob = Math.sin(t * 2 + (it.seed || 0)) * 2;
      if (ch) { c.globalAlpha = .35; c.fillStyle = P.crystal; c.beginPath(); c.arc(x, y + bob, r * 1.8, 0, TAU); c.fill(); c.globalAlpha = 1; }
      c.strokeStyle = ch ? P.crystal : P.slime; c.lineWidth = 1.6;
      for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(x + i * 4, y + bob + 2); c.quadraticCurveTo(x + i * 4 + Math.sin(t * 4 + i) * 4, y + bob + 12, x + i * 4 + Math.sin(t * 3 + i) * 3, y + bob + 20); c.stroke(); }
      c.fillStyle = ch ? 'rgba(126,243,255,.85)' : 'rgba(193,123,255,.75)'; c.beginPath(); c.ellipse(x, y + bob, r, r * .75, 0, Math.PI, TAU); c.quadraticCurveTo(x, y + bob + 6, x - r, y + bob); c.fill();
      c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.ellipse(x - r * .35, y + bob - r * .35, r * .25, r * .15, -.5, 0, TAU); c.fill(); return; }
    case 'egg': { const gl = .4 + .3 * Math.sin(t * 2.5 + (it.seed || 0));
      c.globalAlpha = gl; c.fillStyle = P.slime; c.beginPath(); c.arc(x, y, r * 1.5, 0, TAU); c.fill(); c.globalAlpha = 1;
      c.fillStyle = '#e9f2d0'; c.beginPath(); c.ellipse(x, y, r * .8, r, it.rot || 0, 0, TAU); c.fill();
      c.fillStyle = P.slimeD; [[-3, -4], [3, 1], [-2, 5], [4, -6]].forEach(([a, b]) => { c.beginPath(); c.arc(x + a, y + b, 1.8, 0, TAU); c.fill(); }); return; }
    case 'amber': { const gr = c.createRadialGradient(x - 3, y - 3, 1, x, y, r); gr.addColorStop(0, '#ffe7a1'); gr.addColorStop(1, '#d9781e');
      c.fillStyle = gr; c.beginPath(); c.ellipse(x, y, r, r * .8, it.rot || 0, 0, TAU); c.fill();
      c.globalAlpha = .5 + .5 * Math.sin(t * 3); c.fillStyle = '#fff'; c.fillRect(x - 4, y - 5, 2, 2); c.globalAlpha = 1; return; }
    case 'mimic': itemBase(c, { ...it, kind: 'box' }, t, P);
      if (it.teeth) { c.save(); c.translate(x, y); c.fillStyle = '#fff'; for (let i = -r + 2; i < r - 2; i += 5) { c.beginPath(); c.moveTo(i, r * .1); c.lineTo(i + 2.5, r * .45); c.lineTo(i + 5, r * .1); c.fill(); }
        c.fillStyle = P.bad; c.fillRect(-r * .5, -r * .45, 3, 3); c.fillRect(r * .3, -r * .45, 3, 3); c.restore(); } return;
  }
  itemBase(c, it, t, P);
};
// Yaratıklar ve tehlikeler
const segDist = (px, py, ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy || 1, k = clamp(((px - ax) * dx + (py - ay) * dy) / l, 0, 1); return Math.hypot(px - ax - k * dx, py - ay - k * dy); };
function drawEel(c, e, t, P) {
  c.lineCap = 'round';
  for (let i = 9; i >= 0; i--) { const x = e.x - e.dir * i * 7, y = e.y + Math.sin(t * 6 - i * .7 + e.ph) * 6, w = 9 - i * .6;
    c.fillStyle = i % 2 ? P.crystal2 : P.slime; c.beginPath(); c.arc(x, y, w, 0, TAU); c.fill(); }
  c.fillStyle = '#fff'; c.beginPath(); c.arc(e.x + e.dir * 3, e.y + Math.sin(t * 6 + e.ph) * 6 - 3, 2.6, 0, TAU); c.fill();
  c.fillStyle = P.space0; c.beginPath(); c.arc(e.x + e.dir * 3.6, e.y + Math.sin(t * 6 + e.ph) * 6 - 3, 1.2, 0, TAU); c.fill();
}
function drawDrone(c, d, t, P) {
  c.save(); c.translate(d.x, d.y);
  c.strokeStyle = P.metalL; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-14, -6); c.lineTo(14, -6); c.stroke();
  c.fillStyle = P.metalL; c.globalAlpha = .6; [-14, 14].forEach(x => { c.beginPath(); c.ellipse(x, -7, 6, 1.6 + Math.abs(Math.sin(t * 30)) * 1.2, 0, 0, TAU); c.fill(); }); c.globalAlpha = 1;
  c.fillStyle = P.tankD; c.beginPath(); c.arc(0, 0, 8, 0, TAU); c.fill(); c.fillStyle = P.bad; c.beginPath(); c.arc(0, 1, 3, 0, TAU); c.fill();
  c.strokeStyle = P.metal; c.lineWidth = 2; c.beginPath(); c.moveTo(-4, 7); c.lineTo(-6, 13); c.moveTo(4, 7); c.lineTo(6, 13); c.stroke();
  if (d.hover > 0 && !d.carry) { c.strokeStyle = P.bad; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 14, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, d.hover / 2.6)); c.stroke(); }
  c.restore();
  if (d.carry) SS.Art.item(c, { ...d.carry, x: d.x, y: d.y + 18 }, t, P);
}
function drawWhale(c, w, t, P) {
  c.save(); c.translate(w.x, w.y); c.globalAlpha = .55;
  c.fillStyle = P.metalD; c.beginPath(); c.ellipse(0, 0, 90, 32, 0, 0, TAU); c.fill();
  c.beginPath(); c.moveTo(-80, 0); c.lineTo(-130, -26 + Math.sin(t * 1.5) * 8); c.lineTo(-122, 0); c.lineTo(-130, 26 + Math.sin(t * 1.5) * 8); c.closePath(); c.fill();
  c.fillStyle = P.metal; c.beginPath(); c.ellipse(10, 12, 70, 14, 0, 0, Math.PI); c.fill();
  c.fillStyle = P.crystal; c.globalAlpha = .7; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(-50 + i * 20, -14 + Math.sin(i) * 4, 2, 0, TAU); c.fill(); }
  c.fillStyle = '#fff'; c.globalAlpha = .8; c.beginPath(); c.arc(60, -6, 3.5, 0, TAU); c.fill();
  c.restore(); c.globalAlpha = 1;
}
/* =====================================================================
   HURDA AVI — sallanan kanca (Gold Miner mekaniği)
   ===================================================================== */
G.scrap = (zoneId, onEnd, ct) => {
  const Z = SS.ZONES.find(z => z.id === zoneId);
  const W = 360, H = 600, OX = 180, OY = 98, MIN = 20;
  // Günün Avı: herkese aynı tohumlu alan, eşit şartlar, ekonomiye dokunmaz
  const daily = !!(ct && ct.daily); let dTorp = 1, score = 0;
  const dep = daily ? 1 : SS.zoneStock(zoneId), take = daily ? () => false : SS.takeBuff;
  const B = { oil: take('clawoil'), sensor: take('sensor'), bait: take('bait') }, sniffed = !daily && S.pitZone === zoneId;
  const radarOn = !daily && (SS.lvl('radar') || SS.assist('pit') || B.sensor || SS.perk('pit', 90));
  const g = { title: daily ? (ct.title || 'Günün Avı') : Z.name, W, H, quitLabel: 'Dön',
    helpers: [SS.assist('pit') && 'Pıtırcık: kara kutuların içi görünür', SS.assist('tolga') && 'Tolga: vinç %40 hızlı', sniffed && 'Pıtırcık\'ın kokladığı bölge: değer %30 fazla',
      !ct && !daily && 'Serbest dalış: değerler +%25, eser şansı yüksek', B.oil && 'Kanca yağı: kanca hızlı', B.sensor && 'Sensör pili: radar açık', B.bait && 'Yem: +2 sümüksü', dep < 1 && `Bölge stoku %${Math.round(dep * 100)}`, ct && !daily && `Sözleşme: ${ct.label}`].filter(Boolean),
    controls: [{ id: 'fire', label: 'Kancayı At', cls: 'primary big' }, { id: 'torp', label: 'Torpido', cls: 'danger' }] };
  const hook = { phase: 0, angle: 0, len: MIN, st: 'swing', held: null };
  const fx = SS.FX.make(), stars = SS.Art.makeStars(70, W, H);
  const got = []; let items = [], time = 0, timeMax = 0, lost = 0, shake = 0, endT = -1;
  let V = HUNT_VARIANTS[0], scene = null, actors = [], warns = [], meteorT = 3, eelT = 2, droneT = 3, intro = 3.2;
  const deepOK = daily || !SS.hasLic || SS.hasLic('scrap2');
  // Serbest dalış primi: sözleşmesiz dalışta yükün tamamı senin, değerler %25 fazla ve eser şansı yüksek
  const freeDive = !ct && !daily;
  const zm = daily ? Z.mult : Z.mult * (S.flags.scrapBoost || 1) * (sniffed ? 1.3 : 1) * (freeDive ? 1.25 : 1);
  const reach = daily ? 11 : 6 + SS.lvl('magnet') * 5;
  const extendSp = daily ? 7.9 : 6.5 + (SS.lvl('claw') + (B.oil ? 1 : 0)) * 1.4;
  if (daily) g.helpers = ['Herkes aynı alanda, eşit gemiyle oynar'];

  function rollBox() {
    const fc = SS.hard() ? .12 : .17;
    const fragOK = S.fragments < 5 && (zoneId !== 'belt' || S.fragments < 2) && zoneId !== 'lost';
    if (fragOK && !daily && Math.random() < fc) return { type: 'frag', label: 'PARÇA' };
    const r = Math.random();
    if (r < .38) return { type: 'cash', v: Math.round(rint(40, 180) * Z.mult), label: '₡' };
    if (r < .52) return { type: 'fuel', v: rint(15, 25), label: 'YAKIT' };
    if (r < .63) return { type: 'torp', label: 'TORP' };
    if (r < .76) return { type: 'crystal', label: 'KRİS' };
    if (r < .88) return { type: 'trap', label: '!' };
    return { type: 'cash', v: Math.round(rint(20, 80) * Z.mult), label: '₡' };
  }
  function mk(kind, x, y) {
    const T = SS.ITEMS[kind];
    const it = { kind, x, y, r: T.r, wt: T.wt, rot: rnd(-.5, .5), seed: Math.random() * 10 };
    if (kind === 'rock' || kind === 'boulder') it.poly = Array.from({ length: 9 }, () => rnd(.78, 1.08));
    if (kind === 'gold') it.poly = Array.from({ length: 9 }, () => rnd(.8, 1.06));
    if (kind === 'jelly') it.by = y;
    if (kind === 'mimic' && radarOn) it.tag = 'TAKLİTÇİ';
    if (T.move) { it.vx = (Math.random() < .5 ? -1 : 1) * rnd(.6, 1.2); }
    if (kind === 'box') { it.box = rollBox(); if (radarOn) it.tag = it.box.label; }
    return it;
  }
  function spawn() {
    const mix = { ...Z.mix };
    if (!daily && zoneId === 'belt' && S.flags.rexFirst) for (const k in mix) mix[k] = Math.ceil(mix[k] * .5);
    for (const k in mix) if (k !== 'tank') mix[k] = Math.round(mix[k] * dep);
    if (!daily && SS.hasLic && !SS.hasLic('scrap2')) { mix.crystal = 0; mix.sat = 0; mix.slime = 0; }
    if (B.bait) mix.slime = (mix.slime || 0) + 2;
    if (sniffed) mix.crystal = (mix.crystal || 0) + 1;
    mix.tank = daily ? (mix.tank || 0) + 1 : Math.round((mix.tank || 0) * SS.M().hazard);
    for (const [k, n] of Object.entries(ZONE_EXTRA[zoneId] || {})) if (Math.random() < n) mix[k] = (mix[k] || 0) + 1;
    if (V.mix) V.mix(mix);
    if (!deepOK) DEEP_KINDS.forEach(k => { mix[k] = 0; });
    if (daily) mix.mimic = 0;
    const order = ['sat', 'boulder', 'gold', 'plate', 'part', 'box', 'mimic', 'egg', 'crystal', 'rock', 'ice', 'bolts', 'tank', 'bug', 'jelly', 'slime'];
    const ranges = { sat: [300, 575], boulder: [290, 575], crystal: [380, 585], slime: [330, 560], tank: [260, 560], gold: [330, 580], egg: [380, 585], jelly: [220, 520], mimic: [250, 560] };
    const add = (kind, n) => {
      const T = SS.ITEMS[kind], [y0, y1] = ranges[kind] || [175, 585];
      for (let i = 0; i < n; i++) for (let k = 0; k < 150; k++) {
        const x = 16 + T.r + Math.random() * (W - 32 - 2 * T.r), y = y0 + Math.random() * (y1 - y0);
        if (y + T.r > H - 6) continue;
        if (items.every(o => Math.hypot(o.x - x, o.y - y) > o.r + T.r + 8)) { items.push(mk(kind, x, y)); break; }
      }
    };
    // sözleşme hedefleri sahada mutlaka bulunsun
    if (ct) ct.kinds.forEach(k => { mix[k] = Math.max(mix[k] || 0, Math.ceil((ct.qty + 1) / ct.kinds.length)); });
    order.forEach(k => add(k, mix[k] || 0));
    if (Z.relics.length && (!SS.hasLic || SS.hasLic('scrap2')) && (S.relicNext || Math.random() < (freeDive ? (SS.hard() ? .45 : .55) : (SS.hard() ? .2 : .25))) && !(ct && ct.daily)) {
      S.relicNext = false;
      const unfound = Z.relics.filter(r => !S.album[r]);
      const id = unfound.length && Math.random() < .75 ? pick(unfound) : pick(Z.relics);
      for (let k = 0; k < 100; k++) {
        const x = rnd(30, W - 30), y = rnd(420, 580);
        if (items.every(o => Math.hypot(o.x - x, o.y - y) > o.r + 22)) { const it = mk('relic', x, y); it.relic = id; items.push(it); break; }
      }
    }
  }
  const tip = () => ({ x: OX + Math.sin(hook.angle) * hook.len, y: OY + Math.cos(hook.angle) * hook.len });
  const torps = () => daily ? dTorp : S.torps;
  function updCtl() { SS.Stage.setCtl('torp', `Torpido (${torps()})`, torps() <= 0); }
  function blowTank(m) {
    SS.FX.burst(fx, m.x, m.y, ['#ffcf5a', '#ff8a3d', '#ff4b3a', '#fff3c4'], 70, 6);
    shake = 14; SS.sfx('boom');
    const hit = items.filter(o => Math.hypot(o.x - m.x, o.y - m.y) < 95);
    items = items.filter(o => !hit.includes(o));
    hit.filter(o => o.kind === 'tank').forEach(blowTank);
  }
  function grab(it) {
    const P0 = SS.Art.P();
    if ((it.kind === 'jelly' && it.charged) || it.kind === 'mimic') {
      hook.st = 'retract'; const loss = it.kind === 'mimic' ? 4 : 3; time = Math.max(.5, time - loss); shake = 8; SS.sfx('bad');
      if (it.kind === 'mimic') { items = items.filter(o => o !== it); SS.FX.burst(fx, it.x, it.y, [P0.box, P0.bad], 24, 4); const d = daily ? 0 : SS.hurt(4, 'Taklitçi kutu'); SS.FX.text(fx, it.x, it.y - 12, 'Taklitçi ısırdı!', P0.bad, `-${loss} sn${d ? ` · -${d} sağlık` : ''}`); }
      else { SS.FX.burst(fx, it.x, it.y, [P0.crystal, '#fff'], 20, 3.5); SS.FX.text(fx, it.x, it.y - 12, 'Çarpıldın!', P0.crystal, `-${loss} sn`); }
      return;
    }
    items = items.filter(o => o !== it); hook.st = 'retract';
    if (it.kind === 'tank') {
      blowTank(it);
      const d = daily ? 0 : SS.hurt(14, 'Patlama');
      if (d) SS.FX.text(fx, it.x, it.y - 10, `-${d} sağlık`, SS.Art.P().bad);
      const p = tip(); hook.held = mk('debris', p.x, p.y);
    } else { hook.held = it; SS.sfx('grab'); }
  }
  const isTarget = it => ct && !daily && ct.kinds.includes(it.kind) && ct.got < ct.qty;
  // Anı karesi: büyük yakalamanın görüntüsü paylaşım kartına girer
  const snap = (text, v) => { try { if (!SS.highlight || v >= SS.highlight.value) SS.highlight = { img: g.canvas.toDataURL('image/jpeg', .72), text, value: v, zone: Z.name }; } catch (e) {} };
  function collect(it) {
    if (daily) {
      const P = SS.Art.P(), v = it.kind === 'box' ? 120 : Math.round(SS.ITEMS[it.kind].val * Z.mult * SS.SCRAP_VAL);
      score += v; got.push({ kind: it.kind, value: v });
      SS.FX.text(fx, OX + 80, OY - 20, '+' + v, v >= 150 ? P.crystal : P.accent, it.kind === 'box' ? 'Kara kutu' : SS.ITEMS[it.kind].name);
      SS.FX.burst(fx, OX, OY, [P.accent, P.star], 12, 2.5); SS.sfx(v >= 150 ? 'big' : 'coin');
      if (v >= 150) snap(`${SS.ITEMS[it.kind].name} · +${v} puan`, v);
      return;
    }
    if (isTarget(it)) {
      ct.got++; const P = SS.Art.P();
      SS.FX.text(fx, OX + 80, OY - 20, `Hedef ${ct.got}/${ct.qty}`, P.good, `+${SS.fmt(ct.per)} · müşteriye`);
      SS.FX.burst(fx, OX, OY, [P.good, P.accent], 20, 3); SS.sfx('big');
      if (it.kind !== 'box') return;
    }
    const P = SS.Art.P(), tx = OX + 80, ty = OY - 20;
    if (it.kind === 'box') {
      const b = it.box;
      if (b.type === 'cash') { SS.earn(b.v); SS.FX.text(fx, tx, ty, '+' + SS.fmt(b.v), P.accent, 'Kara kutudan para'); got.push({ label: 'Kara kutu: ' + SS.fmt(b.v) }); }
      else if (b.type === 'fuel') { S.fuel = Math.min(SS.tankCap(), S.fuel + b.v); SS.FX.text(fx, tx, ty, `+${b.v} yakıt`, P.good); got.push({ label: `Kara kutu: ${b.v} yakıt` }); }
      else if (b.type === 'torp') { S.torps++; updCtl(); SS.FX.text(fx, tx, ty, '+1 Torpido', P.bad); got.push({ label: 'Kara kutu: 1 torpido' }); }
      else if (b.type === 'crystal') {
        const v = SS.ITEMS.crystal.val * zm * rnd(.9, 1.1) * SS.SCRAP_VAL;
        if (SS.addCargo('crystal', v)) { SS.FX.text(fx, tx, ty, 'Kristal!', P.crystal); got.push({ kind: 'crystal', value: Math.round(v) }); }
        else { lost++; SS.FX.text(fx, tx, ty, 'Kargo dolu!', P.bad); }
      }
      else if (b.type === 'frag') { if (SS.addFragment()) { SS.FX.text(fx, tx, ty, 'Kayıt parçası!', P.accent, `${S.fragments}/5`); got.push({ label: `Halcyon kayıt parçası (${S.fragments}/5)` }); } }
      else if (b.type === 'trap') {
        if (!SS.hard()) { S.morale = clamp(S.morale + 3, 0, 100); SS.FX.text(fx, tx, ty, 'Konfeti!', P.crystal2, 'Moral +3'); SS.FX.burst(fx, OX, OY, [P.crystal, P.crystal2, P.accent], 40, 4); }
        else { const d = SS.hurt(10, 'Tuzaklı kutu'); SS.FX.text(fx, tx, ty, 'Tuzak!', P.bad, `-${d} sağlık`); }
      }
      SS.sfx('coin');
      return;
    }
    const T = SS.ITEMS[it.kind];
    const v = it.kind === 'relic' ? T.val * Z.mult * .8 : T.val * zm * rnd(.9, 1.1) * SS.SCRAP_VAL;
    if (SS.addCargo(it.kind, v, it.relic ? { relic: it.relic } : {})) {
      got.push({ kind: it.kind, value: Math.round(v), relic: it.relic });
      const name = it.relic ? SS.RELICS[it.relic].name : T.name;
      if (v >= 250 || it.relic) snap(`${name} · ${Z.name}`, Math.round(v) + (it.relic ? 1000 : 0));
      SS.FX.text(fx, tx, ty, '≈' + SS.fmt(v * (S.prices[T.cat] || 1) * SS.sellMult() * (it.relic ? 1 : SS.gearMult())), v > 250 ? P.crystal : P.accent, name);
      SS.FX.burst(fx, OX, OY, [P.accent, P.star], 12, 2.5);
      SS.sfx(v > 250 ? 'big' : 'coin');
    } else { lost++; SS.FX.text(fx, tx, ty, 'Kargo dolu!', P.bad, T.name + ' uzaya bırakıldı'); SS.sfx('bad'); }
  }
  g.finish = reason => {
    if (g.done) return;
    g.done = true;
    g.result = { got, lost, reason, score, daily };
  };
  g.init = () => {
    timeMax = time = daily ? 45 : SS.M().jobTime + SS.moraleTime();
    const setup = () => { V = pickVariant(zoneId, deepOK); scene = mkScene(zoneId); spawn(); };
    if (daily) { const r0 = Math.random; Math.random = SS.mulberry(ct.seed); try { setup(); } finally { Math.random = r0; } } else setup();
    if (V.id === 'drift') for (const it of items) if (!it.vx) it.vx = (it.y % 2 < 1 ? -1 : 1) * rnd(.22, .42) / Math.max(1, it.wt * .5);
    if (V.id === 'whale') actors.push({ type: 'whale', x: -150, y: rnd(270, 400), vx: .55, dropped: false });
    const tEl = document.querySelector('#mini .mini-title'); if (tEl) tEl.textContent = `${g.title} · ${V.name}`;
    updCtl();
    if (zoneId === 'lost' && !S.lostVisited) { S.lostVisited = true; SS.unlockChapter('lost'); }
  };
  const fire = () => { if (hook.st === 'swing' && endT < 0) { hook.st = 'extend'; SS.sfx('fire'); } };
  const torp = () => {
    if (hook.st !== 'retract' || !hook.held || torps() <= 0) return;
    if (daily) dTorp--; else S.torps--; updCtl();
    SS.FX.burst(fx, hook.held.x, hook.held.y, ['#ffcf5a', '#ff8a3d', '#fff3c4'], 40, 5);
    hook.held = null; shake = 6; SS.sfx('boom');
  };
  g.action = id => id === 'fire' ? fire() : torp();
  g.pointer = () => fire();
  g.key = (k, down) => { if (!down) return; if (k === 'ArrowDown' || k === ' ') fire(); else if (k === 'ArrowUp' || k === 't') torp(); else return false; };
  g.update = (dt, f) => {
    SS.FX.step(fx, dt, f);
    if (shake > 0) shake = Math.max(0, shake - f * .8);
    if (endT >= 0) { endT -= dt; if (endT <= 0) g.finish('time'); return; }
    time -= dt;
    if (time <= 0) { time = 0; endT = .6; return; }
    for (const it of items) if (it.vx) { it.x += it.vx * f; if (it.x < 22 || it.x > W - 22) { it.vx *= -1; it.x = clamp(it.x, 22, W - 22); } }
    intro = Math.max(0, intro - dt);
    for (const it of items) {
      if (it.kind === 'jelly') { it.y = it.by + Math.sin(g.t * .9 + it.seed) * 14; it.charged = Math.sin(g.t * 1.7 + it.seed * 2) > .45; }
      else if (it.kind === 'mimic') it.teeth = Math.sin(g.t * 1.3 + it.seed) > .82;
    }
    stepActors(dt, f);
    if (hook.st === 'swing') { hook.phase += .032 * f; hook.angle = 1.2 * Math.sin(hook.phase); }
    else if (hook.st === 'extend') {
      hook.len += extendSp * f; const p = tip();
      for (const it of items) if (Math.hypot(it.x - p.x, it.y - p.y) < it.r + reach) { grab(it); break; }
      if (hook.st === 'extend' && (p.x < -5 || p.x > W + 5 || p.y > H + 5)) hook.st = 'retract';
    } else {
      const sp = hook.held ? (daily ? 9.5 / hook.held.wt * 1.28 : (9.5 / hook.held.wt) * (1 + SS.lvl('winch') * .28) * (SS.assist('tolga') ? 1.4 : 1)) : 11;
      hook.len -= sp * f;
      if (hook.held) { const p = tip(); hook.held.x = p.x + Math.sin(hook.angle) * hook.held.r * .8; hook.held.y = p.y + Math.cos(hook.angle) * hook.held.r * .8; }
      if (hook.len <= MIN) {
        hook.len = MIN; const it = hook.held; hook.held = null; hook.st = 'swing';
        if (it) { collect(it); if (!items.length) endT = .8; }
      }
    }
    const low = time <= 8;
    SS.Stage.hud(`<span class="${low ? 'warn' : ''}">⏱ ${Math.ceil(time)}</span>${daily ? `<span class="ok">Skor ${score}</span><span>${got.length} parça</span>` : `${ct ? `<span class="${ct.got >= ct.qty ? 'ok' : ''}">Hedef ${ct.got}/${ct.qty}</span>` : ''}<span>Kargo ${SS.cargoUsed()}/${SS.cargoCap()}</span>`}`);
  };
  g.draw = (c, P, t) => {
    if (shake > 0) c.translate(rnd(-shake, shake) * .5, rnd(-shake, shake) * .5);
    SS.Art.space(c, W, H, t, zoneId, stars, P);
    if (scene) drawScene(c, W, H, t, P, scene, V);
    for (const a of actors) if (a.type === 'whale') drawWhale(c, a, t, P);
    for (const it of items) { if (isTarget(it)) { c.strokeStyle = P.good; c.lineWidth = 2; c.globalAlpha = .45 + .45 * Math.sin(t * 6); c.beginPath(); c.arc(it.x, it.y, it.r + 7, 0, Math.PI * 2); c.stroke(); c.globalAlpha = 1; } SS.Art.item(c, it, t, P); }
    const bob = Math.sin(t * 1.6) * 2;
    SS.Art.ship(c, OX, 58 + bob, 1, t, P, { tier: S.tier });
    const p = tip();
    c.strokeStyle = P.rope; c.lineWidth = 2; c.beginPath(); c.moveTo(OX, 82 + bob); c.lineTo(OX, OY); c.lineTo(p.x, p.y); c.stroke();
    c.fillStyle = P.metalD; c.beginPath(); c.arc(OX, OY, 5, 0, TAU); c.fill();
    if (hook.held) SS.Art.item(c, hook.held, t, P);
    SS.Art.claw(c, p.x, p.y, hook.angle, hook.held ? .12 : .55, P);
    for (const a of actors) { if (a.type === 'eel') drawEel(c, a, t, P); else if (a.type === 'drone') drawDrone(c, a, t, P);
      else if (a.type === 'meteor') { c.fillStyle = P.flame; c.globalAlpha = .5; c.beginPath(); c.arc(a.x - a.vx * 2, a.y - a.vy * 2, 6, 0, TAU); c.fill(); c.globalAlpha = 1; c.fillStyle = P.rockD || P.metalD; c.beginPath(); c.arc(a.x, a.y, 5, 0, TAU); c.fill(); } }
    for (const w of warns) { c.fillStyle = P.bad; c.globalAlpha = .5 + .5 * Math.sin(t * 20); c.beginPath(); c.moveTo(w.x - 7, 112); c.lineTo(w.x + 7, 112); c.lineTo(w.x, 124); c.fill(); c.globalAlpha = 1; }
    if (V.id === 'dark') {
      const R = radarOn ? 150 : 105, dg = c.createRadialGradient(p.x, p.y, R * .35, p.x, p.y, R);
      dg.addColorStop(0, 'rgba(0,0,0,0)'); dg.addColorStop(1, 'rgba(4,3,12,.93)'); c.fillStyle = dg; c.fillRect(0, 108, W, H - 108);
      for (const it of items) if (it.kind === 'crystal' || it.kind === 'slime' || it.kind === 'egg' || it.kind === 'gold') { c.globalAlpha = .3 + .3 * Math.sin(t * 3 + it.seed); c.fillStyle = it.kind === 'gold' ? '#ffd35a' : P.crystal; c.fillRect(it.x - 1.5, it.y - 1.5, 3, 3); c.globalAlpha = 1; }
    }
    SS.FX.draw(fx, c);
    // süre çubuğu
    c.fillStyle = P.ui; c.fillRect(10, 8, W - 20, 6);
    c.fillStyle = time <= 8 ? P.bad : P.accent; c.fillRect(10, 8, (W - 20) * (time / timeMax), 6);
  };
  g.drawUI = (c, P) => {
    c.font = SS.tfont(11); c.textAlign = 'center'; c.textBaseline = 'middle';
    for (const it of [...items, hook.held]) if (it && it.tag) {
      const w = c.measureText(it.tag).width + 10;
      c.fillStyle = P.ui; c.fillRect(it.x - w / 2, it.y - it.r - 22, w, 16);
      c.fillStyle = P.accent; c.fillText(it.tag, it.x, it.y - it.r - 14);
    }
    SS.FX.drawText(fx, c, P);
    if (intro > 0) { c.globalAlpha = Math.min(1, intro); c.textAlign = 'center'; c.fillStyle = P.ui; c.fillRect(20, 250, W - 40, 62);
      c.fillStyle = P.accent; c.font = SS.tfont(20); c.fillText(V.name, W / 2, 272); c.fillStyle = P.text; c.font = SS.tfont(12);
      const words = V.hint.split(' '), lines = ['']; for (const wd of words) { if (c.measureText(lines[lines.length - 1] + ' ' + wd).width > W - 70) lines.push(wd); else lines[lines.length - 1] += (lines[lines.length - 1] ? ' ' : '') + wd; }
      lines.slice(0, 2).forEach((l, i) => c.fillText(l, W / 2, 292 + i * 15)); c.globalAlpha = 1; }
  };
  function cutRope(why) {
    const P = SS.Art.P(), p = tip();
    if (hook.held && hook.held.kind !== 'debris') { const it = hook.held; it.x = p.x; it.y = clamp(p.y + 10, 160, H - 20); items.push(it); }
    hook.held = null; hook.st = 'retract'; shake = 6; SS.sfx('bad'); SS.FX.text(fx, p.x, p.y - 10, why, P.bad);
  }
  function stepActors(dt, f) {
    const P = SS.Art.P(), p = tip(), ropeOut = hook.st !== 'swing' && hook.len > MIN + 6;
    if (V.id === 'storm') {
      meteorT -= dt; if (meteorT <= 0) { meteorT = rnd(2.2, 3.6); warns.push({ x: rnd(40, W - 40), t: .9 }); }
      for (const w of warns) { w.t -= dt; if (w.t <= 0) { const dir = w.x < W / 2 ? 1 : -1; actors.push({ type: 'meteor', x: w.x, y: 120, vx: dir * rnd(1.2, 2.4), vy: rnd(5, 6.5) }); } }
      warns = warns.filter(w => w.t > 0);
    }
    if (V.id === 'eels') { eelT -= dt; if (eelT <= 0 && actors.filter(a => a.type === 'eel').length < 2) { eelT = rnd(4, 7); const dir = Math.random() < .5 ? 1 : -1; actors.push({ type: 'eel', x: dir > 0 ? -60 : W + 60, y: rnd(210, 540), dir, sp: rnd(1.3, 2), ph: Math.random() * 6 }); } }
    if (V.id === 'raiders') { droneT -= dt; if (droneT <= 0 && actors.filter(a => a.type === 'drone').length < 2) { droneT = rnd(5, 8); actors.push({ type: 'drone', x: Math.random() < .5 ? -20 : W + 20, y: rnd(130, 200), hover: 0, carry: null, tgt: null }); } }
    for (const a of actors) {
      if (a.type === 'meteor') {
        a.x += a.vx * f; a.y += a.vy * f;
        if (ropeOut && segDist(a.x, a.y, OX, OY, p.x, p.y) < 7) { a.dead = true; SS.FX.burst(fx, a.x, a.y, [P.flame, P.bad], 14, 3); cutRope('Meteor halata çarptı!'); }
        if (a.y > H + 20) a.dead = true;
      } else if (a.type === 'eel') {
        a.x += a.dir * a.sp * f; const hy = a.y + Math.sin(g.t * 6 + a.ph) * 6;
        if (hook.st === 'extend' && Math.hypot(p.x - a.x, p.y - hy) < 18) { hook.st = 'retract'; SS.FX.text(fx, a.x, hy - 14, 'Yılan kancayı itti', P.crystal2); SS.sfx('bad'); }
        else if (hook.st === 'retract' && hook.held && hook.held.kind !== 'debris' && segDist(a.x, hy, OX, OY, p.x, p.y) < 12) { const it = hook.held; hook.held = null; SS.FX.text(fx, a.x, hy - 14, 'Yılan kaptı!', P.bad, SS.ITEMS[it.kind] ? SS.ITEMS[it.kind].name : ''); SS.FX.burst(fx, a.x, hy, [P.slime, P.crystal2], 18, 3); SS.sfx('bad'); }
        if (a.x < -90 || a.x > W + 90) a.dead = true;
      } else if (a.type === 'whale') {
        a.x += a.vx * f;
        if (!a.dropped && a.x > W * .55) { a.dropped = true; const it = mk('amber', a.x - 40, clamp(a.y + 50, 300, 560)); items.push(it); SS.FX.text(fx, a.x - 40, a.y + 30, 'Balina amber bıraktı', P.accent); }
        if (a.x > W + 200) a.dead = true;
      } else if (a.type === 'drone') {
        if (Math.hypot(p.x - a.x, p.y - a.y) < 20 && hook.st !== 'swing') {
          a.dead = true; SS.FX.burst(fx, a.x, a.y, [P.bad, P.flame, P.metalL], 30, 4.5); SS.FX.text(fx, a.x, a.y - 14, 'Dron düştü!', P.good); SS.sfx('boom'); shake = 6;
          if (a.carry) { a.carry.x = a.x; a.carry.y = clamp(a.y + 20, 180, H - 20); items.push(a.carry); }
          if (hook.st === 'extend') hook.st = 'retract'; continue;
        }
        if (a.carry) { a.y -= 1.6 * f; if (a.y < -30) a.dead = true; continue; }
        if (!a.tgt || !items.includes(a.tgt)) { const vals = items.filter(o => ['crystal', 'part', 'sat', 'gold', 'egg', 'slime', 'relic', 'amber', 'plate'].includes(o.kind)); a.tgt = vals.length ? pick(vals) : null; a.hover = 0; if (!a.tgt) { a.y -= f; if (a.y < -30) a.dead = true; continue; } }
        const dx = a.tgt.x - a.x, dy = a.tgt.y - 22 - a.y, d = Math.hypot(dx, dy);
        if (d > 3) { a.x += dx / d * Math.min(d, 1.25 * f); a.y += dy / d * Math.min(d, 1.25 * f); a.hover = 0; }
        else { a.hover += dt; if (a.hover > 2.6) { a.carry = a.tgt; items = items.filter(o => o !== a.tgt); SS.FX.text(fx, a.x, a.y - 14, 'Dron çaldı!', P.bad); SS.sfx('bad'); } }
      }
    }
    actors = actors.filter(a => !a.dead);
  }
  // Denge testleri için salt okunur durum (oyunda kullanılmaz)
  g._dbg = () => ({ items, hook, time, OX, OY, reach, extendSp, ct, V, zm, daily, actors });
  g.onEnd = onEnd;
  SS.Stage.open(g);
};

/* =====================================================================
   KARGO TESLİMATI — iniş oyunu (Lunar Lander)
   ===================================================================== */
G.deliver = (ct, onEnd) => {
  const W = 360, H = 600, pilot = S.skills.pilot;
  const thr = SS.lvl('thruster'), gyro = SS.lvl('gyro');
  const g = { title: 'Teslimat: ' + ct.dest, W, H, quitLabel: 'Vazgeç',
    helpers: [SS.assist('tolga') && 'Tolga: +40 yakıt, pist daha geniş', thr && `İtici ${thr}: güçlü itki`, gyro && `Jiroskop ${gyro}: toleranslı iniş`].filter(Boolean),
    controls: [{ id: 'left', label: '◀ Sol', hold: 1 }, { id: 'thrust', label: 'İtki', hold: 1, cls: 'primary big' }, { id: 'right', label: 'Sağ ▶', hold: 1 }] };
  const grav = .014 + ct.diff * .005 + ((ct.mods || []).includes('heavy') ? .004 : 0), thrust = .052 * (1 + thr * .15), rotSp = .05, fuelMax = 100 + pilot * 15 + (SS.assist('tolga') ? 40 : 0), burn = .3 * (1 - thr * .1);
  const padW = 78 - ct.diff * 12 + pilot * 4 + (SS.assist('tolga') ? 14 : 0) - ((ct.mods || []).includes('narrow') ? 14 : 0);
  const vyMax = (ct.fragile ? .9 : 1.3) + pilot * .12 + gyro * .15, vxMax = .9 + pilot * .08 + gyro * .1, aMax = .3 + pilot * .03 + gyro * .06;
  const mods = ct.mods || [], shield = SS.takeBuff('shield');
  const wind = mods.includes('windy') ? (Math.random() < .5 ? -1 : 1) * rnd(.004, .007) : ct.diff === 3 ? rnd(-.004, .004) : 0;
  if (shield) g.helpers.push('Kalkan jeli: kaza hasarı yarıya iner');
  if (mods.length) g.helpers.push(...(ct.modNames || []));
  const stars = SS.Art.makeStars(60, W, H), fx = SS.FX.make();
  const px = rnd(30, W - 30 - padW), padY = rnd(470, 540);
  const pts = [];
  for (let x = 0; x <= W; x += 24) if (x < px - 4 || x > px + padW + 4) pts.push([x, rnd(455, 580)]);
  pts.push([px, padY], [px + padW, padY]); pts.sort((a, b) => a[0] - b[0]);
  const gy = x => { for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; return y0 + (y1 - y0) * (x - x0) / Math.max(1, x1 - x0); } return pts[pts.length - 1][1]; };
  const sh = { x: rnd(60, 300), y: 70, vx: rnd(-.7, .7), vy: 0, a: 0 };
  let fuel = fuelMax, state = 'fly', endT = 0, flame = false, softLanding = false;
  g.finish = reason => {
    if (g.done) return; g.done = true;
    const ok = state === 'landed';
    g.result = { ok, tip: ok && mods.includes('tip') && softLanding ? Math.round(ct.pay * .25) : 0, pay: ok ? Math.round(ct.pay * (.8 + .4 * fuel / fuelMax)) : 0, quit: reason === 'quit' };
  };
  g.key = (k, down) => {
    if (k === 'ArrowLeft' || k === 'a') g.input.left = down;
    else if (k === 'ArrowRight' || k === 'd') g.input.right = down;
    else if (k === 'ArrowUp' || k === ' ' || k === 'w') g.input.thrust = down;
    else return false;
  };
  g.update = (dt, f) => {
    SS.FX.step(fx, dt, f);
    if (state !== 'fly') { endT -= dt; if (endT <= 0) g.finish(state); return; }
    if (g.input.left) sh.a -= rotSp * f;
    if (g.input.right) sh.a += rotSp * f;
    sh.a = clamp(sh.a, -1.4, 1.4);
    flame = g.input.thrust && fuel > 0;
    if (flame) { sh.vx += Math.sin(sh.a) * thrust * f; sh.vy -= Math.cos(sh.a) * thrust * f; fuel = Math.max(0, fuel - burn * f); }
    sh.vy += grav * f; sh.vx += wind * f;
    sh.x += sh.vx * f; sh.y += sh.vy * f;
    if (sh.x < 14) { sh.x = 14; sh.vx = Math.abs(sh.vx) * .5; }
    if (sh.x > W - 14) { sh.x = W - 14; sh.vx = -Math.abs(sh.vx) * .5; }
    if (sh.y < 24) { sh.y = 24; sh.vy = Math.max(0, sh.vy); }
    const bottom = sh.y + 13;
    if (bottom >= gy(sh.x)) {
      const onPad = sh.x - 12 >= px && sh.x + 12 <= px + padW;
      const ok = onPad && sh.vy <= vyMax && Math.abs(sh.vx) <= vxMax && Math.abs(sh.a) <= aMax;
      softLanding = sh.vy < .6;
      const P = SS.Art.P();
      if (ok) { state = 'landed'; sh.y = padY - 13; sh.a = 0; SS.FX.burst(fx, sh.x, padY, [P.good, P.accent, P.star], 30, 3); SS.FX.text(fx, sh.x, padY - 50, 'Teslim edildi!', P.good); SS.sfx('big'); }
      else {
        state = 'crashed'; SS.FX.burst(fx, sh.x, sh.y, ['#ffcf5a', '#ff8a3d', '#ff4b3a'], 80, 6); SS.sfx('boom');
        const d = SS.hurt(shield ? 8 : 16, 'Sert iniş'); S.morale = clamp(S.morale - 6, 0, 100);
        SS.FX.text(fx, sh.x, sh.y - 40, onPad ? 'Çok sert!' : 'Pist dışı!', P.bad, d ? `-${d} sağlık` : '');
      }
      endT = 1.4;
    }
    const P = SS.Art.P();
    const vyOk = sh.vy <= vyMax, aOk = Math.abs(sh.a) <= aMax;
    SS.Stage.hud(`<span class="${fuel < 20 ? 'warn' : ''}">Yakıt ${Math.round(fuel / fuelMax * 100)}%</span><span class="${vyOk ? 'ok' : 'warn'}">Düşüş ${(sh.vy * 10).toFixed(0)}</span><span class="${aOk ? 'ok' : 'warn'}">Açı ${Math.round(sh.a * 57)}°</span>`);
  };
  g.draw = (c, P, t) => {
    SS.Art.space(c, W, H, t, 'belt', stars, P);
    c.fillStyle = P.crystal2; c.globalAlpha = .5; c.beginPath(); c.arc(300, 120, 34, 0, TAU); c.fill(); c.globalAlpha = 1;
    c.fillStyle = P.groundD; c.beginPath(); c.moveTo(0, H); pts.forEach(([x, y]) => c.lineTo(x, y)); c.lineTo(W, H); c.fill();
    c.fillStyle = P.ground; c.beginPath(); c.moveTo(0, H); pts.forEach(([x, y]) => c.lineTo(x, y + 6)); c.lineTo(W, H); c.fill();
    c.fillStyle = P.metalD; c.fillRect(px, padY, padW, 6);
    c.fillStyle = Math.sin(t * 6) > 0 ? P.pad : P.accent; c.fillRect(px, padY - 3, 5, 3); c.fillRect(px + padW - 5, padY - 3, 5, 3);
    if (state !== 'crashed') {
      c.save(); c.translate(sh.x, sh.y); c.rotate(sh.a);
      if (flame) { c.fillStyle = P.flame; c.beginPath(); c.moveTo(-6, 8); c.lineTo(0, 22 + Math.sin(t * 50) * 5); c.lineTo(6, 8); c.fill(); }
      c.strokeStyle = P.metalD; c.lineWidth = 2; c.beginPath(); c.moveTo(-9, 5); c.lineTo(-14, 13); c.moveTo(9, 5); c.lineTo(14, 13); c.stroke();
      c.fillStyle = P.box; c.fillRect(-7, 4, 14, 7);
      SS.Art.ship(c, 0, 0, .38, t, P, { tier: S.tier });
      c.restore();
    }
    SS.FX.draw(fx, c);
    // yakıt göstergesi
    c.fillStyle = P.ui; c.fillRect(10, 10, 8, 120); c.fillStyle = fuel < 20 ? P.bad : P.good; c.fillRect(10, 10 + 120 * (1 - fuel / fuelMax), 8, 120 * fuel / fuelMax);
  };
  g.drawUI = (c, P) => {
    c.fillStyle = P.text; c.font = SS.tfont(12); c.textAlign = 'center'; c.fillText(ct.dest.toLocaleUpperCase('tr'), px + padW / 2, padY + 22);
    SS.FX.drawText(fx, c, P);
  };
  g.onEnd = onEnd;
  SS.Stage.open(g);
};

/* =====================================================================
   TAMİR İŞİ — kablo döndürme bulmacası
   ===================================================================== */
G.repair = (job, onEnd) => {
  const N = job.size, W = 360, H = 470, cs = 300 / N, ox = 30, oy = 110;
  const tk = SS.lvl('toolkit');
  const g = { title: 'Tamir: ' + job.what, W, H, quitLabel: 'Vazgeç', controls: [{ id: 'hint', label: 'İpucu', cls: '' }],
    helpers: [SS.assist('ela') && 'Ela: +2 ipucu, +15 sn', tk && `Takım çantası ${tk}: +${tk} ipucu, +${tk * 8} sn`, S.skills.eng && `Mühendislik ${S.skills.eng}: +${S.skills.eng * 6} sn`].filter(Boolean) };
  const NB = 1, EB = 2, SB = 4, WB = 8;
  const rot = m => ((m << 1) | (m >> 3)) & 15;
  const grid = [];
  const r0 = rint(0, N - 1), r1 = rint(0, N - 1);
  const path = []; let r = r0;
  for (let c = 0; c < N; c++) {
    const t = c === N - 1 ? r1 : rint(0, N - 1);
    path.push([r, c]);
    while (r !== t) { r += Math.sign(t - r); path.push([r, c]); }
  }
  const dirTo = (a, b) => b[0] < a[0] ? NB : b[0] > a[0] ? SB : b[1] > a[1] ? EB : WB;
  for (let i = 0; i < N; i++) { grid.push([]); for (let j = 0; j < N; j++) { const m = pick([5, 5, 3, 3, 3, 7]); grid[i].push({ m, sol: null }); } }
  path.forEach((p, i) => {
    const prev = i === 0 ? WB : dirTo(p, path[i - 1]);
    const next = i === path.length - 1 ? EB : dirTo(p, path[i + 1]);
    grid[p[0]][p[1]] = { m: prev | next, sol: prev | next };
  });
  const scramble = () => grid.forEach(row => row.forEach(cell => { for (let k = rint(0, 3); k > 0; k--) cell.m = rot(cell.m); }));
  let powered = new Set(), solved = false, endT = -1;
  const OPP = { 1: 4, 2: 8, 4: 1, 8: 2 }, DR = { 1: [-1, 0], 2: [0, 1], 4: [1, 0], 8: [0, -1] };
  function check() {
    powered = new Set();
    if (!(grid[r0][0].m & WB)) return false;
    const q = [[r0, 0]]; powered.add(r0 + ',0');
    while (q.length) {
      const [a, b] = q.shift(), m = grid[a][b].m;
      for (const d of [1, 2, 4, 8]) if (m & d) {
        const na = a + DR[d][0], nb = b + DR[d][1];
        if (na < 0 || nb < 0 || na >= N || nb >= N) continue;
        const k = na + ',' + nb;
        if (!powered.has(k) && (grid[na][nb].m & OPP[d])) { powered.add(k); q.push([na, nb]); }
      }
    }
    return powered.has(r1 + ',' + (N - 1)) && !!(grid[r1][N - 1].m & EB);
  }
  do scramble(); while (check());
  check();
  const rmods = job.mods || [], solder = SS.takeBuff('solder');
  let hints = rmods.includes('nohint') ? 0 : Math.floor(S.skills.eng / 2) + (SS.hard() ? 0 : 1) + (SS.assist('ela') ? 2 : 0) + tk + (solder ? 2 : 0) + (SS.perk('ela', 90) ? 1 : 0);
  if (solder) g.helpers.push('Lehim seti: +2 ipucu');
  if (rmods.length) g.helpers.push(...(job.modNames || []));
  const timeMax = (SS.hard() ? 60 : 72) + S.skills.eng * 6 + SS.moraleTime() + (N - 4) * 18 + (SS.assist('ela') ? 15 : 0) + tk * 8 + (rmods.includes('rush') ? -12 : 0);
  let time = timeMax;
  const fx = SS.FX.make();
  const updHint = () => SS.Stage.setCtl('hint', `İpucu (${hints})`, hints <= 0);
  g.init = updHint;
  g.finish = reason => { if (g.done) return; g.done = true; g.result = { ok: solved, pay: solved ? Math.round(job.pay * (.7 + .3 * time / timeMax)) : 0, quit: reason === 'quit' }; };
  const win = () => { solved = true; endT = 1.1; const P = SS.Art.P(); SS.FX.text(fx, W / 2, 80, 'Çalışıyor!', P.good); SS.FX.burst(fx, ox + 300 + 14, oy + (r1 + .5) * cs, [P.good, P.accent], 40, 4); SS.sfx('big'); };
  g.pointer = (x, y) => {
    if (solved || endT >= 0) return;
    const c = Math.floor((x - ox) / cs), rr = Math.floor((y - oy) / cs);
    if (c < 0 || rr < 0 || c >= N || rr >= N) return;
    grid[rr][c].m = rot(grid[rr][c].m); SS.sfx('tick');
    if (check()) win();
  };
  g.action = id => {
    if (id !== 'hint' || hints <= 0 || solved) return;
    const bad = path.find(([a, b]) => grid[a][b].m !== grid[a][b].sol);
    if (!bad) return;
    hints--; grid[bad[0]][bad[1]].m = grid[bad[0]][bad[1]].sol; updHint();
    if (check()) win();
  };
  g.update = (dt, f) => {
    SS.FX.step(fx, dt, f);
    if (endT >= 0) { endT -= dt; if (endT <= 0) g.finish(); return; }
    time -= dt; if (time <= 0) { time = 0; endT = .5; SS.sfx('bad'); }
    SS.Stage.hud(`<span class="${time < 10 ? 'warn' : ''}">⏱ ${Math.ceil(time)}</span><span>Ücret ${SS.fmt(job.pay)}</span>`);
  };
  g.draw = (c, P, t) => {
    c.fillStyle = P.space0; c.fillRect(0, 0, W, H);
    c.strokeStyle = P.metalD; c.globalAlpha = .25; c.lineWidth = 1;
    for (let i = 0; i < W; i += 20) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, H); c.stroke(); } c.globalAlpha = 1;
    c.fillStyle = P.ui; c.fillRect(10, 54, W - 20, 6); c.fillStyle = time < 10 ? P.bad : P.accent; c.fillRect(10, 54, (W - 20) * time / timeMax, 6);
    c.fillStyle = P.ui; c.fillRect(ox - 4, oy - 4, 308, 308);
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const x = ox + j * cs, y = oy + i * cs, cell = grid[i][j], on = powered.has(i + ',' + j);
      c.fillStyle = P.metalD; c.fillRect(x + 2, y + 2, cs - 4, cs - 4);
      c.fillStyle = P.space1; c.fillRect(x + 4, y + 4, cs - 8, cs - 8);
      c.strokeStyle = on ? (solved ? P.good : P.crystal) : P.metal; c.lineWidth = cs * .16; c.lineCap = 'round';
      const cx = x + cs / 2, cy = y + cs / 2;
      for (const d of [1, 2, 4, 8]) if (cell.m & d) { c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + DR[d][1] * cs / 2, cy + DR[d][0] * cs / 2); c.stroke(); }
      c.fillStyle = on ? P.accent : P.metalD; c.beginPath(); c.arc(cx, cy, cs * .11, 0, TAU); c.fill();
    }
    const sy = oy + (r0 + .5) * cs, ty = oy + (r1 + .5) * cs;
    c.fillStyle = P.good; c.fillRect(4, sy - 14, 20, 28); c.fillStyle = P.metalL; c.fillRect(10, sy - 18, 8, 4);
    c.fillStyle = solved ? P.accent : P.metalD; c.beginPath(); c.arc(W - 14, ty, 11, 0, TAU); c.fill();
    if (solved) { c.globalAlpha = .3 + .2 * Math.sin(t * 8); c.beginPath(); c.arc(W - 14, ty, 22, 0, TAU); c.fill(); c.globalAlpha = 1; }
    SS.FX.draw(fx, c);
  };
  g.drawUI = (c, P) => {
    c.textAlign = 'center'; c.fillStyle = P.text; c.font = SS.tfont(16); c.fillText('Kabloları döndür, akımı lambaya ulaştır', W / 2, 40);
    c.fillStyle = P.ui; c.font = SS.tfont(15); c.fillText('+', 14, oy + (r0 + .5) * cs + 5);
    SS.FX.drawText(fx, c, P);
  };
  g.onEnd = onEnd;
  SS.Stage.open(g);
};

SS.SORT_POOL = [
  { kind: 'bolts', bin: 0, name: 'Vida yığını' }, { kind: 'plate', bin: 0, name: 'Metal levha' }, { kind: 'part', bin: 0, name: 'Motor dişlisi' },
  { kind: 'bug', bin: 1, name: 'Uzay böceği' }, { kind: 'food', bin: 1, name: 'Muz kabuğu' }, { kind: 'plant', bin: 1, name: 'Hidroponik yaprak' },
  { kind: 'tank', bin: 2, name: 'Yakıt tankı' }, { kind: 'battery', bin: 2, name: 'Şişmiş pil' }, { kind: 'goo', bin: 2, name: 'Radyoaktif jel' },
];
SS.Art.sortThing = (c, o, t, P) => {
  if (SS.ITEMS[o.kind]) { c.save(); c.translate(o.x, o.y); c.scale(.85, .85); SS.Art.item(c, { ...o, x: 0, y: 0, r: Math.min(SS.ITEMS[o.kind].r, 17) }, t, P); c.restore(); return; }
  const { x, y } = o;
  if (o.kind === 'food') { c.fillStyle = P.accent; c.beginPath(); c.moveTo(x - 12, y + 6); c.quadraticCurveTo(x, y - 18, x + 12, y + 6); c.quadraticCurveTo(x, y - 2, x - 12, y + 6); c.fill(); c.fillStyle = P.boxD; c.fillRect(x + 10, y + 3, 3, 4); }
  else if (o.kind === 'plant') { c.fillStyle = P.bug; c.beginPath(); c.ellipse(x - 5, y, 5, 11, -.4, 0, TAU); c.ellipse(x + 5, y, 5, 11, .4, 0, TAU); c.fill(); c.fillStyle = P.bugD; c.fillRect(x - 1, y, 2, 13); }
  else if (o.kind === 'battery') { c.fillStyle = P.metalD; c.fillRect(x - 8, y - 13, 16, 26); c.fillStyle = P.warn; c.fillRect(x - 6, y - 4, 12, 15); c.fillStyle = P.metal; c.fillRect(x - 3, y - 17, 6, 4); c.fillStyle = P.ui; c.fillRect(x - 1, y - 1, 2, 8); }
  else if (o.kind === 'goo') { c.fillStyle = P.good; c.globalAlpha = .4 + .2 * Math.sin(t * 6); c.beginPath(); c.arc(x, y, 18, 0, TAU); c.fill(); c.globalAlpha = 1; c.fillStyle = P.metal; c.fillRect(x - 9, y - 12, 18, 24); c.fillStyle = P.good; c.fillRect(x - 7, y - 4, 14, 14); c.fillStyle = P.ui; c.fillRect(x - 4, y - 16, 8, 4); }
};

/* =====================================================================
   AYRIŞTIRMA TESİSİ — düşen hurdayı doğru kutuya at
   ===================================================================== */
G.sort = (shift, onEnd) => {
  const W = 360, H = 600;
  const repBonus = Math.floor(SS.repLvl('sort') / 2), gloves = SS.takeBuff('gloves');
  const g = { title: 'Ayrıştırma: ' + shift.name, W, H, quitLabel: 'Bitir',
    helpers: [SS.assist('ela') && 'Ela: her doğru +₡2', SS.assist('pit') && 'Pıtırcık: tehlikelileri işaretler', repBonus && `İtibar: her doğru +₡${repBonus}`, gloves && 'Eldiven: yanlışlar cezasız'].filter(Boolean),
    controls: [{ id: '0', label: 'Metal' }, { id: '1', label: 'Organik', cls: 'good' }, { id: '2', label: 'Tehlikeli', cls: 'danger' }] };
  const BINS = [{ label: 'METAL', x: 60 }, { label: 'ORGANİK', x: 180 }, { label: 'TEHLİKELİ', x: 300 }];
  const POOL = SS.SORT_POOL.map(o => [o.kind, o.bin]);
  const per = shift.per + (SS.assist('ela') ? 2 : 0) + repBonus;
  const timeMax = shift.time + SS.moraleTime();
  let time = timeMax, el = 0, spawnT = 0, score = 0, streak = 0, right = 0, wrong = 0, missed = 0, endT = -1;
  const falling = [], flying = [], fx = SS.FX.make();
  const binY = 505;
  g.finish = () => { if (g.done) return; g.done = true; g.result = { pay: Math.max(0, score), right, wrong, missed }; };
  const send = bi => {
    if (endT >= 0) return;
    const cur = falling.filter(f => !f.sent).sort((a, b) => b.y - a.y)[0];
    if (!cur) return;
    cur.sent = true; falling.splice(falling.indexOf(cur), 1);
    flying.push({ ...cur, tx: BINS[bi].x, ty: binY + 10, sx: cur.x, sy: cur.y, k: 0 });
    const P = SS.Art.P();
    if (cur.bin === bi) {
      streak++; right++; let add = per; if (streak % 5 === 0) { add += 2; SS.FX.text(fx, BINS[bi].x, binY - 60, `Seri x${streak}!`, P.crystal); }
      score += add; SS.FX.text(fx, BINS[bi].x, binY - 30, '+' + add, P.good); SS.sfx('coin');
    } else { streak = 0; wrong++; if (!gloves) score -= 4; SS.FX.text(fx, BINS[bi].x, binY - 30, gloves ? 'Yanlış (eldiven)' : 'Yanlış! -4', P.bad); SS.sfx('bad'); }
  };
  g.action = id => send(+id);
  g.pointer = (x, y) => { if (y > binY - 40) send(x < 120 ? 0 : x < 240 ? 1 : 2); };
  g.key = (k, down) => { if (!down) return; const m = { '1': 0, '2': 1, '3': 2, ArrowLeft: 0, ArrowDown: 1, ArrowRight: 2 }; if (k in m) send(m[k]); else return false; };
  g.update = (dt, f) => {
    SS.FX.step(fx, dt, f);
    flying.forEach(o => { o.k += dt * 4; o.x = o.sx + (o.tx - o.sx) * o.k; o.y = o.sy + (o.ty - o.sy) * o.k - Math.sin(o.k * Math.PI) * 40; });
    for (let i = flying.length - 1; i >= 0; i--) if (flying[i].k >= 1) flying.splice(i, 1);
    if (endT >= 0) { endT -= dt; if (endT <= 0) g.finish(); return; }
    time -= dt; el += dt;
    if (time <= 0) { time = 0; endT = .7; }
    spawnT -= dt;
    if (spawnT <= 0) {
      spawnT = Math.max(.5, 1.35 - el * .022 * shift.speed) / shift.speed;
      const [kind, bin] = shift.mix != null && Math.random() < .6 ? pick(POOL.filter(p => p[1] === shift.mix)) : pick(POOL);
      falling.push({ kind, bin, x: 180 + rnd(-16, 16), y: -20, r: 15, rot: rnd(-.5, .5), seed: Math.random() * 9, vx: 1 });
    }
    const sp = (1.1 + el * .03) * shift.speed;
    for (let i = falling.length - 1; i >= 0; i--) {
      const o = falling[i]; o.y += sp * f;
      if (o.y > binY - 18) { falling.splice(i, 1); missed++; streak = 0; score -= 2; SS.FX.text(fx, o.x, binY - 30, 'Kaçtı! -2', SS.Art.P().bad); }
    }
    SS.Stage.hud(`<span class="${time < 8 ? 'warn' : ''}">⏱ ${Math.ceil(time)}</span><span>Kazanç ${SS.fmt(Math.max(0, score))}</span><span>Seri ${streak}</span>`);
  };
  const drawThing = (c, o, t, P) => SS.Art.sortThing(c, o, t, P);
  g.draw = (c, P, t) => {
    c.fillStyle = P.space0; c.fillRect(0, 0, W, H);
    c.fillStyle = P.space1; c.fillRect(140, 0, 80, binY - 20);
    c.strokeStyle = P.metalD; c.lineWidth = 3; c.beginPath(); c.moveTo(140, 0); c.lineTo(140, binY - 20); c.moveTo(220, 0); c.lineTo(220, binY - 20); c.stroke();
    c.fillStyle = P.metalD; for (let y = (t * 40) % 30 - 30; y < binY - 20; y += 30) c.fillRect(144, y, 72, 3);
    c.fillStyle = P.warn; c.globalAlpha = .7; for (let x = 0; x < W; x += 24) { c.beginPath(); c.moveTo(x, binY - 26); c.lineTo(x + 12, binY - 26); c.lineTo(x + 6, binY - 20); c.fill(); } c.globalAlpha = 1;
    const cols = [P.metal, P.bug, P.tank];
    BINS.forEach((b, i) => {
      c.fillStyle = P.ui; c.fillRect(b.x - 52, binY, 104, 90);
      c.fillStyle = cols[i]; c.fillRect(b.x - 48, binY + 4, 96, 14);
    });
    // kutuların üstünde içerik örnekleri
    BINS.forEach((b, i) => SS.SORT_POOL.filter(o => o.bin === i).forEach((o, j) => { c.save(); c.translate(b.x - 30 + j * 30, binY + 74); c.scale(.5, .5); drawThing(c, { kind: o.kind, x: 0, y: 0, r: 15, rot: 0, vx: 1 }, t, P); c.restore(); }));
    const cur = falling.slice().sort((a, b) => b.y - a.y)[0];
    if (SS.assist('pit')) for (const o of falling) if (o.bin === 2) { c.strokeStyle = P.bad; c.globalAlpha = .5 + .5 * Math.sin(t * 10); c.lineWidth = 3; c.beginPath(); c.arc(o.x, o.y, 24, 0, TAU); c.stroke(); c.globalAlpha = 1; }
    for (const o of falling) drawThing(c, o, t, P);
    if (cur) { c.strokeStyle = P.accent; c.lineWidth = 2; c.strokeRect(cur.x - 22, cur.y - 22, 44, 44); }
    for (const o of flying) drawThing(c, o, t, P);
    SS.FX.draw(fx, c);
    c.fillStyle = P.ui; c.fillRect(10, 8, W - 20, 6); c.fillStyle = time < 8 ? P.bad : P.accent; c.fillRect(10, 8, (W - 20) * time / timeMax, 6);
  };
  g.drawUI = (c, P) => {
    c.textAlign = 'center';
    BINS.forEach((b, i) => {
      c.fillStyle = P.text; c.font = SS.tfont(14); c.fillText(b.label, b.x, binY + 40);
      c.fillStyle = P.metal; c.font = SS.tfont(11); c.fillText(`tuş ${i + 1}`, b.x, binY + 55);
    });
    const cur = falling.slice().sort((a, b) => b.y - a.y)[0];
    if (cur) {
      const name = SS.SORT_POOL.find(o => o.kind === cur.kind).name, w = c.measureText(name).width;
      c.font = SS.tfont(13); const tw = c.measureText(name).width + 14;
      c.fillStyle = P.ui; c.fillRect(cur.x - tw / 2, cur.y - 46, tw, 20);
      c.fillStyle = P.text; c.fillText(name, cur.x, cur.y - 31);
    }
    SS.FX.drawText(fx, c, P);
  };
  g.onEnd = onEnd;
  SS.Stage.open(g);
};

})(window.SS);

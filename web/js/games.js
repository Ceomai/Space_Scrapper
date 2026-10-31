// Space Scrapper — canvas mini oyunları: Hurda Avı, Kargo Teslimatı, Tamir İşi, Ayrıştırma Tesisi
(function(SS){
const G = SS.Games = {};
const { rnd, rint, pick, clamp } = SS;
const TAU = Math.PI * 2;

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
      B.oil && 'Kanca yağı: kanca hızlı', B.sensor && 'Sensör pili: radar açık', B.bait && 'Yem: +2 sümüksü', dep < 1 && `Bölge stoku %${Math.round(dep * 100)}`, ct && !daily && `Sözleşme: ${ct.label}`].filter(Boolean),
    controls: [{ id: 'fire', label: 'Kancayı At', cls: 'primary big' }, { id: 'torp', label: 'Torpido', cls: 'danger' }] };
  const hook = { phase: 0, angle: 0, len: MIN, st: 'swing', held: null };
  const fx = SS.FX.make(), stars = SS.Art.makeStars(70, W, H);
  const got = []; let items = [], time = 0, timeMax = 0, lost = 0, shake = 0, endT = -1;
  const zm = daily ? Z.mult : Z.mult * (S.flags.scrapBoost || 1) * (sniffed ? 1.3 : 1);
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
    const order = ['sat', 'boulder', 'plate', 'part', 'box', 'crystal', 'rock', 'bolts', 'tank', 'bug', 'slime'];
    const ranges = { sat: [300, 575], boulder: [290, 575], crystal: [380, 585], slime: [330, 560], tank: [260, 560] };
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
    if (Z.relics.length && (!SS.hasLic || SS.hasLic('scrap2')) && (S.relicNext || Math.random() < (SS.hard() ? .28 : .35)) && !(ct && ct.daily)) {
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
      SS.FX.text(fx, tx, ty, '≈' + SS.fmt(v * (S.prices[T.cat] || 1) * SS.sellMult()), v > 250 ? P.crystal : P.accent, name);
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
    if (daily) { const r0 = Math.random; Math.random = SS.mulberry(ct.seed); try { spawn(); } finally { Math.random = r0; } } else spawn();
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
    for (const it of items) { if (isTarget(it)) { c.strokeStyle = P.good; c.lineWidth = 2; c.globalAlpha = .45 + .45 * Math.sin(t * 6); c.beginPath(); c.arc(it.x, it.y, it.r + 7, 0, Math.PI * 2); c.stroke(); c.globalAlpha = 1; } SS.Art.item(c, it, t, P); }
    const bob = Math.sin(t * 1.6) * 2;
    SS.Art.ship(c, OX, 58 + bob, 1, t, P, { tier: S.tier });
    const p = tip();
    c.strokeStyle = P.rope; c.lineWidth = 2; c.beginPath(); c.moveTo(OX, 82 + bob); c.lineTo(OX, OY); c.lineTo(p.x, p.y); c.stroke();
    c.fillStyle = P.metalD; c.beginPath(); c.arc(OX, OY, 5, 0, TAU); c.fill();
    if (hook.held) SS.Art.item(c, hook.held, t, P);
    SS.Art.claw(c, p.x, p.y, hook.angle, hook.held ? .12 : .55, P);
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
  };
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
      streak++; right++; let add = per; if (streak % 5 === 0) { add += 5; SS.FX.text(fx, BINS[bi].x, binY - 60, `Seri x${streak}!`, P.crystal); }
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

// Sayfa içinde çalışan oyuncu botu. window.runSim(opts) -> sonuç raporu
(function () {
  const sleep0 = () => new Promise(r => setTimeout(r, 0));
  const fx = { energyAd: 40, adsPerDay: 2 };
  const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  // ortalama oyuncu: ~70 ms tepki sapması, hedefi her zaman en iyisinden seçmez, atışlar arası kısa duraksama
  const SKILL = { pick: .6, delay: () => Math.max(0, Math.round(4 + gauss() * 4)), think: () => Math.max(0, Math.round(20 + gauss() * 15)) };
  window.__setSkill = o => Object.assign(SKILL, o);
  // ---- hurda avı botu ----
  let hunting = null;
  const open0 = SS.Stage.open;
  SS.Stage.open = g => {
    g.draw = () => {}; g.drawUI = () => {};
    const up = g.update; let tick = 0, best = 0, pending = -1, think = 0;
    g.update = (dt, f) => {
      up(dt, f);
      if (!g._dbg || g.done) return;
      const d = g._dbg();
      if (pending >= 0) { if (pending-- === 0) { g.action('fire'); think = SKILL.think(); } return; }
      if (d.hook.st !== 'swing' || d.time < 1.5) return;
      if (think > 0) { think--; return; }
      if (tick++ % 8 === 0) best = bestRatio(d);
      const it = predict(d, d.hook.angle); if (!it) return;
      const r = ratio(d, it, Math.hypot(it.x - d.OX, it.y - d.OY));
      if (r > 0 && r >= best * SKILL.pick) pending = SKILL.delay();
    };
    open0(g);
  };
  const W = 360, H = 600;
  function val(d, it) {
    const T = SS.ITEMS[it.kind];
    if (it.kind === 'tank') return -120;
    if (it.kind === 'mimic') return -60;
    if (it.kind === 'jelly' && it.charged) return -40;
    if (it.kind === 'debris') return 1;
    let v = it.kind === 'box' ? 70 * d.zm : it.kind === 'relic' ? 520 * 1.4 : T.val * d.zm * SS.SCRAP_VAL * (S.prices[T.cat] || 1);
    if (d.ct && !d.daily && d.ct.kinds.includes(it.kind) && d.ct.got < d.ct.qty) v += d.ct.per;
    return v;
  }
  function frames(d, it, len) {
    const T = SS.ITEMS[it.kind];
    const rsp = (9.5 / T.wt) * (1 + SS.lvl('winch') * .28) * (SS.assist('tolga') ? 1.4 : 1);
    return len / d.extendSp + len / rsp + 35;
  }
  const ratio = (d, it, len) => val(d, it) / frames(d, it, len);
  function bestRatio(d) { let b = 0; for (const it of d.items) { const r = ratio(d, it, Math.hypot(it.x - d.OX, it.y - d.OY)); if (r > b) b = r; } return b; }
  function predict(d, a) {
    const sx = Math.sin(a), cy = Math.cos(a);
    for (let len = 20; len < 760; len += d.extendSp) {
      const x = d.OX + sx * len, y = d.OY + cy * len;
      if (x < -5 || x > W + 5 || y > H + 5) return null;
      for (const it of d.items) if (Math.hypot(it.x - x, it.y - y) < it.r + d.reach) return it;
    }
    return null;
  }
  const hunt = (zone, ct) => new Promise(res => { hunting = true; SS.Games.scrap(zone, r => { hunting = false; res(r); }, ct); });

  // ---- yardımcılar ----
  const LIC_PLAN = ['repair', 'sort', 'deliver', 'scrap2', 'order', 'scrap3'];
  const go = to => { if (S.loc === to) return true; const e = SS.travel(to); if (e) return false; R.sec += 4; return true; };
  let R;
  const blockJob = (en, min) => SS.jobBlock(en, min);
  function sellAll() {
    if (!S.cargo.length || !SS.isOpen('market')) return;
    if (!go('market')) return;
    const n = S.cargo.length, got = SS.sellIdx(S.cargo.map((_, i) => i), 1.08); R.sold += got; R.sec += 12; S.haggleUsed = true;
  }
  function eatIfNeeded() {
    const needE = S.energy < 45, needH = S.hunger < 45;
    if (!needE && !needH) return false;
    if (!SS.isOpen('cantina') || !go('cantina')) return false;
    let did = false;
    for (const d of SS.DRINKS.filter(x => x.id === 'coffee')) while ((S.drinks[d.id] || 0) < d.limit && S.energy < SS.maxEnergy() - 15 && SS.foodEnergyLeft() > 0 && SS.spend(Math.round(d.price * SS.M().foodMult))) { S.drinks[d.id] = (S.drinks[d.id] || 0) + 1; SS.eat({ energy: d.energy }); SS.passTime(5); R.sec += 4; R.spentFood += d.price; did = true; }
    if (S.hunger < 60 || S.energy < 40) { const f = SS.FOOD[1]; if (SS.spend(SS.foodPrice(f))) { SS.eat(f); SS.passTime(15); SS.bump('meal'); R.sec += 5; R.spentFood += f.price; did = true; } }
    return did;
  }
  function nap() {
    if (!SS.timeOk(SS.DUR.nap + 60) || S.today.nap) return false; S.today.nap = 1;
    if (!go('home')) return false;
    SS.passTime(SS.DUR.nap); SS.eat({ free: 1, energy: SS.NAP.energy, morale: SS.NAP.morale }); R.sec += 5; R.naps++; return true;
  }
  function watchAd() {
    if (!R.opts.ads || R.opts.adMode === 'double' || R.adsToday >= fx.adsPerDay) return false;
    if (R.adsToday >= SS.AD.perDay) return false; R.adsToday++; R.ads++; R.sec += 35; S.energy = Math.min(SS.maxEnergy(), S.energy + SS.AD.energy); return true;
  }
  function freeDiveEV(z) { const h = R.diveEV[z.id]; return h && h.n >= 2 ? h.sum / h.n : 300 * z.mult; }
  function jobEV(b) {
    if (b.type === 'deliver') return b.pay * .8;
    if (b.type === 'repair') return b.pay * .85 * .85;
    if (b.type === 'sort') { const n = b.time / (b.time > 40 ? .85 : 1.3); return b.per * n * (b.time > 40 ? .72 : .85) - 8; }
    if (b.type === 'hunt') return (b.fee + b.per * b.qty * .85 + b.fee * .5 * .6) + freeDiveEV(SS.ZONES.find(z => z.id === b.zone)) * .5;
    if (b.type === 'order') return SS.orderHave(b) >= b.qty ? b.pay : 0;
    return 0;
  }
  async function doJob(b) {
    const e0 = S.stats.earned, c0v = S.cargo.reduce((a, i) => a + i.value, 0); await doJob0(b);
    if (R.opts.adMode === 'double' && R.adsToday < 1 && b.type !== 'order') { const g = S.stats.earned - e0; if (g > 0) { SS.earn(g); R.adsToday++; R.ads++; R.sec += 35; R.adGain = (R.adGain || 0) + g; } }
    R.inc[b.type] = (R.inc[b.type] || 0) + (S.stats.earned - e0) + (S.cargo.reduce((a, i) => a + i.value, 0) - c0v);
  }
  async function doJob0(b) {
    if (b.type === 'order') { if (SS.fulfilOrder(b.id)) { SS.bump('order'); R.sec += 6; R.jobs.order++; } return; }
    if ((b.type === 'deliver' || b.type === 'hunt') && S.fuel < b.fuel) return;
    if (b.type === 'hunt') {
      S.fuel -= b.fuel; b.done = true; SS.useJob(b.energy, b.dur); S.stats.runs++; SS.bump('scrap'); S.zoneUse[b.zone] = (S.zoneUse[b.zone] || 0) + 1;
      const ct = { kinds: b.kinds, qty: b.qty, per: b.per, label: b.label, got: 0 };
      const c0 = S.cargo.reduce((a, i) => a + i.value, 0);
      await hunt(b.zone, ct);
      const full = ct.got >= ct.qty, pay = ct.got ? b.fee + b.per * ct.got + (full ? Math.round(b.fee * .5) : 0) : 0;
      SS.earn(pay); if (ct.got) SS.bump('hunt'); if (full) SS.repGain('scrap');
      R.sec += 60; R.jobs.hunt++; R.huntPay += pay; R.huntCargo += S.cargo.reduce((a, i) => a + i.value, 0) - c0; return;
    }
    b.done = true; SS.useJob(b.energy, b.dur); if (b.type === 'deliver') S.fuel -= b.fuel;
    if (b.type === 'deliver') { if (Math.random() < .8) { SS.earn(Math.round(b.pay * rnd(.85, 1.15))); S.stats.deliver++; SS.bump('deliver'); SS.repGain('deliver'); SS.mood(3); } R.sec += 70; R.jobs.deliver++; }
    if (b.type === 'repair') { if (Math.random() < .85) { SS.earn(Math.round(b.pay * rnd(.75, .95))); S.stats.repair++; SS.bump('repair'); SS.repGain('repair'); } R.sec += 100; R.jobs.repair++; }
    if (b.type === 'sort') { const lg = b.time > 40, n = Math.round(b.time / (lg ? .85 : 1.3)), right = Math.round(n * (lg ? rnd(.62, .82) : rnd(.78, .92))), wrong = n - right; const pay = Math.max(0, right * b.per - wrong * 3 + Math.floor(right / 8) * 2); SS.earn(pay); S.stats.sort++; SS.bump('sort'); SS.repGain('sort'); R.sec += b.time + 25; R.jobs.sort++; }
    SS.afterJobCrew && SS.afterJobCrew(); SS.checkGoals();
  }
  async function freeDive() {
    const zs = SS.ZONES.filter(z => !z.story && SS.zoneLic(z.id) && z.fuel <= S.fuel && z.fuel <= SS.tankCap());
    if (!zs.length || S.flags.storm) return false;
    const z = zs.sort((a, b) => freeDiveEV(b) * SS.zoneStock(b.id) - b.fuel * 3 - (freeDiveEV(a) * SS.zoneStock(a.id) - a.fuel * 3))[0];
    if (!go('hangar')) return false;
    if (blockJob(SS.COST.scrap, SS.DUR.scrap)) return false;
    S.fuel -= z.fuel; SS.useJob(SS.COST.scrap, SS.DUR.scrap); S.stats.runs++; SS.bump('scrap'); S.zoneUse[z.id] = (S.zoneUse[z.id] || 0) + 1;
    const c0 = S.cargo.reduce((a, i) => a + i.value, 0), m0 = S.cash;
    await hunt(z.id, null);
    const v = S.cargo.reduce((a, i) => a + i.value, 0) - c0 + (S.cash - m0);
    const h = R.diveEV[z.id] = R.diveEV[z.id] || { sum: 0, n: 0 }; h.sum += v; h.n++;
    R.sec += 60; R.jobs.dive++; R.diveVal += v; R.inc.dive = (R.inc.dive || 0) + v; return true;
  }
  function refuel() { if (S.fuel >= SS.tankCap() * .6) return; if (!go('hangar')) return; const n = SS.tankCap() - S.fuel, c = n * SS.fuelPrice(); if (S.cash > c + 100 && SS.spend(c)) { S.fuel += n; R.sec += 4; R.spentFuel += c; } }
  function reserve() { return 400 + (S.loan > 0 ? SS.M().installment : 0) * ((SS.monthDay() > 20) ? 1 : .4); }
  function shopping() {
    // lisans dersi
    if (SS.isOpen('academy') && S.energy >= SS.LESSON.energy + 25) for (const id of LIC_PLAN) {
      const L = SS.LICENSES[id]; if (SS.hasLic(id) || (L.req && !SS.hasLic(L.req))) continue;
      const c = S.course[id] = S.course[id] || { n: 0, last: 0 }; if (c.last === S.day) continue;
      const fee = Math.round(L.fee * SS.dv('costs')); if (S.cash < fee + reserve() || blockJob(SS.LESSON.energy, SS.LESSON.mins + 120)) break;
      if (!go('academy')) break;
      SS.spend(fee); SS.useJob(SS.LESSON.energy, SS.LESSON.mins); c.last = S.day; R.sec += 25; R.spentEdu += fee; R.lessons++;
      if (c.n < L.lessons - 1) c.n++; else if (Math.random() < .85) { S.lic[id] = 1; c.n = L.lessons; S.boardWin = -1; R.licDay[id] = S.day; } 
      break;
    }
    // ev
    if (S.home === 0 && S.cash > 2500 + reserve() + 500 && go('home')) { SS.spend(2500); S.home = 1; R.homeDay = S.day; R.sec += 6; }
    // geliştirmeler (hurda ve kargo öncelikli)
    const pri = ['cargo', 'winch', 'claw', 'magnet', 'tank', 'radar'];
    const wantUp = pri.some(id => { const u = SS.SHIP.find(x => x.id === id), lv = S.ship[id] || 0; return lv < u.costs.length && S.cash > SS.upCost(u, lv) + reserve() + 300; });
    const wantShip = SS.nextShip() && !SS.shipBlock() && S.cash >= SS.shipCost() + 300;
    if ((wantUp || wantShip) && go('hangar')) {
      for (const id of pri) { const u = SS.SHIP.find(x => x.id === id), lv = S.ship[id] || 0; if (lv >= u.costs.length) continue; const cost = SS.upCost(u, lv); if (S.cash > cost + reserve() + 300) { SS.spend(cost); S.ship[id] = lv + 1; S.upSpent += cost; R.spentUp += cost; R.sec += 5; } }
      const nx = SS.nextShip();
      if (nx && !SS.shipBlock() && S.cash >= SS.shipCost() + 300) { SS.buyShip(false); R.shipDays.push(S.day); R.sec += 20; }
    }
    // borç
    if (S.loan > 0 && SS.isOpen('krell')) { const extra = S.cash - reserve() - 1200; if (extra > 300 && go('krell')) { const n = SS.payLoan(extra); R.sec += 6; } }
  }
  async function workLoop() {
    for (let guard = 0; guard < 40; guard++) {
      if (S.over || S.time > 1380) { R.why.late = (R.why.late || 0) + 1; R.endT.push(S.time); return; }
      if (guard % 2 === 0) shopping();
      if (S.energy < 35) { if (!watchAd() && !(SS.foodEnergyLeft() > 0 && eatIfNeeded()) && !nap()) { R.energyStops = (R.energyStops || 0) + 1; return; } continue; }
      if (S.hunger < 35) eatIfNeeded();
      if (SS.cargoUsed() > SS.cargoCap() * .7) sellAll();
      refuel();
      // en iyi iş
      SS.refreshBoard && SS.refreshBoard();
      const jobsOpen = SS.isOpen('jobs', S.time + 30);
      let best = null, bestScore = 0;
      if (jobsOpen) for (const b of S.board) {
        if (b.done) continue; if (b.energy > S.energy - 5) continue; if (!SS.timeOk(b.dur + 40)) continue;
        if ((b.type === 'deliver' || b.type === 'hunt') && S.fuel < b.fuel) continue;
        if (R.opts.noContracts && b.type === 'hunt') continue;
        const ev = jobEV(b); if (ev <= 0) continue;
        const sc = ev / (b.energy + 6 + b.dur / 20);
        if (sc > bestScore) { bestScore = sc; best = b; }
      }
      const diveSc = (() => { const zs = SS.ZONES.filter(z => !z.story && SS.zoneLic(z.id) && z.fuel <= S.fuel); if (!zs.length || S.energy < SS.COST.scrap + 5 || !SS.timeOk(SS.DUR.scrap + 40)) return 0; return Math.max(...zs.map(z => freeDiveEV(z) * SS.zoneStock(z.id) - z.fuel * 3)) / (SS.COST.scrap + 6 + SS.DUR.scrap / 20); })();
      if (best && bestScore >= diveSc) { if (!go('jobs')) return; await doJob(best); }
      else if (diveSc > 0) { if (!(await freeDive())) { if (!best) return; if (!go('jobs')) return; await doJob(best); } }
      else { R.why.nojob = (R.why.nojob || 0) + 1; R.endT.push(S.time); R.nojobE = (R.nojobE || 0) + S.energy; R.nojobFuel = (R.nojobFuel||0) + S.fuel; return; }
      await sleep0();
    }
  }
  function handleTrial() {
    const T = S.trial; if (!T || T.done) return;
    const D = SS.TRIALS.find(t => t.id === T.id); R.trials++; R.sec += 50;
    if (T.demand < S.cash * .1) { SS.spend(T.demand); T.done = true; R.trialLoss += T.demand; return; }
    SS.passTime(30); S.energy -= 8;
    const c0 = S.cash; if (Math.random() < .62) D.win(T); else { D.lose(T); R.trialsLost++; } R.trialLoss += Math.max(0, c0 - S.cash); T.done = true;
  }
  const rnd = (a, b) => a + Math.random() * (b - a);

  window.runSim = async opts => {
    window.S = SS.newState([1, 1, 1], 'fun', 'Bot', opts.crew || ['pit']);
    S.nextEvent = null; SS.newDay([]); S.tut = null;
    R = { opts, sec: 0, ads: 0, adsToday: 0, naps: 0, sold: 0, spentFood: 0, spentFuel: 0, spentUp: 0, spentEdu: 0, lessons: 0, licDay: {}, shipDays: [], homeDay: 0,
      jobs: { hunt: 0, dive: 0, deliver: 0, repair: 0, sort: 0, order: 0 }, huntPay: 0, huntCargo: 0, diveVal: 0, diveEV: {}, inc: {}, why: {}, endT: [], trials: 0, trialsLost: 0, trialLoss: 0, energyEnd: [], loanPaidDay: 0, days: [] };
    while (S.day <= (opts.maxDay || 400) && !S.over && S.tier < 2) {
      R.adsToday = 0; R.sec += 25; // bülten ve sabah
      handleTrial();
      if (S.decision) { S.decision = null; }
      shopping();
      await workLoop();
      sellAll(); shopping();
      go('home'); R.sec += 20; // defter ve uyku
      R.energyEnd.push(S.energy);
      SS.trialIgnore && SS.trialIgnore();
      SS.sleep();
      if (S.loan <= 0 && !R.loanPaidDay) R.loanPaidDay = S.day;
      if (S.day % 7 === 0) R.days.push({ day: S.day, cash: S.cash, loan: S.loan, tier: S.tier, earned: S.stats.earned, min: Math.round(R.sec / 60) });
      await sleep0();
    }
    return { day: S.day, over: S.over, tier: S.tier, minutes: Math.round(R.sec / 60), ads: R.ads, naps: R.naps, sold: R.sold, earned: S.stats.earned, spentFood: R.spentFood, spentFuel: R.spentFuel, spentUp: R.spentUp, spentEdu: R.spentEdu,
      lessons: R.lessons, licDay: R.licDay, shipDays: R.shipDays, homeDay: R.homeDay, loanPaidDay: R.loanPaidDay, jobs: R.jobs, huntPay: R.huntPay, huntCargo: Math.round(R.huntCargo), diveVal: Math.round(R.diveVal),
      diveEV: Object.fromEntries(Object.entries(R.diveEV).map(([k, v]) => [k, Math.round(v.sum / v.n) + ' (' + v.n + ')'])), inc: R.inc, goalsEtc: 0, trials: R.trials, trialsLost: R.trialsLost, trialLoss: R.trialLoss,
      adGain: R.adGain || 0, energyStops: R.energyStops || 0, why: R.why, avgEndT: Math.round(R.endT.reduce((a,b)=>a+b,0)/Math.max(1,R.endT.length)), nojobE: Math.round((R.nojobE||0)/Math.max(1,R.why.nojob||1)), nojobFuel: Math.round((R.nojobFuel||0)/Math.max(1,R.why.nojob||1)), avgEnergyEnd: Math.round(R.energyEnd.reduce((a, b) => a + b, 0) / R.energyEnd.length), strikes: S.strikes, days: R.days };
  };
})();

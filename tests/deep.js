// Uzun oyun testi: node deep.js <başlangıç> <adet>
const { chromium } = require('playwright');
const fs = require('fs');
const start = +process.argv[2] || 0, count = +process.argv[3] || 27;
(async () => {
  const b = await chromium.launch();
  const results = [];
  for (let k = start; k < start + count; k++) {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } });
    const errs = []; p.on('pageerror', e => errs.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' | ')));
    await p.addInitScript(() => {
      let fake = 0; const q = []; const ch = new MessageChannel();
      ch.port1.onmessage = () => { const cbs = q.splice(0); fake += 1000 / 60; cbs.forEach(cb => { try { cb(fake); } catch (e) { setTimeout(() => { throw e; }); } }); };
      performance.now = () => fake; window.requestAnimationFrame = cb => { q.push(cb); ch.port2.postMessage(0); return 1; }; window.cancelAnimationFrame = () => {};
      try { localStorage.setItem('space-scrapper-prefs', JSON.stringify({ style: Math.random() < .5 ? 'pixel' : 'vector', muted: true })); } catch (e) {}
    });
    await p.goto('' + (process.env.GAME_URL || 'file://' + require('path').resolve(__dirname, '../web/index.html')) + '');
    await p.addScriptTag({ path: __dirname + '/bot.js' });
    const diff = [Math.floor(k / 9) % 3, Math.floor(k / 3) % 3, k % 3];
    const crews = [['pit'], ['ela'], ['tolga'], ['pit', 'ela'], ['pit', 'tolga'], ['ela', 'tolga'], ['pit', 'ela', 'tolga']];
    const crew = crews[k % crews.length];
    await p.evaluate(([diff]) => {
      window.__bad = []; window.__log = { decisions: 0, arcs: 0, trialsPay: 0, trialsFight: 0, trialsIgnore: 0, bank: 0, saves: 0, overs: [] };
      const R = () => Math.random();
      window.__check = tag => {
        const S = window.S; if (!S) return; const bad = [];
        const num = (n, v, lo, hi) => { if (typeof v !== 'number' || !isFinite(v)) bad.push(`${n}=${v}`); else if ((lo != null && v < lo - 1e-6) || (hi != null && v > hi + 1e-6)) bad.push(`${n}=${Math.round(v * 100) / 100}`); };
        num('cash', S.cash, 0); num('energy', S.energy, 0, SS.maxEnergy()); num('hunger', S.hunger, 0, 100); num('health', S.health, 0, 100); num('morale', S.morale, 0, 100);
        num('loan', S.loan, 0); num('arrears', S.arrears, 0); num('fuel', S.fuel, 0, SS.tankCap()); num('torps', S.torps, 0); num('strikes', S.strikes, 0, 3);
        S.cargo.forEach(c => { if (!SS.ITEMS[c.kind] || !isFinite(c.value)) bad.push('cargo ' + c.kind); });
        if (SS.cargoUsed() > SS.cargoCap() + 4) bad.push(`kargo ${SS.cargoUsed()}/${SS.cargoCap()}`);
        for (const id of SS.crewList()) num('bond_' + id, S.crew[id].bond, 0, 100);
        for (const kk in S.aff) num('aff_' + kk, S.aff[kk], 0, 100);
        try { SS.ledger(); SS.M(); SS.refreshBoard(); SS.refreshStock(); SS.rehberHtml && SS.rehberHtml(); } catch (e) { bad.push('fonk: ' + e.message); }
        try { const t = JSON.stringify(S); if (/NaN|null,"value"|Infinity/.test(t.replace(/"decision":null|"trial":null|"lender":null|"arc":null|"tease":null|"teaseToday":null|"event":null|"nextEvent":null|"pitZone":null/g, ''))) { const m = t.match(/.{0,40}(NaN|Infinity).{0,20}/); if (m) bad.push('json: ' + m[0]); } } catch (e) { bad.push('json hata'); }
        if (bad.length && window.__bad.length < 30) window.__bad.push({ day: S.day, tag, bad });
      };
      // akşam: isteğe bağlı kalemleri rastgele seç
      const sleep0 = SS.sleep;
      SS.sleep = sel => { if (!sel && R() < .6) { sel = new Set(SS.ledger().filter(i => !i.req && R() < .65).map(i => i.id)); } const r = sleep0(sel); window.__check('sleep'); if (S.over) window.__log.overs.push(S.over + '@' + S.day); return r; };
      // sabah: kararlar, sınamalar, banka, kaydet-yükle
      const nd0 = SS.newDay;
      SS.newDay = notes => {
        nd0(notes);
        try {
          if (S.decision && R() < .8) { const d = SS.curDecision(); if (d) { const ok = d.opts.map((o, i) => i).filter(i => !d.opts[i].need || d.opts[i].need()); if (ok.length) { SS.decide(ok[Math.floor(R() * ok.length)]); window.__log[d.arc ? 'arcs' : 'decisions']++; } } }
          if (S.trial && !S.trial.done) { const r = R(), T = S.trial, D = SS.TRIALS.find(t => t.id === T.id);
            if (r < .3 && S.cash >= T.demand) { S.cash -= T.demand; T.done = true; window.__log.trialsPay++; }
            else if (r < .75) { (R() < .5 ? D.win : D.lose)(T); T.done = true; window.__log.trialsFight++; }
            else window.__log.trialsIgnore++;
          }
          if (SS.nextShip() && !SS.shipBlock() && S.cash >= SS.shipCost() * .2 && S.cash < SS.shipCost() && R() < .25) { if (SS.buyShip(true)) window.__log.bank++; }
          if (R() < .1) { SS.save(); const s = SS.load(); if (!s) window.__bad.push({ day: S.day, bad: ['yükleme başarısız'] }); else { window.S = s; window.__log.saves++; } }
        } catch (e) { window.__bad.push({ day: S.day, tag: 'sabah', bad: [e.message] }); }
        window.__check('newDay');
      };
    }, [diff]);
    const t0 = Date.now();
    let res = null;
    try {
      res = await p.evaluate(o => window.runSim(o), { ads: k % 2 === 0, maxDay: 170, crew });
      // Yeni Oyun+ ve sonrası
      const ng = await p.evaluate(async () => { if (S.tier >= 2 && SS.canNGPlus && SS.canNGPlus()) { SS.newGamePlus(); window.__check('ng'); for (let i = 0; i < 15 && !S.over; i++) SS.sleep(); return 'ng ok gün ' + S.day; } return 'ng yok'; });
      res.ng = ng;
    } catch (e) { errs.push('runSim: ' + e.message.split('\n')[0]); }
    const extra = await p.evaluate(() => ({ bad: window.__bad, log: window.__log })).catch(() => ({}));
    const r = { k, diff, crew, ads: k % 2 === 0, day: res && res.day, tier: res && res.tier, over: res && res.over, ng: res && res.ng, sec: Math.round((Date.now() - t0) / 1000), errs: errs.slice(0, 5), bad: (extra.bad || []).slice(0, 5), badN: (extra.bad || []).length, log: extra.log };
    results.push(r);
    console.log(`#${k} zorluk ${diff} hane ${crew} → gün ${r.day} gemi ${r.tier} ${r.over || ''} · ${r.ng} · hata ${errs.length} ihlal ${r.badN} · ${r.sec}s`);
    await p.close();
  }
  fs.writeFileSync(__dirname + '/out/' + `deep-${start}.json`, JSON.stringify(results, null, 1));
  await b.close();
})();

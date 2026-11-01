// Rastgele arayüz testi: node monkey.js <oturum-no> <adım> 
const { chromium } = require('playwright');
const fs = require('fs');
const sid = +process.argv[2] || 0, STEPS = +process.argv[3] || 300;
let seed = 1000 + sid * 7919; const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const pick = a => a[Math.floor(rand() * a.length)];
const VIEWS = [[320, 568], [360, 640], [375, 667], [390, 844], [412, 915], [768, 1024], [1280, 800]];
(async () => {
  const b = await chromium.launch();
  const [w, h] = VIEWS[sid % VIEWS.length];
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  const errs = [], log = [];
  p.on('pageerror', e => errs.push({ step: log.length, msg: e.message, stack: (e.stack || '').split('\n').slice(0, 3).join(' | '), last: log.slice(-4) }));
  p.on('console', m => { if (m.type() === 'error') errs.push({ step: log.length, msg: 'console: ' + m.text(), last: log.slice(-4) }); });
  await p.addInitScript(([style, theme]) => {
    let fake = 0; const q = []; const ch = new MessageChannel();
    ch.port1.onmessage = () => { const cbs = q.splice(0); fake += 1000 / 60; cbs.forEach(cb => { try { cb(fake); } catch (e) { setTimeout(() => { throw e; }); } }); };
    performance.now = () => fake;
    window.requestAnimationFrame = cb => { q.push(cb); ch.port2.postMessage(0); return 1; };
    window.cancelAnimationFrame = () => {};
    try { localStorage.setItem('space-scrapper-prefs', JSON.stringify({ style, muted: true, theme })); } catch (e) {}
  }, [rand() < .5 ? 'pixel' : 'vector', pick(['lavanta', 'gece', 'pas'])]);
  await p.goto('' + (process.env.GAME_URL || 'file://' + require('path').resolve(__dirname, '../web/index.html')) + '');
  await p.waitForTimeout(300);
  // başlangıç ayarları
  const crew = ['pit', 'ela', 'tolga'].filter(() => rand() < .55);
  const cfg = { diff: [0, 1, 2].map(() => Math.floor(rand() * 3)), tone: rand() < .5 ? 'fun' : 'grim', crew: crew.length ? crew : ['pit'] };
  await p.evaluate(c => { window.S = SS.newState(c.diff, c.tone, 'Test', c.crew); S.nextEvent = null; SS.newDay([]); SS.pendingStory = 'intro'; SS.save(); SS.flow(); }, cfg);
  await p.waitForTimeout(200);
  const inv = () => p.evaluate(() => {
    const bad = []; if (!window.S) return bad;
    const num = (k, v, lo, hi) => { if (typeof v !== 'number' || !isFinite(v)) bad.push(`${k}=${v}`); else if ((lo != null && v < lo - 1e-6) || (hi != null && v > hi + 1e-6)) bad.push(`${k}=${v}`); };
    num('cash', S.cash, 0); num('energy', S.energy, 0, SS.maxEnergy()); num('hunger', S.hunger, 0, 100); num('health', S.health, 0, 100); num('morale', S.morale, 0, 100);
    num('loan', S.loan, 0); num('arrears', S.arrears, 0); num('fuel', S.fuel, 0, SS.tankCap()); num('day', S.day, 1); num('time', S.time, 420, 1500 + 400); num('torps', S.torps, 0);
    S.cargo.forEach(c => { if (!SS.ITEMS[c.kind] || !isFinite(c.value)) bad.push('cargo ' + c.kind + ' ' + c.value); });
    for (const id of SS.crewList()) num('bond_' + id, S.crew[id].bond, 0, 100);
    for (const k in S.aff) num('aff_' + k, S.aff[k], 0, 100);
    const t = (document.getElementById('app').innerText || '') + ' ' + (document.getElementById('modal').innerText || '') + ' ' + ((document.getElementById('mini') || {}).innerText || '');
    const m = t.match(/.{0,25}(NaN|undefined|\[object|Infinity).{0,25}/); if (m) bad.push('metin: ' + m[0].replace(/\n/g, ' '));
    const de = document.documentElement; if (de.scrollHeight > innerHeight + 2 || de.scrollWidth > innerWidth + 2) bad.push(`taşma ${de.scrollWidth}x${de.scrollHeight}`);
    return bad;
  });
  const invBad = [];
  const AVOID = new Set(['wipe', 'askWipe', 'toMenu', 'doNG', 'askNG']);
  let miniRun = 0, minis = 0;
  for (let step = 0; step < STEPS; step++) {
    try {
      const state = await p.evaluate(() => ({ mini: !!document.getElementById('mini'), modal: !document.getElementById('modal').hidden, over: !!(window.S && S.over), title: !!document.querySelector('main.title') }));
      if (state.title) { log.push('title'); const c = await p.$('[data-act=cont]'); if (!c) break; await c.click(); await p.waitForTimeout(200); continue; }
      if (state.mini) { if (miniRun === 0) minis++; if (++miniRun > 400) { errs.push({ step, msg: 'mini oyun bitmiyor: ' + log.filter(x => String(x).startsWith('MINI')).slice(-1)[0] }); await p.click('#miniQuit').catch(() => {}); miniRun = 0; } } else miniRun = 0;
      if (state.mini) {
        if (!log.length || !String(log[log.length-1]).startsWith('ctl') && !String(log[log.length-1]).startsWith('tap')) { const tt = await p.evaluate(() => document.querySelector('#mini .mini-title').textContent + ' | ' + (document.getElementById('miniHud') || {}).innerText); log.push('MINI ' + tt); }
        const r = rand();
        if (r < .55) { const ctl = await p.$$('#miniCtl button:not([disabled])'); if (ctl.length) { const c = pick(ctl); await c.click({ timeout: 800 }).catch(() => {}); log.push('ctl'); } }
        else if (r < .9) { const box = await p.$('#miniCanvas'); const bb = box && await box.boundingBox(); if (bb) { await p.mouse.click(bb.x + rand() * bb.width, bb.y + rand() * bb.height); log.push('tap'); } }
        else if (r < .97) { await p.waitForTimeout(400); log.push('bekle'); }
        else { await p.click('#miniQuit', { timeout: 800 }).catch(() => {}); log.push('quit'); }
        await p.waitForTimeout(40);
      } else {
        // ara sıra günü bitir
        if (state.mini) {}
        if (!state.modal && rand() < .05) { await p.evaluate(() => { S.loc = 'home'; S.view = 'map'; SS.ACT.ledger(); }); log.push('ledger'); continue; }
        if (!state.modal && rand() < .02) { await p.evaluate(() => { SS.save(); window.S = SS.load(); SS.render(); }); log.push('kaydet-yükle'); }
        const scope = state.modal ? '#modal' : '#app';
        const els = await p.$$(`${scope} [data-act]:not([disabled])`);
        const vis = [];
        for (const e of els) { const a = await e.getAttribute('data-act'); if (AVOID.has(a) && rand() > .02) continue; if (await e.isVisible()) vis.push([e, a]); }
        if (!vis.length) { log.push('boş'); await p.evaluate(() => SS.ACT.close && SS.ACT.close()); continue; }
        const W = { rhGo: .03, guide: .15, rehber: .15, sub: .6, roomSel: .5, close: 1.2, go: 3, job: 4, scrap: 3, eat: 1.5, drink: 1.5, casPlay: 2, lesson: 2.5, trial: 3, trialFight: 3, trialPay: 1, startSort: 3, decide: 2, mapPanel: 1, sell: 2, sellAll: 2, fuel: 2, upgrade: 2, buyShip: 2, train: 1.5, wheelSpin: 2, diceRoll: 2, raceGo: 2, slotPull: 2, cardBet: 2, cardGuess: 2, cardCash: 1, quizAns: 3, auditAns: 3, sleepNow: 2, ledger: 1, adEnergy: .4 };
        const tot = vis.reduce((x, [, a]) => x + (W[a] ?? 1), 0); let rr = rand() * tot, chosen = vis[0];
        for (const v of vis) { rr -= (W[v[1]] ?? 1); if (rr <= 0) { chosen = v; break; } }
        const [el, a] = chosen;
        if (a === 'playChallenge') { await p.fill('#chCode', pick(['MO-2K9F-340', 'abc', '', 'MO-ZZZZZZZZZ-99999999'])).catch(() => {}); }
        log.push(a + (await el.getAttribute('data-to') || await el.getAttribute('data-id') || await el.getAttribute('data-g') || ''));
        await el.click({ timeout: 1500 }).catch(e => log.push('tık-hata ' + e.message.split('\n')[0]));
        if (a === 'adEnergy') await p.waitForTimeout(5600);
        await p.waitForTimeout(rand() < .1 ? 3200 : 60);
      }
      const bad = await inv(); if (bad.length) invBad.push({ step, bad, last: log.slice(-3) });
      if (state.over) { log.push('oyun bitti'); break; }
    } catch (e) { errs.push({ step, msg: 'runner: ' + e.message.split('\n')[0] }); }
  }
  const fin = await p.evaluate(() => window.S ? { day: S.day, cash: Math.round(S.cash), tier: S.tier, over: S.over, lic: Object.keys(S.lic || {}).length } : null).catch(() => null);
  const out = { minis, log: log.slice(-40), sid, view: [w, h], cfg, steps: log.length, fin, errs: errs.slice(0, 8), inv: invBad.slice(0, 8), invCount: invBad.length, acts: [...new Set(log.map(x => x.replace(/[0-9a-z]{8,}$/, '')))].length };
  fs.writeFileSync(__dirname + '/out/' + `out-${sid}.json`, JSON.stringify(out, null, 1));
  console.log(`#${sid} ${w}x${h} gün ${fin && fin.day} mini ${minis} adım ${log.length} hata ${errs.length} ihlal ${invBad.length}`);
  await b.close();
})();

// Kapsamlı test paketi: içerik, çift dokunuş, yerleşim, bellek/performans, köprü, determinizm, çok uzun oyun
const { chromium } = require('playwright');
const fs = require('fs');
const URL = '' + (process.env.GAME_URL || 'file://' + require('path').resolve(__dirname, '../web/index.html')) + '';
const R = []; const ok = (n, d = '') => R.push(`✓ ${n}${d ? ' · ' + d : ''}`); const fail = (n, d) => R.push(`✗ ${n}\n    ${[].concat(d).slice(0, 6).join('\n    ')}`);
const FAST = () => { let fake = 0; const q = []; const ch = new MessageChannel(); ch.port1.onmessage = () => { const cbs = q.splice(0); fake += 1000 / 60; cbs.forEach(cb => { try { cb(fake); } catch (e) { setTimeout(() => { throw e; }); } }); }; performance.now = () => fake; window.requestAnimationFrame = cb => { q.push(cb); ch.port2.postMessage(0); return 1; }; window.cancelAnimationFrame = () => {}; };
(async () => {
  const b = await chromium.launch({ args: ['--enable-precise-memory-info', '--js-flags=--expose-gc'] });
  const page = async (opts = {}) => { const ctx = await b.newContext({ viewport: opts.vp || { width: 390, height: 844 } }); const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message + ' @ ' + (e.stack || '').split('\n')[1])); if (opts.fast) await p.addInitScript(FAST); if (opts.prefs) await p.addInitScript(pr => localStorage.setItem('space-scrapper-prefs', JSON.stringify(pr)), opts.prefs); await p.goto(URL); await p.waitForTimeout(250); p.ctx = ctx; return p; };
  const newGame = (p, crew = ['pit', 'ela', 'tolga'], diff = [1, 1, 1], tone = 'fun') => p.evaluate(([c, d, t]) => { window.S = SS.newState(d, t, 'T', c); S.nextEvent = null; SS.newDay([]); S.tut = null; SS.closeModal(); SS.render(); }, [crew, diff, tone]);

  /* 1. İçerik denetimi: her metnin iki tonu var mı, boş/undefined var mı */
  { const p = await page(); await newGame(p);
    const r = await p.evaluate(() => {
      const bad = [], seen = new WeakSet();
      const walk = (o, path) => { if (!o || typeof o !== 'object' || seen.has(o)) return; seen.add(o);
        if (('easy' in o) !== ('hard' in o) && typeof (o.easy || o.hard) === 'string') bad.push('tek ton: ' + path);
        for (const [k, v] of Object.entries(o)) { if (typeof v === 'string') { if (/undefined|NaN|\[object|\$\{/.test(v)) bad.push(`${path}.${k}: ${v.slice(0, 50)}`); if (('easy' === k || 'hard' === k) && !v.trim()) bad.push('boş: ' + path + '.' + k); }
          else if (Array.isArray(v)) v.forEach((x, i) => typeof x === 'string' ? (!x.trim() && bad.push('boş ' + path + k + i)) : walk(x, `${path}.${k}[${i}]`)); else walk(v, `${path}.${k}`); } };
      ['EVENTS', 'DECISIONS', 'ARCS', 'TRIALS', 'NPC_LINES', 'NEWS', 'MORNING', 'STORY', 'COMP_STORY', 'ENDINGS', 'REX_LINES', 'KRELL', 'JOB_LINES', 'TONES', 'GUIDE', 'COMPANIONS', 'LICENSES', 'HUNT_VARIANTS', 'DECOR', 'GOODS', 'SHIP', 'SHIPS'].forEach(k => SS[k] ? walk(SS[k], k) : bad.push('yok: ' + k));
      // her karar, yay ve sınamanın her sonucu iki tonda metin üretiyor mu
      let runs = 0; const snap = JSON.stringify(S);
      for (const tone of ['fun', 'grim']) { S.tone = tone;
        for (const d of SS.DECISIONS) d.opts.forEach((o, i) => { for (let t = 0; t < 6; t++) { window.S = JSON.parse(snap); S.tone = tone; S.cash = 9999; S.lender = 'bank'; S.loan = 5000; S.tier = 1; const r = o.run(); runs++; const x = SS.tx(r); if (!x || /undefined|NaN/.test(x)) bad.push(`${d.id}/${i}/${tone}: ${x}`); } });
        for (const a of SS.ARCS) a.steps.forEach((st, k) => st.opts.forEach((o, i) => { for (const sc of [0, 1, 2]) { window.S = JSON.parse(snap); S.tone = tone; S.cash = 9999; S.lender = 'bank'; S.loan = 5000; S.loanBase = 5000; S.arcScore = sc; const x = SS.tx(o.run()); runs++; if (!x || /undefined|NaN/.test(x)) bad.push(`${a.id}/${k}/${i}/${tone}: ${x}`); } }));
        for (const t of SS.TRIALS) { window.S = JSON.parse(snap); S.tone = tone; S.decor = ['plant', 'lamp']; S.cargo = []; S.torps = 1; S.loan = 3000; S.lender = 'krell'; const T = { demand: t.demand() }; if (!isFinite(T.demand) || T.demand <= 0) bad.push('talep ' + t.id + '=' + T.demand); [...t.win(T), ...t.lose(T)].forEach(x => { runs++; if (!x || /undefined|NaN/.test(x)) bad.push(t.id + ': ' + x); }); if (!SS.tx(t.text)) bad.push('metin yok ' + t.id); }
        for (const e of SS.EVENTS) { window.S = JSON.parse(snap); S.tone = tone; S.cargo = [{ kind: 'plate', value: 20, cat: 'metal' }]; const r = e.run(); const x = SS.tx(r || e.text); runs++; if (!x || /undefined|NaN/.test(x)) bad.push('olay ' + e.id + ' ' + x); }
      }
      window.S = JSON.parse(snap);
      return { bad, runs };
    });
    r.bad.length ? fail('İçerik denetimi', r.bad) : ok('İçerik denetimi', `${r.runs} sonuç metni iki tonda üretildi`); await p.ctx.close(); }

  /* 2. Çift dokunuş: her düğmeye çok hızlı iki kez bas */
  { const p = await page({ fast: true }); const issues = [];
    const scenarios = [
      ['jobs', 'job'], ['hangar', 'scrap'], ['hangar', 'upgrade'], ['hangar', 'fuel'], ['hangar', 'buyShip'], ['market', 'sellAll'], ['market', 'buy'], ['cantina', 'eat'], ['cantina', 'drink'], ['academy', 'lesson'], ['academy', 'train'], ['clinic', 'heal'], ['clinic', 'vax'], ['home', 'nap'], ['krell', 'pay'], ['casino', 'casPlay'],
    ];
    for (const [loc, act] of scenarios) {
      await newGame(p);
      await p.evaluate(([loc]) => { S.cash = 60000; S.loan = 0; S.lender = null; S.energy = 100; S.time = 17 * 60; S.fuel = 10; S.lic = { deliver: 1, repair: 1, sort: 1, order: 1, scrap2: 1, scrap3: 1 }; if (loc === 'academy') S.lic = {}; S.cargo = [{ kind: 'plate', value: 40, cat: 'metal' }, { kind: 'bolts', value: 10, cat: 'metal' }]; S.health = 50; S.loc = loc; S.view = loc; if (loc === 'krell') { S.loan = 3000; S.lender = 'krell'; } SS.refreshBoard(true); SS.render(); }, [loc]);
      if (act === 'buyShip') await p.evaluate(() => { S.sub = { hangar: 'yard' }; SS.render(); });
      if (act === 'upgrade') await p.evaluate(() => { S.sub = { hangar: 'upg' }; SS.render(); });
      if (act === 'buy') await p.evaluate(() => { S.sub = { market: 'buy' }; SS.render(); });
      if (act === 'train') await p.evaluate(() => { S.sub = { academy: 'skill' }; SS.render(); });
      const before = await p.evaluate(() => JSON.stringify({ cash: S.cash, tier: S.tier, ship: S.ship, done: S.board.filter(x => x.done).length, sk: S.skills, course: S.course, en: S.energy, t: S.time, fuel: S.fuel }));
      const el = await p.$(`#main [data-act=${act}]:not([disabled])`);
      if (!el) { issues.push(`${act}: düğme bulunamadı (${loc})`); continue; }
      await el.dblclick({ delay: 15 }).catch(() => {});
      await p.waitForTimeout(250);
      const after = await p.evaluate(() => ({ minis: document.querySelectorAll('#mini').length, cash: S.cash, tier: S.tier, ship: JSON.stringify(S.ship), done: S.board.filter(x => x.done).length, sk: JSON.stringify(S.skills), course: JSON.stringify(S.course), en: S.energy }));
      const B = JSON.parse(before);
      if (after.minis > 1) issues.push(`${act}: ${after.minis} mini oyun birden açıldı`);
      if (after.tier - B.tier > 1) issues.push(`${act}: iki gemi birden alındı`);
      if (after.done - B.done > 1) issues.push(`${act}: iki iş birden başladı`);
      const lv = o => Object.values(o).reduce((a, x) => a + x, 0);
      if (lv(JSON.parse(after.ship)) - lv(B.ship) > 1) issues.push(`${act}: çift dokunuşla iki geliştirme alındı`);
      if (lv(JSON.parse(after.sk)) - lv(B.sk) > 1) issues.push(`${act}: iki beceri eğitimi alındı`);
      if (after.cash < 0 || !isFinite(after.cash)) issues.push(`${act}: para ${after.cash}`);
      await p.evaluate(() => { const q = document.getElementById('miniQuit'); q && q.click(); SS.closeModal(); });
    }
    issues.length ? fail('Çift dokunuş', issues) : ok('Çift dokunuş', `${scenarios.length} eylemde çift işlem yok`);
    if (p.errs.length) fail('Çift dokunuş sayfa hataları', p.errs); await p.ctx.close(); }

  /* 3. Yerleşim: taşan yazı, ekran dışı düğme, küçük dokunma alanı, harita düğümü çakışması */
  for (const vp of [{ width: 320, height: 568 }, { width: 360, height: 740 }, { width: 412, height: 915 }, { width: 768, height: 1024 }]) for (const style of ['vector', 'pixel']) {
    const p = await page({ vp, prefs: { style, theme: 'gece', muted: true } }); await newGame(p);
    const r = await p.evaluate(() => {
      const bad = []; S.cash = 50000; S.tier = 1; S.lic = { deliver: 1, repair: 1, sort: 1, order: 1, scrap2: 1, scrap3: 1 }; S.decorStore = SS.DECOR.slice(0, 5).map(d => d.id); S.cargo = [{ kind: 'sat', value: 90, cat: 'metal' }, { kind: 'relic', value: 300, cat: 'relic', relic: 'r1' }];
      S.trial = { id: 'raid', day: 1, demand: 300, head: 'x', text: 'x', done: false }; S.decision = SS.DECISIONS[0].id;
      const subs = { home: ['room', 'crew', 'items', 'house'], jobs: ['all', 'hunt', 'deliver', 'repair', 'other'], hangar: ['hunt', 'upg', 'yard'], market: ['sell', 'buy'], cantina: ['food', 'tables'], academy: ['lic', 'skill'], casino: ['games', 'lounge'], log: ['cap', 'rehber', 'story', 'ach', 'set'] };
      const rect = e => e.getBoundingClientRect();
      for (const v of ['map', 'home', 'jobs', 'hangar', 'market', 'cantina', 'clinic', 'krell', 'academy', 'casino', 'log']) for (const sb of (subs[v] || [null])) {
        S.loc = v === 'map' || v === 'log' ? 'home' : v; S.view = v; S.sub = S.sub || {}; if (sb) S.sub[v] = sb; S.time = 900; SS.render();
        const tag = v + (sb ? '/' + sb : '');
        document.querySelectorAll('#app [data-act]').forEach(e => { const r = rect(e); if (!r.width) return; const scr = (() => { let q = e.parentElement; while (q && q !== document.body) { const cs = getComputedStyle(q); if (/(auto|scroll)/.test(cs.overflowX) && q.scrollWidth > q.clientWidth) return true; q = q.parentElement; } return false; })(); if (!scr && (r.right > innerWidth + 1 || r.left < -1)) bad.push(`${tag}: ekran dışı "${e.innerText.slice(0, 20)}"`); const hb = e.classList.contains('node') ? r.height + parseFloat(getComputedStyle(e, '::before').height || 0) : r.height; if (hb < 28 && !e.classList.contains('coach-x') && !e.classList.contains('chip-bet')) bad.push(`${tag}: küçük dokunma alanı ${Math.round(r.height)}px "${(e.innerText || e.getAttribute('aria-label') || '').slice(0, 20)}"`); });
        document.querySelectorAll('#app .btn, #app .qb, #app .node .n-name, #app .node .n-cost').forEach(e => { if (e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).textOverflow !== 'ellipsis') bad.push(`${tag}: taşan yazı "${e.innerText.slice(0, 24)}"`); });
        if (v === 'map') { const n = [...document.querySelectorAll('.node')].map(rect); for (let i = 0; i < n.length; i++) for (let j = i + 1; j < n.length; j++) { const a = n[i], c = n[j]; if (a.left < c.right - 4 && c.left < a.right - 4 && a.top < c.bottom - 4 && c.top < a.bottom - 4) bad.push(`harita: düğümler çakışıyor ${i}-${j}`); } }
        const de = document.documentElement; if (de.scrollHeight > innerHeight + 2 || de.scrollWidth > innerWidth + 2) bad.push(`${tag}: sayfa taşması`);
      }
      return [...new Set(bad)];
    });
    const name = `Yerleşim ${vp.width}x${vp.height} ${style}`;
    r.length ? fail(name, r) : ok(name); if (p.errs.length) fail(name + ' hataları', p.errs); await p.ctx.close();
  }

  /* 4. Bellek ve performans: 3000 ekran çizimi, harita animasyonu */
  { const p = await page(); await newGame(p);
    const r = await p.evaluate(async () => {
      const views = ['map', 'home', 'jobs', 'hangar', 'market', 'cantina', 'clinic', 'krell', 'academy', 'casino', 'log'];
      const mem = () => performance.memory ? performance.memory.usedJSHeapSize : 0; const nodes = () => document.getElementsByTagName('*').length;
      const run = n => { const t0 = performance.now(); for (let i = 0; i < n; i++) { const v = views[i % views.length]; S.loc = v === 'map' || v === 'log' ? 'home' : v; S.view = v; SS.render(); } return (performance.now() - t0) / n; };
      run(300); if (window.gc) gc(); await new Promise(r => setTimeout(r, 300)); const m0 = mem(), n0 = nodes();
      const avg = run(3000); if (window.gc) gc(); await new Promise(r => setTimeout(r, 300)); const m1 = mem(), n1 = nodes();
      S.view = 'map'; SS.render(); await new Promise(r => setTimeout(r, 2000));
      return { avg: avg.toFixed(1), growMB: ((m1 - m0) / 1048576).toFixed(1), nodes: [n0, n1], listeners: 0 };
    });
    (+r.growMB > 15) ? fail('Bellek', `3000 çizimde ${r.growMB} MB artış`) : ok('Bellek ve performans', `ekran başına ${r.avg} ms, 3000 çizimde bellek değişimi ${r.growMB} MB`);
    if (p.errs.length) fail('Bellek testi hataları', p.errs); await p.ctx.close(); }

  /* 5. Mini oyun kare süresi (gerçek zamanlı, 2 sn) */
  { const p = await page({ prefs: { style: 'pixel', muted: true } }); await newGame(p);
    const r = await p.evaluate(async () => {
      const out = {}; const measure = async (name, open) => { open(); const ts = []; let last = performance.now(); await new Promise(res => { const f = t => { ts.push(t - last); last = t; if (ts.length < 90) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); }); const q = document.getElementById('miniQuit'); q && q.click(); await new Promise(r => setTimeout(r, 200)); SS.closeModal(); ts.sort((a, b) => a - b); out[name] = Math.round(ts[Math.floor(ts.length * .9)]); };
      await measure('hurda', () => SS.Games.scrap('pirate', () => {}, null));
      await measure('savunma', () => SS.Games.shooter({ title: 'x', helpers: [] }, () => {}));
      await measure('kalkan', () => SS.Games.shield({ title: 'x', helpers: [] }, () => {}));
      S.view = 'map'; SS.render(); const ts = []; let last = performance.now(); await new Promise(res => { const f = t => { ts.push(t - last); last = t; if (ts.length < 60) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
      ts.sort((a, b) => a - b); out.harita = Math.round(ts[54]); return out;
    });
    const worst = Math.max(...Object.values(r)); (worst > 50) ? fail('Kare süresi (piksel)', JSON.stringify(r)) : ok('Kare süresi (piksel stil, %90 dilim ms)', JSON.stringify(r));
    await p.ctx.close(); }

  /* 6. Günün Avı determinizmi */
  { const r = [];
    for (let i = 0; i < 2; i++) { const p = await page({ fast: true }); await newGame(p);
      r.push(await p.evaluate(async () => { let snap = null; const o = SS.Stage.open; SS.Stage.open = g => { o(g); const d = g._dbg(); snap = JSON.stringify({ v: d.V.id, items: d.items.map(it => [it.kind, Math.round(it.x), Math.round(it.y)]) }); setTimeout(() => document.getElementById('miniQuit').click(), 30); }; SS.startHunt({ seed: 4242, mode: 'practice' }); await new Promise(r => setTimeout(r, 600)); return snap; }));
      await p.ctx.close(); }
    r[0] && r[0] === r[1] ? ok('Günün Avı herkes için aynı', `${JSON.parse(r[0]).items.length} nesne, saha ${JSON.parse(r[0]).v}`) : fail('Günün Avı determinizmi', [String(r[0]).slice(0, 80), String(r[1]).slice(0, 80)]); }

  /* 7. Uygulama köprüsü: AsyncStorage taklidiyle kayıt yeniden açılışta korunuyor mu */
  { const html = fs.readFileSync('' + require('path').resolve(__dirname, '../app/game/gameHtml.js') + '', 'utf8').replace(/^\/\/.*\n/gm, '').replace(/^export default /m, '').replace(/;\s*$/, '');
    const doc = JSON.parse(html.trim());
    fs.writeFileSync(__dirname + '/out/bundled.html', doc);
    const app = fs.readFileSync('' + require('path').resolve(__dirname, '../app/App.js') + '', 'utf8');
    const tpl = app.slice(app.indexOf('const bridgeScript = store => `') + 31, app.indexOf("})(); true;`;") + 11).replace("${Platform.OS}", 'android');
    const bridge = store => tpl.replace('${JSON.stringify(store)}', JSON.stringify(store));
    let store = {}; const posts = [];
    const boot = async () => { const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
      await p.exposeFunction('__rn', m => { const o = JSON.parse(m); posts.push(o.type); if (o.type === 'set') store[o.k] = o.v; if (o.type === 'remove') delete store[o.k]; if (o.type === 'clear') store = {}; });
      await p.addInitScript(`window.ReactNativeWebView = { postMessage: m => window.__rn(m) }; ${bridge(store)}`);
      await p.goto('file://' + __dirname + '/out/bundled.html'); await p.waitForTimeout(400); p.ctx = ctx; return p; };
    let p = await boot();
    await p.click('[data-act=start]'); await p.waitForTimeout(200); await p.evaluate(() => { SS.closeModal(); S.cash = 777; SS.save(); SS.ACT.ledger(); }); await p.click('[data-act=sleepNow]'); await p.waitForTimeout(300);
    await p.evaluate(() => { SS.haptic && SS.haptic(true); SS.scheduleNotes && SS.scheduleNotes(); });
    const day1 = await p.evaluate(() => S.day); const errs1 = p.errs; await p.ctx.close();
    p = await boot(); const cont = await p.$('[data-act=cont]'); let day2 = null; if (cont) { await cont.click(); await p.waitForTimeout(200); day2 = await p.evaluate(() => S.day); }
    (day2 === day1 && !errs1.length && !p.errs.length) ? ok('Uygulama köprüsü (APK kaydı)', `yeniden açılışta gün ${day2} geri geldi; mesajlar: ${[...new Set(posts)].join(', ')}`) : fail('Uygulama köprüsü', [`gün ${day1} → ${day2}`, ...errs1, ...p.errs]);
    await p.ctx.close(); }

  /* 8. Çok uzun oyun: 500 gün, 3 kez Yeni Oyun+, kayıt boyutu */
  { const p = await page({ fast: true }); await newGame(p, ['pit', 'ela', 'tolga'], [2, 2, 2], 'grim');
    const r = await p.evaluate(async () => {
      const bad = []; let maxSize = 0, slow = 0;
      for (const k of ['scrap', 'deliver', 'repair', 'sort', 'shooter', 'shield', 'whack', 'memory']) SS.Games[k] = (...a) => { const cb = a.find(x => typeof x === 'function'); setTimeout(() => cb && cb({ got: [], lost: 0, ok: true, pay: 100, right: 10, wrong: 1, missed: 1, win: Math.random() < .5 }), 0); };
      for (let ng = 0; ng < 4; ng++) {
        for (let d = 0; d < 125; d++) {
          S.cash += 2500; S.energy = SS.maxEnergy();
          if (S.loan > 0) SS.payLoan(S.cash - 500);
          if (SS.nextShip() && !SS.shipBlock() && S.cash > SS.shipCost()) SS.buyShip(false);
          if (S.decision) { const dd = SS.curDecision(); dd && SS.decide(0); }
          if (S.trial && !S.trial.done && Math.random() < .5) { S.trial.done = true; }
          const t0 = performance.now(); SS.sleep(); if (performance.now() - t0 > 50) slow++;
          if (d % 25 === 0) { const sz = JSON.stringify(S).length; maxSize = Math.max(maxSize, sz); }
          if (S.over) { bad.push(`oyun bitti ${S.over} gün ${S.day} ng ${ng}`); S.over = null; S.strikes = 0; }
        }
        if (S.tier >= 2 && SS.canNGPlus()) SS.newGamePlus(); else bad.push('NG+ yapılamadı (gemi ' + S.tier + ')');
      }
      return { bad, kb: Math.round(maxSize / 1024), slow, ng: S.ng, day: S.day };
    });
    const extra = r.kb > 600 ? [`kayıt ${r.kb} KB`] : [];
    (r.bad.length || extra.length || p.errs.length) ? fail('Çok uzun oyun (4×125 gün, Yeni Oyun+)', [...r.bad, ...extra, ...p.errs]) : ok('Çok uzun oyun', `Yeni Oyun+ ${r.ng}, en büyük kayıt ${r.kb} KB, yavaş gece ${r.slow}`);
    await p.ctx.close(); }

  /* 9. Saat sınırları: gece yarısı, 01:00 sonrası, fırtına, kapalı mekânlar */
  { const p = await page(); await newGame(p);
    const r = await p.evaluate(() => {
      const bad = [];
      for (const t of [420, 1379, 1440, 1499, 1500, 1560, 1700]) for (const loc of SS.LOCS.map(l => l.id)) {
        S.time = t; S.loc = 'home'; S.energy = 100; S.flags.storm = t === 1440;
        try { SS.ACT.go({ to: loc }); SS.closeModal(); if (S.time > Math.max(t, 1500) + 120) bad.push(`saat ${S.time} (${loc})`); SS.refreshBoard(); SS.render(); } catch (e) { bad.push(`${t}/${loc}: ${e.message}`); }
      }
      S.time = 1700; try { SS.ACT.ledger(); SS.sleep(); } catch (e) { bad.push('gece uyku ' + e.message); }
      if (S.time !== 420) bad.push('sabah saati ' + S.time);
      return bad;
    });
    (r.length || p.errs.length) ? fail('Saat sınırları', [...r, ...p.errs]) : ok('Saat sınırları', 'gece yarısı ve sonrası, fırtına, kapalı mekânlar');
    await p.ctx.close(); }

  console.log(R.join('\n'));
  await b.close();
})();

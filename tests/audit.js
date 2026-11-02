// Denetim testleri: girdi enjeksiyonu, kayıt kurcalama, eylem fuzz'ı (güvenlik ağı olmadan), saat dilimi ve DST,
// kalıcılık, yaşam döngüsü, uygulama köprüsü, uç sayılar, geri tuşu ve performans ölçümleri.
// Kullanım: node tests/audit.js [tur=1]   — çıktıdaki ✗ satırları başarısızlıktır.
const { chromium } = require('playwright');
const URL = process.env.GAME_URL || 'file://' + require('path').resolve(__dirname, '../web/index.html');
const ROUNDS = +process.argv[2] || 1;
const VIEWS = ['map', 'home', 'jobs', 'hangar', 'market', 'cantina', 'clinic', 'krell', 'academy', 'casino', 'log'];
const SUBS = { home: ['room', 'crew', 'items', 'house'], jobs: ['all', 'hunt', 'deliver', 'repair', 'other'], hangar: ['hunt', 'upg', 'yard'], market: ['sell', 'buy'], cantina: ['food', 'tables'], academy: ['lic', 'skill'], casino: ['games', 'lounge'], log: ['cap', 'rehber', 'story', 'ach', 'set'] };
const FAST = () => { let fake = 0; const q = []; const ch = new MessageChannel(); ch.port1.onmessage = () => { const cbs = q.splice(0); fake += 1000 / 60; cbs.forEach(cb => { try { cb(fake); } catch (e) {} }); }; performance.now = () => fake; window.requestAnimationFrame = cb => { q.push(cb); ch.port2.postMessage(0); return 1; }; window.cancelAnimationFrame = () => {}; try { if (!localStorage.getItem('space-scrapper-prefs')) localStorage.setItem('space-scrapper-prefs', JSON.stringify({ style: 'vector', muted: true })); } catch (e) {} };

(async () => {
  const b = await chromium.launch();
  const report = []; let total = 0, failed = 0;
  const run = async (name, fn, opts = {}) => {
    total++;
    const ctx = await b.newContext({ viewport: opts.vp || { width: 390, height: 844 }, timezoneId: opts.tz, locale: 'tr-TR' }); const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', e => errs.push(e.message + ' @ ' + (e.stack || '').split('\n')[1]));
    p.on('console', m => { const t = m.text(); if (/Eylem hatası/.test(t)) errs.push('güvenlik ağına düşen hata: ' + t.slice(0, 160)); });
    if (opts.fast !== false) await p.addInitScript(FAST);
    if (opts.init) await p.addInitScript(opts.init, opts.initArg);
    let note = '';
    try { note = (await Promise.race([fn(p, ctx), new Promise((_, rej) => setTimeout(() => rej(new Error('zaman aşımı (' + (opts.limit || 120) + ' sn)')), (opts.limit || 120) * 1000))])) || ''; } catch (e) { errs.push('test: ' + e.message.split('\n')[0]); }
    if (errs.length) failed++;
    const line = `${errs.length ? '✗' : '✓'} ${name}${note ? ' · ' + note : ''}${errs.length ? '\n    ' + [...new Set(errs)].slice(0, 4).join('\n    ') : ''}`;
    report.push(line); console.log(line);
    await ctx.close().catch(() => {});
  };
  const boot = async (p, name) => {
    await p.goto(URL); await p.waitForTimeout(200);
    if (name != null) await p.fill('#capName', name);
    await p.click('[data-act=start]'); await p.waitForTimeout(100);
    await p.evaluate(() => { SS.closeModal(); S.tut = null; S.easeSeen = 1; });
  };
  // Bütün ekranları, alt sekmeleri ve önemli modalları çizer
  const sweep = p => p.evaluate(([VIEWS, SUBS]) => {
    for (const v of VIEWS) { S.loc = v === 'map' || v === 'log' ? S.loc : v; S.view = v; S.sub = S.sub || {}; for (const s of SUBS[v] || [null]) { if (s) S.sub[v] = s; SS.render(); } }
    S.view = 'map'; SS.render();
    for (const a of ['ledger', 'bulletin', 'menu', 'debtCal', 'route', 'rehber', 'ctxHelp']) { try { SS.ACT[a]({}); } catch (e) { throw new Error(a + ': ' + e.message); } SS.closeModal(); }
    for (const pnl of ['goals', 'crew', 'decision']) { SS.ACT.mapPanel({ p: pnl }); SS.closeModal(); }
  }, [VIEWS, SUBS]);
  const sleepDays = (p, n) => p.evaluate(n => { for (let i = 0; i < n && !S.over; i++) { SS.ACT.goSleep(); SS.ACT.sleepNow(); SS.closeModal(); } return S.day; }, n);

  /* 1. Girdi enjeksiyonu ve olağandışı karakterler */
  const NAMES = ['<b id=xss>X</b>', '"><i id=xss>', "<svg id=xss onload=window.__x=1>", '🚀👩‍🚀🛰️🪐', 'مرحبا كابتن', 'İıŞşĞğÜüÖöÇç', 'a​‍ b', '   ', '${S.cash}', '&amp;&lt;'];
  for (const nm of NAMES) await run(`Ad girdisi: ${JSON.stringify(nm).slice(0, 30)}`, async p => {
    await boot(p, nm);
    await p.evaluate(() => { S.cash = 5000; S.day = 7; });
    await sweep(p); await sleepDays(p, 2); await sweep(p);
    const r = await p.evaluate(() => ({ inj: !!document.querySelector('#xss'), ran: !!window.__x, name: S.name }));
    if (r.inj || r.ran) throw new Error(`HTML enjeksiyonu: eleman=${r.inj} betik=${r.ran}`);
    return `ad "${r.name}"`;
  });
  await run('Kurcalanmış kayıtta uzun HTML ad (200 karakter)', async p => {
    await boot(p, 'x');
    await p.evaluate(() => { S.name = '<img id=xss src=x onerror="window.__x=1">'.repeat(5); S.shipNames = { 0: '<i id=xss>gemi</i>' }; SS.save(); });
    await p.reload(); await p.waitForTimeout(200); await p.click('[data-act=cont]'); await p.evaluate(() => SS.closeModal());
    await sweep(p); await sleepDays(p, 1); await p.waitForTimeout(100);
    const r = await p.evaluate(() => ({ inj: !!document.querySelector('#xss'), ran: !!window.__x }));
    if (r.inj || r.ran) throw new Error(`HTML enjeksiyonu: eleman=${r.inj} betik=${r.ran}`);
  });

  /* 2. Kayıt kurcalama fuzz'ı */
  const JUNK = [null, -1, -1e9, 0, 1e15, 1e308, 'abc', '<b id=xss>', {}, [], true, NaN, '12', -0.0001];
  for (let r = 0; r < 30 * ROUNDS; r++) await run(`Kurcalanmış kayıt #${r + 1}`, async p => {
    await boot(p, 'Fuzz');
    const muts = await p.evaluate(([JUNK, seed]) => {
      let a = seed * 9301 + 49297; const rnd = () => (a = (a * 9301 + 49297) % 233280) / 233280;
      S.cash = 3000; S.lic = { deliver: 1, repair: 1, sort: 1, order: 1, scrap2: 1, scrap3: 1 };
      for (let i = 0; i < 6; i++) { SS.ACT.goSleep(); SS.ACT.sleepNow(); SS.closeModal(); }
      const s = JSON.parse(JSON.stringify(S)), keys = Object.keys(s), out = [];
      for (let i = 0; i < 4; i++) {
        const k = keys[Math.floor(rnd() * keys.length)], v = JUNK[Math.floor(rnd() * JUNK.length)];
        if (k === 'v') continue;
        if (s[k] && typeof s[k] === 'object' && !Array.isArray(s[k]) && rnd() < .6) { const kk = Object.keys(s[k]); if (kk.length) { const k2 = kk[Math.floor(rnd() * kk.length)]; s[k][k2] = v; out.push(`${k}.${k2}=${JSON.stringify(v)}`); continue; } }
        s[k] = v; out.push(`${k}=${JSON.stringify(v)}`);
      }
      window.S = null; localStorage.setItem('space-scrapper-save-v3', JSON.stringify(s));
      return out;
    }, [JUNK, r + 1]);
    await p.reload(); await p.waitForTimeout(150);
    const canCont = await p.$('[data-act=cont]');
    if (canCont) { await canCont.click(); await p.evaluate(() => SS.closeModal()); await sweep(p); await sleepDays(p, 3); await sweep(p); }
    const bad = await p.evaluate(() => { if (!window.S) return []; const b = []; for (const k of ['cash', 'loan', 'energy', 'health', 'morale', 'hunger', 'day', 'time', 'fuel']) if (typeof S[k] !== 'number' || !isFinite(S[k])) b.push(`${k}=${S[k]}`); if (document.querySelector('#xss')) b.push('enjeksiyon'); return b; });
    if (bad.length) throw new Error('geçersiz değerler: ' + bad.join(', '));
    return muts.join(' ; ').slice(0, 110);
  });

  /* 3. Eylem fuzz'ı: güvenlik ağını atlayıp her eylemi doğrudan rastgele verilerle çağırır */
  await run('Eylem fuzz (güvenlik ağı olmadan)', async p => {
    await boot(p, 'Fuzz');
    const res = await p.evaluate(n => {
      const SKIP = new Set(['wipe', 'askWipe', 'toMenu', 'start', 'cont', 'doNG', 'askNG', 'adEnergy', 'shareDay', 'shareWeek', 'shareMoment', 'shareDaily', 'shareChallenge', 'copyCode']);
      const acts = Object.keys(SS.ACT).filter(a => !SKIP.has(a)), errs = {}; let calls = 0;
      const vals = ['0', '1', '2', '-1', '99', 'all', 'x', '', 'home', 'jobs', 'market', 'belt', 'gas', 'deliver', 'pit', 'ela', 'tolga', 'NaN', '1e9', 'undefined'];
      const keys = ['id', 'i', 'g', 'n', 'k', 'to', 'v', 's', 'z', 'p', 'd', 'b', 't', 'j', 'r', 'ok'];
      let a = 7; const rnd = () => (a = (a * 9301 + 49297) % 233280) / 233280; const pk = l => l[Math.floor(rnd() * l.length)];
      S.cash = 20000; S.lic = { deliver: 1, repair: 1, sort: 1, order: 1, scrap2: 1, scrap3: 1 };
      for (let i = 0; i < n; i++) {
        const act = pk(acts), d = {}; for (let j = 0; j < 3; j++) d[pk(keys)] = pk(vals);
        if (rnd() < .3) { const real = document.querySelector('[data-act]'); if (real) Object.assign(d, real.dataset); }
        const at = e => ((e.stack || '').split('\n').find(l => /\/js\//.test(l)) || '').replace(/.*\/js\//, '').replace(/\)$/, '');
        try { calls++; SS.ACT[act](d); } catch (e) { const k = `${act}(${JSON.stringify(d).slice(0, 60)}): ${e.message.slice(0, 70)} @ ${at(e)}`; errs[k] = (errs[k] || 0) + 1; }
        try {
          if (!window.S) { SS.ACT.start(); SS.closeModal(); S.tut = null; S.cash = 20000; }
          if (document.getElementById('mini')) SS.Stage.close();
          if (rnd() < .05) { SS.ACT.goSleep(); SS.ACT.sleepNow(); }
          if (S.over) { S.over = null; S.strikes = 0; }
        } catch (e) { const k = `(${act} sonrası gün/temizlik): ${e.message.slice(0, 70)} @ ${at(e)}`; errs[k] = (errs[k] || 0) + 1; }
      }
      return { calls, errs, acts: acts.length };
    }, 4000 * ROUNDS);
    const e = Object.entries(res.errs);
    if (e.length) throw new Error(e.map(([k, v]) => `${k} (×${v})`).join(' | '));
    return `${res.acts} eylem, ${res.calls} çağrı`;
  });

  /* 4. Saat dilimleri ve yaz saati geçişleri */
  for (const tz of ['Pacific/Kiritimati', 'Pacific/Pago_Pago', 'America/St_Johns', 'Asia/Kathmandu', 'Europe/Istanbul', 'America/New_York', 'Australia/Lord_Howe'])
    await run(`Saat dilimi ${tz}`, async p => {
      await boot(p, 'TZ');
      const r = await p.evaluate(() => ({ key: SS.todayKey(), no: SS.dailyNo(), seed: SS.dailySeed() }));
      if (!/^\d{4}-\d\d-\d\d$/.test(r.key) || !Number.isInteger(r.no) || !Number.isInteger(r.seed)) throw new Error(JSON.stringify(r));
      await p.evaluate(() => { SS.ACT.dailyPanel(); SS.closeModal(); });
      return `${r.key} #${r.no}`;
    }, { tz });
  const DST = [['America/New_York', '2026-03-08T01:59:30'], ['America/New_York', '2026-11-01T01:59:30'], ['Europe/Berlin', '2026-03-29T01:59:30'], ['Australia/Lord_Howe', '2026-04-05T01:59:30'], ['Pacific/Kiritimati', '2026-12-31T23:59:50']];
  for (const [tz, at] of DST) await run(`Yaz saati / gün dönümü ${tz} ${at}`, async p => {
    await p.goto(URL); const ms = await p.evaluate(at => new Date(at).getTime(), at);
    await p.clock.setFixedTime(ms);
    await boot(p, 'DST');
    const r = await p.evaluate(() => ({ key: SS.todayKey(), no: SS.dailyNo(), h: new Date().getHours() }));
    await p.clock.setFixedTime(ms + 60 * 60 * 1000);
    const r2 = await p.evaluate(() => ({ key: SS.todayKey(), no: SS.dailyNo(), h: new Date().getHours() }));
    await p.evaluate(() => { SS.ACT.dailyPanel(); SS.closeModal(); });
    if (!(r2.no === r.no || r2.no === r.no + 1) || !Number.isInteger(r.no)) throw new Error(`gün numarası atladı: ${r.no} → ${r2.no}`);
    return `${r.key} saat ${r.h} #${r.no} → +1 sa: ${r2.key} saat ${r2.h} #${r2.no}`;
  }, { tz, fast: false });

  /* 5. Kalıcılık */
  await run('Kalıcılık: oyna, yeniden aç, devam et', async p => {
    await boot(p, 'Kalıcı');
    const before = await p.evaluate(() => { S.cash = 777; S.lic.deliver = 1; for (let i = 0; i < 3; i++) { SS.ACT.goSleep(); SS.ACT.sleepNow(); SS.closeModal(); } S.route = ['market']; SS.prefs.autoSell = true; SS.savePrefs(); SS.save(); return JSON.stringify({ day: S.day, cash: S.cash, lic: S.lic, route: S.route, mile: S.mile && S.mile.id, bill: S.nextBill }); });
    await p.reload(); await p.waitForTimeout(200); await p.click('[data-act=cont]');
    const after = await p.evaluate(() => JSON.stringify({ day: S.day, cash: S.cash, lic: S.lic, route: S.route, mile: S.mile && S.mile.id, bill: S.nextBill }));
    const pref = await p.evaluate(() => SS.prefs.autoSell);
    if (before !== after) throw new Error(`farklı: ${before} ≠ ${after}`);
    if (pref !== true) throw new Error('ayar kayboldu');
    return after.slice(0, 80);
  }, { fast: false });
  await run('Depolama dolu (QuotaExceeded) iken oynanış', async p => {
    await boot(p, 'Dolu');
    await p.evaluate(() => { const proto = Object.getPrototypeOf(localStorage); proto.setItem = function () { const e = new Error('QuotaExceededError'); e.name = 'QuotaExceededError'; throw e; }; });
    await sweep(p); const d = await sleepDays(p, 3);
    return `gün ${d}`;
  });
  await run('Yeniden açılışta mini oyunun ortasında kapanma', async p => {
    await boot(p, 'Yarım');
    await p.evaluate(() => { S.lic.repair = 1; S.time = 600; S.loc = 'jobs'; S.view = 'jobs'; SS.refreshBoard(true); const j = S.board.find(x => x.type === 'repair') || S.board[0]; SS.ACT.job({ id: j.id }); });
    const inMini = await p.evaluate(() => !!document.getElementById('mini'));
    await p.reload(); await p.waitForTimeout(200); await p.click('[data-act=cont]');
    const r = await p.evaluate(() => ({ mini: !!document.getElementById('mini'), energy: S.energy, time: S.time }));
    if (r.mini) throw new Error('mini oyun katmanı yeniden açılışta kaldı');
    return `mini açıktı=${inMini}, devam: enerji ${r.energy}, saat ${r.time}`;
  }, { fast: false }); // hızlandırılmış zaman döngüsü Chromium'un localStorage yazımını geciktirdiği için gerçek zamanda koşar
  await run('Arka plan / ön plan döngüsü ×100', async p => {
    await boot(p, 'Döngü');
    const n = await p.evaluate(() => { let c = 0; for (let i = 0; i < 100; i++) { Object.defineProperty(document, 'hidden', { configurable: true, get: () => i % 2 === 0 }); document.dispatchEvent(new Event('visibilitychange')); c++; } return c; });
    return `${n} geçiş`;
  });

  /* 6. Uygulama köprüsü mesajları */
  await run('Uygulama köprüsü mesaj doğrulaması', async p => {
    await boot(p, 'Köprü');
    const r = await p.evaluate(async () => {
      const msgs = []; window.SS_NATIVE = { post: m => msgs.push(JSON.parse(JSON.stringify(m))), platform: 'android' };
      S.cash = 5000; for (let i = 0; i < 5; i++) { SS.ACT.goSleep(); SS.ACT.sleepNow(); SS.closeModal(); }
      SS.scheduleNotes(); SS.haptic(true);
      try { await SS.shareWeek(); } catch (e) {}
      const bad = msgs.filter(m => !m || typeof m.type !== 'string' || (m.type === 'notify' && (!Array.isArray(m.list) || m.list.length > 10 || m.list.some(n => !(n.inMinutes > 0 && isFinite(n.inMinutes)) || typeof n.title !== 'string'))) || (m.type === 'share' && m.image && m.image.length > 6e6));
      return { n: msgs.length, types: [...new Set(msgs.map(m => m.type))], bad: bad.length };
    });
    if (r.bad) throw new Error(`${r.bad} geçersiz mesaj`);
    return `${r.n} mesaj: ${r.types.join(', ')}`;
  });

  /* 7. Uç sayılar ve görünüm */
  await run('Aşırı büyük sayılar ve sıfır değerler', async p => {
    await boot(p, 'Sayı');
    await p.evaluate(() => { S.cash = 1e12; S.loan = 0; S.lender = null; S.stats.earned = 9.9e11; });
    await sweep(p);
    const w = await p.evaluate(() => { const r = document.querySelector('.hud-cash').getBoundingClientRect(); return { right: r.right, vw: innerWidth }; });
    if (w.right > w.vw + 1) throw new Error(`nakit göstergesi taşıyor (${Math.round(w.right)} > ${w.vw})`);
    await p.evaluate(() => { S.cash = 0; S.energy = 0; S.fuel = 0; S.health = 1; S.hunger = 0; S.morale = 0; });
    await sweep(p); await sleepDays(p, 2);
    return 'tamam';
  });

  /* 8. Geri tuşu (Android) */
  await run('Geri tuşu davranışı', async p => {
    await boot(p, 'Geri');
    const r = await p.evaluate(() => {
      if (!SS.onBack) return 'yok';
      const msgs = []; window.SS_NATIVE = { post: m => msgs.push(m) };
      const out = [];
      SS.flow(); for (let i = 0; i < 12 && !document.getElementById('modal').hidden; i++) SS.ACT.close();
      SS.ACT.menu(); SS.onBack(); out.push(document.getElementById('modal').hidden ? 'modal kapandı' : 'MODAL AÇIK');
      S.loc = 'market'; S.view = 'market'; SS.render(); SS.onBack(); out.push(S.view === 'map' ? 'haritaya döndü' : 'HARİTAYA DÖNMEDİ');
      SS.Games.repair({ size: 4, what: 'x', pay: 1, mods: [] }, () => {}); SS.onBack();
      return out.join(', ');
    });
    await p.waitForTimeout(400);
    const r2 = await p.evaluate(() => {
      const out = [document.getElementById('mini') ? 'MİNİ AÇIK' : 'mini kapandı'];
      const msgs = []; window.SS_NATIVE = { post: m => msgs.push(m) };
      SS.closeModal(); S.view = 'map'; SS.render(); SS.onBack(); out.push(msgs.some(m => m.type === 'exit') ? 'çıkış istendi' : 'ÇIKIŞ YOK');
      return out.join(', ');
    });
    const all = r + ', ' + r2;
    if (/[A-ZİÇŞĞÜÖ]{4,}/.test(all)) throw new Error(all);
    return all;
  });

  /* 9. Performans */
  await run('Performans ölçümleri', async p => {
    const t = [];
    for (let i = 0; i < 5; i++) { const t0 = Date.now(); await p.goto(URL); await p.waitForSelector('[data-act=start]'); t.push(Date.now() - t0); }
    await boot(p, 'Perf');
    const m = await p.evaluate(([VIEWS]) => {
      S.lic = { deliver: 1, repair: 1, sort: 1, order: 1, scrap2: 1, scrap3: 1 }; S.cash = 1e5;
      const per = {};
      for (const v of VIEWS) { S.view = v; S.loc = v === 'map' || v === 'log' ? 'home' : v; const t0 = performance.now(); for (let i = 0; i < 20; i++) SS.render(); per[v] = +((performance.now() - t0) / 20).toFixed(2); }
      const h0 = performance.memory ? performance.memory.usedJSHeapSize : 0, t0 = performance.now();
      for (let d = 0; d < 200; d++) { S.cash += 2000; if (S.over) { S.over = null; S.strikes = 0; } SS.ACT.goSleep(); SS.ACT.sleepNow(); SS.closeModal(); }
      const nightMs = (performance.now() - t0) / 200;
      const h1 = performance.memory ? performance.memory.usedJSHeapSize : 0;
      return { per, nightMs: +nightMs.toFixed(2), heapMB: +((h1 - h0) / 1048576).toFixed(1), saveKB: +(localStorage.getItem('space-scrapper-save-v3').length / 1024).toFixed(1), day: S.day };
    }, [VIEWS]);
    const worst = Object.entries(m.per).sort((a, b) => b[1] - a[1])[0];
    return `açılış ort ${Math.round(t.reduce((a, b) => a + b) / t.length)} ms (gerçek zaman) · en yavaş ekran ${worst[0]} ${worst[1]} ms · gece ${m.nightMs} ms · 200 gün sonra yığın farkı ${m.heapMB} MB · kayıt ${m.saveKB} KB`;
  }, { fast: false });

  console.log(`\nDenetim: ${total} test, ${total - failed} geçti, ${failed} başarısız.`);
  await b.close();
  process.exit(failed ? 1 : 0);
})();

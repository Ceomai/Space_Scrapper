const { chromium } = require('playwright');
const URL = '' + (process.env.GAME_URL || 'file://' + require('path').resolve(__dirname, '../web/index.html')) + '';
(async () => {
  const b = await chromium.launch();
  const report = [];
  const run = async (name, fn, opts = {}) => {
    const ctx = await b.newContext({ viewport: opts.vp || { width: 390, height: 844 } }); const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message + ' @ ' + (e.stack || '').split('\n')[1]));
    if (opts.init) await p.addInitScript(opts.init);
    let note = '';
    try { note = (await fn(p)) || ''; } catch (e) { errs.push('test: ' + e.message.split('\n')[0]); }
    report.push(`${errs.length ? '✗' : '✓'} ${name}${note ? ' · ' + note : ''}${errs.length ? '\n    ' + errs.slice(0, 3).join('\n    ') : ''}`);
    await ctx.close();
  };
  const start = async p => { await p.goto(URL); await p.waitForTimeout(300); await p.click('[data-act=start]'); await p.waitForTimeout(150); await p.click('.sheet [data-act=close]'); }; // giriş hikâyesi; kılavuz artık kendiliğinden açılmıyor
  await run('Tarayıcı depolaması kapalı', async p => { await start(p); await p.evaluate(() => { SS.ACT.ledger(); }); await p.click('[data-act=sleepNow]'); return 'gün ' + await p.evaluate(() => S.day); },
    { init: () => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }); } });
  await run('Bozuk kayıt dosyası', async p => { await p.goto(URL); await p.evaluate(() => { localStorage.setItem('space-scrapper-save-v3', '{bozuk'); localStorage.setItem('space-scrapper-prefs', 'xx'); localStorage.setItem('space-scrapper-daily', '[]'); }); await p.reload(); await p.waitForTimeout(300); await start(p); return 'başladı'; });
  await run('Eski kayıt (yeni alanlar yok, gün 150, Krell borcu)', async p => {
    await start(p);
    await p.evaluate(() => { const s = JSON.parse(JSON.stringify(S)); ['lic', 'course', 'trial', 'nextTrial', 'trialLog', 'casino', 'rules2', 'decorStore', 'paints', 'paint', 'homeTint', 'shipNames', 'daily', 'tut', 'tease', 'arc', 'titles', 'perks', 'deadlineOverride', 'sub', 'today'].forEach(k => delete s[k]); s.day = 150; s.loan = 5000; s.decor = ['plant', 'lamp']; window.S = null; localStorage.setItem('space-scrapper-save-v3', JSON.stringify(s)); });
    await p.reload(); await p.waitForTimeout(300); await p.click('[data-act=cont]'); await p.waitForTimeout(300);
    await p.evaluate(() => SS.closeModal());
    for (const v of ['map', 'home', 'jobs', 'hangar', 'market', 'cantina', 'clinic', 'krell', 'academy', 'casino', 'log']) await p.evaluate(v => { S.loc = v === 'map' || v === 'log' ? 'home' : v; S.view = v; SS.render(); }, v);
    await p.evaluate(() => { SS.ACT.ledger(); }); await p.click('[data-act=sleepNow]');
    return await p.evaluate(() => `gün ${S.day}, süre ${SS.M().deadline}, lisans ${Object.keys(S.lic).length}, bitti ${S.over}`);
  });
  await run('Garip meydan okuma bağlantıları', async p => {
    for (const h of ['#meydan-', '#meydan-zzzzzzzzzzzzzzzzzz-99999999999999', '#meydan-0-0', '#<script>', '#MO-ABC']) { await p.goto(URL + h); await p.waitForTimeout(200); }
    await start(p); await p.click('[data-act=dailyPanel]'); await p.fill('#chCode', 'MO-ZZZZZZZZZZZZ-1e9'); await p.click('[data-act=playChallenge][data-code]').catch(() => {}); await p.waitForTimeout(500);
    return 'açıldı';
  });
  for (const style of ['pixel', 'vector']) for (const theme of ['lavanta', 'gece', 'pas']) {
    await run(`Bütün ekranlar · ${style} · ${theme} · 320x568`, async p => {
      await p.addInitScript(([s, t]) => localStorage.setItem('space-scrapper-prefs', JSON.stringify({ style: s, theme: t, muted: true })), [style, theme]);
      await start(p);
      const out = await p.evaluate(() => {
        const bad = []; S.cash = 50000; S.tier = 1; S.decorStore = SS.DECOR.slice(0, 6).map(d => d.id); S.lic = { deliver: 1, repair: 1, sort: 1, order: 1, scrap2: 1, scrap3: 1 };
        const subs = { home: ['room', 'crew', 'items', 'house'], jobs: ['all', 'hunt', 'deliver', 'repair', 'other'], hangar: ['hunt', 'upg', 'yard'], market: ['sell', 'buy'], cantina: ['food', 'tables'], academy: ['lic', 'skill'], casino: ['games', 'lounge'], log: ['cap', 'rehber', 'story', 'ach', 'set'] };
        for (const v of ['map', 'home', 'jobs', 'hangar', 'market', 'cantina', 'clinic', 'krell', 'academy', 'casino', 'log']) {
          for (const sb of (subs[v] || [null])) {
            S.loc = v === 'map' || v === 'log' ? 'home' : v; S.view = v; S.sub = S.sub || {}; if (sb) S.sub[v] = sb; S.time = 900;
            try { SS.render(); } catch (e) { bad.push(v + '/' + sb + ': ' + e.message); }
            const de = document.documentElement; if (de.scrollWidth > innerWidth + 2 || de.scrollHeight > innerHeight + 2) bad.push(`taşma ${v}/${sb} ${de.scrollWidth}x${de.scrollHeight}`);
            const m = document.getElementById('app').innerText.match(/.{0,20}(NaN|undefined|\[object).{0,20}/); if (m) bad.push(v + '/' + sb + ' metin: ' + m[0]);
          }
        }
        return bad;
      });
      if (out.length) throw new Error(out.slice(0, 4).join(' ; '));
      return '';
    }, { vp: { width: 320, height: 568 } });
  }
  await run('Masaüstü 1280x800 ve yatay telefon 844x390', async p => { await start(p); await p.setViewportSize({ width: 844, height: 390 }); await p.waitForTimeout(300); await p.evaluate(() => { S.view = 'map'; SS.render(); }); return 'çizildi'; }, { vp: { width: 1280, height: 800 } });
  await run('Bütün mini oyunlar · art arda aç-kapat', async p => {
    await start(p);
    await p.evaluate(async () => {
      const w = ms => new Promise(r => setTimeout(r, ms)); const G = SS.Games, quit = () => { const q = document.getElementById('miniQuit'); if (q) q.click(); const y = document.getElementById('miniQuitYes'); if (y) y.click(); };
      SS.refreshBoard(true);
      const b = { deliver: null, repair: null, sort: null };
      for (const z of ['belt', 'yard', 'gas', 'pirate', 'lost']) { G.scrap(z, () => {}, null); await w(300); quit(); await w(100); }
      for (const v of SS.HUNT_VARIANTS) { SS._forceVariant = v.id; G.scrap('gas', () => {}, null); await w(200); quit(); await w(80); } SS._forceVariant = null;
      for (const g of ['shooter', 'shield', 'whack', 'memory']) { G[g]({ title: g, helpers: [] }, () => {}); await w(300); quit(); await w(100); }
    });
    return 'tamam';
  });
  console.log(report.join('\n'));
  await b.close();
})();

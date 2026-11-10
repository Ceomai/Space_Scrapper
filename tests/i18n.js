// İngilizce dil testi: bütün ekranları, pencereleri ve mini oyunları İngilizce açar; ekranda ya da tuvalde
// kalan Türkçe metni listeler. Türkçe modun hiç etkilenmediğini de kontrol eder.
const { chromium } = require('playwright');
const fontsReady = require('./fonts');
const URL = '' + (process.env.GAME_URL || 'file://' + require('path').resolve(__dirname, '../web/index.html')) + '';
const NAMES = /Pıtırcık|Gülşen|Şükrü|Türkçe|Çaycı|Ömer|Şeyma|Gökçe|İpek|Işık|Ayşe|Öykü|Çağla|Özge|Gök|Ünal|Şahin|Ölmez|Güneş|Kılıç|Yıldırım|Doğan|Bülent|Çelik/g;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message + ' @ ' + (e.stack || '').split('\n')[1]));
  await p.addInitScript(() => {
    localStorage.setItem('space-scrapper-lang', 'en');
    window.__cv = new Set(); const C2 = CanvasRenderingContext2D.prototype, o = C2.fillText;
    C2.fillText = function (t, ...r) { if (typeof t === 'string' && window.__cv.size < 50000) window.__cv.add(t); return o.call(this, t, ...r); };
  });
  await p.goto(URL); await fontsReady(p); await p.waitForTimeout(400);
  const left = new Map();
  const grab = async where => {
    const r = await p.evaluate(() => { const t = document.body.innerText; const c = [...window.__cv]; window.__cv.clear();
      const at = [...document.querySelectorAll('[placeholder],[aria-label],[title]')].map(e => [e.getAttribute('placeholder'), e.getAttribute('aria-label'), e.getAttribute('title')].filter(Boolean).join(' | '));
      return { t, c, at }; });
    for (const line of [...r.t.split('\n'), ...r.c, ...r.at]) { const l = line.trim(); if (/[çğıöşüÇĞİÖŞÜ]/.test(l.replace(NAMES, ''))) { if (!left.has(l)) left.set(l, where); } }
  };
  await grab('başlık');
  await p.click('[data-act=start]'); await p.waitForTimeout(200);
  for (let i = 0; i < 3; i++) { await grab('açılış ' + i); await p.click('.sheet [data-act=close]').catch(() => {}); await p.waitForTimeout(100); }
  const views = await p.evaluate(() => { S.cash = 50000; S.tier = 1; S.decorStore = SS.DECOR.slice(0, 6).map(d => d.id); S.lic = { deliver: 1, repair: 1, sort: 1, order: 1, scrap2: 1, scrap3: 1 }; return 1; });
  const subs = { home: ['room', 'crew', 'items', 'house'], jobs: ['all', 'hunt', 'deliver', 'repair', 'other'], hangar: ['hunt', 'upg', 'yard'], market: ['sell', 'buy'], cantina: ['food', 'tables'], academy: ['lic', 'skill'], casino: ['games', 'lounge'], log: ['cap', 'rehber', 'story', 'ach', 'set'] };
  for (const v of ['map', 'home', 'jobs', 'hangar', 'market', 'cantina', 'clinic', 'krell', 'academy', 'casino', 'log']) for (const sb of (subs[v] || [null])) {
    await p.evaluate(([v, sb]) => { SS.closeModal(); S.loc = v === 'map' || v === 'log' ? 'home' : v; S.view = v; S.sub = S.sub || {}; if (sb) S.sub[v] = sb; S.time = 900; SS.render(); }, [v, sb]);
    await p.waitForTimeout(60); await grab(v + '/' + (sb || ''));
  }
  // pencereler
  for (const a of ['ledger', 'guide', 'rehber', 'dailyPanel', 'debtCal', 'weekSum']) {
    await p.evaluate(a => { try { SS.closeModal(); SS.ACT[a] && SS.ACT[a]({ s: 'start' }); } catch (e) {} }, a); await p.waitForTimeout(80); await grab('pencere ' + a);
  }
  // mini oyunlar
  const games = await p.evaluate(() => Object.keys(SS.Games));
  for (const gname of ['scrap', 'deliver', 'repair', 'sort']) {
    await p.evaluate(gname => { SS.closeModal(); const G = SS.Games;
      if (gname === 'scrap') G.scrap(SS.ZONES[0].id, () => {});
      if (gname === 'deliver') G.deliver({ dest: 'Kuzey İskele', diff: 2, fuel: 10, pay: 100, mods: ['windy'], modNames: ['Fırtınalı iniş'], fragile: false, tierName: 't', what: 'antika piyano' }, () => {});
      if (gname === 'repair') G.repair({ size: 4, what: 'Robot garson' }, () => {});
      if (gname === 'sort') G.sort({ name: 'Standart bant · kısa', per: 3, time: 35, speed: .9, mix: null }, () => {});
    }, gname);
    await p.waitForTimeout(2500); await grab('oyun ' + gname);
    await p.evaluate(() => SS.Stage.close()); await p.waitForTimeout(100);
  }
  await p.evaluate(() => { SS.closeModal(); SS.ACT.ledger(); }); await p.waitForTimeout(100); await grab('defter');
  await p.click('[data-act=sleepNow]').catch(() => {}); await p.waitForTimeout(300); await grab('sabah');
  for (let i = 0; i < 4; i++) { await p.click('.sheet [data-act=close]').catch(() => {}); await p.waitForTimeout(100); await grab('sabah ' + i); }
  const lang = await p.evaluate(() => document.documentElement.lang);
  await ctx.close();
  // Türkçe mod değişmedi mi
  const ctx2 = await b.newContext({ viewport: { width: 390, height: 844 } }); const p2 = await ctx2.newPage();
  await p2.goto(URL); await fontsReady(p2); await p2.waitForTimeout(300);
  const trOk = await p2.evaluate(() => document.body.textContent.includes('Hayata başla') && document.documentElement.lang === 'tr' && SS.T('Hayata başla') === 'Hayata başla');
  await ctx2.close(); await b.close();
  const list = [...left.entries()];
  console.log(`İngilizce: html lang=${lang}, kalan Türkçe satır ${list.length}`);
  list.slice(0, +(process.env.SHOW || 60)).forEach(([l, w]) => console.log(`  [${w}] ${l.slice(0, 160)}`));
  console.log(`Türkçe mod değişmedi: ${trOk}`);
  console.log('sayfa hataları:', errs.length, errs.slice(0, 5));
  if (errs.length || !trOk || lang !== 'en' || list.length > +(process.env.MAX_LEFT || 25)) process.exit(1);
})();

// Play Store görselleri: telefon ekran görüntüleri (1080×1920) ve tanıtım görseli (1024×500).
// node tools/store.js [tr|en]  →  store/<dil>/
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const URL = 'file://' + path.resolve(__dirname, '../web/index.html');
const lang = process.argv[2] || 'tr';
const OUT = path.resolve(__dirname, '../store', lang); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch();
  const page = async () => {
    const p = await b.newPage({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3 }); p.setDefaultTimeout(4000);
    await p.addInitScript(l => { localStorage.setItem('space-scrapper-lang', l); localStorage.setItem('space-scrapper-prefs', JSON.stringify({ style: 'vector', theme: 'gece', muted: true })); }, lang);
    await p.goto(URL); await p.waitForTimeout(500); return p;
  };
  const shot = async (p, n) => { await p.waitForTimeout(400); await p.screenshot({ path: path.join(OUT, `${n}.png`) }); console.log(lang, n); };
  const start = async p => { await p.fill('#capName', lang === 'en' ? 'Nova' : 'Deniz').catch(() => {}); await p.click('[data-act=start]'); await p.waitForTimeout(200); for (let i = 0; i < 3; i++) await p.click('.sheet [data-act=close]').catch(() => {}); await p.evaluate(() => { S.tut = null; S.cash = 2480; S.day = 12; S.time = 15 * 60 + 20; S.morale = 82; S.lic = { deliver: 1, repair: 1, sort: 1, order: 1, scrap2: 1 }; SS.refreshBoard(true); SS.render(); }); };
  // 1 başlık
  { const p = await page(); await shot(p, '1-baslik'); await p.close(); }
  // 2 harita, 3 iş merkezi, 4 yaşam modülü
  { const p = await page(); await start(p);
    await p.evaluate(() => { S.view = 'map'; S.loc = 'home'; SS.render(); }); await shot(p, '2-harita');
    await p.evaluate(() => { S.view = 'jobs'; S.loc = 'jobs'; S.sub = { jobs: 'all' }; SS.render(); }); await shot(p, '3-is-merkezi');
    await p.evaluate(() => { S.view = 'home'; S.loc = 'home'; S.home = 1; S.decor = ['lamp', 'plant', 'aquarium', 'poster', 'rug', 'telescope']; S.sub = { home: 'room' }; SS.render(); }); await shot(p, '4-yasam-modulu');
    await p.close(); }
  // 5 hurda avı (Rex düellosu), 6 teslimat
  { const p = await page(); await start(p);
    await p.evaluate(() => { Math.random = SS.mulberry(42); SS.forceRex = true; SS.Games.scrap('yard', () => {}); SS.forceRex = false; });
    await p.waitForTimeout(3600); await p.evaluate(() => { const g = document.querySelector('#mini'); }); await shot(p, '5-hurda-avi');
    await p.evaluate(() => SS.Stage.close());
    await p.evaluate(() => SS.Games.deliver({ dest: 'Neon Kumarhane', diff: 2, fuel: 10, pay: 240, mods: ['windy'], modNames: ['Fırtınalı iniş'], fragile: false, tierName: 'Orta mesafe', what: 'kristal avize' }, () => {}));
    await p.waitForTimeout(1500); await shot(p, '6-teslimat');
    await p.close(); }
  // tanıtım görseli 1024×500
  { const p = await b.newPage({ viewport: { width: 1024, height: 500 } });
    await p.addInitScript(l => { localStorage.setItem('space-scrapper-lang', l); localStorage.setItem('space-scrapper-prefs', JSON.stringify({ style: 'vector', theme: 'gece', muted: true })); }, lang);
    await p.goto(URL); await p.waitForTimeout(300);
    await p.evaluate(lang => {
      document.body.innerHTML = '';
      const c = document.createElement('canvas'); c.width = 1024; c.height = 500; Object.assign(c.style, { position: 'fixed', inset: 0 }); document.body.appendChild(c);
      const x = c.getContext('2d'), P = SS.Art.P(), stars = SS.Art.makeStars(160, 1024, 500);
      SS.Art.space(x, 1024, 500, 1, 'gas', stars, P);
      x.save(); x.translate(770, 150); SS.Art.ship(x, 0, 0, 2.4, 1, P, {}); x.restore();
      x.strokeStyle = P.rope; x.lineWidth = 4; x.beginPath(); x.moveTo(770, 210); x.lineTo(700, 400); x.stroke();
      SS.Art.claw(x, 700, 400, .35, .3, P);
      [['crystal', 690, 432, 22], ['sat', 880, 380, 34], ['gold', 600, 430, 26], ['plate', 950, 450, 24], ['bolts', 540, 470, 18]].forEach(([k, a, bb, r]) => SS.Art.item(x, { kind: k, x: a, y: bb, r, rot: .3, seed: 2, poly: Array(9).fill(.95) }, 1, P));
      const g = x.createLinearGradient(0, 0, 560, 0); g.addColorStop(0, 'rgba(12,10,29,.92)'); g.addColorStop(1, 'rgba(12,10,29,0)'); x.fillStyle = g; x.fillRect(0, 0, 640, 500);
      x.textBaseline = 'alphabetic'; x.font = '900 96px "Trebuchet MS", system-ui, sans-serif';
      x.fillStyle = '#fff1e8'; x.fillText('SPACE', 56, 200); x.fillStyle = '#ff4f9a'; x.fillText('SCRAPPER', 56, 296);
      x.font = '700 28px "Trebuchet MS", system-ui, sans-serif'; x.fillStyle = '#ffec27';
      x.fillText(lang === 'en' ? 'Claw. Hustle. Pay off Krell.' : 'Kanca at. İş kovala. Krell\'e borcunu öde.', 60, 352);
    }, lang);
    await p.waitForTimeout(200); await p.screenshot({ path: path.join(OUT, 'tanitim-1024x500.png') }); console.log(lang, 'tanıtım'); await p.close(); }
  await b.close();
})();

// Kısa dikey tanıtım klipleri (TikTok / Reels / Shorts): oyunun kendi sahneleri, kare kare çekilir, ffmpeg ile MP4.
// node tools/clips.js [tr|en]  →  store/video/<dil>-rex.mp4, -fatura.mp4, -kombo.mp4  (1080×1920, 30 fps)
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..'), URL = 'file://' + path.join(ROOT, 'web/index.html');
const lang = process.argv[2] || 'tr', FPS = 30;
const OUT = path.join(ROOT, 'store/video'); fs.mkdirSync(OUT, { recursive: true });
const TXT = {
  tr: { rex: ['Rakibin Rex aynı alanda.', 'Kim daha çok kapacak?'], fatura: ['Kira mı, yemek mi, ısıtma mı?', 'Her akşam karar senin.'], kombo: ['Art arda değerli yakala,', 'kombo büyüsün!'], end: ['Borcunu öde. Gemini büyüt.', 'Ücretsiz · Android ve web'] },
  en: { rex: ['Your rival Rex is in the same field.', 'Who grabs more?'], fatura: ['Rent, dinner or heating?', 'Every night, you decide.'], kombo: ['Grab valuables in a row', 'and watch the combo grow!'], end: ['Pay off the debt. Grow your ship.', 'Free · Android and web'] },
}[lang];
// Sahte saat: sayfanın animasyon döngüsünü kare kare biz ilerletiriz
const CLOCK = () => {
  let fake = 0; const q = [];
  performance.now = () => fake;
  window.requestAnimationFrame = cb => { q.push(cb); return q.length; };
  window.cancelAnimationFrame = () => {};
  window.__tick = ms => { fake += ms; const cbs = q.splice(0); cbs.forEach(cb => { try { cb(fake); } catch (e) {} }); };
};
// Kanca botu: kanca değerli bir eşyaya doğru salındığında atar
const BOT = () => {
  const open0 = SS.Stage.open;
  SS.Stage.open = g => { window.__g = g; open0(g); };
  window.__bot = () => {
    const g = window.__g; if (!g || !g._dbg) return;
    const d = g._dbg(); if (!d.hook || d.hook.st !== 'swing') return;
    const bad = ['tank', 'mimic', 'rock', 'boulder', 'debris', 'bug'];
    for (const it of d.items) {
      if (bad.includes(it.kind) || (it.kind === 'jelly' && it.charged)) continue;
      const a = Math.atan2(it.x - d.OX, it.y - d.OY);
      if (Math.abs(a - d.hook.angle) < .035) { g.action('fire'); return; }
    }
  };
};
(async () => {
  const b = await chromium.launch();
  const clip = async (name, setup, sec, perFrame) => {
    const dir = path.join(OUT, `frames-${lang}-${name}`); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    const p = await b.newPage({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3 });
    await p.addInitScript(CLOCK);
    await p.addInitScript(l => { localStorage.setItem('space-scrapper-lang', l); localStorage.setItem('space-scrapper-prefs', JSON.stringify({ style: 'vector', theme: 'gece', muted: true })); }, lang);
    await p.goto(URL); for (let i = 0; i < 10; i++) await p.evaluate(() => window.__tick(16));
    await p.addScriptTag({ content: `(${BOT})()` });
    await p.evaluate(() => { document.querySelector('[data-act=start]').click(); });
    for (let i = 0; i < 5; i++) await p.evaluate(() => { window.__tick(16); const c = document.querySelector('.sheet [data-act=close]'); if (c) c.click(); });
    await p.evaluate(() => { S.tut = null; S.day = 9; S.time = 14 * 60; S.cash = 1260; S.lic = { deliver: 1, repair: 1, sort: 1, order: 1, scrap2: 1 }; SS.closeModal(); SS.render(); });
    await p.evaluate(setup);
    // altyazı bandı
    await p.evaluate(([a, c]) => {
      const d = document.createElement('div'); d.id = 'cap';
      d.innerHTML = `<b>${a}</b><span>${c}</span>`;
      Object.assign(d.style, { position: 'fixed', left: '10px', right: '10px', top: '10px', zIndex: 9999, padding: '10px 12px', borderRadius: '12px', background: 'rgba(12,10,29,.86)', color: '#fff1e8', font: '800 19px/1.2 "Trebuchet MS",system-ui,sans-serif', textAlign: 'center', boxShadow: '0 6px 20px #0008' });
      d.querySelector('span').style.cssText = 'display:block;color:#ffec27;margin-top:3px';
      document.body.appendChild(d);
    }, TXT[name]);
    let n = 0;
    const frame = async extra => { await p.evaluate(e => { window.__tick(1000 / 30); if (e) e(); }, extra); await p.screenshot({ path: path.join(dir, `f${String(n++).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 86 }); };
    for (let f = 0; f < sec * FPS; f++) { await p.evaluate(perFrame, f); await frame(); }
    // kapanış kartı
    await p.evaluate(([a, c]) => {
      const e = document.createElement('div'); e.id = 'end';
      e.innerHTML = `<h1 style="margin:0;font:900 52px/1 'Trebuchet MS',system-ui,sans-serif;color:#fff1e8;text-shadow:0 4px 0 #0008">SPACE<br><span style="color:#ff4f9a">SCRAPPER</span></h1><p style="margin:16px 0 4px;font:800 20px 'Trebuchet MS',system-ui,sans-serif;color:#ffec27">${a}</p><p style="margin:0;font:700 16px 'Trebuchet MS',system-ui,sans-serif;color:#b8b3d6">${c}</p>`;
      Object.assign(e.style, { position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: 'rgba(12,10,29,.9)', opacity: 0 });
      document.body.appendChild(e);
    }, TXT.end);
    for (let f = 0; f < 2 * FPS; f++) { await p.evaluate(f => { document.getElementById('end').style.opacity = Math.min(1, f / 10); }, f); await frame(); }
    await p.close();
    const out = path.join(OUT, `${lang}-${name}.mp4`);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(dir, 'f%04d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '21', '-preset', 'slow', '-movflags', '+faststart', out]);
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(lang, name, n, 'kare', Math.round(fs.statSync(out).size / 1024), 'KB');
  };
  // 1) Rex düellosu
  await clip('rex', () => { Math.random = SS.mulberry(7); SS.forceRex = true; SS.Games.scrap('yard', () => {}); SS.forceRex = false; }, 11, () => window.__bot());
  // 2) Akşam defteri: faturalar tek tek işaretlenip kaldırılır
  await clip('fatura', () => { S.cash = 190; SS.ACT.ledger(); }, 9, f => {
    if (f > 0 && f % 28 === 0) { const t = [...document.querySelectorAll('#modal [data-act=ltog]')]; const el = t[(f / 28) % t.length | 0]; if (el) el.click(); }
  });
  // 3) Kombo: zengin alan, bot değerli olanları art arda toplar
  await clip('kombo', () => { Math.random = SS.mulberry(21); SS.Games.scrap('gas', () => {}); }, 12, () => window.__bot());
  await b.close();
})();

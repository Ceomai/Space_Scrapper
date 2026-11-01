const { chromium } = require('playwright');
const FAST = () => { let fake = 0; const q = []; const ch = new MessageChannel(); ch.port1.onmessage = () => { const cbs = q.splice(0); fake += 1000 / 60; cbs.forEach(cb => { try { cb(fake); } catch (e) { setTimeout(() => { throw e; }); } }); }; performance.now = () => fake; window.requestAnimationFrame = cb => { q.push(cb); ch.port2.postMessage(0); return 1; }; window.cancelAnimationFrame = () => {}; };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message + ' @ ' + (e.stack || '').split('\n')[1]));
  await p.addInitScript(FAST); await p.goto('' + (process.env.GAME_URL || 'file://' + require('path').resolve(__dirname, '../web/index.html')) + ''); await p.waitForTimeout(200);
  const res = await p.evaluate(async () => {
    window.S = SS.newState([1, 2, 1], 'fun', 'B', []); S.nextEvent = null; SS.newDay([]); S.tut = null; SS.closeModal();
    const G = SS.Games, clamp = SS.clamp;
    let bot = null; const open0 = SS.Stage.open;
    SS.Stage.open = g => { g.draw = () => {}; g.drawUI = () => {}; const up = g.update; let fr = 0; g.update = (dt, f) => { up(dt, f); fr++; if (!g.done && bot) bot(g, fr); if (fr > 60 * 400 && !g.done) g.finish('stuck'); }; open0(g); };
    const play = (start, botFn) => new Promise(res => { bot = botFn; start(r => { bot = null; res(r); }); });
    const out = {};
    // İNİŞ
    const lander = (g) => { const d = g._dbg(); if (d.state !== 'fly') return; const s = d.sh, cx = d.px + d.padW / 2, h = d.gy(s.x) - (s.y + 13), over = Math.abs(s.x - cx) < d.padW / 2 - 13;
      const vxT = clamp((cx - s.x) * .015, -.8 * d.vxMax, .8 * d.vxMax); let aT = clamp((vxT - s.vx) * 1.6, -.6, .6); if (h < 40) aT = clamp(aT, -d.aMax * .6, d.aMax * .6);
      g.input.left = s.a > aT + .04; g.input.right = s.a < aT - .04;
      const vyT = over ? Math.min(d.vyMax * .55, .25 + h * .012) : (h < 90 ? -.1 : .5);
      g.input.thrust = s.vy > vyT || (h < 160 && !over && s.vy > -.2); };
    const mods = [[], ['heavy'], ['windy'], ['narrow'], ['heavy', 'windy'], ['heavy', 'windy', 'narrow']];
    for (const diff of [1, 2, 3]) for (const m of mods) for (const fragile of [false, true]) {
      const key = `iniş zorluk ${diff}${m.length ? ' ' + m.join('+') : ''}${fragile ? ' kırılacak' : ''}`; let wins = 0; const N = 6;
      for (let i = 0; i < N; i++) { const r = await play(cb => G.deliver({ dest: 'X', diff, fuel: 10, pay: 100, mods: m, modNames: [], fragile, tierName: 't', what: 'y' }, cb), lander); if (r.ok) wins++; }
      out[key] = `${wins}/${N}`;
    }
    // TAMİR
    for (const N of [4, 5, 6, 7]) { let wins = 0; for (let i = 0; i < 8; i++) { const r = await play(cb => G.repair({ size: N, what: 'x', pay: 100, mods: [] }, cb), (g, fr) => { if (fr % 2) return; const d = g._dbg(); for (let a = 0; a < d.N; a++) for (let c = 0; c < d.N; c++) { const cell = d.grid[a][c]; if (cell.sol != null && cell.m !== cell.sol) { g.pointer(d.ox + (c + .5) * d.cs, d.oy + (a + .5) * d.cs); return; } } }); if (r.ok) wins++; } out[`tamir ${N}x${N}`] = `${wins}/8`; }
    // AYRIŞTIRMA
    for (const sh of SS.SORT_VARIANTS) for (const base of SS.SORTS) { const r = await play(cb => G.sort({ name: 'x', per: base.per, time: base.time, speed: base.speed * sh.speed, mix: sh.mix }, cb), (g, fr) => { if (fr % 5) return; const d = g._dbg(); const cur = d.falling.filter(f => !f.sent).sort((a, b) => b.y - a.y)[0]; if (cur) g.action(String(cur.bin)); }); out[`ayrıştırma ${sh.id} ${base.id}`] = `doğru ${r.right}, yanlış ${r.wrong}, kaçan ${r.missed}, ₡${r.pay}`; }
    // LABORATUVAR
    { let wins = 0; for (let i = 0; i < 6; i++) { const r = await play(cb => G.memory({ title: 'x', helpers: [] }, cb), (g, fr) => { if (fr % 6) return; const d = g._dbg(); if (d.phase === 'input') g.action(String(d.seq[d.pos])); }); if (r.win) wins++; } out['laboratuvar'] = `${wins}/6`; }
    // KALKAN
    { let wins = 0; for (let i = 0; i < 6; i++) { const r = await play(cb => G.shield({ title: 'x', helpers: [] }, cb), g => { const d = g._dbg(); const rk = d.rocks.slice().sort((a, b) => a.d - b.d)[0]; if (rk) g.pointer(d.cx + Math.cos(rk.a) * 100, d.cy + Math.sin(rk.a) * 100); }); if (r.win) wins++; } out['meteor kalkanı'] = `${wins}/6`; }
    // SAVUNMA
    { let wins = 0; for (let i = 0; i < 6; i++) { const r = await play(cb => G.shooter({ title: 'x', helpers: [] }, cb), g => { const d = g._dbg(); const danger = d.eshots.find(s => Math.abs(s.x - d.ship.x) < 22 && s.y > 380); const tgt = d.foes.slice().sort((a, b) => b.y - a.y)[0]; let tx = tgt ? tgt.x : 180; if (danger) tx = d.ship.x + (danger.x > d.ship.x ? -60 : 60); g.pointer(clamp(tx, 20, 340), 500); }); if (r.win) wins++; } out['modül savunması'] = `${wins}/6`; }
    // GÜVENLİK DUVARI
    { let wins = 0; for (let i = 0; i < 6; i++) { const r = await play(cb => G.whack({ title: 'x', helpers: [] }, cb), (g, fr) => { if (fr % 8) return; const d = g._dbg(); const k = d.cells.findIndex(c => c && c.kind === 'virus'); if (k >= 0) g.pointer(d.X0 + (k % d.COLS + .5) * d.CW, d.Y0 + (Math.floor(k / d.COLS) + .5) * d.CH); }); if (r.win) wins++; } out['güvenlik duvarı'] = `${wins}/6`; }
    // EVRAK (doğru cevaplarla)
    { let wins = 0; for (let i = 0; i < 6; i++) { S.trial = { id: 'audit', day: S.day, demand: 100, head: 'x', text: 'x', done: false }; S.energy = 100; S.time = 600; SS.ACT.trialFight(); for (let k = 0; k < 5; k++) { await new Promise(r => setTimeout(r, 60)); const doc = document.querySelector('.audit .doc'); const mine = {}; document.querySelectorAll('.audit .doc.mine p').forEach(pp => mine[pp.querySelector('span').textContent] = pp.querySelector('em').textContent); const bad = [...doc.querySelectorAll('p')].some(pp => mine[pp.querySelector('span').textContent] !== pp.querySelector('em').textContent); document.querySelector(`[data-act=auditAns][data-a="${bad ? 1 : 0}"]`).click(); await new Promise(r => setTimeout(r, 800)); } if (S.trial.res === 'won') wins++; SS.closeModal(); } out['evrak kontrolü'] = `${wins}/6`; }
    return out;
  });
  for (const [k, v] of Object.entries(res)) console.log(k.padEnd(40), v);
  console.log('sayfa hataları', errs.length, errs.slice(0, 5));
  await b.close();
})();

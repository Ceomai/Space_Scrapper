const { chromium } = require('playwright');
const FAST = () => { let fake = 0; const q = []; const ch = new MessageChannel(); ch.port1.onmessage = () => { const cbs = q.splice(0); fake += 1000 / 60; cbs.forEach(cb => { try { cb(fake); } catch (e) { setTimeout(() => { throw e; }); } }); }; performance.now = () => fake; window.requestAnimationFrame = cb => { q.push(cb); ch.port2.postMessage(0); return 1; }; window.cancelAnimationFrame = () => {}; };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.addInitScript(FAST); await p.goto('' + (process.env.GAME_URL || 'file://' + require('path').resolve(__dirname, '../web/index.html')) + ''); await p.waitForTimeout(200);
  const res = await p.evaluate(async (pilot) => {
    window.S = SS.newState([1, 1, 1], 'fun', 'B', []); S.nextEvent = null; SS.newDay([]); SS.closeModal(); S.skills.pilot = 0;
    const clamp = SS.clamp; let bot = null, last = null; const open0 = SS.Stage.open;
    SS.Stage.open = g => { g.draw = () => {}; g.drawUI = () => {}; const up = g.update; g.update = (dt, f) => { up(dt, f); const d = g._dbg(); if (d.state === 'fly') last = { ...d.sh, fuel: d.fuel, vyMax: d.vyMax, vxMax: d.vxMax, aMax: d.aMax, onPad: d.sh.x - 12 >= d.px && d.sh.x + 12 <= d.px + d.padW, padW: d.padW }; if (!g.done && bot) bot(g); }; open0(g); };
    const play = (ct) => new Promise(res => { bot = g => { const d = g._dbg(); if (d.state !== 'fly') return; const s = d.sh, cx = d.px + d.padW / 2, h = d.gy(s.x) - (s.y + 13), err = cx - s.x, over = Math.abs(err) < d.padW / 2 - 13;
      // yatay: hedefe yavaşça yaklaş, yakınında dur
      const vxT = clamp(err * .02, -.6 * d.vxMax, .6 * d.vxMax) - d.wind * 30;
      let aT = clamp((vxT - s.vx) * 2.2, -.7, .7);
      if (h < 50) aT = clamp(aT, -d.aMax * .5, d.aMax * .5);
      g.input.left = s.a > aT + .03; g.input.right = s.a < aT - .03;
      // dikey: inişte hız sınırının yarısını aşma; pist üstünde değilse alçalma
      const vyT = over || h > 140 ? Math.min(d.vyMax * .5, .15 + h * .008) : -.05;
      g.input.thrust = s.vy > vyT; };
      SS.Games.deliver(ct, r => { bot = null; res(r); }); });
    const out = {};
    for (const diff of [2, 3]) for (const m of [[], ['heavy'], ['windy'], ['narrow'], ['heavy', 'windy', 'narrow']]) for (const fragile of [false, true]) {
      let wins = 0; const why = {};
      for (let i = 0; i < 10; i++) { const r = await play({ dest: 'X', diff, fuel: 10, pay: 100, mods: m, modNames: [], fragile, tierName: 't', what: 'y' });
        if (r.ok) wins++; else { const l = last; const k = !l.onPad ? 'pist dışı' : l.fuel <= 0 ? 'yakıt bitti' : l.vy > l.vyMax ? 'hızlı düşüş' : Math.abs(l.vx) > l.vxMax ? 'yanal hız' : Math.abs(l.a) > l.aMax ? 'açı' : 'diğer'; why[k] = (why[k] || 0) + 1; } }
      out[`zorluk ${diff} ${m.join('+') || 'düz'}${fragile ? ' kırılacak' : ''}`] = `${wins}/10 ${JSON.stringify(why)}`;
    }
    return out;
  });
  for (const [k, v] of Object.entries(res)) console.log(k.padEnd(36), v);
  await b.close();
})();

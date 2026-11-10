// Space Scrapper — büyük sahneler: detaylı istasyon haritası ve kesit görünümlü yaşam modülü
(function(SS){
const Art = SS.Art, TAU = Math.PI * 2;
const rr = (c, x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
const glow = (c, x, y, r, col, a = .5) => { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = a; c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.globalAlpha = 1; };
const lin = (c, x0, y0, x1, y1, stops) => { const g = c.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, col]) => g.addColorStop(o, col)); return g; };
// Sahne renkleri palete göre: sıcak pencere ışığı, neon, metal tonları
const SC = P => ({ warm: '#ffd27a', neon: P.crystal2, cyan: P.crystal, steel: P.metal, dark: P.metalD, light: P.metalL, hull: P.hull, red: P.bad, green: P.good, gold: P.accent });

/* ================= ANA HARİTA ================= */
Art.makeSky = n => Array.from({ length: n }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() < .08 ? 1.8 : Math.random() < .3 ? 1.1 : .6, tw: Math.random() * 6, hue: Math.random() < .15 }));
const LANES = [[[-.1, .3], [1.1, .05]], [[1.1, .9], [-.1, .62]], [[.3, -.1], [.95, 1.1]]];
Art.mapScene = (c, W, H, t, P, locs, cur, sky) => {
  const s = Math.min(W, H * .75) / 360, C = SC(P);
  // derin uzay
  c.fillStyle = lin(c, 0, 0, 0, H, [[0, P.space0], [.6, P.space1], [1, P.space0]]); c.fillRect(0, 0, W, H);
  // nebula bulutları
  [[.15, .2, .55, P.neb1], [.85, .35, .5, P.neb2], [.6, .95, .6, P.neb1], [.1, .75, .4, P.neb2]].forEach(([x, y, r, col], i) => {
    const dx = Math.sin(t * .05 + i) * 6; const g = c.createRadialGradient(x * W + dx, y * H, 0, x * W + dx, y * H, r * W);
    g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  });
  // uzak galaksi
  c.save(); c.translate(W * .82, H * .1); c.rotate(-.5); const gg = c.createRadialGradient(0, 0, 0, 0, 0, 40 * s); gg.addColorStop(0, 'rgba(255,240,220,.55)'); gg.addColorStop(.3, 'rgba(200,180,255,.18)'); gg.addColorStop(1, 'rgba(0,0,0,0)');
  c.scale(1, .32); c.fillStyle = gg; c.beginPath(); c.arc(0, 0, 40 * s, 0, TAU); c.fill(); c.restore();
  // yıldızlar
  for (const st of sky) { c.globalAlpha = .55 + .35 * Math.abs(Math.sin(t * .25 + st.tw)); c.fillStyle = st.hue ? C.cyan : P.star; c.fillRect(st.x * W, st.y * H, st.r * s * 1.4, st.r * s * 1.4); }
  c.globalAlpha = 1;
  // gaz devi ve halkası
  const px = -W * .12, py = H * 1.02, pr = W * .62;
  glow(c, px, py, pr * 1.18, P.crystal2, .35);
  c.save(); c.beginPath(); c.arc(px, py, pr, 0, TAU); c.clip();
  c.fillStyle = lin(c, px - pr, py - pr, px + pr, py, [[0, P.slime], [.5, P.slimeD], [1, P.space1]]); c.fillRect(px - pr, py - pr, pr * 2, pr * 2);
  for (let i = 0; i < 9; i++) { c.globalAlpha = .12 + (i % 3) * .05; c.fillStyle = i % 2 ? P.crystal2 : P.metalL; c.beginPath(); c.ellipse(px, py - pr + i * pr * .2 + Math.sin(t * .1 + i) * 3, pr * 1.1, pr * .045 + (i % 3) * 3, -.18, 0, TAU); c.fill(); }
  c.globalAlpha = 1; c.fillStyle = lin(c, px + pr * .6, py - pr * .6, px - pr * .2, py, [[0, 'rgba(0,0,0,.65)'], [1, 'rgba(0,0,0,0)']]); c.fillRect(px - pr, py - pr, pr * 2, pr * 2);
  c.restore();
  c.save(); c.translate(px, py); c.rotate(-.32); c.lineWidth = 2 * s;
  [[1.25, .7], [1.32, .45], [1.4, .3]].forEach(([k, a]) => { c.globalAlpha = a; c.strokeStyle = P.metalL; c.beginPath(); c.ellipse(0, 0, pr * k, pr * k * .2, 0, Math.PI * 1.02, Math.PI * 1.98); c.stroke(); });
  c.restore(); c.globalAlpha = 1;
  // tek, yavaş geçen gemi
  { const f = (t * .015) % 1, a = LANES[0][0], b = LANES[0][1], x = (a[0] + (b[0] - a[0]) * f) * W, y = (a[1] + (b[1] - a[1]) * f) * H, ang = Math.atan2((b[1] - a[1]) * H, (b[0] - a[0]) * W);
    glow(c, x - Math.cos(ang) * 6 * s, y - Math.sin(ang) * 6 * s, 8 * s, P.flame, .5);
    c.save(); c.translate(x, y); c.rotate(ang); c.fillStyle = C.light; c.beginPath(); c.moveTo(6 * s, 0); c.lineTo(-4 * s, -3 * s); c.lineTo(-3 * s, 0); c.lineTo(-4 * s, 3 * s); c.fill(); c.restore(); }
  // merkez ve bağlantılar: sakin, sabit hatlar
  const hx = W * .52, hy = H * .52;
  const qpt = (f, x0, y0, cx, cy, x1, y1) => [(1 - f) * (1 - f) * x0 + 2 * (1 - f) * f * cx + f * f * x1, (1 - f) * (1 - f) * y0 + 2 * (1 - f) * f * cy + f * f * y1];
  for (const l of locs) {
    const x = l.x * W, y = l.y * H, dx = x - hx, dy = y - hy, len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len, bend = (l.x > .52 ? 1 : -1) * len * .16;
    const cx1 = hx + dx * .5 + nx * bend, cy1 = hy + dy * .5 + ny * bend, here = l.id === cur;
    const col = !l.isOpen ? P.metalD : here ? P.accent : C.cyan;
    const path = () => { c.beginPath(); c.moveTo(hx, hy); c.quadraticCurveTo(cx1, cy1, x, y); };
    c.lineCap = 'round'; c.strokeStyle = col;
    c.globalAlpha = .08; c.lineWidth = 7 * s; path(); c.stroke();
    c.globalAlpha = here ? .6 : .32; c.lineWidth = 1.2 * s; path(); c.stroke(); c.globalAlpha = 1;
    if (here) { const f = (t * .08) % 1, [qx, qy] = qpt(1 - f, hx, hy, cx1, cy1, x, y); glow(c, qx, qy, 6 * s, col, .6); }
  }
  hubArt(c, hx, hy, s, t, P, C);
  for (const l of locs) {
    const x = l.x * W, y = l.y * H, on = l.id === cur;
    if (on) { const k = (t * .8) % 1; c.strokeStyle = P.accent; c.globalAlpha = 1 - k; c.lineWidth = 2 * s; c.beginPath(); c.ellipse(x, y + 4 * s, (30 + k * 18) * s, (12 + k * 7) * s, 0, 0, TAU); c.stroke(); c.globalAlpha = 1; }
    c.save(); c.translate(x, y); c.scale(s, s);
    MOD[l.id] && MOD[l.id](c, t, P, C, l.isOpen);
    if (!l.isOpen) { c.globalAlpha = .45; c.fillStyle = P.space0; c.beginPath(); c.arc(0, 0, 30, 0, TAU); c.fill(); c.globalAlpha = 1; }
    c.restore();
  }
};
SS.MAPMOD = () => MOD;
function hubArt(c, x, y, s, t, P, C) {
  c.save(); c.translate(x, y); c.scale(s, s);
  const pulse = .5 + .5 * Math.sin(t * .9);
  glow(c, 0, 0, 44 + pulse * 8, C.cyan, .22);
  const ring = (rx, ry, rot, spd, col, n, back) => {
    c.save(); c.rotate(rot);
    c.strokeStyle = col; c.globalAlpha = back ? .25 : .7; c.lineWidth = 1.6;
    c.beginPath(); c.ellipse(0, 0, rx, ry, 0, back ? Math.PI : 0, back ? TAU : Math.PI); c.stroke();
    for (let i = 0; i < n; i++) { const a = i / n * TAU + t * spd, sn = Math.sin(a); if ((sn < 0) !== back) continue;
      const px = Math.cos(a) * rx, py = sn * ry; glow(c, px, py, 5, col, back ? .25 : .7); c.fillStyle = col; c.globalAlpha = back ? .4 : 1; c.beginPath(); c.arc(px, py, 1.8, 0, TAU); c.fill(); }
    c.restore(); c.globalAlpha = 1;
  };
  const rings = [[33, 10, -.35, .25, C.cyan, 4], [27, 8, .55, -.35, P.accent, 3]];
  rings.forEach(r => ring(...r, true));
  // çekirdek küre
  const g = c.createRadialGradient(-4, -5, 1, 0, 0, 13); g.addColorStop(0, P.metalL); g.addColorStop(.6, P.metal); g.addColorStop(1, P.metalD);
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, 12, 0, TAU); c.fill();
  c.strokeStyle = C.cyan; c.globalAlpha = .8; c.lineWidth = 1.5; c.beginPath(); c.ellipse(0, 0, 12, 3.5, 0, 0, TAU); c.stroke(); c.globalAlpha = 1;
  glow(c, 0, 0, 9 + pulse * 4, C.cyan, .9); c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, 2.6 + pulse, 0, TAU); c.fill();
  // ince kuleler
  c.strokeStyle = P.metalL; c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, -12); c.lineTo(0, -26); c.moveTo(0, 12); c.lineTo(0, 22); c.stroke();
  if (Math.sin(t * 4) > 0) glow(c, 0, -27, 6, C.red, .9);
  rings.forEach(r => ring(...r, false));
  // yörüngede tek bir dron
  { const a = t * .3, px = Math.cos(a) * 54, py = Math.sin(a) * 20; c.fillStyle = P.metalL; c.fillRect(px - 3, py - 1.5, 6, 3); glow(c, px, py, 4, C.warm, .5); }
  c.restore();
}
// Modüller: 0,0 merkezli, yaklaşık 60×50 birim
const MOD = {
  home(c, t, P, C, open) {
    // yaşam halkası: üç kapsül, ortada seralı ana gövde
    c.fillStyle = P.metalD; c.beginPath(); c.ellipse(0, 18, 34, 6, 0, 0, TAU); c.fill();
    c.strokeStyle = P.metal; c.lineWidth = 3; c.beginPath(); c.ellipse(0, 6, 34, 11, 0, 0, TAU); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 1; c.beginPath(); c.ellipse(0, 5, 34, 11, 0, Math.PI * 1.1, Math.PI * 1.6); c.stroke();
    [[-28, 6], [28, 6], [0, 16]].forEach(([x, y], i) => {
      c.fillStyle = lin(c, x - 8, 0, x + 8, 0, [[0, P.metalD], [.5, P.metalL], [1, P.metalD]]); rr(c, x - 8, y - 6, 16, 12, 6); c.fill();
      if (open) glow(c, x, y, 7, C.warm, .45); c.fillStyle = open ? C.warm : P.ui; rr(c, x - 4, y - 2, 8, 4, 2); c.fill(); });
    // ana gövde
    c.fillStyle = lin(c, -16, 0, 16, 0, [[0, P.metalD], [.45, P.metalL], [1, P.metalD]]); rr(c, -16, -10, 32, 22, 8); c.fill();
    c.fillStyle = P.hull; c.fillRect(-16, 5, 32, 3);
    [-9, 0, 9].forEach(x => { if (open) glow(c, x, -2, 6, C.warm, .5); c.fillStyle = open ? C.warm : P.ui; c.beginPath(); c.arc(x, -2, 2.6, 0, TAU); c.fill(); c.strokeStyle = P.metalD; c.lineWidth = 1; c.stroke(); });
    // sera kubbesi
    c.fillStyle = 'rgba(126,243,255,.22)'; c.beginPath(); c.arc(0, -10, 13, Math.PI, TAU); c.fill();
    c.strokeStyle = 'rgba(220,250,255,.6)'; c.lineWidth = 1; c.beginPath(); c.arc(0, -10, 13, Math.PI, TAU); c.stroke(); c.beginPath(); c.moveTo(0, -23); c.lineTo(0, -10); c.stroke();
    c.fillStyle = C.green; [[-7, -13, -.4], [-2, -16, 0], [4, -14, .3], [8, -12, .5]].forEach(([a, b, r]) => { c.beginPath(); c.ellipse(a, b, 2.2, 4.2, r, 0, TAU); c.fill(); });
    c.fillStyle = P.crystal2; c.beginPath(); c.arc(-2, -19, 1.4, 0, TAU); c.fill();
    // çanak ve bayrak ışığı
    c.strokeStyle = P.metalL; c.lineWidth = 1.2; c.beginPath(); c.moveTo(14, -10); c.lineTo(20, -20); c.stroke(); c.fillStyle = P.metalL; c.beginPath(); c.ellipse(21, -21, 4, 2, -.6, 0, TAU); c.fill();
    if (Math.sin(t * 1.2) > .2) glow(c, -14, -12, 5, C.green, .7);
  },
  jobs(c, t, P, C, open) {
    // taban
    c.fillStyle = P.metalD; c.beginPath(); c.ellipse(0, 20, 30, 6, 0, 0, TAU); c.fill();
    // cam kule
    c.fillStyle = lin(c, -16, 0, 16, 0, [[0, P.metalD], [.35, P.metal], [.5, P.metalL], [1, P.metalD]]);
    c.beginPath(); c.moveTo(-14, 18); c.lineTo(-11, -30); c.lineTo(11, -30); c.lineTo(14, 18); c.closePath(); c.fill();
    c.fillStyle = 'rgba(126,243,255,.15)'; c.beginPath(); c.moveTo(-10, 16); c.lineTo(-8, -27); c.lineTo(8, -27); c.lineTo(10, 16); c.fill();
    const lift = (t * .35) % 1;
    for (let r = 0; r < 9; r++) { const yy = 13 - r * 4.8, wv = 8 - r * .25;
      for (let k = -1; k <= 1; k++) { const on = open && ((r * 5 + k * 3 + Math.floor(t * 1.5)) % 7 !== 0); c.fillStyle = on ? (r % 3 ? C.cyan : C.warm) : P.ui; c.globalAlpha = on ? .9 : .6; c.fillRect(k * wv - 2.3, yy, 4.6, 2.6); } }
    c.globalAlpha = 1;
    if (open) { const ly = 14 - lift * 44; glow(c, 0, ly, 6, C.gold, .9); c.fillStyle = C.gold; c.fillRect(-1, ly - 2, 2, 4); }
    c.fillStyle = P.metalL; c.fillRect(-12, -32, 24, 3);
    // çanak anten
    c.save(); c.translate(-6, -36); c.rotate(Math.sin(t * .6) * .5 - .3);
    c.fillStyle = P.metalL; c.beginPath(); c.ellipse(0, 0, 6, 2.5, 0, 0, Math.PI); c.fill(); c.strokeStyle = P.metalD; c.lineWidth = 1; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -5); c.stroke(); c.restore();
    c.strokeStyle = P.metalD; c.lineWidth = 1.5; c.beginPath(); c.moveTo(6, -32); c.lineTo(6, -44); c.stroke(); if (Math.sin(t * 3) > 0) glow(c, 6, -45, 6, C.red, .9);
    // holografik ilan panosu
    const hx = 24, hy = -12, fl = open ? .55 + .2 * Math.sin(t * 8) : .15;
    c.fillStyle = `rgba(126,243,255,${fl * .35})`; c.beginPath(); c.moveTo(hx - 9, hy - 12); c.lineTo(hx + 9, hy - 9); c.lineTo(hx + 9, hy + 9); c.lineTo(hx - 9, hy + 12); c.closePath(); c.fill();
    c.strokeStyle = `rgba(126,243,255,${fl})`; c.lineWidth = .8; c.stroke();
    if (open) for (let i = 0; i < 4; i++) { const yy = hy - 7 + ((i * 5 + t * 6) % 18); c.fillStyle = i % 2 ? C.cyan : C.green; c.globalAlpha = .8; c.fillRect(hx - 6, yy, 6 + (i * 3) % 6, 1.4); } c.globalAlpha = 1;
    c.strokeStyle = 'rgba(126,243,255,.3)'; c.beginPath(); c.moveTo(14, -2); c.lineTo(hx - 9, hy); c.stroke();
    // yanaşan mekik
    const f = (t * .12) % 1, sx = -40 + f * 22, sy = 4 - Math.sin(f * Math.PI) * 6;
    c.fillStyle = P.metalL; c.beginPath(); c.moveTo(sx + 5, sy); c.lineTo(sx - 4, sy - 2.5); c.lineTo(sx - 4, sy + 2.5); c.fill(); glow(c, sx - 5, sy, 4, P.flame, .8);
  },
  hangar(c, t, P, C, open) {
    // yakıt tankları
    [[-34, 6], [-28, 9]].forEach(([x, y]) => { c.fillStyle = lin(c, x - 3, 0, x + 3, 0, [[0, P.tankD], [.5, P.tank], [1, P.tankD]]); rr(c, x - 3, y - 10, 6, 18, 3); c.fill(); });
    // pist platformu
    c.fillStyle = P.metalD; c.beginPath(); c.moveTo(-36, 16); c.lineTo(38, 16); c.lineTo(32, 22); c.lineTo(-30, 22); c.fill();
    for (let i = 0; i < 7; i++) { const on = open && Math.floor(t * 1.5) % 7 === i; c.fillStyle = on ? C.gold : P.metal; c.fillRect(-26 + i * 9, 18, 5, 1.6); if (on) glow(c, -23.5 + i * 9, 19, 5, C.gold, .6); }
    // kemerli hangar
    c.fillStyle = lin(c, 0, -24, 0, 16, [[0, P.metalL], [1, P.metalD]]); c.beginPath(); c.moveTo(-26, 16); c.lineTo(-24, -6); c.quadraticCurveTo(0, -28, 24, -6); c.lineTo(26, 16); c.closePath(); c.fill();
    c.strokeStyle = P.metalD; c.lineWidth = 1; for (let i = -16; i <= 16; i += 8) { c.beginPath(); c.moveTo(i, -14 + Math.abs(i) * .35); c.lineTo(i * 1.08, 15); c.stroke(); }
    // açık kapı ve iç ışık
    c.fillStyle = P.space0; c.beginPath(); c.moveTo(-15, 16); c.lineTo(-14, -2); c.quadraticCurveTo(0, -12, 14, -2); c.lineTo(15, 16); c.closePath(); c.fill();
    if (open) glow(c, 0, 6, 18, C.warm, .4);
    Art.ship(c, 0, 8, .24, t, P, { tier: window.S ? S.tier : 0 });
    // kapı kenarı tehlike şeridi
    c.fillStyle = P.warn; for (let y = -2; y < 16; y += 4) { c.fillRect(-16, y, 2, 2); c.fillRect(14, y, 2, 2); }
    // vinç köprüsü (yavaşça gidip gelir)
    const gx = Math.sin(t * .35) * 10;
    c.fillStyle = P.metal; c.fillRect(-22, -20, 44, 2); c.fillStyle = P.box; c.fillRect(gx - 3, -19, 6, 3);
    c.strokeStyle = P.metalL; c.lineWidth = .8; c.beginPath(); c.moveTo(gx, -16); c.lineTo(gx, -8); c.stroke(); c.fillStyle = P.metalD; c.fillRect(gx - 2, -8, 4, 2);
    // kule ve ışık
    c.fillStyle = P.metalD; c.fillRect(24, -16, 6, 32); c.fillStyle = open ? C.cyan : P.ui; c.fillRect(25, -14, 4, 4);
    if (Math.sin(t * 1.5) > 0) glow(c, 27, -18, 5, C.red, .7);
  },
  market(c, t, P, C, open) {
    const cols = [P.bad, P.accent, C.cyan, C.green, P.crystal2];
    // alt platform
    c.fillStyle = P.metalD; c.beginPath(); c.ellipse(0, 17, 42, 9, 0, 0, TAU); c.fill();
    c.fillStyle = lin(c, -40, 0, 40, 0, [[0, P.metalD], [.5, P.metalL], [1, P.metalD]]); c.beginPath(); c.ellipse(0, 14, 42, 8, 0, 0, TAU); c.fill();
    for (let i = 0; i < 8; i++) { const on = open && (Math.floor(t * 3) + i) % 4 === 0; c.fillStyle = on ? C.warm : P.metalD; c.beginPath(); c.arc(-35 + i * 10, 18, 1.4, 0, TAU); c.fill(); }
    // tezgâhlar
    for (let i = 0; i < 4; i++) {
      const x = -27 + i * 18, col = cols[i % cols.length];
      c.fillStyle = P.boxD; c.fillRect(x - 7, 4, 14, 8); c.fillStyle = P.box; c.fillRect(x - 7, 3, 14, 2);
      c.strokeStyle = P.metalD; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 7, 4); c.lineTo(x - 7, -6); c.moveTo(x + 7, 4); c.lineTo(x + 7, -6); c.stroke();
      for (let k = 0; k < 4; k++) { c.fillStyle = k % 2 ? col : '#f4eee0'; c.beginPath(); c.moveTo(x - 9 + k * 4.5, -6); c.lineTo(x - 4.5 + k * 4.5, -6); c.lineTo(x - 4.5 + k * 4.5, -2); c.lineTo(x - 9 + k * 4.5, -2); c.fill(); }
      c.fillStyle = col; [[-4, 2], [0, 1.5], [4, 2]].forEach(([a, b]) => { c.beginPath(); c.arc(x + a, b, 1.3, 0, TAU); c.fill(); });
    }
    // kalabalık
    if (open) for (let k = 0; k < 7; k++) { const px = -34 + ((t * (6 + k) + k * 13) % 68), py = 11 + Math.sin(t * 6 + k) * .6; c.fillStyle = [P.hull2, P.crystal, P.box, P.slime][k % 4]; c.beginPath(); c.arc(px, py - 2, 1.4, 0, TAU); c.fill(); c.fillRect(px - 1, py - 1, 2, 3); }
    // fener dizisi
    c.strokeStyle = P.metalL; c.globalAlpha = .6; c.lineWidth = .7; c.beginPath(); c.moveTo(-34, -12); c.quadraticCurveTo(0, -2, 34, -12); c.stroke(); c.globalAlpha = 1;
    for (let k = 0; k < 6; k++) { const f = (k + .5) / 6, lx = -34 + 68 * f, ly = -12 + 10 * 4 * f * (1 - f) * .5 + 1, sw = Math.sin(t * 2 + k) * 1.5, col = k % 2 ? C.warm : P.accent;
      if (open) glow(c, lx + sw, ly + 3, 5, col, .8); c.fillStyle = open ? col : P.metalD; c.beginPath(); c.ellipse(lx + sw, ly + 3, 1.6, 2.2, 0, 0, TAU); c.fill(); }
    // cam kubbe
    const dg = c.createLinearGradient(0, -36, 0, 14); dg.addColorStop(0, 'rgba(160,240,255,.28)'); dg.addColorStop(1, 'rgba(160,240,255,.05)');
    c.fillStyle = dg; c.beginPath(); c.ellipse(0, 12, 40, 46, 0, Math.PI, TAU); c.fill();
    c.strokeStyle = 'rgba(220,250,255,.55)'; c.lineWidth = 1; c.beginPath(); c.ellipse(0, 12, 40, 46, 0, Math.PI, TAU); c.stroke();
    c.globalAlpha = .25; [-20, 0, 20].forEach(xx => { c.beginPath(); c.ellipse(0, 12, Math.abs(xx) || .1, 46, 0, Math.PI, TAU); c.stroke(); }); c.globalAlpha = 1;
    c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2; c.beginPath(); c.ellipse(0, 12, 34, 40, 0, Math.PI * 1.15, Math.PI * 1.4); c.stroke();
    // havada asılı neon tabela
    const fl = open && Math.sin(t * 2.1) > -.9, by = -44 + Math.sin(t * 1.4) * 1.5;
    if (fl) glow(c, 0, by, 20, P.accent, .55);
    c.fillStyle = P.ui; rr(c, -18, by - 6, 36, 12, 4); c.fill(); c.strokeStyle = fl ? P.accent : P.metalD; c.lineWidth = 1; rr(c, -18, by - 6, 36, 12, 4); c.stroke();
    c.font = 'bold 8px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = fl ? P.accent : P.metalD; c.fillText('PAZAR', 0, by + .5); c.textBaseline = 'alphabetic';
    if (open) { const gx = -16 + ((t * 20) % 40); c.fillStyle = 'rgba(255,255,255,.45)'; c.fillRect(gx, by - 5, 2, 10); }
    // kargo dronları
    for (let k = 0; k < 2; k++) { const f = (t * .15 + k * .5) % 1, px = (k ? 1 : -1) * (48 - f * 30), py = -20 + f * 18 + Math.sin(t * 3 + k) * 2;
      c.fillStyle = P.metalL; c.fillRect(px - 3, py - 1.5, 6, 3); c.fillStyle = P.box; c.fillRect(px - 2, py + 1.5, 4, 3); glow(c, px, py - 2, 4, C.cyan, .7); }
  },
  cantina(c, t, P, C, open) {
    // park etmiş mekikler
    [[-30, 18], [28, 19]].forEach(([x, y], i) => { c.fillStyle = i ? P.hull : P.crystal; c.beginPath(); c.ellipse(x, y, 6, 2.5, 0, 0, TAU); c.fill(); c.fillStyle = P.glass; c.beginPath(); c.arc(x, y - 1.5, 2, Math.PI, TAU); c.fill(); });
    // alt gövde (uçan daire)
    c.fillStyle = P.slimeD; c.beginPath(); c.ellipse(0, 12, 32, 8, 0, 0, TAU); c.fill();
    c.fillStyle = lin(c, -32, 0, 32, 0, [[0, P.slimeD], [.45, P.slime], [1, P.slimeD]]); c.beginPath(); c.ellipse(0, 8, 32, 8, 0, 0, TAU); c.fill();
    // ışık dizisi
    for (let i = 0; i < 10; i++) { const a = Math.PI * (i / 9), x = Math.cos(a) * -30, y = 9 + Math.sin(a) * 4; const on = open && (Math.floor(t * 4) + i) % 3 !== 0; const col = [C.warm, P.crystal2, C.cyan][i % 3];
      c.fillStyle = on ? col : P.metalD; c.beginPath(); c.arc(x, y, 1.2, 0, TAU); c.fill(); if (on) glow(c, x, y, 3.5, col, .7); }
    // kubbe
    c.fillStyle = lin(c, 0, -20, 0, 8, [[0, P.slime], [1, P.slimeD]]); c.beginPath(); c.ellipse(0, 6, 22, 20, 0, Math.PI, TAU); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(0, 6, 18, 16, 0, Math.PI * 1.15, Math.PI * 1.45); c.stroke();
    // pencereler ve içerideki silüetler
    [-12, 0, 12].forEach((x, i) => { if (open) glow(c, x, -1, 8, C.warm, .55); c.fillStyle = open ? C.warm : P.metalD; rr(c, x - 4, -5, 8, 7, 3); c.fill();
      if (open) { c.fillStyle = 'rgba(40,20,30,.6)'; const px = x + Math.sin(t * (1 + i * .3) + i) * 2; c.beginPath(); c.arc(px, -2, 1.6, 0, TAU); c.fill(); c.fillRect(px - 1.5, -.5, 3, 3); } });
    // baca ve duman
    c.fillStyle = P.metalD; c.fillRect(12, -24, 5, 10);
    if (open) for (let k = 0; k < 4; k++) { const f = (t * .4 + k / 4) % 1; c.fillStyle = `rgba(220,220,230,${.35 * (1 - f)})`; c.beginPath(); c.arc(14.5 + Math.sin(f * 6 + k) * 3, -26 - f * 16, 2 + f * 4, 0, TAU); c.fill(); }
    // neon tabela
    const flick = open && Math.sin(t * 2.3) > -.9, sy = -30 + Math.sin(t * 1.2);
    if (flick) glow(c, -6, sy, 16, C.neon, .7);
    c.fillStyle = P.ui; rr(c, -18, sy - 6, 24, 11, 3); c.fill(); c.strokeStyle = flick ? C.neon : P.metalD; c.lineWidth = 1; rr(c, -18, sy - 6, 24, 11, 3); c.stroke();
    c.font = 'bold 8px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = flick ? C.neon : P.metalD; c.fillText('GUS', -6, sy); c.textBaseline = 'alphabetic';
    // müzik notaları
    if (open) for (let k = 0; k < 2; k++) { const f = (t * .3 + k * .5) % 1; c.globalAlpha = 1 - f; c.fillStyle = k ? P.crystal2 : C.warm; c.font = '8px sans-serif'; c.fillText('♪', 22 + Math.sin(f * 7) * 3, -6 - f * 16); }
    c.globalAlpha = 1;
  },
  clinic(c, t, P, C, open) {
    c.fillStyle = P.metalD; c.beginPath(); c.ellipse(0, 19, 30, 5, 0, 0, TAU); c.fill();
    // akademi kanadı
    c.fillStyle = lin(c, 0, -8, 0, 16, [[0, P.metal], [1, P.metalD]]); rr(c, 8, -4, 22, 20, 4); c.fill();
    for (let i = 0; i < 3; i++) { c.fillStyle = open ? C.cyan : P.ui; c.globalAlpha = .8; c.fillRect(12 + i * 6, 0, 4, 5); } c.globalAlpha = 1;
    c.fillStyle = P.accent; c.beginPath(); c.moveTo(14, -4); c.lineTo(19, -9); c.lineTo(24, -4); c.fill();
    // ana tıp modülü
    c.fillStyle = lin(c, -22, 0, 10, 0, [[0, P.metal], [.5, P.metalL], [1, P.metal]]); rr(c, -24, -14, 34, 32, 10); c.fill();
    c.fillStyle = 'rgba(126,243,255,.25)'; rr(c, -20, -8, 26, 12, 5); c.fill();
    c.fillStyle = P.metalL; rr(c, -16, -2, 14, 4, 2); c.fill(); c.fillStyle = P.hull2; c.beginPath(); c.arc(-14, -3, 2, 0, TAU); c.fill();
    // kalp atışı ekranı
    c.fillStyle = P.ui; c.fillRect(-20, 7, 26, 7); c.strokeStyle = open ? C.green : P.metalD; c.lineWidth = 1; c.beginPath();
    for (let i = 0; i <= 26; i++) { const ph = (i + t * 18) % 26; const yy = ph > 11 && ph < 14 ? (ph < 12.5 ? -3 : 2) : 0; i ? c.lineTo(-20 + i, 10.5 + yy) : c.moveTo(-20, 10.5); } c.stroke();
    // holografik haç
    const p = .7 + .3 * Math.sin(t * 3), cy = -28 + Math.sin(t * 2) * 1.5;
    if (open) glow(c, -7, cy, 16 * p, C.red, .55);
    c.save(); c.translate(-7, cy); c.scale(Math.cos(t * 1.5), 1); c.globalAlpha = open ? .9 : .35; c.fillStyle = C.red; c.fillRect(-2.5, -7, 5, 14); c.fillRect(-7, -2.5, 14, 5); c.restore(); c.globalAlpha = 1;
    c.strokeStyle = 'rgba(255,120,120,.5)'; c.lineWidth = 1; c.beginPath(); c.ellipse(-7, cy + 9, 9, 2.5, 0, 0, TAU); c.stroke();
    // ambulans dronu
    const a = t * .8, dx = Math.cos(a) * 34, dy = -6 + Math.sin(a) * 10;
    c.fillStyle = P.metalL; rr(c, dx - 4, dy - 2, 8, 4, 1.5); c.fill(); c.fillStyle = C.red; c.fillRect(dx - 1, dy - 1.5, 2, 3);
    if (Math.sin(t * 8) > 0) glow(c, dx, dy - 3, 4, C.red, .9); else glow(c, dx, dy - 3, 4, C.cyan, .9);
  },
  krell(c, t, P, C, open) {
    // basamaklı taban
    c.fillStyle = P.metalD; c.fillRect(-26, 15, 52, 4); c.fillStyle = P.metal; c.fillRect(-22, 12, 44, 3);
    // banka gövdesi
    c.fillStyle = lin(c, -22, 0, 22, 0, [[0, '#15121c'], [.5, '#2a2333'], [1, '#15121c']]); c.fillRect(-20, -10, 40, 22);
    // sütunlar
    for (let i = 0; i < 4; i++) { const x = -17 + i * 11.3 + (i > 1 ? 4 : 0); if (i === 1 || i === 2) continue;
      c.fillStyle = lin(c, x - 2, 0, x + 2, 0, [[0, P.metalD], [.5, P.metalL], [1, P.metalD]]); c.fillRect(x - 2, -8, 4, 20); }
    [-17, 17].forEach(x => { c.fillStyle = lin(c, x - 2, 0, x + 2, 0, [[0, P.metalD], [.5, P.metalL], [1, P.metalD]]); c.fillRect(x - 2.2, -8, 4.4, 20); });
    // alınlık ve kubbe
    c.fillStyle = P.accent; c.fillRect(-23, -12, 46, 3);
    c.fillStyle = lin(c, 0, -26, 0, -12, [[0, P.accent], [1, P.boxD]]); c.beginPath(); c.ellipse(0, -12, 14, 12, 0, Math.PI, TAU); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1; c.beginPath(); c.ellipse(0, -12, 11, 9, 0, Math.PI * 1.15, Math.PI * 1.45); c.stroke();
    c.fillStyle = P.accent; c.fillRect(-1, -28, 2, 4);
    // büyük kasa kapısı
    c.save(); c.translate(0, 3);
    c.fillStyle = P.metalD; c.beginPath(); c.arc(0, 0, 9, 0, TAU); c.fill();
    c.fillStyle = lin(c, -8, -8, 8, 8, [[0, P.metalL], [1, P.metal]]); c.beginPath(); c.arc(0, 0, 7.5, 0, TAU); c.fill();
    c.strokeStyle = P.accent; c.lineWidth = 1.3; c.beginPath(); c.arc(0, 0, 7.5, 0, TAU); c.stroke();
    c.rotate(t * .15); c.strokeStyle = P.metalD; c.lineWidth = 1.2; for (let i = 0; i < 3; i++) { c.rotate(Math.PI / 3); c.beginPath(); c.moveTo(-5, 0); c.lineTo(5, 0); c.stroke(); }
    c.fillStyle = P.accent; c.beginPath(); c.arc(0, 0, 1.8, 0, TAU); c.fill(); c.restore();
    // pencere ışıkları
    [-11, 11].forEach(x => { c.fillStyle = open ? C.warm : P.ui; c.globalAlpha = open ? .85 : .6; c.fillRect(x - 2, -5, 4, 5); c.globalAlpha = 1; });
    // sikke tabelası
    const by = -36 + Math.sin(t * .6) * 1;
    if (open) glow(c, 0, by, 10, P.accent, .45);
    c.fillStyle = P.ui; rr(c, -14, by - 5, 28, 10, 3); c.fill(); c.strokeStyle = P.accent; c.lineWidth = .8; rr(c, -14, by - 5, 28, 10, 3); c.stroke();
    c.font = 'bold 7px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = open ? P.accent : P.metalD; c.fillText('₡ KRELL', 0, by + .5); c.textBaseline = 'alphabetic';
  },
};

/* ================= YAŞAM MODÜLÜ (kesit) ================= */
// Ev seviyesine göre üst sıradaki odalar (x, genişlik oranı); alt sırada hane odaları, sera, atölye
SS.HABITAT = [
  { rooms: [['bed', 'Uyku kapsülü', 0, .42], ['live', 'Mutfak köşesi', .42, .58]] },
  { rooms: [['bed', 'Yatak odası', 0, .4], ['live', 'Salon ve mutfak', .4, .6]] },
  { rooms: [['bed', 'Yatak odası', 0, .3], ['live', 'Salon', .3, .4], ['lounge', 'Seyir köşesi', .7, .3]] },
];
// Her oda tipinde mobilyaya çarpmayan yuva adayları: [x oranı, 'wall' | 'floor']
const SLOT_SPOTS = {
  bed: [[.82, 'floor'], [.3, 'wall'], [.72, 'wall']], live: [[.62, 'wall'], [.3, 'floor'], [.88, 'wall'], [.14, 'wall']],
  lounge: [[.18, 'floor'], [.85, 'floor'], [.5, 'wall']], pit: [[.2, 'wall'], [.8, 'wall']], ela: [[.2, 'wall'], [.8, 'wall']],
  tolga: [[.8, 'wall'], [.2, 'wall']], garden: [[.85, 'floor']], workshop: [[.3, 'wall'], [.8, 'floor']], store: [[.3, 'floor'], [.7, 'wall'], [.7, 'floor']],
};
const WALL_TINT = { bed: 'slime', live: 'hull', lounge: 'crystal', pit: 'crystal', ela: 'crystal2', tolga: 'box', garden: 'bug', workshop: 'metal', store: 'metal' };
SS.habitatLayout = (W, H) => {
  const hab = SS.HABITAT[S.home], pad = 12, top = 18, rowH = (H - top - pad - 6) / 2;
  const R = {};
  hab.rooms.forEach(([id, name, x, w]) => { R[id] = { id, name, x: pad + x * (W - pad * 2), y: top, w: w * (W - pad * 2), h: rowH - 3 }; });
  const extra = [];
  if (S.extras.garden) extra.push(['garden', 'Sera']);
  if (S.extras.workshop) extra.push(['workshop', 'Atölye']);
  const bottom = [...SS.crewList().map(id => [id, SS.comp(id).name]), ...extra];
  if (!bottom.length) bottom.push(['store', 'Depo']);
  const bw = (W - pad * 2) / bottom.length;
  bottom.forEach(([id, name], i) => { R[id] = { id, name, x: pad + i * bw, y: top + rowH + 3, w: bw, h: rowH - 3, crew: SS.hasCrew(id) }; });
  // yuvaları odalar arasında sırayla dağıt
  const order = Object.values(R), want = SS.decorSlots(), slots = [];
  for (let k = 0; slots.length < want && k < 5; k++) for (const r of order) {
    const sp = (SLOT_SPOTS[r.id] || [])[k]; if (!sp || slots.length >= want) continue;
    const [fx, kind] = sp; slots.push({ i: slots.length, room: r.id, kind, fx, x: r.x + r.w * fx, y: kind === 'wall' ? r.y + r.h * .44 : r.y + r.h - 17 });
  }
  return { R, slots, rowH, top };
};
Art.habitat = (c, W, H, t, P, L) => {
  const C = SC(P);
  c.fillStyle = P.space0; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 60; i++) { c.fillStyle = P.star; c.globalAlpha = .25 + .35 * Math.abs(Math.sin(t * .7 + i)); c.fillRect((i * 97) % W, (i * 53) % H, 1.1, 1.1); } c.globalAlpha = 1;
  // dış gövde
  c.fillStyle = lin(c, 0, 0, 0, H, [[0, P.metalL], [.08, P.metal], [1, P.metalD]]); rr(c, 3, 6, W - 6, H - 8, 20); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 1; rr(c, 4.5, 7.5, W - 9, H - 11, 19); c.stroke();
  for (let x = 24; x < W - 16; x += 26) { c.fillStyle = P.metalD; c.beginPath(); c.arc(x, 11, 1.2, 0, TAU); c.arc(x, H - 6, 1.2, 0, TAU); c.fill(); }
  [[10, 50], [W - 10, 50], [10, H - 50], [W - 10, H - 50]].forEach(([x, y], i) => { const on = Math.sin(t * 2 + i * 1.7) > .4; c.fillStyle = on ? (i % 2 ? C.green : C.red) : P.metalD; c.beginPath(); c.arc(x, y, 2, 0, TAU); c.fill(); if (on) glow(c, x, y, 6, i % 2 ? C.green : C.red, .7); });
  for (const r of Object.values(L.R)) roomArt(c, r, t, P, C);
  L.slots.forEach(sl => { const id = S.decor[sl.i]; if (id) { c.fillStyle = 'rgba(0,0,0,.28)'; if (sl.kind === 'floor') { c.beginPath(); c.ellipse(sl.x, sl.y + 9, 13, 3, 0, 0, TAU); c.fill(); } decorArt(c, id, sl.x, sl.y, t, P, C, sl.kind); } });
  const live = L.R.live; figure(c, live.x + live.w * .52, live.y + live.h - 9, 'captain', t, P, C);
  for (const id of SS.crewList()) { const r = L.R[id]; if (!r) continue; const k = S.crew[id];
    if (k.task === 'rest' || k.sick || k.down || S.time >= 1260) figure(c, r.x + r.w * .6, r.y + r.h - 9, id, t, P, C, k.sick || k.down); }
};
function roomArt(c, r, t, P, C) {
  const { x, y, w, h, id } = r, fy = y + h - 11;
  c.save(); c.beginPath(); c.rect(x + 2, y + 2, w - 4, h - 4); c.clip();
  // duvar
  c.fillStyle = lin(c, 0, y, 0, fy, [[0, P.space1], [1, P.ui]]); c.fillRect(x, y, w, h);
  c.fillStyle = SS.homeTint() || P[WALL_TINT[id]] || P.metal; c.globalAlpha = .16; c.fillRect(x, y, w, h); c.globalAlpha = 1;
  // duvar panelleri
  c.strokeStyle = 'rgba(255,255,255,.07)'; c.lineWidth = 1;
  const pw = Math.max(26, w / Math.max(2, Math.round(w / 40)));
  for (let px = x + 6; px < x + w - 10; px += pw) { rr(c, px, y + 20, pw - 6, fy - y - 34, 4); c.stroke(); }
  c.fillStyle = P[WALL_TINT[id]] || P.metal; c.globalAlpha = .55; c.fillRect(x, fy - 6, w, 2); c.globalAlpha = 1;
  // pencere
  if (id !== 'garden' && id !== 'workshop') {
    const ww = Math.min(w * .42, 64), wh = Math.min(h * .3, 30), wx = x + (id === 'live' ? w * .08 : id === 'bed' ? w * .5 : w * .5 - ww / 2), wy = y + 22;
    c.fillStyle = P.metalD; rr(c, wx - 3, wy - 3, ww + 6, wh + 6, 7); c.fill();
    c.save(); rr(c, wx, wy, ww, wh, 5); c.clip();
    c.fillStyle = lin(c, 0, wy, 0, wy + wh, [[0, P.space0], [1, P.space1]]); c.fillRect(wx, wy, ww, wh);
    for (let i = 0; i < 8; i++) { c.fillStyle = P.star; c.globalAlpha = .5 + .5 * Math.sin(t + i * 2 + x); c.fillRect(wx + ((i * 37 + x) % ww), wy + ((i * 23) % wh), 1.2, 1.2); } c.globalAlpha = 1;
    const pr = ww * .55; c.fillStyle = lin(c, wx, wy + wh, wx + ww, wy, [[0, P.slimeD], [1, P.crystal2]]); c.beginPath(); c.arc(wx + ww * .75, wy + wh + pr * .55, pr, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.moveTo(wx + ww * .15, wy); c.lineTo(wx + ww * .35, wy); c.lineTo(wx + ww * .1, wy + wh); c.lineTo(wx - ww * .1, wy + wh); c.fill();
    c.restore();
    c.fillStyle = P.metalL; [[wx - 1, wy - 1], [wx + ww + 1, wy - 1], [wx - 1, wy + wh + 1], [wx + ww + 1, wy + wh + 1]].forEach(([a, b]) => { c.beginPath(); c.arc(a, b, 1, 0, TAU); c.fill(); });
  }
  // tavan ışığı ve konisi
  const lx = x + w * .5;
  c.fillStyle = lin(c, 0, y + 6, 0, fy, [[0, 'rgba(255,214,140,.22)'], [1, 'rgba(255,214,140,0)']]);
  c.beginPath(); c.moveTo(lx - 8, y + 6); c.lineTo(lx + 8, y + 6); c.lineTo(lx + w * .32, fy); c.lineTo(lx - w * .32, fy); c.fill();
  c.fillStyle = P.metalD; c.fillRect(lx - 12, y + 3, 24, 4); c.fillStyle = C.warm; c.fillRect(lx - 9, y + 6, 18, 1.6);
  // zemin
  c.fillStyle = lin(c, 0, fy, 0, y + h, [[0, P.metal], [1, P.metalD]]); c.fillRect(x, fy, w, y + h - fy);
  c.strokeStyle = 'rgba(0,0,0,.25)'; for (let i = x + 10; i < x + w; i += 14) { c.beginPath(); c.moveTo(i, fy); c.lineTo(i - 4, y + h); c.stroke(); }
  c.fillStyle = 'rgba(255,214,140,.12)'; c.beginPath(); c.ellipse(lx, fy + 4, w * .3, 3, 0, 0, TAU); c.fill();
  furniture(c, r, fy, t, P, C);
  c.restore();
  c.strokeStyle = P.metalD; c.lineWidth = 3; rr(c, x + 1.5, y + 1.5, w - 3, h - 3, 4); c.stroke();
}
const shadow = (c, x, y, w) => { c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(x, y, w, 2.8, 0, 0, TAU); c.fill(); };
function furniture(c, r, fy, t, P, C) {
  const { x, w, id, y, h } = r;
  if (id === 'bed') {
    const bw = Math.min(w * .58, 76), bx = x + 7;
    shadow(c, bx + bw / 2, fy + 1, bw / 2 + 4);
    c.fillStyle = P.hullD; rr(c, bx, fy - 15, bw, 15, 4); c.fill();
    c.fillStyle = lin(c, 0, fy - 22, 0, fy - 13, [[0, P.hull2], [1, P.hull]]); rr(c, bx + 2, fy - 21, bw - 4, 9, 4); c.fill();
    c.fillStyle = P.metalL; rr(c, bx + 4, fy - 25, 18, 8, 4); c.fill();
    c.fillStyle = P.hullD; rr(c, bx - 2, fy - 30, 5, 30, 2); c.fill();
    if (S.home === 0) { c.strokeStyle = 'rgba(160,240,255,.45)'; c.lineWidth = 2; c.beginPath(); c.arc(bx + bw / 2, fy - 12, bw / 2 + 5, Math.PI * 1.02, Math.PI * 1.98); c.stroke(); }
    c.fillStyle = P.boxD; c.fillRect(bx + bw + 4, fy - 12, 12, 12); c.fillStyle = C.warm; glow(c, bx + bw + 10, fy - 17, 8, C.warm, .5); c.fillRect(bx + bw + 8, fy - 18, 4, 5);
  }
  if (id === 'live') {
    const kx = x + w - 52; shadow(c, kx + 24, fy + 1, 26);
    c.fillStyle = lin(c, kx, 0, kx + 46, 0, [[0, P.metal], [1, P.metalL]]); c.fillRect(kx, fy - 24, 46, 24);
    c.fillStyle = P.metalD; c.fillRect(kx + 2, fy - 22, 18, 9); c.fillStyle = P.space0; c.fillRect(kx + 4, fy - 20, 14, 5);
    c.fillStyle = Math.sin(t * 3) > 0 ? C.red : P.tankD; c.fillRect(kx + 24, fy - 21, 3, 2); c.fillStyle = P.ui; c.fillRect(kx + 2, fy - 11, 42, 1.5);
    c.fillStyle = P.metalL; rr(c, kx + 30, fy - 40, 14, 16, 2); c.fill();
    if (Math.sin(t) > 0) { c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 1; c.beginPath(); c.moveTo(kx + 10, fy - 26); c.quadraticCurveTo(kx + 13, fy - 32, kx + 10, fy - 38); c.stroke(); }
    const tx = x + w * .44; shadow(c, tx + 14, fy + 1, 16); c.fillStyle = P.box; rr(c, tx, fy - 13, 28, 4, 2); c.fill(); c.fillStyle = P.boxD; c.fillRect(tx + 3, fy - 9, 2.5, 9); c.fillRect(tx + 22, fy - 9, 2.5, 9);
    c.fillStyle = P.metalL; c.beginPath(); c.arc(tx + 8, fy - 15, 2, 0, TAU); c.fill();
    if (S.home >= 1) { const sx = x + 8; shadow(c, sx + 22, fy + 1, 24); c.fillStyle = P.slimeD; rr(c, sx, fy - 22, 44, 10, 5); c.fill(); c.fillStyle = P.slime; rr(c, sx, fy - 14, 44, 14, 5); c.fill(); c.fillStyle = P.crystal2; rr(c, sx + 4, fy - 19, 10, 7, 3); c.fill(); }
  }
  if (id === 'lounge') { shadow(c, x + w / 2, fy + 1, w * .35); c.fillStyle = P.hullD; rr(c, x + w * .15, fy - 22, w * .7, 10, 5); c.fill(); c.fillStyle = P.hull; rr(c, x + w * .15, fy - 14, w * .7, 14, 5); c.fill(); }
  if (id === 'pit') { const px = x + w * .6;
    if (S.rooms.pit) { glow(c, px, fy - 2, 26, C.cyan, .55); c.fillStyle = P.metal; rr(c, px - 20, fy - 5, 40, 5, 2); c.fill(); c.fillStyle = C.cyan; c.fillRect(px - 16, fy - 4, 32, 1.6); c.fillStyle = P.metalD; c.fillRect(px + 16, fy - 26, 4, 22); c.fillStyle = C.green; c.fillRect(px + 16.5, fy - 24 + (t * 6 % 16), 3, 2); }
    else { shadow(c, px, fy + 1, 18); c.fillStyle = P.box; c.beginPath(); c.ellipse(px, fy - 3, 18, 6, 0, 0, TAU); c.fill(); c.fillStyle = P.boxD; c.beginPath(); c.ellipse(px, fy - 4, 13, 3.5, 0, 0, TAU); c.fill(); } }
  if (id === 'ela') { const bx = x + 6, bw = Math.min(44, w * .42); shadow(c, bx + bw / 2, fy + 1, bw / 2 + 2);
    c.fillStyle = P.crystal2; rr(c, bx, fy - 12, bw, 12, 3); c.fill(); c.fillStyle = P.metalL; rr(c, bx + 2, fy - 16, 12, 5, 2); c.fill();
    c.fillStyle = P.accent; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(bx + 6 + i * 9, y + h * .45, 1.4, 0, TAU); c.fill(); }
    if (S.rooms.ela) { const dx = x + w - 36; shadow(c, dx + 14, fy + 1, 16); c.fillStyle = P.box; c.fillRect(dx, fy - 18, 30, 3); c.fillRect(dx + 2, fy - 15, 2, 15); c.fillRect(dx + 26, fy - 15, 2, 15);
      c.fillStyle = C.green; c.fillRect(dx + 4, fy - 25, 5, 7); c.fillStyle = P.bad; c.fillRect(dx + 10, fy - 24, 4, 6); c.fillStyle = C.cyan; c.fillRect(dx + 15, fy - 23, 3, 5); glow(c, dx + 24, fy - 22, 13, C.warm, .55); c.fillStyle = C.warm; c.fillRect(dx + 22, fy - 27, 5, 3); } }
  if (id === 'tolga') { c.strokeStyle = P.hull2; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x + 8, y + h * .48); c.quadraticCurveTo(x + 8 + Math.min(36, w * .3), fy - 6, x + 8 + Math.min(64, w * .55), y + h * .48); c.stroke();
    if (S.rooms.tolga) { const bx = x + w - 42; shadow(c, bx + 18, fy + 1, 20); c.fillStyle = P.metal; c.fillRect(bx, fy - 14, 36, 4); c.fillRect(bx + 2, fy - 10, 3, 10); c.fillRect(bx + 31, fy - 10, 3, 10);
      c.fillStyle = P.metalD; rr(c, bx, y + 18, 36, 20, 3); c.fill(); c.fillStyle = P.warn; [[4, 21], [12, 25], [22, 20], [29, 26]].forEach(([a, b]) => c.fillRect(bx + a, y + b, 3, 9)); if (Math.sin(t * 7) > .7) glow(c, bx + 18, fy - 16, 9, C.warm, .9); } }
  if (id === 'garden') { for (let k = 0; k < 2; k++) { const sy = y + h * (.36 + k * .3); c.fillStyle = P.metalD; c.fillRect(x + 8, sy, w - 16, 3); for (let i = x + 14; i < x + w - 10; i += 11) { c.fillStyle = C.green; c.beginPath(); c.ellipse(i, sy - 6, 3, 6 + Math.sin(t + i), Math.sin(t * .8 + i) * .2, 0, TAU); c.fill(); } } glow(c, x + w / 2, y + 10, w * .55, P.crystal2, .3); }
  if (id === 'workshop') { shadow(c, x + w / 2, fy + 1, w * .35); c.fillStyle = P.metal; c.fillRect(x + 8, fy - 15, w - 16, 4); c.fillRect(x + 10, fy - 11, 3, 11); c.fillRect(x + w - 13, fy - 11, 3, 11); c.fillStyle = P.box; c.fillRect(x + 16, fy - 22, 12, 7); if (Math.sin(t * 7) > .6) glow(c, x + w * .62, fy - 18, 11, C.warm, .9); }
}
function figure(c, x, y, who, t, P, C, sick) {
  const bob = Math.sin(t * 2 + x) * 1, arm = Math.sin(t * 1.6 + x) * .25;
  c.save(); c.translate(x, y);
  c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(0, 1, 10, 2.6, 0, 0, TAU); c.fill();
  c.translate(0, bob);
  if (who === 'pit') {
    c.fillStyle = lin(c, 0, -14, 0, 0, [[0, P.metalL], [1, P.metal]]); c.beginPath(); c.ellipse(0, -6, 11, 6.5, 0, 0, TAU); c.fill();
    c.fillStyle = P.metalD; [-7, -2, 3, 8].forEach(lx => c.fillRect(lx - 1, -2, 2.2, 3));
    c.fillStyle = P.metalL; c.beginPath(); c.arc(9, -12, 6, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(4.5, -15); c.lineTo(5.5, -22); c.lineTo(9, -16.5); c.moveTo(9.5, -16.5); c.lineTo(13, -22); c.lineTo(14, -15); c.fill();
    c.fillStyle = P.ui; rr(c, 5, -14.5, 8, 4, 1.5); c.fill(); c.fillStyle = C.cyan; c.fillRect(6, -13.5, 2, 2); c.fillRect(10, -13.5, 2, 2);
    c.strokeStyle = P.metal; c.lineWidth = 2.5; c.lineCap = 'round'; c.beginPath(); c.moveTo(-10, -7); c.quadraticCurveTo(-18, -12 + Math.sin(t * 3) * 3, -14, -19); c.stroke();
  } else {
    const col = { captain: P.hull, ela: P.accent, tolga: P.box }[who] || P.hull, sc = who === 'ela' ? .82 : 1;
    c.scale(sc, sc);
    c.fillStyle = P.ui; rr(c, -5, -11, 4, 11, 1.5); c.fill(); rr(c, 1, -11, 4, 11, 1.5); c.fill();
    c.fillStyle = P.metalD; c.fillRect(-6, -1, 5, 2); c.fillRect(1, -1, 5, 2);
    c.save(); c.translate(-7, -24); c.rotate(arm); c.fillStyle = col; rr(c, -2, 0, 4, 12, 2); c.fill(); c.fillStyle = P.hull2; c.beginPath(); c.arc(0, 12.5, 1.8, 0, TAU); c.fill(); c.restore();
    c.save(); c.translate(7, -24); c.rotate(-arm); c.fillStyle = col; rr(c, -2, 0, 4, 12, 2); c.fill(); c.fillStyle = P.hull2; c.beginPath(); c.arc(0, 12.5, 1.8, 0, TAU); c.fill(); c.restore();
    c.fillStyle = lin(c, -7, 0, 7, 0, [[0, col], [1, P.hullD]]); rr(c, -7, -26, 14, 16, 4); c.fill();
    c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(-5, -24, 3, 10);
    c.fillStyle = P.hull2; c.beginPath(); c.arc(0, -32, 6.5, 0, TAU); c.fill();
    const hair = who === 'tolga' ? P.ui : who === 'ela' ? P.rockD : P.metalD;
    c.fillStyle = hair; c.beginPath(); c.arc(0, -33.5, 6.8, Math.PI * 1.05, TAU * .98); c.fill();
    if (who === 'ela') { c.fillRect(-7, -34, 3, 9); c.fillRect(4, -34, 3, 9); c.fillStyle = P.crystal2; c.beginPath(); c.arc(6, -38, 2.3, 0, TAU); c.fill(); }
    if (who === 'tolga') { c.fillStyle = P.box; c.fillRect(-7, -38, 14, 2.5); c.fillStyle = P.rockD; c.fillRect(-4, -28, 8, 2.5); }
    const blink = Math.sin(t * 1.3 + x) > .96;
    c.fillStyle = P.ui; if (!blink) { c.fillRect(-3, -32.5, 1.8, 2); c.fillRect(1.5, -32.5, 1.8, 2); } else { c.fillRect(-3, -31.5, 2, .8); c.fillRect(1.5, -31.5, 2, .8); }
    c.fillStyle = P.crystal2; c.globalAlpha = .5; c.fillRect(-5, -30, 2, 1.4); c.fillRect(3.4, -30, 2, 1.4); c.globalAlpha = 1;
  }
  if (sick) { glow(c, 0, -46, 7, P.bad, .8); c.fillStyle = P.bad; c.font = 'bold 11px sans-serif'; c.textAlign = 'center'; c.fillText('!', 0, -42); }
  c.restore();
}

/* ================= TEK ODA: perspektifli büyük görünüm ================= */
SS.roomGeom = (W, H) => ({ W, H, bx0: W * .17, bx1: W * .83, by0: H * .12, by1: H * .6 });
const floorPt = (g, fx, d) => { const y = g.by1 + (g.H - g.by1) * d, xl = g.bx0 * (1 - d), xr = g.bx1 * (1 - d) + g.W * d; return { x: xl + (xr - xl) * fx, y, s: 1.55 + d * 1.1 }; };
SS.roomSlotPos = (g, sl) => sl.kind === 'wall' ? { x: g.bx0 + (g.bx1 - g.bx0) * sl.fx, y: g.by0 + (g.by1 - g.by0) * .62, s: 1.55 } : floorPt(g, sl.fx, .5);
Art.room = (c, W, H, t, P, L, id) => {
  const C = SC(P), g = SS.roomGeom(W, H), { bx0, bx1, by0, by1 } = g, tint = SS.homeTint() || P[WALL_TINT[id]] || P.metal, r = L.R[id];
  // tavan
  c.fillStyle = lin(c, 0, 0, 0, by0, [[0, P.space0], [1, P.ui]]); c.beginPath(); c.moveTo(0, 0); c.lineTo(W, 0); c.lineTo(bx1, by0); c.lineTo(bx0, by0); c.fill();
  c.fillStyle = P.metalD; c.beginPath(); c.moveTo(W * .36, 0); c.lineTo(W * .64, 0); c.lineTo(W * .58, by0 * .7); c.lineTo(W * .42, by0 * .7); c.fill();
  c.fillStyle = C.warm; c.globalAlpha = .9; c.beginPath(); c.moveTo(W * .39, by0 * .2); c.lineTo(W * .61, by0 * .2); c.lineTo(W * .57, by0 * .6); c.lineTo(W * .43, by0 * .6); c.fill(); c.globalAlpha = 1;
  // arka duvar
  c.fillStyle = lin(c, 0, by0, 0, by1, [[0, P.space1], [1, P.ui]]); c.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
  c.fillStyle = tint; c.globalAlpha = .2; c.fillRect(bx0, by0, bx1 - bx0, by1 - by0); c.globalAlpha = 1;
  c.strokeStyle = 'rgba(255,255,255,.07)'; c.lineWidth = 1;
  const cols = 4, pw = (bx1 - bx0) / cols; for (let i = 0; i < cols; i++) { rr(c, bx0 + i * pw + 4, by0 + 6, pw - 8, (by1 - by0) - 22, 6); c.stroke(); }
  c.fillStyle = tint; c.globalAlpha = .6; c.fillRect(bx0, by1 - 9, bx1 - bx0, 3); c.globalAlpha = 1;
  // pencere
  let win = null;
  if (id !== 'garden' && id !== 'workshop') {
    const ww = (bx1 - bx0) * .46, wh = (by1 - by0) * .4, wx = bx0 + (bx1 - bx0) * (id === 'bed' ? .5 : id === 'live' ? .06 : .27), wy = by0 + 14; win = { wx, wy, ww, wh };
    c.fillStyle = P.metalD; rr(c, wx - 5, wy - 5, ww + 10, wh + 10, 10); c.fill(); c.fillStyle = P.metal; rr(c, wx - 3, wy - 3, ww + 6, wh + 6, 8); c.fill();
    c.save(); rr(c, wx, wy, ww, wh, 7); c.clip();
    c.fillStyle = lin(c, 0, wy, 0, wy + wh, [[0, P.space0], [1, P.space1]]); c.fillRect(wx, wy, ww, wh);
    for (let i = 0; i < 22; i++) { c.fillStyle = P.star; c.globalAlpha = .4 + .6 * Math.abs(Math.sin(t * .8 + i * 1.7)); c.fillRect(wx + (i * 41 % ww), wy + (i * 29 % wh), 1.3, 1.3); } c.globalAlpha = 1;
    const pr = ww * .5, pxx = wx + ww * .72, pyy = wy + wh + pr * .45;
    glow(c, pxx, pyy, pr * 1.3, P.crystal2, .35);
    c.fillStyle = lin(c, pxx - pr, pyy - pr, pxx + pr, pyy, [[0, P.slime], [.6, P.slimeD], [1, P.space1]]); c.beginPath(); c.arc(pxx, pyy, pr, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(pxx, pyy, pr * 1.35, pr * .22, -.2, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
    const sf = (t * .05) % 1, sx = wx - 10 + sf * (ww + 20), sy = wy + wh * .3; c.fillStyle = C.light; c.fillRect(sx, sy, 4, 1.5); glow(c, sx - 2, sy + .7, 4, P.flame, .7);
    c.fillStyle = 'rgba(255,255,255,.1)'; c.beginPath(); c.moveTo(wx + ww * .12, wy); c.lineTo(wx + ww * .3, wy); c.lineTo(wx + ww * .05, wy + wh); c.lineTo(wx - ww * .1, wy + wh); c.fill();
    c.restore();
    c.fillStyle = P.metalL; [[wx - 2, wy - 2], [wx + ww + 2, wy - 2], [wx - 2, wy + wh + 2], [wx + ww + 2, wy + wh + 2]].forEach(([a, b]) => { c.beginPath(); c.arc(a, b, 1.5, 0, TAU); c.fill(); });
  }
  // yan duvarlar
  c.fillStyle = lin(c, 0, 0, bx0, 0, [[0, P.space0], [1, P.space1]]); c.beginPath(); c.moveTo(0, 0); c.lineTo(bx0, by0); c.lineTo(bx0, by1); c.lineTo(0, H); c.fill();
  c.fillStyle = lin(c, W, 0, bx1, 0, [[0, P.space0], [1, P.space1]]); c.beginPath(); c.moveTo(W, 0); c.lineTo(bx1, by0); c.lineTo(bx1, by1); c.lineTo(W, H); c.fill();
  c.fillStyle = tint; c.globalAlpha = .12; c.beginPath(); c.moveTo(0, 0); c.lineTo(bx0, by0); c.lineTo(bx0, by1); c.lineTo(0, H); c.fill(); c.beginPath(); c.moveTo(W, 0); c.lineTo(bx1, by0); c.lineTo(bx1, by1); c.lineTo(W, H); c.fill(); c.globalAlpha = 1;
  c.strokeStyle = 'rgba(255,255,255,.06)'; for (let k = 1; k < 4; k++) { const u = k / 4; [[0, bx0], [W, bx1]].forEach(([e, b]) => { const x = b + (e - b) * u; c.beginPath(); c.moveTo(x, by0 * (1 - u)); c.lineTo(x, by1 + (H - by1) * u); c.stroke(); }); }
  // sağ duvarda kapı
  const du0 = .3, du1 = .62, dX = u => bx1 + (W - bx1) * u, dTop = u => by0 * (1 - u) + by0 * .9 * u + (by1 - by0) * .18 * (1 - u), dBot = u => by1 + (H - by1) * u;
  c.fillStyle = P.metalD; c.beginPath(); c.moveTo(dX(du0), dTop(du0) - 3); c.lineTo(dX(du1), dTop(du1) - 3); c.lineTo(dX(du1), dBot(du1)); c.lineTo(dX(du0), dBot(du0)); c.fill();
  c.fillStyle = lin(c, dX(du0), 0, dX(du1), 0, [[0, P.ui], [1, P.space1]]); c.beginPath(); c.moveTo(dX(du0) + 3, dTop(du0)); c.lineTo(dX(du1) - 3, dTop(du1)); c.lineTo(dX(du1) - 3, dBot(du1)); c.lineTo(dX(du0) + 3, dBot(du0)); c.fill();
  glow(c, (dX(du0) + dX(du1)) / 2, dTop(du0) + 6, 10, C.green, .7);
  // zemin
  c.fillStyle = lin(c, 0, by1, 0, H, [[0, P.metalD], [1, P.metal]]); c.beginPath(); c.moveTo(bx0, by1); c.lineTo(bx1, by1); c.lineTo(W, H); c.lineTo(0, H); c.fill();
  c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = 1;
  for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(bx0 + (bx1 - bx0) * i / 8, by1); c.lineTo(W * i / 8, H); c.stroke(); }
  for (let k = 1; k < 6; k++) { const d = Math.pow(k / 6, 1.4), y = by1 + (H - by1) * d; c.beginPath(); c.moveTo(bx0 * (1 - d), y); c.lineTo(bx1 * (1 - d) + W * d, y); c.stroke(); }
  // zemin LED şeridi
  [[0, bx0], [W, bx1]].forEach(([e, b]) => { c.strokeStyle = tint; c.globalAlpha = .7; c.lineWidth = 2; c.beginPath(); c.moveTo(b, by1); c.lineTo(e, H); c.stroke(); c.globalAlpha = 1; });
  // ışık havuzu ve pencere huzmesi
  const pool = c.createRadialGradient(W / 2, by1 + (H - by1) * .35, 0, W / 2, by1 + (H - by1) * .35, W * .45); pool.addColorStop(0, 'rgba(255,214,140,.22)'); pool.addColorStop(1, 'rgba(255,214,140,0)');
  c.fillStyle = pool; c.fillRect(0, by1, W, H - by1);
  if (win) { c.fillStyle = 'rgba(200,220,255,.06)'; c.beginPath(); c.moveTo(win.wx, win.wy + win.wh); c.lineTo(win.wx + win.ww, win.wy + win.wh); c.lineTo(win.wx + win.ww + 40, H); c.lineTo(win.wx - 10, H); c.fill(); }
  // halı
  if (['bed', 'live', 'lounge', 'ela'].includes(id)) { const a = floorPt(g, .3, .35), b = floorPt(g, .7, .35), cc = floorPt(g, .78, .75), dd = floorPt(g, .22, .75);
    c.fillStyle = id === 'ela' ? P.crystal2 : id === 'bed' ? P.slime : P.hullD; c.globalAlpha = .5; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.lineTo(cc.x, cc.y); c.lineTo(dd.x, dd.y); c.fill(); c.globalAlpha = 1;
    c.strokeStyle = P.accent; c.globalAlpha = .35; c.lineWidth = 1.5; c.stroke(); c.globalAlpha = 1; }
  // mobilya: arka duvara büyütülmüş
  const k = 1.85, fr = { id, x: 0, y: 0, w: (bx1 - bx0) / k, h: (by1 - by0) / k + 11 };
  c.save(); c.translate(bx0, by0); c.scale(k, k); furniture(c, fr, fr.h - 11, t, P, C); c.restore();
  // dekorlar ve karakterler derinliğe göre
  const things = [];
  L.slots.filter(sl => sl.room === id && S.decor[sl.i]).forEach(sl => { const p = SS.roomSlotPos(g, sl); things.push({ y: sl.kind === 'wall' ? 0 : p.y, draw: () => {
    if (sl.kind === 'floor') { c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(p.x, p.y + 9 * p.s, 13 * p.s, 3 * p.s, 0, 0, TAU); c.fill(); }
    c.save(); c.translate(p.x, p.y); c.scale(p.s, p.s); decorArt(c, S.decor[sl.i], 0, 0, t, P, C, sl.kind); c.restore(); } }); });
  const who = id === 'live' ? 'captain' : SS.hasCrew(id) ? id : null;
  if (who) { const k0 = who === 'captain' ? null : S.crew[who];
    if (!k0 || k0.task === 'rest' || k0.sick || k0.down || S.time >= 1260) { const p = floorPt(g, who === 'captain' ? .5 : .55, .42); things.push({ y: p.y, draw: () => { c.save(); c.translate(p.x, p.y); c.scale(2.1, 2.1); figure(c, 0, 0, who, t, P, C, k0 && (k0.sick || k0.down)); c.restore(); } }); } }
  things.sort((a, b) => a.y - b.y).forEach(o => o.draw());
  // köşe karartması
  const vg = c.createRadialGradient(W / 2, H * .5, W * .3, W / 2, H * .5, W * .8); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.45)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
};
// Her dekorun odadaki görünümü
function decorArt(c, id, x, y, t, P, C, kind) {
  c.save(); c.translate(x, y); c.scale(1.15, 1.15);
  const pot = () => { c.fillStyle = P.boxD; c.beginPath(); c.moveTo(-6, 0); c.lineTo(6, 0); c.lineTo(4, 8); c.lineTo(-4, 8); c.fill(); };
  switch (id) {
    case 'plant': pot(); c.fillStyle = C.green; [[-4, -6, -.5], [0, -9, 0], [4, -6, .5]].forEach(([a, b, r]) => { c.beginPath(); c.ellipse(a, b, 3, 7, r, 0, TAU); c.fill(); }); break;
    case 'lamp': glow(c, 0, -10, 18, C.warm, .5); c.fillStyle = P.metalD; c.fillRect(-1, -8, 2, 16); c.fillRect(-5, 7, 10, 2); c.fillStyle = C.warm; c.beginPath(); c.moveTo(-7, -8); c.lineTo(7, -8); c.lineTo(4, -15); c.lineTo(-4, -15); c.fill(); break;
    case 'rug': c.fillStyle = P.bad; c.beginPath(); c.ellipse(0, 7, 20, 3.5, 0, 0, TAU); c.fill(); c.strokeStyle = P.accent; c.lineWidth = 1; c.beginPath(); c.ellipse(0, 7, 14, 2, 0, 0, TAU); c.stroke(); break;
    case 'aquarium': c.fillStyle = P.metalD; c.fillRect(-15, 4, 30, 4); c.fillStyle = 'rgba(80,200,255,.45)'; c.fillRect(-14, -12, 28, 16); c.strokeStyle = P.metalL; c.lineWidth = 1; c.strokeRect(-14, -12, 28, 16);
      c.fillStyle = P.box; c.beginPath(); c.ellipse(-6 + Math.sin(t) * 6, -4, 3, 2, 0, 0, TAU); c.fill(); c.fillStyle = P.crystal2; c.beginPath(); c.ellipse(4 + Math.cos(t * 1.3) * 5, -7, 2.5, 1.6, 0, 0, TAU); c.fill(); break;
    case 'musicbox': c.fillStyle = P.box; c.fillRect(-7, 0, 14, 8); c.fillStyle = P.boxD; c.fillRect(-7, -2, 14, 3); c.fillStyle = P.accent; c.font = '8px sans-serif'; c.textAlign = 'center'; c.fillText('♪', 4 + Math.sin(t * 2) * 2, -6 - (t * 6 % 6)); break;
    case 'poster': c.fillStyle = P.metalL; c.fillRect(-9, -12, 18, 24); c.fillStyle = P.crystal2; c.beginPath(); c.arc(0, -3, 6, 0, TAU); c.fill(); c.fillStyle = C.green; c.fillRect(-7, 4, 14, 5); break;
    case 'curtain': c.fillStyle = P.slime; c.fillRect(-14, -16, 8, 28); c.fillRect(6, -16, 8, 28); c.fillStyle = P.metalD; c.fillRect(-16, -18, 32, 2); break;
    case 'hammock': c.strokeStyle = P.hull2; c.lineWidth = 3; c.beginPath(); c.moveTo(-18, -8); c.quadraticCurveTo(0, 8, 18, -8); c.stroke(); c.fillStyle = P.metalD; c.fillRect(-19, -12, 2, 20); c.fillRect(17, -12, 2, 20); break;
    case 'telescope': c.fillStyle = P.metalD; c.fillRect(-1, -4, 2, 12); c.fillRect(-6, 6, 12, 2); c.save(); c.translate(0, -4); c.rotate(-.6); c.fillStyle = P.metalL; c.fillRect(-10, -3, 20, 6); c.fillStyle = C.cyan; c.fillRect(8, -3, 3, 6); c.restore(); break;
    case 'gym': c.fillStyle = P.metalD; c.fillRect(-16, 4, 32, 4); c.fillStyle = P.ui; c.fillRect(-14, 2, 26, 3); c.fillStyle = P.metal; c.fillRect(10, -12, 3, 16); c.fillRect(6, -13, 10, 3); break;
    case 'bonsai': pot(); c.strokeStyle = P.boxD; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-4, -6, 2, -10); c.stroke(); c.fillStyle = P.crystal2; c.beginPath(); c.arc(2, -12, 6, 0, TAU); c.fill(); c.fillStyle = C.green; c.beginPath(); c.arc(-4, -8, 4, 0, TAU); c.fill(); break;
    case 'table': c.fillStyle = P.box; c.fillRect(-16, -2, 32, 4); c.fillStyle = P.boxD; c.fillRect(-14, 2, 3, 6); c.fillRect(11, 2, 3, 6); c.fillStyle = P.metalL; c.beginPath(); c.arc(-6, -4, 2.5, 0, TAU); c.arc(6, -4, 2.5, 0, TAU); c.fill(); break;
    case 'heater': glow(c, 0, -2, 16, P.flame, .5); c.fillStyle = P.metalD; rr(c, -8, -10, 16, 18, 3); c.fill(); c.fillStyle = P.flame; c.fillRect(-4, -4, 8, 6); break;
    case 'globe': c.fillStyle = P.metalD; c.fillRect(-1, 2, 2, 6); c.fillRect(-5, 7, 10, 2); c.fillStyle = C.cyan; c.beginPath(); c.arc(0, -4, 7, 0, TAU); c.fill(); c.fillStyle = C.green; c.beginPath(); c.ellipse(-2 + Math.sin(t) * 2, -5, 3, 2, 0, 0, TAU); c.fill(); break;
    case 'jukebox': glow(c, 0, -6, 20, P.crystal2, .45); c.fillStyle = P.bad; rr(c, -10, -18, 20, 26, 9); c.fill(); c.fillStyle = C.warm; c.fillRect(-6, -10, 12, 8); c.fillStyle = P.accent; c.fillRect(-6, 1, 12, 3); break;
    case 'starmap': c.fillStyle = P.ui; c.fillRect(-14, -12, 28, 22); c.strokeStyle = P.accent; c.lineWidth = 1; c.strokeRect(-14, -12, 28, 22); c.fillStyle = C.cyan; [[-8, -6], [-2, 2], [6, -4], [9, 4]].forEach(([a, b]) => c.fillRect(a, b, 2, 2)); c.strokeStyle = C.cyan; c.beginPath(); c.moveTo(-7, -5); c.lineTo(-1, 3); c.lineTo(7, -3); c.lineTo(10, 5); c.stroke(); break;
    case 'chair': c.fillStyle = P.hullD; rr(c, -9, -10, 18, 12, 4); c.fill(); c.fillStyle = P.hull; rr(c, -11, -2, 22, 6, 3); c.fill(); c.fillStyle = P.metalD; c.fillRect(-1, 4, 2, 4); c.fillRect(-6, 7, 12, 2); break;
    case 'robotpet': c.fillStyle = P.metalD; c.fillRect(-1, -2, 2, 10); c.fillRect(-6, -2, 12, 2); c.fillStyle = P.metalL; c.beginPath(); c.ellipse(Math.sin(t * 2) * 2, -8, 6, 4, 0, 0, TAU); c.fill(); c.fillStyle = P.box; c.beginPath(); c.moveTo(5, -8); c.lineTo(9, -7); c.lineTo(5, -6); c.fill(); c.fillStyle = P.ui; c.fillRect(1, -10, 1.5, 1.5); break;
  }
  c.restore();
}

})(window.SS);

// Space Scrapper — çizim katmanı. Aynı çizim kodu iki stilde çalışır:
// vektör: yüksek çözünürlük, yumuşak kenarlar; piksel: düşük çözünürlük + mod paletine nicemleme.
(function(SS){
const Art = SS.Art = {};
const TAU = Math.PI * 2;

Art.style = () => document.documentElement.dataset.style || 'vector';
// Sahne paleti renk temasından gelir (zorluktan bağımsız)
SS.palKey = () => (SS.THEMES.find(t => t.id === document.documentElement.dataset.theme) || SS.THEMES[0]).pal;
Art.P = () => SS.PAL[SS.palKey()];

// Piksel paleti için önbellekli en yakın renk tablosu
let qMode = null, qCache = null, qPal = null;
function quantTable() {
  const mode = SS.palKey();
  if (qMode !== mode) {
    qMode = mode; qCache = new Int16Array(32768).fill(-1);
    qPal = SS.PIXPAL[mode].map(h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
  }
}
function nearest(r, g, b) {
  const key = (r >> 3) << 10 | (g >> 3) << 5 | (b >> 3);
  let k = qCache[key];
  if (k < 0) {
    let bd = 1e9; k = 0;
    for (let i = 0; i < qPal.length; i++) {
      const p = qPal[i], dr = p[0] - r, dg = p[1] - g, db = p[2] - b;
      const d = dr * dr * .3 + dg * dg * .59 + db * db * .11;
      if (d < bd) { bd = d; k = i; }
    }
    qCache[key] = k;
  }
  return qPal[k];
}

// Bir canvas'ı mantıksal W×H boyutuna göre stile uygun hazırlar
Art.setup = (canvas, W, H, pixK = .5) => {
  const pixel = Art.style() === 'pixel';
  const k = pixel ? pixK : Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.max(1, Math.round(W * k)); canvas.height = Math.max(1, Math.round(H * k));
  canvas.style.imageRendering = pixel ? 'pixelated' : 'auto';
  const ctx = canvas.getContext('2d', { willReadFrequently: pixel });
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.imageSmoothingEnabled = !pixel;
  return { ctx, k, pixel };
};
// Piksel modda kareyi palete indirger, saydamlığı keskinleştirir
Art.post = (canvas, ctx, pixel) => {
  if (!pixel) return;
  quantTable();
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 100) { d[i + 3] = 0; continue; }
    const p = nearest(d[i], d[i + 1], d[i + 2]);
    d[i] = p[0]; d[i + 1] = p[1]; d[i + 2] = p[2]; d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
};
// Statik küçük çizimler (ikonlar, portreler, önizlemeler)
Art.paint = (canvas, W, H, fn, pixK = 1) => {
  const { ctx, pixel } = Art.setup(canvas, W, H, pixK);
  ctx.clearRect(0, 0, W, H);
  fn(ctx, Art.P());
  Art.post(canvas, ctx, pixel);
};
Art.paintAll = root => {
  (root || document).querySelectorAll('canvas[data-draw]').forEach(c => {
    const [kind, arg] = c.dataset.draw.split(':');
    const w = +c.getAttribute('width') || 44, h = +c.getAttribute('height') || 44;
    c.style.width = w + 'px'; c.style.height = h + 'px';
    Art.paint(c, w, h, (ctx, P) => Art.icon(ctx, kind, w, h, P, arg), c.dataset.pix ? +c.dataset.pix : 1);
  });
};

/* ---------- arka plan ---------- */
Art.makeStars = (n, W, H) => Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() < .15 ? 1.6 : .9, tw: Math.random() * 6 }));
Art.space = (c, W, H, t, zone, stars, P) => {
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, P.space0); g.addColorStop(1, P.space1);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = P.neb1; c.beginPath(); c.ellipse(W * .2, H * .35, W * .5, H * .16, -.4, 0, TAU); c.fill();
  c.fillStyle = P.neb2; c.beginPath(); c.ellipse(W * .85, H * .7, W * .45, H * .14, .5, 0, TAU); c.fill();
  for (const s of stars) {
    c.globalAlpha = .5 + .5 * Math.sin(t * 2 + s.tw);
    c.fillStyle = P.star; c.fillRect(s.x, s.y, s.r * 1.6, s.r * 1.6);
  }
  c.globalAlpha = 1;
  if (zone === 'gas') {
    const pg = c.createRadialGradient(W * .5, H + 260, 40, W * .5, H + 260, 420);
    pg.addColorStop(0, P.crystal2); pg.addColorStop(.75, P.slimeD); pg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = pg; c.beginPath(); c.arc(W * .5, H + 260, 420, 0, TAU); c.fill();
    c.strokeStyle = P.crystal; c.globalAlpha = .35; c.lineWidth = 3;
    c.beginPath(); c.ellipse(W * .5, H - 40, W * .8, 40, -.08, Math.PI, TAU); c.stroke(); c.globalAlpha = 1;
  } else if (zone === 'yard' || zone === 'lost') {
    c.fillStyle = zone === 'lost' ? P.boxD : P.metalD; c.globalAlpha = .35;
    c.beginPath(); c.moveTo(-10, H * .55); c.lineTo(W * .35, H * .5); c.lineTo(W * .4, H * .58); c.lineTo(W * .1, H * .68); c.lineTo(-10, H * .66); c.fill();
    c.beginPath(); c.moveTo(W + 10, H * .78); c.lineTo(W * .62, H * .82); c.lineTo(W * .7, H * .9); c.lineTo(W + 10, H * .92); c.fill();
    c.globalAlpha = 1;
  } else if (zone === 'pirate') {
    const on = Math.sin(t * 3) > 0;
    c.fillStyle = on ? P.bad : P.tankD; c.globalAlpha = .18; c.fillRect(0, 0, 8, H); c.fillRect(W - 8, 0, 8, H); c.globalAlpha = 1;
  }
};

/* ---------- gemi ve kaptan ---------- */
// Kademeli gemiler: 1 = Gezgin Martı (beyaz, kanatlı), 2 = Demir Balina (iri, lacivert)
function shipTier(c, x, y, s, t, P, opts, tier) {
  c.save(); c.translate(x, y); c.scale(s, s);
  if (tier === 1) {
    if (opts.flame) { c.fillStyle = P.flame; c.beginPath(); c.moveTo(-30, 4); c.lineTo(-52, 7); c.lineTo(-30, 10); c.fill(); c.beginPath(); c.moveTo(30, 4); c.lineTo(52, 7); c.lineTo(30, 10); c.fill(); }
    c.fillStyle = P.metalD; c.beginPath(); c.moveTo(-60, 2); c.lineTo(-26, -8); c.lineTo(-20, 6); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(60, 2); c.lineTo(26, -8); c.lineTo(20, 6); c.closePath(); c.fill();
    c.fillStyle = P.metalL; c.beginPath(); c.moveTo(-40, 10); c.quadraticCurveTo(-36, -14, -10, -16); c.lineTo(10, -16); c.quadraticCurveTo(36, -14, 40, 10); c.quadraticCurveTo(0, 22, -40, 10); c.fill();
    c.fillStyle = P.crystal; c.fillRect(-34, 2, 68, 4);
    c.fillStyle = P.glass; c.beginPath(); c.arc(0, -15, 13, Math.PI, Math.PI * 2); c.fill();
    c.fillStyle = P.hull2; c.beginPath(); c.arc(0, -13, 6, 0, Math.PI * 2); c.fill(); c.fillStyle = P.ui; c.fillRect(-4, -15, 8, 3);
    c.fillStyle = P.metalD; c.fillRect(-7, 16, 14, 9);
  } else {
    if (opts.flame) { c.fillStyle = P.flame; c.beginPath(); c.moveTo(-58, -2); c.lineTo(-80, 3); c.lineTo(-58, 8); c.fill(); }
    c.fillStyle = P.ui; c.beginPath(); c.moveTo(-60, 10); c.quadraticCurveTo(-62, -22, -10, -24); c.quadraticCurveTo(50, -24, 62, 0); c.quadraticCurveTo(60, 20, 20, 22); c.lineTo(-40, 22); c.quadraticCurveTo(-60, 20, -60, 10); c.fill();
    c.fillStyle = P.metalD; c.beginPath(); c.moveTo(-20, -24); c.lineTo(-6, -38); c.lineTo(4, -24); c.fill();
    c.fillStyle = P.metal; c.fillRect(-52, 4, 108, 4);
    c.fillStyle = P.glass; [-34, -20, -6].forEach(px => { c.beginPath(); c.arc(px, -8, 4, 0, Math.PI * 2); c.fill(); });
    c.fillStyle = P.glass; c.beginPath(); c.ellipse(40, -8, 12, 8, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = P.hull2; c.beginPath(); c.arc(40, -8, 4.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = Math.sin(t * 5) > 0 ? P.good : P.metalD; c.beginPath(); c.arc(-6, -38, 2.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = P.metalD; c.fillRect(-8, 20, 16, 8);
  }
  c.restore();
}
Art.ship = (c, x, y, s, t, P, opts = {}) => {
  if (SS.paintPalette && !opts.raw) P = SS.paintPalette(P);
  if (opts.tier) return shipTier(c, x, y, s, t, P, opts, opts.tier);
  c.save(); c.translate(x, y); c.scale(s, s);
  if (opts.flame) {
    const f = 10 + Math.sin(t * 40) * 4;
    c.fillStyle = P.flame; c.beginPath(); c.moveTo(-34, 2); c.lineTo(-34 - f * 1.6, 6); c.lineTo(-34, 10); c.fill();
    c.beginPath(); c.moveTo(34, 2); c.lineTo(34 + f * 1.6, 6); c.lineTo(34, 10); c.fill();
  }
  // gövde
  c.fillStyle = P.hullD; c.beginPath(); c.moveTo(-44, 6); c.lineTo(44, 6); c.lineTo(34, 20); c.lineTo(-34, 20); c.closePath(); c.fill();
  c.fillStyle = P.hull; c.beginPath(); c.moveTo(-48, 8); c.quadraticCurveTo(-46, -12, -18, -14); c.lineTo(18, -14); c.quadraticCurveTo(46, -12, 48, 8); c.closePath(); c.fill();
  c.fillStyle = P.hull2; c.fillRect(-40, 0, 80, 4);
  // yamalar (külüstür his)
  c.fillStyle = P.metal; c.fillRect(-36, -8, 9, 7); c.fillRect(24, -6, 8, 6);
  c.fillStyle = P.metalD; [[-34, -6], [-29, -3], [26, -4], [30, -2]].forEach(([a, b]) => c.fillRect(a, b, 1.6, 1.6));
  // kokpit
  c.fillStyle = P.glass; c.beginPath(); c.arc(0, -14, 15, Math.PI, TAU); c.fill();
  c.fillStyle = P.hull2; c.beginPath(); c.arc(0, -12, 7, 0, TAU); c.fill();
  c.fillStyle = P.ui; c.fillRect(-5, -15, 10, 4);
  c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(-6, -21, 3.5, 0, TAU); c.fill();
  // anten + ışık
  c.strokeStyle = P.metalD; c.lineWidth = 2; c.beginPath(); c.moveTo(20, -14); c.lineTo(26, -28); c.stroke();
  c.fillStyle = Math.sin(t * 5) > 0 ? P.bad : P.tankD; c.beginPath(); c.arc(26, -29, 2.6, 0, TAU); c.fill();
  // vinç yuvası
  c.fillStyle = P.metalD; c.fillRect(-7, 18, 14, 8);
  c.restore();
};

Art.claw = (c, x, y, ang, open, P) => {
  c.save(); c.translate(x, y); c.rotate(-ang);
  c.fillStyle = P.metalD; c.fillRect(-7, -5, 14, 8);
  c.strokeStyle = P.metal; c.lineWidth = 4; c.lineCap = 'round';
  [-1, 1].forEach(sd => { c.save(); c.rotate(sd * open); c.beginPath(); c.moveTo(sd * 5, 2); c.quadraticCurveTo(sd * 15, 10, sd * 6, 20); c.stroke(); c.restore(); });
  c.fillStyle = P.warn; c.fillRect(-2, -4, 4, 3);
  c.restore();
};

/* ---------- eşyalar ---------- */
function poly(c, pts) { c.beginPath(); pts.forEach(([a, b], i) => i ? c.lineTo(a, b) : c.moveTo(a, b)); c.closePath(); }
function nut(c, x, y, r, P) {
  c.fillStyle = P.metal; c.beginPath();
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
  c.closePath(); c.fill(); c.fillStyle = P.metalD; c.beginPath(); c.arc(x, y, r * .42, 0, TAU); c.fill();
}
function rockShape(c, it, P) {
  c.save(); c.translate(it.x, it.y); c.rotate(it.rot || 0);
  c.fillStyle = P.rockD; c.beginPath();
  (it.poly || [1, .9, 1, .85, 1, .95, .9, 1, .9]).forEach((m, i, a) => { const an = i / a.length * TAU; const px = Math.cos(an) * it.r * m, py = Math.sin(an) * it.r * m; i ? c.lineTo(px, py) : c.moveTo(px, py); });
  c.closePath(); c.fill();
  c.fillStyle = P.rock; c.beginPath();
  (it.poly || [1, .9, 1, .85, 1, .95, .9, 1, .9]).forEach((m, i, a) => { const an = i / a.length * TAU; const px = Math.cos(an) * it.r * m * .9 - 2, py = Math.sin(an) * it.r * m * .9 - 2; i ? c.lineTo(px, py) : c.moveTo(px, py); });
  c.closePath(); c.fill();
  c.fillStyle = P.rockD; [[.3, -.2, .22], [-.35, .25, .16], [.1, .45, .12]].forEach(([a, b, rr]) => { c.beginPath(); c.arc(a * it.r, b * it.r, rr * it.r, 0, TAU); c.fill(); });
  c.restore();
}
function gem(c, x, y, r, col, col2, t, glow = true) {
  if (glow) { c.globalAlpha = .22 + .12 * Math.sin(t * 4); c.fillStyle = col; c.beginPath(); c.arc(x, y, r * 1.7, 0, TAU); c.fill(); c.globalAlpha = 1; }
  c.fillStyle = col2; poly(c, [[x, y - r * 1.3], [x + r, y - r * .3], [x + r * .6, y + r], [x - r * .6, y + r], [x - r, y - r * .3]]); c.fill();
  c.fillStyle = col; poly(c, [[x, y - r * 1.3], [x + r * .55, y - r * .3], [x, y + r * .7], [x - r * .55, y - r * .3]]); c.fill();
  c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(x - r * .35, y - r * .7, r * .25, r * .35);
}

Art.item = (c, it, t, P) => {
  const { x, y, r } = it;
  switch (it.kind) {
    case 'bolts': nut(c, x - 6, y + 3, 7, P); nut(c, x + 6, y + 5, 6.5, P); nut(c, x + 1, y - 5, 6.5, P);
      c.strokeStyle = P.metalL; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x - 10, y - 8); c.lineTo(x - 2, y - 12); c.stroke(); break;
    case 'plate': c.save(); c.translate(x, y); c.rotate(it.rot || 0);
      c.fillStyle = P.metalD; c.fillRect(-r, -r * .62 + 3, r * 2, r * 1.24);
      c.fillStyle = P.metal; c.fillRect(-r, -r * .62, r * 2, r * 1.24);
      c.fillStyle = P.metalD; [[-r + 4, -r * .62 + 4], [r - 6, -r * .62 + 4], [-r + 4, r * .62 - 6], [r - 6, r * .62 - 6]].forEach(([a, b]) => c.fillRect(a, b, 2.5, 2.5));
      c.fillRect(-r + 6, -1, r * 2 - 12, 2); c.restore(); break;
    case 'sat': c.save(); c.translate(x, y); c.rotate(it.rot || 0);
      c.fillStyle = P.crystal; c.globalAlpha = .9;
      [-1, 1].forEach(sd => { c.fillRect(sd > 0 ? 11 : -33, -8, 22, 16); }); c.globalAlpha = 1;
      c.strokeStyle = P.ui; c.lineWidth = 1;
      [-1, 1].forEach(sd => { const x0 = sd > 0 ? 11 : -33; for (let i = 1; i < 3; i++) { c.beginPath(); c.moveTo(x0 + i * 7.3, -8); c.lineTo(x0 + i * 7.3, 8); c.stroke(); } c.beginPath(); c.moveTo(x0, 0); c.lineTo(x0 + 22, 0); c.stroke(); });
      c.fillStyle = P.metal; c.fillRect(-11, -13, 22, 26); c.fillStyle = P.box; c.fillRect(-11, -13, 22, 5);
      c.fillStyle = P.metalD; c.beginPath(); c.arc(0, 18, 7, Math.PI, TAU); c.fill(); c.fillRect(-1, 13, 2, 5);
      c.restore(); break;
    case 'part': c.save(); c.translate(x, y); c.rotate((it.rot || 0) + t * .3);
      c.fillStyle = P.metalD; for (let i = 0; i < 8; i++) { c.save(); c.rotate(i / 8 * TAU); c.fillRect(-3, -r, 6, 6); c.restore(); }
      c.fillStyle = P.metal; c.beginPath(); c.arc(0, 0, r * .72, 0, TAU); c.fill();
      c.fillStyle = P.hull; c.beginPath(); c.arc(0, 0, r * .3, 0, TAU); c.fill(); c.restore(); break;
    case 'rock': case 'boulder': rockShape(c, it, P); break;
    case 'crystal': gem(c, x, y, r, P.crystal, P.crystal2, t + (it.seed || 0)); break;
    case 'box': c.save(); c.translate(x, y); c.rotate((it.rot || 0) * .5);
      c.fillStyle = P.boxD; c.fillRect(-r, -r * .8 + 3, r * 2, r * 1.6);
      c.fillStyle = P.box; c.fillRect(-r, -r * .8, r * 2, r * 1.6);
      c.fillStyle = P.ui; for (let i = -r; i < r; i += 8) { c.beginPath(); c.moveTo(i, -r * .8); c.lineTo(i + 4, -r * .8); c.lineTo(i + 1, -r * .8 + 5); c.lineTo(i - 3, -r * .8 + 5); c.fill(); }
      c.fillStyle = P.ui; c.font = `bold ${r * 1.1}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', 0, 3);
      c.restore();
      // radar etiketi: küçük ekranda yazı ~11 CSS px altına inmesin (kutu yazıyla birlikte büyür)
      if (it.radar) { const k = SS.Stage && SS.Stage.textPx ? SS.Stage.textPx(10) / 10 : 1; c.save(); c.globalAlpha = .9; c.fillStyle = P.ui; c.fillRect(x - 13 * k, y - r - 6 - 16 * k, 26 * k, 16 * k); c.fillStyle = P.accent; c.font = `bold ${10 * k}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(it.radar, x, y - r - 6 - 8 * k); c.restore(); }
      break;
    case 'bug': { c.save(); c.translate(x, y); c.scale(it.vx > 0 ? 1 : -1, 1);
      const wig = Math.sin(t * 18 + (it.seed || 0)) * 3;
      c.strokeStyle = P.bugD; c.lineWidth = 2;
      for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * 5, 2); c.lineTo(i * 6 + wig * (i % 2 ? 1 : -1), 11); c.stroke(); c.beginPath(); c.moveTo(i * 5, -2); c.lineTo(i * 6 - wig, -11); c.stroke(); }
      c.fillStyle = P.bug; c.beginPath(); c.ellipse(0, 0, r, r * .7, 0, 0, TAU); c.fill();
      c.fillStyle = P.bugD; c.fillRect(-1, -r * .7, 2, r * 1.4);
      c.fillStyle = P.metalL; c.beginPath(); c.arc(r * .8, -3, 3, 0, TAU); c.arc(r * .8, 3, 3, 0, TAU); c.fill();
      c.fillStyle = P.ui; c.fillRect(r * .8, -4, 1.6, 1.6); c.fillRect(r * .8, 2, 1.6, 1.6);
      c.restore(); break; }
    case 'slime': { c.save(); c.translate(x, y);
      const sq = 1 + Math.sin(t * 5 + (it.seed || 0)) * .08;
      c.fillStyle = P.slimeD; c.beginPath(); c.ellipse(0, 4, r * 1.1 / sq, r * .8 * sq, 0, 0, TAU); c.fill();
      c.fillStyle = P.slime; c.beginPath(); c.ellipse(0, 2, r / sq, r * .72 * sq, 0, 0, TAU); c.fill();
      c.fillStyle = P.metalL; c.beginPath(); c.arc(-5, 2, 3, 0, TAU); c.arc(5, 2, 3, 0, TAU); c.fill();
      c.fillStyle = P.ui; const lk = it.vx > 0 ? 1 : -1; c.fillRect(-5 + lk, 1, 2, 2); c.fillRect(5 + lk, 1, 2, 2);
      gem(c, 0, -r * .75, 6, P.crystal, P.crystal2, t, false);
      c.restore(); break; }
    case 'tank': { c.save(); c.translate(x, y); c.rotate((it.rot || 0) * .5);
      c.fillStyle = P.tankD; c.fillRect(-r * .75, -r + 3, r * 1.5, r * 2);
      c.fillStyle = P.tank; c.fillRect(-r * .75, -r, r * 1.5, r * 2);
      c.fillStyle = P.warn; c.fillRect(-r * .75, -3, r * 1.5, 6);
      c.fillStyle = P.ui; for (let i = -r * .75; i < r * .75; i += 6) c.fillRect(i, -3, 3, 6);
      c.fillStyle = P.metalD; c.fillRect(-4, -r - 5, 8, 5);
      const on = Math.sin(t * 7 + (it.seed || 0)) > 0; c.fillStyle = on ? P.warn : P.tankD; c.beginPath(); c.arc(0, -r - 6, 2.8, 0, TAU); c.fill();
      c.restore(); break; }
    case 'relic': { const hue = (SS.RELICS[it.relic] || {}).hue || P.accent;
      c.globalAlpha = .25 + .15 * Math.sin(t * 3); c.fillStyle = P.accent; c.beginPath(); c.arc(x, y, r * 1.8, 0, TAU); c.fill(); c.globalAlpha = 1;
      c.fillStyle = P.boxD; c.fillRect(x - r, y + r * .4, r * 2, r * .6);
      c.fillStyle = hue; c.beginPath(); c.moveTo(x - r * .7, y + r * .45); c.quadraticCurveTo(x - r, y - r * .6, x, y - r * 1.1); c.quadraticCurveTo(x + r, y - r * .6, x + r * .7, y + r * .45); c.fill();
      c.fillStyle = P.ui; c.fillRect(x - 3, y - 4, 2, 2); c.fillRect(x + 1, y - 4, 2, 2);
      break; }
    case 'debris': c.fillStyle = P.metalD; poly(c, [[x - 7, y - 3], [x + 2, y - 7], [x + 8, y + 2], [x - 2, y + 7]]); c.fill(); break;
  }
};

/* ---------- ikonlar ve portreler ---------- */
Art.icon = (c, kind, W, H, P, arg) => {
  const cx = W / 2, cy = H / 2, s = Math.min(W, H) / 44;
  c.save();
  if (SS.ITEMS[kind]) {
    const T = SS.ITEMS[kind];
    const fit = Math.min(1.4, 17 / T.r);
    c.translate(cx, cy); c.scale(s * fit, s * fit);
    Art.item(c, { kind, x: 0, y: 0, r: T.r, rot: 0, vx: 1, relic: arg, poly: [1, .86, 1, .9, .95, 1, .88, 1, .92] }, 0, P);
    c.restore(); return;
  }
  c.translate(cx, cy); c.scale(s, s);
  if (['food', 'plant', 'battery', 'goo'].includes(kind)) { Art.sortThing(c, { kind, x: 0, y: 0 }, 0, P); c.restore(); return; }
  switch (kind) {
    case 'ship': Art.ship(c, 0, 4, .42, 0, P, { tier: +arg || 0 }); break;
    case 'claw': case 'magnet': Art.claw(c, 0, -6, 0, kind === 'magnet' ? .2 : .55, P);
      if (kind === 'magnet') { c.strokeStyle = P.crystal; c.lineWidth = 2; c.beginPath(); c.arc(0, 4, 14, .3, Math.PI - .3); c.stroke(); c.beginPath(); c.arc(0, 4, 19, .5, Math.PI - .5); c.stroke(); } break;
    case 'winch': c.strokeStyle = P.hull; c.lineWidth = 5; c.beginPath(); c.arc(0, 0, 12, 0, TAU); c.stroke(); c.strokeStyle = P.metal; c.lineWidth = 3; c.beginPath(); c.moveTo(-12, 0); c.lineTo(12, 0); c.moveTo(0, -12); c.lineTo(0, 12); c.stroke(); c.strokeStyle = P.rope; c.lineWidth = 2; c.beginPath(); c.moveTo(12, 0); c.lineTo(14, 18); c.stroke(); break;
    case 'radar': c.strokeStyle = P.good; c.lineWidth = 2; [6, 11, 16].forEach(r => { c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); }); c.fillStyle = P.good; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 16, -1.2, -.4); c.fill(); c.fillStyle = P.accent; c.fillRect(6, 4, 4, 4); break;
    case 'cargo': c.fillStyle = P.boxD; c.fillRect(-16, -8, 32, 22); c.fillStyle = P.box; c.fillRect(-16, -12, 32, 20); c.fillStyle = P.ui; c.fillRect(-2, -12, 4, 20); break;
    case 'tank': c.fillStyle = P.metal; c.fillRect(-10, -16, 20, 32); c.fillStyle = P.good; c.fillRect(-7, -2, 14, 15); c.fillStyle = P.metalD; c.fillRect(-4, -20, 8, 5); break;
    case 'hull': c.fillStyle = P.metal; c.beginPath(); c.moveTo(0, -17); c.lineTo(15, -10); c.lineTo(13, 6); c.lineTo(0, 17); c.lineTo(-13, 6); c.lineTo(-15, -10); c.closePath(); c.fill(); c.fillStyle = P.hull; c.fillRect(-2, -10, 4, 20); c.fillRect(-9, -2, 18, 4); break;
    case 'torp': c.rotate(-.5); c.fillStyle = P.metal; c.beginPath(); c.moveTo(-16, -5); c.lineTo(9, -5); c.quadraticCurveTo(18, 0, 9, 5); c.lineTo(-16, 5); c.closePath(); c.fill(); c.fillStyle = P.bad; c.fillRect(-6, -5, 4, 10); c.fillStyle = P.metalD; c.beginPath(); c.moveTo(-16, -5); c.lineTo(-21, -10); c.lineTo(-21, 10); c.lineTo(-16, 5); c.fill(); break;
    case 'fuel': c.fillStyle = P.bad; c.fillRect(-11, -12, 22, 28); c.fillStyle = P.metalL; c.fillRect(-11, -16, 10, 5); c.fillStyle = P.warn; c.beginPath(); c.moveTo(0, -4); c.quadraticCurveTo(7, 4, 0, 10); c.quadraticCurveTo(-7, 4, 0, -4); c.fill(); break;
    case 'ration': c.fillStyle = P.box; c.fillRect(-16, -6, 32, 12); c.fillStyle = P.boxD; c.fillRect(-16, -6, 6, 12); c.fillRect(10, -6, 6, 12); break;
    case 'meal': c.fillStyle = P.metal; c.beginPath(); c.ellipse(0, 4, 17, 8, 0, 0, TAU); c.fill(); c.fillStyle = P.hull; c.beginPath(); c.ellipse(0, 1, 12, 5, 0, 0, TAU); c.fill(); c.fillStyle = P.bug; c.fillRect(-4, -2, 5, 3); c.strokeStyle = P.metalL; c.lineWidth = 1.5; [-5, 0, 5].forEach(x => { c.beginPath(); c.moveTo(x, -6); c.quadraticCurveTo(x + 3, -11, x, -16); c.stroke(); }); break;
    case 'special': c.fillStyle = P.metalD; c.fillRect(-15, -2, 30, 14); c.fillStyle = P.slime; c.beginPath(); c.ellipse(0, -2, 15, 5, 0, 0, TAU); c.fill(); c.fillStyle = P.accent; c.beginPath(); c.arc(-4, -3, 2.5, 0, TAU); c.arc(5, -2, 2, 0, TAU); c.fill(); c.strokeStyle = P.metalL; c.lineWidth = 1.5; [-6, 2, 9].forEach(x => { c.beginPath(); c.moveTo(x, -9); c.quadraticCurveTo(x + 3, -14, x, -19); c.stroke(); }); break;
    case 'pilot': c.fillStyle = P.metal; c.beginPath(); c.arc(0, 0, 15, 0, TAU); c.fill(); c.fillStyle = P.ui; c.beginPath(); c.arc(0, 0, 11, 0, TAU); c.fill(); c.strokeStyle = P.accent; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 11, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); c.fillStyle = P.metal; c.fillRect(-2, -2, 4, 14); break;
    case 'eng': c.rotate(.7); c.fillStyle = P.metal; c.fillRect(-3, -6, 6, 22); c.beginPath(); c.arc(0, -10, 8, 0, TAU); c.fill(); c.fillStyle = P.ui; c.fillRect(-3, -18, 6, 9); break;
    case 'trade': c.fillStyle = P.accent; c.beginPath(); c.arc(-5, 3, 9, 0, TAU); c.fill(); c.fillStyle = P.box; c.beginPath(); c.arc(6, -4, 9, 0, TAU); c.fill(); c.fillStyle = P.ui; c.font = 'bold 11px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('₡', 6, -3); break;
    case 'fit': c.fillStyle = P.metalD; c.fillRect(-14, -2, 28, 4); c.fillStyle = P.hull; c.fillRect(-17, -8, 6, 16); c.fillRect(11, -8, 6, 16); c.fillStyle = P.hullD; c.fillRect(-20, -5, 3, 10); c.fillRect(17, -5, 3, 10); break;
    case 'home0': case 'home1': case 'home2': { const lv = +kind[4];
      c.fillStyle = P.metalD; c.fillRect(-16 - lv * 2, -6 - lv * 3, 32 + lv * 4, 22 + lv * 3);
      c.fillStyle = P.metal; c.fillRect(-14 - lv * 2, -4 - lv * 3, 28 + lv * 4, 18 + lv * 3);
      c.fillStyle = P.glass; for (let i = 0; i <= lv; i++) c.fillRect(-10 - lv * 2 + i * 10, -lv * 3, 7, 6);
      c.fillStyle = P.hull; c.fillRect(-4 + lv * 4, 6, 7, 8); break; }
    case 'garden': c.fillStyle = P.metalD; c.fillRect(-16, 4, 32, 10); c.fillStyle = P.bug; [-10, 0, 10].forEach(x => { c.beginPath(); c.ellipse(x, -2, 4, 8, 0, 0, TAU); c.fill(); }); c.fillStyle = P.bad; c.beginPath(); c.arc(0, -8, 3, 0, TAU); c.fill(); break;
    case 'workshop': c.fillStyle = P.metal; c.fillRect(-16, 2, 32, 6); c.fillRect(-12, 8, 4, 8); c.fillRect(8, 8, 4, 8); c.save(); c.translate(0, -6); c.scale(.6, .6); c.rotate(.7); c.fillStyle = P.metal; c.fillRect(-3, -6, 6, 22); c.beginPath(); c.arc(0, -10, 8, 0, TAU); c.fill(); c.fillStyle = P.ui; c.fillRect(-3, -18, 6, 9); c.restore(); break;
    case 'drone': c.fillStyle = P.metal; c.fillRect(-8, -4, 16, 8); c.strokeStyle = P.metalD; c.lineWidth = 2; c.beginPath(); c.moveTo(-8, -2); c.lineTo(-15, -8); c.moveTo(8, -2); c.lineTo(15, -8); c.stroke(); c.fillStyle = P.crystal; c.fillRect(-20, -10, 10, 2); c.fillRect(10, -10, 10, 2); c.fillStyle = P.bad; c.beginPath(); c.arc(0, 0, 2, 0, TAU); c.fill(); c.strokeStyle = P.rope; c.beginPath(); c.moveTo(0, 4); c.lineTo(0, 14); c.stroke(); break;
    case 'shop': c.fillStyle = P.metalD; c.fillRect(-16, -4, 32, 20); c.fillStyle = P.hull; for (let i = 0; i < 4; i++) c.fillRect(-16 + i * 8, -12, 8, 8); c.fillStyle = P.hull2; for (let i = 0; i < 4; i += 2) c.fillRect(-16 + i * 8, -12, 8, 8); c.fillStyle = P.glass; c.fillRect(-12, 0, 12, 10); c.fillStyle = P.box; c.fillRect(4, 2, 8, 14); break;
    case 'clinic': c.fillStyle = P.metalL; c.fillRect(-14, -14, 28, 28); c.fillStyle = P.bad; c.fillRect(-3, -10, 6, 20); c.fillRect(-10, -3, 20, 6); break;
    case 'cards': c.rotate(-.2); c.fillStyle = P.metalL; c.fillRect(-14, -12, 16, 22); c.rotate(.4); c.fillRect(-2, -14, 16, 22); c.fillStyle = P.bad; c.font = 'bold 12px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('♥', 6, -3); break;
    case 'deliver': c.fillStyle = P.box; c.fillRect(-12, -2, 24, 16); c.fillStyle = P.boxD; c.fillRect(-12, -2, 24, 3); Art.ship(c, 0, -10, .25, 0, P); break;
    case 'repair': c.fillStyle = P.ui; c.fillRect(-16, -16, 32, 32); c.strokeStyle = P.good; c.lineWidth = 3; c.beginPath(); c.moveTo(-16, -6); c.lineTo(-4, -6); c.lineTo(-4, 6); c.lineTo(16, 6); c.stroke(); c.fillStyle = P.accent; c.beginPath(); c.arc(-4, -6, 3, 0, TAU); c.arc(-4, 6, 3, 0, TAU); c.fill(); break;
    case 'sort': c.fillStyle = P.metal; c.fillRect(-18, 4, 10, 12); c.fillStyle = P.bug; c.fillRect(-5, 4, 10, 12); c.fillStyle = P.bad; c.fillRect(8, 4, 10, 12); c.fillStyle = P.metalL; c.fillRect(-4, -14, 8, 8); c.strokeStyle = P.rope; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, -5); c.lineTo(0, 1); c.stroke(); break;
    case 'scrap': Art.claw(c, 0, -8, 0, .5, P); c.strokeStyle = P.rope; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -20); c.lineTo(0, -10); c.stroke(); gem(c, 0, 14, 6, P.crystal, P.crystal2, 0, false); break;
    case 'fragment': c.fillStyle = P.ui; c.fillRect(-12, -14, 24, 28); c.fillStyle = P.box; c.fillRect(-12, -14, 24, 5); c.strokeStyle = P.accent; c.lineWidth = 1.5; c.beginPath(); for (let i = -10; i <= 10; i += 3) c.lineTo(i, 4 + Math.sin(i * 1.3) * (6 - Math.abs(i) * .4)); c.stroke(); break;
    case 'lock': c.strokeStyle = P.metal; c.lineWidth = 3; c.beginPath(); c.arc(0, -4, 7, Math.PI, TAU); c.stroke(); c.fillStyle = P.metal; c.fillRect(-10, -4, 20, 16); c.fillStyle = P.ui; c.fillRect(-1.5, 1, 3, 6); break;
    case 'npc': Art.portrait(c, arg, P); break;
  }
  c.restore();
};

Art.portrait = (c, who, P) => {
  c.fillStyle = P.ui; c.fillRect(-22, -22, 44, 44);
  switch (who) {
    case 'gus':
      c.fillStyle = P.slime; c.beginPath(); c.ellipse(0, 2, 13, 15, 0, 0, TAU); c.fill();
      c.strokeStyle = P.slime; c.lineWidth = 4; c.lineCap = 'round';[[-12, 6, -20, -2], [12, 6, 20, -2], [-11, 12, -20, 16], [11, 12, 20, 16]].forEach(([a, b, d, e]) => { c.beginPath(); c.moveTo(a, b); c.lineTo(d, e); c.stroke(); });
      c.fillStyle = P.metalL; c.beginPath(); c.arc(0, -4, 6, 0, TAU); c.fill(); c.fillStyle = P.ui; c.beginPath(); c.arc(1, -4, 3, 0, TAU); c.fill();
      c.fillStyle = P.metalL; c.fillRect(-6, 7, 12, 2); c.fillStyle = P.hull2; c.fillRect(-14, 14, 28, 8); break;
    case 'vida':
      c.fillStyle = P.metal; c.fillRect(-12, -14, 24, 22); c.fillStyle = P.metalD; c.fillRect(-12, 8, 24, 14);
      c.fillStyle = P.good; c.fillRect(-8, -8, 6, 5); c.fillRect(2, -8, 6, 5); c.fillStyle = P.ui; c.fillRect(-7, 1, 14, 3);
      c.strokeStyle = P.metalD; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -14); c.lineTo(0, -20); c.stroke(); c.fillStyle = P.bad; c.beginPath(); c.arc(0, -20, 2.5, 0, TAU); c.fill(); break;
    case 'zara':
      c.fillStyle = P.hullD; c.beginPath(); c.arc(0, -4, 14, Math.PI, TAU); c.fill(); c.fillRect(-14, -4, 6, 18); c.fillRect(8, -4, 6, 18);
      c.fillStyle = P.hull2; c.beginPath(); c.ellipse(0, 0, 9, 11, 0, 0, TAU); c.fill();
      c.fillStyle = P.box; c.fillRect(-10, -5, 20, 6); c.fillStyle = P.glass; c.fillRect(-8, -4, 6, 4); c.fillRect(2, -4, 6, 4);
      c.fillStyle = P.bad; c.fillRect(-3, 6, 6, 2); c.fillStyle = P.crystal; c.fillRect(-14, 14, 28, 8); break;
    case 'rex':
      c.fillStyle = P.hull2; c.beginPath(); c.ellipse(0, 0, 10, 12, 0, 0, TAU); c.fill();
      c.fillStyle = P.rockD; c.fillRect(-11, -13, 22, 6); c.fillRect(-9, -15, 18, 3);
      c.fillStyle = P.ui; c.fillRect(-7, -3, 6, 5); c.fillRect(-11, -4, 22, 1.5); c.fillStyle = P.metalL; c.fillRect(3, -2, 3, 3);
      c.fillStyle = P.rockD; c.fillRect(-6, 8, 12, 4); c.fillStyle = P.bugD; c.fillRect(-14, 14, 28, 8); break;
    case 'krell':
      c.fillStyle = P.bug; c.beginPath(); c.ellipse(0, 2, 11, 13, 0, 0, TAU); c.fill();
      c.fillStyle = P.ui; c.fillRect(-14, -14, 28, 4); c.fillRect(-9, -22, 18, 9);
      c.fillStyle = P.warn; c.beginPath(); c.arc(-4, 0, 2.5, 0, TAU); c.arc(4, 0, 2.5, 0, TAU); c.fill();
      c.strokeStyle = P.metalL; c.lineWidth = 1.5; c.beginPath(); c.arc(0, 6, 5, .2, Math.PI - .2); c.stroke();
      c.fillStyle = P.tankD; c.fillRect(-14, 14, 28, 8); break;
    case 'pit': // robot kedi
      c.fillStyle = P.metal; c.beginPath(); c.moveTo(-13, -6); c.lineTo(-10, -18); c.lineTo(-3, -9); c.lineTo(3, -9); c.lineTo(10, -18); c.lineTo(13, -6); c.closePath(); c.fill();
      c.beginPath(); c.ellipse(0, 0, 14, 12, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = P.ui; c.fillRect(-10, -5, 20, 9);
      c.fillStyle = P.crystal; c.fillRect(-7, -3, 4, 4); c.fillRect(3, -3, 4, 4);
      c.fillStyle = P.crystal2; c.fillRect(-1, 5, 2, 2);
      c.strokeStyle = P.metalD; c.lineWidth = 1.2; [[-14, 5, -21, 3], [-14, 7, -21, 9], [14, 5, 21, 3], [14, 7, 21, 9]].forEach(([a, b, d, e]) => { c.beginPath(); c.moveTo(a, b); c.lineTo(d, e); c.stroke(); });
      c.fillStyle = P.metalD; c.fillRect(-12, 13, 24, 9); c.fillStyle = P.warn; c.fillRect(-3, 14, 6, 3); break;
    case 'ela': // küçük kardeş
      c.fillStyle = P.rockD; c.beginPath(); c.arc(0, -3, 13, Math.PI * .9, Math.PI * 2.1); c.fill();
      c.fillRect(-14, -3, 5, 10); c.fillRect(9, -3, 5, 10);
      c.fillStyle = P.hull2; c.beginPath(); c.ellipse(0, 1, 9, 10, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = P.rockD; c.fillRect(-9, -9, 18, 5);
      c.fillStyle = P.ui; c.fillRect(-5, 0, 2.5, 3); c.fillRect(3, 0, 2.5, 3);
      c.fillStyle = P.crystal2; c.fillRect(-8, 4, 3, 2); c.fillRect(5, 4, 3, 2);
      c.fillStyle = P.bad; c.fillRect(-2, 6, 4, 1.6);
      c.fillStyle = P.crystal2; c.beginPath(); c.arc(11, -11, 3.5, 0, Math.PI * 2); c.fill();
      c.fillStyle = P.accent; c.fillRect(-13, 14, 26, 8); break;
    case 'tolga': // eski dost
      c.fillStyle = P.hull2; c.beginPath(); c.ellipse(0, 1, 10, 12, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = P.ui; c.beginPath(); c.arc(0, -6, 11, Math.PI, Math.PI * 2); c.fill(); c.fillRect(-11, -7, 4, 6);
      c.fillStyle = P.box; c.fillRect(-12, -10, 24, 3);
      c.fillStyle = P.ui; c.fillRect(-6, -1, 3, 3); c.fillRect(3, -1, 3, 3);
      c.fillStyle = P.rockD; c.fillRect(-7, 6, 14, 5); c.fillStyle = P.hull2; c.fillRect(-4, 7, 8, 2);
      c.fillStyle = P.box; c.fillRect(-15, 14, 30, 8); c.fillStyle = P.metalD; c.fillRect(-2, 14, 4, 8); break;
    default: // kaptan
      c.fillStyle = P.metal; c.beginPath(); c.arc(0, 0, 16, 0, TAU); c.fill();
      c.fillStyle = P.glass; c.beginPath(); c.arc(0, 0, 12, 0, TAU); c.fill();
      c.fillStyle = P.hull2; c.beginPath(); c.arc(0, 2, 8, 0, TAU); c.fill();
      c.fillStyle = P.ui; c.fillRect(-4, 0, 2, 2); c.fillRect(2, 0, 2, 2);
      c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(-9, -8, 4, 4);
      c.fillStyle = P.hull; c.fillRect(-14, 15, 28, 7);
  }
};


/* ---------- ana harita: istasyon ve modüller ---------- */
Art.map = (c, W, H, t, P, locs, cur, stars) => {
  const g = c.createRadialGradient(W * .5, H * .48, 20, W * .5, H * .5, W * .8);
  g.addColorStop(0, P.space1); g.addColorStop(1, P.space0);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (const s of stars) { c.globalAlpha = .4 + .4 * Math.sin(t * 1.5 + s.tw); c.fillStyle = P.star; c.fillRect(s.x, s.y, s.r * 1.4, s.r * 1.4); }
  c.globalAlpha = 1;
  // yörünge halkaları
  const cx = W * .5, cy = H * .48;
  c.strokeStyle = P.metalD; c.lineWidth = 1; c.setLineDash([3, 6]);
  [.22, .36, .5].forEach(r => { c.beginPath(); c.ellipse(cx, cy, W * r, H * r * .62, 0, 0, Math.PI * 2); c.stroke(); });
  c.setLineDash([]);
  // gezegen kenarı
  c.fillStyle = P.slimeD; c.globalAlpha = .55; c.beginPath(); c.arc(W * .08, H * 1.05, W * .3, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
  // bağlantı halatları
  c.strokeStyle = P.metal; c.globalAlpha = .45; c.lineWidth = 2;
  for (const l of locs) { c.beginPath(); c.moveTo(cx, cy); c.lineTo(l.x * W, l.y * H); c.stroke(); }
  c.globalAlpha = 1;
  // merkez gövde
  c.fillStyle = P.metalD; c.beginPath(); c.arc(cx, cy, 22, 0, Math.PI * 2); c.fill();
  c.fillStyle = P.metal; c.beginPath(); c.arc(cx, cy, 15, 0, Math.PI * 2); c.fill();
  c.save(); c.translate(cx, cy); c.rotate(t * .15); c.fillStyle = P.metalD;
  for (let i = 0; i < 4; i++) { c.rotate(Math.PI / 2); c.fillRect(-3, -34, 6, 14); }
  c.restore();
  c.fillStyle = P.accent; c.beginPath(); c.arc(cx, cy, 5, 0, Math.PI * 2); c.fill();
  // modüller
  for (const l of locs) {
    const x = l.x * W, y = l.y * H, on = l.id === cur, open = l.isOpen;
    c.save(); c.translate(x, y);
    if (on) { c.strokeStyle = P.accent; c.lineWidth = 2; c.globalAlpha = .5 + .5 * Math.sin(t * 4); c.beginPath(); c.arc(0, 0, 30, 0, Math.PI * 2); c.stroke(); c.globalAlpha = 1; }
    c.globalAlpha = open ? 1 : .45;
    Art.module(c, l.id, P, t);
    c.restore(); c.globalAlpha = 1;
  }
};
// Her konumun kendi silueti
Art.module = (c, id, P, t) => {
  const box = (w, h, col) => { c.fillStyle = col; c.fillRect(-w / 2, -h / 2, w, h); };
  switch (id) {
    case 'home': box(30, 20, P.hull); c.fillStyle = P.glass; c.fillRect(-10, -5, 6, 6); c.fillRect(4, -5, 6, 6); c.fillStyle = P.hullD; c.beginPath(); c.moveTo(-18, -10); c.lineTo(0, -20); c.lineTo(18, -10); c.fill(); break;
    case 'jobs': box(34, 22, P.metal); c.fillStyle = P.ui; c.fillRect(-12, -6, 24, 10); c.fillStyle = P.good; c.fillRect(-10, -4, 8, 2); c.fillRect(-10, 0, 14, 2); c.fillStyle = P.metalD; c.fillRect(-2, -18, 4, 8); break;
    case 'hangar': c.fillStyle = P.metalD; c.beginPath(); c.moveTo(-22, 12); c.lineTo(-22, -4); c.quadraticCurveTo(0, -20, 22, -4); c.lineTo(22, 12); c.fill(); c.fillStyle = P.ui; c.fillRect(-14, -2, 28, 14); c.fillStyle = P.warn; for (let i = -14; i < 14; i += 6) c.fillRect(i, 10, 3, 2); break;
    case 'market': c.strokeStyle = P.box; c.lineWidth = 5; c.beginPath(); c.arc(0, 0, 14, 0, Math.PI * 2); c.stroke(); c.fillStyle = P.box; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + t * .3; c.fillRect(Math.cos(a) * 14 - 3, Math.sin(a) * 14 - 3, 6, 6); } break;
    case 'cantina': box(28, 18, P.slime); c.fillStyle = P.accent; c.fillRect(-14, -12, 28, 4); c.fillStyle = P.glass; c.beginPath(); c.arc(0, 2, 5, 0, Math.PI * 2); c.fill(); break;
    case 'clinic': box(26, 22, P.metalL); c.fillStyle = P.bad; c.fillRect(-3, -8, 6, 16); c.fillRect(-8, -3, 16, 6); break;
    case 'krell': c.fillStyle = P.tankD; c.beginPath(); c.moveTo(0, -18); c.lineTo(16, 12); c.lineTo(-16, 12); c.closePath(); c.fill(); c.fillStyle = P.warn; c.beginPath(); c.arc(0, 2, 4, 0, Math.PI * 2); c.fill(); break;
  }
};
})(window.SS);

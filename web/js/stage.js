// Space Scrapper — mini oyun sahnesi: tam ekran katman, canvas ölçekleme, döngü, kontroller
(function(SS){
const Stage = SS.Stage = {};
let cur = null, raf = 0, last = 0, paused = false;
// Fare/dokunmatik yüzey: klavye ipuçları yalnızca hassas işaretçide (masaüstü) gösterilir
SS.finePointer = () => { try { return matchMedia('(pointer:fine)').matches; } catch (e) { return true; } };

Stage.open = game => {
  Stage.close(true);
  cur = game; game.input = {}; game.t = 0; game.done = false; paused = false;
  const el = document.createElement('div');
  el.className = 'mini'; el.id = 'mini';
  el.innerHTML = `<div class="mini-top">
      <div class="mini-title">${game.title}</div>
      <div class="mini-hud" id="miniHud"></div>
      <button class="btn ghost sm" id="miniQuit">${game.quitLabel || 'Bitir'}</button>
    </div>
    ${(game.helpers || []).length ? `<div class="mini-help">${game.helpers.map(h => `<span>${h}</span>`).join('')}</div>` : ''}
    <div class="mini-stage" id="miniStage"><div class="mini-wrap" id="miniWrap"><canvas id="miniCanvas"></canvas><canvas id="miniText" aria-hidden="true"></canvas></div></div>
    <div class="mini-ctl" id="miniCtl">${(game.controls || []).map(c =>
      `<button class="btn ${c.cls || ''}${c.color ? ' tint' : ''}" data-ctl="${c.id}" ${c.hold ? 'data-hold="1"' : ''}${c.color ? ` style="--ctl-c:${c.color}"` : ''}>${c.label}</button>`).join('')}</div>
    <div class="mini-ask" id="miniAsk" role="dialog" aria-modal="true" aria-labelledby="miniAskT" hidden><div class="mini-ask-box">
      <h2 id="miniAskT">Oyun duraklatıldı</h2>
      <div class="mini-ask-row"><button class="btn ghost danger-t" id="miniQuitYes">Çık</button><button class="btn primary" id="miniQuitNo">Devam</button></div>
    </div></div>`;
  document.body.appendChild(el);
  document.body.classList.add('in-mini');
  const cv = el.querySelector('#miniCanvas'), tc = el.querySelector('#miniText'), wrap = el.querySelector('#miniWrap');
  game.canvas = cv;
  const fit = () => {
    const st = el.querySelector('#miniStage'), bw = st.clientWidth, bh = st.clientHeight;
    // Oyun alanı ekranın en-boy oranına genişler, içerik ortalanır; kenarlar yıldızlı uzayla dolar (siyah boşluk kalmaz)
    if (game.fill !== false && bw > 0 && bh > 0) {
      const baseW = game.baseW || (game.baseW = game.W), baseH = game.baseH || (game.baseH = game.H);
      if (bw / bh < baseW / baseH) { game.W = baseW; game.H = Math.min(Math.round(baseW * bh / bw), Math.round(baseH * 1.7)); }
      else { game.H = baseH; game.W = Math.min(Math.round(baseH * bw / bh), Math.round(baseW * 1.6)); }
      game.dx = Math.round((game.W - baseW) / 2); game.dy = Math.round((game.H - baseH) / 2); game._padN = 0;
    }
    const s = Math.min(bw / game.W, bh / game.H);
    game._scale = s > 0 ? s : 1; game._refit = true;
    wrap.style.width = Math.floor(game.W * s) + 'px'; wrap.style.height = Math.floor(game.H * s) + 'px';
    const r = SS.Art.setup(cv, game.W, game.H, .5);
    game.ctx = r.ctx; game.pixel = r.pixel;
    // yazı katmanı her stilde tam çözünürlükte kalır, piksel modda da okunur
    const d = Math.min(2, window.devicePixelRatio || 1);
    tc.width = game.W * d; tc.height = game.H * d;
    game.tctx = tc.getContext('2d'); game.tctx.setTransform(d, 0, 0, d, 0, 0);
  };
  game._fit = fit; fit();
  window.addEventListener('resize', fit);
  const toLocal = e => { const b = cv.getBoundingClientRect(); return { x: (e.clientX - b.left) / b.width * game.W - (game.dx || 0), y: (e.clientY - b.top) / b.height * game.H - (game.dy || 0) }; };
  cv.addEventListener('pointerdown', e => { e.preventDefault(); const p = toLocal(e); game.pointer && game.pointer(p.x, p.y, 'down'); });
  el.querySelectorAll('[data-ctl]').forEach(b => {
    const id = b.dataset.ctl;
    if (b.dataset.hold) {
      const on = e => { e.preventDefault(); game.input[id] = true; b.classList.add('held'); };
      const off = e => { e.preventDefault(); game.input[id] = false; b.classList.remove('held'); };
      b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
    } else {
      // Dokunuşta beklemeden tepki: eylem pointerdown'da çalışır, ardından gelen click yok sayılır.
      // Klavye (Enter / Boşluk) yalnızca click üretir, o yol olduğu gibi çalışır.
      let downAt = -1e9;
      b.addEventListener('pointerdown', e => {
        if (e.button !== 0 || b.disabled || paused) return;
        downAt = performance.now(); game.action && game.action(id);
      });
      b.addEventListener('click', e => {
        e.preventDefault();
        if (performance.now() - downAt < 1000) { downAt = -1e9; return; }
        if (!paused) game.action && game.action(id);
      });
    }
  });
  el.querySelector('#miniQuit').onclick = () => Stage.askQuit();
  el.querySelector('#miniQuitYes').onclick = () => { const g = cur; Stage.resume(); if (g && !g.done) g.finish('quit'); };
  el.querySelector('#miniQuitNo').onclick = () => Stage.resume();
  game.init && game.init();
  last = performance.now();
  raf = requestAnimationFrame(loop);
};
Stage.setCtl = (id, label, disabled) => {
  const b = document.querySelector(`#miniCtl [data-ctl="${id}"]`);
  if (b) { if (label != null) b.innerHTML = label; b.disabled = !!disabled; }
};
Stage.hud = html => { const h = document.getElementById('miniHud'); if (h && h._last !== html) { h.innerHTML = html; h._last = html; } };

// Kenar dolgusu: oyun alanının en dış satır/sütun piksellerini boşluğa doğru uzatır (gökyüzü yukarı, zemin aşağı devam eder)
function padEdges(g) {
  try {
    const c = g.ctx, cv = g.canvas, k = cv.width / g.W, bw = g.baseW, bh = g.baseH, dx = g.dx || 0, dy = g.dy || 0;
    c.save(); c.imageSmoothingEnabled = false;
    if (dy) {
      c.drawImage(cv, dx * k, dy * k, bw * k, 1, dx, 0, bw, dy);
      c.drawImage(cv, dx * k, (dy + bh) * k - 1, bw * k, 1, dx, dy + bh, bw, g.H - dy - bh);
    }
    if (dx) {
      c.drawImage(cv, dx * k, 0, 1, g.H * k, 0, 0, dx, g.H);
      c.drawImage(cv, (dx + bw) * k - 1, 0, 1, g.H * k, dx + bw, 0, g.W - dx - bw, g.H);
    }
    c.restore();
  } catch (e) {}
}
function loop(now) {
  if (!cur) return;
  // Çıkış sorusu açıkken oyun donar: son kare ekranda kalır, süre işlemez
  // (ekran boyutu değişirse donmuş kare yeni boyutta bir kez yeniden çizilir)
  if (paused && !cur._refit) { last = now; raf = requestAnimationFrame(loop); return; }
  const dt = Math.min(.05, (now - last) / 1000) * (SS.miniSpeed ? SS.miniSpeed() : 1); last = now;
  const g = cur; g._refit = false;
  if (!g.done && !paused) { g.t += dt; g.update(dt, dt * 60); }
  if (cur !== g) return;
  g.ctx.save();
  if (g.dx || g.dy) {
    // Kenar alanı yalnızca ilk karede boyanır; oyun kendi alanına kırpılı çizdiği için kenarlar arada korunur
    if (!g._padN) { g.ctx.fillStyle = SS.Art.P().space0; g.ctx.fillRect(0, 0, g.W, g.H); }
    g.ctx.translate(g.dx || 0, g.dy || 0);
    g.ctx.beginPath(); g.ctx.rect(0, 0, g.baseW, g.baseH); g.ctx.clip();
  }
  g.draw(g.ctx, SS.Art.P(), g.t); g.ctx.restore();
  // Kenar dolgusu 6 karede bir yenilenir (her karede ~1 ms tutuyordu)
  // Oyun kenarda hareketli bir şey varsa (ör. kanca) o karede kopyalamaz; yoksa kenar şeridinde dikdörtgen leke kalıyordu
  if ((g.dx || g.dy) && (g._padN = (g._padN || 0) + 1) % 6 === 1 && !(g.edgeBusy && g.edgeBusy())) padEdges(g);
  SS.Art.post(g.canvas, g.ctx, g.pixel);
  g.tctx.clearRect(0, 0, g.W, g.H);
  if (g.drawUI) { g.tctx.save(); if (g.dx || g.dy) g.tctx.translate(g.dx || 0, g.dy || 0); g.drawUI(g.tctx, SS.Art.P(), g.t); g.tctx.restore(); }
  if (g.done) {
    const res = g.result; Stage.close();
    g.onEnd && g.onEnd(res);
    return;
  }
  raf = requestAnimationFrame(loop);
}
Stage.close = silent => {
  cancelAnimationFrame(raf);
  if (cur && cur._fit) window.removeEventListener('resize', cur._fit);
  cur = null; paused = false;
  const el = document.getElementById('mini'); if (el) el.remove();
  document.body.classList.remove('in-mini');
};
Stage.key = (e, down) => {
  if (cur && paused) {
    // Soru açıkken: Esc devam ettirir, Tab iki düğme arasında döner, Enter/Boşluk odaktaki düğmeye gider
    if (!down) return false;
    if (e.key === 'Escape') { Stage.resume(); return true; }
    if (e.key === 'Tab') {
      const f = [document.getElementById('miniQuitYes'), document.getElementById('miniQuitNo')].filter(Boolean);
      const i = f.indexOf(document.activeElement); (f[(i + (e.shiftKey ? f.length - 1 : 1)) % f.length] || f[0]).focus(); return true;
    }
    return false;
  }
  if (!cur || cur.done || !cur.key) return false;
  return cur.key(e.key, down) !== false;
};
Stage.active = () => !!cur;

// Çıkış onayı: Bitir / Pes et düğmesi ve Android geri tuşu oyunu duraklatıp "Çık / Devam" sorar
Stage.paused = () => paused;
Stage.askQuit = () => {
  if (!cur || cur.done || paused) return false;
  paused = true;
  // basılı tutulan yön / itki düğmeleri bırakılmış sayılır
  cur.input = {}; document.querySelectorAll('#miniCtl .held').forEach(b => b.classList.remove('held'));
  const a = document.getElementById('miniAsk'); if (a) a.hidden = false;
  const no = document.getElementById('miniQuitNo'); if (no) no.focus();
  return true;
};
Stage.resume = () => {
  if (!paused) return;
  paused = false; last = performance.now();
  const a = document.getElementById('miniAsk'); if (a) a.hidden = true;
  const q = document.getElementById('miniQuit'); if (q && cur) q.focus();
};
// Geri tuşu: soru açıksa kapatıp oyuna döner, değilse soruyu açar
Stage.back = () => { if (paused) Stage.resume(); else Stage.askQuit(); };
// Küçük ekranda tuval küçültülür; oyun içi yazı en az ~11 CSS px görünsün diye boyut ölçek oranıyla telafi edilir
// (en çok 1,5 kat: yatay telefonda yazı yerleşimi taşmasın)
Stage.textPx = px => { const s = cur && cur._scale; if (!s || s >= 1) return px; return Math.max(px, Math.min(px * 1.5, 11 / s)); };

// Ortak yardımcı: oyun içi uçan yazılar ve parçacıklar
SS.FX = {
  make() { return { parts: [], texts: [] }; },
  burst(fx, x, y, cols, n = 30, sp = 5) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.3, s = SS.rnd(.5, sp); fx.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: SS.rnd(.4, .9), max: .9, c: SS.pick(cols), sz: SS.rnd(2, 6) }); } },
  text(fx, x, y, txt, col, sub) { fx.texts.push({ x, y, txt, col, sub, life: 1.3 }); },
  step(fx, dt, f) {
    fx.parts.forEach(p => { p.x += p.vx * f; p.y += p.vy * f; p.vx *= .94; p.vy *= .94; p.life -= dt; }); fx.parts = fx.parts.filter(p => p.life > 0);
    fx.texts.forEach(t => { t.y -= .6 * f; t.life -= dt; }); fx.texts = fx.texts.filter(t => t.life > 0);
  },
  draw(fx, c) {
    for (const p of fx.parts) { c.globalAlpha = Math.max(0, p.life / p.max); c.fillStyle = p.c; c.fillRect(p.x - p.sz / 2, p.y - p.sz / 2, p.sz, p.sz); }
    c.globalAlpha = 1;
  },
  drawText(fx, c, P) {
    c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    for (const t of fx.texts) {
      c.globalAlpha = Math.min(1, t.life * 1.6);
      c.font = SS.tfont(22); c.lineWidth = 4; c.lineJoin = 'round'; c.strokeStyle = P.ui; c.strokeText(t.txt, t.x, t.y); c.fillStyle = t.col || P.accent; c.fillText(t.txt, t.x, t.y);
      if (t.sub) { c.font = SS.tfont(13); c.strokeText(t.sub, t.x, t.y + 15); c.fillStyle = P.text; c.fillText(t.sub, t.x, t.y + 15); }
    }
    c.globalAlpha = 1;
  },
};
// Tuval yazı tipleri theme.css'teki belirteçlerden okunur: SS.font() → --display, SS.font('--font-sans') → her stilde Chakra Petch
SS.font = (v = '--display') => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || 'sans-serif';
// Oyun içi yazılar: piksel stilde okunaklı terminal fontu biraz daha büyük kullanılır
SS.tfont = (px, w = 'bold') => { px = Stage.textPx(px); return SS.Art.style() === 'pixel' ? `${Math.round(px * 1.3)}px ${SS.font('--font-term')}` : `${w} ${Math.round(px * 10) / 10}px ${SS.font()}`; };

})(window.SS);

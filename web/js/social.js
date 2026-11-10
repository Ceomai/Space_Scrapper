// Space Scrapper — paylaşım: Günün Avı (herkese aynı tohum), meydan okuma kodu, paylaşım kartı, anı karesi
(function(SS){
const { fmt } = SS;
const TAU = Math.PI * 2;

/* ---------- tohumlu rastgelelik ---------- */
SS.mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const today = SS.todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
SS.dailyNo = () => Math.floor((Date.parse(today()) - Date.parse('2026-01-01')) / 864e5) + 1;
SS.dailySeed = () => SS.dailyNo() * 7919 + 104729;
SS.seedZone = seed => ['belt', 'yard', 'gas'][seed % 3];

/* ---------- günlük kayıt (oyun kaydından bağımsız) ---------- */
const DKEY = 'space-scrapper-daily';
SS.dailyData = () => { try { return JSON.parse(localStorage.getItem(DKEY)) || { days: {}, best: 0 }; } catch (e) { return { days: {}, best: 0 }; } };
const saveDaily = d => { try { localStorage.setItem(DKEY, JSON.stringify(d)); } catch (e) {} };

/* ---------- sonuç ızgarası ---------- */
const EMO = { gold: '🪙', ice: '🧊', jelly: '🪼', egg: '🥚', amber: '🟠', crystal: '💎', slime: '💎', sat: '🛰️', part: '⚙️', plate: '🔩', bolts: '🔩', rock: '🪨', boulder: '🪨', box: '📦', bug: '🐞', debris: '▫️' };
SS.gridOf = got => got.filter(g => g.kind).map(g => EMO[g.kind] || '▫️').join('');

/* ---------- meydan okuma kodu ---------- */
SS.CHALLENGE_URL = 'https://ceomai.github.io/Space_Scrapper/';
SS.challengeCode = (seed, score) => `MO-${seed.toString(36).toUpperCase()}-${score}`;
SS.parseChallenge = str => {
  const m = String(str || '').trim().match(/(?:MO-|meydan-)([0-9a-z]+)-(\d+)/i);
  return m ? { seed: parseInt(m[1], 36), score: +m[2] } : null;
};
SS.pendingChallenge = SS.parseChallenge(location.hash);

/* ---------- bir tur başlat ---------- */
// Ek kipler kendi başlatıcısını SS.HUNT_MODES[mode] olarak kaydeder (ör. fun.js: weekly); yoksa varsayılan tur
SS.HUNT_MODES = {};
SS.startHunt = o => {
  if (o && Object.prototype.hasOwnProperty.call(SS.HUNT_MODES, o.mode)) return SS.HUNT_MODES[o.mode](o);
  const { seed, mode, target } = o;
  const zone = SS.seedZone(seed), no = SS.dailyNo();
  const title = mode === 'daily' ? `Günün Avı #${no}` : mode === 'challenge' ? `Meydan okuma · ${target} puan` : 'Antrenman';
  SS.Games.scrap(zone, res => SS.onHuntEnd({ res, seed, mode, target, zone }), { daily: true, seed, kinds: [], qty: 0, got: 0, title });
};
SS.onHuntEnd = ({ res, seed, mode, target, zone }) => {
  const grid = SS.gridOf(res.got), score = res.score, d = SS.dailyData(), key = today();
  let first = false;
  if (mode === 'daily' && !d.days[key]) { d.days[key] = { score, grid, no: SS.dailyNo() }; first = true; }
  if (mode !== 'practice') d.best = Math.max(d.best || 0, score);
  saveDaily(d);
  SS.lastHunt = { score, grid, seed, mode, target, zone, first };
  if (window.S) SS.save();
  SS.huntResultModal();
};
SS.huntText = h => {
  const head = h.mode === 'daily' ? `Space Scrapper · Günün Avı #${SS.dailyNo()}` : h.mode === 'challenge' ? `Space Scrapper · Meydan okuma` : 'Space Scrapper';
  const vs = h.mode === 'challenge' ? `\n${h.score >= h.target ? 'Geçtim' : 'Geçemedim'}: ${h.target} puanlık meydan okuma` : '';
  return `${head}\n${h.grid || '—'}\nSkor: ${h.score}${vs}\nSen de dene, kodum: ${SS.challengeCode(h.seed, h.score)}\n${SS.CHALLENGE_URL}#meydan-${h.seed.toString(36)}-${h.score}`;
};

/* ---------- paylaşım ---------- */
// Paylaşım stratejisi: bir katman (pwa.js: telefonun paylaşım menüsü) SS.shareVia koyabilir; o da gerekirse SS.shareBasic'e döner
SS.share = o => (SS.shareVia || SS.shareBasic)(o);
SS.shareBasic = async ({ image, text }) => {
  const n = SS.native();
  if (n) { n.post({ type: 'share', image, text }); return; }
  SS.modal(`<p class="eyebrow">Paylaş</p><h2>Kartın hazır</h2>${image ? `<img class="share-img" src="${image}" alt="Paylaşım kartı">` : ''}
    <p class="muted">Görseli uzun basıp kaydedebilir ya da metni kopyalayıp paylaşabilirsin.</p>
    <textarea id="shareText" class="share-text" readonly>${text.replace(/</g, '&lt;')}</textarea>
    <div class="row"><button class="btn primary" data-act="copyShare">Metni kopyala</button><button class="btn ghost" data-act="close">Kapat</button></div>`);
};
SS.copyShare = () => {
  const ta = document.getElementById('shareText'); if (!ta) return;
  const done = () => SS.toast('Metin kopyalandı.', 'good');
  try { navigator.clipboard.writeText(ta.value).then(done, () => { ta.select(); SS.toast('Metin seçildi; kopyalamak için basılı tut.'); }); }
  catch (e) { ta.select(); SS.toast('Metin seçildi; kopyalamak için basılı tut.'); }
};

/* ---------- kart çizimi (1080×1350) ---------- */
const loadImg = src => new Promise(res => { if (!src) return res(null); const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
SS.makeCard = async ({ title, sub, lines = [], big, crew = [], code, highlight }) => {
  const W = 360, H = 450, k = 3, cv = document.createElement('canvas');
  cv.width = W * k; cv.height = H * k;
  const c = cv.getContext('2d'); c.scale(k, k);
  const P = SS.Art.P(), font = (s, w = 700) => `${w} ${s}px ${SS.font('--font-sans')}`;
  // arka plan
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, P.space0); g.addColorStop(1, P.space1); c.fillStyle = g; c.fillRect(0, 0, W, H);
  const neb = c.createRadialGradient(W * .8, H * .2, 0, W * .8, H * .2, W * .7); neb.addColorStop(0, P.neb1); neb.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = neb; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 90; i++) { c.fillStyle = P.star; c.globalAlpha = .3 + (i % 5) * .12; c.fillRect((i * 97) % W, (i * 53) % H, 1.2, 1.2); } c.globalAlpha = 1;
  const pg = c.createLinearGradient(-60, H, 160, H - 200); pg.addColorStop(0, P.slimeD); pg.addColorStop(1, P.slime); c.fillStyle = pg; c.beginPath(); c.arc(-40, H + 40, 170, 0, TAU); c.fill();
  // başlık şeridi
  c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, 0, W, 64);
  c.fillStyle = P.accent; c.fillRect(0, 62, W, 2);
  c.fillStyle = P.text; c.font = font(11, 600); c.textAlign = 'left'; c.fillText('SPACE SCRAPPER', 18, 22);
  c.font = font(20); c.fillText(title, 18, 48);
  if (sub) { c.textAlign = 'right'; c.font = font(11, 600); c.fillStyle = P.accent; c.fillText(sub, W - 18, 22); }
  // anı karesi ya da gemi
  let y = 76;
  const img = await loadImg(highlight && highlight.img);
  if (img) {
    const bw = W - 36, bh = 150, sx = 0, sw = img.width, sh = Math.min(img.height, sw * bh / bw), sy = Math.max(0, img.height * .12);
    c.save(); c.beginPath(); c.rect(18, y, bw, bh); c.clip(); c.drawImage(img, sx, sy, sw, sh, 18, y, bw, bh); c.restore();
    c.strokeStyle = P.accent; c.lineWidth = 2; c.strokeRect(18, y, bw, bh);
    c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(18, y + bh - 22, bw, 22); c.fillStyle = P.text; c.font = font(11, 600); c.textAlign = 'left'; c.fillText(`Anı karesi · ${highlight.text}`, 26, y + bh - 7);
    y += bh + 14;
  } else {
    c.save(); SS.Art.ship(c, W / 2, y + 50, 1.6, 1, P, { tier: window.S ? S.tier : 0, flame: true }); c.restore(); y += 110;
  }
  // büyük sayı
  if (big) { c.textAlign = 'left'; c.fillStyle = P.good; c.font = font(38); c.fillText(big, 18, y + 34); y += 50; }
  // satırlar
  c.font = font(13, 500); c.fillStyle = P.text;
  for (const l of lines.slice(0, 6)) { c.fillText(l, 18, y + 14); y += 22; }
  // hane
  if (crew.length) { let x = 18; y += 6; for (const id of crew) { c.save(); c.translate(x + 18, y + 18); c.scale(.82, .82); SS.Art.portrait(c, id, P); c.restore(); x += 46; } }
  // alt bilgi
  c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(0, H - 40, W, 40);
  c.fillStyle = P.text; c.font = font(11, 600); c.textAlign = 'left'; c.fillText('Sen de dene: Space Scrapper', 18, H - 16);
  if (code) { c.textAlign = 'right'; c.fillStyle = P.accent; c.font = font(12); c.fillText(code, W - 18, H - 16); }
  try { return cv.toDataURL('image/png'); } catch (e) { return null; }
};

/* ---------- hazır kartlar ---------- */
SS.shareHunt = async () => {
  const h = SS.lastHunt; if (!h) return;
  const image = await SS.makeCard({ title: h.mode === 'daily' ? `Günün Avı #${SS.dailyNo()}` : h.mode === 'challenge' ? 'Meydan okuma' : 'Hurda avı', sub: SS.ZONES.find(z => z.id === h.zone).name,
    big: `${h.score} puan`, lines: [h.grid.slice(0, 40) || '—', h.mode === 'challenge' ? `${h.target} puanlık meydan okumayı ${h.score >= h.target ? 'geçtim' : 'geçemedim'}` : 'Aynı alanda beni geçebilir misin?'],
    code: SS.challengeCode(h.seed, h.score), highlight: SS.highlight });
  SS.share({ image, text: SS.huntText(h) });
};
SS.shareDay = async () => {
  if (!window.S) return;
  const L = S.lastDay || { day: S.day - 1, earned: 0 }, rx = SS.rexWeek();
  const lines = [`${SS.rank().name} · ${SS.shipName()}`, `Haftalık yarış: ${fmt(S.weekEarned || 0)} / Rex ${fmt(rx)}`,
    S.loan > 0 ? `Kalan borç: ${fmt(S.loan)}` : 'Borçsuz kaptan!', `Albüm: ${Object.keys(S.album).length}/${Object.keys(SS.RELICS).length} eser`];
  if (S.teaseToday) lines.push(`Bugün: ${S.teaseToday.text.slice(0, 46)}${S.teaseToday.text.length > 46 ? '…' : ''}`);
  const image = await SS.makeCard({ title: `Gün ${L.day} bitti`, sub: S.event ? S.event.title : '', big: `+${fmt(L.earned)}`, lines, crew: SS.crewList(), highlight: SS.highlight });
  const text = `Space Scrapper · Gün ${L.day}\n+${fmt(L.earned)} kazandım · ${SS.rank().name}\nHaftalık yarış: ${fmt(S.weekEarned || 0)} / Rex ${fmt(rx)}\n${SS.CHALLENGE_URL}`;
  SS.share({ image, text });
};
SS.shareWeek = async () => {
  if (!window.S) return;
  const last = S.rexLog[S.rexLog.length - 1];
  const lines = [last ? `${last.week}. hafta: ${fmt(last.mine)} / Rex ${fmt(last.rex)} · ${last.win ? 'kazandım' : 'kaybettim'}` : 'İlk hafta sürüyor',
    `Toplam kazanç: ${fmt(S.stats.earned)}`, `Rex'e karşı ${S.stats.rexWins || 0} galibiyet`, `${S.stats.runs} hurda avı · ${S.stats.deliver} teslimat · ${S.stats.repair} tamir`];
  const image = await SS.makeCard({ title: `${Math.ceil(S.day / 7)}. hafta`, sub: SS.rank().name, big: SS.shipName(), lines, crew: SS.crewList(), highlight: SS.highlight });
  SS.share({ image, text: `Space Scrapper · ${Math.ceil(S.day / 7)}. hafta\n${lines.join('\n')}\n${SS.CHALLENGE_URL}` });
};

})(window.SS);

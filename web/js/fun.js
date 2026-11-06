// Space Scrapper — keyif paketi: acil ilanlar, Haftanın Avı, gemi çıkartmaları, yol arkadaşı görevleri
// (Rex düellosu, tankla alan temizleme, kombo ve sözleşme anı hurda avının içinde: games.js)
(function(SS){
const { fmt, pick, clamp } = SS;
const { btn, esc, face } = SS.ui;
const ACT = SS.ACT;
const render = () => SS.render();
const st = () => (S.stats = S.stats || {});

/* =========================================================
   ACİL İLANLAR: kısa sürede kabul edilirse %60 fazla öder, süresi dolunca kalkar
   ========================================================= */
const _refresh = SS.refreshBoard;
SS.refreshBoard = force => {
  const before = S.board;
  _refresh(force);
  if (S.board === before || S.time > 1230) return;
  const cand = S.board.filter(b => ['deliver', 'repair', 'order'].includes(b.type) && !b.special && !b.hot);
  if (SS.noRush || !cand.length || Math.random() > .45) return;
  const b = pick(cand);
  b.rush = true; b.until = S.time + (b.type === 'order' ? 150 : 100); b.pay = Math.round(b.pay * 1.4);
};
const expire = () => { for (const b of S.board || []) if (b.rush && !b.done && S.time > b.until) { b.done = true; b.expired = true; } };
const _pass = SS.passTime;
SS.passTime = mins => { _pass(mins); expire(); SS.checkDecals && SS.checkDecals(); };
SS.rushTag = b => b.rush && !b.done ? `<span class="tag hot">ACİL +%40 · ${SS.clock(b.until)}'e kadar</span>` : '';
const _job = ACT.job;
ACT.job = d => {
  const b = (S.board || []).find(x => x.id === (d && d.id)), rush = b && b.rush && !b.done;
  if (b && b.rush && !b.done && S.time > b.until) { expire(); SS.toast('Bu acil ilanın süresi doldu.', 'bad'); render(); return; }
  const r = _job(d);
  if (rush && b.done && !b.expired) { st().rush = (st().rush || 0) + 1; SS.checkDecals(); }
  return r;
};

/* =========================================================
   HAFTANIN AVI: haftada bir yeni tohum, 40 saniye, daha çok tank ve zor saha koşulu
   ========================================================= */
SS.weekNo = () => Math.floor((Date.parse(SS.todayKey()) - Date.parse('2026-01-05')) / (7 * 864e5)) + 1;
SS.weeklySeed = () => ((SS.weekNo() * 48271) % 2147483 + 11) | 0;
const _start = SS.startHunt;
SS.startHunt = o => {
  if (o.mode !== 'weekly') return _start(o);
  const zone = ['yard', 'gas', 'pirate'][o.seed % 3];
  SS.Games.scrap(zone, res => weeklyEnd(res, o.seed, zone), { daily: true, weekly: true, seed: o.seed, kinds: [], qty: 0, got: 0, title: `Haftanın Avı #${SS.weekNo()}` });
};
function weeklyEnd(res, seed, zone) {
  const d = SS.dailyData(), wk = SS.weekNo();
  d.weeks = d.weeks || {};
  const prev = d.weeks[wk] && d.weeks[wk].score || 0;
  d.weeks[wk] = { score: Math.max(prev, res.score), grid: res.score >= prev ? SS.gridOf(res.got) : (d.weeks[wk] && d.weeks[wk].grid) };
  try { localStorage.setItem('space-scrapper-daily', JSON.stringify(d)); } catch (e) {}
  if (window.S) { st().weekly = (st().weekly || 0) + 1; SS.checkDecals(); SS.save(); }
  SS.lastHunt = { score: res.score, grid: SS.gridOf(res.got), seed, mode: 'weekly', zone, first: !prev, best: Math.max(prev, res.score) };
  SS.huntResultModal();
}
const _daily = ACT.dailyPanel;
ACT.dailyPanel = () => {
  _daily();
  const d = SS.dailyData(), wk = SS.weekNo(), mine = (d.weeks || {})[wk], box = document.querySelector('#modal .sheet') || document.querySelector('#modal');
  if (!box) return;
  const div = document.createElement('div'); div.className = 'weekly-box';
  div.innerHTML = `<p class="label">Haftanın Avı #${wk}</p><p class="muted">Herkese aynı, daha zor alan: 40 saniye, bol patlayıcı tank, sert saha koşulu. Haftada bir yenilenir; en iyi skorun kalır.</p>
    ${mine ? `<p>Bu haftaki en iyi skorun: <b>${mine.score}</b></p>` : ''}<div class="row">${btn(mine ? 'Haftanın Avı · tekrar' : 'Haftanın Avı\'nı oyna', 'playWeekly', {}, 'primary')}</div>`;
  box.appendChild(div);
};
ACT.playWeekly = () => { SS.closeModal(); SS.startHunt({ seed: SS.weeklySeed(), mode: 'weekly' }); };

/* =========================================================
   GEMİ ÇIKARTMALARI: başarılarla açılır, geminin gövdesinde görünür
   ========================================================= */
SS.DECALS = [
  { id: 'star',  name: 'Çaylak yıldızı',  how: 'Başlangıç çıkartması', test: () => true },
  { id: 'rex',   name: 'Rex Avcısı',      how: 'Bir dalışta Rex düellosunu kazan', test: () => (st().rexDuelWins || 0) >= 1 },
  { id: 'combo', name: 'Kombo Ustası',    how: 'Bir dalışta ×6 kombo yap', test: () => (st().bestCombo || 0) >= 6 },
  { id: 'rush',  name: 'Acil Kurye',      how: '3 acil ilan tamamla', test: () => (st().rush || 0) >= 3 },
  { id: 'week',  name: 'Haftanın Avcısı', how: 'Haftanın Avı\'nı oyna', test: () => (st().weekly || 0) >= 1 },
  { id: 'heart', name: 'Hane Kalbi',      how: 'Bir yol arkadaşı görevini tamamla', test: () => Object.keys(S.cqDone || {}).length >= 1 },
  { id: 'free',  name: 'Borçsuz',         how: 'Krell\'in borcunu kapat', test: () => S.loan <= 0 },
  { id: 'gem',   name: 'Koleksiyoncu',    how: 'Bir albüm setini tamamla', test: () => Object.keys(S.setsDone || {}).length >= 1 },
];
const DEC_SYM = { star: '★', rex: '▼', combo: '⚡', rush: '➤', week: '◷', heart: '♥', free: '⟨⟩', gem: '◆' };
const DEC_COL = { star: '#ffec27', rex: '#ff004d', combo: '#00e436', rush: '#ffa300', week: '#5ef0ff', heart: '#ff77a8', free: '#fff1e8', gem: '#c17bff' };
SS.drawDecal = (c, id, x, y, s) => {
  c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = DEC_COL[id] || '#fff'; c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 1;
  c.beginPath();
  const star = (n, r1, r2) => { for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, r = i % 2 ? r2 : r1; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); };
  if (id === 'star') star(5, 6, 2.6);
  else if (id === 'rex') { c.moveTo(-6, -5); c.lineTo(6, -5); c.lineTo(0, 6); c.closePath(); }
  else if (id === 'combo') { c.moveTo(-2, -7); c.lineTo(4, -7); c.lineTo(0, -1); c.lineTo(5, -1); c.lineTo(-3, 8); c.lineTo(0, 1); c.lineTo(-5, 1); c.closePath(); }
  else if (id === 'rush') { c.moveTo(-6, 0); c.lineTo(2, -6); c.lineTo(2, -2); c.lineTo(7, -2); c.lineTo(7, 2); c.lineTo(2, 2); c.lineTo(2, 6); c.closePath(); }
  else if (id === 'week') { c.arc(0, 0, 6, 0, Math.PI * 2); }
  else if (id === 'heart') { c.moveTo(0, 6); c.bezierCurveTo(-8, 0, -5, -7, 0, -3); c.bezierCurveTo(5, -7, 8, 0, 0, 6); }
  else if (id === 'free') { c.moveTo(-7, 0); c.lineTo(-1, -6); c.lineTo(-1, 6); c.closePath(); c.moveTo(7, 0); c.lineTo(1, -6); c.lineTo(1, 6); c.closePath(); }
  else if (id === 'gem') { c.moveTo(0, -7); c.lineTo(6, -2); c.lineTo(0, 7); c.lineTo(-6, -2); c.closePath(); }
  c.fill(); c.stroke();
  if (id === 'week') { c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(-1, -4, 2, 5); c.fillRect(-1, 0, 4, 1.6); }
  c.restore();
};
const _ship = SS.Art.ship;
SS.Art.ship = (c, x, y, s, t, P, opts = {}) => {
  _ship(c, x, y, s, t, P, opts);
  if (opts.raw || !window.S || !S.decal || !SS.DECALS.some(d => d.id === S.decal)) return;
  SS.drawDecal(c, S.decal, x - 24 * s, y + 3 * s, s * .9);
};
SS.checkDecals = () => {
  if (!window.S) return;
  S.decalSeen = S.decalSeen && typeof S.decalSeen === 'object' ? S.decalSeen : { star: 1 };
  for (const d of SS.DECALS) if (!S.decalSeen[d.id] && d.test()) { S.decalSeen[d.id] = 1; SS.toast(`Yeni gemi çıkartması: ${d.name} (Rıhtım › Gemi ve tersane)`, 'good'); }
};
SS.decalHtml = () => `<p class="label">Çıkartmalar · başarılarla açılır</p><div class="paints decals">${SS.DECALS.map(d => {
  const own = d.test(), on = S.decal === d.id;
  return `<button class="paint ${on ? 'on' : ''}" data-act="decal" data-d="${d.id}" ${own ? '' : 'disabled'}><i class="decal-ic" style="color:${DEC_COL[d.id]}" aria-hidden="true">${DEC_SYM[d.id]}</i><span>${d.name}</span><small>${on ? 'Takılı' : own ? 'Tak' : esc(d.how)}</small></button>`; }).join('')}
</div><div class="row">${btn('Çıkartmayı kaldır', 'decal', { d: 'none' }, 'ghost sm', !S.decal)}</div>`;
ACT.decal = d => { const id = d && d.d; if (id === 'none') S.decal = null; else { const x = SS.DECALS.find(k => k.id === id); if (!x || !x.test()) return; S.decal = id; } SS.sfx('click'); render(); };
/* =========================================================
   YOL ARKADAŞI GÖREVLERİ: bağ 65 ve 85'te (herkes 50 ile başlar) birer küçük hikâye görevi
   ========================================================= */
SS.CQUESTS = {
  pit: [
    { at: 65, id: 'pit50', title: 'Pıtırcık\'ın hazinesi', text: { easy: 'Pıtırcık bir kristal kokusu almış, gözlerini senden ayırmıyor: "Kaptan, iki tane. Biri bana, biri sana. İkisi de bana."', hard: 'Pıtırcık gece boyunca kristal kokusunu izledi. İki tane istiyor; yatağının altına saklayacak.' },
      need: { kind: 'crystal', qty: 2 }, reward: { cash: 320, bond: 10, morale: 8 }, done: 'Pıtırcık kristalleri yatağının kenarına dizdi ve bütün gece mırıldandı. Ödül olarak sana kendi bulduğu ₡320\'yi getirdi. Nereden bulduğunu sorma.' },
    { at: 85, id: 'pit80', title: 'Eski koloninin sinyali', text: { easy: 'Pıtırcık eski koloninin sinyalini yakaladı: "Evimin bir parçası Gemi Mezarlığı\'nda. İki motor parçası, lütfen."', hard: 'Pıtırcık koloninin eski sinyal kodunu buldu. Hafızasını onarmak için iki motor parçası gerekiyor.' },
      need: { kind: 'part', qty: 2 }, reward: { cash: 500, bond: 10, morale: 12 }, done: 'Pıtırcık\'ın hafızası düzeldi. İlk sözü: "Seni hatırlıyorum. Hep hatırlıyordum." Koloninin eski hesabından ₡500 aktardı.' },
  ],
  ela: [
    { at: 65, id: 'ela50', title: 'Bilim fuarı', text: { easy: 'Ela bilim fuarına uydu enkazından bir anten yapmak istiyor: "Kazanırsam adını afişe yazarım. Küçük harfle."', hard: 'Ela\'nın okulu bilim fuarı düzenliyor. Projesi için bir uydu enkazı gerekiyor.' },
      need: { kind: 'sat', qty: 1 }, reward: { cash: 260, bond: 12, morale: 12 }, done: 'Ela fuarda birinci oldu. Ödül parasını (₡260) sana verdi: "Gemi için. Ama bir kısmı dondurma."' },
    { at: 85, id: 'ela80', title: 'Burs sınavı', text: { easy: 'Ela burs sınavına hazırlanıyor ama kitaplar pahalı: ₡300. "Kazanırsam okul bedava. Matematik bunu söylüyor."', hard: 'Ela burs sınavına çalışıyor. Kitaplar için ₡300 gerekiyor. Kazanırsa okul ücreti kalkar.' },
      need: { cash: 300 }, reward: { bond: 15, morale: 10, later: { days: 6, cash: 900, text: 'Ela bursu kazandı! Okul bir yıllık ücreti iade etti: ₡900. Ela bütün gün sınav kâğıdını gösterdi.' } }, done: 'Kitapları aldınız. Ela gece geç saate kadar çalışıyor; sonuç birkaç gün içinde gelecek.' },
  ],
  tolga: [
    { at: 65, id: 'tolga50', title: 'Eski borç', text: { easy: 'Tolga\'nın eski bir borcu var: ₡250. "Öde, iki katını getiririm. Söz. Bu sefer gerçek söz."', hard: 'Tolga eski bir alacaklıya ₡250 borçlu. Ödersen kısa sürede fazlasıyla döneceğini söylüyor.' },
      need: { cash: 250 }, reward: { bond: 12, later: { days: 4, cash: 560, text: 'Tolga söz verdiği gibi ₡560 getirdi. "Faiz benden. Krell\'den öğrendim."' } }, done: 'Tolga borcunu kapattı ve günlerdir ilk kez rahat uyudu.' },
    { at: 85, id: 'tolga80', title: 'Eski geminin kaydı', text: { easy: 'Tolga eski gemisinin kaydını kurtarmak istiyor: "İki gövde plakası. Gerisini ben hallederim. Muhtemelen."', hard: 'Tolga eski mürettebatının gemi kaydını onarmak istiyor. İki gövde plakası lazım.' },
      need: { kind: 'plate', qty: 2 }, reward: { cash: 450, bond: 10, morale: 10 }, done: 'Kayıt kurtarıldı. Eski mürettebattan biri teşekkür olarak ₡450 gönderdi. Tolga bir süre konuşamadı.' },
  ],
};
const allQ = () => Object.entries(SS.CQUESTS).flatMap(([comp, L]) => L.map(q => ({ ...q, comp })));
const curQ = () => { const id = S.cquest && S.cquest.id; const q = allQ().find(x => x.id === id); return q && SS.hasCrew(q.comp) && !(S.cqDone || {})[q.id] ? q : null; };
SS.cquestActive = () => !!(window.S && curQ());
const have = q => q.need.kind ? S.cargo.filter(c => c.kind === q.need.kind).length : S.cash;
const ready = q => q.need.kind ? have(q) >= q.need.qty : S.cash >= q.need.cash;
const _newDay = SS.newDay;
SS.newDay = (notes = []) => {
  try {
    S.cqDone = S.cqDone && typeof S.cqDone === 'object' ? S.cqDone : {};
    S.cqLater = Array.isArray(S.cqLater) ? S.cqLater.filter(x => x && Number.isFinite(x.day)) : [];
    for (const x of S.cqLater.filter(x => S.day >= x.day)) { SS.earn(+x.cash || 0); notes.push(String(x.text || '')); }
    S.cqLater = S.cqLater.filter(x => S.day < x.day);
    if (S.cquest && !curQ()) S.cquest = null;
    if (!S.cquest) {
      const q = allQ().find(q => SS.hasCrew(q.comp) && !S.cqDone[q.id] && (S.crew[q.comp].bond || 0) >= q.at);
      if (q) { S.cquest = { id: q.id }; notes.push(`${SS.comp(q.comp).name} senden bir şey istiyor: “${q.title}”. Üstteki ♥ Görev düğmesine bak.`); }
    }
  } catch (e) {}
  return _newDay(notes);
};
ACT.cquest = () => {
  const q = curQ(); if (!q) { S.cquest = null; return render(); }
  const n = q.need, need = n.kind ? `${n.qty} × ${SS.ITEMS[n.kind].name} (kargonda ${have(q)})` : `${fmt(n.cash)} (nakit ${fmt(S.cash)})`;
  const rw = [q.reward.cash && fmt(q.reward.cash), q.reward.bond && `bağ +${q.reward.bond}`, q.reward.morale && `moral +${q.reward.morale}`, q.reward.later && `birkaç gün sonra ${fmt(q.reward.later.cash)}`].filter(Boolean).join(' · ');
  SS.modal(`<div class="story">${face(q.comp, 56)}<div><p class="eyebrow">Yol arkadaşı görevi · ${SS.comp(q.comp).name}</p><h2>${q.title}</h2></div></div>
    <p>${esc(SS.tx(q.text))}</p><ul class="kv"><li><span>Gereken</span><b>${need}</b></li><li><span>Ödül</span><b>${rw}</b></li></ul>
    <div class="row">${btn(n.kind ? 'Teslim et' : 'Öde', 'cqDo', {}, 'primary', !ready(q))}${btn('Sonra', 'close', {}, 'ghost')}</div>`);
};
ACT.cqDo = () => {
  const q = curQ(); if (!q || !ready(q)) return;
  if (q.need.kind) { let k = q.need.qty; S.cargo = S.cargo.filter(c => !(c.kind === q.need.kind && k-- > 0)); }
  else if (!SS.spend(q.need.cash)) return;
  const r = q.reward;
  if (r.cash) SS.earn(r.cash); if (r.bond) SS.bond(q.comp, r.bond); if (r.morale) SS.mood(r.morale);
  if (r.later) { S.cqLater = Array.isArray(S.cqLater) ? S.cqLater : []; S.cqLater.push({ day: S.day + r.later.days, cash: r.later.cash, text: r.later.text }); }
  S.cqDone = S.cqDone || {}; S.cqDone[q.id] = S.day; S.cquest = null;
  SS.sfx('win'); SS.checkDecals(); SS.save();
  SS.modal(`<div class="story">${face(q.comp, 56)}<div><p class="eyebrow">Görev tamam</p><h2>${q.title}</h2></div></div><p>${esc(q.done)}</p><div class="row">${btn('Harika', 'close', {}, 'primary')}</div>`);
  render();
};
})(window.SS);

// Space Scrapper — arayüz (PELIKAN-OS): harita, konum ekranları, defter, bülten, modallar, başlangıç ekranı
(function(SS){
const { fmt, clamp, rint, rnd, pick } = SS;
const root = document.documentElement;
const app = () => document.getElementById('app');

/* ---------- tercihler ---------- */
const prefs = SS.prefs = { style: 'vector', muted: false, theme: (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) ? 'gece' : 'lavanta' };
try { Object.assign(prefs, JSON.parse(localStorage.getItem('space-scrapper-prefs')) || {}); } catch (e) {}
const savePrefs = () => { try { localStorage.setItem('space-scrapper-prefs', JSON.stringify(prefs)); } catch (e) {} };
SS.applyLook = () => { root.dataset.style = prefs.style; root.dataset.theme = prefs.theme; };

/* ---------- ses ---------- */
let AC = null;
const ac = () => { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) {} return AC; };
function tone(f, d, type, vol, slide = 0, delay = 0) {
  const t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + d);
  o.connect(g).connect(AC.destination); o.start(t); o.stop(t + d);
}
SS.sfx = k => {
  if (k === 'big' || k === 'boom' || k === 'bad') SS.haptic && SS.haptic(k === 'boom');
  if (prefs.muted || !ac()) return;
  const w = prefs.style === 'pixel' ? 'square' : 'triangle', v = prefs.style === 'pixel' ? .045 : .08;
  try {
    switch (k) {
      case 'fire': tone(220, .12, w, v, 140); break;
      case 'grab': tone(140, .08, 'square', .04); break;
      case 'coin': tone(660, .09, w, v); tone(990, .12, w, v, 0, .07); break;
      case 'big': [523, 659, 784, 1046].forEach((f, i) => tone(f, .14, w, v, 0, i * .07)); break;
      case 'bad': tone(220, .25, 'sawtooth', .05, -100); break;
      case 'tick': tone(1200, .03, 'square', .025); break;
      case 'click': tone(520, .04, w, .035); break;
      case 'travel': tone(330, .18, w, .05, 220); break;
      case 'boom': {
        const len = AC.sampleRate * .45, b = AC.createBuffer(1, len, AC.sampleRate), d = b.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
        const s = AC.createBufferSource(), g = AC.createGain(), fl = AC.createBiquadFilter();
        fl.type = 'lowpass'; fl.frequency.value = prefs.style === 'pixel' ? 1400 : 700; g.gain.value = .4;
        s.buffer = b; s.connect(fl).connect(g).connect(AC.destination); s.start(); break;
      }
    }
  } catch (e) {}
};

/* ---------- yardımcılar ---------- */
const icon = (kind, size = 40, arg = '') => `<canvas class="ico" data-draw="${kind}${arg !== '' ? ':' + arg : ''}" width="${size}" height="${size}" aria-hidden="true"></canvas>`;
const face = (who, size = 48) => icon('npc', size, who);
const attrs = d => Object.entries(d || {}).map(([k, v]) => `data-${k}="${v}"`).join(' ');
const btn = (label, act, data, cls = '', dis = false) => `<button class="btn ${cls}" data-act="${act}" ${attrs(data)} ${dis ? 'disabled' : ''}>${label}</button>`;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const para = s => s.split('\n\n').map(p => `<p>${p}</p>`).join('');
const pct = (v, m) => Math.max(0, Math.min(100, v / m * 100));
const dots = (n, max = 3) => `<span class="dots" aria-label="${n}/${max}">${'■'.repeat(n)}${'□'.repeat(max - n)}</span>`;
const dur = m => m >= 60 ? `${Math.floor(m / 60)} sa${m % 60 ? ' ' + (m % 60) + ' dk' : ''}` : `${m} dk`;
const panel = (title, body, opts = {}) => `<section class="panel ${opts.cls || ''}">${title ? `<div class="ph"><span class="pcode">${opts.code || '//'}</span><h3>${title}</h3>${opts.aside ? `<span class="paside">${opts.aside}</span>` : ''}</div>` : ''}${body}</section>`;

SS.toast = (msg, kind = '') => {
  const t = document.getElementById('toast'); if (!t) return;
  const d = document.createElement('div'); d.className = 'toast ' + kind; d.textContent = msg; t.appendChild(d);
  setTimeout(() => d.classList.add('out'), 2600); setTimeout(() => d.remove(), 3100);
};
SS.modal = (html, cls = '') => {
  const m = document.getElementById('modal');
  m.innerHTML = `<div class="sheet ${cls}" role="dialog" aria-modal="true">${html}</div>`;
  m.hidden = false; SS.Art.paintAll(m);
  const f = m.querySelector('[data-autofocus]') || m.querySelector('.sheet button:not([disabled])'); f && f.focus({ preventScroll: true });
};
SS.closeModal = () => { const m = document.getElementById('modal'); m.hidden = true; m.innerHTML = ''; };

// Sıralı modal akışı
const Q = [];
SS.flow = () => {
  if (SS.notes.length) { const n = SS.notes.splice(0); Q.unshift(() => noteModal(n)); }
  if (SS.pendingStory) {
    const id = SS.pendingStory; SS.pendingStory = null; Q.push(() => storyModal(id));
    if (id === 'intro' && !S.guideSeen) { S.guideSeen = true; Q.push(() => guideModal('start', true)); }
  }
  const f = Q.shift();
  if (f) { render(); f(); return; }
  if (S && S.over) { render(); overModal(); return; }
  SS.closeModal(); render();
};
function noteModal(notes) { SS.modal(`<p class="eyebrow">Haber</p>${notes.map(n => `<p>${esc(n)}</p>`).join('')}<div class="row">${btn('Tamam', 'close', {}, 'primary')}</div>`); }
function storyModal(id) {
  const ch = SS.STORY[id];
  const reacts = SS.crewList().map(c => SS.COMP_STORY[c] && SS.COMP_STORY[c][id] ? `<div class="react">${face(c, 40)}<p><b>${SS.comp(c).name}:</b> ${esc(SS.tx(SS.COMP_STORY[c][id]))}</p></div>` : '').join('');
  SS.modal(`<div class="story">${id === 'marti' || id === 'balina' ? icon('ship', 64, id === 'marti' ? 1 : 2) : icon('fragment', 64)}
    <div><p class="eyebrow">Hikâye</p><h2>${ch.title}</h2></div></div>${para(SS.tx(ch))}${reacts}${id === 'intro' ? rulesHtml() : ''}
    <div class="row">${btn(id === 'intro' ? 'Devam' : 'Tamam', 'close', {}, 'primary')}</div>`, 'story-sheet');
}
function rulesHtml() {
  const R = SS.RULES;
  return `<div class="rules"><p class="eyebrow">Kurallar · herkes için aynı</p><ul class="kv">
    <li><span>Krell borcu</span><b>${fmt(R.loan)}</b></li><li><span>Aylık taksit</span><b>${fmt(R.installment)}</b></li>
    <li><span>Aylık faiz</span><b>%${Math.round(R.interest * 100)}</b></li><li><span>Süre</span><b>${R.deadline} gün</b></li>
    <li><span>Oyun biter</span><b>${R.strikesMax} gecikmede</b></li></ul></div>`;
}
function overModal() {
  const text = SS.tx(SS.ENDINGS[S.over]) || '';
  SS.modal(`<p class="eyebrow">Oyun bitti · Gün ${S.day}</p><h2>${S.over === 'evict' ? 'İstasyondan atıldın' : 'Süre doldu'}</h2>${para(text)}
    <ul class="kv"><li><span>Toplam kazanç</span><b>${fmt(S.stats.earned)}</b></li><li><span>Rütbe</span><b>${SS.rank().name}</b></li><li><span>Kalan borç</span><b>${fmt(S.loan)}</b></li>
    <li><span>Bulunan eser</span><b>${Object.keys(S.album).length}/12</b></li></ul>
    <div class="row">${btn('Yeni hayata başla', 'wipe', {}, 'primary')}</div>`);
}
function guideModal(sec, first) {
  const G = SS.GUIDE, cur = G.find(g => g.id === sec) || G[0], i = G.indexOf(cur);
  SS.modal(`<p class="eyebrow">Kılavuz ${first ? '· ilk adımlar' : ''}</p>
    <div class="gnav">${G.map(g => `<button class="chip ${g.id === cur.id ? 'on' : ''}" data-act="guide" data-s="${g.id}">${g.title}</button>`).join('')}</div>
    <h2>${cur.title}</h2><div class="guide">${cur.body}</div>
    <div class="row">${btn('Rehber', 'rehber', {}, 'ghost')}${i > 0 ? btn('◀ Önceki', 'guide', { s: G[i - 1].id }, 'ghost') : ''}${i < G.length - 1 ? btn('Sonraki ▶', 'guide', { s: G[i + 1].id }, 'ghost') : ''}${btn('Kapat', 'close', {}, 'primary')}</div>`, 'guide-sheet');
}

/* ---------- üst konsol ---------- */
const VIEW_NAME = () => S.view === 'map' ? { code: 'NAV', name: 'İstasyon Haritası' } : S.view === 'log' ? { code: 'LOG', name: SS.LOG_LOC.name } : SS.loc(S.view);
function coach() {
  const st = SS.tutStep(); if (!st) return '';
  const nar = SS.narrator() || 'captain';
  return `<div class="coach">${face(nar, 34)}<p><b>Görev ${S.tut + 1}/${SS.TUTORIAL.length}</b> ${esc(SS.tx(st.text))}</p><button class="coach-x" data-act="skipTut" aria-label="Rehberi geç">Geç</button></div>`;
}
function hud() {
  const seg = (lbl, v, m, k) => { const n = Math.round(pct(v, m) / 10); return `<div class="gauge ${v / m < .25 ? 'low' : ''}"><span>${lbl}</span><div class="segs ${k}">${Array.from({ length: 10 }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</div><b>${Math.round(v)}</b></div>`; };
  const v = VIEW_NAME(), late = S.time >= 1320;
  return `<header class="hud">
    <div class="hud-row">
      <div class="hud-loc"><span class="pcode">${v.code}</span><b>${v.name}</b></div>
      <div class="hud-clock ${late ? 'late' : ''}"><b>${SS.clock()}</b><span>Gün ${S.day} · Ay ${Math.floor((S.day - 1) / 28) + 1}</span></div>
      <div class="hud-cash"><b>${fmt(S.cash)}</b><span>${SS.rank().name}</span></div>
      <button class="help" data-act="menu" aria-label="Menü">☰</button>
    </div>
    <div class="gauges">${seg('Enerji', S.energy, SS.maxEnergy(), 'en')}${seg('Tokluk', S.hunger, 100, 'hu')}${seg('Sağlık', S.health, 100, 'he')}${seg('Moral', S.morale, 100, 'mo')}</div>
    <div class="chips"><span>Yakıt <b>${S.fuel}/${SS.tankCap()}</b></span><span>Kargo <b>${SS.cargoUsed()}/${SS.cargoCap()}</b></span><span>Torpido <b>${S.torps}</b></span><span class="${S.arrears ? 'neg' : ''}">Borç <b>${fmt(S.loan + S.arrears)}</b></span></div>
  </header>`;
}
function dock() {
  const atLoc = S.view !== 'map' && S.view !== 'log';
  return `<nav class="dock">
    <button class="${S.view === 'map' ? 'on' : ''}" data-act="view" data-v="map"><span class="dk-ico">◎</span><span>Harita</span></button>
    ${atLoc ? `<button class="on here" data-act="view" data-v="${S.view}"><span class="dk-ico">▣</span><span>${SS.loc(S.view).name}</span></button>` : `<button data-act="view" data-v="${S.loc}"><span class="dk-ico">▣</span><span>${SS.loc(S.loc).name}</span></button>`}
    <button class="${S.view === 'log' ? 'on' : ''}" data-act="view" data-v="log"><span class="dk-ico">≡</span><span>Seyir Defteri</span></button>
  </nav>`;
}

/* ---------- HARİTA ---------- */
const MAPSTARS = SS.Art.makeStars(90, 360, 320);
function mapView() {
  const rx = SS.rexWeek(), mine = S.weekEarned || 0, nx = SS.nextShip(), nr = SS.nextRank();
  const shipNeed = nx ? nx.price - SS.tradeValue() : 0, shipPct = nx ? (S.loan > 0 ? pct(S.loanStart - S.loan, S.loanStart) : pct(S.cash, shipNeed)) : 100;
  const meter = (lbl, val, p, cls = '') => `<div class="mm ${cls}"><small>${lbl}</small><b>${val}</b><div class="track"><i style="width:${p}%"></i></div></div>`;
  const done = S.goals.filter(g => g.done).length, sickN = SS.crewList().filter(id => S.crew[id].sick || S.crew[id].down || S.crew[id].hunger).length;
  return `<section class="map-wrap">
    <div class="map-top">${meter('Rex yarışı', `${fmt(mine)} / ${fmt(rx)}`, pct(mine, rx), mine >= rx ? 'win' : '')}${meter(nx ? nx.name : 'Filo', nx ? (S.loan > 0 ? `borç ${fmt(S.loan)}` : `${fmt(S.cash)} / ${fmt(shipNeed)}`) : 'tamam', shipPct)}${meter(SS.rank().name, nr ? `${fmt(nr.at - S.stats.earned)} kaldı` : 'zirve', nr ? pct(S.stats.earned - SS.rank().at, nr.at - SS.rank().at) : 100)}</div>
    <div class="map-area" id="mapWrap"><canvas id="mapCanvas" aria-label="İstasyon haritası"></canvas>
    ${S.time >= 1380 ? `<div class="map-alert">Saat geç: eve dön ve uyu</div>` : ''}
    ${SS.LOCS.map(l => {
      const here = l.id === S.loc, c = SS.travelCost(l.id), open = l.id === 'home' || SS.isOpen(l.id, S.time + c.min);
      const st = SS.tutStep(), aim = st && st.to === l.id && !here;
      return `<button class="node ${here ? 'here' : ''} ${open ? '' : 'closed'} ${aim ? 'aim' : ''}" style="left:${l.x * 100}%;top:${l.y * 100}%" data-act="go" data-to="${l.id}" aria-label="${l.name}, ${here ? 'buradasın' : open ? `${c.min} dakika` : 'kapalı'}">
        <span class="n-name">${l.name}</span><span class="n-cost">${here ? 'Buradasın' : open ? `${c.min} dk · ${c.energy} en` : `Kapalı · ${SS.openLabel(l.id)}`}</span></button>`;
    }).join('')}</div>
    <div class="map-bottom">
      ${S.decision ? `<button class="qb hot" data-act="mapPanel" data-p="decision"><b>!</b><span>Karar</span></button>` : ''}
      <button class="qb" data-act="mapPanel" data-p="goals"><b>${done}/3</b><span>Hedefler</span></button>
      ${SS.crewList().length ? `<button class="qb ${sickN ? 'warn' : ''}" data-act="mapPanel" data-p="crew"><b>${SS.crewList().length}</b><span>Hane</span></button>` : ''}
      ${S.trial && !S.trial.done ? `<button class="qb hot" data-act="trial"><b>⚠</b><span>Tehdit</span></button>` : ''}
      <button class="qb daily" data-act="dailyPanel"><b>${SS.pendingChallenge ? '⚔' : '★'}</b><span>Günün Avı</span></button>
      ${S.bulletin ? `<button class="qb" data-act="bulletin"><b>${S.event ? '●' : '○'}</b><span>Bülten</span></button>` : ''}
    </div></section>`;
}
function mapPanel(p) {
  if (p === 'decision' && S.decision) {
    const d = SS.curDecision();
    return SS.modal(`<div class="story">${d.who ? face(d.who, 52) : icon('fragment', 48)}<div><p class="eyebrow">Karar anı</p><h2>${d.title}</h2></div></div><p>${esc(SS.tx(d.text))}</p>
      <div class="row">${d.opts.map((o, i) => btn(o.label, 'decide', { i }, i === 0 ? 'primary' : 'ghost', o.need && !o.need())).join('')}</div><small>Karar vermezsen gün sonunda kaybolur.</small><div class="row">${btn('Sonra', 'close', {}, 'ghost')}</div>`);
  }
  if (p === 'goals') return SS.modal(`<p class="eyebrow">Günlük hedefler</p><ul class="goals">${S.goals.map(g => {
    const cur = Math.min(S.today[g.key] || 0, g.target), show = g.key === 'earned' ? `${fmt(cur)} / ${fmt(g.target)}` : `${cur}/${g.target}`;
    return `<li class="${g.done ? 'done' : ''}"><i></i><span>${g.txt}<small>${show}</small></span><b>+${fmt(g.reward)}</b></li>`; }).join('')}</ul>
    ${S.event ? `<p class="label">Bugünün olayı · ${S.event.title}</p><p>${esc(S.event.text)}</p>` : ''}<div class="row">${btn('Tamam', 'close', {}, 'primary')}</div>`);
  if (p === 'crew') return SS.modal(`<p class="eyebrow">Hane</p>${SS.crewList().map(id => { const st = SS.crewStatus(id), c = S.crew[id];
    return `<div class="row-item">${face(id, 44)}<div><b>${SS.comp(id).name}</b><em class="st ${st.cls}">${st.label}</em><small>Görev: ${SS.TASKS.find(t => t.id === c.task).name} · bağ ${c.bond}</small></div></div>`; }).join('')}
    <div class="row">${btn('Eve git', 'go', { to: 'home' }, 'primary')}${btn('Kapat', 'close', {}, 'ghost')}</div>`);
}
let mapTimer = 0;
const MAPSKY = SS.Art.makeSky(170);
function startMap() {
  clearTimeout(mapTimer);
  const wrap = document.getElementById('mapWrap'), cv = document.getElementById('mapCanvas'); if (!cv) return;
  const W = Math.max(200, wrap.clientWidth), H = Math.max(200, wrap.clientHeight);
  wrap.classList.toggle('compact', H < 460);
  const { ctx, pixel } = SS.Art.setup(cv, W, H, .55);
  const locs = SS.LOCS.map(l => ({ ...l, isOpen: l.id === 'home' || SS.isOpen(l.id) }));
  const t0 = performance.now(), still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const frame = () => {
    if (!cv.isConnected) return;
    SS.Art.mapScene(ctx, W, H, (performance.now() - t0) / 2000, SS.Art.P(), locs, S.loc, MAPSKY);
    SS.Art.post(cv, ctx, pixel);
    if (!still) mapTimer = setTimeout(() => requestAnimationFrame(frame), pixel ? 120 : 60);
  };
  frame();
}
let habTimer = 0;
function startHab() {
  clearTimeout(habTimer);
  const room = document.getElementById('roomCanvas'), cv = room || document.getElementById('habCanvas'); if (!cv) return;
  const L = SS.habitatLayout(360, 300), W = 360, H = room ? 320 : 300, rid = room && room.dataset.room;
  const { ctx, pixel } = SS.Art.setup(cv, W, H, .6);
  const t0 = performance.now(), still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const frame = () => {
    if (!cv.isConnected) return;
    if (rid) SS.Art.room(ctx, W, H, (performance.now() - t0) / 1000, SS.Art.P(), L, rid); else SS.Art.habitat(ctx, W, H, (performance.now() - t0) / 1000, SS.Art.P(), L);
    SS.Art.post(cv, ctx, pixel);
    if (!still) habTimer = setTimeout(() => requestAnimationFrame(frame), pixel ? 120 : 60);
  };
  frame();
}
const subTabs = (view, list) => {
  S.sub = S.sub || {};
  const cur = list.some(x => x[0] === S.sub[view]) ? S.sub[view] : list[0][0];
  return [cur, `<div class="subtabs" role="tablist">${list.map(([id, l]) => `<button role="tab" aria-selected="${id === cur}" class="${id === cur ? 'on' : ''}" data-act="sub" data-v="${view}" data-s="${id}">${l}</button>`).join('')}</div>`];
};

/* ---------- YAŞAM MODÜLÜ ---------- */
function homeView() {
  const [tab, bar] = subTabs('home', [['room', 'Odalar'], ['crew', 'Hane'], ['items', 'Dolap ve depo'], ['house', 'Ev']]);
  let h = bar;
  if (tab === 'room') {
    const W = 360, H = 300, L = SS.habitatLayout(W, H), store = S.decorStore || [];
    const rooms = Object.values(L.R); if (!S.roomSel || (S.roomSel !== 'all' && !L.R[S.roomSel])) S.roomSel = 'live';
    h += `<div class="roomchips">${rooms.map(r => `<button class="${S.roomSel === r.id ? 'on' : ''}" data-act="roomSel" data-r="${r.id}">${r.name}</button>`).join('')}<button class="${S.roomSel === 'all' ? 'on' : ''}" data-act="roomSel" data-r="all">Tüm ev</button></div>`;
    if (S.roomSel === 'all') {
      h += `<section class="hab-wrap"><canvas id="habCanvas" aria-label="Yaşam modülü kesiti"></canvas>
      ${rooms.map(r => `<button class="room-tag" style="left:${(r.x + 4) / W * 100}%;top:${(r.y + 4) / H * 100}%" data-act="roomSel" data-r="${r.id}">${r.name}</button>`).join('')}
      ${L.slots.map(sl => { const id = S.decor[sl.i]; return `<button class="slot-btn ${id ? 'full' : ''} ${sl.kind}" style="left:${sl.x / W * 100}%;top:${sl.y / H * 100}%" data-act="slot" data-i="${sl.i}" aria-label="${id ? SS.DECOR.find(d => d.id === id).name : 'Boş dekor yuvası'}">${id ? '' : '+'}</button>`; }).join('')}
    </section>`;
    } else {
      const RW = 360, RH = 320, g = SS.roomGeom(RW, RH), r = L.R[S.roomSel], mine = L.slots.filter(sl => sl.room === r.id);
      const away = r.crew && !(S.crew[r.id].task === 'rest' || S.crew[r.id].sick || S.crew[r.id].down || S.time >= 1260);
      h += `<section class="room-wrap"><canvas id="roomCanvas" data-room="${r.id}" aria-label="${r.name}"></canvas>
        <span class="room-title">${r.name}</span>${away ? `<span class="room-away big" style="left:55%;top:72%">${S.crew[r.id].task === 'with' ? 'Seninle dışarıda' : 'İşte'}</span>` : ''}
        ${mine.map(sl => { const id = S.decor[sl.i], p = SS.roomSlotPos(g, sl); return `<button class="slot-btn big ${id ? 'full' : ''}" style="left:${p.x / RW * 100}%;top:${p.y / RH * 100}%" data-act="slot" data-i="${sl.i}" aria-label="${id ? SS.DECOR.find(d => d.id === id).name : 'Boş dekor yuvası'}">${id ? '' : '+'}</button>`; }).join('')}
      </section>`;
    }
    h += `<p class="hint">${store.length ? `Depoda ${store.length} dekor var. Bir <b>+</b> yuvasına dokunup yerleştir.` : 'Pazardan dekor al, sonra bir <b>+</b> yuvasına dokunup yerleştir.'} Yerleştirilen dekor her gece etki eder.</p>
    <div class="row">${btn(`Kestir · ${dur(SS.DUR.nap)}, +${SS.NAP.energy} enerji`, 'nap', {}, 'ghost', !SS.timeOk(SS.DUR.nap))}${btn('Akşam defteri ve uyku', 'ledger', {}, 'primary')}</div>`;
    return h;
  }
  const crew = SS.crewList();
  if (tab === 'crew') h += crew.length ? panel('Hane', `<div class="list">${crew.map(id => {
    const c = S.crew[id], cp = SS.comp(id), st = SS.crewStatus(id), ab = SS.ABILITIES[id], room = SS.ROOMS[id], perks = SS.BOND_PERKS[id];
    return `<article class="crew">
      <div class="crew-top">${face(id, 52)}<div><b>${cp.name}</b><small>${cp.kind}</small><em class="st ${st.cls}">${st.label}</em></div></div>
      <div class="bond"><div class="track"><i style="width:${c.bond}%"></i>${perks.map(([lv]) => `<u style="left:${lv}%"></u>`).join('')}</div><span>Bağ ${c.bond}</span></div>
      <ul class="perks">${perks.map(([lv, t]) => `<li class="${c.bond >= lv ? 'on' : ''}"><b>${lv}</b> ${t}</li>`).join('')}</ul>
      <p class="label">Bugünkü görev</p>
      <div class="seg3">${SS.TASKS.map(t => `<button class="dopt ${c.task === t.id ? 'on' : ''}" data-act="task" data-id="${id}" data-t="${t.id}" ${c.down ? 'disabled' : ''}>${t.name}</button>`).join('')}</div>
      <div class="crew-act"><div><b>${ab.name}</b><small>${ab.desc}</small></div>${btn(S.ability[id] ? 'Kullanıldı' : 'Kullan', 'ability', { id }, 'sm', !!S.ability[id] || !SS.canAct(id))}</div>
      <div class="crew-act"><div><b>Oda: ${room.name}</b><small>${room.desc}</small></div>${S.rooms[id] ? '<span class="pill good">Kuruldu</span>' : btn(fmt(room.price), 'room', { id }, 'sm ghost', S.cash < room.price)}</div>
    </article>`;
  }).join('')}</div>`, { code: 'HN', aside: btn('?', 'guide', { s: 'crew' }, 'ghost sm q') }) : '<p class="empty">Hanende kimse yok.</p>';
  if (tab === 'items') {
  const inv = Object.entries(S.inv).filter(([, n]) => n > 0), buffs = Object.entries(S.buffs).filter(([, n]) => n > 0);
  h += panel('Dolap', `${inv.length ? `<div class="list">${inv.map(([gid, n]) => { const g = SS.GOODS.find(x => x.id === gid);
      return `<div class="row-item"><div><b>${g.name} ×${n}</b><small>${g.desc || ''}</small></div><div class="btns">${g.target === 'any' ? crew.map(cid => btn(SS.comp(cid).name, 'useInv', { g: gid, t: cid }, 'sm ghost')).join('') : btn('Kullan', 'useInv', { g: gid }, 'sm')}</div></div>`; }).join('')}</div>` : '<p class="empty">Dolap boş. Pazardan ilaç, bandaj ve hediye alabilirsin.</p>'}
    ${buffs.length ? `<p class="label">Hazır sarf malzemeleri · sıradaki işe otomatik uygulanır</p><div class="tags">${buffs.map(([k, n]) => `<span class="tag">${SS.GOODS.find(x => x.id === k).name} ×${n}</span>`).join('')}</div>` : ''}`, { code: 'DL' });
  const store = S.decorStore || [], dfx = SS.decorFx();
  h += panel('Dekor deposu', `${store.length ? `<div class="list">${store.map((id, i) => { const d = SS.DECOR.find(x => x.id === id); return `<div class="row-item"><div><b>${d.name}</b><small>${d.desc}</small></div>${btn('Sat +' + fmt(d.price * .4), 'sellDecor', { i }, 'sm ghost')}</div>`; }).join('')}</div><p class="muted">Yerleştirmek için Odalar sekmesinde boş bir yuvaya dokun.</p>` : '<p class="empty">Depo boş.</p>'}
    <p class="muted">Yerleştirilmiş dekorların toplam etkisi: ${[dfx.morale && `moral +${dfx.morale}/gece`, dfx.sleep && `uyku +${dfx.sleep}`, dfx.heat && `ısıtma −${fmt(dfx.heat)}`, dfx.bond && `hane bağı +${dfx.bond}/gece`, dfx.energyMax && `maks. enerji +${dfx.energyMax}`].filter(Boolean).join(' · ') || 'yok'}.</p>`, { code: 'DP', aside: `${SS.decorPlaced().length}/${SS.decorSlots()} yuva dolu` });
  }
  if (tab === 'house') {
  const nh = SS.HOMES[S.home + 1], m = SS.M(), dfx = SS.decorFx();
  h += panel('Duvar renkleri', `<div class="paints">${SS.HOME_TINTS.map(t => { const own = (S.tintsOwned || {})[t.id] || !t.price; const on = (S.homeTint || 'std') === t.id;
    return `<button class="paint ${on ? 'on' : ''}" data-act="tint" data-t="${t.id}" ${!own && S.cash < t.price ? 'disabled' : ''}><i style="background:${t.tint || 'var(--line2)'}"></i><span>${t.name}</span><small>${on ? 'Kullanılıyor' : own ? 'Seç' : fmt(t.price)}</small></button>`; }).join('')}</div>`, { code: 'RN' });
  h += panel(SS.HOMES[S.home].name, `<p class="muted">Uyku +${SS.HOMES[S.home].sleep + (dfx.sleep || 0)} enerji · aylık kira ${fmt(m.rent * SS.HOMES[S.home].rent)}</p>
    ${nh ? `<div class="row-item"><div><b>Taşın: ${nh.name}</b><small>Uyku +${nh.sleep}, ${SS.DECOR_SLOTS[S.home + 1]} dekor yuvası, kira ${fmt(m.rent * nh.rent)}</small></div>${btn(fmt(nh.cost), 'home', {}, 'sm', S.cash < nh.cost)}</div>` : ''}
    ${SS.EXTRAS.map(x => `<div class="row-item"><div><b>${x.name}</b><small>${x.desc}${S.home < x.needHome ? ' · önce eve taşın' : ''}</small></div>${S.extras[x.id] ? (x.id === 'workshop' ? btn('İşle · 1 sa', 'workshop', {}, 'sm', !S.cargo.some(c => c.cat === 'metal' && !c.proc) || !!SS.jobBlock(SS.COST.workshop, 60)) : '<span class="pill good">Kuruldu</span>') : btn(fmt(x.cost), 'extra', { id: x.id }, 'sm', S.cash < x.cost || S.home < x.needHome)}</div>`).join('')}`, { code: 'EV' });
  }
  return h;
}

/* ---------- İŞ MERKEZİ ---------- */
function jobsView() {
  SS.refreshBoard();
  const [tab, bar] = subTabs('jobs', [['all', 'Tümü'], ['hunt', 'Hurda'], ['deliver', 'Teslimat'], ['repair', 'Tamir'], ['other', 'Diğer']]);
  const nextAt = SS.DAY_START + (SS.win() + 1) * 180;
  let h = `<section class="panel window"><div class="ph"><span class="pcode">İLAN</span><h3>Pencere ${SS.winLabel()}</h3><span class="paside">Yenileme ${SS.clock(nextAt)}</span></div>
    <p class="muted">İlanlar her 3 saatte bir değişir. ${SS.win() >= 4 ? '<b>Gece zammı: ödemeler %10 fazla.</b>' : '19:00 sonrası gece zammı başlar.'} Rütbe primi +%${Math.round((SS.rankPay() - 1) * 100)}.</p>
    ${SS.lockedJobsNote ? SS.lockedJobsNote() : ''}
    <div class="reps">${[['scrap', 'Hurda'], ['deliver', 'Teslimat'], ['repair', 'Tamir'], ['sort', 'Ayrıştırma']].map(([k, n]) => `<div><small>${n} itibarı</small><b>${SS.repLvl(k)}/5</b><div class="track"><i style="width:${pct(SS.repLvl(k), 5)}%"></i></div></div>`).join('')}</div></section>${bar}`;
  const helpers = ids => { const hs = ids.filter(SS.assist); return hs.length ? `<div class="assists">${hs.map(id => `<span class="assist">${face(id, 22)}${SS.comp(id).name} yardım ediyor</span>`).join('')}</div>` : ''; };
  const TT = { hunt: ['AVL', 'Hurda Sözleşmesi', 'j-hunt'], deliver: ['TSL', 'Kargo Teslimatı', 'j-deliver'], repair: ['TMR', 'Tamir İşi', 'j-repair'], sort: ['AYR', 'Ayrıştırma Vardiyası', 'j-sort'], order: ['SPR', 'Sipariş', 'j-order'] };
  h += S.board.filter(b => tab === 'all' || b.type === tab || (tab === 'other' && (b.type === 'sort' || b.type === 'order'))).map(b => {
    const [code, title, cls] = TT[b.type];
    const blk = b.done ? null : (SS.jobBlock(b.energy, b.dur) || ((b.type === 'deliver' || b.type === 'hunt') && S.fuel < b.fuel ? 'Yakıt yetmiyor, Hangar\'dan al.' : null) || (b.type === 'hunt' && S.flags.storm ? 'Güneş fırtınası: bugün dışarı çıkılamaz.' : null) || (b.type === 'order' && SS.orderHave(b) < b.qty ? 'Kargonda yeterli yok.' : null));
    let body = '', meta = '', pay = '';
    const tags = b.modNames && b.modNames.length ? `<div class="tags">${b.modNames.map(n => `<span class="tag">${n}</span>`).join('')}</div>` : '';
    if (b.type === 'hunt') { body = `<p>${esc(b.text)}</p><div class="row-i">${b.kinds.map(k => icon(k, 34)).join('')}<p><b>Hedef: ${b.label}</b><br><small>Hedefler müşteriye gider; topladığın diğer her şey kargona girer. Hepsini getirirsen +%50 tamamlama primi.</small></p></div>${helpers(['pit', 'tolga'])}`; meta = `${b.zoneName} · ${b.fuel} yakıt · ${dur(b.dur)} · ${b.energy} enerji`; pay = `${fmt(b.fee)} + ${fmt(b.per)}/hedef`; }
    else if (b.type === 'deliver') { body = `<p>${esc(b.text)}</p>${tags}${helpers(['tolga'])}`; meta = `${b.tierName} ${dots(b.diff)} · ${b.dest} · ${b.fuel} yakıt · ${dur(b.dur)} · ${b.energy} enerji`; pay = fmt(b.pay); }
    else if (b.type === 'repair') { body = `<p>${esc(b.text)}</p>${tags}${helpers(['ela', 'tolga'])}`; meta = `${b.tierName} · ${b.size}×${b.size} devre · ${dur(b.dur)} · ${b.energy} enerji`; pay = fmt(b.pay); }
    else if (b.type === 'sort') { body = `<p>${esc(b.text)}</p>${helpers(['ela', 'pit'])}`; meta = `${b.time} sn · ${dur(b.dur)} · ${b.energy} enerji`; pay = `${fmt(b.per)}/doğru`; }
    else { const have = SS.orderHave(b); body = `<div class="row-i">${icon(b.kind, 40)}<p><b>${b.buyer}</b> ${b.qty} adet <b>${SS.ITEMS[b.kind].name}</b> istiyor. Kargonda ${have} var. Pazardan çok daha iyi fiyat.</p></div>`; meta = `${dur(b.dur)} · enerji yok`; pay = fmt(b.pay); }
    return `<article class="job ${cls} ${b.done ? 'done' : ''} ${b.special ? 'special' : ''}"><header><span class="pcode">${code}</span><h3>${b.type === 'sort' ? b.name : title}${b.special ? ' · özel' : ''}</h3><b class="pay">${pay}</b></header>
      ${body}<footer><small>${meta}</small>${b.done ? '<span class="pill">Bitti</span>' : btn(b.type === 'order' ? 'Teslim et' : 'Kabul et', 'job', { id: b.id }, 'sm primary', !!blk)}</footer>${blk ? `<small class="why">${blk}</small>` : ''}</article>`;
  }).join('');
  return h;
}

/* ---------- RIHTIM VE HANGAR ---------- */
function hangarView() {
  const T = SS.shipT(), disc = SS.upgradeDiscount();
  const [tab, bar] = subTabs('hangar', [['hunt', 'Hurda avı'], ['upg', 'Geliştirme'], ['yard', 'Gemi ve tersane']]);
  let h = bar;
  const hero = `<section class="panel hero-ship"><canvas class="shipview" data-draw="ship:${S.tier}" width="200" height="100" aria-label="${T.name}"></canvas>
    <div><p class="eyebrow">Gemin · ${T.name} · ${S.tier + 1}. kademe${S.ng ? ` · NG+${S.ng}` : ''}</p><h3>${esc(SS.shipName())}</h3><p class="muted">${T.desc}</p><small>Ambar ${SS.cargoCap()} · tank ${SS.tankCap()}${disc < 1 ? ` · Vida Usta indirimi %${Math.round((1 - disc) * 100)}` : ''}</small></div></section>`;
  const fp = SS.fuelPrice(), need = SS.tankCap() - S.fuel;
  if (tab === 'hunt') {
  h += panel('Hurda avı', `<p class="muted">${dur(SS.DUR.scrap)} ve ${SS.COST.scrap} enerji. Toplananlar kargoya girer; pazarda sat ya da siparişlere teslim et. Aynı bölgeye sık dalarsan stok azalır, her gece biraz yenilenir.</p>
    ${S.flags.storm ? '<div class="alert">Güneş fırtınası: bugün dışarı çıkılamaz.</div>' : ''}
    <div class="list">${SS.ZONES.map(z => {
      if (!SS.zoneLic(z.id)) return `<div class="row-item locked"><div><b>${z.name}</b><small>${SS.LICENSES[SS.ZONE_LIC[z.id]].name} gerekli · Akademi</small></div></div>`;
      if (z.story && S.fragments < 5) return `<div class="row-item locked"><div><b>??? · kayıp sinyal</b><small>Halcyon kayıtları ${S.fragments}/5. Kara kutulardan çıkar.</small></div></div>`;
      const why = S.flags.storm ? 'Fırtına' : z.fuel > SS.tankCap() ? 'Daha büyük tank' : z.fuel > S.fuel ? 'Yakıt yetmiyor' : SS.jobBlock(SS.COST.scrap, SS.DUR.scrap);
      const stock = Math.round(SS.zoneStock(z.id) * 100), found = z.relics.filter(r => S.album[r]).length;
      return `<div class="row-item zone ${S.pitZone === z.id ? 'sniff' : ''}"><div><b>${z.name}</b><small>${z.desc}</small>
        <small class="meta">${z.fuel} yakıt · değer x${z.mult} · stok %${stock}${z.relics.length ? ` · eser ${found}/3` : ''}${S.pitZone === z.id ? ' · Pıtırcık kokladı +%30' : ''}</small></div>
        ${btn('Dal', 'scrap', { z: z.id }, 'sm primary', !!why)}</div>`;
    }).join('')}</div>`, { code: 'AV' });
  h += panel('Yakıt ikmali', `<div class="row-item"><div><b>Birimi ${fmt(fp)}${S.flags.fuelHike ? ' (zamlı)' : ''}</b><small>Depo ${S.fuel}/${SS.tankCap()}</small></div><div class="btns">
    ${btn('+10 · ' + fmt(fp * 10), 'fuel', { n: 10 }, 'sm ghost', need < 1 || S.cash < fp * Math.min(10, need))}${btn('Doldur · ' + fmt(fp * need), 'fuel', { n: need }, 'sm', need < 1 || S.cash < fp * need)}</div></div>`, { code: 'YK' });
  }
  if (tab === 'upg') SS.SHIP_GROUPS.forEach(([g, name, sub]) => {
    h += panel(name, `<p class="muted">${sub}</p><div class="list">${SS.SHIP.filter(u => u.group === g).map(u => {
      const lv = S.ship[u.id] || 0, max = u.costs.length, base = T.base[u.id] || 0, cost = lv < max ? SS.upCost(u, lv) : 0;
      return `<div class="row-item up"><div><b>${u.name}</b><small>${u.desc}${base ? ` Bu gemide ${base} seviye hazır.` : ''}</small><div class="lv">${Array.from({ length: max }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</div></div>
        ${lv >= max ? '<span class="pill">Tam</span>' : btn(fmt(cost), 'upgrade', { id: u.id }, 'sm', S.cash < cost)}</div>`;
    }).join('')}</div>`, { code: { scrap: 'HRD', flight: 'UÇŞ', cargo: 'AMB', tools: 'ATL' }[g] });
  });
  if (tab !== 'yard') return h;
  h += hero;
  h += panel('Boya atölyesi', `<label class="field" for="shipName"><span>Geminin adı</span><input id="shipName" maxlength="20" value="${esc(SS.shipName())}" autocomplete="off"></label>
    <div class="row">${btn('Adı kaydet', 'renameShip', {}, 'ghost sm')}</div>
    <div class="paints">${SS.PAINTS.map(p => { const own = (S.paints || {})[p.id] || (p.unlock && (S.setsDone || {})[p.unlock]); const on = S.paint === p.id;
      return `<button class="paint ${on ? 'on' : ''}" data-act="paint" data-p="${p.id}" ${!own && S.cash < p.price ? 'disabled' : ''}><i style="background:${p.hull ? p.hull[0] : '#ff8a3d'}"></i><span>${p.name}</span><small>${on ? 'Kullanılıyor' : own ? 'Seç' : p.unlock ? 'Korsan seti ödülü' : fmt(p.price)}</small></button>`; }).join('')}</div>`, { code: 'BY' });
  const nx = SS.nextShip();
  if (!nx) h += panel('Tersane', '<p>Demir Balina\'dan büyüğü yok. Rıhtımın en gösterişli gemisi senin.</p>', { code: 'TR' });
  else {
    const block = SS.shipBlock(), trade = SS.tradeValue(), cost = nx.price - trade, canCash = S.cash >= cost, canBank = S.cash >= cost * .2;
    h += panel('Tersane', `<div class="row-i"><canvas data-draw="ship:${S.tier + 1}" width="120" height="60" aria-hidden="true"></canvas><div><b>${nx.name}</b><p class="muted">${nx.desc}</p></div></div>
      <ul class="kv"><li><span>Fiyat</span><b>${fmt(nx.price)}</b></li><li><span>${T.name} satış değeri</span><b>−${fmt(trade)}</b></li><li><span>Ödenecek</span><b>${fmt(cost)}</b></li>
      <li><span>Ambar / tank</span><b>${nx.cargo} / ${nx.tank}</b></li><li class="wrapv"><span>Hazır geliştirmeler</span><b>${Object.entries(nx.base).filter(([, v]) => v).map(([k, v]) => SS.SHIP.find(u => u.id === k).name + ' ' + v).join(', ')}</b></li></ul>
      ${block ? `<div class="alert">${block}</div>` : `<div class="row">${btn('Nakit öde', 'buyShip', { b: 0 }, 'primary', !canCash)}${btn('Banka kredisiyle al', 'buyShip', { b: 1 }, 'ghost', canCash || !canBank)}</div>
      <small>Banka en az %20 peşinat ister (${fmt(cost * .2)}). Kredi: aylık %1 faiz, taksit kredinin %6'sı, süre yok. Geliştirmeler yeni gemide sıfırlanır.</small>`}`, { code: 'TR' });
  }
  return h;
}

/* ---------- PAZAR ---------- */
function groups() {
  const map = new Map();
  S.cargo.forEach((it, i) => {
    const k = it.kind + '|' + (it.relic || '') + '|' + (it.proc ? 1 : 0);
    if (!map.has(k)) map.set(k, { it, idx: [], sum: 0 });
    const g = map.get(k); g.idx.push(i); g.sum += SS.priceOf(it);
  });
  return [...map.values()];
}
const itemName = it => it.relic ? SS.RELICS[it.relic].name : (it.proc ? 'İşlenmiş ' : '') + SS.ITEMS[it.kind].name;
function goodDesc(it) {
  if (it.desc) return it.desc;
  const f = it.fx || {}, p = [];
  if (f.energy) p.push(`enerji ${f.energy > 0 ? '+' : ''}${f.energy}`); if (f.hunger) p.push(`tokluk +${f.hunger}`); if (f.health) p.push(`sağlık ${f.health > 0 ? '+' : ''}${f.health}`); if (f.morale) p.push(`moral ${f.morale > 0 ? '+' : ''}${f.morale}`);
  return p.join(', ') + ' · hemen tüketilir';
}
function marketView() {
  SS.refreshStock();
  const [tab, bar] = subTabs('market', [['sell', 'Sat'], ['buy', 'Al']]);
  let h = bar;
  if (tab === 'sell') {
  h += panel('Zara\'nın tezgâhı · fiyatlar', `<div class="prices">${Object.keys(SS.CATS).filter(k => k !== 'relic').map(k => {
    const tr = S.trend[k] || 0, p = Math.round(S.prices[k] * 100 * SS.saturation(k));
    return `<div class="${p >= 115 ? 'up' : p <= 85 ? 'down' : ''}"><span>${SS.CATS[k]}</span><b>%${p}</b><small>${tr > .02 ? '▲' : tr < -.02 ? '▼' : '–'}${S.satur[k] ? ` · ${S.satur[k]} satış` : ''}</small></div>`;
  }).join('')}</div><p class="muted">Aynı gün aynı türden her satış fiyatı %3 düşürür. Satışı günlere yay ya da İş Merkezi'ndeki siparişlere bak.</p>
  <div class="gear-line"><span>Ekipman primi</span><b>+%${Math.round((SS.gearMult() - 1) * 100)}</b><small>Kanca, vinç, pençe ve radarın ${SS.gearLvl()} seviyesinden. Hangar'da geliştirdikçe artar; antikalara uygulanmaz. Aşağıdaki fiyatlara dahil.</small></div>`, { code: 'ZR' });
  const gs = groups(), total = gs.reduce((a, g) => a + g.sum, 0);
  h += panel('Kargo', gs.length ? `<div class="list">${gs.map((g, n) => `<div class="row-item">${icon(g.it.kind, 34, g.it.relic || '')}<div><b>${itemName(g.it)} ×${g.idx.length}</b><small>tanesi ≈ ${fmt(g.sum / g.idx.length)}${g.it.relic ? ' · albümde kayıtlı' : ''}</small></div>
      <div class="btns">${btn('1 sat', 'sell', { g: n, n: 1 }, 'sm ghost')}${g.idx.length > 1 ? btn(fmt(g.sum), 'sell', { g: n, n: 'all' }, 'sm') : ''}</div></div>`).join('')}</div>
    <div class="row">${btn(`Hepsini sat · ${fmt(total)}`, 'sellAll', {}, 'primary')}${btn(S.haggleUsed ? 'Pazarlık yapıldı' : 'Pazarlık et', 'haggle', {}, 'ghost', S.haggleUsed)}</div>` : '<p class="empty">Kargo boş.</p>', { code: 'KG', aside: `${SS.cargoUsed()}/${SS.cargoCap()}` });
  return h;
  }
  const nextAt = SS.DAY_START + (SS.win() + 1) * 180;
  const listing = it => `<div class="row-item good-row ${it.qty <= 0 ? 'sold' : ''}"><div><b>${esc(it.name)}</b><small>${it.cat} · ${goodDesc(it)}${it.qty < 99 ? ` · stok ${it.qty}` : ''}</small></div>${btn(it.qty <= 0 ? 'Tükendi' : fmt(it.price), 'buy', { k: it.key }, 'sm', it.qty <= 0 || S.cash < it.price)}</div>`;
  const staples = S.stock.filter(i => i.qty >= 99 && !i.vendor), rot = S.stock.filter(i => i.qty < 99 && !i.vendor), ven = S.stock.filter(i => i.vendor);
  h += panel('Sabit raf', `<div class="list">${staples.map(listing).join('')}</div>`, { code: 'SB' });
  h += panel(`Günün tezgâhı · ${SS.winLabel()}`, `<div class="list">${rot.map(listing).join('')}</div><small>Yeni ürünler ${SS.clock(nextAt)}'de gelir.</small>`, { code: 'DN' });
  if (ven.length) { const v = SS.VENDORS.find(x => x.id === ven[0].vendor); h += panel(`Seyyar satıcı · ${v.name}`, `<p class="quote">${esc(SS.tx(v.line))}</p><div class="list">${ven.map(listing).join('')}</div>`, { code: 'SY', cls: 'vendor' }); }
  return h;
}

/* ---------- KANTİN ---------- */
function cantinaView() {
  const [tab, bar] = subTabs('cantina', [['food', 'Mutfak'], ['tables', 'Masalar']]);
  let h = bar;
  if (tab === 'food') return h + panel('Gus\'un mutfağı', `<div class="list">${SS.FOOD.map(f => `<div class="row-item"><div><b>${f.name}</b><small>Enerji +${f.energy} · tokluk +${f.hunger}${f.morale ? ' · moral +' + f.morale : ''} · 15 dk</small></div>
    ${f.id === 'ration' && S.freeRation ? btn('Bedava', 'eat', { id: f.id, free: 1 }, 'sm good') : btn(fmt(SS.foodPrice(f)), 'eat', { id: f.id }, 'sm', S.cash < SS.foodPrice(f))}</div>`).join('')}
    ${SS.DRINKS.map(d => { const used = S.drinks[d.id] || 0, price = Math.round(d.price * SS.M().foodMult);
      return `<div class="row-item"><div><b>${d.name}</b><small>Enerji +${d.energy}${d.health ? ` · sağlık ${d.health > 0 ? '+' : ''}${d.health}` : ''}${d.morale ? ' · moral +' + d.morale : ''} · ${d.desc} (${used}/${d.limit})</small></div>${btn(fmt(price), 'drink', { id: d.id }, 'sm', used >= d.limit || S.cash < price)}</div>`; }).join('')}</div>`, { code: 'MT' });
  h += panel('Masalar', `<p class="muted">Sohbet ${dur(SS.DUR.talk)} sürer. Yakınlık 30 ve 60'ta kalıcı ayrıcalıklar açılır.</p><div class="list">${SS.NPCS.map(n => {
    const a = S.aff[n.id], next = n.perks.find(p => a < p[0]);
    return `<div class="row-item npc">${face(n.id, 46)}<div><b>${n.name}</b><small>${n.role}</small><div class="bond"><div class="track"><i style="width:${a}%"></i></div><span>${a}</span></div>
      <small class="perk">${n.perks.filter(p => a >= p[0]).map(p => '✓ ' + p[1]).join(' · ') || (next ? `${next[0]} yakınlıkta: ${next[1]}` : '')}</small></div>
      ${btn(S.talked[n.id] ? 'Konuştun' : 'Sohbet', 'talk', { id: n.id }, 'sm ghost', S.talked[n.id] || !SS.timeOk(SS.DUR.talk))}</div>`;
  }).join('')}</div>`, { code: 'MS' });
  h += panel('Kart masası taşındı', `<p class="muted">Gus'un kart masası artık Nebula Kumarhanesi'nde; orada çark, zar, meteor yarışı ve slot da var. Kumarhane 14:00'te açılır.</p>`, { code: 'KR' });
  return h;
}

/* ---------- KLİNİK VE AKADEMİ ---------- */
const trainCost = SS.trainCost = lv => Math.round(250 * (lv + 1) * SS.dv('costs'));
const healPrice = () => Math.round(70 * SS.dv('costs'));
const SKILL_FX = SS.SKILL_FX = { pilot: lv => `iniş toleransı +%${lv * 10}, yakıt +${lv * 15}`, eng: lv => `tamirde +${lv * 6} sn, +${Math.floor(lv / 2)} ipucu`, trade: lv => `tüm satışlar +%${lv * 3}`, fit: lv => `maksimum enerji +${lv * 10}` };
function clinicView() {
  let h = panel('Klinik', `<div class="row-item"><div><b>Tedavi</b><small>Sağlık +30 · 30 dakika</small></div>${btn(fmt(healPrice()), 'heal', {}, 'sm', S.cash < healPrice() || S.health >= 100 || !SS.timeOk(30))}</div>`, { code: 'KL' });
  if (SS.CLINIC_EXTRA) h += SS.CLINIC_EXTRA();
  return h;
}

/* ---------- KRELL VE BANKA ---------- */
function krellView() {
  const m = SS.M(), paid = S.loanStart - S.loan, who = S.lender === 'bank' ? 'Banka' : S.lender === 'krell' ? 'Krell' : null;
  return panel('Hesap', `${who ? `<div class="row-i">${face('krell', 48)}<p>${who === 'Krell' ? (SS.fun() ? 'Krell gülümsüyor. Masasında senin dosyan, yanında bir puding.' : 'Krell dosyanı açıyor. Gülümsemesi gözlerine ulaşmıyor.') : 'Banka memuru ekranına bakıyor: "Ödemeleriniz düzenli. Şimdilik."'}</p></div>
    <div class="debt"><div class="track"><i style="width:${pct(Math.max(0, paid), S.loanStart)}%"></i></div><small>${fmt(Math.max(0, paid))} ödendi · kalan ${fmt(S.loan)}</small></div>
    <ul class="kv"><li><span>Alacaklı</span><b>${who}</b></li><li><span>Aylık taksit (28. günlerde)</span><b>${fmt(Math.min(S.loan, m.installment))}</b></li><li><span>Aylık faiz</span><b>%${Math.round(m.interest * 100)}</b></li>
    ${m.deadline ? `<li class="${m.deadline - S.day < 28 ? 'neg' : ''}"><span>Son gün</span><b>${m.deadline}. gün (${Math.max(0, m.deadline - S.day + 1)} gün kaldı)</b></li>` : ''}</ul>` : '<p>Kimseye borcun yok. Hangar\'daki tersaneden yeni gemine geçebilirsin.</p>'}
    ${S.arrears ? `<ul class="kv"><li class="neg"><span>Gecikmiş borç · ${S.strikes}/${m.strikesMax} gecikme</span><b>${fmt(S.arrears)}</b></li></ul>` : ''}
    <div class="row">${S.arrears ? btn('Gecikmişi öde', 'arrears', {}, 'danger', !S.cash) : ''}${S.loan > 0 ? [100, 500, 1000].map(n => btn('+' + fmt(n), 'pay', { n }, 'ghost sm', S.cash < n)).join('') + btn('Hepsini öde', 'pay', { n: 'all' }, 'sm', !S.cash) : ''}</div>`, { code: 'FN' });
}

/* ---------- SEYİR DEFTERİ ---------- */
function logView() {
  const r = SS.rank(), nr = SS.nextRank();
  const [tab, bar] = subTabs('log', [['cap', 'Kaptan'], ['rehber', 'Rehber'], ['story', 'Hikâye'], ['ach', 'Başarımlar'], ['set', 'Ayarlar']]);
  let h = bar;
  if (tab === 'rehber') return h + panel('Rehber', `<p class="muted">Ne nereden alınır, ne işe yarar. Ara ya da bir bölüme dokun.</p>${SS.rehberHtml()}<div class="row">${btn('Nasıl oynanır', 'guide', { s: 'start' }, 'ghost sm')}</div>`, { code: 'RH' });
  if (tab === 'cap') {
  h += panel(esc(S.name), `<div class="row-i">${face('captain', 60)}<div><p class="eyebrow">${r.name} · ${SS.SHIPS[S.tier].name}</p>
    <small>Toplam kazanç ${fmt(S.stats.earned)} · ${S.stats.runs} hurda avı · ${S.stats.deliver} teslimat · ${S.stats.repair} tamir · ${S.stats.orders || 0} sipariş · ${S.stats.decisions} karar · Rex'e karşı ${S.stats.rexWins || 0} galibiyet</small></div></div>
    <ul class="ranks">${SS.RANKS.map((x, i) => `<li class="${i <= SS.rankIdx() ? 'on' : ''}"><b>${x.name}</b><small>${fmt(x.at)}${x.perk ? ' · ' + x.perk : ''}</small></li>`).join('')}</ul>
    ${nr ? `<small>Sonraki rütbe için ${fmt(nr.at - S.stats.earned)} daha kazan.</small>` : ''}`, { code: 'KP' });
  if ((S.titles || []).length) h += panel('Unvanlar', `<div class="tags">${S.titles.map(t => `<span class="tag">${t}</span>`).join('')}</div>`, { code: 'UN' });
  if (SS.canNGPlus()) h += panel('Yeni Oyun+', `<p>Demir Balina senin. İstersen yeni bir istasyonda, daha büyük bir borçla baştan başla. Albümün, unvanların, boyaların ve başarımların seninle gelir; bütün işler %${((S.ng || 0) + 1) * 10} daha fazla öder.</p>${btn('Yeni Oyun+ başlat', 'askNG', {}, 'primary')}`, { code: 'NG+' });
  h += panel('Paylaş', `<p class="muted">Haftanı ya da dünkü gününü bir kart olarak arkadaşlarına gönder.</p><div class="row">${btn('Haftayı paylaş', 'shareWeek', {}, 'sm')}${S.day > 1 ? btn('Dünü paylaş', 'shareDay', {}, 'sm ghost') : ''}</div>`, { code: 'PY' });
  if (S.rexLog.length) h += panel('Rex ile yarış', `<ul class="kv">${S.rexLog.slice(-6).reverse().map(x => `<li class="${x.win ? '' : 'neg'}"><span>${x.week}. hafta · ${x.win ? 'kazandın' : 'kaybettin'}</span><b>${fmt(x.mine)} / ${fmt(x.rex)}</b></li>`).join('')}</ul>`, { code: 'RX' });
  if (S.crewOrder.length) h += panel('Hane kayıtları', `<div class="list">${S.crewOrder.map(id => { const c = S.crew[id], cp = SS.comp(id);
    return `<div class="row-item ${c.gone ? 'gone' : ''}">${face(id, 44)}<div><b>${cp.name}</b><small>${cp.kind}${c.gone ? ' · ayrıldı' : ` · bağ ${c.bond}`}</small><ul class="pc"><li class="p">${cp.pros.join('</li><li class="p">')}</li><li class="c">${cp.cons.join('</li><li class="c">')}</li></ul></div></div>`; }).join('')}</div>`, { code: 'HN' });
  return h; }
  if (tab === 'story') {
  h += panel('Hikâye', `<div class="frags">${[0, 1, 2, 3, 4].map(i => `<i class="${i < S.fragments ? 'on' : ''}"></i>`).join('')}</div><div class="chapters">${S.chapters.map(id => btn(SS.STORY[id].title, 'story', { id }, 'ghost sm')).join('')}</div>`, { code: 'HK', aside: `Halcyon ${S.fragments}/5` });
  h += SS.SETS.map(st => { const Z = SS.ZONES.find(z => z.id === st.zone), [have, all] = SS.setProgress(st), done = (S.setsDone || {})[st.zone];
    return panel(st.name, `<div class="track ${done ? 'win' : ''}"><i style="width:${pct(have, all)}%"></i></div>
      <div class="album">${Z.relics.map(id => S.album[id] ? `<div>${icon('relic', 40, id)}<small>${SS.RELICS[id].name}</small></div>` : `<div class="unk">${icon('lock', 40)}<small>?</small></div>`).join('')}</div>
      <small>${Z.name} · ödül: ${fmt(st.reward.cash)}, "${SS.DECOR.find(d => d.id === st.reward.decor).name}" dekoru, "${st.reward.title}" unvanı${done ? ' · alındı' : ''}</small>`, { code: 'SET', aside: `${have}/${all}` }); }).join('');
  return h; }
  if (tab === 'ach') return h + panel('Başarımlar', `<ul class="ach">${SS.ACH.map(a => `<li class="${S.ach[a.id] ? 'on' : ''}"><b>${a.name}</b><small>${a.desc}</small></li>`).join('')}</ul>`, { code: 'BŞ', aside: `${Object.keys(S.ach).length}/${SS.ACH.length}` });
  h += panel('Görünüm ve anlatım', `${lookControls(false)}${toneControls(S.tone, 'tone')}<div class="row">${btn(prefs.muted ? 'Sesi aç' : 'Sesi kapat', 'mute', {}, 'ghost sm')}${btn('Kılavuz', 'guide', { s: 'start' }, 'ghost sm')}${btn('Yeni oyun', 'askWipe', {}, 'ghost sm danger-t')}</div>`, { code: 'AY' });
  h += panel('Zorluk', `<ul class="kv">${SS.DIFF.map((d, i) => `<li><span>${d.name}</span><b>${d.opts[S.diff[i]][0]}</b></li>`).join('')}</ul>${rulesHtml()}`, { code: 'ZR' });
  return h;
}
function lookControls(withPreview) {
  return `<p class="label">Renk teması</p><div class="choice three">${SS.THEMES.map(t => `<button class="opt ${prefs.theme === t.id ? 'on' : ''}" data-act="theme" data-t="${t.id}"><span class="sw">${t.sw.map(c => `<i style="background:${c}"></i>`).join('')}</span><b>${t.name}</b></button>`).join('')}</div>
    <p class="label">Görsel stil</p><div class="choice">${[['pixel', 'Piksel', 'Düşük çözünürlük, sınırlı renk paleti, köşeli yazı'], ['vector', 'Vektör', 'Yumuşak kenarlar, akıcı çizgiler, keskin yazı']].map(([k, n, d]) =>
      `<button class="opt ${prefs.style === k ? 'on' : ''}" data-act="style" data-s="${k}">${withPreview ? `<canvas class="prev" data-prev="${k}" width="260" height="150" aria-hidden="true"></canvas>` : ''}<b>${n}</b><small>${d}</small></button>`).join('')}</div>`;
}
function toneControls(cur, act) {
  const t = SS.TONES.find(x => x.id === cur);
  return `<p class="label">Metin tonu</p><div class="choice">${SS.TONES.map(x => `<button class="opt ${cur === x.id ? 'on' : ''}" data-act="${act}" data-t="${x.id}"><b>${x.name}</b><small>${x.desc}</small></button>`).join('')}</div>
    <div class="sample"><small>Örnek · ${t.name.toLowerCase()} anlatım</small><p>“${t.sample}”</p></div><small>${SS.TONE_NOTE}</small>`;
}

const VIEWS = { map: mapView, home: homeView, jobs: jobsView, hangar: hangarView, market: marketView, cantina: cantinaView, clinic: clinicView, krell: krellView, log: logView };
function render() {
  if (!S) return titleScreen();
  SS.applyLook();
  if (S.view !== 'map' && S.view !== 'log' && S.view !== S.loc) S.view = 'map';
  const old = document.getElementById('main'), st = old && old.dataset.v === S.view ? old.scrollTop : 0;
  if (SS.tutCheck()) SS.save();
  app().innerHTML = hud() + coach() + `<main id="main" data-v="${S.view}" class="v-${S.view}">${VIEWS[S.view]()}</main>` + dock();
  document.getElementById('main').scrollTop = st;
  SS.Art.paintAll(app());
  if (S.view === 'map') startMap(); else clearTimeout(mapTimer);
  if (document.getElementById('habCanvas') || document.getElementById('roomCanvas')) startHab(); else clearTimeout(habTimer);
  SS.save();
}
SS.render = render;
SS.VIEWS = VIEWS;
SS.ui = { panel, btn, icon, face, esc, pct, dots, dur, subTabs: (...a) => subTabs(...a), resultModal: (...a) => resultModal(...a), afterJob: () => afterJob(), cardsOpen: () => ACT.cards() };

/* ---------- akşam defteri ---------- */
let LSEL = null;
function ledgerModal() {
  const L = SS.ledger(), inc = SS.nightIncome();
  if (!LSEL) LSEL = new Set(L.filter(i => !i.req).map(i => i.id));
  const incSum = inc.reduce((a, i) => a + i.amt, 0), req = L.filter(i => i.req), opt = L.filter(i => !i.req);
  const reqSum = req.reduce((a, i) => a + i.amt, 0), optSum = opt.filter(i => LSEL.has(i.id)).reduce((a, i) => a + i.amt, 0);
  const after = S.cash + incSum - reqSum - optSum, over = optSum > 0 && after < 0;
  const row = (l, v, cls = '') => `<li class="${cls}"><span>${l}</span><b>${v >= 0 ? '+' : '−'}${fmt(Math.abs(v))}</b></li>`;
  SS.modal(`<div class="ledger"><div class="lg-head"><p class="eyebrow">Akşam defteri</p><h2>Gün ${S.day} · ${SS.clock()}</h2></div>
    <ul class="lg">${row('Bakiye', S.cash)}${inc.map(i => row(i.name, i.amt, 'inc')).join('')}</ul>
    <p class="label">Zorunlu</p><ul class="lg">${req.map(i => row(i.name, -i.amt)).join('')}</ul>
    <p class="label">Kararın senin</p><ul class="lg opt">${opt.map(i => `<li class="${LSEL.has(i.id) ? '' : 'off'}"><button class="chk ${LSEL.has(i.id) ? 'on' : ''}" data-act="ltog" data-id="${i.id}" aria-pressed="${LSEL.has(i.id)}" aria-label="${i.name}">${LSEL.has(i.id) ? '✓' : ''}</button><span>${i.name}${LSEL.has(i.id) ? '' : `<small>${i.warn}</small>`}</span><b>−${fmt(i.amt)}</b></li>`).join('')}</ul>
    <ul class="lg total">${row('Kalan', after, after < 0 ? 'neg' : '')}</ul>
    ${S.tease ? `<div class="alert info">Yarın: ${esc(S.tease.text)}</div>` : ''}
    ${SS.crewList().length ? `<div class="crew-mini">${SS.crewList().map(id => { const st = SS.crewStatus(id); return `<div>${face(id, 30)}<span><b>${SS.comp(id).name}</b><em class="st ${st.cls}">${st.label}</em></span></div>`; }).join('')}</div>` : ''}
    ${over ? '<div class="alert">Paran bu kalemlerin hepsine yetmiyor. Birkaçından vazgeç.</div>' : reqSum > S.cash + incSum ? '<div class="alert">Zorunlu ödemelere bile paran yetmiyor. Kalan tutar gecikmiş borca yazılacak ve bir gecikme sayılacak.</div>' : ''}
    <div class="row">${btn('Onayla ve uyu', 'sleepNow', {}, 'primary', over)}${btn('Vazgeç', 'close', {}, 'ghost')}</div></div>`, 'ledger-sheet');
}
function bulletinModal() {
  const B = S.bulletin; if (!B) return;
  const night = SS._lastNight && S.day === B.day ? SS._lastNight : { R: [], notes: [] };
  const mk = B.up && B.down ? `<p><b>${SS.CATS[B.up[0]]}</b> yükselişte, <b>${SS.CATS[B.down[0]]}</b> düşüşte.</p>` : '';
  SS.modal(`<div class="paper"><div class="masthead"><span>İSTASYON GÜNLÜĞÜ</span><span>Gün ${B.day}</span></div>
    <h2 class="headline">${B.event ? B.event.title : 'İstasyonda sakin bir sabah'}</h2>
    ${S.morning && S.morningKey && SS.hasCrew(S.morningKey) ? `<div class="react">${face(S.morningKey, 36)}<p>${esc(S.morning)}</p></div>` : ''}
    <p class="lede">${esc(B.event ? B.event.text : B.news)}</p>
    ${night.R.length ? `<p class="label">Dün gece</p><ul class="kv">${night.R.map(([l, v, ok]) => `<li class="${ok === false ? 'neg' : ''}"><span>${l}</span><b>${v < 0 ? '−' + fmt(-v) : (ok !== null ? '+' : '') + fmt(v)}</b></li>`).join('')}</ul>` : ''}
    ${B.crew.length ? `<p class="label">Hane</p><div class="crew-mini">${B.crew.map(c => `<div>${face(c.id, 30)}<span><b>${SS.comp(c.id).name}</b><em class="st ${c.status.cls}">${c.status.label}</em></span></div>`).join('')}</div>` : ''}
    ${night.notes.length ? `<p class="label">Gece olanlar</p>${night.notes.map(n => `<p class="note">${esc(n)}</p>`).join('')}` : ''}
    ${B.echoes.length ? `<p class="label">Dünün kararları</p><ul class="echo">${B.echoes.map(e => `<li>${esc(e)}</li>`).join('')}</ul>` : ''}
    <p class="label">Piyasa ve kulis</p>${B.tease ? `<p><b>Bugün:</b> ${esc(B.tease.text)}</p>` : ''}${mk}${B.event ? `<p>${esc(B.news)}</p>` : ''}
    ${B.decision ? `<div class="alert info">Bugün seni bir karar bekliyor: <b>${B.decision}</b></div>` : ''}
    ${S.trial && !S.trial.done ? `<div class="alert">${esc(S.trial.head)}</div>` : ''}
    <div class="row">${btn(`Güne başla · ${SS.clock()}`, S.trial && !S.trial.done ? 'trial' : 'close', {}, 'primary')}${S.day > 1 ? btn('Dünü paylaş', 'shareDay', {}, 'ghost') : ''}</div></div>`, 'paper-sheet');
}

/* ---------- sonuç modalları ---------- */
function afterJob() { SS.afterJobCrew(); SS.checkGoals(); SS.checkAch(); SS.save(); }
function helpLine(ids) { const h = ids.filter(SS.assist); return h.length ? `<p class="muted">Yardım eden: ${h.map(id => SS.comp(id).name).join(', ')} (bağ +2)</p>` : ''; }
function resultModal(title, body, ok) {
  render();
  SS.modal(`<p class="eyebrow">${ok === false ? 'Olmadı' : 'İş bitti'} · ${SS.clock()}</p><h2>${title}</h2>${body}<div class="row">${btn('Tamam', 'close', {}, 'primary')}</div>`);
}
function scrapDone(res) {
  afterJob();
  const items = res.got.filter(g => g.kind), other = res.got.filter(g => g.label);
  const est = items.reduce((a, g) => a + Math.round(g.value * (S.prices[SS.ITEMS[g.kind].cat] || 1) * SS.sellMult()), 0);
  const counts = {};
  items.forEach(g => { const k = g.relic ? SS.RELICS[g.relic].name : SS.ITEMS[g.kind].name; counts[k] = (counts[k] || 0) + 1; });
  const K = res.contract;
  resultModal(K ? (K.got ? `Sözleşme: ${fmt(K.pay)}` : 'Sözleşme tamamlanamadı') : items.length || other.length ? 'Kargo ambarda' : 'Eli boş döndün',
    `${K ? `<p>${K.client} için ${K.got}/${K.qty} hedef teslim edildi${K.full ? ', tamamlama primi dahil. Hurda itibarı +1' : ''}. ${K.got ? `Ödeme: <b>${fmt(K.pay)}</b>.` : 'Hiç hedef getiremediğin için ödeme yok.'}</p>` : ''}${items.length ? `<ul class="kv">${Object.entries(counts).map(([k, n]) => `<li><span>${k}</span><b>×${n}</b></li>`).join('')}</ul><p>Pazardaki tahmini değer: <b>${fmt(est)}</b>. Pazarda sat ya da siparişlere teslim et.</p>` : ''}
     ${other.map(o => `<p>• ${o.label}</p>`).join('')}
     ${res.lost ? `<p class="neg">Kargo dolu olduğu için ${res.lost} parça uzayda kaldı.</p>` : ''}
     ${!items.length && !other.length ? `<p>${SS.fun() ? 'Kanca boşluğu yakaladı. Boşluk değersizdir, denendi.' : 'Yakıt ve zaman gitti. Elde bir şey yok.'}</p>` : ''}${helpLine(['pit', 'tolga'])}${SS.highlight && !SS.highlight.shared ? `<div class="row">${btn('Anı karesini paylaş', 'shareMoment', {}, 'ghost sm')}</div>` : ''}`);
}

/* ---------- pazarlık ---------- */
let H = null;
function haggleOpen() {
  const total = S.cargo.reduce((a, it) => a + SS.priceOf(it), 0);
  if (!total) return SS.toast('Satacak bir şey yok.', 'bad');
  S.haggleUsed = true;
  H = { total, limit: 1.05 + rnd(0, .25) + S.skills.trade * .04 + (SS.perk('tolga', 60) ? .06 : SS.hasCrew('tolga') ? .03 : 0), patience: 3, offer: 120,
    msg: SS.fun() ? '"Hepsini mi? Bakalım ne kadar cesursun."' : '"Hepsi bu kadar mı? Söyle rakamını."', angry: false };
  haggleView();
}
function haggleView() {
  SS.modal(`<div class="story">${face('zara', 60)}<div><p class="eyebrow">Pazarlık · sabır ${dots(H.patience)}</p><h2>Zara ile pazarlık</h2></div></div>
    <p>${H.msg}</p><p class="muted">Liste fiyatı: <b>${fmt(H.total)}</b>${SS.hasCrew('tolga') ? ' · Tolga yanında, Zara biraz yumuşak' : ''}</p>
    ${H.angry ? `<p>Son teklifi: <b>${fmt(H.total * .92)}</b></p><div class="row">${btn('Kabul et', 'hagAccept', {}, 'primary')}${btn('Satma', 'close', {}, 'ghost')}</div>` :
    `<label class="slider" for="hagRange">İstediğin fiyat: <b id="hagVal">%${H.offer} · ${fmt(H.total * H.offer / 100)}</b></label>
    <input type="range" id="hagRange" min="100" max="160" step="1" value="${H.offer}">
    <div class="row">${btn('Teklif ver', 'hagOffer', {}, 'primary')}${btn('Liste fiyatına sat', 'hagList', {}, 'ghost')}</div>`}`);
}
function haggleSell(mult) {
  const n = S.cargo.length, got = SS.sellIdx(S.cargo.map((_, i) => i), mult);
  SS.checkGoals(); SS.checkAch(); render(); SS.toast(`${n} eşya satıldı: ${fmt(got)}`, 'good'); SS.sfx('coin');
}

/* ---------- kart masası ---------- */
let K = null;
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'], SUITS = ['♠', '♥', '♦', '♣'];
const cardHtml = (v, s, hidden) => hidden ? `<div class="pcard back"></div>` : `<div class="pcard ${s === '♥' || s === '♦' ? 'red' : ''}"><b>${RANKS[v - 1]}</b><span>${s}</span></div>`;
function cardsView() {
  const bets = SS.hard() ? [25, 50, 100] : [10, 25, 50];
  if (K.stage === 'bet') {
    SS.modal(`<div class="story">${face('gus', 60)}<div><p class="eyebrow">Kart masası · 20 dk, 5 enerji</p><h2>Yüksek mi alçak mı?</h2></div></div>
      <p>Sıradaki kart açık karttan yüksek mi, alçak mı? Bildikçe pot büyür. ${SS.hard() ? 'Eşitlik kasanın.' : 'Eşitlikte kimse kaybetmez.'}</p>
      <div class="row">${bets.map(b => btn('Bahis ' + fmt(b), 'cardBet', { b }, '', S.cash < b)).join('')}</div><div class="row">${btn('Kalk', 'close', {}, 'ghost')}</div>`);
    return;
  }
  const hiP = (13 - K.v) / 13, loP = (K.v - 1) / 13, mult = p => clamp(.92 / Math.max(p, .01), 1.1, 6);
  SS.modal(`<p class="eyebrow">Bahis ${fmt(K.bet)} · seri ${K.streak}</p><h2>${K.stage === 'lost' ? 'Kaybettin' : K.stage === 'won' ? 'Masadan kalktın' : 'Pot: ' + fmt(K.pot)}</h2>
    <div class="cards-row">${cardHtml(K.v, K.s)}${K.next ? cardHtml(K.next.v, K.next.s) : cardHtml(0, 0, true)}</div><p>${K.msg || ''}</p>
    ${K.stage === 'play' ? `<div class="row">${btn(`Yüksek · x${mult(hiP).toFixed(2)}`, 'cardGuess', { g: 'hi' }, '', hiP <= 0)}${btn(`Alçak · x${mult(loP).toFixed(2)}`, 'cardGuess', { g: 'lo' }, '', loP <= 0)}</div>
      <div class="row">${btn('Çekil · ' + fmt(K.pot), 'cardCash', {}, 'primary', K.streak === 0)}</div>` :
      `<div class="row">${btn('Bir el daha', 'cards', {}, '', S.cardsToday >= 4 || S.energy < 5)}${btn('Kalk', 'close', {}, 'ghost')}</div>`}`);
}
function cardGuess(g) {
  if (!K || K.stage !== 'play' || K.next) return;
  const nv = rint(1, 13), ns = pick(SUITS), p = g === 'hi' ? (13 - K.v) / 13 : (K.v - 1) / 13, ok = g === 'hi' ? nv > K.v : nv < K.v;
  K.next = { v: nv, s: ns };
  if (nv === K.v && !SS.hard()) K.msg = 'Eşit! Pot olduğu gibi kaldı.';
  else if (ok) { K.pot = Math.round(K.pot * clamp(.92 / p, 1.1, 6)); K.streak++; K.msg = 'Bildin!'; SS.sfx('coin'); }
  else { K.stage = 'lost'; K.msg = SS.fun() ? 'Gus teselli için sana bir kraker uzattı.' : 'Gus potu sessizce kasaya çekiyor.'; SS.mood(SS.hard() ? -6 : -2); SS.sfx('bad'); render(); cardsView(); return; }
  setTimeout(() => { if (K && K.stage === 'play') { K.v = K.next.v; K.s = K.next.s; K.next = null; cardsView(); } }, 700);
  cardsView();
}

/* ---------- ayrıştırma talimatı ---------- */
function sortBrief(b) {
  const bins = [['METAL', 0], ['ORGANİK', 1], ['TEHLİKELİ', 2]];
  SS.modal(`<p class="eyebrow">Vardiya talimatı · ${b.name}</p><h2>Hangi eşya hangi kutuya?</h2><p class="muted">${esc(b.text)}</p>
    <div class="sortbrief">${bins.map(([n, i]) => `<div class="sb b${i}"><b>${n}</b><span class="key">Tuş ${i + 1}</span>${SS.SORT_POOL.filter(o => o.bin === i).map(o => `<div class="sb-item">${icon(o.kind, 34)}<small>${o.name}</small></div>`).join('')}</div>`).join('')}</div>
    <ul class="kv"><li><span>Doğru</span><b>+${fmt(b.per)}</b></li><li><span>Yanlış</span><b>−₡4</b></li><li><span>Kaçan</span><b>−₡2</b></li><li><span>Her 5'li seri</span><b>+₡2</b></li></ul>
    <p class="muted">Banttaki en alttaki eşya çerçevelidir; adı üstünde yazar. Kutuya dokun ya da alttaki düğmeleri kullan.</p>
    <div class="row">${btn(`Vardiyaya gir · ${dur(b.dur)}`, 'startSort', { id: b.id }, 'primary')}${btn('Vazgeç', 'close', {}, 'ghost')}</div>`);
}

/* ---------- eylemler ---------- */
const job = (cost, mins, fn) => { const b = SS.jobBlock(cost, mins); if (b) { SS.toast(b, 'bad'); return; } fn(); };
const ACT = {
  view: d => { SS.closeModal(); if (d.v !== 'map' && d.v !== 'log' && d.v !== S.loc) return ACT.go({ to: d.v }); S.view = d.v; SS.sfx('click'); render(); document.getElementById('main').scrollTop = 0; },
  go: d => {
    if (d.to === S.loc) { S.view = d.to; render(); document.getElementById('main').scrollTop = 0; return; }
    const c = SS.travelCost(d.to);
    let err = null;
    if (d.to === 'home') { if (S.energy < c.energy && S.energy > 0) err = null; SS.passTime(c.min); S.energy = Math.max(0, S.energy - c.energy); S.loc = 'home'; }
    else err = SS.travel(d.to);
    if (err) return SS.toast(err, 'bad');
    S.today.vis = S.today.vis || {}; if (!S.today.vis[d.to]) { S.today.vis[d.to] = 1; SS.bump('travel'); SS.checkGoals(); }
    S.view = d.to; SS.sfx('travel'); SS.toast(`${SS.loc(d.to).name} · ${c.min} dk yol, ${c.energy} enerji`);
    render(); document.getElementById('main').scrollTop = 0;
  },
  close: () => { LSEL = null; SS.flow(); },
  guide: d => guideModal(SS.GUIDE.some(g => g.id === d.s) ? d.s : 'start'),
  bulletin: () => bulletinModal(),
  decide: d => {
    const r = SS.decide(+d.i); if (!r) return;
    SS.checkGoals(); SS.checkAch(); render(); SS.sfx('click');
    SS.modal(`<div class="story">${r.who ? face(r.who, 56) : icon('fragment', 52)}<div><p class="eyebrow">Kararın sonucu</p><h2>${r.title}</h2></div></div><p>${esc(r.text)}</p><div class="row">${btn('Tamam', 'close', {}, 'primary')}</div>`);
  },
  task: d => { if (!SS.hasCrew(d.id) || S.crew[d.id].down) return; S.crew[d.id].task = d.t; S.incomeRoll = null; SS.sfx('click'); render(); },
  ability: d => { const msg = SS.useAbility(d.id); if (!msg) return; SS.sfx('big'); render(); SS.modal(`<div class="story">${face(d.id, 56)}<div><p class="eyebrow">${SS.ABILITIES[d.id].name}</p><h2>${SS.comp(d.id).name}</h2></div></div><p>${esc(msg)}</p><div class="row">${btn('Tamam', 'close', {}, 'primary')}</div>`); },
  room: d => { if (SS.buyRoom(d.id)) { SS.sfx('big'); SS.toast(`${SS.ROOMS[d.id].name} kuruldu.`, 'good'); render(); } },
  useInv: d => { const msg = SS.useInv(d.g, d.t); if (msg) { SS.toast(msg, /yok|değil/.test(msg) ? 'bad' : 'good'); render(); } },
  menu: () => SS.modal(`<p class="eyebrow">Menü · ${esc(S.name)} · Gün ${S.day}</p><h2>PELIKAN-OS</h2>
    <div class="menu-list">${btn('Oyuna dön', 'close', {}, 'primary block')}${btn('Rehber: ne, nerede, ne işe yarar', 'rehber', {}, 'ghost block')}${btn('Nasıl oynanır', 'guide', { s: S.view === 'map' ? 'map' : S.view }, 'ghost block')}${btn('Seyir Defteri ve ayarlar', 'view', { v: 'log' }, 'ghost block')}${btn(prefs.muted ? 'Sesi aç' : 'Sesi kapat', 'muteMenu', {}, 'ghost block')}${btn('Kaydet ve ana menüye dön', 'toMenu', {}, 'ghost block')}${btn('Yeni oyun başlat', 'askWipe', {}, 'ghost block danger-t')}</div>
    <small>Oyun her işlemde otomatik kaydedilir. Ana menüden kaldığın yerden devam edebilirsin.</small>`),
  muteMenu: () => { prefs.muted = !prefs.muted; savePrefs(); ACT.menu(); },
  toMenu: () => { SS.save(); window.S = null; Q.length = 0; SS.closeModal(); titleScreen(); },
  roomSel: d => { S.roomSel = d.r; SS.sfx('click'); render(); },
  skipTut: () => { S.tut = null; SS.toast('Rehber kapatıldı. Kılavuz her zaman ☰ menüsünde.'); render(); },
  renameShip: () => { const v = (document.getElementById('shipName').value || '').trim().slice(0, 20); if (!v) return; S.shipNames = S.shipNames || {}; S.shipNames[S.tier] = v; SS.toast(`Geminin adı artık ${v}.`, 'good'); render(); },
  paint: d => { const p = SS.PAINTS.find(x => x.id === d.p); S.paints = S.paints || {}; const own = S.paints[p.id] || (p.unlock && (S.setsDone || {})[p.unlock]);
    if (!own) { if (!SS.spend(p.price)) return; S.paints[p.id] = true; } S.paint = p.id; SS.sfx('big'); render(); },
  tint: d => { const t = SS.HOME_TINTS.find(x => x.id === d.t); S.tintsOwned = S.tintsOwned || {}; if (t.price && !S.tintsOwned[t.id]) { if (!SS.spend(t.price)) return; S.tintsOwned[t.id] = true; } S.homeTint = t.id; SS.sfx('click'); render(); },
  askNG: () => SS.modal(`<h2>Yeni Oyun+ başlasın mı?</h2><p>Mevcut hayatın burada kapanır. Albüm, unvanlar, boyalar ve başarımlar korunur; para, gemi ve ev sıfırlanır.</p><div class="row">${btn('Başlat', 'doNG', {}, 'primary')}${btn('Vazgeç', 'close', {}, 'ghost')}</div>`),
  doNG: () => { SS.newGamePlus(); SS.save(); SS.closeModal(); SS.flow(); },
  sub: d => { S.sub = S.sub || {}; S.sub[d.v] = d.s; SS.sfx('click'); render(); document.getElementById('main').scrollTop = 0; },
  mapPanel: d => mapPanel(d.p),
  dismissMorning: () => { S.morningSeen = true; render(); },
  slot: d => {
    const i = +d.i, id = S.decor[i], store = S.decorStore || [];
    if (id) { const x = SS.DECOR.find(y => y.id === id); return SS.modal(`<p class="eyebrow">Dekor yuvası ${i + 1}</p><h2>${x.name}</h2><p>${x.desc}</p><div class="row">${btn('Depoya kaldır', 'unplace', { i }, 'ghost')}${btn('Tamam', 'close', {}, 'primary')}</div>`); }
    SS.modal(`<p class="eyebrow">Boş yuva ${i + 1}</p><h2>Ne yerleştirelim?</h2>${store.length ? `<div class="list">${store.map((sid, k) => { const x = SS.DECOR.find(y => y.id === sid); return `<div class="row-item"><div><b>${x.name}</b><small>${x.desc}</small></div>${btn('Yerleştir', 'place', { i, s: k }, 'sm primary')}</div>`; }).join('')}</div>` : '<p class="empty">Depoda dekor yok. Pazar Halkası\'nda "Günün tezgâhı" ve seyyar satıcılarda dekor çıkar.</p>'}<div class="row">${btn('Kapat', 'close', {}, 'ghost')}</div>`);
  },
  place: d => { if (SS.placeDecor(+d.i, +d.s)) { SS.sfx('big'); SS.toast('Dekor yerleştirildi.', 'good'); SS.closeModal(); render(); } },
  unplace: d => { const x = SS.storeDecor(+d.i); if (x) SS.toast(`${x.name} depoya kaldırıldı.`); SS.closeModal(); render(); },
  sellDecor: d => { const x = SS.sellDecor(+d.i); if (x) SS.toast(`${x.name} satıldı.`, 'good'); render(); },
  buy: d => { const it = S.stock.find(x => x.key === d.k), err = SS.buyStock(d.k); if (err) return SS.toast(err, 'bad'); SS.sfx('coin'); SS.checkGoals(); render(); if (it && it.decor) SS.toast('Dekor depoya eklendi. Yaşam Modülü > Odalar\'da bir yuvaya yerleştir.', 'good'); },
  job: d => {
    const b = S.board.find(x => x.id === d.id); if (!b || b.done) return;
    if (b.type === 'order') { if (SS.fulfilOrder(b.id)) { SS.bump('order'); SS.checkGoals(); SS.sfx('big'); SS.toast(`Sipariş teslim edildi: ${fmt(b.pay)}`, 'good'); render(); } return; }
    job(b.energy, b.dur, () => {
      if ((b.type === 'deliver' || b.type === 'hunt') && S.fuel < b.fuel) return;
      if (b.type === 'hunt') {
        if (S.flags.storm) return;
        S.fuel -= b.fuel; b.done = true; SS.useJob(b.energy, b.dur); S.stats.runs++; SS.bump('scrap'); S.zoneUse[b.zone] = (S.zoneUse[b.zone] || 0) + 1; SS.save();
        const ct = { kinds: b.kinds, qty: b.qty, per: b.per, label: b.label, got: 0 };
        return SS.Games.scrap(b.zone, res => {
          const full = ct.got >= ct.qty, pay = ct.got ? b.fee + b.per * ct.got + (full ? Math.round(b.fee * .5) : 0) : 0;
          SS.earn(pay); if (ct.got) { SS.bump('hunt'); S.stats.hunts = (S.stats.hunts || 0) + 1; } if (full) SS.repGain('scrap');
          res.contract = { got: ct.got, qty: ct.qty, pay, full, client: b.client };
          scrapDone(res);
        }, ct);
      }
      if (b.type === 'sort') return sortBrief(b);
      if (b.type === 'deliver') S.fuel -= b.fuel;
      b.done = true; SS.useJob(b.energy, b.dur); SS.save();
      if (b.type === 'deliver') SS.Games.deliver(b, res => {
        const tip = res.tip || 0;
        if (res.ok) { SS.earn(res.pay + tip); S.stats.deliver++; SS.bump('deliver'); SS.mood(3); SS.repGain('deliver'); }
        afterJob();
        resultModal(res.ok ? `${fmt(res.pay + tip)} kazandın` : res.quit ? 'Teslimattan vazgeçtin' : 'Kargo dağıldı',
          (res.ok ? `<p>${b.what[0].toLocaleUpperCase('tr') + b.what.slice(1)} ${b.dest}'ya ulaştı.${tip ? ` Yumuşak iniş bahşişi: ${fmt(tip)}.` : ''} Kalan yakıt bonusu ödemeye eklendi. Teslimat itibarı +1.</p>`
            : `<p>${res.quit ? 'Müşteri sinirli ama yaşıyorsun.' : SS.fun() ? 'Kargo pistin her yerine saçıldı. Müşteri yine de teşekkür kartı gönderdi. Para yok ama.' : 'Gövde sarsıldı, kargo mahvoldu. Ücret yok.'}</p>`) + helpLine(['tolga']), res.ok);
      });
      else SS.Games.repair(b, res => {
        let pay = res.pay;
        if (res.ok && SS.assist('tolga') && S.rooms.tolga) pay = Math.round(pay * 1.15);
        if (res.ok) { SS.earn(pay); S.stats.repair++; SS.bump('repair'); SS.repGain('repair'); if ((b.mods || []).includes('loyal')) S.aff.vida = Math.min(100, S.aff.vida + 5); }
        afterJob();
        resultModal(res.ok ? `${fmt(pay)} kazandın` : 'Tamir yarım kaldı', (res.ok ? `<p>${b.what} yeniden çalışıyor. Tamir itibarı +1.</p>` : '<p>Süre doldu. Müşteri başka bir tamirci çağırdı.</p>') + helpLine(['ela']), res.ok);
      });
    });
  },
  startSort: d => {
    const b = S.board.find(x => x.id === d.id); if (!b || b.done) return;
    SS.closeModal(); b.done = true; SS.useJob(b.energy, b.dur); SS.save();
    SS.Games.sort(b, res => {
      SS.earn(res.pay); S.stats.sort++; SS.bump('sort'); if (res.right >= res.wrong + res.missed) SS.repGain('sort'); afterJob();
      resultModal(`${fmt(res.pay)} kazandın`, `<ul class="kv"><li><span>Doğru</span><b>${res.right}</b></li><li><span>Yanlış</span><b>${res.wrong}</b></li><li><span>Kaçan</span><b>${res.missed}</b></li></ul>${helpLine(['ela', 'pit'])}`);
    });
  },
  scrap: d => job(SS.COST.scrap, SS.DUR.scrap, () => {
    const z = SS.ZONES.find(x => x.id === d.z);
    if (S.flags.storm || z.fuel > S.fuel) return;
    S.fuel -= z.fuel; SS.useJob(SS.COST.scrap, SS.DUR.scrap); S.stats.runs++; SS.bump('scrap');
    S.zoneUse[z.id] = (S.zoneUse[z.id] || 0) + 1; SS.save();
    SS.Games.scrap(z.id, scrapDone);
  }),
  workshop: () => job(SS.COST.workshop, 60, () => {
    const m = S.cargo.filter(c => c.cat === 'metal' && !c.proc).slice(0, 6); if (!m.length) return;
    SS.useJob(SS.COST.workshop, 60); m.forEach(c => { c.proc = true; c.cat = 'part'; c.value = Math.round(c.value * 1.8); });
    SS.toast(`${m.length} metal parça işlendi.`, 'good'); render();
  }),
  nap: () => { if (!SS.timeOk(SS.DUR.nap)) return; SS.passTime(SS.DUR.nap); SS.eat({ energy: SS.NAP.energy, morale: SS.NAP.morale }); SS.toast(`Kestirdin: enerji +${SS.NAP.energy}`, 'good'); render(); },
  ledger: () => { LSEL = null; ledgerModal(); },
  ltog: d => { if (LSEL.has(d.id)) LSEL.delete(d.id); else LSEL.add(d.id); SS.sfx('tick'); ledgerModal(); },
  sleepNow: () => {
    if (S.over) return SS.flow();
    const sel = LSEL || null; LSEL = null;
    if (SS.trialIgnore) SS.trialIgnore();
    const res = SS.sleep(sel); SS._lastNight = res; SS.scheduleNotes();
    S.view = 'map'; render(); SS.sfx('click');
    if (S.over) return SS.flow();
    bulletinModal();
  },
  sell: d => { const g = groups()[+d.g]; if (!g) return; const got = SS.sellIdx((d.n === 'all' ? g.idx : [g.idx[0]]).slice()); SS.checkGoals(); SS.checkAch(); SS.sfx('coin'); render(); SS.toast(`Satıldı: ${fmt(got)}`, 'good'); },
  sellAll: () => { if (S.cargo.length) haggleSell(1); },
  haggle: () => haggleOpen(),
  hagOffer: () => {
    const v = +document.getElementById('hagRange').value; H.offer = v;
    if (v / 100 <= H.limit) { const total = Math.round(H.total * v / 100); SS.closeModal(); haggleSell(v / 100); S.aff.zara = Math.min(100, S.aff.zara + 3); SS.modal(`<div class="story">${face('zara', 60)}<div><p class="eyebrow">Anlaştınız</p><h2>${fmt(total)}</h2></div></div><p>${SS.fun() ? '"Tamam, tamam! Ama kimseye söyleme, imajım var."' : '"Bu sefer kazandın. Alışma."'}</p><div class="row">${btn('Tamam', 'close', {}, 'primary')}</div>`); return; }
    H.patience--;
    if (H.patience <= 0) { H.angry = true; H.msg = SS.fun() ? 'Zara gözlüğünü çıkarıp siliyor. "Artık sinirlendim. Son teklifim bu."' : '"Vaktimi harcıyorsun. Al ya da git."'; }
    else H.msg = v / 100 - H.limit > .15 ? (SS.fun() ? '"Hahaha! Komik. Şimdi ciddi bir rakam söyle."' : '"Hayal kurma."') : (SS.fun() ? '"Hmm... Yaklaşıyorsun ama hâlâ fazla."' : '"Yakın. Ama değil."');
    SS.sfx('bad'); haggleView();
  },
  hagList: () => { SS.closeModal(); haggleSell(1); },
  hagAccept: () => { SS.closeModal(); haggleSell(.92); },
  fuel: d => { const n = Math.min(+d.n, SS.tankCap() - S.fuel), c = n * SS.fuelPrice(); if (n > 0 && SS.spend(c)) { S.fuel += n; SS.sfx('click'); render(); } },
  upgrade: d => {
    const u = SS.SHIP.find(x => x.id === d.id), lv = S.ship[u.id] || 0; if (lv >= u.costs.length) return;
    const cost = SS.upCost(u, lv); if (!SS.spend(cost)) return;
    S.ship[u.id] = lv + 1; S.upSpent += cost; SS.sfx('big'); SS.toast(`${u.name} seviye ${S.ship[u.id]}`, 'good'); SS.checkAch(); render();
  },
  buyShip: d => { if (!SS.buyShip(d.b === '1')) return SS.toast('Bu gemiyi şu an alamazsın.', 'bad'); SS.sfx('big'); SS.flow(); },
  eat: d => {
    const f = SS.FOOD.find(x => x.id === d.id);
    if (d.free) { if (!S.freeRation) return; S.freeRation = false; } else if (!SS.spend(SS.foodPrice(f))) return;
    SS.eat(f); SS.passTime(15); SS.checkGoals(); SS.sfx('coin'); SS.toast(`${f.name}: enerji +${f.energy}, tokluk +${f.hunger}`, 'good'); render();
  },
  drink: d => {
    const x = SS.DRINKS.find(y => y.id === d.id), used = S.drinks[x.id] || 0, price = Math.round(x.price * SS.M().foodMult);
    if (used >= x.limit || !SS.spend(price)) return;
    S.drinks[x.id] = used + 1; SS.eat(x); SS.passTime(x.id === 'spa' ? 45 : 10); SS.sfx('coin'); SS.toast(`${x.name}: enerji +${x.energy}`, 'good'); render();
  },
  talk: d => {
    if (!SS.timeOk(SS.DUR.talk) || S.talked[d.id]) return;
    const n = SS.NPCS.find(x => x.id === d.id), before = S.aff[d.id];
    SS.passTime(SS.DUR.talk); S.talked[d.id] = true; S.aff[d.id] = Math.min(100, before + 14); SS.mood(8); SS.bump('talk');
    let extra = '';
    n.perks.forEach(([lv, txt]) => { if (before < lv && S.aff[d.id] >= lv) extra += `<p class="good-t">Yeni ayrıcalık: ${txt}</p>`; });
    if (d.id === 'rex' && S.aff.rex >= 60 && !S.perkGiven.rex) { S.perkGiven.rex = true; if (SS.addFragment()) extra += `<p class="good-t">Rex sana bir kara kutu kaydı uzatıyor: "Bende işe yaramaz. Sende belki." (${S.fragments}/5)</p>`; }
    SS.checkGoals(); SS.checkAch(); render();
    SS.modal(`<div class="story">${face(n.id, 60)}<div><p class="eyebrow">${n.role}</p><h2>${n.name}</h2></div></div><p>${pick(SS.NPC_LINES[n.id][SS.fun() ? 'easy' : 'hard'])}</p>${extra}<p class="muted">Yakınlık ${S.aff[d.id]} · moral +8</p><div class="row">${btn('Tamam', 'close', {}, 'primary')}</div>`);
  },
  cards: () => { if (S.cardsToday >= 4 || S.energy < 5 || !SS.timeOk(20)) return; K = { stage: 'bet' }; cardsView(); },
  cardBet: d => { const b = +d.b; if (!SS.spend(b)) return; S.cardsToday++; S.energy = Math.max(0, S.energy - 5); SS.passTime(20); K = { stage: 'play', bet: b, pot: b, streak: 0, v: rint(2, 12), s: pick(SUITS), next: null, msg: '' }; render(); cardsView(); },
  cardGuess: d => cardGuess(d.g),
  cardCash: () => { if (K.streak === 0) return; SS.earn(K.pot); const profit = K.pot - K.bet; S.stats.cardsBest = Math.max(S.stats.cardsBest, profit); SS.mood(5); K.stage = 'won'; K.msg = `${fmt(K.pot)} aldın (kâr ${fmt(profit)}).`; SS.checkGoals(); SS.checkAch(); SS.sfx('big'); render(); cardsView(); },
  heal: () => { if (SS.timeOk(30) && SS.spend(healPrice())) { S.health = Math.min(100, S.health + 30); SS.passTime(30); SS.sfx('click'); render(); } },
  train: d => job(SS.COST.train, SS.DUR.train, () => { const lv = S.skills[d.id]; if (lv >= 5 || !SS.spend(trainCost(lv))) return; SS.useJob(SS.COST.train, SS.DUR.train); S.skills[d.id]++; SS.toast(`${SS.SKILLS.find(s => s.id === d.id).name} seviye ${S.skills[d.id]}`, 'good'); SS.sfx('big'); render(); }),
  home: () => { const nh = SS.HOMES[S.home + 1]; if (nh && SS.spend(nh.cost)) { S.home++; SS.mood(15); SS.toast(`${nh.name} artık senin.`, 'good'); SS.sfx('big'); SS.checkAch(); render(); } },
  extra: d => { const x = SS.EXTRAS.find(e => e.id === d.id); if (S.home >= x.needHome && SS.spend(x.cost)) { S.extras[x.id] = true; SS.sfx('big'); render(); } },
  pay: d => { const n = SS.payLoan(d.n === 'all' ? S.cash : +d.n); if (n) { SS.toast(`${fmt(n)} borç ödendi.`, 'good'); SS.sfx('coin'); } SS.flow(); },
  arrears: () => { const n = SS.payArrears(); if (n) SS.toast(`Gecikmiş borçtan ${fmt(n)} ödendi.`, 'good'); render(); },
  story: d => storyModal(d.id),
  style: d => { prefs.style = d.s; savePrefs(); SS.sfx('click'); render(); },
  theme: d => { prefs.theme = d.t; savePrefs(); SS.sfx('click'); render(); },
  tone: d => { S.tone = d.t; SS.sfx('click'); render(); },
  mute: () => { prefs.muted = !prefs.muted; savePrefs(); render(); },
  askWipe: () => SS.modal(`<h2>Yeni oyun?</h2><p>Mevcut kayıt silinir: gün ${S.day}, ${fmt(S.cash)} nakit, ${fmt(S.loan)} borç.</p><div class="row">${btn('Sil ve baştan başla', 'wipe', {}, 'danger')}${btn('Vazgeç', 'close', {}, 'ghost')}</div>`),
  wipe: () => { SS.wipe(); window.S = null; Q.length = 0; SS.closeModal(); titleScreen(); },
  pickCrew: d => { const i = T.crew.indexOf(d.id); if (i >= 0) T.crew.splice(i, 1); else T.crew.push(d.id); titleScreen(); },
  pickDiff: d => { T.diff[+d.i] = +d.j; titleScreen(); },
  pickTone: d => { T.tone = d.t; titleScreen(); },
  start: () => {
    if (!T.crew.length) return SS.toast('En az bir yol arkadaşı seç.', 'bad');
    T.name = (document.getElementById('capName').value || '').trim().slice(0, 18) || 'Kaptan';
    window.S = SS.newState(T.diff, T.tone, T.name, T.crew);
    S.nextEvent = null; SS.newDay([]);
    SS.pendingStory = 'intro'; SS.save(); ac(); SS.flow();
  },
  cont: () => { window.S = SS.load(); ac(); SS.flow(); },
};
SS.ACT = ACT;

/* ---------- başlangıç ekranı ---------- */
const T = { diff: [1, 1, 1], tone: 'fun', name: '', crew: ['pit'] };
const PSTARS = SS.Art.makeStars(40, 260, 150);
function previewScene(c, P) {
  SS.Art.space(c, 260, 150, 1.2, 'belt', PSTARS, P);
  [['crystal', 60, 120], ['plate', 120, 128], ['boulder', 205, 115], ['bolts', 30, 85], ['box', 170, 80], ['tank', 230, 60]].forEach(([k, x, y]) =>
    SS.Art.item(c, { kind: k, x, y, r: SS.ITEMS[k].r * .8, rot: .2, poly: [1, .86, 1, .9, .95, 1, .88, 1, .92], vx: 1 }, 1, P));
  SS.Art.ship(c, 130, 28, .6, 1, P);
  c.strokeStyle = P.rope; c.lineWidth = 2; c.beginPath(); c.moveTo(130, 44); c.lineTo(158, 82); c.stroke();
  SS.Art.claw(c, 158, 82, -.6, .5, P);
}
function titleScreen() {
  SS.applyLook();
  const save = SS.load();
  const nameEl = document.getElementById('capName'); if (nameEl) T.name = nameEl.value;
  const sc = document.getElementById('main'), st = sc && sc.classList.contains('title') ? sc.scrollTop : 0;
  const cost = T.crew.reduce((a, id) => a + SS.comp(id).daily, 0);
  app().innerHTML = `<main class="title" id="main">
    <div class="logo"><span class="pcode">PELIKAN-OS · v3</span><canvas id="logoShip" width="180" height="90" aria-hidden="true"></canvas>
      <h1>Space<span>Scrapper</span></h1><p class="muted">Borçlu bir hurdacının istasyondaki hayatı. Kanca at, iş kovala, haneni doyur, gemini büyüt.</p></div>
    ${save ? panel(`${esc(save.name)} · Gün ${save.day}`, `<p class="muted">${SS.SHIPS[save.tier].name} · nakit ${fmt(save.cash)} · borç ${fmt(save.loan)}</p>${btn('Devam et', 'cont', {}, 'primary block')}`, { code: 'KYT' }) : ''}
    ${panel('Kaptan', `<label class="field" for="capName"><span>Adın</span><input id="capName" maxlength="18" placeholder="Kaptan" autocomplete="off" value="${esc(T.name)}"></label>`, { code: '01' })}
    ${panel('Yol arkadaşları', `<p class="muted">Birini, ikisini ya da üçünü seç. Daha çok arkadaş daha çok iş gücü ve yardım, ama daha çok masraf ve sorumluluk demek. İlk seçtiğin anlatıcı olur.</p>
      <div class="crew-pick">${SS.COMPANIONS.map(cp => { const on = T.crew.includes(cp.id), ord = T.crew.indexOf(cp.id);
        return `<button class="opt crew-opt ${on ? 'on' : ''}" data-act="pickCrew" data-id="${cp.id}" aria-pressed="${on}">
        <div class="crew-top">${face(cp.id, 50)}<div><b>${cp.name}</b><small>${cp.kind}</small><small class="cost">Gecelik ${fmt(cp.daily)}${cp.weekly ? ` + haftalık ${fmt(cp.weekly)}` : ''}${ord === 0 ? ' · anlatıcı' : ''}</small></div><span class="tick">${on ? '✓' : '+'}</span></div>
        <p class="ab"><b>${SS.ABILITIES[cp.id].name}:</b> ${SS.ABILITIES[cp.id].desc}</p>
        <ul class="pc"><li class="p">${cp.pros.join('</li><li class="p">')}</li><li class="c">${cp.cons.join('</li><li class="c">')}</li></ul></button>`; }).join('')}</div>`, { code: '02', aside: `${T.crew.length} seçili · ${fmt(cost)}/gece` })}
    ${panel('Zorluk', `<div class="diff">${SS.DIFF.map((d, i) => `<div class="drow"><span>${d.name}</span><small>${d.desc}</small><div class="dopts">${d.opts.map(([l], j) =>
        `<button class="dopt ${T.diff[i] === j ? 'on' : ''}" data-act="pickDiff" data-i="${i}" data-j="${j}" aria-pressed="${T.diff[i] === j}">${l}</button>`).join('')}</div></div>`).join('')}</div>${rulesHtml()}`, { code: '03' })}
    ${panel('Anlatım', toneControls(T.tone, 'pickTone'), { code: '04' })}
    ${panel('Görünüm', `<p class="muted">Oyun sırasında Seyir Defteri'nden de değiştirebilirsin.</p>${lookControls(true)}`, { code: '05' })}
    <div class="row">${btn(save ? 'Yeni oyuna başla (kaydın silinir)' : 'Hayata başla', 'start', {}, 'primary block', !T.crew.length)}</div>
  </main>`;
  document.getElementById('main').scrollTop = st;
  SS.Art.paintAll(app());
  const cur = root.dataset.style;
  document.querySelectorAll('canvas[data-prev]').forEach(cv => { root.dataset.style = cv.dataset.prev; cv.style.width = '100%'; cv.style.height = 'auto'; SS.Art.paint(cv, 260, 150, previewScene, .5); });
  root.dataset.style = cur;
  const ls = document.getElementById('logoShip'); ls.style.width = '180px'; ls.style.height = '90px';
  SS.Art.paint(ls, 180, 90, (c, P) => { SS.Art.ship(c, 90, 52, 1.3, 0, P, { flame: true }); }, .5);
}
SS.titleScreen = titleScreen;

/* ---------- dinleyiciler ---------- */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
  const a = ACT[b.dataset.act]; if (!a) return;
  e.preventDefault(); a({ ...b.dataset });
});
document.addEventListener('input', e => { if (e.target.id === 'hagRange' && H) { H.offer = +e.target.value; document.getElementById('hagVal').textContent = `%${H.offer} · ${fmt(H.total * H.offer / 100)}`; } });
document.addEventListener('keydown', e => {
  if (SS.Stage.active()) { if (SS.Stage.key(e, true)) e.preventDefault(); return; }
  if (e.key === 'Escape' && !document.getElementById('modal').hidden) ACT.close();
});
document.addEventListener('keyup', e => { if (SS.Stage.active()) SS.Stage.key(e, false); });
document.addEventListener('visibilitychange', () => { if (document.hidden && window.S) { SS.save(); SS.scheduleNotes(); } });

})(window.SS);

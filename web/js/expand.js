// Space Scrapper — genişleme: Günün Avı arayüzü, Nebula Kumarhanesi, Akademi lisansları, sınamalar ve savunma mini oyunları
(function(SS){
const { fmt, clamp, rint, rnd, pick } = SS;
const { panel, btn, icon, face, esc, pct, dur } = SS.ui;
const ACT = SS.ACT, TAU = Math.PI * 2;
const render = () => SS.render();
const tx = o => SS.tx(o);

/* =========================================================
   KAYIT GÖÇÜ: eski kayıtlar bütün lisanslarla gelir
   ========================================================= */
SS.migrate = s => {
  if (!s.lic) s.lic = { deliver: 1, repair: 1, sort: 1, order: 1, scrap2: 1, scrap3: 1 };
  if (!s.rules2) { s.rules2 = 1; if (s.day > 1 && s.lender === 'krell' && s.loan > 0) s.deadlineOverride = Math.max(SS.RULES.deadline, Math.min(196, s.day + 60)); }
  // Eksik her alanı yeni oyunun varsayılanlarıyla doldur (eski ya da yarım kalmış kayıtlar için)
  try {
    const prev = window.S, def = SS.newState(Array.isArray(s.diff) && s.diff.length === 3 ? s.diff : [1, 1, 1], s.tone || 'fun', s.name, Array.isArray(s.crewOrder) ? s.crewOrder : []); window.S = prev;
    for (const k in def) {
      if (s[k] === undefined || (s[k] === null && def[k] !== null && typeof def[k] === 'object')) s[k] = def[k];
      else if (def[k] && typeof def[k] === 'object' && !Array.isArray(def[k]) && s[k] && typeof s[k] === 'object' && !Array.isArray(s[k])) { for (const kk in def[k]) if (s[k][kk] === undefined) s[k][kk] = def[k][kk]; }
    }
    for (const id of s.crewOrder || []) { const c = s.crew[id] = s.crew[id] || {}; const d0 = { bond: 50, task: 'with', down: 0, gone: false, hunger: 0, sick: false, sickDays: 0 }; for (const kk in d0) if (c[kk] === undefined) c[kk] = d0[kk]; }
    ['cash', 'energy', 'hunger', 'health', 'morale', 'loan', 'arrears', 'fuel', 'time', 'day', 'torps'].forEach(k => { if (typeof s[k] !== 'number' || !isFinite(s[k])) s[k] = def[k]; });
    if (!Array.isArray(s.cargo)) s.cargo = []; s.cargo = s.cargo.filter(c => c && SS.ITEMS[c.kind] && isFinite(c.value));
  } catch (e) {}
  s.course = s.course || {}; s.trialLog = s.trialLog || [];
  s.casino = s.casino || { today: 0, net: 0, chips: 0, best: 0 };
  if (s.nextTrial == null) s.nextTrial = 0;
  if (s.trial === undefined) s.trial = null;
  return s;
};

/* =========================================================
   GÜNÜN AVI VE MEYDAN OKUMA
   ========================================================= */
const huntTitle = h => h.mode === 'daily' ? `Günün Avı #${SS.dailyNo()}` : h.mode === 'challenge' ? 'Meydan okuma' : 'Antrenman turu';
SS.huntResultModal = () => {
  const h = SS.lastHunt, d = SS.dailyData();
  if (window.S) render();
  const ch = h.mode !== 'challenge' ? '' : h.score >= h.target
    ? `<div class="alert info">Meydan okumayı geçtin: ${h.target} puana karşı ${h.score}. Şimdi sıra onda.</div>`
    : `<div class="alert">${h.target} puanı geçemedin; arada ${h.target - h.score} puan var. Bir daha dene.</div>`;
  SS.modal(`<p class="eyebrow">${huntTitle(h)} · ${SS.ZONES.find(z => z.id === h.zone).name}</p><h2>${h.score} puan</h2>
    <p class="grid-emoji">${h.grid || '—'}</p>${ch}
    ${h.mode === 'daily' && h.first ? '<p class="muted">Bugünkü resmî skorun kaydedildi. Yarın herkes için yeni bir alan açılır.</p>' : ''}
    <ul class="kv"><li><span>Meydan okuma kodun</span><b>${SS.challengeCode(h.seed, h.score)}</b></li><li><span>En iyi skorun</span><b>${d.best}</b></li></ul>
    <div class="row">${btn('Paylaş', 'shareHunt', {}, 'primary')}${btn('Tekrar oyna', 'playAgain', {}, 'ghost')}${btn('Tamam', 'close', {}, 'ghost')}</div>`);
};
function dailyPanel() {
  const d = SS.dailyData(), key = SS.todayKey(), mine = d.days[key], seed = SS.dailySeed(), Z = SS.ZONES.find(z => z.id === SS.seedZone(seed));
  const past = Object.entries(d.days).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 5);
  const pc = SS.pendingChallenge;
  SS.modal(`<p class="eyebrow">Günün Avı #${SS.dailyNo()} · ${Z.name}</p><h2>Herkes için aynı alan</h2>
    <p>45 saniye, herkes için aynı enkaz düzeni. Saat, enerji ve yakıt harcamaz; oyundaki ekonomini etkilemez. Skorunu paylaş, arkadaşların seni geçmeye çalışsın.</p>
    ${mine ? `<p>Bugünkü resmî skorun: <b>${mine.score}</b></p><p class="grid-emoji">${mine.grid || '—'}</p>` : ''}
    <div class="row">${btn(mine ? 'Antrenman turu' : 'Günün Avı\'nı oyna', 'playDaily', {}, 'primary')}${mine ? btn('Skorunu paylaş', 'shareDaily', {}, 'ghost') : ''}</div>
    ${pc ? `<div class="alert info">Bir meydan okuma bağlantısıyla geldin: <b>${pc.score} puan</b>. ${btn('Kabul et', 'playChallenge', {}, 'sm')}</div>` : ''}
    <p class="label">Arkadaşından gelen kod</p><input id="chCode" class="code-in" placeholder="MO-XXXX-123" autocomplete="off">
    <div class="row">${btn('Koda karşı oyna', 'playChallenge', { code: 1 }, 'ghost')}${btn('Kapat', 'close', {}, 'ghost')}</div>
    ${past.length ? `<p class="label">Son günler</p><ul class="kv">${past.map(([k, v]) => `<li><span>#${v.no} · ${k.slice(5)}</span><b>${v.score}</b></li>`).join('')}</ul>` : ''}
    <small>En iyi skorun: ${d.best || 0}</small>`);
}
Object.assign(ACT, {
  dailyPanel,
  copyShare: () => SS.copyShare(),
  playDaily: () => { const d = SS.dailyData(); SS.closeModal(); SS.startHunt({ seed: SS.dailySeed(), mode: d.days[SS.todayKey()] ? 'practice' : 'daily' }); },
  playAgain: () => { const h = SS.lastHunt; if (!h) return; SS.closeModal(); SS.startHunt({ seed: h.seed, mode: h.mode === 'challenge' ? 'challenge' : 'practice', target: h.target }); },
  playChallenge: d => {
    let c = null;
    if (d.code) { const el = document.getElementById('chCode'); c = SS.parseChallenge(el && el.value); if (!c) return SS.toast('Kod okunamadı. Örnek: MO-2K9F-340', 'bad'); }
    else c = SS.pendingChallenge;
    if (!c) return;
    SS.pendingChallenge = null;
    try { if (/meydan-/i.test(location.hash)) history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    SS.closeModal(); SS.startHunt({ seed: c.seed, mode: 'challenge', target: c.score });
  },
  shareHunt: () => SS.shareHunt(),
  shareDaily: () => { const d = SS.dailyData().days[SS.todayKey()]; if (!d) return; SS.lastHunt = { score: d.score, grid: d.grid, seed: SS.dailySeed(), mode: 'daily', zone: SS.seedZone(SS.dailySeed()) }; SS.shareHunt(); },
  shareDay: () => SS.shareDay(),
  shareWeek: () => SS.shareWeek(),
  shareMoment: async () => {
    const h = SS.highlight; if (!h) return; h.shared = true;
    const image = await SS.makeCard({ title: 'Anı karesi', sub: h.zone || '', big: h.value ? fmt(h.value) : '', lines: [h.text, `${SS.rank().name} · ${SS.shipName()}`], crew: SS.crewList(), highlight: h });
    SS.share({ image, text: `Space Scrapper · ${h.text}\n${SS.CHALLENGE_URL}` });
  },
});

/* =========================================================
   AKADEMİ: lisanslar işleri ve hurda katmanlarını açar
   ========================================================= */
SS.LICENSES = {
  deliver: { name: 'Kargo Pilotu Lisansı', short: 'Teslimat', icon: 'deliver', lessons: 2, fee: 110, desc: 'İş Merkezi\'nde kargo teslimatı ilanları açılır.',
    tips: ['Ders notu: İnişte hızı pistin hemen üstünde kes; yan rüzgârda burnu rüzgâra çevir.'] },
  sort: { name: 'Ayrıştırma Sertifikası', short: 'Ayrıştırma', icon: 'sort', lessons: 1, fee: 70, desc: 'Ayrıştırma tesisinde vardiya alabilirsin.', tips: [] },
  repair: { name: 'Devre Teknisyeni Belgesi', short: 'Tamir', icon: 'repair', lessons: 2, fee: 130, desc: 'Tamir işleri açılır. Riski az, kazancı istikrarlı.',
    tips: ['Ders notu: Devreyi kaynaktan değil, çıkıştan geriye doğru düşün; dönmeyen parçalar yolu belirler.'] },
  order: { name: 'Ticaret Ruhsatı', short: 'Sipariş', icon: 'shop', lessons: 2, fee: 100, desc: 'Sipariş ilanları açılır: kargodaki eşyaları pazardan çok daha iyi fiyata teslim edersin.',
    tips: ['Ders notu: Aynı türden çok satarsan pazar doyar ve fiyat düşer. Siparişler bu sorunu yaşamaz.'] },
  scrap2: { name: 'Derin Tarama Sertifikası', short: 'Derin tarama', icon: 'radar', lessons: 3, fee: 160, desc: 'Hurda avında kristal, uydu, sümüksü ve kayıp eserler görünür; Gaz Devi Halkası açılır.',
    tips: ['Ders notu: Kristaller ağırdır ama değerlidir. Vinç geliştirmesi olmadan sabır gerekir.', 'Ders notu: Kayıp eserler albüm setlerini tamamlar; her set bir dekor, para ve unvan verir.'] },
  scrap3: { name: 'Tehlikeli Bölge Lisansı', short: 'Tehlikeli bölge', icon: 'tank', lessons: 3, fee: 240, req: 'scrap2', desc: 'Korsan Sektörü ve Kayıp Yıldız yolu açılır. En zengin, en riskli sular.',
    tips: ['Ders notu: Korsan Sektörü\'nde tanklar zincirleme patlar. Kancayı önce kenarlara at.', 'Ders notu: Büyük tank olmadan uzak bölgeye çıkma; dönüş yakıtı da hesapta.'] },
};
SS.LIC_ORDER = ['deliver', 'sort', 'repair', 'order', 'scrap2', 'scrap3'];
SS.ZONE_LIC = { belt: null, yard: null, gas: 'scrap2', pirate: 'scrap3', lost: 'scrap3' };
SS.hasLic = id => !window.S || !S.lic || !!S.lic[id];
SS.zoneLic = z => !SS.ZONE_LIC[z] || SS.hasLic(SS.ZONE_LIC[z]);
SS.LESSON = { mins: 90, energy: 15 };
const lessonFee = L => Math.round(L.fee * SS.dv('costs'));
SS.lockedJobsNote = () => {
  const miss = ['deliver', 'repair', 'sort', 'order'].filter(k => !SS.hasLic(k));
  return miss.length ? `<p class="muted lic-note">Kilitli ilanlar: ${miss.map(k => SS.LICENSES[k].short).join(', ')}. Akademi'de lisans alınca bu panoya düşer.</p>` : '';
};

const QUIZ = {
  deliver: [
    ['İnişte gemiyi devirmemek için ne yapmalısın?', 'Pistin üstünde yavaşlayıp düz inmek', 'Motoru kapatıp süzülmek', 'Yan yatarak inmek'],
    ['Teslimat ilanındaki "rüzgârlı" etiketi ne demek?', 'Gemiyi yana iten akıntılar olacak', 'Ödeme hızlı gelecek', 'Yakıt bedava'],
    ['Teslimata çıkmadan önce neye bakmalısın?', 'Yakıtın ilandaki miktara yetip yetmediğine', 'Ambarın boyasına', 'Kantinin menüsüne'],
    ['Pilotluk becerisi teslimatta ne sağlar?', 'Daha geniş iniş toleransı ve ek yakıt', 'Daha çok yolcu', 'Krell indirimi'],
  ],
  repair: [
    ['Devre bulmacasında amaç nedir?', 'Enerjiyi kaynaktan çıkışa kesintisiz ulaştırmak', 'Bütün kabloları kesmek', 'Parçaları söküp satmak'],
    ['Mühendislik becerisi tamirde ne kazandırır?', 'Ek süre ve ipucu', 'Daha büyük devre', 'Bedava yakıt'],
    ['"İpucusuz" etiketli işte ne olur?', 'Yardım ışıkları yanmaz', 'Ödeme yapılmaz', 'Devre küçülür'],
    ['Tamirde kimler yardım edebilir?', 'Ela ve Tolga', 'Krell', 'Rex'],
  ],
  order: [
    ['Sipariş teslim etmek için ne gerekir?', 'Kargonda istenen eşyadan yeterince olması', 'Akademi diploması', 'Kumarhane kartı'],
    ['Siparişler neden cazip?', 'Pazardan çok daha iyi fiyat öder', 'Enerji kazandırır', 'Borcu siler'],
    ['Pazarda aynı türden çok satarsan ne olur?', 'Fiyat düşer', 'Fiyat artar', 'Hiçbir şey olmaz'],
    ['Sipariş teslimi kaç enerji harcar?', 'Hiç harcamaz', '30 enerji', 'Bütün enerjini'],
  ],
  scrap2: [
    ['Enerji kristalleri en çok nerede bulunur?', 'Gaz Devi Halkası', 'Asteroit Kuşağı', 'Krell\'in kasası'],
    ['Patlayıcı tankı kancalarsan ne olur?', 'Çevresindekilerle birlikte patlar', 'Değeri ikiye katlanır', 'Yakıtın dolar'],
    ['Aynı bölgeye sık dalarsan ne olur?', 'Stok azalır, her gece biraz yenilenir', 'Bölge sonsuza dek kapanır', 'Değerler artar'],
    ['Kayıp eserler ne işe yarar?', 'Albüm setlerini tamamlar ve ödül verir', 'Yakıt olarak yanar', 'Borcu yarıya indirir'],
  ],
  scrap3: [
    ['Korsan Sektörü\'nün en büyük tehlikesi ne?', 'Her yerde patlayıcı tanklar', 'Sümüksüler', 'Dondurucu soğuk'],
    ['Kayıp Yıldız\'a giden yolu ne açar?', 'Halcyon kayıtlarının beş parçası', 'Rex\'i yenmek', 'Kumarda büyük kazanç'],
    ['Uzak bölgeye dalmadan önce ne gerekir?', 'Yeterli yakıt ve büyük tank', 'Yeni boya', 'Kantin üyeliği'],
    ['Torpido ne işe yarar?', 'Ağır kayaları parçalar', 'Gemiyi hızlandırır', 'Borcu öder'],
  ],
};
const BIN_NAMES = ['Metal', 'Organik', 'Tehlikeli'];
function quizFor(id) {
  if (id === 'sort') return SS.SORT_POOL.slice().sort(() => Math.random() - .5).slice(0, 3).map(o => [`"${o.name}" hangi kutuya gider?`, BIN_NAMES[o.bin], ...BIN_NAMES.filter((_, i) => i !== o.bin)]);
  return QUIZ[id].slice().sort(() => Math.random() - .5).slice(0, 3);
}
let QZ = null;
function quizView() {
  const q = QZ.qs[QZ.i], L = SS.LICENSES[QZ.id];
  if (!q.order) q.order = [1, 2, 3].sort(() => Math.random() - .5);
  SS.modal(`<p class="eyebrow">${L.name} · sınav · soru ${QZ.i + 1}/3</p><h2>${esc(q[0])}</h2>
    ${QZ.msg ? `<p class="${QZ.ok ? 'pos' : 'neg'}">${QZ.msg}</p>` : ''}
    <div class="quiz">${q.order.map(k => btn(esc(q[k]), 'quizAns', { k }, 'block ghost', QZ.locked)).join('')}</div>
    <small>Geçmek için 3 sorudan 2'sini bil. Doğru: ${QZ.right}</small>`);
}
function quizEnd() {
  if (!window.S) { QZ = null; return; }
  const L = SS.LICENSES[QZ.id], pass = QZ.right >= 2, c = S.course[QZ.id] = S.course[QZ.id] || { n: 0, last: 0 };
  if (pass) {
    S.lic[QZ.id] = 1; c.n = L.lessons; S.boardWin = -1; SS.refreshBoard(true); SS.sfx('big');
    S.today.lesson = (S.today.lesson || 0) + 1; SS.checkGoals(); SS.checkAch && SS.checkAch(); SS.save(); render();
    SS.modal(`<div class="story">${icon(L.icon, 56)}<div><p class="eyebrow">Sınav geçildi · ${QZ.right}/3</p><h2>${L.name}</h2></div></div><p>${L.desc}</p>
      <p class="muted">${QZ.id === 'scrap2' || QZ.id === 'scrap3' ? 'Hangar\'daki hurda bölgeleri ve İş Merkezi\'ndeki sözleşmeler güncellendi.' : 'İş Merkezi panosu yenilendi; yeni ilanlar seni bekliyor.'}</p>
      <div class="row">${btn('Harika', 'close', {}, 'primary')}</div>`);
  } else {
    SS.sfx('bad'); SS.mood(-3); SS.save(); render();
    SS.modal(`<p class="eyebrow">Sınav · ${QZ.right}/3</p><h2>Bu sefer olmadı</h2><p>Eğitmen not defterini kapattı: "Yarın tekrar gel, sınav ücreti yine alınır."</p><div class="row">${btn('Tamam', 'close', {}, 'primary')}</div>`);
  }
  QZ = null;
}
function academyView() {
  const [tab, bar] = SS.ui.subTabs('academy', [['lic', 'Lisanslar'], ['skill', 'Beceriler']]);
  let h = bar;
  if (tab === 'lic') {
    const owned = SS.LIC_ORDER.filter(SS.hasLic).length;
    h += panel('Lisans ofisi', `<p class="muted">Kariyerine yalnızca hurda sözleşmeleriyle başlarsın. Her lisans birkaç dersten oluşur; günde bir ders alınır, son ders kısa bir sınavdır. Ders ${dur(SS.LESSON.mins)} ve ${SS.LESSON.energy} enerji sürer.</p>
      <div class="track"><i style="width:${pct(owned, SS.LIC_ORDER.length)}%"></i></div><small>${owned}/${SS.LIC_ORDER.length} lisans</small>`, { code: 'LS', aside: `${owned}/${SS.LIC_ORDER.length}` });
    h += `<div class="list lic-list">${SS.LIC_ORDER.map(id => {
      const L = SS.LICENSES[id], own = SS.hasLic(id), c = S.course[id] || { n: 0, last: 0 }, fee = lessonFee(L);
      const reqMiss = L.req && !SS.hasLic(L.req), today = c.last === S.day, final = c.n >= L.lessons - 1;
      const why = own ? null : reqMiss ? `${SS.LICENSES[L.req].name} gerekli` : today ? 'Bugünkü dersini aldın, yarın devam' : SS.jobBlock(SS.LESSON.energy, SS.LESSON.mins) || (S.cash < fee ? 'Para yetmiyor' : null);
      return `<article class="job lic ${own ? 'done' : ''}"><header><span class="pcode">LİS</span><h3>${L.name}</h3><b class="pay">${own ? '✓' : `${c.n}/${L.lessons}`}</b></header>
        <div class="row-i">${icon(L.icon, 36)}<p>${L.desc}</p></div>
        <div class="lessons">${Array.from({ length: L.lessons }, (_, i) => `<i class="${i < (own ? L.lessons : c.n) ? 'on' : ''} ${i === L.lessons - 1 ? 'exam' : ''}"></i>`).join('')}</div>
        <footer><small>${own ? 'Lisans sende' : `${final ? 'Sıradaki: sınav' : `Sıradaki: ${c.n + 1}. ders`} · ${fmt(fee)}`}</small>${own ? '<span class="pill">Lisanslı</span>' : btn(final ? 'Sınava gir' : 'Derse gir', 'lesson', { id }, 'sm primary', !!why)}</footer>${why && !own ? `<small class="why">${why}</small>` : ''}</article>`;
    }).join('')}</div>`;
    return h;
  }
  h += panel('Beceri eğitimi', `<p class="muted">Eğitim ${dur(SS.DUR.train)} ve ${SS.COST.train} enerji sürer. En fazla 5 seviye.</p><div class="list">${SS.SKILLS.map(s => {
    const lv = S.skills[s.id], cost = SS.trainCost(lv);
    return `<div class="row-item"><div><b>${s.name} · ${lv}/5</b><small>${s.desc}</small><small class="meta">Şu an: ${lv ? SS.SKILL_FX[s.id](lv) : 'etki yok'}${lv < 5 ? ` → sonraki: ${SS.SKILL_FX[s.id](lv + 1)}` : ''}</small></div>${lv >= 5 ? '<span class="pill">Usta</span>' : btn(fmt(cost), 'train', { id: s.id }, 'sm', S.cash < cost || !!SS.jobBlock(SS.COST.train, SS.DUR.train))}</div>`;
  }).join('')}</div>`, { code: 'AK' });
  return h;
}
SS.VIEWS.academy = academyView;
Object.assign(ACT, {
  lesson: d => {
    const L = SS.LICENSES[d.id]; if (!L || SS.hasLic(d.id)) return;
    const c = S.course[d.id] = S.course[d.id] || { n: 0, last: 0 };
    if (c.last === S.day) return SS.toast('Bugünkü dersini aldın.', 'bad');
    const blk = SS.jobBlock(SS.LESSON.energy, SS.LESSON.mins); if (blk) return SS.toast(blk, 'bad');
    if (!SS.spend(lessonFee(L))) return SS.toast('Para yetmiyor.', 'bad');
    SS.useJob(SS.LESSON.energy, SS.LESSON.mins); c.last = S.day;
    if (c.n < L.lessons - 1) {
      c.n++; S.today.lesson = (S.today.lesson || 0) + 1; SS.checkGoals(); SS.sfx('click'); SS.save(); render();
      return SS.modal(`<div class="story">${icon(L.icon, 52)}<div><p class="eyebrow">${L.name} · ders ${c.n}/${L.lessons}</p><h2>Ders bitti</h2></div></div>
        <p>${L.tips[(c.n - 1) % Math.max(1, L.tips.length)] || 'Eğitmen bugünü notlarla bitirdi.'}</p><p class="muted">Yarın ${c.n + 1 >= L.lessons ? 'sınava girebilirsin' : 'bir sonraki derse devam edebilirsin'}.</p>
        <div class="row">${btn('Tamam', 'close', {}, 'primary')}</div>`);
    }
    QZ = { id: d.id, qs: quizFor(d.id), i: 0, right: 0 }; render(); quizView();
  },
  quizAns: d => {
    if (!QZ || QZ.locked || !QZ.qs[QZ.i]) return;
    const ok = +d.k === 1; if (ok) QZ.right++;
    QZ.ok = ok; QZ.msg = ok ? 'Doğru!' : `Yanlış. Doğrusu: ${QZ.qs[QZ.i][1]}`; QZ.locked = true; SS.sfx(ok ? 'coin' : 'bad'); quizView();
    setTimeout(() => { if (!QZ || !window.S) { QZ = null; return; } QZ.locked = false; QZ.msg = ''; QZ.i++; if (QZ.i >= 3) quizEnd(); else quizView(); }, 900);
  },
});

SS.resetTransient = () => { QZ = null; AU = null; BUSY = false; };

/* ---------- günlük hedefler lisanslara uysun ---------- */
const GOAL_LIC = { deliver: 'deliver', repair: 'repair', sort: 'sort', order: 'order', crystal: 'scrap2' };
const goalOk = g => !GOAL_LIC[g.key] || SS.hasLic(GOAL_LIC[g.key]);
const EXTRA_GOALS = [
  () => ({ key: 'lesson', target: 1, txt: 'Akademi\'de bir ders al' }),
  () => ({ key: 'casino', target: 2, txt: 'Kumarhanede 2 el oyna' }),
];
const genGoals0 = SS.genGoals;
SS.genGoals = () => {
  for (let i = 0; i < 12; i++) { genGoals0(); if (S.goals.every(goalOk)) break; }
  S.goals = S.goals.map(g => goalOk(g) ? g : { ...pick(EXTRA_GOALS.filter(f => SS.LIC_ORDER.some(k => !SS.hasLic(k)) || f().key !== 'lesson'))(), done: false, reward: g.reward });
  if (Math.random() < .3 && S.goals.length > 2) { const e = pick(EXTRA_GOALS)(); if (e.key !== 'lesson' || SS.LIC_ORDER.some(k => !SS.hasLic(k))) S.goals[2] = { ...e, done: false, reward: rint(4, 9) * 10 }; }
};

/* =========================================================
   KLİNİK EKİ: aşı (salgın sınamasına karşı)
   ========================================================= */
const vaxPrice = () => Math.round(60 * (1 + SS.crewList().length * .5) * SS.dv('costs'));
SS.CLINIC_EXTRA = () => {
  const on = (S.vaxUntil || 0) >= S.day;
  return panel('Bağışıklık aşısı', `<div class="row-item"><div><b>Hane aşısı · 12 gün</b><small>İstasyonda salgın çıkarsa sen ve hanen etkilenmezsiniz. ${on ? `Koruma ${S.vaxUntil}. güne kadar sürüyor.` : 'Şu an korunmuyorsunuz.'}</small></div>${btn(fmt(vaxPrice()), 'vax', {}, 'sm', on || S.cash < vaxPrice() || !SS.timeOk(20))}</div>`, { code: 'AŞ' });
};
ACT.vax = () => { if (!SS.spend(vaxPrice())) return; SS.passTime(20); S.vaxUntil = S.day + 12; SS.toast('Hane aşılandı: 12 gün koruma.', 'good'); render(); };

/* =========================================================
   NEBULA KUMARHANESİ
   ========================================================= */
const CAS = { limit: 8, mins: 15, en: 3 };
const casBets = () => { const b = SS.hard() ? [25, 50, 100] : [10, 25, 50]; return S.casino.chips >= 25 ? b.concat(b[2] * 2) : b; };
const casBlock = () => !SS.isOpen('casino') ? 'Kumarhane şu an kapalı.' : S.casino.today >= CAS.limit ? `Günlük masa limitin (${CAS.limit} el) doldu.` : S.energy < CAS.en ? 'Enerjin yetmiyor.' : !SS.timeOk(CAS.mins) ? 'Saat çok geç.' : null;
let SEL = 0, CUR = null, BUSY = false;
const bet = () => { const b = casBets(); if (!b.includes(SEL)) SEL = b[0]; return SEL; };
const stake = n => {
  const blk = casBlock(); if (blk) { SS.toast(blk, 'bad'); return false; }
  if (!SS.spend(n)) { SS.toast('Para yetmiyor.', 'bad'); return false; }
  S.casino.today++; S.casino.chips++; SS.passTime(CAS.mins); S.energy = Math.max(0, S.energy - CAS.en);
  return true;
};
// Şanslı gece (her haftanın 5. günü): ödeme beklenen değeri 1,0 olacak şekilde büyütülür; kasa avantajı yok
const settle = (n, mult, ev) => {
  if (mult > 0 && ev && ev < 1 && SS.luckyNight && SS.luckyNight()) mult = mult / ev;
  const win = Math.round(n * mult);
  if (win) S.cash += win;
  S.casino.net += win - n;
  if (win > n) { SS.mood(3); S.casino.best = Math.max(S.casino.best, win - n); SS.sfx('coin'); } else { SS.mood(SS.hard() ? -3 : -1); SS.sfx('bad'); }
  S.today.casino = (S.today.casino || 0) + 1; SS.checkGoals(); SS.save(); render();
  return win;
};
const betRow = () => `<div class="row bets">${casBets().map(b => `<button class="chip-bet ${bet() === b ? 'on' : ''}" data-act="casBet" data-b="${b}" ${BUSY ? 'disabled' : ''}>${fmt(b)}</button>`).join('')}</div>`;
const casHead = (name, rule) => `<p class="eyebrow">${name} · el başı ${CAS.mins} dk, ${CAS.en} enerji · bugün ${S.casino.today}/${CAS.limit}${SS.luckyNight && SS.luckyNight() ? ' · ŞANSLI GECE' : ''}</p>${rule ? `<p class="muted">${rule}</p>` : ''}`;
const endRow = () => `<div class="row">${btn('Masadan kalk', 'close', {}, 'ghost', BUSY)}</div>`;

/* --- Yıldız Çarkı --- */
const WHEEL = [0, 2, 0, 1.5, .5, 0, 4, 0, 2, 0, 1.5, 0];
let WDEG = 0;
function drawWheel(cv) {
  const c = cv.getContext('2d'), P = SS.Art.P(), R = 116, n = WHEEL.length, a = TAU / n;
  c.clearRect(0, 0, 240, 240); c.save(); c.translate(120, 120);
  for (let i = 0; i < n; i++) {
    const m = WHEEL[i], s0 = -Math.PI / 2 + i * a - a / 2;
    c.fillStyle = m >= 4 ? P.accent : m >= 2 ? P.crystal2 : m >= 1 ? P.crystal : m > 0 ? P.metalL : i % 2 ? P.space1 : P.metalD;
    c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R, s0, s0 + a); c.closePath(); c.fill();
    c.strokeStyle = P.space0; c.lineWidth = 2; c.stroke();
    c.save(); c.rotate(s0 + a / 2); c.translate(R * .68, 0); c.rotate(Math.PI / 2);
    c.fillStyle = m ? P.space0 : P.metalL; c.font = 'bold 15px "Chakra Petch", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(m ? '×' + String(m).replace('.', ',') : '0', 0, 0); c.restore();
  }
  c.fillStyle = P.metalD; c.beginPath(); c.arc(0, 0, 18, 0, TAU); c.fill(); c.fillStyle = P.accent; c.beginPath(); c.arc(0, 0, 7, 0, TAU); c.fill();
  c.restore();
}
function wheelView(msg) {
  CUR = wheelView;
  SS.modal(`${casHead('Yıldız Çarkı', 'Bahsini seç ve çarkı çevir. Ok hangi dilimde durursa bahsinin o katı geri gelir.')}<h2>Yıldız Çarkı</h2>
    <div class="wheel-box"><canvas id="wheelCv" width="240" height="240" style="transform:rotate(${WDEG}deg)"></canvas><i class="wheel-pin"></i></div>
    <p class="cas-msg" id="casMsg">${msg || '&nbsp;'}</p>${betRow()}
    <div class="row">${btn(`Çevir · ${fmt(bet())}`, 'wheelSpin', {}, 'primary', BUSY || S.cash < bet() || !!casBlock())}</div>${endRow()}`);
  drawWheel(document.getElementById('wheelCv'));
}
ACT.wheelSpin = () => {
  if (BUSY) return; const n = bet(); if (!stake(n)) return;
  BUSY = true; const i = rint(0, WHEEL.length - 1), a = 360 / WHEEL.length;
  const target = (360 - i * a) % 360, cur = ((WDEG % 360) + 360) % 360;
  const end = WDEG + 360 * 4 + ((target - cur + 360) % 360) + rnd(-a * .3, a * .3);
  wheelView('Çark dönüyor…');
  const cv = document.getElementById('wheelCv'); WDEG = end;
  requestAnimationFrame(() => requestAnimationFrame(() => { cv.style.transition = 'transform 2.6s cubic-bezier(.15,.85,.2,1)'; cv.style.transform = `rotate(${end}deg)`; }));
  SS.sfx('fire');
  setTimeout(() => { BUSY = false; const m = WHEEL[i], w = settle(n, m, CAS_EV.wheel); wheelView(m ? `×${String(m).replace('.', ',')}: ${fmt(w)} geri aldın${w > n ? '!' : '.'}` : 'Boş dilim. Bahis kasanın.'); }, 2750);
};

/* --- Kara Delik Zarı --- */
const DICE = [['lo', 'Alçak · 2–6', 2.2], ['seven', 'Tam 7', 5], ['hi', 'Yüksek · 8–12', 2.2], ['dbl', 'Çift gelir', 5]];
const DFACE = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
let DV = [3, 4];
function diceView(msg) {
  CUR = diceView;
  SS.modal(`${casHead('Kara Delik Zarı', 'İki zar atılır. Tahminini seç: alçak ve yüksek ×2,2, tam 7 ve çift ×5 öder.')}<h2>Kara Delik Zarı</h2>
    <div class="dice"><span id="d0">${DFACE[DV[0]]}</span><span id="d1">${DFACE[DV[1]]}</span><b id="dsum">${DV[0] + DV[1]}</b></div>
    <p class="cas-msg">${msg || '&nbsp;'}</p>${betRow()}
    <div class="grid2">${DICE.map(([k, l, m]) => btn(`${l} · ×${String(m).replace('.', ',')}`, 'diceRoll', { k }, '', BUSY || S.cash < bet() || !!casBlock())).join('')}</div>${endRow()}`);
}
ACT.diceRoll = d => {
  if (BUSY) return; const n = bet(); if (!stake(n)) return;
  BUSY = true; diceView('Zarlar kara deliğe yuvarlanıyor…'); SS.sfx('click');
  const fin = [rint(1, 6), rint(1, 6)]; let k = 0;
  const iv = setInterval(() => {
    const a = document.getElementById('d0'), b = document.getElementById('d1'); if (!a) return clearInterval(iv);
    a.textContent = DFACE[rint(1, 6)]; b.textContent = DFACE[rint(1, 6)];
    if (++k > 12) {
      clearInterval(iv); DV = fin; BUSY = false;
      const s = fin[0] + fin[1], hit = d.k === 'lo' ? s <= 6 : d.k === 'hi' ? s >= 8 : d.k === 'seven' ? s === 7 : fin[0] === fin[1];
      const m = DICE.find(x => x[0] === d.k)[2], w = settle(n, hit ? m : 0, CAS_EV.dice[d.k]);
      diceView(hit ? `Toplam ${s}. Bildin: ${fmt(w)}!` : `Toplam ${s}. Bu sefer olmadı.`);
    }
  }, 70);
};

/* --- Meteor Yarışı --- */
const RACERS = [{ n: 'Kuyruklu Yıldız', m: 2, w: .44, c: 'crystal' }, { n: 'Demir Kanat', m: 3, w: .3, c: 'metalL' }, { n: 'Buz Kometi', m: 5, w: .17, c: 'crystal2' }, { n: 'Kara Ok', m: 9, w: .09, c: 'bad' }];
let RPICK = 0, RPOS = [0, 0, 0, 0];
function raceView(msg) {
  CUR = raceView; const P = SS.Art.P();
  SS.modal(`${casHead('Meteor Yarışı', 'Dört meteor pistte. Favori az, sürpriz çok öder.')}<h2>Meteor Yarışı</h2>
    <div class="race">${RACERS.map((r, i) => `<button class="lane ${RPICK === i ? 'on' : ''}" data-act="racePick" data-i="${i}" ${BUSY ? 'disabled' : ''}><span class="ln">${r.n} · ×${r.m}</span><span class="trk"><i id="rc${i}" style="left:${RPOS[i] * 92}%;background:${P[r.c]}"></i></span></button>`).join('')}</div>
    <p class="cas-msg">${msg || '&nbsp;'}</p>${betRow()}
    <div class="row">${btn(`${RACERS[RPICK].n} için bahis · ${fmt(bet())}`, 'raceGo', {}, 'primary', BUSY || S.cash < bet() || !!casBlock())}</div>${endRow()}`);
}
ACT.racePick = d => { if (BUSY) return; const i = +d.i; if (!(i >= 0 && i < RACERS.length)) return; RPICK = i; raceView(); };
ACT.raceGo = () => {
  if (BUSY) return; const n = bet(); if (!stake(n)) return;
  BUSY = true; RPOS = [0, 0, 0, 0]; raceView('Başladılar!'); SS.sfx('travel');
  let r = Math.random(), win = 0; for (let i = 0; i < RACERS.length; i++) { r -= RACERS[i].w; if (r <= 0) { win = i; break; } }
  const T = RACERS.map((_, i) => i === win ? 3.2 : rnd(3.45, 4.3)), ph = RACERS.map(() => Math.random() * 6), t0 = performance.now();
  const step = now => {
    const t = (now - t0) / 1000; let all = true;
    RACERS.forEach((_, i) => {
      const f = Math.min(1, t / T[i]); if (f < 1) all = false;
      RPOS[i] = Math.min(1, f + (f < 1 ? .035 * Math.sin(t * 3 + ph[i]) * Math.sin(f * Math.PI) : 0));
      const el = document.getElementById('rc' + i); if (el) el.style.left = (RPOS[i] * 92) + '%';
    });
    if (!all) return requestAnimationFrame(step);
    BUSY = false; const ok = win === RPICK, w = settle(n, ok ? RACERS[RPICK].m : 0, RACERS[RPICK].m * RACERS[RPICK].w);
    raceView(ok ? `${RACERS[win].n} kazandı! ${fmt(w)} aldın.` : `${RACERS[win].n} kazandı. Senin meteorun geride kaldı.`);
  };
  requestAnimationFrame(step);
};

/* --- Nebula Slotu --- */
const SYM = ['🔩', '☄️', '⭐', '🪐', '💎'], SW = [5, 4, 3, 2, 1], TRIPLE = [4, 6, 10, 16, 40], PAIR = .9;
const rollSym = () => { let r = Math.random() * 15; for (let i = 0; i < 5; i++) { r -= SW[i]; if (r <= 0) return i; } return 0; };
let SR = [4, 2, 3];
function slotView(msg) {
  CUR = slotView;
  SS.modal(`${casHead('Nebula Slotu', `Üç aynı: ${SYM.map((s, i) => `${s}×${TRIPLE[i]}`).join(' ')}. İki aynı: bahsin ×${String(PAIR).replace('.', ',')}'u geri gelir.`)}<h2>Nebula Slotu</h2>
    <div class="slot">${SR.map((s, i) => `<span id="sr${i}">${SYM[s]}</span>`).join('')}</div>
    <p class="cas-msg">${msg || '&nbsp;'}</p>${betRow()}
    <div class="row">${btn(`Kolu çek · ${fmt(bet())}`, 'slotPull', {}, 'primary', BUSY || S.cash < bet() || !!casBlock())}</div>${endRow()}`);
}
ACT.slotPull = () => {
  if (BUSY) return; const n = bet(); if (!stake(n)) return;
  BUSY = true; slotView('Makaralar dönüyor…'); SS.sfx('click');
  const fin = [rollSym(), rollSym(), rollSym()], t0 = performance.now();
  const iv = setInterval(() => {
    const t = performance.now() - t0;
    for (let i = 0; i < 3; i++) { const el = document.getElementById('sr' + i); if (!el) continue; el.textContent = t > 600 + i * 380 ? SYM[fin[i]] : SYM[rint(0, 4)]; if (t > 600 + i * 380) el.classList.add('stop'); }
    if (t > 600 + 2 * 380 + 120) {
      clearInterval(iv); SR = fin; BUSY = false;
      const tri = fin[0] === fin[1] && fin[1] === fin[2], pair = !tri && (fin[0] === fin[1] || fin[1] === fin[2] || fin[0] === fin[2]);
      const m = tri ? TRIPLE[fin[0]] : pair ? PAIR : 0, w = settle(n, m, CAS_EV.slot);
      slotView(tri ? `Üçlü ${SYM[fin[0]]}! ${fmt(w)} kazandın!` : pair ? `İkili: ${fmt(w)} geri geldi.` : 'Boş. Makine sana göz kırptı.');
    }
  }, 60);
};

// Beklenen geri dönüş (1 = başabaş); kasa avantajı = 1 − EV
const CAS_EV = (() => {
  const p = SW.map(w => w / 15), tri = p.reduce((a, q, i) => a + q * q * q * TRIPLE[i], 0);
  const allSame = p.reduce((a, q) => a + q * q * q, 0), pairP = p.reduce((a, q) => a + 3 * q * q * (1 - q), 0);
  return { wheel: WHEEL.reduce((a, m) => a + m, 0) / WHEEL.length, dice: { lo: 2.2 * 15 / 36, hi: 2.2 * 15 / 36, seven: 5 * 6 / 36, dbl: 5 * 6 / 36 },
    race: Math.max(...RACERS.map(r => r.m * r.w)), raceMin: Math.min(...RACERS.map(r => r.m * r.w)), slot: tri + pairP * PAIR, _all: allSame };
})();
SS.CAS_EV = CAS_EV;
const edge = ev => `%${Math.max(0, Math.round((1 - ev) * 100))}`;
SS.casEdges = () => ({ wheel: edge(CAS_EV.wheel), dice: `${edge(CAS_EV.dice.lo)}–${edge(CAS_EV.dice.seven)}`, race: `${edge(CAS_EV.race)}–${edge(CAS_EV.raceMin)}`, slot: edge(CAS_EV.slot) });
function casinoView() {
  const [tab, bar] = SS.ui.subTabs('casino', [['games', 'Masalar'], ['lounge', 'Salon']]);
  const blk = casBlock();
  let h = bar;
  if (tab === 'games') {
    const G = [
      ['cards', 'cards', 'Yüksek mi alçak mı', 'Gus\'un kart masası buraya taşındı. Seriyi uzat, potu büyüt, doğru anda çekil. Kasa avantajı: beceriye bağlı.', `Bu gece ${Math.max(0, 4 - S.cardsToday)} el`, S.cardsToday >= 4 || S.energy < 5 || !SS.timeOk(20)],
      ['wheel', 'radar', 'Yıldız Çarkı', 'On iki dilimli çark. ×4 dilimi tek, boşlar çok.', '×0 – ×4', !!blk],
      ['dice', 'box', 'Kara Delik Zarı', 'Alçak, yüksek, tam 7 ya da çift. Hızlı ve acımasız.', '×2,2 – ×5', !!blk],
      ['race', 'ship', 'Meteor Yarışı', 'Dört meteor, dört oran. Favoriye mi, sürprize mi?', '×2 – ×9', !!blk],
      ['slot', 'crystal', 'Nebula Slotu', 'Üç makara, beş sembol. Elmas üçlüsü ×40.', '×0,9 – ×40', !!blk],
    ];
    const E = SS.casEdges(), lucky = SS.luckyNight && SS.luckyNight();
    G.forEach(g => { if (E[g[0]]) g[3] += ` Kasa avantajı: ${lucky ? '<b>bu gece yok</b>' : E[g[0]]}.`; });
    h += lucky ? `<div class="alert info"><b>Şanslı gece!</b> Bu gece ödemeler kasa avantajını sıfırlayacak kadar büyük: uzun vadede başabaş oynarsın.</div>` : `<p class="muted cas-note">Şanslı gece her haftanın 5. günü (sıradaki: ${S.day + ((5 - S.day % 7) + 7) % 7}. gün): o gece kasa avantajı yok.</p>`;
    h += `<p class="muted cas-note">${SS.hasCrew('ela') ? 'Ela kapıda Pıtırcık\'la bekliyor; çocuklar giremez. ' : ''}${blk ? `<b>${blk}</b>` : `Bugün ${S.casino.today}/${CAS.limit} el oynadın. Kazanç Rex yarışına sayılmaz.`}</p>`;
    h += `<div class="list">${G.map(([id, ic, n, desc, odds, dis]) => `<article class="job j-cas"><header><span class="pcode">MSA</span><h3>${n}</h3><b class="pay">${odds}</b></header>
      <div class="row-i">${icon(ic, 36)}<p>${desc}</p></div><footer><small>${id === 'cards' ? '20 dk · 5 enerji' : `${CAS.mins} dk · ${CAS.en} enerji`}</small>${btn('Otur', 'casPlay', { g: id }, 'sm primary', dis)}</footer></article>`).join('')}</div>`;
    return h;
  }
  const vip = S.casino.chips >= 25;
  h += panel('Salon', `<div class="row-i">${face('gus', 48)}<p>${SS.fun() ? 'Gus hem kantini hem buradaki kart masasını işletiyor. "İki iş, tek önlük," diyor.' : 'Gus masaları izliyor. Kasa hep kazanır; bunu herkesten iyi o bilir.'}</p></div>
    <ul class="kv"><li><span>Toplam oynanan el</span><b>${S.casino.chips}</b></li><li class="${S.casino.net < 0 ? 'neg' : ''}"><span>Toplam kâr / zarar</span><b>${S.casino.net < 0 ? '−' + fmt(-S.casino.net) : fmt(S.casino.net)}</b></li><li><span>En büyük kazanç</span><b>${fmt(S.casino.best)}</b></li></ul>
    <p class="label">Nebula üyeliği</p><div class="track ${vip ? 'win' : ''}"><i style="width:${pct(S.casino.chips, 25)}%"></i></div>
    <small>${vip ? 'Gümüş üyesin: daha yüksek bahis açıldı.' : `25 elde Gümüş üyelik: daha yüksek bahis. ${25 - S.casino.chips} el kaldı.`}</small>`, { code: 'SL' });
  h += panel('Sorumlu oyun', `<p class="muted">Masalar uzun vadede kasaya kazandırır. Günde en fazla ${CAS.limit} el oynanır; kaybedince moral düşer, kazanınca yükselir. Borç taksitini kumara yatırma: Krell affetmez.</p>`, { code: 'NOT' });
  return h;
}
SS.VIEWS.casino = casinoView;
Object.assign(ACT, {
  casBet: d => { if (BUSY) return; SEL = +d.b; CUR && CUR(); },
  casPlay: d => {
    if (d.g === 'cards') return ACT.cards();
    BUSY = false; ({ wheel: wheelView, dice: diceView, race: raceView, slot: slotView })[d.g]();
  },
});

/* =========================================================
   ÖDÜLLÜ REKLAM: enerji
   Yerel uygulama reklam sağlarsa (SS_NATIVE.ads) gerçek reklam gösterilir; yoksa kısa bir sponsor arası yer tutucusu.
   ========================================================= */
SS.adsLeft = () => window.S ? Math.max(0, SS.AD.perDay - ((S.today && S.today.ads) || 0)) : 0;
SS.showRewardedAd = done => {
  const n = SS.native && SS.native();
  if (n && n.ads) { SS._adDone = done; n.post({ type: 'ad' }); return; }
  const T = 5; let t = 0;
  SS.modal(`<p class="eyebrow">Sponsor arası</p><h2>Enerji yükleniyor…</h2><div class="ad-box"><b>Space Scrapper</b><small>Reklam alanı</small></div>
    <div class="track"><i id="adBar" style="width:0%"></i></div><p class="muted" id="adTxt">${T} saniye</p>`);
  const iv = setInterval(() => {
    t++; const bar = document.getElementById('adBar'), tx = document.getElementById('adTxt');
    if (!bar) { clearInterval(iv); return; }
    bar.style.width = (t / T * 100) + '%'; tx.textContent = t >= T ? 'Tamam' : `${T - t} saniye`;
    if (t >= T) { clearInterval(iv); SS.closeModal(); done(); }
  }, 1000);
};
window.SS_AD_DONE = ok => { const d = SS._adDone; SS._adDone = null; if (ok && d) d(); else if (!ok) SS.toast('Reklam tamamlanmadı; enerji verilmedi.', 'bad'); };
ACT.adEnergy = () => {
  if (SS.adsLeft() <= 0) return SS.toast('Bugünkü reklam hakların bitti. Yarın yenilenir.', 'bad');
  if (S.energy >= SS.maxEnergy()) return SS.toast('Enerjin zaten dolu.');
  SS.showRewardedAd(() => {
    S.today.ads = (S.today.ads || 0) + 1; S.stats.ads = (S.stats.ads || 0) + 1;
    const e0 = S.energy; S.energy = Math.min(SS.maxEnergy(), S.energy + SS.AD.energy);
    SS.toast(`Enerji +${S.energy - e0} · bugün ${SS.adsLeft()} reklam hakkın kaldı`, 'good'); SS.sfx('big'); SS.save(); SS.render();
  });
};

/* =========================================================
   SINAMALAR: 4–10 günde bir oyuncuyu zorlayan olaylar
   ========================================================= */
const capPay = n => { const p = Math.min(S.cash, Math.round(n)); S.cash -= p; return p; };
SS.TRIALS = [
  { id: 'raid', icon: 'tank', title: 'Kızıl Pençe haraç istiyor', game: 'shooter', gameName: 'Modülü savun',
    demand: () => clamp(Math.round((S.cash * .22 + S.day * 4) / 10) * 10, 180, 1400),
    text: { easy: 'Kızıl Pençe korsanları yaşam modülünün önüne park etti. Hoparlörden bağırıyorlar: "Ya parayı verirsin ya da kanepeni alırız!" Kanepeyi gerçekten seviyorlar.', hard: 'Kızıl Pençe korsanları modülünü kuşattı. Haraç ödenmezse gece içeri girecekler.' },
    loseDesc: 'Bir dekor çalınır ya da daha fazla para gider; moral ve sağlık düşer',
    lose(T) {
      const placed = S.decor.map((id, i) => id ? i : -1).filter(i => i >= 0), out = [];
      if (placed.length && Math.random() < .6) { const i = pick(placed), d = SS.DECOR.find(x => x.id === S.decor[i]); S.decor[i] = null; out.push(`Korsanlar "${d ? d.name : 'bir dekor'}" eşyanı söküp götürdü.`); out.push(`Ayrıca ${fmt(capPay(T.demand * .7))} aldılar.`); }
      else out.push(`Korsanlar kasandan ${fmt(capPay(T.demand * 1.5))} aldı.`);
      const tk = Math.min(S.torps, 1); S.torps -= tk; if (tk) out.push('Torpidonu da götürdüler.');
      SS.mood(-12); S.health = clamp(S.health - 10, 0, 100); out.push('Moral −12, sağlık −10.'); return out;
    },
    win(T) { const b = Math.round(T.demand * .3); SS.earn(b); SS.mood(8); return [`Rıhtım İdaresi korsanları kovaladığın için ${fmt(b)} ödül gönderdi. Moral +8.`]; } },
  { id: 'meteor', icon: 'boulder', title: 'Meteor yağmuru yaklaşıyor', game: 'shield', gameName: 'Kalkanı yönet',
    demand: () => clamp(Math.round((160 + S.day * 9) / 10) * 10, 180, 1100),
    text: { easy: 'Rasathane uyarıyor: bu gece taş yağacak. Kalkan kiralayabilirsin ya da eski kalkanı elle çevirip şansını deneyebilirsin. Pıtırcık kafasına tencere geçirdi bile.', hard: 'Meteor yağmuru yaklaşıyor. Kiralık kalkan pahalı. Elle yönetmek riskli.' },
    loseDesc: 'Onarım faturası, sağlık kaybı, kargodan parça kaybı',
    lose(T) {
      const out = [`Onarım faturası: ${fmt(capPay(T.demand * 1.6))}.`], n = Math.min(S.cargo.length, 3);
      if (n) { S.cargo.splice(0, n); out.push(`Kargodan ${n} parça uzaya savruldu.`); }
      S.health = clamp(S.health - 15, 0, 100); S.fuel = Math.max(0, S.fuel - 15); out.push('Sağlık −15, sızıntıdan 15 yakıt kaybı.'); return out;
    },
    win() { SS.mood(6); const k = pick(['crystal', 'rock', 'plate']); SS.addCargo(k, SS.ITEMS[k].val * SS.SCRAP_VAL); return [`Kalkan dayandı. Parçalanan meteorlardan biri kargona ${SS.ITEMS[k].name} bıraktı. Moral +6.`]; } },
  { id: 'virus', icon: 'bug', title: 'Hesabına virüs bulaştı', game: 'whack', gameName: 'Virüsü temizle',
    demand: () => clamp(Math.round((S.cash * .18 + S.day * 3) / 10) * 10, 140, 1100),
    text: { easy: 'Ekranında dans eden bir kurbağa var ve fidye istiyor. Kurbağa sevimli ama cüzdanını boşaltmaya kararlı.', hard: 'Fidye yazılımı istasyon hesabına sızdı. Ödemezsen hesabından para çekilecek.' },
    loseDesc: 'Hesaptan daha fazla para çekilir, moral düşer',
    lose(T) { const out = [`Virüs hesabından ${fmt(capPay(T.demand * 1.6))} çekti.`]; SS.mood(-10); if (S.board) { S.board.forEach(b => { if (!b.done && Math.random() < .5) b.done = true; }); out.push('İlan panosundaki işlerin yarısı silindi.'); } out.push('Moral −10.'); return out; },
    win() { SS.mood(6); S.rep.repair = (S.rep.repair || 0) + 1; return ['Virüsü sildin. Haber yayıldı; tamir itibarın arttı. Moral +6.']; } },
  { id: 'plague', icon: 'slime', title: 'İstasyonda salgın', game: 'memory', gameName: 'Laboratuvara gir',
    demand: () => Math.round((90 + S.day * 1.5) * (1 + SS.crewList().length * .6) * SS.dv('costs')),
    text: { easy: 'Sümüksü gribi istasyonu sardı. Herkes yeşil hapşırıyor. Klinik ilaç satıyor ya da laboratuvarda formülü kendin tutturabilirsin.', hard: 'Bulaşıcı bir hastalık yayılıyor. İlaç pahalı; laboratuvarda formülü kendin karıştırmayı deneyebilirsin.' },
    loseDesc: 'Sağlık ciddi düşer, hane üyeleri hastalanır',
    lose() { S.health = clamp(S.health - 22, 0, 100); S.energy = Math.max(0, S.energy - 15); SS.crewList().forEach(id => { S.crew[id].sick = true; }); SS.mood(-8); return ['Hastalık haneye girdi. Sağlık −22, enerji −15, moral −8. Hane üyeleri hasta; ilaç almaları gerekecek.']; },
    win() { SS.mood(8); SS.earn(80); return ['Formülü tutturdun. Klinik fazla dozları ₡80\'e satın aldı. Moral +8.']; } },
  { id: 'audit', icon: 'box', title: 'Rıhtım denetimi', game: 'audit', gameName: 'Evrakları kontrol et',
    demand: () => clamp(Math.round((140 + S.day * 7) / 10) * 10, 160, 900),
    text: { easy: 'Denetçi Bayan Kılçık geldi. Evraklarında "tutarsızlık" kokusu almış. Ya cezayı ödersin ya da belgeleri satır satır birlikte kontrol edersiniz.', hard: 'Rıhtım denetçisi kayıtlarında tutarsızlık iddia ediyor. Ceza ödemezsen belgeleri tek tek kontrol edeceksiniz.' },
    loseDesc: 'Daha yüksek ceza ve deponun yarısına el konur',
    lose(T) { const out = [`Ceza kesildi: ${fmt(capPay(T.demand * 1.7))}.`]; S.fuel = Math.floor(S.fuel / 2); out.push('Yakıt deposunun yarısına el kondu.'); SS.mood(-6); out.push('Moral −6.'); return out; },
    win() { SS.mood(5); S.fuel = Math.min(SS.tankCap(), S.fuel + 20); return ['Denetçi hatalı çıktı ve özür olarak 20 birim yakıt bıraktı. Moral +5.']; } },
];
const trialDef = id => SS.TRIALS.find(t => t.id === id);
const trialGap = () => { const hz = SS.dv('hazard'); return hz > 1 ? rint(4, 6) : hz < 1 ? rint(6, 9) : rint(4, 8); };
SS.rollTrial = () => {
  if (!S.nextTrial) { S.nextTrial = Math.max(6, S.day + trialGap()); return; }
  if (S.trial && S.trial.done) S.trial = null;
  if (S.day < S.nextTrial || S.trial) return;
  if (Math.random() < .2) { S.nextTrial = S.day + rint(1, 2); return; } // şans: biraz gecikebilir
  const last = (S.trialLog[S.trialLog.length - 1] || {}).id;
  const D = pick(SS.TRIALS.filter(t => t.id !== last && (!t.when || t.when())));
  S.nextTrial = S.day + trialGap();
  const text = tx(D.text);
  if (D.id === 'plague' && (S.vaxUntil || 0) >= S.day) {
    S.trial = { id: D.id, day: S.day, demand: 0, head: 'Salgın çıktı ama aşın seni korudu.', text, done: true, res: 'immune' };
    S.trialLog.push({ day: S.day, id: D.id, res: 'immune' }); SS.mood(4); SS.notes.push('İstasyonda salgın çıktı ama aşın seni ve haneni korudu. Moral +4.'); return;
  }
  S.trial = { id: D.id, day: S.day, demand: D.demand(), head: `Sınama: ${D.title}. Gün bitmeden karar ver.`, text, done: false };
};
function trialEnd(res, lines) {
  const T = S.trial, D = trialDef(T.id); T.done = true; T.res = res;
  S.trialLog.push({ day: S.day, id: T.id, res });
  const wins = S.trialLog.filter(x => x.res === 'won').length;
  if (wins >= 3 && !(S.titles || []).includes('İstasyon Bekçisi')) { S.titles = S.titles || []; S.titles.push('İstasyon Bekçisi'); lines.push('Yeni unvan: İstasyon Bekçisi.'); }
  SS.checkAch && SS.checkAch(); SS.save(); render();
  SS.modal(`<div class="story">${icon(D.icon, 52)}<div><p class="eyebrow">Sınama · ${res === 'won' ? 'kazandın' : res === 'paid' ? 'ödedin' : 'kaybettin'}</p><h2>${D.title}</h2></div></div>
    ${lines.map(l => `<p>${esc(l)}</p>`).join('')}<div class="row">${btn('Tamam', 'close', {}, 'primary')}</div>`);
}
SS.trialModal = () => {
  const T = S.trial; if (!T) return SS.flow();
  const D = trialDef(T.id), fightBlk = S.energy < 8 ? 'Enerjin yetmiyor (8)' : !SS.timeOk(30) ? 'Saat çok geç' : null;
  if (T.done) return SS.modal(`<p class="eyebrow">Sınama</p><h2>${D.title}</h2><p>${esc(T.head)}</p><div class="row">${btn('Tamam', 'close', {}, 'primary')}</div>`);
  const tolga = SS.hasCrew('tolga') && !S.crew.tolga.down && !T.haggled;
  SS.modal(`<div class="story">${icon(D.icon, 56)}<div><p class="eyebrow">Sınama · Gün ${S.day}</p><h2>${D.title}</h2></div></div><p>${esc(T.text)}</p>
    <ul class="kv"><li><span>Talep</span><b>${fmt(T.demand)}</b></li><li class="neg"><span>Kaybedersen</span><b>${D.loseDesc}</b></li></ul>
    <div class="row">${btn(`Öde · ${fmt(T.demand)}`, 'trialPay', {}, '', S.cash < T.demand)}${btn(`${D.gameName} · 30 dk, 8 enerji`, 'trialFight', {}, 'primary', !!fightBlk)}</div>
    ${tolga ? `<div class="row">${btn('Tolga konuşsun (talep düşebilir)', 'trialTolga', {}, 'ghost sm')}</div>` : ''}
    ${fightBlk ? `<small class="why">${fightBlk}</small>` : ''}
    <small>Gün bitmeden karar vermezsen kaybetmiş sayılırsın. Kazanırsan hiçbir şey kaybetmezsin, üstüne küçük bir ödül de var.</small>
    <div class="row">${btn('Sonra karar ver', 'close', {}, 'ghost')}</div>`);
};
SS.trialIgnore = () => {
  const T = S.trial; if (!T || T.done) return;
  const D = trialDef(T.id), lines = D.lose(T);
  T.done = true; T.res = 'ignored'; S.trialLog.push({ day: S.day, id: T.id, res: 'ignored' });
  SS.notes.push(`${D.title}: karar vermedin. ${lines.join(' ')}`);
};
const trialHelpers = id => [
  id === 'shooter' && SS.hasCrew('tolga') && 'Tolga: kalkan +1',
  id === 'shield' && SS.hasCrew('pit') && 'Pıtırcık: meteorları önceden görür',
  id === 'whack' && SS.hasCrew('pit') && 'Pıtırcık: virüse +1 tolerans',
  id === 'memory' && SS.hasCrew('ela') && 'Ela: +1 hak',
].filter(Boolean);
Object.assign(ACT, {
  trial: () => SS.trialModal(),
  trialPay: () => {
    const T = S.trial; if (!T || T.done || !SS.spend(T.demand)) return;
    SS.mood(-4); trialEnd('paid', [`${fmt(T.demand)} ödedin. Sorun kapandı ama içinde bir burukluk kaldı. Moral −4.`]);
  },
  trialTolga: () => {
    const T = S.trial; if (!T || T.done || T.haggled) return; T.haggled = true;
    if (Math.random() < .6) { T.demand = Math.round(T.demand * .6); SS.toast(`Tolga konuştu: talep ${fmt(T.demand)}'e düştü.`, 'good'); }
    else { T.demand = Math.round(T.demand * 1.1); SS.toast('Tolga fazla konuştu: talep %10 arttı.', 'bad'); }
    SS.save(); SS.trialModal();
  },
  trialFight: () => {
    const T = S.trial; if (!T || T.done || S.energy < 8 || !SS.timeOk(30)) return;
    const D = trialDef(T.id); SS.passTime(30); S.energy -= 8; SS.closeModal(); SS.save();
    const done = res => {
      if (res.win) { SS.sfx('big'); trialEnd('won', [`${D.gameName}: başardın!`, ...D.win(T)]); }
      else { SS.sfx('bad'); trialEnd('lost', [res.quit ? 'Pes ettin.' : 'Savunma çöktü.', ...D.lose(T)]); }
    };
    if (D.game === 'audit') return auditStart(done);
    SS.Games[D.game]({ title: D.gameName, helpers: trialHelpers(D.game) }, done);
  },
});

/* ---------- evrak kontrolü (modal) ---------- */
let AU = null;
function auditFields() {
  const F = [
    ['Gemi adı', SS.shipName(), () => pick(['Kara Martı', 'Paslı Kartal', 'Yalnız Balina', 'Gece Pelikanı'].filter(x => x !== SS.shipName()))],
    ['Gemi sınıfı', SS.SHIPS[S.tier].name, () => pick(SS.SHIPS.filter((_, i) => i !== S.tier)).name],
    ['Kaptan', S.name, () => pick(['Kaptan Yıldırım', 'Rex', 'Bay Okuyan'].filter(x => x !== S.name))],
    ['Hane nüfusu', `${SS.crewList().length + 1} kişi`, () => `${SS.crewList().length + pick([0, 2, 3])} kişi`],
    ['Kargodaki parça', `${S.cargo.length}`, () => `${S.cargo.length + rint(2, 5)}`],
    ['Rütbe', SS.rank().name, () => pick(SS.RANKS.filter(r => r.name !== SS.rank().name)).name],
    ['İstasyondaki gün', `${S.day}`, () => `${S.day + pick([-3, -2, 2, 4])}`],
    ['Alacaklı', S.lender === 'bank' ? 'Banka' : S.lender === 'krell' ? 'Krell' : 'Yok', () => S.lender === 'krell' ? 'Banka' : 'Krell'],
  ];
  return F;
}
function auditStart(done) {
  const F = auditFields();
  const docs = Array.from({ length: 5 }, () => {
    const pickF = F.slice().sort(() => Math.random() - .5).slice(0, 3), bad = Math.random() < .55 ? rint(0, 2) : -1;
    return { rows: pickF.map((f, i) => [f[0], i === bad ? f[2]() : f[1]]), bad: bad >= 0 };
  });
  AU = { docs, i: 0, right: 0, done, F };
  render(); auditView();
}
function auditView(msg) {
  const d = AU.docs[AU.i];
  SS.modal(`<p class="eyebrow">Evrak kontrolü · belge ${AU.i + 1}/5 · doğru ${AU.right}</p><h2>Bu belge kayıtlarınla uyuşuyor mu?</h2>
    <div class="audit"><div class="doc"><b>DENETİM FORMU</b>${d.rows.map(([k, v]) => `<p><span>${k}</span><em>${esc(v)}</em></p>`).join('')}</div>
    <div class="doc mine"><b>SENİN KAYDIN</b>${AU.F.map(([k, v]) => `<p><span>${k}</span><em>${esc(v)}</em></p>`).join('')}</div></div>
    ${msg ? `<p>${msg}</p>` : ''}<div class="row">${btn('Uyuşuyor', 'auditAns', { a: 0 }, 'good', !!msg)}${btn('Hatalı', 'auditAns', { a: 1 }, 'danger', !!msg)}</div><small>Kazanmak için 5 belgeden 4'ünü doğru değerlendir.</small>`);
}
ACT.auditAns = d => {
  if (!AU || AU.lock) return; AU.lock = true;
  const ok = (+d.a === 1) === AU.docs[AU.i].bad; if (ok) AU.right++;
  SS.sfx(ok ? 'coin' : 'bad'); auditView(ok ? '<span class="pos">Doğru.</span>' : '<span class="neg">Yanlış değerlendirme.</span>');
  setTimeout(() => {
    AU.lock = false; AU.i++;
    if (AU.i >= 5) { const a = AU; AU = null; SS.closeModal(); a.done({ win: a.right >= 4 }); } else auditView();
  }, 750);
};

/* =========================================================
   SINAMA MİNİ OYUNLARI
   ========================================================= */
const G = SS.Games;
const starfield = (c, W, H, t, P, n = 60) => {
  c.fillStyle = P.space0; c.fillRect(0, 0, W, H);
  for (let i = 0; i < n; i++) { const y = ((i * 97 + t * (20 + (i % 3) * 25)) % H); c.fillStyle = P.star; c.globalAlpha = .35 + (i % 4) * .15; c.fillRect((i * 53) % W, y, 1.6, 1.6); }
  c.globalAlpha = 1;
};
const hpBar = (n, max) => `${'■'.repeat(Math.max(0, n))}${'□'.repeat(Math.max(0, max - n))}`;

// 1) Modül savunması: yatay hareket, otomatik ateş
G.shooter = (opts, onEnd) => {
  const W = 360, H = 600, MAXHP = 5 + (SS.hasCrew('tolga') ? 1 : 0);
  let hp = MAXHP, time = 40, kills = 0, endT = -1, fireT = 0, spawnT = 1, hurt = 0, tx = null;
  const ship = { x: 180, y: 520 }, shots = [], foes = [], eshots = [], fx = SS.FX.make();
  const g = { title: opts.title, W, H, quitLabel: 'Pes et', helpers: opts.helpers, controls: [{ id: 'l', label: '◀ Sola', hold: true }, { id: 'r', label: 'Sağa ▶', hold: true }] };
  g.finish = why => { if (g.done) return; g.done = true; g.result = { win: why === 'time' && hp > 0, kills, quit: why === 'quit' }; };
  g._dbg = () => ({ ship, foes, eshots, hp });
  g.pointer = x => { tx = x; };
  g.key = (k, down) => { const m = { ArrowLeft: 'l', a: 'l', ArrowRight: 'r', d: 'r' }; if (!(k in m)) return false; g.input[m[k]] = down; tx = null; };
  const hit = (x, y) => { hp--; hurt = .35; SS.FX.burst(fx, x, y, [SS.Art.P().bad, SS.Art.P().flame], 18, 4); SS.sfx('boom'); if (hp <= 0 && endT < 0) endT = .9; };
  g.update = (dt, f) => {
    SS.FX.step(fx, dt, f); hurt = Math.max(0, hurt - dt);
    if (endT >= 0) { endT -= dt; if (endT <= 0) g.finish('dead'); return; }
    time -= dt; if (time <= 0) { time = 0; return g.finish('time'); }
    if (g.input.l || g.input.r) tx = null;
    if (g.input.l) ship.x -= 5.2 * f; if (g.input.r) ship.x += 5.2 * f;
    if (tx != null) ship.x += clamp(tx - ship.x, -5.5 * f, 5.5 * f);
    ship.x = clamp(ship.x, 20, W - 20);
    fireT -= dt; if (fireT <= 0) { fireT = .24; shots.push({ x: ship.x, y: ship.y - 18 }); }
    spawnT -= dt;
    if (spawnT <= 0) { const el = 40 - time; spawnT = Math.max(.42, 1.15 - el * .018); foes.push({ x: rnd(30, W - 30), y: -20, vy: rnd(1, 1.5) + el * .018, ph: Math.random() * 6, hp: Math.random() < .2 ? 2 : 1, st: rnd(1.2, 2.8) }); }
    shots.forEach(s => s.y -= 9 * f); eshots.forEach(s => s.y += 3.4 * f);
    for (let i = foes.length - 1; i >= 0; i--) {
      const o = foes[i]; o.y += o.vy * f; o.x = clamp(o.x + Math.sin(g.t * 2 + o.ph) * 1.1 * f, 16, W - 16); o.st -= dt;
      if (o.st <= 0 && o.y < 420) { o.st = rnd(1.8, 3.2); eshots.push({ x: o.x, y: o.y + 12 }); }
      for (let j = shots.length - 1; j >= 0; j--) { const s = shots[j]; if (Math.abs(s.x - o.x) < 16 && Math.abs(s.y - o.y) < 14) { shots.splice(j, 1); o.hp--; if (o.hp <= 0) break; } }
      if (o.hp <= 0) { foes.splice(i, 1); kills++; SS.FX.burst(fx, o.x, o.y, [SS.Art.P().flame, SS.Art.P().accent], 16, 4); SS.sfx('grab'); continue; }
      if (o.y > 560) { foes.splice(i, 1); hit(o.x, 570); }
    }
    for (let i = eshots.length - 1; i >= 0; i--) { const s = eshots[i]; if (Math.abs(s.x - ship.x) < 16 && Math.abs(s.y - ship.y) < 14) { eshots.splice(i, 1); hit(ship.x, ship.y); } else if (s.y > H) eshots.splice(i, 1); }
    for (let i = shots.length - 1; i >= 0; i--) if (shots[i].y < -10) shots.splice(i, 1);
    SS.Stage.hud(`<span class="${time < 8 ? 'warn' : ''}">⏱ ${Math.ceil(time)}</span><span>Kalkan ${hpBar(hp, MAXHP)}</span><span>Düşürülen ${kills}</span>`);
  };
  g.draw = (c, P, t) => {
    starfield(c, W, H, t, P);
    // yaşam modülü
    c.fillStyle = P.metalD; c.fillRect(0, 560, W, 40); c.fillStyle = P.metal; c.fillRect(0, 560, W, 5);
    for (let x = 14; x < W; x += 36) { c.fillStyle = P.warn; c.globalAlpha = .7; c.fillRect(x, 574, 14, 8); } c.globalAlpha = 1;
    if (hurt > 0) { c.fillStyle = P.bad; c.globalAlpha = hurt; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
    c.fillStyle = P.accent; shots.forEach(s => c.fillRect(s.x - 1.5, s.y - 7, 3, 10));
    c.fillStyle = P.bad; eshots.forEach(s => { c.beginPath(); c.arc(s.x, s.y, 3.5, 0, TAU); c.fill(); });
    for (const o of foes) {
      c.save(); c.translate(o.x, o.y);
      c.fillStyle = o.hp > 1 ? P.tankD : P.bad; c.beginPath(); c.moveTo(0, 14); c.lineTo(-14, -6); c.lineTo(-6, -2); c.lineTo(0, -12); c.lineTo(6, -2); c.lineTo(14, -6); c.closePath(); c.fill();
      c.fillStyle = P.space0; c.fillRect(-3, -2, 6, 5); c.fillStyle = P.flame; c.globalAlpha = .7; c.fillRect(-2, -16, 4, 4 + Math.sin(t * 20) * 2); c.globalAlpha = 1;
      c.restore();
    }
    c.save(); c.translate(ship.x, ship.y);
    c.fillStyle = P.hull; c.beginPath(); c.moveTo(0, -18); c.lineTo(-15, 12); c.lineTo(0, 6); c.lineTo(15, 12); c.closePath(); c.fill();
    c.fillStyle = P.hull2; c.fillRect(-3, -8, 6, 10); c.fillStyle = P.glass; c.beginPath(); c.arc(0, -4, 3.5, 0, TAU); c.fill();
    c.fillStyle = P.flame; c.globalAlpha = .8; c.beginPath(); c.moveTo(-5, 10); c.lineTo(5, 10); c.lineTo(0, 18 + Math.sin(t * 30) * 3); c.fill(); c.globalAlpha = 1;
    c.restore();
    SS.FX.draw(fx, c);
  };
  g.drawUI = (c, P) => { SS.FX.drawText(fx, c, P); if (g.t < 2.5) { c.textAlign = 'center'; c.font = SS.tfont(16); c.fillStyle = P.text; c.fillText('40 saniye dayan. Gemi kendiliğinden ateş eder.', W / 2, 300); c.fillText('Dokun ya da oklarla yön ver.', W / 2, 324); } };
  g.onEnd = onEnd; SS.Stage.open(g);
};

// 2) Meteor kalkanı: kalkan yayını döndür
G.shield = (opts, onEnd) => {
  const W = 360, H = 600, cx = 180, cy = 470, R = 78, ARC = 1.05, MAXHP = 5;
  let hp = MAXHP, time = 35, ang = -Math.PI / 2, tgt = null, spawnT = .8, endT = -1, blocked = 0, hurt = 0;
  const rocks = [], fx = SS.FX.make(), pit = SS.hasCrew('pit');
  const g = { title: opts.title, W, H, quitLabel: 'Pes et', helpers: opts.helpers, controls: [{ id: 'l', label: '↺ Sola', hold: true }, { id: 'r', label: 'Sağa ↻', hold: true }] };
  g.finish = why => { if (g.done) return; g.done = true; g.result = { win: why === 'time' && hp > 0, quit: why === 'quit' }; };
  g._dbg = () => ({ rocks, ang, cx, cy, R, hp });
  g.pointer = (x, y) => { tgt = Math.atan2(Math.min(y - cy, -5), x - cx); };
  g.key = (k, down) => { const m = { ArrowLeft: 'l', a: 'l', ArrowRight: 'r', d: 'r' }; if (!(k in m)) return false; g.input[m[k]] = down; tgt = null; };
  const adiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  g.update = (dt, f) => {
    SS.FX.step(fx, dt, f); hurt = Math.max(0, hurt - dt);
    if (endT >= 0) { endT -= dt; if (endT <= 0) g.finish('dead'); return; }
    time -= dt; if (time <= 0) { time = 0; return g.finish('time'); }
    if (g.input.l || g.input.r) tgt = null;
    if (g.input.l) ang -= 3.3 * dt; if (g.input.r) ang += 3.3 * dt;
    if (tgt != null) ang += clamp(adiff(tgt, ang), -4 * dt, 4 * dt);
    ang = clamp(ang, -Math.PI + .15, -.15);
    spawnT -= dt;
    if (spawnT <= 0) { const el = 35 - time; spawnT = Math.max(.5, 1.25 - el * .02); const a = rnd(-Math.PI + .25, -.25); rocks.push({ a, d: 430, v: rnd(2.1, 2.8) + el * .045, r: rnd(7, 12), spin: Math.random() * 6 }); }
    for (let i = rocks.length - 1; i >= 0; i--) {
      const o = rocks[i]; o.d -= o.v * f; o.spin += dt * 3;
      if (o.d <= R + 4 && o.d > R - 10 && Math.abs(adiff(o.a, ang)) < ARC / 2 + o.r / R) { rocks.splice(i, 1); blocked++; SS.FX.burst(fx, cx + Math.cos(o.a) * R, cy + Math.sin(o.a) * R, [SS.Art.P().crystal, SS.Art.P().metalL], 14, 3.5); SS.sfx('grab'); continue; }
      if (o.d <= 38) { rocks.splice(i, 1); hp--; hurt = .35; SS.FX.burst(fx, cx + Math.cos(o.a) * 36, cy + Math.sin(o.a) * 36, [SS.Art.P().bad, SS.Art.P().flame], 20, 4); SS.sfx('boom'); if (hp <= 0) endT = .9; }
    }
    SS.Stage.hud(`<span class="${time < 8 ? 'warn' : ''}">⏱ ${Math.ceil(time)}</span><span>Modül ${hpBar(hp, MAXHP)}</span><span>Engellenen ${blocked}</span>`);
  };
  g.draw = (c, P, t) => {
    starfield(c, W, H, t * .3, P, 50);
    if (hurt > 0) { c.fillStyle = P.bad; c.globalAlpha = hurt * .8; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
    for (const o of rocks) {
      const x = cx + Math.cos(o.a) * o.d, y = cy + Math.sin(o.a) * o.d;
      if (pit && o.d > 200) { c.strokeStyle = P.warn; c.globalAlpha = .35; c.setLineDash([4, 6]); c.beginPath(); c.moveTo(x, y); c.lineTo(cx + Math.cos(o.a) * R, cy + Math.sin(o.a) * R); c.stroke(); c.setLineDash([]); c.globalAlpha = 1; }
      c.fillStyle = P.flame; c.globalAlpha = .4; c.beginPath(); c.arc(x - Math.cos(o.a) * 8, y - Math.sin(o.a) * 8, o.r * .8, 0, TAU); c.fill(); c.globalAlpha = 1;
      c.save(); c.translate(x, y); c.rotate(o.spin); c.fillStyle = P.rock || P.metal; c.beginPath();
      for (let k = 0; k < 7; k++) { const aa = k / 7 * TAU, rr = o.r * (k % 2 ? .82 : 1); k ? c.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr) : c.moveTo(rr, 0); } c.closePath(); c.fill(); c.restore();
    }
    // modül
    c.fillStyle = P.metalD; c.beginPath(); c.ellipse(cx, cy + 34, 70, 14, 0, 0, TAU); c.fill();
    c.fillStyle = P.metal; c.beginPath(); c.arc(cx, cy, 34, Math.PI, TAU); c.fill(); c.fillRect(cx - 34, cy, 68, 30);
    c.fillStyle = P.hull; c.fillRect(cx - 34, cy + 8, 68, 5);
    [-18, 0, 18].forEach(dx => { c.fillStyle = '#ffd27a'; c.globalAlpha = .85; c.fillRect(cx + dx - 4, cy - 14, 8, 8); }); c.globalAlpha = 1;
    // kalkan
    c.strokeStyle = P.crystal; c.lineWidth = 8; c.lineCap = 'round'; c.globalAlpha = .9; c.beginPath(); c.arc(cx, cy, R, ang - ARC / 2, ang + ARC / 2); c.stroke();
    c.lineWidth = 18; c.globalAlpha = .18; c.stroke(); c.globalAlpha = 1; c.lineCap = 'butt';
    c.strokeStyle = P.crystal; c.globalAlpha = .12; c.lineWidth = 1; c.beginPath(); c.arc(cx, cy, R, Math.PI, TAU); c.stroke(); c.globalAlpha = 1;
    SS.FX.draw(fx, c);
  };
  g.drawUI = (c, P) => { if (g.t < 2.5) { c.textAlign = 'center'; c.font = SS.tfont(16); c.fillStyle = P.text; c.fillText('Kalkanı meteorların önüne çevir.', W / 2, 200); c.fillText('35 saniye dayan.', W / 2, 224); } };
  g.onEnd = onEnd; SS.Stage.open(g);
};

// 3) Güvenlik duvarı: virüslere dokun, dosyalara dokunma
G.whack = (opts, onEnd) => {
  const W = 360, H = 600, COLS = 3, ROWS = 4, CW = 100, CH = 100, X0 = 30, Y0 = 110, MAXI = 6 + (SS.hasCrew('pit') ? 1 : 0);
  let time = 30, inf = 0, killed = 0, spawnT = .5, endT = -1;
  const cells = Array.from({ length: COLS * ROWS }, () => null), fx = SS.FX.make();
  const g = { title: opts.title, W, H, quitLabel: 'Pes et', helpers: opts.helpers, controls: [] };
  g.finish = why => { if (g.done) return; g.done = true; g.result = { win: why === 'time' && inf < MAXI, quit: why === 'quit' }; };
  g._dbg = () => ({ cells, COLS, CW, CH, X0, Y0, inf });
  const infect = (x, y, txt) => { inf++; SS.FX.text(fx, x, y, txt, SS.Art.P().bad); SS.sfx('bad'); if (inf >= MAXI && endT < 0) endT = .8; };
  g.pointer = (x, y) => {
    if (endT >= 0) return;
    const ci = Math.floor((x - X0) / CW), ri = Math.floor((y - Y0) / CH); if (ci < 0 || ci >= COLS || ri < 0 || ri >= ROWS) return;
    const k = ri * COLS + ci, o = cells[k]; if (!o) return;
    const px = X0 + ci * CW + CW / 2, py = Y0 + ri * CH + CH / 2;
    cells[k] = null;
    if (o.kind === 'virus') { killed++; SS.FX.burst(fx, px, py, [SS.Art.P().good, SS.Art.P().crystal], 14, 3.5); SS.sfx('grab'); }
    else infect(px, py, 'Dosya silindi!');
  };
  g.update = (dt, f) => {
    SS.FX.step(fx, dt, f);
    if (endT >= 0) { endT -= dt; if (endT <= 0) g.finish('dead'); return; }
    time -= dt; if (time <= 0) { time = 0; return g.finish('time'); }
    const el = 30 - time;
    cells.forEach((o, k) => { if (!o) return; o.life -= dt; if (o.life <= 0) { cells[k] = null; if (o.kind === 'virus') infect(X0 + (k % COLS) * CW + CW / 2, Y0 + Math.floor(k / COLS) * CH + CH / 2, 'Bulaştı!'); } });
    spawnT -= dt;
    if (spawnT <= 0) {
      spawnT = Math.max(.32, .8 - el * .016);
      const free = cells.map((o, k) => o ? -1 : k).filter(k => k >= 0);
      if (free.length) { const k = pick(free); cells[k] = { kind: Math.random() < .22 ? 'file' : 'virus', life: Math.max(.75, 1.6 - el * .025), max: 1 }; cells[k].max = cells[k].life; }
    }
    SS.Stage.hud(`<span class="${time < 8 ? 'warn' : ''}">⏱ ${Math.ceil(time)}</span><span>Enfeksiyon ${inf}/${MAXI}</span><span>Silinen ${killed}</span>`);
  };
  g.draw = (c, P, t) => {
    c.fillStyle = P.space0; c.fillRect(0, 0, W, H);
    c.strokeStyle = P.crystal; c.globalAlpha = .08; for (let y = 0; y < H; y += 6) { c.beginPath(); c.moveTo(0, y + (t * 20) % 6); c.lineTo(W, y + (t * 20) % 6); c.stroke(); } c.globalAlpha = 1;
    c.fillStyle = P.bad; c.globalAlpha = .25; c.fillRect(20, 60, (W - 40) * inf / MAXI, 14); c.globalAlpha = 1; c.strokeStyle = P.bad; c.strokeRect(20, 60, W - 40, 14);
    cells.forEach((o, k) => {
      const x = X0 + (k % COLS) * CW, y = Y0 + Math.floor(k / COLS) * CH;
      c.fillStyle = P.ui; c.fillRect(x + 6, y + 6, CW - 12, CH - 12); c.strokeStyle = P.metalD; c.lineWidth = 2; c.strokeRect(x + 6, y + 6, CW - 12, CH - 12);
      if (!o) return;
      const mx = x + CW / 2, my = y + CH / 2, k2 = o.life / o.max;
      c.strokeStyle = o.kind === 'virus' ? P.bad : P.good; c.lineWidth = 3; c.beginPath(); c.arc(mx, my, 34, -Math.PI / 2, -Math.PI / 2 + TAU * k2); c.stroke();
      if (o.kind === 'virus') {
        c.fillStyle = P.bad; c.beginPath(); c.arc(mx, my, 16, 0, TAU); c.fill();
        for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + t * 2; c.fillRect(mx + Math.cos(a) * 20 - 2, my + Math.sin(a) * 20 - 2, 4, 4); }
        c.fillStyle = P.space0; c.fillRect(mx - 7, my - 4, 4, 4); c.fillRect(mx + 3, my - 4, 4, 4);
      } else {
        c.fillStyle = P.metalL; c.fillRect(mx - 13, my - 17, 26, 34); c.fillStyle = P.good; c.fillRect(mx - 9, my - 9, 18, 3); c.fillRect(mx - 9, my - 2, 18, 3); c.fillRect(mx - 9, my + 5, 12, 3);
      }
    });
    SS.FX.draw(fx, c);
  };
  g.drawUI = (c, P) => {
    c.textAlign = 'center'; c.font = SS.tfont(13); c.fillStyle = P.text; c.fillText('Kırmızı virüslere dokun. Yeşil dosyalara dokunma.', W / 2, 52);
    SS.FX.drawText(fx, c, P);
  };
  g.onEnd = onEnd; SS.Stage.open(g);
};

// 4) Laboratuvar: renk dizisini tekrarla
G.memory = (opts, onEnd) => {
  const W = 360, H = 600, ROUNDS = 5;
  let round = 0, lives = 2 + (SS.hasCrew('ela') ? 1 : 0), seq = [], pos = 0, phase = 'wait', pt = 1.2, flash = -1, flashT = 0, endT = -1;
  const PADS = [{ x: 95, y: 230, n: 'Kırmızı', c: 'bad' }, { x: 265, y: 230, n: 'Yeşil', c: 'good' }, { x: 95, y: 410, n: 'Mavi', c: 'crystal' }, { x: 265, y: 410, n: 'Sarı', c: 'accent' }];
  const fx = SS.FX.make();
  const g = { title: opts.title, W, H, quitLabel: 'Pes et', helpers: opts.helpers, controls: PADS.map((p, i) => ({ id: String(i), label: p.n })) };
  g.finish = why => { if (g.done) return; g.done = true; g.result = { win: why === 'won', quit: why === 'quit' }; };
  const newSeq = () => { seq = Array.from({ length: 3 + round }, () => rint(0, 3)); pos = 0; phase = 'show'; pt = .5; flash = -1; };
  const press = i => {
    if (phase !== 'input' || endT >= 0) return;
    flash = i; flashT = .2;
    if (seq[pos] === i) { pos++; SS.sfx('tick'); if (pos >= seq.length) { round++; SS.FX.text(fx, W / 2, 330, round >= ROUNDS ? 'Formül tamam!' : 'Doğru karışım!', SS.Art.P().good); SS.sfx('coin'); if (round >= ROUNDS) { endT = 1; phase = 'end'; } else { phase = 'wait'; pt = 1; } } }
    else { lives--; SS.FX.text(fx, W / 2, 330, 'Yanlış tüp!', SS.Art.P().bad); SS.sfx('bad'); if (lives <= 0) { phase = 'end'; endT = 1; g._lost = true; } else { phase = 'wait'; pt = 1.2; } }
  };
  g.action = id => press(+id);
  g.pointer = (x, y) => { PADS.forEach((p, i) => { if (Math.abs(x - p.x) < 75 && Math.abs(y - p.y) < 75) press(i); }); };
  g.key = (k, down) => { if (!down) return; const m = { '1': 0, '2': 1, '3': 2, '4': 3 }; if (k in m) press(m[k]); else return false; };
  let showI = 0;
  g._dbg = () => ({ seq, pos, phase, PADS });
  g.update = (dt, f) => {
    SS.FX.step(fx, dt, f); flashT -= dt; if (flashT <= 0 && phase !== 'show') flash = -1;
    if (endT >= 0) { endT -= dt; if (endT <= 0) g.finish(g._lost ? 'dead' : 'won'); return; }
    if (phase === 'wait') { pt -= dt; if (pt <= 0) { newSeq(); showI = 0; } }
    else if (phase === 'show') {
      pt -= dt;
      if (pt <= 0) {
        if (flash >= 0) { flash = -1; pt = .18; showI++; if (showI >= seq.length) { phase = 'input'; } }
        else { flash = seq[showI]; pt = Math.max(.32, .55 - round * .04); SS.sfx('tick'); }
      }
    }
    SS.Stage.hud(`<span>Tur ${Math.min(round + 1, ROUNDS)}/${ROUNDS}</span><span>Hak ${'♥'.repeat(Math.max(0, lives))}</span><span>${phase === 'show' ? 'İzle' : phase === 'input' ? `Sıra sende ${pos}/${seq.length}` : '…'}</span>`);
  };
  g.draw = (c, P, t) => {
    c.fillStyle = P.space1; c.fillRect(0, 0, W, H);
    c.fillStyle = P.metalD; c.fillRect(20, 120, W - 40, 400);
    PADS.forEach((p, i) => {
      const on = flash === i;
      c.fillStyle = P.ui; c.fillRect(p.x - 70, p.y - 75, 140, 150);
      // tüp
      c.fillStyle = P.metalL; c.globalAlpha = .35; c.fillRect(p.x - 22, p.y - 60, 44, 110); c.globalAlpha = 1;
      c.fillStyle = P[p.c]; c.globalAlpha = on ? 1 : .45; c.fillRect(p.x - 18, p.y - 10, 36, 56);
      if (on) { c.globalAlpha = .35; c.beginPath(); c.arc(p.x, p.y, 70, 0, TAU); c.fill(); }
      c.globalAlpha = 1;
      for (let b = 0; b < 3; b++) { c.fillStyle = '#fff'; c.globalAlpha = on ? .8 : .3; c.beginPath(); c.arc(p.x - 8 + b * 8, p.y + 30 - ((t * 30 + b * 13) % 50), 2.5, 0, TAU); c.fill(); } c.globalAlpha = 1;
      c.fillStyle = P.metal; c.fillRect(p.x - 26, p.y - 66, 52, 8);
    });
    SS.FX.draw(fx, c);
  };
  g.drawUI = (c, P) => {
    c.textAlign = 'center'; c.font = SS.tfont(14); c.fillStyle = P.text;
    c.fillText(phase === 'show' ? 'Yanan tüpleri sırasıyla izle…' : phase === 'input' ? 'Aynı sırayla dokun' : '', W / 2, 90);
    PADS.forEach((p, i) => { c.font = SS.tfont(12); c.fillStyle = P.text; c.fillText(`${p.n} · ${i + 1}`, p.x, p.y + 68); });
    SS.FX.drawText(fx, c, P);
  };
  g.onEnd = onEnd; SS.Stage.open(g);
};

/* =========================================================
   HARİTA MODÜLLERİ: Akademi ve Kumarhane
   ========================================================= */
const MOD = SS.MAPMOD && SS.MAPMOD();
if (MOD) {
  const rr = (c, x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
  const glow = (c, x, y, r, col, a = .5) => { const gr = c.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = a; c.fillStyle = gr; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.globalAlpha = 1; };
  const lin = (c, x0, y0, x1, y1, st) => { const gr = c.createLinearGradient(x0, y0, x1, y1); st.forEach(([o, col]) => gr.addColorStop(o, col)); return gr; };
  MOD.academy = (c, t, P, C, open) => {
    c.fillStyle = P.metalD; c.beginPath(); c.ellipse(0, 19, 30, 5, 0, 0, TAU); c.fill();
    // basamaklar ve gövde
    c.fillStyle = P.metal; c.fillRect(-24, 13, 48, 4);
    c.fillStyle = lin(c, -22, 0, 22, 0, [[0, P.metalD], [.5, P.metalL], [1, P.metalD]]); rr(c, -22, -6, 44, 20, 3); c.fill();
    // kemerli pencereler
    for (let i = 0; i < 4; i++) { const x = -16 + i * 10.6; c.fillStyle = open ? C.warm : P.ui; c.globalAlpha = open ? .85 : .6; c.beginPath(); c.moveTo(x - 3, 10); c.lineTo(x - 3, 0); c.arc(x, 0, 3, Math.PI, TAU); c.lineTo(x + 3, 10); c.fill(); c.globalAlpha = 1; }
    // alınlık
    c.fillStyle = C.cyan; c.fillRect(-24, -8, 48, 2.5);
    // gözlemevi kubbesi
    c.fillStyle = lin(c, 0, -28, 0, -6, [[0, P.metalL], [1, P.metal]]); c.beginPath(); c.ellipse(0, -6, 15, 15, 0, Math.PI, TAU); c.fill();
    c.save(); c.beginPath(); c.ellipse(0, -6, 15, 15, 0, Math.PI, TAU); c.clip();
    const sl = Math.sin(t * .2) * 5; c.fillStyle = P.space0; c.fillRect(sl - 2.5, -22, 5, 16); c.restore();
    // teleskop
    c.save(); c.translate(sl, -14); c.rotate(-.7 + Math.sin(t * .2) * .2); c.fillStyle = P.metalL; c.fillRect(0, -2, 14, 4); c.fillStyle = C.cyan; c.fillRect(13, -2.5, 2, 5); c.restore();
    // holo kitap
    const by = -34 + Math.sin(t * .7) * 1.2;
    if (open) glow(c, -22, by + 6, 10, C.cyan, .5);
    c.save(); c.translate(-22, by + 6); c.globalAlpha = open ? .9 : .4; c.strokeStyle = C.cyan; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(0, 3); c.lineTo(-7, 0); c.lineTo(-7, -7); c.lineTo(0, -4); c.lineTo(7, -7); c.lineTo(7, 0); c.closePath(); c.stroke(); c.beginPath(); c.moveTo(0, 3); c.lineTo(0, -4); c.stroke(); c.restore(); c.globalAlpha = 1;
    // kep sembolü
    c.fillStyle = P.accent; c.beginPath(); c.moveTo(0, -27); c.lineTo(6, -24); c.lineTo(0, -21); c.lineTo(-6, -24); c.closePath(); c.fill();
  };
  MOD.casino = (c, t, P, C, open) => {
    c.fillStyle = P.metalD; c.beginPath(); c.ellipse(0, 19, 30, 5, 0, 0, TAU); c.fill();
    // ayak
    c.fillStyle = P.metal; c.fillRect(-4, 4, 8, 14);
    // daire gövde
    c.fillStyle = lin(c, 0, -14, 0, 8, [[0, P.metalL], [1, P.metalD]]); c.beginPath(); c.ellipse(0, 0, 30, 9, 0, 0, TAU); c.fill();
    c.fillStyle = lin(c, 0, -20, 0, -2, [[0, P.crystal2], [1, P.space1]]); c.beginPath(); c.ellipse(0, -3, 16, 13, 0, Math.PI, TAU); c.fill();
    // kenar ışıkları: yavaş dönen
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + t * .4, x = Math.cos(a) * 27, y = Math.sin(a) * 7.5; if (Math.sin(a) < -.2) continue;
      const on = open && (i + Math.floor(t * 2)) % 3 === 0; c.fillStyle = on ? P.accent : open ? C.neon : P.metalD; c.globalAlpha = on ? 1 : .7; c.beginPath(); c.arc(x, y + 1, 1.4, 0, TAU); c.fill(); }
    c.globalAlpha = 1;
    // dönen çip hologramı
    const cy = -30 + Math.sin(t * .6) * 1.2, sx = Math.cos(t * .8);
    if (open) glow(c, 0, cy, 13, C.neon, .45);
    c.save(); c.translate(0, cy); c.scale(sx, 1); c.globalAlpha = open ? .95 : .4;
    c.fillStyle = P.accent; c.beginPath(); c.arc(0, 0, 7, 0, TAU); c.fill();
    c.fillStyle = P.space0; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; c.fillRect(Math.cos(a) * 5.5 - 1, Math.sin(a) * 5.5 - 1, 2, 2); }
    c.fillStyle = C.neon; c.beginPath(); c.arc(0, 0, 3.4, 0, TAU); c.fill(); c.restore(); c.globalAlpha = 1;
    // tabela
    const flick = open && Math.sin(t * 1.3) > -.9;
    c.font = 'bold 6.5px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = flick ? C.neon : P.metalD; c.fillText('NEBULA', 0, 1.5); c.textBaseline = 'alphabetic';
  };
}

/* =========================================================
   REHBER VE KILAVUZ EKLERİ
   ========================================================= */
if (SS.TUTORIAL && SS.TUTORIAL.length === 5) {
  SS.TUTORIAL[1] = { text: { easy: 'Şimdilik elimizde tek lisans var: hurda avı. Hurda Sözleşmesi\'ni kabul et; kancayı at, hedefleri topla.', hard: 'Lisansın yalnızca hurdaya yetiyor. Bir hurda sözleşmesi al ve bitir.' },
    done: () => (S.stats.repair + S.stats.deliver + S.stats.sort + (S.stats.hunts || 0) + S.stats.runs) > 0 };
  SS.TUTORIAL.splice(3, 0, { to: 'academy', text: { easy: 'Akademi\'ye uğrayalım. Teslimat, tamir ve diğer işler için lisans lazım. Derslere orada yazılırız.', hard: 'Akademi\'ye git. Diğer işler için lisans gerekiyor.' },
    done: () => S.loc === 'academy' });
}
if (SS.GUIDE) SS.GUIDE.push(
  { id: 'academy', title: 'Akademi ve lisanslar', body: `<p>Kariyerine yalnızca <b>hurda sözleşmeleriyle</b> başlarsın; ilk lisansın sadece Asteroit Kuşağı ve Gemi Mezarlığı'nı, basit hurdaları kapsar.</p>
<p><b>Lisanslar:</b> Kargo Pilotu (teslimat), Ayrıştırma, Devre Teknisyeni (tamir), Ticaret Ruhsatı (siparişler), Derin Tarama (kristal, uydu, kayıp eserler, Gaz Devi) ve Tehlikeli Bölge (Korsan Sektörü, Kayıp Yıldız).</p>
<p>Her lisans birkaç dersten oluşur. Günde bir ders alınır; son ders 3 soruluk bir sınavdır, 2'sini bilmen gerekir. Beceri eğitimleri de artık Akademi'de.</p>` },
  { id: 'casino', title: 'Nebula Kumarhanesi', body: `<p>14:00'te açılır. Yüksek mi alçak mı, Yıldız Çarkı, Kara Delik Zarı, Meteor Yarışı ve Nebula Slotu. Her el ${CAS.mins} dakika ve ${CAS.en} enerji; günde en fazla ${CAS.limit} el.</p>
<p>Kasa uzun vadede kazanır. Kazanç moral verir, kayıp moral alır. 25 elde Gümüş üyelik daha yüksek bahis açar. Kumar kazancı Rex yarışına sayılmaz.</p>` },
  { id: 'trials', title: 'Sınamalar', body: `<p>Her 4–10 günde bir (tehlike ayarına ve şansa bağlı) istasyonda bir sınama çıkar: korsan haracı, meteor yağmuru, virüs, salgın ya da denetim.</p>
<p>Ya istenen parayı ödersin ya da kısa bir mini oyunla mücadele edersin. Kazanırsan hiçbir şey kaybetmezsin, küçük bir ödül alırsın; kaybedersen daha fazla para, bir dekor, kargo, sağlık ya da moral gider. Gün biterken karar vermediysen kaybetmiş sayılırsın.</p>
<p>Klinikteki aşı salgına karşı korur; Tolga talebi pazarlıkla düşürmeyi deneyebilir.</p>` },
);

})(window.SS);

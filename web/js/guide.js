// Space Scrapper — oyun içi Rehber: nasıl oynanır bölümleri ve "ne nereden alınır, ne işe yarar" ansiklopedisi.
// Ansiklopedi oyun verisinden üretilir; fiyat ve etkiler değişince kendiliğinden güncel kalır.
(function(SS){
const { fmt } = SS;
const { btn, esc } = SS.ui;
const ACT = SS.ACT;

/* ---------- yardımcılar ---------- */
const cm = () => window.S ? SS.dv('costs') : 1;
const FX_NAME = { energy: 'enerji', hunger: 'tokluk', health: 'sağlık', morale: 'moral', sleep: 'uyku enerjisi', heat: 'ısıtma indirimi ₡', bond: 'hane bağı', energyMax: 'maks. enerji' };
const fxText = fx => Object.entries(fx || {}).map(([k, v]) => `${FX_NAME[k] || k} ${v > 0 ? '+' : ''}${v}`).join(', ');
const hours = id => { const l = SS.loc(id); return l ? SS.openLabel(id) : ''; };
const row = (name, val, desc, tags = '') => `<div class="rh-row" data-k="${esc((name + ' ' + desc + ' ' + tags + (SS.lang() === 'en' ? ' ' + [name, desc, tags].map(SS.T).join(' ') : '')).toLocaleLowerCase('tr'))}"><div><b>${name}</b><small>${desc}</small></div>${val !== '' ? `<em>${val}</em>` : ''}</div>`;
const sec = (id, title, intro, rows) => `<section class="rh-sec" id="rh-${id}"><h3>${title}</h3>${intro ? `<p class="muted">${intro}</p>` : ''}<div class="rh-list">${rows.join('')}</div></section>`;
const scrapVal = k => Math.round(SS.ITEMS[k].val * SS.SCRAP_VAL);

/* ---------- ansiklopedi bölümleri ---------- */
const CATS = [
  ['where', 'Ne nereden alınır'], ['energy', 'Enerji ve göstergeler'], ['jobs', 'İşler'], ['items', 'Hurda ve eşyalar'], ['zones', 'Bölgeler'],
  ['ship', 'Gemi'], ['academy', 'Akademi'], ['home', 'Ev ve dekor'], ['crew', 'Hane'], ['costs', 'Masraflar'], ['trials', 'Sınamalar'], ['casino', 'Kumarhane'],
];
function whereSec() {
  const r = [];
  const fp = window.S ? SS.fuelPrice() : 3;
  r.push(row('Yemek ve içecek', '', `Gus'un Kantini (${hours('cantina')}) ve Pazar'ın günün tezgâhı. Ayrıntısı "Enerji ve göstergeler" bölümünde.`, 'kantin pazar yiyecek'));
  r.push(row('Yakıt', `${fmt(fp)}/birim`, `Rıhtım ve Hangar (her zaman açık). Pazarda yedek bidon da var (+30).`, 'hangar yakıt'));
  r.push(row('Gemi geliştirmeleri ve yeni gemi', '', 'Rıhtım ve Hangar → Geliştirme ve Tersane sekmeleri. Borç bitmeden yeni gemi alınmaz.', 'hangar tersane'));
  r.push(row('Boya ve gemi adı', '', 'Rıhtım ve Hangar → Tersane. Bazı boyalar set ödülüyle açılır.', 'boya'));
  r.push(row('Lisanslar ve beceriler', '', `Akademi (${hours('academy')}). Günde bir ders; son ders sınavdır.`, 'akademi ders'));
  r.push(row('Tedavi ve aşı', '', `Klinik (${hours('clinic')}). Tedavi sağlık +30; aşı 12 gün salgından korur.`, 'klinik sağlık'));
  r.push(row('İlaç, bandaj, torpido', '', 'Pazar → Al sekmesindeki sabit raf. Her zaman bulunur.', 'pazar'));
  r.push(row('Sarf malzemeleri', '', 'Pazar → Al (günün tezgâhı, 3 saatte bir değişir). Sıradaki işe kendiliğinden uygulanır.', 'pazar buff'));
  r.push(row('Dekor', '', 'Pazar\'ın günün tezgâhı (2 parça), seyyar satıcılar (nadir parçalar) ve albüm set ödülleri. Satın alınan dekor depoya gider; Yaşam Modülü → Odalar\'dan yerleştirilir.', 'dekor'));
  r.push(row('Hediyeler', '', 'Pazar\'ın günün tezgâhı. Hane üyelerine verilir, bağ artırır.', 'hediye bağ'));
  r.push(row('Ev, oda, bahçe, atölye', '', 'Yaşam Modülü → Ev ve Hane sekmeleri.', 'ev'));
  r.push(row('Borç ödemesi', '', `Krell ve Banka (${hours('krell')}). Taksit her 28 günde akşam defterinden otomatik düşer; ek ödeme burada yapılır.`, 'krell banka borç'));
  r.push(row('Hurda satışı', '', `Pazar Halkası (${hours('market')}) → Sat. Ekipman primi fiyatlara dahildir. Siparişler İş Merkezi'ndedir.`, 'satış zara'));
  r.push(row('Kumar', '', `Nebula Kumarhanesi (${hours('casino')}).`, 'kumarhane'));
  return sec('where', 'Ne nereden alınır', 'Her şeyin bulunduğu yer ve açılış saatleri.', r);
}
function energySec() {
  const r = [], c = cm();
  r.push(row('Uyku', SS.HOMES.map(h => `+${h.sleep}`).join(' / '), `Gece uykusu ev seviyesine göre enerji verir (Kapsül / Daire / Ev). Tokluk 25'in altındaysa %40 daha az. Lamba gibi dekorlar uykuya ekler.`, 'uyku'));
  r.push(row('Kestirme', `+${SS.NAP.energy}`, `Yaşam Modülü'nde ${SS.DUR.nap} dakika, ücretsiz, günde bir kez.`, 'kestirme'));
  SS.FOOD.forEach(f => r.push(row(f.name, fmt(Math.round(f.price * c)), `Kantin · ${fxText({ energy: f.energy, hunger: f.hunger, morale: f.morale })} · 15 dk`, 'kantin yemek')));
  SS.DRINKS.forEach(d => r.push(row(d.name, fmt(Math.round(d.price * c)), `Kantin · ${fxText({ energy: d.energy, health: d.health, morale: d.morale })} · ${d.desc}`, 'kantin içecek')));
  SS.GOODS.filter(g => g.use === 'eat').forEach(g => r.push(row(g.name, fmt(g.price), `Pazar${g.staple ? ' (her zaman)' : ' (bazen)'} · ${fxText(g.fx)}`, 'pazar yiyecek içecek')));
  r.push(row('Ödüllü reklam', `+${SS.AD.energy}`, `Üst konsoldaki ⚡ düğmesi. Günde ${SS.AD.perDay} kez, her sabah yenilenir. Yiyecek sınırına dahil değil.`, 'reklam enerji'));
  r.push(row('Yiyecek ve içecek sınırı', `+${SS.FOOD_E_CAP}/gün`, 'Kantin ve pazardaki yiyecek-içeceklerden gün içinde gelen toplam enerji. Tokluk, sağlık ve moral etkileri sınırsız.', 'sınır yemek'));
  r.push(row('Ela: Moral Konuşması', '+10', 'Ela hanedeyse günde bir: enerji +10, moral +15.', 'ela yetenek'));
  r.push(row('Enerji harcayan işler', '', `Hurda avı ${SS.COST.scrap}, teslimat ${SS.COST.deliver}, tamir ${SS.COST.repair}, ayrıştırma ${SS.COST.sortShort}/${SS.COST.sortLong}, ders ${SS.LESSON ? SS.LESSON.energy : 15}, kumar eli 3, sınamada mücadele 8, yolculuk 1–5.`, 'enerji maliyet'));
  r.push(row('Tokluk', '', `Her gece ${window.S ? SS.M().hungerDrop : 25} düşer. 25 altında uyku zayıflar, 12 altında sağlık bozulur.`, 'tokluk açlık'));
  r.push(row('Sağlık', '', 'Patlama, sert iniş, açlık ve sınamalar düşürür. 0 olursa hastanelik olursun. Klinik, bandaj, vitamin ve meyve iyileştirir.', 'sağlık'));
  r.push(row('Moral', '', '70 ve üstü mini oyunlarda +5 saniye, 30 altı −6 saniye. Dekor, sohbet, iyi yemek, kumar kazancı ve sınama zaferleri artırır.', 'moral'));
  return sec('energy', 'Enerji ve göstergeler', `Yiyecek ve içecekten günde en fazla +${SS.FOOD_E_CAP} enerji gelir (kestirme ve reklam hariç). Gün çoğu zaman enerjiyle sınırlanır; reklam izlersen saatin yeter.`, r);
}
function jobsSec() {
  const r = [], m = window.S ? SS.jobPayMult() : 1;
  r.push(row('Serbest dalış', `${SS.COST.scrap} en · ${SS.DUR.scrap / 60} sa`, 'Hangar → Hurda avı. Yükün tamamı senin; değerler %25 fazla ve kayıp eser şansı yüksek. Yakıt bölgeye göre.', 'hurda dalış hangar'));
  r.push(row('Hurda sözleşmesi', `${SS.COST.scrap} en · ${SS.DUR.scrap / 60} sa`, 'İş Merkezi. Müşteri belirli hurdayı ister: sabit ücret + hedef başına ödeme + tamamlama primi. Hedef olmayan her şey kargona girer. Lisans gerekmez.', 'sözleşme hurda'));
  SS.DELIVERY_TIERS.forEach((t, i) => r.push(row(`Teslimat · ${t.name}`, `${fmt(t.pay[0] * m)}–${fmt(t.pay[1] * m)}`, `${SS.COST.deliver} enerji · ${SS.DUR.deliver[i]} dk · ${t.fuel} yakıt${t.vip ? ' · teslimat itibarı 3 gerekir' : ''}. Kargo Pilotu Lisansı gerekir.`, 'teslimat')));
  SS.REPAIR_TIERS.forEach((t, i) => r.push(row(`Tamir · ${t.name}`, `${fmt(t.pay[0] * m)}–${fmt(t.pay[1] * m)}`, `${SS.COST.repair} enerji · ${SS.DUR.repair[i]} dk · ${t.size}×${t.size} devre. Devre Teknisyeni Belgesi gerekir.`, 'tamir')));
  SS.SORTS.forEach(s => r.push(row(`Ayrıştırma · ${s.name}`, `~${fmt(Math.round(s.per))}/doğru`, `${s.energy} enerji · ${s.time} sn bant. Yanlış −₡4, kaçan −₡2, her 5'li seri +₡2. Ayrıştırma Sertifikası gerekir.`, 'ayrıştırma')));
  r.push(row('Sipariş', 'pazarın ~1,7 katı', `Kargondaki eşyayı alıcıya teslim et; enerji harcamaz, ${SS.DUR.order} dk. Ticaret Ruhsatı gerekir.`, 'sipariş'));
  r.push(row('İlan saatleri', '', 'İlanlar 07, 10, 13, 16, 19 ve 22\'de yenilenir. 19:00 sonrası gece zammı %10.', 'ilan'));
  r.push(row('İtibar', '', 'Her başarılı iş kendi itibarını artırır; her seviye ödemeye %4 ekler. Teslimat ve tamirde 3. seviye VIP işleri açar.', 'itibar'));
  r.push(row("Acil ilan", "+%40", "Bazı teslimat, tamir ve sipariş ilanları acildir: kartta yazan saate kadar kabul edersen %40 fazla öder; süre dolunca ilan kalkar.", "acil ilan bonus süre"));
  r.push(row("Rex düellosu", "", "Bazı dalışlarda Rex de aynı alanda kanca atar. Ondan çok değer toplarsan ödül kazanırsın; onun aldığı eşya senin olamaz.", "rex düello rakip"));
  r.push(row("Kombo", "+%15'e kadar", "Art arda değerli eşya yakaladıkça kombo artar ve her yakalama %3 daha değerli olur (en fazla +%15). Kaya ya da hurda kırıntısı komboyu bozar.", "kombo seri değer"));
  r.push(row("Patlayıcı tank", "", "Tank patlaması kayaları ve kırıntıyı temizler, değerli eşyaları sadece savurur. Derindeki bir tankı patlatırsan gemin hasar almaz; yakındakiler yaralar.", "tank patlama kaya temizlik"));
  r.push(row("Haftanın Avı", "", "Günün Avı panelinde: herkese aynı, daha zor bir alan; her pazartesi yenilenir. Ekonomini etkilemez.", "haftalık meydan okuma"));
  r.push(row("Gemi çıkartmaları", "", "Rex düellosu, kombo, acil ilan, haftalık av, yol arkadaşı görevi gibi başarılarla açılır. Rıhtım › Gemi ve tersane'den takılır.", "çıkartma kozmetik gemi"));
  r.push(row("Yol arkadaşı görevleri", "", "Bağ 65 ve 85'te her yol arkadaşı küçük bir görev ister (eşya ya da para). Tamamlayınca para, bağ ve moral kazanırsın.", "görev bağ arkadaş"));
  r.push(row('Günün işi', '+%25', 'Her sabah teslimat, tamir ya da ayrıştırmadan biri seçilir; o türün ilanları gün boyu %25 fazla öder. İş kartında "Günün işi" etiketi görünür.', 'günün işi bonus çeşitlilik'));
  r.push(row('Hurda yorgunluğu', '−%15/dalış', 'Günün ilk 3 dalışı (sözleşme ya da serbest) tam değer getirir; 4. dalıştan itibaren her biri %15 daha az. Günün Avı sayılmaz.', 'yorgunluk dalış hurda'));
  r.push(row('Moral primi', '+%5 / −%10', 'Moral 85 ve üstündeyken iş ödemeleri %5 fazla, 50\'nin altındayken %10 az.', 'moral ödeme'));
  r.push(row('★ En verimli', '', 'İş kartında saat başına tahmini kazanç yazar; şu an yapılabilecek en verimli iş yıldızla işaretlenir.', 'verim yıldız'));
  r.push(row('Kilometre taşı', '8–10 gün', 'Haritadaki Hedefler panelinde. Süresi içinde tamamlarsan büyük ödül ve moral; kaçırırsan yenisi gelir.', 'kilometre hedef'));
  return sec('jobs', 'İşler', 'Ödemeler bugünkü çarpanlarla gösterilir (gün, gemi, rütbe; itibar hariç).', r);
}
function itemsSec() {
  const ZN = Object.fromEntries(SS.ZONES.map(z => [z.id, z.name]));
  const where = k => {
    const z = SS.ZONES.filter(Z => (Z.mix[k] || 0) > 0 || ((SS.ZONE_EXTRA || {})[Z.id] || {})[k]).map(Z => ZN[Z.id]);
    const extra = { gold: 'Zengin damar sahası', ice: 'Buz kuşağı sahası', jelly: 'Yuva sahası', egg: 'Yuva sahası', amber: 'Balina göçü sahası', relic: 'her bölgenin kendi eserleri' }[k];
    return [...z, extra].filter(Boolean).join(', ') || '—';
  };
  const DEEP = { crystal: 1, sat: 1, slime: 1, jelly: 1, egg: 1, amber: 1, relic: 1 };
  const r = Object.entries(SS.ITEMS).filter(([k]) => k !== 'debris').map(([k, T]) => {
    const special = { box: 'Kara kutu: içinden para, yakıt, torpido, kristal, kayıt parçası ya da tuzak çıkar. Radar içini gösterir.', tank: 'Patlar, çevresini yok eder ve sağlığını düşürür. Kaçın.', mimic: 'Kara kutuya benzer, ara sıra dişlerini gösterir. Tutarsan ısırır: 4 sn ve sağlık. Radar işaretler.',
      jelly: 'Parlarken tutarsan çarpar (−3 sn). Sönükken topla.', bug: 'Hareket eder.', slime: 'Hareket eder, sırtında kristal taşır.', relic: 'Albüme girer, set ödülleri açar. Ekipman primi uygulanmaz.' }[k] || '';
    const v = T.val ? `≈${fmt(k === 'relic' ? T.val * .8 : scrapVal(k))}` : '—';
    return row(T.name, v, `${T.cat ? SS.CATS[T.cat] : 'Özel'} · ağırlık ${T.wt} · ${where(k)}${DEEP[k] ? ' · Derin Tarama Sertifikası gerekir' : ''}${special ? ' · ' + special : ''}`, 'hurda eşya ' + k);
  });
  r.push(row('Ekipman primi', window.S ? `+%${Math.round((SS.gearMult() - 1) * 100)}` : '', 'Kanca, vinç, pençe ve radarın her seviyesi satışta hurda değerine +%2,5 ekler (gemiyle gelen seviyeler dahil). Pazardaki fiyatlarda görünür.', 'ekipman satış'));
  r.push(row('Bölge çarpanı', '', 'Değerler bölgenin çarpanıyla büyür (Bölgeler bölümü). Pazar fiyatı her sabah kategoriye göre değişir; aynı gün aynı türden her satış %3 düşürür.', 'fiyat'));
  r.push(row('Eser takası', '2 → 1', 'Pazar\'daki koleksiyon masası: kargondaki 2 eseri albümünde olmayan 1 eserle değiştirir (tamamlanmaya en yakın setten).', 'takas eser'));
  r.push(row('Set primi', '+%3/set', 'Tamamlanan her eser seti tüm satışlara kalıcı +%3 ekler. Setin tek eseri eksikken o eserin çıkma şansı iki katı.', 'set prim'));
  return sec('items', 'Hurda ve eşyalar', 'Değerler Asteroit Kuşağı taban değeridir; bölge çarpanı ve pazar fiyatıyla değişir.', r);
}
function zonesSec() {
  const r = SS.ZONES.map(z => { const L = SS.ZONE_LIC && SS.ZONE_LIC[z.id]; return row(z.name, `x${z.mult}`, `${z.fuel} yakıt · ${z.desc}${L ? ` · ${SS.LICENSES[L].name} gerekir` : ''}${z.story ? ' · Halcyon kayıtlarının 5 parçası gerekir' : ''}`, 'bölge'); });
  (SS.HUNT_VARIANTS || []).forEach(v => r.push(row(`Saha: ${v.name}`, '', v.hint, 'saha koşulu')));
  r.push(row('Bölge stoku', '', 'Her dalış bölgeyi %22 tüketir (en az %35 kalır); her gece yarısı kadar yenilenir.', 'stok'));
  return sec('zones', 'Bölgeler ve saha koşulları', 'Her dalışta bölgeye göre rastgele bir saha koşulu seçilir; adı oyunun başında yazar.', r);
}
function shipSec() {
  const r = SS.SHIP.map(u => row(u.name, u.costs.map(c => fmt(window.S ? SS.upCost(u, 0) / u.costs[0] * c : c)).join(' / '), u.desc, 'geliştirme hangar ' + u.group));
  SS.SHIPS.forEach((s, i) => r.push(row(s.name, i ? fmt(s.price) : 'başlangıç', `${s.desc} Ambar ${s.cargo}, tank ${s.tank}. Takasta ${fmt(s.trade)} + geliştirmelere harcadığının %35'i düşülür.`, 'gemi tersane')));
  r.push(row('Yeni gemiye geçiş', '', 'Geliştirmeler yeni gemiye taşınmaz; yeni gemi kendi taban seviyeleriyle gelir. Nakit ya da en az %20 peşinatla banka kredisiyle alınır. Banka kredisinin süresi Martı için 112, Balina için 140 gündür; 3 gecikmede ya da süre dolunca banka gemiye el koyar ve oyun biter.', 'tersane banka'));
  return sec('ship', 'Gemi ve geliştirmeler', 'Geliştirme fiyatları her yeni gemide %60 artar.', r);
}
function academySec() {
  const r = SS.LIC_ORDER.map(id => { const L = SS.LICENSES[id]; return row(L.name, `${L.lessons} ders · ${fmt(Math.round(L.fee * cm()))}/ders`, `${L.desc}${L.req ? ` Önce: ${SS.LICENSES[L.req].name}.` : ''}`, 'lisans akademi'); });
  SS.SKILLS.forEach(s => r.push(row(s.name, `${fmt(window.S ? SS.trainCost(0) : 250)}'den başlar`, `${s.desc} Seviye başına: ${SS.SKILL_FX[s.id](1)}. En fazla 5 seviye; her eğitim ${SS.DUR.train / 60} saat, ${SS.COST.train} enerji.`, 'beceri akademi')));
  return sec('academy', 'Akademi', `Ders ${SS.LESSON.mins / 60} saat ve ${SS.LESSON.energy} enerji sürer; günde her lisanstan bir ders alınır. Son ders 3 soruluk sınav: 2 doğru gerekir, kalırsan ertesi gün tekrar girersin.`, r);
}
function homeSec() {
  const r = SS.HOMES.map((h, i) => row(h.name, i ? fmt(h.cost) : 'başlangıç', `Uyku +${h.sleep} enerji · ${SS.DECOR_SLOTS[i]} dekor yuvası · ısıtma ${fmt([12, 16, 22][i])}/gece${i ? ` · aylık aidat ${fmt([0, 140, 300][i])}` : ''}`, 'ev'));
  SS.EXTRAS.forEach(x => r.push(row(x.name, fmt(x.cost), `${x.desc} Aylık bakım ₡60.`, 'ev eklenti')));
  SS.DECOR.forEach(d => r.push(row(d.name, fmt(d.price), `${d.desc}${d.rare ? ' · nadir: seyyar satıcı' : ''}${String(d.id).startsWith('set_') ? ' · albüm set ödülü' : ''}`, 'dekor')));
  return sec('home', 'Ev ve dekor', 'Dekorlar yerleştirildiği sürece etki eder. Depodaki dekoru satarsan fiyatının %40\'ı geri gelir.', r);
}
function crewSec() {
  const r = [];
  SS.COMPANIONS.forEach(c => {
    r.push(row(c.name, `${fmt(c.daily)}/gece`, `${c.kind}. ${c.pros.join('; ')}. Eksileri: ${c.cons.join('; ')}.`, 'hane ' + c.id));
    r.push(row(`${c.name}: ${SS.ABILITIES[c.id].name}`, 'günde 1', SS.ABILITIES[c.id].desc, 'yetenek'));
    r.push(row(`${c.name}: ${SS.ROOMS[c.id].name}`, fmt(SS.ROOMS[c.id].price), SS.ROOMS[c.id].desc, 'oda'));
    (SS.BOND_PERKS[c.id] || []).forEach(([lv, t]) => r.push(row(`${c.name} · bağ ${lv}`, '', t, 'bağ')));
  });
  r.push(row('Görevler', '', 'Seninle: işte yardım eder. Çalışsın: gece ücret getirir. Dinlensin: bağ +4, moral +2.', 'görev'));
  Object.entries(SS.PASSIVES || {}).forEach(([id, p]) => r.push(row(`${SS.comp(id).name}: ${p.name}`, 'pasif', p.desc, 'pasif')));
  r.push(row('Barışma', '', 'Bağ 40\'ın altına düşünce bültende uyarı gelir. 35\'in altında küsen arkadaşla bir karar anı açılır: birlikte vakit geçir (1 sa, bağ +15) ya da hediye al (₡80, bağ +18).', 'barış küs bağ'));
  return sec('crew', 'Hane', 'Akşam defterinde doyurulmayan (Pıtırcık şarj edilmeyen) üyenin bağı düşer; iki gece aç kalan hastalanır, ilaçsız üç gece geçerse ayrılır.', r);
}
function costsSec() {
  const c = cm(), M = window.S ? SS.M() : { oxygen: 12, dock: 100, rent: 480, installment: 700, interest: .02 };
  const r = [
    row('Oksijen ve su', `${fmt(M.oxygen)}/gece`, 'Zorunlu.', 'gece'),
    row('Akşam yemeği', `${fmt(14 * c)}/gece`, 'İsteğe bağlı; atlarsan tokluk 15 daha düşer.', 'gece'),
    row('Isıtma', `${fmt(12 * c)}–${fmt(22 * c)}/gece`, 'İsteğe bağlı; kapatırsan moral ve sağlık düşer, hane hastalanabilir. Halı ve perde ucuzlatır.', 'gece'),
    row('Hane ihtiyaçları', '', 'Her üye için gecelik yemek ya da şarj; hastaysa ilaç.', 'gece hane'),
    row('Rıhtım ücreti', `${fmt(M.dock)} × gemi`, 'Her 7 günde, zorunlu. Pelikan ×1, Martı ×2,5, Balina ×4.', 'hafta'),
    row('Gemi bakımı ve sigortası', [45, 120, 210].map(v => fmt(v * c)).join(' / '), 'Her 7 günde, zorunlu; gemi büyüdükçe artar.', 'hafta'),
    row('Ela\'nın okulu', fmt(60 * c), 'Ela hanedeyse her 7 günde.', 'hafta ela'),
    row('Kira', `${fmt(M.rent)} × ev`, 'Her 28 günde, zorunlu. Daire ×1,6, Ev ×2,4.', 'ay'),
    row('Ev aidatı', [140, 300].map(v => fmt(v * c)).join(' / '), 'Her 28 günde; Daire ve İstasyon Evi için.', 'ay'),
    row('Bahçe ve atölye bakımı', `${fmt(60 * c)} her biri`, 'Her 28 günde.', 'ay'),
    row('Krell taksiti', fmt(SS.RULES.installment), `Her 28 günde; aylık faiz %${Math.round(SS.RULES.interest * 100)}. ${SS.RULES.deadline}. güne kadar borç bitmeli.`, 'ay borç'),
    row('Banka taksiti', 'kredinin %6\'sı', 'Yeni gemiyi krediyle alırsan her 28 günde; aylık faiz %1. Süre: Martı 112, Balina 140 gün. Kredi başlayınca gecikme sayacı sıfırlanır.', 'ay banka borç'),
    row('Gecikme', '', 'Zorunlu ödemeye para yetmezse kalan %10 cezayla gecikmiş borca yazılır ve bir gecikme sayılır. 3 gecikmede oyun biter: Krell borcundayken istasyondan atılırsın, banka kredisindeyken banka gemine el koyar, borcun yokken istasyon gemini çeker.', 'gecikme'),
  ];
  r.push(row('Beklenmedik masraf', '10–14 günde bir', 'Motor arızası, vergi, tıbbi fatura gibi. Tutar nakdinin yaklaşık %20–30\'u. Öde, 7 gün ertele (%25 fazlası) ya da tamir mini oyunuyla %40\'a indir. Karar vermezsen o gece tamamı ödenir.', 'masraf fatura arıza'));
  r.push(row('Yeni gemi indirimi', '%50 · 7 gece', 'Gemi aldıktan sonraki 7 gece rıhtım ve gemi bakımı yarı fiyat. Tersane satın almadan önce önerilen rezervi gösterir.', 'gemi rezerv'));
  r.push(row('Borç takvimi', '', 'Üstteki Borç düğmesi: kalan borç, son gün, gecikmeler ve önümüzdeki 28 günün zorunlu ödemeleri.', 'takvim borç'));
  return sec('costs', 'Masraflar', 'Hepsi akşam defterinde listelenir; zorunlu olanlar otomatik düşer.', r);
}
function trialsSec() {
  const r = (SS.TRIALS || []).map(t => row(t.title, t.gameName, `Kaybedersen: ${t.loseDesc}. Kazanırsan hiçbir şey kaybetmezsin ve küçük bir ödül alırsın.`, 'sınama ' + t.id));
  r.push(row('Karar vermezsen', '', 'Gün biterken çözülmemiş sınama kaybedilmiş sayılır.', 'sınama'));
  r.push(row('Yardımcılar', '', 'Tolga talebi pazarlıkla düşürmeyi dener; Tolga savunmada +1 kalkan, Pıtırcık virüste +1 tolerans ve meteorları önceden gösterir, Ela laboratuvarda +1 hak verir. Klinik aşısı salgından korur.', 'sınama yardım'));
  return sec('trials', 'Sınamalar', 'Tehlike ayarına ve şansa göre 4–9 günde bir çıkar. Talepler oyun ilerledikçe büyür. Mücadele 30 dakika ve 8 enerji sürer.', r);
}
function casinoSec() {
  const r = [
    row('Yüksek mi alçak mı', '20 dk · 5 en', 'Sıradaki kart yüksek mi alçak mı? Seri uzadıkça pot büyür; günde 4 el.', 'kart'),
    row('Yıldız Çarkı', '×0 – ×4', '12 dilim; çoğu boş.', 'çark'),
    row('Kara Delik Zarı', '×2,2 – ×5', 'Alçak (2–6) ya da yüksek (8–12) ×2,2; tam 7 ya da çift ×5.', 'zar'),
    row('Meteor Yarışı', '×2 – ×9', 'Favori az, sürpriz çok öder.', 'yarış'),
    row('Nebula Slotu', '×0,9 – ×40', 'Üç aynı sembol büyük öder; iki aynı bahsin bir kısmını geri verir.', 'slot'),
    row('Kurallar', '', 'El başı 15 dakika ve 3 enerji, günde en fazla 8 el. Kasa uzun vadede kazanır. Kazanç moral verir, kayıp moral alır. 25 elde Gümüş üyelik daha yüksek bahis açar. Kumar kazancı Rex yarışına sayılmaz.', 'kural'),
  ];
  if (SS.casEdges) { const E = SS.casEdges(); r.push(row('Kasa avantajı', '', `Çark ${E.wheel}, zar ${E.dice}, meteor yarışı ${E.race}, slot ${E.slot}. Kart masası beceriye bağlı.`, 'kasa avantaj oran')); }
  r.push(row('Şanslı gece', 'haftanın 5. günü', 'O gece ödemeler kasa avantajını sıfırlayacak kadar büyür: uzun vadede başabaş.', 'şanslı gece'));
  return sec('casino', 'Kumarhane', `Nebula Kumarhanesi ${hours('casino')} açık.`, r);
}
const BUILD = { where: whereSec, energy: energySec, jobs: jobsSec, items: itemsSec, zones: zonesSec, ship: shipSec, academy: academySec, home: homeSec, crew: crewSec, costs: costsSec, trials: trialsSec, casino: casinoSec };
SS.rehberHtml = () => `<div class="rehber">
  <input id="rhQ" class="code-in rh-q" type="search" placeholder="Ara: kahve, kristal, lisans, yakıt…" autocomplete="off" aria-label="Rehberde ara">
  <div class="gnav rh-nav">${CATS.map(([id, n]) => `<button class="chip" data-act="rhGo" data-s="${id}">${n}</button>`).join('')}</div>
  <p class="rh-empty" hidden>Sonuç yok. Başka bir kelime dene.</p>
  ${CATS.map(([id]) => BUILD[id]()).join('')}</div>`;
SS.rehberModal = cat => {
  SS.modal(`<p class="eyebrow">Rehber · her yerden açılır</p><h2>Ne, nerede, ne işe yarar?</h2>${SS.rehberHtml()}
    <div class="row">${btn('Nasıl oynanır', 'guide', { s: 'start' }, 'ghost')}${btn('Kapat', 'close', {}, 'primary')}</div>`, 'guide-sheet rehber-sheet', { dismiss: true });
  if (cat) ACT.rhGo({ s: cat });
};
ACT.rehber = d => SS.rehberModal(d && d.s);
ACT.rhGo = d => { const el = document.getElementById('rh-' + d.s); if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' }); };
document.addEventListener('input', e => {
  if (e.target.id !== 'rhQ') return;
  const q = e.target.value.trim().toLocaleLowerCase('tr'), box = e.target.closest('.rehber');
  let any = false;
  box.querySelectorAll('.rh-sec').forEach(s => {
    let n = 0; s.querySelectorAll('.rh-row').forEach(r => { const ok = !q || r.dataset.k.includes(q); r.hidden = !ok; if (ok) n++; });
    s.hidden = !n; if (n) any = true;
  });
  box.querySelector('.rh-empty').hidden = any;
});

/* ---------- "Nasıl oynanır" bölümleri (güncel sayılarla) ---------- */
SS.GUIDE = [
  { id: 'start', title: 'Amaç ve gün', body: `
<p><b>Amaç:</b> Krell'e olan ₡12.000 borcu ${SS.RULES.deadline} gün içinde kapat. Sonra Paslı Pelikan'ı takasa verip Gezgin Martı'yı, en sonunda Demir Balina'yı al. Yolda rütbe atla, Rex'i haftalık yarışta yen, Halcyon'un kayıtlarını ve kayıp eserleri topla.</p>
<p><b>Gün:</b> 07:00'de başlar, 01:00'de iş biter. Her iş, yolculuk, ders ve yemek dakika harcar. Gün sonunda Yaşam Modülü'ne dön, akşam defterini kapat ve uyu.</p>
<p><b>Akşam defteri:</b> Zorunlu ödemeler (oksijen, rıhtım, gemi bakımı, kira, aidat, taksit) otomatik düşer. Akşam yemeği, ısıtma ve hanenin ihtiyaçları senin kararın.</p>
<p><b>Sabah bülteni:</b> Manşet, gece olanlar, hane durumu, dünün kararları, piyasa ve varsa sınama.</p>
<p><b>Takıldığında:</b> Menüdeki <b>Rehber</b> her eşyanın nereden alındığını ve ne işe yaradığını gösterir; aramayla bulabilirsin.</p>` },
  { id: 'first', title: 'İlk hafta', body: `
<ol><li>İş Merkezi'nden bir <b>hurda sözleşmesi</b> al; başta tek lisansın hurdaya yeter.</li>
<li>Enerjin düşünce üstteki <b>⚡ düğmesiyle reklam izle</b> (+40 enerji, günde 3), evde bedava <b>kestirme</b> yap (günde bir, +25) ya da kantinde ye-iç (yiyecek ve içecekten günde en fazla +35 enerji).</li>
<li>Kargo dolunca Pazar'da sat. Aynı gün aynı türden çok satma; fiyat düşer.</li>
<li>Akademi'de ilk lisansa başla: <b>Ayrıştırma</b> tek derslik, <b>Tamir</b> riski az.</li>
<li>Para biriktikçe Hangar'da <b>Kargo Bölmesi</b> ve <b>Vinç</b>; bunlar hem hızlandırır hem ekipman primiyle satış fiyatını artırır.</li>
<li>Uyku Kapsülü gecede 40 enerji verir; <b>Küçük Daire</b> 48, İstasyon Evi 56. Daha büyük ev ayrıca dekor yuvası ve moral getirir.</li></ol>` },
  { id: 'map', title: 'Harita ve yolculuk', body: `
<p>Ana ekran istasyon haritası. Bir modüle dokununca oraya gidersin; yol 10–50 dakika ve 1–5 enerji tutar.</p>
<ul><li>Açılış saatleri: İş Merkezi 07–24, Pazar 08–23, Klinik 08–22, Akademi 09–21, Krell 09–20, Kumarhane 16–02. Yaşam Modülü, Kantin ve Hangar gece de açık. Sabahları iş ve ders, akşamları alışveriş, sohbet ve kumarhane için vakit kalır.</li>
<li>Üst şerit: Rex yarışı, sıradaki gemiye ilerleme, rütbe. Alt şerit: karar, hedefler, hane, sınama, Günün Avı ve bülten.</li>
<li>En alttaki çubuk: Harita, bulunduğun yer, Seyir Defteri ve <b>☾ Uyu</b> (her yerden eve gidip akşam defterini açar).</li>
<li><b>Rota</b> düğmesiyle 5 durağa kadar plan yap; üst şeritteki ▶ düğmesi seni sıradaki durağa götürür.</li>
<li>Üst şerit kalan saati, enerjine göre yapılabilecek iş sayısını ve bulunduğun yerin kapanmasına 1 saat kala uyarıyı gösterir. Konum adına dokunmak o yerin rehberini açar.</li></ul>` },
  { id: 'stats', title: 'Enerji ve göstergeler', body: `
<ul><li><b>Enerji</b>: Uyku (ev seviyesine göre 40/48/56), kestirme +25 (günde bir), yiyecek ve içecek (günde toplam en fazla +35), Ela'nın konuşması (+10) ve ödüllü reklam (+40, günde 3; üstteki ⚡ düğmesi) doldurur. Reklamsız da oynanır; reklam izleyen günde 1–2 iş fazla yapar.</li>
<li><b>Tokluk</b>: Her gece düşer. 25 altında uyku zayıflar, 12 altında sağlık bozulur.</li>
<li><b>Sağlık</b>: Patlama, sert iniş, açlık ve sınamalar düşürür. 0'da hastanelik olursun.</li>
<li><b>Moral</b>: 70+ mini oyunlarda +5 saniye, 30 altı −6 saniye. 85+ iken iş ödemeleri +%5, 50 altında −%10. Her gece kendiliğinden azalır (yüksekken daha hızlı); işler, yemek, sohbet, dekor ve kumar kazancı yükseltir.</li></ul>` },
  { id: 'money', title: 'Para nasıl kazanılır', body: `
<ul><li><b>Serbest dalış</b> (Hangar): yükün tamamı senin, değerler %25 fazla, eser şansı yüksek.</li>
<li><b>Hurda sözleşmesi</b> (İş Merkezi): sabit ücret + hedef başına ödeme + tamamlama primi; hedef dışı her şey de kargona.</li>
<li><b>Teslimat, tamir, ayrıştırma, sipariş</b>: lisansla açılır.</li>
<li><b>Satış</b>: Pazar fiyatı her sabah değişir; ekipman primi (her hurda donanımı seviyesi +%2,5) fiyata eklenir.</li>
<li><b>Ekstra</b>: günlük hedefler, 8–10 günlük kilometre taşları, Rex yarışı ödülü, hanenin gece işleri, sınama zaferleri, set ödülleri.</li>
<li><b>Çeşitlilik öder</b>: her gün bir "günün işi" %25 fazla öder; günün 4. dalışından itibaren hurda değeri %15'er düşer.</li></ul>` },
  { id: 'jobs', title: 'İş Merkezi ve Akademi', body: `
<p>İlanlar 07, 10, 13, 16, 19 ve 22'de yenilenir; 19:00 sonrası %10 gece zammı. Her işin başarısı kendi itibarını artırır (seviye başına +%4).</p>
<p>Başta yalnızca hurda sözleşmeleri açıktır. Akademi'de lisans al: Kargo Pilotu (teslimat), Ayrıştırma, Devre Teknisyeni (tamir), Ticaret Ruhsatı (sipariş), Derin Tarama (kristal, uydu, eser, Gaz Devi) ve Tehlikeli Bölge (Korsan Sektörü, Kayıp Yıldız). Günde bir ders; son ders 3 soruluk sınav.</p>
<p>Beceriler de Akademi'de: Pilotluk, Mühendislik, Pazarlık, Kondisyon.</p>` },
  { id: 'hunt', title: 'Hurda avı', body: `
<ul><li>Kancayı doğru açıda at; ağır yük yavaş sarılır. Torpido tutulan yükü patlatır.</li>
<li>Her dalışta bir saha koşulu çıkar: Akıntı, Karanlık bölge, Meteor yağmuru, Yılan yuvası, Balina göçü, Korsan dronları, Zengin damar, Buz kuşağı, Yuva.</li>
<li>Kaçın: patlayıcı tank, taklitçi kutu, parlarken denizanası. Dronları kancayla düşür.</li>
<li>Aynı bölgeye sık dalarsan stok azalır; her gece yarısı kadar yenilenir.</li></ul>` },
  { id: 'hangar', title: 'Hangar ve gemi', body: `
<ul><li><b>Hurda donanımı</b> (kanca, vinç, pençe, radar): dalışı kolaylaştırır ve her seviye satışta hurda değerine +%2,5 ekler.</li>
<li><b>Uçuş ve gövde</b>: teslimat ve hasar. <b>Ambar</b>: kapasite. <b>Takım çantası</b>: tamir.</li>
<li><b>Tersane</b>: borç bitince eski gemini takasa ver. Geliştirmeler yeni gemiye taşınmaz ama takas değerine %35'i eklenir. Yeni gemi kendi taban seviyeleriyle gelir.</li></ul>` },
  { id: 'home', title: 'Ev ve hane', body: `
<ul><li><b>Odalar</b>: dekorları yuvalara yerleştir; her dekor moral, uyku, ısıtma ya da bağ etkisi verir.</li>
<li><b>Ev</b>: Daire ve İstasyon Evi daha çok uyku ve yuva verir ama kira, ısıtma ve aidat artar.</li>
<li><b>Hane</b>: her arkadaşa görev ver, günde bir yeteneğini kullan, odasını kur. Bağ 30, 60 ve 90'da ayrıcalıklar açılır.</li>
<li><b>Pasifler</b>: Pıtırcık seninleyken yolculuk %20 kısa; Ela seninleyken satışlar +%3; Tolga seninleyken tamirde +15 saniye ve teslimatta +%10 ödeme.</li>
<li><b>Barışma</b>: bağ 40'ın altına düşünce uyarı gelir; 35'in altında bir barışma karar anı açılır.</li></ul>` },
  { id: 'trials', title: 'Sınamalar', body: `
<p>4–9 günde bir (tehlike ayarına ve şansa göre) korsan haracı, meteor yağmuru, virüs, salgın ya da denetim çıkar. Talepler oyun ilerledikçe büyür.</p>
<p>Ya öde ya da kısa bir mini oyunla mücadele et (30 dk, 8 enerji). Kazanırsan hiçbir şey kaybetmez, ödül alırsın; kaybedersen para, dekor, kargo, yakıt, sağlık ya da moral gider. Gün biterken karar vermediysen kaybetmiş sayılırsın.</p>` },
  { id: 'casino', title: 'Kumarhane', body: `<p>16:00–02:00. Kart, çark, zar, meteor yarışı ve slot. El başı 15 dk ve 3 enerji, günde en fazla 8 el. Kasa uzun vadede kazanır; her masanın kasa avantajı kartında yazar. Haftanın 5. günü <b>şanslı gece</b>: kasa avantajı yok.</p>` },
  { id: 'costs', title: 'Masraflar ve gecikmeler', body: `
<ul><li><b>Her gece</b>: oksijen (zorunlu); yemek, ısıtma, hane ihtiyaçları (senin kararın).</li>
<li><b>Her 7 günde</b>: rıhtım ücreti ve gemi bakımı (gemi büyüdükçe artar), Ela varsa okul. Rex yarışı sonuçlanır.</li>
<li><b>Her 28 günde</b>: kira, ev aidatı, bahçe/atölye bakımı, taksit ve faiz.</li>
<li><b>Beklenmedik masraf</b>: 10–14 günde bir; öde, ertele ya da kendin onar.</li>
<li><b>Yeni gemi</b>: ilk 7 gece rıhtım ve bakım yarı fiyat. Satın almadan önce tersane önerilen rezervi gösterir.</li>
<li><b>Gecikme</b>: zorunlu ödemeye para yetmezse kalan %10 cezayla gecikmiş borca yazılır. 3 gecikmede oyun biter. Üstteki Borç düğmesi ödeme takvimini açar.</li></ul>` },
  { id: 'ease', title: 'Kolaylıklar', body: `
<ul><li><b>Otomatik yakıt</b> (açık): dalış ve teslimattan önce yakıt azsa tankı doldurur, akşam için en az ₡150 bırakır.</li>
<li><b>Otomatik satış</b> (kapalı): dalıştan önce ambar %60'tan doluysa eser ve sipariş eşyaları dışındakini %5 aracı payıyla satar.</li>
<li>İş bitince <b>Benzer iş</b> ya da <b>Tekrar dal</b> düğmesiyle tek dokunuşla devam et.</li>
<li>Enerji bir işe yetmiyorsa reklam teklifi doğrudan iş kartında çıkar.</li>
<li>Seyir Defteri → Ayarlar: yavaş mini oyunlar (%80), büyük yazı, titreşim, solak düzeni.</li></ul>` },
  { id: 'social', title: 'Günün Avı ve paylaşım', body: `<p>Haritadaki <b>Günün Avı</b>: herkes için aynı alan, 45 saniye; saat ve enerji harcamaz. Skorunu ve meydan okuma kodunu paylaş, arkadaşının kodunu girip onu geçmeye çalış. Seyir Defteri'nden haftanı, bültenden dünü paylaşabilirsin.</p>` },
];

})(window.SS);

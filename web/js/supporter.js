// Space Scrapper — Destekçi paketi: Google Play'den tek seferlik satın alma (cordova-plugin-purchase).
// İçerik: reklam izlemeden enerji hakkı (günde 3 sınırı aynen geçerli), 2 özel gemi boyası, 2 özel çıkartma.
// Satın alma yalnızca Android uygulamasında; web sürümünde paket tanıtılır ama satılmaz.
// Play Console'da "supporter_pack" kimlikli, tek seferlik (yönetilen) bir ürün oluşturulmalıdır.
(function(SS){
const KEY = 'space-scrapper-supporter', PID = 'supporter_pack';
const { btn } = SS.ui;
const ACT = SS.ACT;
let owned = false, product = null, store = null, busy = false;
try { owned = localStorage.getItem(KEY) === '1'; } catch (e) {}
SS.supporter = () => owned;
const grant = () => {
  if (owned) return;
  owned = true; try { localStorage.setItem(KEY, '1'); } catch (e) {}
  SS.toast && SS.toast('Teşekkürler! Destekçi paketi açıldı: reklamsız enerji, özel boyalar ve çıkartmalar.', 'good');
  SS.sfx && SS.sfx('win'); SS.checkDecals && SS.checkDecals(); SS.render && SS.render();
};

/* ---------- Google Play bağlantısı ---------- */
document.addEventListener('deviceready', () => {
  const C = window.CdvPurchase; if (!C) return;
  store = C.store;
  try {
    store.register([{ id: PID, type: C.ProductType.NON_CONSUMABLE, platform: C.Platform.GOOGLE_PLAY }]);
    store.when()
      .productUpdated(p => { if (p.id === PID) { product = p; if (p.owned) grant(); } })
      .approved(t => t.verify())
      .verified(r => r.finish())
      .finished(() => { if (store.owned(PID)) grant(); })
      .receiptUpdated(() => { if (store.owned(PID)) grant(); });
    store.error(e => { busy = false; if (e && e.code !== C.ErrorCode.PAYMENT_CANCELLED) SS.toast && SS.toast('Satın alma tamamlanamadı. Daha sonra tekrar dene.', 'bad'); SS.render && window.S && SS.render(); });
    store.initialize([C.Platform.GOOGLE_PLAY]).then(() => { product = store.get(PID) || product; if (store.owned(PID)) grant(); }).catch(() => {});
  } catch (e) {}
}, false);
SS.supporterPrice = () => (product && product.pricing && product.pricing.price) || '';

/* ---------- avantajlar ---------- */
// 1) reklamsız enerji: reklam ekranı atlanır, günlük hak sınırı aynı kalır
// (events.js 'ad:needed': false → reklam ve müzik molası hiç başlamaz, done() hemen çağrılır)
SS.on('ad:needed', () => (owned ? false : undefined), { order: 10 });
// 2) özel boyalar
SS.PAINTS.push(
  { id: 'destekci', name: 'Destekçi altını', price: 0, hull: ['#f5c542', '#8a5a12', '#fff4cf'], unlock: 'supporter' },
  { id: 'hologram', name: 'Nebula hologramı', price: 0, hull: ['#5ef0ff', '#3a2a8f', '#e9fbff'], unlock: 'supporter' },
);
SS.paintOwned = p => !!((S.paints || {})[p.id] || (p.unlock === 'supporter' ? owned : p.unlock && (S.setsDone || {})[p.unlock]));
// 3) özel çıkartmalar
if (SS.DECALS) SS.DECALS.push(
  { id: 'crown', name: 'Destekçi tacı', how: 'Destekçi paketi', sym: '♛', col: SS.DECAL_COL.crown, test: () => owned },
  { id: 'paw', name: 'Pıtırcık patisi', how: 'Destekçi paketi', sym: '🐾', col: SS.DECAL_COL.paw, test: () => owned },
);
const _decal = SS.drawDecal;
if (_decal) SS.drawDecal = (c, id, x, y, s) => {
  if (id !== 'crown' && id !== 'paw') return _decal(c, id, x, y, s);
  c.save(); c.translate(x, y); c.scale(s, s); c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 1; c.beginPath();
  if (id === 'crown') { c.fillStyle = SS.DECAL_COL.crown; c.moveTo(-7, 5); c.lineTo(-7, -3); c.lineTo(-3.5, 1); c.lineTo(0, -6); c.lineTo(3.5, 1); c.lineTo(7, -3); c.lineTo(7, 5); c.closePath(); c.fill(); c.stroke(); }
  else { c.fillStyle = SS.DECAL_COL.paw; c.ellipse(0, 2.5, 4.2, 3.4, 0, 0, Math.PI * 2); c.fill(); [[-5, -2.5], [-1.8, -5.5], [1.8, -5.5], [5, -2.5]].forEach(([a, b]) => { c.beginPath(); c.arc(a, b, 1.7, 0, Math.PI * 2); c.fill(); }); }
  c.restore();
};

/* ---------- arayüz: Seyir Defteri › Ayarlar ---------- */
SS.supporterPanel = () => {
  const app = SS.isApp && SS.isApp(), price = SS.supporterPrice();
  const perks = '<ul class="sup-perks"><li>Enerji hakkı reklam izlemeden anında gelir (günde 3 hak aynen geçerli)</li><li>2 özel gemi boyası: Destekçi altını, Nebula hologramı</li><li>2 özel çıkartma: Destekçi tacı, Pıtırcık patisi</li><li>Oyunun geliştirilmesine destek olursun</li></ul>';
  const body = owned ? `<p><b>Destekçisin, teşekkürler!</b> Bütün avantajlar açık.</p>${perks}`
    : app ? `${perks}<div class="row">${btn(price ? `Satın al · ${price}` : 'Satın al', 'buySupporter', {}, 'primary', busy)}${btn('Satın alımı geri yükle', 'restoreSupporter', {}, 'ghost sm')}</div><small class="muted">Tek seferlik ödeme; abonelik değildir. Oyunun tamamı paket olmadan da oynanabilir.</small>`
    : `${perks}<p class="muted">Destekçi paketi Space Scrapper'ın Android uygulamasında satın alınabilir.</p>`;
  return SS.ui.panel('Destekçi paketi', body, { code: 'DST' });
};
const _a11y = SS.a11yPanel;
SS.a11yPanel = () => SS.supporterPanel() + (_a11y ? _a11y() : '');
ACT.buySupporter = () => {
  if (owned || busy) return;
  const C = window.CdvPurchase, p = product || (store && store.get(PID));
  if (!C || !store || !p) return SS.toast('Google Play bağlantısı hazır değil. Biraz sonra tekrar dene.', 'bad');
  const offer = p.getOffer && p.getOffer(); if (!offer) return SS.toast('Ürün şu anda satın alınamıyor.', 'bad');
  busy = true; SS.render();
  store.order(offer).then(err => { busy = false; if (err && err.code !== C.ErrorCode.PAYMENT_CANCELLED) SS.toast('Satın alma tamamlanamadı.', 'bad'); SS.render(); })
    .catch(() => { busy = false; SS.toast('Satın alma tamamlanamadı.', 'bad'); SS.render(); });
};
ACT.restoreSupporter = () => {
  if (!store) return SS.toast('Google Play bağlantısı hazır değil.', 'bad');
  store.restorePurchases().then(() => { if (store.owned(PID)) grant(); else SS.toast('Bu hesapta destekçi paketi bulunamadı.'); })
    .catch(() => { busy = false; SS.toast('Satın alma tamamlanamadı. Daha sonra tekrar dene.', 'bad'); SS.render(); });
};
})(window.SS);

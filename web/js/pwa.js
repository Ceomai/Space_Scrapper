// Space Scrapper — PWA katmanı: service worker, ana ekrana ekleme, telefonun paylaşım menüsü,
// titreşim ve ana ekrandan açıldığında Android geri tuşu. Mağaza sarmalayıcısı (TWA / Capacitor) ileride
// window.SS_NATIVE sağlarsa oyun onu kullanmaya devam eder; yoksa bu web karşılıkları devreye girer.
(function(SS){
const ACT = SS.ACT, { btn } = SS.ui;
const standalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;

/* ---------- service worker ---------- */
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => {}); });
}

/* ---------- paylaşım: telefonun paylaşım menüsü, yoksa kopyala penceresi ---------- */
const fallbackShare = SS.share;
SS.share = async ({ image, text }) => {
  if (SS.native()) return fallbackShare({ image, text });
  if (navigator.share) {
    try {
      let files;
      if (image && navigator.canShare) {
        const blob = await (await fetch(image)).blob();
        const f = new File([blob], 'space-scrapper.png', { type: 'image/png' });
        if (navigator.canShare({ files: [f] })) files = [f];
      }
      await navigator.share(files ? { files, text } : { text, title: 'Space Scrapper' });
      return;
    } catch (e) { if (e && e.name === 'AbortError') return; }
  }
  return fallbackShare({ image, text });
};

/* ---------- titreşim ---------- */
SS.haptic = strong => {
  if (SS.prefs && SS.prefs.haptic === false) return;
  const n = SS.native(); if (n) return n.post({ type: 'haptic', strong: !!strong });
  try { navigator.vibrate && navigator.vibrate(strong ? 35 : 12); } catch (e) {}
};

/* ---------- ana ekrandan açıldığında geri tuşu: mini oyun → pencere → harita → çıkış ---------- */
if (standalone() && window.history && history.pushState) {
  try { history.replaceState({ ss: 0 }, ''); history.pushState({ ss: 1 }, ''); } catch (e) {}
  window.addEventListener('popstate', () => {
    const r = SS.onBack ? SS.onBack() : 'exit';
    if (r !== 'exit') { try { history.pushState({ ss: 1 }, ''); } catch (e) {} }
  });
}

/* ---------- ana ekrana ekle ---------- */
let installEvt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; });
window.addEventListener('appinstalled', () => { installEvt = null; SS.toast && SS.toast('Space Scrapper ana ekrana eklendi.', 'good'); });
SS.canInstall = () => !standalone();
ACT.install = async () => {
  if (installEvt) {
    try { installEvt.prompt(); await installEvt.userChoice; } catch (e) {}
    installEvt = null; return SS.closeModal();
  }
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  SS.modal(`<p class="eyebrow">Ana ekrana ekle</p><h2>Uygulama gibi oyna</h2>
    ${ios ? '<ol class="tips"><li>Safari\'de alttaki <b>Paylaş</b> düğmesine dokun.</li><li><b>Ana Ekrana Ekle</b>\'yi seç.</li><li>Ana ekrandaki Space Scrapper simgesinden tam ekran aç.</li></ol>'
      : '<ol class="tips"><li>Tarayıcı menüsünü (⋮) aç.</li><li><b>Ana ekrana ekle</b> ya da <b>Uygulamayı yükle</b>\'yi seç.</li><li>Ana ekrandaki Space Scrapper simgesinden tam ekran aç.</li></ol>'}
    <p class="muted">Kaydın bu tarayıcıda tutulur; ana ekrandaki simge aynı kaydı açar. İnternet olmadan da açılır.</p>
    <div class="row">${btn('Tamam', 'close', {}, 'primary')}</div>`);
};
const _menu = ACT.menu;
ACT.menu = d => {
  _menu(d);
  if (!SS.canInstall()) return;
  const list = document.querySelector('#modal .menu-list');
  if (list) list.insertAdjacentHTML('beforeend', btn('Ana ekrana ekle', 'install', {}, 'ghost block'));
};
})(window.SS);

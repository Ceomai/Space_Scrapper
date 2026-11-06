// Space Scrapper service worker: oyunu çevrimdışı açılabilir yapar.
// Strateji: kendi dosyalarımız için önce ağ (her açılışta en yeni sürüm), ağ yoksa önbellek;
// yazı tipleri için önbellek önce, arkada yenileme. Sürüm adı yayın sırasında commit kimliğiyle değişir.
const VERSION = 'ss-4677d75028e7';
const PRECACHE = ["./","./index.html","./manifest.webmanifest","./js/art.js","./js/catalog.js","./js/content.js","./js/content2.js","./js/core.js","./js/data.js","./js/expand.js","./js/fun.js","./js/games.js","./js/guide.js","./js/i18n-en.js","./js/i18n.js","./js/meta.js","./js/music.js","./js/polish.js","./js/pwa.js","./js/scenes.js","./js/social.js","./js/stage.js","./js/ui.js","./js/world.js","./icons/apple-touch-icon.png","./icons/favicon.png","./icons/icon-192.png","./icons/icon-512.png","./icons/maskable-192.png","./icons/maskable-512.png"];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(PRECACHE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('ss-') && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const FONT = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//;
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (FONT.test(req.url)) {
    e.respondWith(caches.open(VERSION).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  if (url.origin !== self.location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(VERSION);
    try {
      const r = await fetch(req);
      if (r.ok) c.put(req, r.clone());
      return r;
    } catch (err) {
      const hit = await c.match(req, { ignoreSearch: true }) || (req.mode === 'navigate' ? await c.match('./') || await c.match('./index.html') : null);
      if (hit) return hit;
      throw err;
    }
  })());
});

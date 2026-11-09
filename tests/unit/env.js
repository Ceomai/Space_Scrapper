// Birim testleri için tarayıcısız ortam: web/js dosyaları index.html sırasıyla bir vm bağlamına yüklenir.
// DOM, localStorage ve tarayıcı API'leri en küçük taklitlerle karşılanır; oyunun mantığı (durum, ekonomi, kayıt) gerçek koddur.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const WEB = process.env.SS_WEB || path.resolve(__dirname, '../../web');

// Her özelliği ve çağrıyı kabul eden sessiz nesne (canvas bağlamı, DOM öğesi vb.)
function fake() {
  const fn = function () {};
  return new Proxy(fn, {
    get(t, k) {
      if (k === Symbol.toPrimitive) return () => 0;
      if (k === 'then') return undefined;
      if (k in t && k !== 'length' && k !== 'name') return t[k];
      if (!(k in t.__c || (t.__c = {}))) t.__c[k] = fake();
      return t.__c[k];
    },
    set(t, k, v) { (t.__c || (t.__c = {}))[k] = v; return true; },
    apply() { return fake(); },
    construct() { return fake(); },
  });
}
function storage() {
  const m = new Map();
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), clear: () => m.clear(), key: i => [...m.keys()][i] || null, get length() { return m.size; } };
}
function element(tag = 'div') {
  const e = fake();
  e.tagName = String(tag).toUpperCase(); e.style = {}; e.dataset = {}; e.hidden = true; e.children = []; e.innerHTML = ''; e.textContent = '';
  e.classList = { add() {}, remove() {}, toggle() {}, contains: () => false };
  e.querySelector = () => null; e.querySelectorAll = () => []; e.getContext = () => fake(); e.appendChild = x => x; e.addEventListener = () => {};
  e.getAttribute = () => null; e.setAttribute = () => {}; e.removeAttribute = () => {}; e.contains = () => false; e.closest = () => null;
  e.isConnected = false; e.clientWidth = 360; e.clientHeight = 640;
  return e;
}

// opts.lang: 'tr' (varsayılan) ya da 'en'; opts.files: yüklenecek dosyalar (varsayılan: index.html'deki bütün betikler)
function load(opts = {}) {
  const html = fs.readFileSync(path.join(WEB, 'index.html'), 'utf8');
  const files = opts.files || [...html.matchAll(/<script[^>]*src="js\/([^"]+)"/g)].map(m => m[1]);
  const localStorage = storage();
  if (opts.lang) localStorage.setItem('space-scrapper-lang', opts.lang);
  if (opts.storage) for (const [k, v] of Object.entries(opts.storage)) localStorage.setItem(k, v);
  const els = {};
  const docEl = element('html'); docEl.dataset = {}; docEl.lang = 'tr';
  const document = {
    hidden: false, documentElement: docEl, body: element('body'), readyState: 'complete',
    getElementById: id => (opts.dom ? (els[id] = els[id] || element()) : null),
    querySelector: () => null, querySelectorAll: () => [], createElement: element, createTextNode: () => element(),
    addEventListener() {}, removeEventListener() {}, activeElement: null,
  };
  const timers = [];
  const ctx = {
    console, Math: Object.create(Math), JSON, Date, Intl, Promise, Map, Set, WeakMap, WeakSet, Symbol, Proxy, Reflect, Error, TypeError, RangeError,
    Array, Object, String, Number, Boolean, RegExp, parseInt, parseFloat, isFinite, isNaN, encodeURIComponent, decodeURIComponent, escape, unescape, btoa: s => Buffer.from(s, 'binary').toString('base64'), atob: s => Buffer.from(s, 'base64').toString('binary'),
    document, localStorage, sessionStorage: storage(),
    navigator: { language: 'tr-TR', languages: ['tr-TR'], userAgent: 'node', vibrate() {}, share: undefined, clipboard: undefined, serviceWorker: undefined, onLine: true },
    location: { href: 'file:///index.html', hash: '', search: '', protocol: 'file:', origin: 'null', pathname: '/index.html', reload() {} },
    history: { replaceState() {}, pushState() {} },
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }),
    getComputedStyle: () => ({ getPropertyValue: () => '' }),
    requestAnimationFrame: () => 0, cancelAnimationFrame() {},
    setTimeout: (f, ms) => { timers.push(f); return timers.length; }, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    performance: { now: () => Date.now() }, addEventListener() {}, removeEventListener() {}, devicePixelRatio: 1, innerWidth: 390, innerHeight: 844,
    Image: function () { return element('img'); }, MessageChannel: function () { return { port1: {}, port2: { postMessage() {} } }; },
    MutationObserver: function () { return { observe() {}, disconnect() {} }; }, NodeFilter: { SHOW_TEXT: 4, SHOW_ELEMENT: 1 },
    fetch: () => Promise.reject(new Error('ağ yok')), URL, URLSearchParams, TextEncoder, TextDecoder, queueMicrotask,
  };
  ctx.Math.random = Math.random;
  ctx.window = ctx; ctx.self = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(WEB, 'js', f), 'utf8'), ctx, { filename: 'web/js/' + f });
  ctx.__timers = timers;
  return ctx;
}
// Tohumlu rastgele sayı (mulberry32): aynı tohum aynı oyunu verir
function seeded(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
module.exports = { load, seeded, WEB };

// Space Scrapper — dil katmanı. Oyun metinleri Türkçe yazılı; İngilizce seçiliyse ekrana ve tuvale giden
// her metin burada sözlükten (js/i18n-en.js) çevrilir. Türkçe seçiliyse hiçbir şeye dokunmaz.
window.SS = window.SS || {};
(function (SS) {
  const KEY = 'space-scrapper-lang';
  let lang = null;
  try { lang = localStorage.getItem(KEY); } catch (e) {}
  // Play Store uygulamasında ilk açılış: telefon dili Türkçe değilse İngilizce başla (oyuncu başlıktan değiştirebilir)
  try {
    const native = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
    if (!lang && native) lang = /^tr\b/i.test(navigator.language || '') ? 'tr' : 'en';
  } catch (e) {}
  SS.lang = () => lang === 'en' ? 'en' : 'tr';
  SS.langChosen = () => lang === 'en' || lang === 'tr';
  SS.setLang = l => { try { localStorage.setItem(KEY, l); } catch (e) {} if (l !== lang) { lang = l; location.reload(); } };
  SS.T = s => s; // Türkçede birebir
  if (SS.lang() !== 'en') return;

  const DICT = SS.I18N_EN || {};
  const lc = s => s.toLocaleLowerCase('tr');
  const L = 'A-Za-zçğıöşüÇĞİÖŞÜâ';
  const isL = ch => !!ch && new RegExp('[' + L + ']').test(ch);
  const exact = new Map(), lower = new Map(), pats = [];
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // "· hemen tüketilir", "+ haftalık {0}" gibi ayırıcıyla başlayan anahtarların ayırıcısız hâli de bilinsin
  for (const k of Object.keys(DICT)) { const m = /^\s*([·+,—–|-])\s+(.+)$/.exec(k), v = DICT[k]; if (m && typeof v === 'string') { const k2 = m[2].trim(), v2 = v.replace(/^\s*[·+,—–|-]\s*/, ''); if (!(k2 in DICT) && v2) DICT[k2] = v2; } }
  for (const k in DICT) {
    const v = DICT[k]; if (typeof v !== 'string' || v === k) continue;
    if (/\{\w+\}/.test(k)) {
      const names = [], guards = []; const parts = k.split(/(\{\w+\})/);
      const lits = parts.filter(x => !/^\{\w+\}$/.test(x)).map(x => x.trim()).filter(Boolean);
      if (!lits.length || lits.join('').replace(/[^A-Za-zçğıöşüÇĞİÖŞÜ]/g, '').length < 2) continue;
      // yer tutucu bir harfe yapışıksa yakalanan parça o yanda harfle başlamamalı/bitmemeli (kelime ortasından eşleşmesin)
      parts.forEach((x, i) => { if (/^\{\w+\}$/.test(x)) { const pv = parts[i - 1] || '', nx = parts[i + 1] || ''; guards.push([isL(pv.slice(-1)), isL(nx[0])]); } });
      const src = parts.map(x => /^\{\w+\}$/.test(x) ? (names.push(x), '([\\s\\S]*?)') : esc(x)).join('');
      const re = new RegExp('^' + src + '$', 'i');
      // iki yanı da düz metinle çevrili yer tutucular cümle içinde de aranabilir
      const inner = !/^\{\w+\}/.test(k.trim()) && !/\{\w+\}$/.test(k.trim()) && lits.join('').replace(/[^A-Za-zçğıöşüÇĞİÖŞÜ]/g, '').length >= 4;
      const gre = inner ? new RegExp(src.replace(/\(\[\\s\\S\]\*\?\)/g, '([^·\\n]{1,40}?)'), 'g') : null;
      const anchor = lits.slice().sort((a, b) => b.length - a.length)[0];
      pats.push({ re, gre, names, guards, v, anchor: lc(anchor) });
    } else { exact.set(k, v); lower.set(lc(k), v); }
  }
  pats.sort((a, b) => b.anchor.length - a.anchor.length);
  const ok = (p, m) => p.guards.every(([b, a], i) => { const g = m[i + 1] || ''; return !(b && isL(g[0])) && !(a && isL(g.slice(-1))); });
  const frags = [...exact.keys()].filter(k => (k.length >= 8 || / /.test(k.trim())) && /[A-Za-zçğıöşüÇĞİÖŞÜ]{3}/.test(k)).sort((a, b) => b.length - a.length);
  const fragRe = frags.length ? new RegExp('(^|[^' + L + '0-9])(' + frags.map(esc).join('|') + ')(?=$|[^' + L + '0-9])', 'g') : null;
  const isUpper = s => s === s.toLocaleUpperCase('tr') && s !== lc(s);
  const fixCase = (src, out) => isUpper(src) ? out.toUpperCase() : (/^[a-zçğıöşü]/.test(src) && /^[A-Z][a-z]/.test(out) && !/^(I|Rex|Krell|Gus|Zara|Tolga|Ela|Pıtırcık)\b/.test(out) ? out[0].toLowerCase() + out.slice(1) : out);
  const cache = new Map();
  // Türkçe kalıntı ölçüsü: sözlük anahtarlarında geçen ama çevirilerde geçmeyen kelimeler
  const WRE = /[A-Za-zçğıöşüÇĞİÖŞÜâ]{3,}/g, trW = new Set(), enW = new Set();
  for (const k in DICT) { (k.match(WRE) || []).forEach(w => trW.add(lc(w))); (String(DICT[k]).match(WRE) || []).forEach(w => enW.add(w.toLowerCase())); }
  enW.forEach(w => trW.delete(w));
  const trScore = s => (s.match(WRE) || []).reduce((a, w) => a + (trW.has(lc(w)) || /[çğıöşüÇĞİÖŞÜ]/.test(w) ? 1 : 0), 0);
  function core(s, depth) {
    if (exact.has(s)) return exact.get(s);
    const l = lc(s);
    if (lower.has(l)) return fixCase(s, lower.get(l));
    if (depth > 5) return null;
    for (const p of pats) {
      if (!l.includes(p.anchor)) continue;
      const m = p.re.exec(s); if (!m || !ok(p, m)) continue;
      let out = p.v;
      p.names.forEach((nm, i) => { out = out.split(nm).join(tr(m[i + 1], depth + 1)); });
      return isUpper(s) ? out.toUpperCase() : out;
    }
    return null;
  }
  // Cümle içinde geçen bilinen parçalar: önce tam dizeler (uzundan kısaya), sonra iç kalıplar
  function inside(s, depth) {
    let out = fragRe ? s.replace(fragRe, (all, pre, f) => pre + exact.get(f)) : s;
    if (!trScore(out)) return out;
    const l = lc(out);
    for (const p of pats) {
      if (!p.gre || !l.includes(p.anchor)) continue;
      out = out.replace(p.gre, (...m) => { let o = p.v; p.names.forEach((nm, i) => { o = o.split(nm).join(tr(m[i + 1], depth + 1)); }); return o; });
    }
    return out;
  }
  const SEPS = [' · ', '\n', ' — ', ' | ', ' / ', '. ', ': ', ', ', ' + '];
  // Türkçe yüzde yazımı (%25, −%10) İngilizcede 25%, −10%
  const pct = s => s.indexOf('%') < 0 ? s : s.replace(/%(\d+(?:[.,]\d+)?)/g, (a, n) => n.replace(',', '.') + '%').replace(/%(\d+)\s*[–-]\s*(\d+)%/g, '$1–$2%');
  function tr(s, depth = 0) {
    if (!s || typeof s !== 'string') return s;
    if (!depth && s.indexOf('%') >= 0) { const r = trCore(s, depth); return pct(r); }
    return trCore(s, depth);
  }
  function trCore(s, depth) {
    if (!/[A-Za-zçğıöşüÇĞİÖŞÜ]{2}/.test(s)) return s;
    if (!depth && cache.has(s)) return cache.get(s);
    const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s), a = m[1], body = m[2], b = m[3];
    let out = core(body, depth);
    if (out == null) { const q = /^(\S+)( \?)$/.exec(body); if (q && exact.has(q[1])) out = exact.get(q[1]) + q[2]; }
    if ((out == null || trScore(out)) && depth < 6) {
      let best = inside(body, depth);
      if (out != null && trScore(out) <= trScore(best)) best = out;
      if (trScore(best)) for (const sp of SEPS) if (body.includes(sp)) {
        const parts = body.split(sp), tp = parts.map((x, i) => tr(x + (sp === '. ' && i < parts.length - 1 ? '.' : ''), depth + 1));
        const joined = sp === '. ' ? tp.join(' ') : tp.join(sp);
        if (trScore(joined) < trScore(best)) best = joined;
        break;
      }
      out = best;
    }
    out = a + (out == null ? body : out) + b;
    if (!depth) { if (cache.size > 20000) cache.clear(); cache.set(s, out); }
    return out;
  }
  SS.T = s => tr(s);

  // ---- DOM: metin düğümleri ve görünür öznitelikler ----
  const done = new WeakMap();
  const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
  const fixText = n => { const v = n.nodeValue; if (done.get(n) === v) return; const o = tr(v); done.set(n, o); if (o !== v) n.nodeValue = o; };
  const fixEl = el => { for (const at of ATTRS) { const v = el.getAttribute && el.getAttribute(at); if (v && el['_i18n_' + at] !== v) { const o = tr(v); el['_i18n_' + at] = o; if (o !== v) el.setAttribute(at, o); } } if (el.tagName === 'INPUT' && (el.type === 'button' || el.type === 'submit') && el.value) el.value = tr(el.value); };
  const walkEl = root => {
    if (root.nodeType === 3) return fixText(root);
    if (root.nodeType !== 1 || root.tagName === 'SCRIPT' || root.tagName === 'STYLE' || root.tagName === 'TEXTAREA') return;
    fixEl(root);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n; while ((n = w.nextNode())) { if (n.nodeType === 3) { const p = n.parentNode; if (p && (p.tagName === 'SCRIPT' || p.tagName === 'STYLE')) continue; fixText(n); } else fixEl(n); }
  };
  const obs = new MutationObserver(ms => { for (const m of ms) { if (m.type === 'characterData') fixText(m.target); else if (m.type === 'attributes') fixEl(m.target); else m.addedNodes.forEach(walkEl); } });
  const start = () => { walkEl(document.body); obs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS }); document.title = tr(document.title); };
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  document.documentElement.lang = 'en';
  // index.html başlangıçta lang="tr" yazar; İngilizcede geri al (CSS büyük harfte i → İ olmasın)
  new MutationObserver(() => { if (document.documentElement.lang !== 'en') document.documentElement.lang = 'en'; }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  // ---- Tuval yazıları ----
  const C2 = window.CanvasRenderingContext2D && CanvasRenderingContext2D.prototype;
  if (C2) ['fillText', 'strokeText', 'measureText'].forEach(fn => { const o = C2[fn]; C2[fn] = function (t, ...r) { return o.call(this, typeof t === 'string' ? tr(t) : t, ...r); }; });
  // Paylaşım metinleri
  if (navigator.share) { const sh = navigator.share.bind(navigator); navigator.share = d => sh(d && { ...d, title: tr(d.title), text: tr(d.text) }); }
})(window.SS);

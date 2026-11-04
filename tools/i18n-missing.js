// Kaynakta olup İngilizce sözlükte (web/js/i18n-en.js) karşılığı olmayan Türkçe metinleri listeler.
// Kullanım: npm i --no-save acorn acorn-walk && node tools/i18n-missing.js > eksik.json
// Çıkan dizeleri çevirip i18n-en.js'teki SS.I18N_EN nesnesine "Türkçe": "English" olarak ekle.
// Şablonlardaki ${...} ifadeleri {0}, {1} … olur; HTML etiketleri arasındaki parçalar ayrı ayrı çevrilir.
const acorn = require('acorn'), walk = require('acorn-walk'), fs = require('fs'), path = require('path');
const WEB = path.resolve(__dirname, '../web');
global.window = {}; require(WEB + '/js/i18n-en.js'); const DICT = window.SS.I18N_EN;
const files = fs.readdirSync(WEB + '/js').filter(f => f.endsWith('.js') && !f.startsWith('i18n')).map(f => WEB + '/js/' + f);
const TR = /[çğıöşüÇĞİÖŞÜâ]/, WORDY = /[A-Za-zçğıöşüÇĞİÖŞÜ]{2,}/, out = new Set();
const add = s => {
  if (/\n/.test(s) && s.split(/\n+/).filter(x => x.trim()).length > 1) s.split(/\n+/).forEach(add);
  s = s.replace(/\s+/g, ' ').trim();
  if (!s || !TR.test(s) || !WORDY.test(s.replace(/\{\d+\}/g, '')) || s in DICT) return;
  out.add(s);
};
const splitHtml = s => { (s.match(/(?:aria-label|title|placeholder|alt)="([^"]*)"/g) || []).forEach(m => add(m.replace(/^[^"]*"|"$/g, ''))); s.split(/<[^>]*>/).forEach(seg => add(seg.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&'))); };
for (const f of files) walk.full(acorn.parse(fs.readFileSync(f, 'utf8'), { ecmaVersion: 'latest' }), n => {
  if (n.type === 'Literal' && typeof n.value === 'string') (/[<>]/.test(n.value) ? splitHtml(n.value) : add(n.value));
  else if (n.type === 'TemplateLiteral') { let s = ''; n.quasis.forEach((q, i) => { s += q.value.cooked; if (i < n.expressions.length) s += `{${i}}`; }); /[<>]/.test(s) ? splitHtml(s) : add(s); }
});
console.log(JSON.stringify([...out], null, 1));

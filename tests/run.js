// Test koşucusu: node tests/run.js [hızlı|tam]
// Her test ayrı süreçte çalışır; çıktısında başarısızlık işareti varsa koşu başarısız sayılır.
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });
const full = process.argv[2] === 'tam';
const T = [
  ['Birim testleri (tarayıcısız: kayıt göçü/onarımı, tohumlu ekonomi, iş ödemeleri, çeviri)', ['unit/run.js']],
  ['Kapsamlı paket (içerik, çift dokunuş, yerleşim, bellek, köprü, uzun oyun)', ['ultimate.js']],
  ['Mini oyunlar kazanılabilir mi', ['winbots.js']],
  ['İngilizce dil (bütün ekranlar, mini oyunlar, kalan Türkçe ≤ 25, Türkçe mod etkilenmez)', ['i18n.js']],
  ['Uç durumlar (bozuk/eski kayıt, depolama kapalı, bütün ekranlar)', ['edge.js']],
  ['Denetim (enjeksiyon, kurcalanmış kayıt, eylem fuzz, saat dilimi/DST, kalıcılık, köprü, geri tuşu, performans)', ['audit.js', full ? '2' : '1']],
  ['Hızlı rastgele oyunlar', ['fast.js', full ? '120' : '30', full ? '150' : '100']],
  ...[0, 1, 2, 3, ...(full ? [4, 5] : [])].map(i => [`Rastgele arayüz oturumu ${i}`, ['monkey.js', String(40 + i), full ? '600' : '300']]),
  ['Uzun oyunlar (zorluk birleşimleri, Yeni Oyun+)', ['deep.js', '0', full ? '27' : '4']],
];
const BAD = [/✗/, /hata [1-9]/, /ihlal [1-9]/, /sayfa hataları:? [1-9]/, /istisna/, /geçersiz"/, /aralık dışı"/, /NaN kaynağı/];
let failed = 0;
for (const [name, args] of T) {
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [path.join(__dirname, args[0]), ...args.slice(1)], { encoding: 'utf8', timeout: 45 * 60 * 1000 });
  const out = (r.stdout || '') + (r.stderr || '');
  const bad = r.status !== 0 || BAD.some(x => x.test(out));
  if (bad) failed++;
  console.log(`${bad ? '✗' : '✓'} ${name} (${Math.round((Date.now() - t0) / 1000)} sn)`);
  if (bad) {
    const lines = out.split('\n').filter(l => l.trim()), fails = [];
    lines.forEach((l, i) => { if (/✗/.test(l)) fails.push(...lines.slice(i, i + 4)); });
    console.log((fails.length ? fails.concat(lines.slice(-2)) : lines.slice(-25)).map(l => '    ' + l).join('\n'));
  }
}
console.log(failed ? `\n${failed} test başarısız.` : '\nBütün testler geçti.');
process.exit(failed ? 1 : 0);

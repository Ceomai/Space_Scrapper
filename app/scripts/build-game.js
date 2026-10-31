// Oyunu (depoda ../web, yerelde ../space-scrapper) tek bir HTML metnine paketler ve game/gameHtml.js olarak yazar.
// WebView bu metni doğrudan yükler; böylece Expo Go'da ek dosya sunmaya gerek kalmaz.
const fs = require('fs');
const path = require('path');

const SRC = process.env.GAME_SRC || ['web', 'space-scrapper'].map(d => path.join(__dirname, '..', '..', d)).find(d => fs.existsSync(path.join(d, 'index.html'))) || path.join(__dirname, '..', '..', 'web');
const OUT = path.join(__dirname, '..', 'game', 'gameHtml.js');

if (!fs.existsSync(path.join(SRC, 'index.html'))) {
  if (fs.existsSync(OUT)) { console.log('Oyun kaynağı bulunamadı, mevcut game/gameHtml.js kullanılıyor.'); process.exit(0); }
  console.error(`Oyun kaynağı bulunamadı: ${SRC}`); process.exit(1);
}
let html = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');
html = html.replace(/<script charset="utf-8" src="(js\/[\w.-]+\.js)"><\/script>/g, (_, file) => {
  const js = fs.readFileSync(path.join(SRC, file), 'utf8').replace(/<\/script/gi, '<\\/script');
  return `<script>\n${js}\n</script>`;
});
// Yayın sırasında artifact iskeletinin eklediği baş kısmı burada biz ekliyoruz
const head = `<!doctype html><html lang="tr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}</style></head><body>`;
html = head + html.replace('<meta charset="utf-8">', '') + '</body></html>';
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, `// Otomatik üretildi: npm run build:game\nexport default ${JSON.stringify(html)};\n`);
console.log(`game/gameHtml.js yazıldı (${Math.round(html.length / 1024)} KB)`);

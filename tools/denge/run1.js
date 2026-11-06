// node run1.js <etiket> <json give> <tekrar no>
const { chromium } = require('playwright'); const fs = require('fs');
const [,, label, giveJson, rep] = process.argv;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.addInitScript(() => { let fake = 0; const q = []; const ch = new MessageChannel(); ch.port1.onmessage = () => { const cbs = q.splice(0); fake += 1000 / 60; cbs.forEach(cb => { try { cb(fake); } catch (e) {} }); }; performance.now = () => fake; window.requestAnimationFrame = cb => { q.push(cb); ch.port2.postMessage(0); return 1; }; window.cancelAnimationFrame = () => {}; try { localStorage.setItem('space-scrapper-prefs', JSON.stringify({ style: 'vector', muted: true })); } catch (e) {} });
  await p.goto('file://' + require('path').resolve(__dirname, '../../web/index.html'));
  await p.addScriptTag({ path: __dirname + '/abot.js' });
  const r = await p.evaluate(o => window.runSim(o), { ads: !!JSON.parse(giveJson).ads, maxDay: 260, crew: ['pit'], strategy: 'balanced', give: JSON.parse(giveJson) });
  const row = { label, rep: +rep, day: r.over ? 260 : r.day, over: r.over || '', loanDay: r.loanPaidDay || 0, morale: Math.round(r.dayLog.reduce((a, x) => a + x.morale, 0) / Math.max(1, r.dayLog.length)) };
  fs.appendFileSync(__dirname + '/results.jsonl', JSON.stringify(row) + '\n');
  await b.close();
})();

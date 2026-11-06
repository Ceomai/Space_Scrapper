const { spawn } = require('child_process'); const fs = require('fs');
const done = new Set(fs.existsSync('results.jsonl') ? fs.readFileSync('results.jsonl', 'utf8').trim().split('\n').filter(Boolean).map(l => { const r = JSON.parse(l); return r.label + '#' + r.rep; }) : []);
const jobs = fs.readFileSync(process.argv[2] || 'jobs.txt', 'utf8').trim().split('\n').map(l => l.split('\t')).filter(([l, , r]) => !done.has(l + '#' + r));
let i = 0, run = 0; const N = 4;
const next = () => { while (run < N && i < jobs.length) { const [l, g, r] = jobs[i++]; run++; const c = spawn('node', ['run1.js', l, g, r], { stdio: 'ignore' }); const t = setTimeout(() => c.kill(), 900000); c.on('exit', () => { clearTimeout(t); run--; if (i >= jobs.length && !run) console.log('BITTI'); else next(); }); } };
console.log('kalan', jobs.length); next();

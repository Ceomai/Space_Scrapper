// Space Scrapper — prosedürel müzik: ses dosyası yok, Web Audio ile sıralanan sakin bir uzay döngüsü.
// Gündüz: La minör (Am–F–C–G), gece (20:00 sonrası): daha yavaş, daha alçak (Dm–Am–Bb–F).
// Ses kapalıyken, müzik kapalıyken, sekme arka plandayken ve reklam sırasında susar. İlk dokunuştan önce başlamaz.
(function(SS){
const prefs = SS.prefs;
if (prefs.music === undefined) prefs.music = true;
let AC = null, out = null, on = false, timer = 0, next = 0, step = 0, unlocked = false, mood = 'day';
const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);
const SONGS = {
  day:   { bpm: 84, chords: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], arp: [0, 1, 2, 1, 2, 0, 1, 2], lead: .035 },
  night: { bpm: 68, chords: [[50, 53, 57], [45, 48, 52], [46, 50, 53], [53, 57, 60]], arp: [0, 2, 1, 2, 0, 2, 1, 0], lead: .026 },
};
function note(f, t, d, type, vol, attack, cutoff) {
  const o = AC.createOscillator(), g = AC.createGain(), fl = AC.createBiquadFilter();
  o.type = type; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.value = cutoff;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(.0005, t + d);
  o.connect(fl).connect(g).connect(out); o.start(t); o.stop(t + d + .05);
}
function schedule() {
  if (!on || !AC) return;
  const S0 = SONGS[mood], spb = 60 / S0.bpm / 2;
  while (next < AC.currentTime + .25) {
    const s = step, ch = S0.chords[Math.floor(s / 8) % 4], t = next;
    if (s % 8 === 0) { ch.forEach(n => { note(NOTE(n), t, spb * 8.2, 'triangle', .045, .6, 900); note(NOTE(n) * 1.004, t, spb * 8.2, 'sine', .028, .6, 900); }); note(NOTE(ch[0] - 12), t, spb * 3.5, 'sine', .085, .03, 400); }
    if (s % 8 === 4) note(NOTE(ch[0] - 12), t, spb * 3, 'sine', .065, .03, 400);
    if (s % 2 === 0 || Math.random() < .3) note(NOTE(ch[S0.arp[s % 8]] + 12), t, spb * 1.6, 'sine', S0.lead, .01, 2400);
    next += spb; step++;
  }
}
const want = () => unlocked && prefs.music !== false && !prefs.muted && !document.hidden && !SS.inAd;
SS.music = {
  update() {
    const m = window.S && S.time >= 1200 ? 'night' : 'day';
    if (m !== mood) { mood = m; step = step - (step % 8); }
    if (want() && !on) {
      try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) { return; }
      if (!out) { out = AC.createGain(); out.connect(AC.destination); }
      out.gain.cancelScheduledValues(AC.currentTime); out.gain.setValueAtTime(0, AC.currentTime); out.gain.linearRampToValueAtTime(.5, AC.currentTime + 1.5);
      on = true; next = AC.currentTime + .1; timer = setInterval(schedule, 80); schedule();
    } else if (!want() && on) {
      on = false; clearInterval(timer);
      try { out.gain.cancelScheduledValues(AC.currentTime); out.gain.setValueAtTime(out.gain.value, AC.currentTime); out.gain.linearRampToValueAtTime(0, AC.currentTime + .25); } catch (e) {}
    }
  },
  get playing() { return on; },
};
const unlock = () => { unlocked = true; SS.music.update(); };
['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, unlock, { capture: true, passive: true }));
document.addEventListener('visibilitychange', () => SS.music.update());
// Ses düğmeleri müziği de etkiler; ayarlara ayrı bir müzik düğmesi
const ACT = SS.ACT;
for (const k of ['mute', 'muteMenu']) { const f = ACT[k]; if (f) ACT[k] = (...a) => { const r = f(...a); SS.music.update(); return r; }; }
ACT.musicToggle = () => { prefs.music = prefs.music === false; SS.savePrefs ? SS.savePrefs() : null; try { localStorage.setItem('space-scrapper-prefs', JSON.stringify(prefs)); } catch (e) {} SS.music.update(); SS.render(); };
// reklam sırasında müzik susar (reklam bitince, yarıda kalınca ya da 60 sn sonra geri gelir)
const _show = SS.showRewardedAd;
// reklam iptal edilir ya da hiç gelmezse (cancel) SS.inAd hemen temizlenir
if (_show) SS.showRewardedAd = (done, cancel) => { SS.inAd = true; SS.music.update(); const fin = () => { SS.inAd = false; SS.music.update(); }; const tm = setTimeout(fin, 60000); return _show(() => { clearTimeout(tm); fin(); done(); }, () => { clearTimeout(tm); fin(); cancel && cancel(); }); };
const _adDone = window.SS_AD_DONE;
if (_adDone) window.SS_AD_DONE = ok => { SS.inAd = false; SS.music.update(); return _adDone(ok); };
// gündüz/gece geçişi ve reklam molası
setInterval(() => { if (on || unlocked) SS.music.update(); }, 5000);
})(window.SS);

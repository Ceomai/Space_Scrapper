// Space Scrapper — küçük olay veriyolu (event bus)
// Sonraki dosyaların önceki işlevleri sarmalaması (monkey-patch zinciri) yerine, çekirdek işlevler belirli noktalarda
// olay yayar; her özellik kendi dosyasında SS.on ile, sırasını açıkça belirterek kaydolur.
//
//   const off = SS.on(name, fn, { order = 0 })   // kaydol; off() kaydı siler
//   SS.emit(name, ...args)                       // işleyicileri order'a göre (küçükten büyüğe) çağırır;
//                                                // eşit order'da kayıt sırası korunur
//   v = SS.filter(name, value, ...args)          // süzgeç: aynı sırayla fn(value, ...args) çağrılır, dönen değer
//                                                // bir sonrakine geçer (undefined dönerse değer değişmez); hata veren
//                                                // işleyici atlanır, değer ondan önceki haliyle devam eder
//   ok = SS.ask(name, ...args)                   // izin sorusu: aynı sırayla çağrılır; biri tam olarak false
//                                                // dönerse durur ve false döner (sonrakiler çağrılmaz), yoksa true.
//                                                // Hata veren işleyici "izin ver" sayılır (bir kez raporlanır)
// Bir işleyicinin hatası yakalanır ve (işleyici başına bir kez) console.error'a yazılır; diğer işleyiciler ve
// çağıran akış devam eder. SS.hooks: hata ayıklama için olay adı → [{ fn, order, id }] haritası.
//
// OLAYLAR VE SIRALARI (yeni bir işleyici eklerken buraya da yazın)
//   'day:before' (notes)  core.js SS.newDay'in gövdesinden ÖNCE. notes: gecenin not dizisi (değiştirilebilir).
//       10  fun.js     yol arkadaşı görevleri: ertelenmiş ödüller, yeni görev duyurusu
//       20  polish.js  günün işi seçimi, beklenmedik masraf (ilan panosu yenilenmeden önce)
//   'day:after'  (notes)  core.js SS.newDay'in gövdesinden SONRA (S.bulletin hazır).
//       10  polish.js  fatura kararı işareti, kilometre taşı, bülten notları/ekleri
//       20  polish.js  haftalık özet (S.weekSum → S.bulletin.week)
//   (Eski sarmalama sırası: fun ⟶ polish#1 ⟶ core ⟶ polish#1 ⟶ polish#2; sıra numaraları bunu birebir korur.)
//   'sleep:before' (ctx)  core.js SS.sleep'in gövdesinden ÖNCE. ctx = { sel } (sel değiştirilebilir).
//       10  polish.js  gün ve bağ fotoğrafı (ctx.day0, ctx.bonds0)
//   'sleep:after'  (ctx)  core.js SS.sleep'in gövdesinden SONRA (gün geçişi/newDay dahil). ctx.res = { R, notes }.
//       10  polish.js  ertelenen/gösterilen masrafları kapatır, bağ uyarısı (res.notes ve bültene)
//   'ledger' SÜZGEÇ (L)   core.js SS.ledger'ın dönüşü; L akşam defteri kalemleri.
//       10  polish.js  ertelenen masraf, ödenmemiş masraf ve arıza kalemleri (L[1]'e eklenir)
//   'goals:after' ()      core.js SS.checkGoals'tan sonra (günlük hedefler işlendi).
//       10  polish.js  kilometre taşı denetimi (SS.checkMile)
//   'time:after' (mins)   core.js SS.passTime'dan sonra (S.time ilerledi). Sıcak yol: işleyiciler hafif olmalı.
//       10  fun.js     süresi dolan acil ilanları kapatır
//       20  fun.js     çıkartma denetimi (SS.checkDecals)
//   'board:new' (board)   world.js SS.refreshBoard yeni bir pano kurduğunda (S.board = board atandıktan hemen sonra;
//                         pano yenilenmediyse yayılmaz). Math.random kullanan işleyicilerin sırası oyunu değiştirir.
//       10  fun.js     acil ilan seçimi (%45, ücret ×1.4)
//   'job:allow' SORU (ctx)  ui.js ACT.job başında; ctx = { d } (d: eylem verisi). false → iş başlamaz, undefined döner.
//       10  fun.js     süresi dolmuş acil ilan: kapatır, uyarır, engeller
//   'job:before' (ctx)    izin verildiyse, işten önce
//       10  fun.js     acil ilan mı? (ctx.rushJob, ctx.wasRush) — otomatik yakıttan önce bakılır
//       20  polish.js  otomatik yakıt / (hurda sözleşmesinde) otomatik satış
//   'job:after'  (ctx)    işten sonra (mini oyun açılmış olabilir); ctx.res = işin dönüşü (ACT.job bunu döndürür)
//       10  fun.js     acil ilan tamamlandıysa sayaç + çıkartma
//   'scrap:before' (d)    ui.js ACT.scrap başında (polish.js GUARD doğrulamasından sonra)
//       10  polish.js  otomatik yakıt/satış, SS._lastDive
//   'ad:needed' SORU (done, cancel)  expand.js SS.showRewardedAd başında; false → reklamsız, done() hemen döner
//       10  supporter.js  destekçi paketi varsa reklam yok
//   'ad:start' (ad)       reklam (yer tutucu ya da yerel) başlarken; ad = { ok: null } reklam başına tek nesne
//       10  music.js   SS.inAd = true, müzik susar, 60 sn güvenlik zamanlayıcısı (ad.musicTm)
//   'ad:end'   (ad)       reklam başına tam bir kez, done/cancel'dan hemen önce; ad.ok = true (izlendi) / false
//       10  music.js   zamanlayıcıyı siler, SS.inAd = false, müzik döner
//   'ad:native-done' (ok) yerel köprü window.SS_AD_DONE gelince, her şeyden önce (bekleyen reklam olmasa da)
//       10  music.js   SS.inAd = false, müzik döner
//   SS.HUNT_MODES[mode](o)  olay değil, kayıt: social.js SS.startHunt bu kipte bir işlev varsa ona devreder
//       weekly  fun.js  Haftanın Avı
//   SS.genGoals olay değil: expand.js onu bir strateji olarak sarmalıyor (aslını 12 kez yeniden deneyip S.goals'ı
//   değiştirir); bir gözlemci değil, üretici yerine geçme.
window.SS = window.SS || {};
(function(SS){
const hooks = SS.hooks = SS.hooks || {};
let seq = 0;

// Her olayın listesi sıralı tutulur ve yalnızca on/off'ta yeniden kurulur (yaz-kopyala): emit/filter her çağrıda
// kopyalamadan dolaşabilir; dolaşırken yapılan on/off o anki çağrıyı etkilemez. (SS.passTime sıcak yol.)
SS.on = (name, fn, { order = 0 } = {}) => {
  const h = { fn, order, id: ++seq, failed: false };
  // kararlı sıralama: önce order, eşitse kayıt sırası
  hooks[name] = (hooks[name] || []).concat(h).sort((a, b) => a.order - b.order || a.id - b.id);
  return () => { if (hooks[name]) hooks[name] = hooks[name].filter(x => x !== h); };
};

SS.emit = (name, ...args) => {
  const list = hooks[name];
  if (!list || !list.length) return;
  for (let i = 0; i < list.length; i++) {
    const h = list[i];
    try { h.fn(...args); }
    catch (e) {
      if (!h.failed) { h.failed = true; console.error(`[SS.emit] '${name}' işleyicisi hata verdi (order ${h.order}):`, e); }
    }
  }
};

SS.ask = (name, ...args) => {
  const list = hooks[name];
  if (!list || !list.length) return true;
  for (let i = 0; i < list.length; i++) {
    const h = list[i];
    try { if (h.fn(...args) === false) return false; }
    catch (e) {
      if (!h.failed) { h.failed = true; console.error(`[SS.ask] '${name}' işleyicisi hata verdi (order ${h.order}), izin verildi sayıldı:`, e); }
    }
  }
  return true;
};

SS.filter = (name, value, ...args) => {
  const list = hooks[name];
  if (!list || !list.length) return value;
  for (let i = 0; i < list.length; i++) {
    const h = list[i];
    try { const v = h.fn(value, ...args); if (v !== undefined) value = v; }
    catch (e) {
      if (!h.failed) { h.failed = true; console.error(`[SS.filter] '${name}' işleyicisi hata verdi (order ${h.order}):`, e); }
    }
  }
  return value;
};

})(window.SS);

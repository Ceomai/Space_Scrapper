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
//   SS.genGoals olay değil: expand.js onu bir strateji olarak sarmalıyor (aslını 12 kez yeniden deneyip S.goals'ı
//   değiştirir); bir gözlemci değil, üretici yerine geçme.
window.SS = window.SS || {};
(function(SS){
const hooks = SS.hooks = SS.hooks || {};
let seq = 0;

SS.on = (name, fn, { order = 0 } = {}) => {
  const list = hooks[name] || (hooks[name] = []);
  const h = { fn, order, id: ++seq, failed: false };
  list.push(h);
  // kararlı sıralama: önce order, eşitse kayıt sırası
  list.sort((a, b) => a.order - b.order || a.id - b.id);
  return () => { const i = list.indexOf(h); if (i >= 0) list.splice(i, 1); };
};

SS.emit = (name, ...args) => {
  const list = hooks[name];
  if (!list || !list.length) return;
  for (const h of list.slice()) {
    try { h.fn(...args); }
    catch (e) {
      if (!h.failed) { h.failed = true; console.error(`[SS.emit] '${name}' işleyicisi hata verdi (order ${h.order}):`, e); }
    }
  }
};

SS.filter = (name, value, ...args) => {
  const list = hooks[name];
  if (!list || !list.length) return value;
  for (const h of list.slice()) {
    try { const v = h.fn(value, ...args); if (v !== undefined) value = v; }
    catch (e) {
      if (!h.failed) { h.failed = true; console.error(`[SS.filter] '${name}' işleyicisi hata verdi (order ${h.order}):`, e); }
    }
  }
  return value;
};

})(window.SS);

// Space Scrapper — küçük olay veriyolu (event bus)
// Sonraki dosyaların önceki işlevleri sarmalaması (monkey-patch zinciri) yerine, çekirdek işlevler belirli noktalarda
// olay yayar; her özellik kendi dosyasında SS.on ile, sırasını açıkça belirterek kaydolur.
//
//   const off = SS.on(name, fn, { order = 0 })   // kaydol; off() kaydı siler
//   SS.emit(name, ...args)                       // işleyicileri order'a göre (küçükten büyüğe) çağırır;
//                                                // eşit order'da kayıt sırası korunur
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

})(window.SS);

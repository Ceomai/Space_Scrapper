// Ölçmeden önce oyunun kendi fontlarını (web/fonts) yükletir ve bekler. Böylece yerel makine ile GitHub'daki test
// makinesi aynı fontu ölçer; yedek sistem fontu yüzünden birkaç piksellik farklar (ve sürpriz kırmızılar) olmaz.
module.exports = p => p.evaluate(async () => {
  if (!document.fonts) return;
  try { await Promise.all([...document.fonts].map(f => f.load().catch(() => {}))); await document.fonts.ready; } catch (e) {}
}).catch(() => {});

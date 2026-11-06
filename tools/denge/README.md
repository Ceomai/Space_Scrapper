# Parça dengesi simülatörü

Oyuncu botu (`abot.js`) oyunu baştan oynar: iş seçer, yer içer, lisans ve geliştirme alır, borcu öder, Demir Balina'ya kadar ilerler.
Her ayarda bota başlangıçta bir parça **bedava** verilir (`give`: nakit, gemi geliştirmesi, beceri, ev, işletme, dekor etkisi); hedefe kaç günde ulaştığı ölçülür.
Aynı fiyatta nakitle karşılaştırınca parçanın fiyatına göre güçlü mü zayıf mı olduğu görülür.

```bash
cd tools/denge
node pool.js jobs.txt      # 4 paralel koşu, sonuçlar results.jsonl'e eklenir (koşu başına ~40 sn)
```

`jobs.txt` satırı: `etiket <TAB> give-JSON <TAB> tekrar-no`. Örnek give: `{"ship":{"winch":4}}`, `{"fx":{"sleep":10}}`, `{"ads":1}`.

Sınırlar: bot teslimat ve tamir mini oyunlarını oynamaz (başarı %80/%85 rastgele), bu yüzden İtici, Jiroskop, Takım Çantası, Pilotluk ve Mühendislik burada ölçülemez.
Koşular arası dalgalanma ±3 gün civarındadır; her ayar için en az 8 tekrar önerilir.

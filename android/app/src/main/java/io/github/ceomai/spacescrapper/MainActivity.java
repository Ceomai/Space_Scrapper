package io.github.ceomai.spacescrapper;

import com.getcapacitor.BridgeActivity;

// Erişilebilirlik notu: WebView'in yazı yakınlaştırması (WebSettings.textZoom) Android'in sistem yazı
// boyutunu izler. Bunu kapatmak için setTextZoom(100) ÇAĞIRMAYIN ve @capacitor/text-zoom gibi eklentiler
// eklemeyin: büyük yazı kullanan oyuncular oyunu da büyük görmeli (web/index.html viewport'u da yakınlaştırmayı engellemez).
public class MainActivity extends BridgeActivity {}

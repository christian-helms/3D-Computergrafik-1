*Erreichbare Punktzahl:* **8 Punkte**

Das Plattnerpus schaut sich im Familienalbum Bilder seiner Vorfahren an. Da die Familie der Ornithorhynchidae seit 1825 so bezeichnet wird, kann das Plattnerpus seine Vorfahren bis zur Zeit der [ersten Fotografie](https://de.wikipedia.org/wiki/Blick_aus_dem_Arbeitszimmer) zurückverfolgen. Somit enthält das Album viele Schwarzweißfotos.

Graustufen-Konvertierung ist eine oftmals notwendige Transformation von Bildern, wenn beispielsweise der Drucker keinen Farbdruck unterstützt. Implementieren Sie diese Konvertierung in der Methode `averageGray(...)` indem Sie den Durchschnitt der Farbkanäle bilden und in `weightedGray(...)` in der Sie die Kanäle so gewichten, dass das Ergebnis besser der menschlichen Helligkeitswahrnehmung entspricht. Implementieren Sie zusätzlich eine Schwarz-Weiß-Konvertierung mit Hilfe eines Grenzwertes und eine mit Hilfe des Error-Diffusion-Dithering nach Floyd-Steinberg, bei denen nur schwarze und weiße Pixel verwendet werden. Ergänzen Sie dazu die Methoden `threshold(...)` und `floydSteinberg(...)`.

Die Methoden finden Sie in `grayscale.ts`. Verwenden Sie die Funktionen `getPixelColor(...)` und `setPixelColor(...)`.

### Beispielausgaben

![Original](img/exercises/practical/grayscale/img/gray_average.png)  
Graustufenbild gebildet mit Durchschnitt der Farbkanäle

![Original](img/exercises/practical/grayscale/img/gray_weighted.png)  
Graustufenbild gebildet mit gewichteten Farbkanälen

![Original](img/exercises/practical/grayscale/img/bw_threshold.png)  
Schwarz-Weiß-Bild gebildet mit Hilfe eines Grenzwertes

![Original](img/exercises/practical/grayscale/img/bw_floyd_steinberg.png)  
Schwarz-Weiß-Bild gebildet mit Error-Diffusion-Dithering
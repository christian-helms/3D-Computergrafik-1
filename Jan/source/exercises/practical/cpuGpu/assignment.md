*Erreichbare Punktzahl:* **8 Punkte**

Das Plattnerpus mag kein Chlorwasser und setzt sich deshalb immer eine Tauchermaske auf, wenn es ins Schwimmbad geht. Leider beschlägt die Brille beim Tauchen und alles sieht verschwommen aus.

Viele digitale Bilddaten, insbesondere Fotos, weisen Farbfehler auf. Diese äußern sich z. B. in mangelndem Kontrast, unausgewogener Helligkeit, Farbstichen und Unschärfe. Durch eine digitale Nachbearbeitung können die Bilder meist qualitativ verbessert werden. Bildfilter sind wichtige Vertreter flächenbezogener Bildoperationen, um verschiedene visuelle Effekte zu ermöglichen.

Dabei ist es möglich, diese Effekte sowohl auf dem Prozessor, als auch auf der Grafikkarte zu implementieren. Eine CPU-seitige Implementierung ist intuitiver und meist einfacher umzusetzen. Eine GPU-seitige Umsetzung hat hingegen den Vorteil, aufgrund der guten Parallelisierbarkeit performanter umsetzbar zu sein.

Implementieren Sie die folgenden Bildfaltungsoperationen sowohl CPU-, als auch GPU-seitig:
- Box Blur / Weichzeichner: Erzeugen Sie einen Unschärfeeffekt mit einem quadtratischen Kernel.
  - CPU: Implementieren Sie die Funktion `blur()` in `blur.ts`. Der Kernel soll dabei eine anpassbare Größe haben, der Radius ist in der Variable `this._blurRadius` bereitgestellt. Das Originalbild ist in `this._inputImage` gespeichert, das Ausgabebild in `this._inputImage`, beide vom Typ `Uint8Array`. Die Variablen `this._imageWidth` und `this._imageHeight` stellen die Abmessungen der Bilder bereit.
  - GPU: Implementieren Sie die Funktion `void main(void)` in `blur.frag`. Die verfügbaren Variablen sind am Anfang der Datei beschrieben. Der Ergebniswert muss in `fragColor` gespeichert werden.
- Laplace-Filter: Es ist Ihnen überlassen, ob Sie bei der Kantenerkennung die diagonal verbundenen Pixel miteinbeziehen.
  - CPU: Implementieren Sie die Funktion `laplace()` in `laplace.ts`. Die verfügbaren Variablen sind die gleichen wie beim Blur, jedoch ohne anpassbaren Radius, da der Kernel eine feste Größe besitzt.
  - GPU: Implementieren Sie die Funktion `void main(void)` in `laplace.frag`. Die verfügbaren Variablen sind am Anfang der Datei beschrieben. Der Ergebniswert muss in `fragColor` gespeichert werden.

### Beispielausgaben

![Blur](img/exercises/practical/cpuGpu/img/cpuGpu_blur.png)  
Weichgezeichnetes Ergebnisbild

![Laplace](img/exercises/practical/cpuGpu/img/cpuGpu_edge.png)  
Ergebnisbild der Kantenerkennung

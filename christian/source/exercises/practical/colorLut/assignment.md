*Erreichbare Punktzahl:* **6 Punkte**

Lutz möchte Szenen aus seinen Lieblings-Videospiel teilen und nimmt daher einige Screenshots und Videos auf. Da es zum Zeitpunkt der Aufnahme schon spät in der Nacht ist, hat sich jedoch der Blaulichtfilter automatisch eingeschaltet. Entsprechend haben alle Bilder und Videos eine rötliche Tönung. Die Farbkorrektur manuell auf alles anzuwenden, wäre viel Arbeit, und eine Wiederholung der Aufnahmen ist auch nicht umsetzbar, da Lutz sich nicht sicher ist, ob er den Boss noch mal besiegen kann. Wenn es doch nur eine Möglichkeit gäbe, die gleiche Farbanpassung schnell auf diverse Bilder und Videos anzuwenden...

Color-LUTs (lookup tables) können verwendet werden, um Farbanpassungen vorzuberechnen. Komplexe Filter können performant angewendet werden, indem zur Laufzeit statt der eigentlichen Berechnungen nur ein Texturzugriff ausgeführt werden muss. Ein möglicher Einsatzbereich ist die Verarbeitung von vorhandenen Bild- und Videodaten, aber auch Color Grading von interaktiven Visualisierungen. So unterstützt beispielsweise die Spieleengine Unity Post-Processing mithilfe von LUTs.

Die LUTs beinhalten dabei bereits gefilterte Farbtöne. Der Definitionsbereich dieser Abbildung sind die Bildkoordinaten, der Wertebereich die Farben. Basierend auf einer Identitäts-LUT, welche jeden Farbton auf sich selbst abbildet, können z.B. mit üblichen Bildbearbeitungsprogrammen Effekte angewendet werden. Die Ergebnis-LUT kodiert dann die Abbildung der Originalfarben auf gefilterte Farben.

#### Export der Identitäts-LUT

Über den "Lut exportieren"-Button soll eine Identitäts-LUT in der eingestellten Auflösung exportiert werden. Das Framework ist bereits so aufgesetzt, dass die Ausgabe des `export.frag`-Fragmentshaders in eine Textur gerendert und als Browser-Download bereitgestellt wird. Ihre Aufgabe ist, diese Textur mithilfe der `main`-Funktion im Shader zu befüllen. Die Ausgabe einer LUT mit Auflösung 4 sollte dem folgenden Bild ähneln. Weitere Beispiele (in Originalauflösung) finden Sie im Ordner `source/exercises/practical/colorLut/exampleLuts/`.

![Identity4](img/exercises/practical/colorLut/img/lut_labeled.png)  
Identitäts-LUT mit Auflösung 4. Wie im Bild annotiert, sollten in den markierten Pixeln die enprechenden Extrema der Farbkanäle gespeichert sein.

#### Anwenden einer LUT auf ein Bild

Über den "LUT importieren"-Dateiinput kann eine LUT ausgewählt werden. Implementieren Sie die Funktion `main` im `apply.frag`-Fragmentshader so, dass die gewählte LUT auf das Eingabebild angewendet wird.

#### Anmerkung: Verwendung der LUTs in anderen Programmen

Unity kann LUTs im verwendeten Format direkt einbinden. Wie Post Processing verwendet werden kann, ist [hier](https://docs.unity3d.com/Manual/PostProcessingOverview.html) beschrieben. Das folgende Bild zeigt eine mithilfe von `sepia_64.png` eingefärbte leere Szene.

![Unity](img/exercises/practical/colorLut/img/unity_lut.png)  
Verwenden einer LUT in Unity

Adobe-Programme wie Photoshop und Premiere verwenden das [cube-Format](https://wwwimages2.adobe.com/content/dam/acom/en/products/speedgrade/cc/pdfs/cube-lut-specification-1.0.pdf), um LUTs zu speichern. Im `scripts`-Ordner liegt ein Script, um PNGs zu konvertieren. Beispielaufruf (im Ordner colorLut): `node .\scripts\png2cube.js .\exampleLuts\inverse_4.png .\exampleLuts\inverse_4.cube`. Vorsicht: Die Ausgabedatei wird überschrieben, ohne zu fragen. Außerdem können die `cube`-Dateien sehr groß werden, da die Daten als Text gespeichert sind - `sepia_64.png` erzeugt beispielsweise eine 14 MB große `sepia_64.cube`.

![Photoshop](img/exercises/practical/colorLut/img/ps_lut.png)  
Verwenden einer LUT in Photoshop

![Premiere](img/exercises/practical/colorLut/img/premiere_lut.png)  
Verwenden einer LUT in Premiere

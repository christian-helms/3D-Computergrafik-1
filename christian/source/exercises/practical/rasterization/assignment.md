*Erreichbare Punktzahl:* **8 Punkte**

Grafikkarte Gretel hat ein paar Fragmente im Wald verloren und weiß nicht mehr, wie Dreiecke rasterisiert werden. Bitte hilf ihr dabei!

Das Dreieck als geometrisches Primitiv und seine Rasterisierung spielen in der Computergrafik eine zentrale Rolle. Um Werte wie Texturkoordinaten oder Farben über die Fläche eines Dreiecks zu interpolieren, können die baryzentrischen Koordinaten verwendet werden.

#### Fragmentbasierte Rasterisierung

Implementieren Sie in `fragmentbasedRasterization.frag` einen Test, um zu prüfen, ob der betrachtete Pixel innerhalb des durch `u_vertices` (Liste der Vertices als xy-Koordinate, Wertebereich [-1, 1]) gegebenen Dreiecks liegt. Berechnen Sie außerdem die baryzentrischen Koordinaten und nutzen Sie diese, um die Vertexfarben, gegeben durch `u_colors` (jeweilige Vertexfarbe in RGB), über die Fläche linear zu interpolieren und entsprechend auszugeben. Eine Beispielausgabe ist unten zu sehen.

#### Hardwarebeschleunigte Rasterisierung

Ergänzen Sie `vertexbasedRasterization.vert` und `vertexbasedRasterization.frag` so, dass die gleiche Ausgabe wie in der ersten Teilaufgabe erzeugt wird. Die Vertexfarbe ist mit `a_color` im Vertexshader pro Vertex und durch `v_color` im Fragmentshader als Array gegeben. Bevorzugen Sie eine einfache Implementierung.

### Beispielausgabe

![Original](img/exercises/practical/rasterization/img/rasterung.png)  
Rasterisiertes Dreieck mit interpolierten Vertexfarben

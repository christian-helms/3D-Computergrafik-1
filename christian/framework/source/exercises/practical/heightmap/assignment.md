*Erreichbare Punktzahl:* **8 Punkte**

Da Urlaubsreisen pandemiebedingt weiterhin nicht zu empfehlen sind, muss man sich damit begnügen, die Reiseziele digital zu erkunden.

Programmieren Sie ein Terrainrendering basierend auf einem planaren Dreiecksnetz und einer Höhentextur. Dies umfasst folgende Aufgaben:

- Erzeugen Sie eine planare Geometrie mit den angegeben Auflösung. Implementieren Sie dazu die Funktion `build` in `heightmapGeometry.ts`. Es müssen zwei Arrays erstellt werden: Eines beinhaltet die Vertexkoordinaten, das andere die Indizes, welche die Zusammensetzung der Dreiecke spezifizieren.

    Die Vertexkoordinaten sollen zweidimensional sein: Da der y-Wert der Geometrie immer null ist, müssen nur x und z (gespeichert als y-Koordinate) angegeben werden. Diese sollen beide von -1 bis 1 laufen.

    Pro Kante sollen `resolution` Vertices platziert werden. Die Geometrie wird als `TRIANGLE_STRIP` gerendert. Falls Sie Dreiecksgruppen voneinander trennen wollen, gibt es die Möglichkeit, den jeweils letzten bzw. ersten Vertex wiederholt zu rendern. Dadurch enstehen degenerierte Dreiecke, die keine Fläche haben und deshalb nicht gezeichnet werden.

- Verschieben Sie die Vertices der Geometrie mithilfe einer Höhentextur. Dabei muss der als `a_vertex.y` gespeicherte z-Wert korrekt als z verwendet werden.  Berechnen Sie die Werte `v_uv`, `v_height` und `v_pos` in der `main`-Funktion in `heightmap.vert`. Dabei soll `u_heightScale` genutzt werden, um die y-Koordinate über einen Regler skalieren zu können.

- Färben Sie die Karte basierend auf der Höhe ein. Implementieren Sie dazu die Funktion `getHeightColor` in `heightmap.frag`. Die Uniforms `u_heightColorHeights` und `u_heightColors` stellen Steuerpunkte und die Farben, die dort platziert werden sollen, bereit. Dazwischen soll interpoliert werden. Sie können davon ausgehen, dass die Höhenwerte monoton steigen – falls per Slider beispielsweise für den Farbton `0` eine höhere Höhe als für `1` eingestellt wird, ist es in Ordnung, wenn Ihre Implementierung dies nicht unterstützt.

- Fügen Sie Höhenlinien hinzu. Implementieren Sie dazu die Funktion `getContourLineFactor` in `heightmap.frag`; sie soll 0 für Höhenlinien und 1 für andere Bereiche zurückgeben. Die GLSL-Funktion `fwidth` bietet sich an, um im Bildraum gleichbleibend dicke Linien einzuzeichnen, allerdings sind auch andere Implementierungen möglich. Für die Höhenlinien ist ein Offset gegeben, welcher die Höhe der untersten Linie angibt.

![los_santos](img/exercises/practical/heightmap/img/los_santos_screenshot.png)  
Beispielergebnis mit der Karte von Los Santos.

![tamriel](img/exercises/practical/heightmap/img/tamriel_screenshot.png)  
Beispielergebnis mit der Karte von Tamriel (Höhenlinien abgeschaltet).

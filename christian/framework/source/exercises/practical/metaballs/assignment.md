*Erreichbare Punktzahl:* **10 Punkte (+ 2 Bonuspunkte)**

Das Plattnerpus hat sich eine Lavalampe gekauft. Doch leider funktioniert sie noch nicht.

Schreiben Sie eine Visualisierung von Metabällen. Gegeben seinen `n` Bälle. Eine 2D-Metaball-Funktion ist gegeben als die Menge von Dichtefunktionen

![Dichtefunktionen](img/exercises/practical/metaballs/img/metaball_density.svg)

wobei `(xi, yi)` das Zentrum des i-ten Balls angibt, `ri` den Radius und `(x, y)` den zu untersuchenden Punkt. `f(x, y)` gibt also die Dichte des Balls am Punkt `(x, y)` zurück (Abstand zum Kreismittelpunkt). Wenn die Summe der Dichten aller Metabälle am Punkt `(x, y)` größer als ein Schwellwert `s` ist, also

![Summe](img/exercises/practical/metaballs/img/metaball_sum.svg)

wird die Fläche an der Stelle gefüllt.

Implementieren Sie das entsprechende Verfahren in der Datei `metaball.frag`, um eine Ausgabe vergleichbar mit der ersten Abbildung zu erzeugen.

Implementieren Sie eine weitere Visualisierung, die der zweiten Abbildung entspricht, um bis zu zwei Bonus-Punkte zu erhalten.

### Beispielausgabe

![Original](img/exercises/practical/metaballs/img/metaballs_bw.png)  
Mataball-Visualisierung mit weißen Bällen auf schwarzen Hintergrund

![Original](img/exercises/practical/metaballs/img/metaballs_color.png)  
Mataball-Visualisierung mit bunten Farbverläufen zwischen den Bällen
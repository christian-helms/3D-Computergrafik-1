*Erreichbare Punktzahl:* **2 Punkte (+5 Bonus)**

CreeperKiller1337 möchte zusätzlich zum Dolly-Zoom auch normale Kamerafahrten verwenden. Um weiche Bewegungen zu erhalten, soll die Kamera Bezierkurven abfahren.

Implementieren Sie in `bezier.ts` die Berechnung von kubischen Bezierkurven in drei Dimensionen.

1. Implementieren Sie die Funktion `bezierPosition`, die basierend auf einem t von 0 bis 1 die Position auf der gegebenen Bezierkurve berechnet.

2. Implementieren Sie einfaches Sampling eines Bezierkurvenzugs, wobei der Definitionsbereich von 0 bis 1 gleichmäßig auf alle Kurven eingeteilt werden soll. Implementieren Sie dazu die Funktion `sampleNaive`, die auf der Funktion `bezier` aufbaut.

    *Beispiel: Der gesamte Kurvenzug besteht aus vier Kurven. Bei einem Interpolationsfaktor `t = 0.15` soll die erste Kurve gesampelt werden, da sie den Bereich von 0 bis 0.25 (1/4) abdeckt. 0.15 liegt bei 60% von 0.25, deshalb ist das lokale `t` zum Abrufen des Ergebnisses auf der Kurve 0.6.*

3. Bonus: Implementieren Sie verbessertes Sampling eines Bezierkurvenzugs, wobei der Eingabewert die normalisierte Länge des Kurvenzugs beschreibt. Bei einer Eingabe von 0.5 soll beispielsweise der Punkt zurückgegeben werden, der auf der halben Strecke des Kurvenzugs liegt. Implementieren Sie dazu die Funktion `sampleEquiDist`.

    *Beispiel: Der Kurvenzug besteht aus zwei Kurven mit den Längen 2 und 6. Die erste Kurve deckt also den Längenabschnitt von 0 bis 0.25 (2/8) ab, die zweite Kurve den Bereich von 0.25 bis 1. Bei einem Eingabewert von `normDist = 0.125` soll die erste Kurve bei der halben Strecke gesampelt werden.*

    Der empfohlene Lösungsansatz ist eine Lookuptabelle, die es ermöglicht, eine gewünschte normalisierte Länge auf das zugehörige `t` abzubilden. Implementieren Sie dazu die Funktionen `lookupForCurve` und `prepareDistLookup`, welche solch eine Tabelle für eine Kurve bzw. den gesamten Kurvenzug generieren. Beim Auslesen in `sampleEquiDist` muss dann eine Kurve basierend auf `CurveLookup.normalizedLength` ausgewählt werden. Anschließend können die Samples für diese Kurve durchsucht werden, um die am nächsten gelegenen Samples zu finden, um die darin enthaltenen `t`-Werte interpolieren zu können. Die Interfaces der Funktionen und die bereitgestellten Datentypen `CurveLookup` und `DistSample` können nach Belieben angepasst werden.

![bezier_naive](img/exercises/practical/bezier/img/bezier_naive.png)  
Einfaches Sampling. Die Messpunkte sind unterschiedlich dicht auf der Kurve platziert.

![bezier_equi](img/exercises/practical/bezier/img/bezier_equi.png)  
Verbessertes Sampling. Die Messpunkte sind habe gleiche Abstände.

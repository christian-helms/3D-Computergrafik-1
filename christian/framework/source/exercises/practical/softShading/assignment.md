*Erreichbare Punktzahl:* **6 Punkte**

Schraubi die Schraube hat viele Facetten, doch nicht alle davon soll jeder gleich erkennen können.

Implementieren Sie die Berechung der Vertex-Normalen in `halfEdgeModel.ts` in der Funktion `getNormals(thresholdAngle)`. Dabei sollen Kanten, deren anliegende Flächen einen Winkel unter dem Schwellwertwinkel zwischen ihren Normalen haben, einen weichen Beleuchtungsübergang haben. Alle anderen haben einen harten.

Harte Kanten entstehen, wenn für einen Vertex die Normale des zugehörigen Faces genutzt wird.  
Weiche Kanten enstehen, wenn für einen Vertex die gemittelte Normale aller anliegenden Faces genutzt wird.

### Beispielausgaben

![Original](img/exercises/practical/softShading/img/softShading_8.png)  
Ausgabe bei einem Schwellwertwinkel von 8°.

![Original](img/exercises/practical/softShading/img/softShading_30.png)  
Ausgabe bei einem Schwellwertwinkel von 30°.

![Original](img/exercises/practical/softShading/img/softShading_95.png)  
Ausgabe bei einem Schwellwertwinkel von 95°.

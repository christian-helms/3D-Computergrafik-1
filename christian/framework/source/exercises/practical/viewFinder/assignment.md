*Erreichbare Punktzahl:* **6 Punkte**

Bei der Planung des Parks Sanssouci wurden einige sogenannte [Sichtachsen](https://de.wikipedia.org/wiki/Sichtachse) eingebaut um eine gute Sicht auf bedeutende Bauwerke wie das Schloss Sanssouci zu ermöglichen. Steht man nicht auf solch einer Sichtachse, bleibt die Schönheit des Aufbaus und das Gesamtbild verborgen.


In dieser Aufgabe soll die Notwendigkeit von Sichtachsen mithilfe der interaktiven Betrachtung eines Bildes umgesetzt werden.
Dafür soll das Bild in Rechtecke zerlegt und angezeigt werden.
Die Rechtecke sollen in einem überlappungsfreien `u_geometryResolution * u_geometryResolution` Raster angeordet sein und mit der Fläche zu einem einzelnen Fokuspunkt, gegeben durch `u_correctViewPosition`, ausgerichet sein. 
Der Abstand der Mitte jedes Rechtecks zum Fokuspunkt ist mit `distanceToCorrectViewPosition` gegeben.
Durch die Ausrichtung der Rechtecke sieht das Bild aus der Position `u_correctViewPosition` normal aus (auch unverzerrt). Aus anderen Kameraperspektiven ist das Bild aufgrund der unterschiedlichen Abstände und der schräg betrachteten Rechtecke hingegen nicht korrekt erkennbar.

Implementieren Sie die Berechnung der Vertex- und UV-Koordinaten in `viewFinder.vert` in der Funktion `getPosition()`.


![Original](img/exercises/practical/viewFinder/img/example.png)  
Beispielausgabe startet in `u_correctViewPosition`

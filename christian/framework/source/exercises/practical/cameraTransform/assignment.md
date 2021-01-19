*Erreichbare Punktzahl:* **6 Punkte (+ 1 Bonuspunkt)**

Clippy möchte in den Clip Space transformiert und dann geclippt werden, denn schließlich hat auch er verstanden, dass es nichts bringt, mehr von sich zu zeigen als am Ende überhaupt sichtbar sein wird. Dabei kommt ihm seine Spezialfähigkeit zu Gute, auch nach Drehung, Streckung und Stauchung beliebige Anteile seiner Oberfläche auszublenden und so die Prozessierungsleistung der GPU bestens auszunutzen.

In der Vorlesung haben Sie kennengelernt, wie die Szenengeometrie mithilfe von View Transformation und perspektivischer Projektion transformiert wird. Erzeugen Sie die folgenden Matrizen in `transformation.ts`:

- `LookAt` transformiert die Koordinaten so, dass die Kamera im Ursprung platziert wird und in negative z-Richtung (`-z`) schaut.
- `AngleAdjustment` sorgt dafür, dass der horizontale und vertikale Blickwinkel der Kamera jeweils 90° betragen.
- `Scaling` passt die Koordinaten so an, dass die Far-Clipping-Plane bei `z=-1` liegt.
- `PerspectiveTransform` verzerrt das View Frustum zu einem Quader und führt dabei perspektivische Verkürzung ein.

Als Eingabewert ist die Kamera gegeben, die alle benötigten Werte liefert. Die berechneten Matrizen werden nacheinander auf die Koordinaten angewendet. Über den Anzeigemodus kann eingestellt werden, bis zu welchem Schritt die Matrizen berechnet werden sollen. Dadurch lässt sich das Ergebnis aller Matrizen bis zu diesem Schritt anzeigen.

#### Bonus

Implementieren Sie die `shouldBeClipped`-Funktion in `warpedModel.frag`. Diese soll basierend auf der übergebenden homogenen Koordinaten entscheiden, ob ein Fragment verworfen werden kann.

![Original](img/exercises/practical/cameraTransform/img/0_orig.png)  
Beispielergebnis – Original

![LookAt](img/exercises/practical/cameraTransform/img/1_lookat.png)  
Beispielergebnis – LookAt

![Winkeländerung des Sichtvolumens](img/exercises/practical/cameraTransform/img/2_angle.png)  
Beispielergebnis – Winkeländerung des Sichtvolumens

![Skalierung des Sichtvolumens](img/exercises/practical/cameraTransform/img/3_scale.png)  
Beispielergebnis – Skalierung des Sichtvolumens

![Perspektivische Transformation](img/exercises/practical/cameraTransform/img/4_persp.png)  
Beispielergebnis – Perspektivische Transformation

![Clipping](img/exercises/practical/cameraTransform/img/5_clip.png)  
Beispielergebnis – Clippy-ing

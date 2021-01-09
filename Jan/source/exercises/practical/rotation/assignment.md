*Erreichbare Punktzahl:* **8 Punkte**

Da die Google-Server mal wieder Probleme machen, will sich der Weihnachtmann nicht auf Google Maps verlassen. Deshalb lässt er von seinen elf Elfen ein eigenes Navigationssystem programmieren. 

1. Elf Prima baut eine Benutzeroberfläche.
2. Elf Secundus kümmert sich um die Kommunikation mit Navigationssatelliten.
3. Elf Tria trianguliert darauf basierend die aktuelle Position.
4. Elf Quattro quatscht die ganze Zeit bloß.
5. Elf Quinta bindet die Wunschverwaltungs-API an.
6. Elf Sextus versucht, das Ganze für Arch Linux zu deployen.
7. Elf Septimus hilft ihm dabei, sein System immer wieder zu reparieren.
8. Elf Octavia gibt Acht, dass ihnen die Situation nicht entgleitet.
9. Elf Nova implementiert den Abruf von Kartendaten von OpenStreetMap.
10. Elf Decimus verzweifelt an der optimalen Lösung des Travelling Salesman Problems.
11. Elf Ölf versucht, die Dihydrogenmonoxydkristallstrahltriebwerke anzusteuern. Dazu muss er zwischen der aktuellen und gewünschten Flugrichtung interpolieren.

Ein Objekt bewegt sich von links nach rechts und soll dabei unter Verwendung verschiedener Interpolationsverfahren rotiert werden. Implementieren sie die folgenden Interpolationen:

- Lineare Interpolation der Matrixkoeffizienten in `interpolateMatrix.ts` (1 Punkt).
- Lineare Interpolation der Eulerwinkeln in `interpolateEuler.ts` (2 Punkte).
- Sphärische Interpolation mit Hilfe von Quaternionen in `interpolateQuaternion.ts` (2 Punkte).

Die Start- und Endorientierung wird durch Eulerwinkel in Radianten beschrieben.

- Der Rollwinkel beschreibt die Drehung um die Z-Achse, die zum Betrachter hinzeigt.
- Der Nick-/Pitchwinkel beschreibt die Drehung um die X-Achse, die nach rechts zeigt.
- Der Gier-/Yawwinkel beschreibt die Drehung um die Y-Achse, die nach oben zeigt.

Die Variable `t` läuft während eines Durchlaufs von 0.0 bis 1.0 und definiert den aktuellen Stand der Interpolation.

Implementieren Sie zudem die Hilfsmethoden `lerp` (in `lerp.ts`, 1 Punkt) und `slerp` (in `slerp.ts`, 2 Punkte). Die Hilfsmethoden sollen für die lineare bzw. sphärische Interpolation verwendet werden. Bis auf lerp und slerp selbst dürfen Sie Hilfsfunktionalitäten aus den in `webgl-operate` enthaltenen Klassen `vec3`, `mat4`, `quat` usw. verwenden.

Zur Kontrolle der eigenen Ergebnisse stehen für die bereitgestellten Voreinstellungen vorberechnete Rotationsmatrizen bereit, die verwendet werden, um eine Kopie des Modells zu rotieren.

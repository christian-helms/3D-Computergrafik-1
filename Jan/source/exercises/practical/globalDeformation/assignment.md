*Erreichbare Punktzahl:* **8 Punkte**

Der Weihnachtsmann muss viele verschieden geformte Geschenke einpacken. Um die Geschenkverpackung an die Form anzupassen werden in der Weihnachtswerkstatt globale Deformationen verwendet.

In der Vorlesung haben Sie das Konzept der globalen Deformationen kennengelernt. Hierzu wird
ein solider Körper zunächst in einer benötigten Feinheit tesselliert, um dann eine Transformationsbeschreibung
mit beliebiger Komplexität pro Vertex anzuwenden. Diese können sowohl in einem kartesischen als auch einem zylindrischen Koordinatensystem definiert sein.
Ihre Aufgabe ist es die folgenden globalen Deformationen zu implementieren (siehe Abbildung):

**Mold:** Der Abstand der Vertices von der xy-Ebene wird entsprechend des Winkels zwischen dem
jeweiligen Vertex (als Vektor interpretiert) und der z-Achse skaliert. Dabei soll mit steigendem
Winkel der Vertex stärker verschoben werden.  
*Hinweis:* In der Abbildung sind die Seiten bei Mold eingedellt. Es ist kein Sechseck!

**Pinch:** Der Körper selbst wird mit steigender Höhe (y-Achse) in einer dazu orthogalen Achse (x-
Achse) gegen 0 gehend skaliert. Hierzu werden die bei der Tesselierung erhaltenen Vertices
mit höheren y-Werten stärker entlang der x-Achse transliert als die mit geringeren. Die Vertices im Inneren sollen unverändert bleiben.

**Twist:** Der Körper selbst wird beliebigfach in sich verdreht. Dazu sollen die Vertices je nach Höhe
im Körper um die y-Achse rotiert werden.

**Bend:** Der Körper wird um einen fixen Punkt gebogen.

Implementieren Sie hierzu die Methoden:
- `vec4 mold(vec4 vertex, float factor)`
- `vec4 pinch(vec4 vertex, float factor)`
- `vec4 twist(vec3 vertex, float angle)`
- `vec4 bend(vec4 vertex, float angle)`

im Shader `globalDeformation.vert`, wobei die Parameter `factor` und `angle` über die
Stärke der Deformation entscheiden sollen.

Für die Bewertung sind nur die Ergebnisse mit dem Menger-Schwamm relevant.

![deformations](img/exercises/practical/globalDeformation/img/globalDeformations.png)  
Globale Deformationen (von links nach rechts): Original, Mold (Faktor: 1), Pinch (Faktor: 1), Twist (Winkel: -90°), Bend (Winkel: -90°).

# Anleitung zum Übungsrahmen

## Benötigte Software

- [Node.js](https://nodejs.org) ist eine Ausführungsumgebung, die es u.A. ermöglicht, JavaScript dediziert als Anwendung auszuführen. Es wird mindestens Version 12 benötigt.
- [Visual Studio Code](https://code.visualstudio.com/) ist ein kostenloser, offener und plattformunabhängiger Codeeditor mit diversen Funktionen, der gut für die Entwicklung von TypeScript geeignet ist. Es ist grundsätzlich möglich, einen anderen Editor zu verwenden, allerdings empfehlen wir, VS Code zur Bearbeitung der Übungen zu nutzen.

## Initiales Setup des Frameworks

1. Datei `übungsrahmen_v1.zip` aus dem Moodle herunterladen.
2. Der Inhalt des Archivs kann in einem beliebigen Arbeitsverzeichnis entpackt werden.
3. Öffnen Sie den Ordner in Visual Studio Code. Dazu starten sie VS Code und wählen über `Datei` > `Ordner öffnen...` den Ordner aus. Alternativ können Sie die Datei `cg1-assignments.code-workspace` aus dem Datei-Explorer öffnen. Dafür muss im Betriebssystem eingestellt sein, dass dieser Dateityp mit VS Code geöffnet werden soll.
4. Beim ersten Öffnen des Ordners fragt VS Code, ob die vom Übungsrahmen empfohlenen Erweiterungen installiert werden sollen. Dies bitte erlauben. Sofern dies nicht gewünscht ist, können die einzelnen Vorschläge über das Erweiterungsmenü (`Anzeigen` > `Erweiterungen`) einzeln überprüft und bei Bedarf installiert/deinstalliert werden.
5. Führen Sie den `install`-Task aus. Dazu `Terminal` > `Task ausführen...` auswählen, dann `install` ausführen. Falls im Laufe des Semesters Aktualisierungen des Programmrahmens veröffentlicht werden, muss dieser Schritt wiederholt werden.

## Importieren eines Aufgabenblatts

1. Aufgabenblattarchiv (z.B. `aufgabenblatt1.tgz`) herunterladen und in den Ordner `assignments` im Framework legen.
2. Den Task `import` ausführen.
3. Im Ausgebefeld unten den Import bestätigen.

## Aufgabenblatt bearbeiten

1. **Hinweis:** Die Aufgabenstellungen sind ins Framework integriert und auf den jeweiligen Seiten eingebunden.
2. Alle relevanten Quellcodedateien befinden sich in `source/exercises/`, gruppiert nach Aufgaben. Alternativ kann auch die Datei-Suche von VS Code (`Strg` + `P`) verwendet werden.
3. Zum Testen kann über den Task `debug` ein Server gestartet werden, der das Framework auf [`http://localhost:8080/`](http://localhost:8080/) hostet.
4. Die Seite kann mit einem normalen Browser geöffnet werden, allerdings epfielt es sich, die Debug-Integration für Chrome zu nutzen, da so direkt im Code gedebuggt werden kann. Nachdem sichergestellt ist, das im Debug-Menü (`Anzeigen` > `Debuggen`) Chrome gewählt ist, kann per Klick auf den Startknopf daneben oder per Tastenkürzel `F5` eine Debugging-Session gestartet werden.

## Aufgabenblatt exportieren und abgeben

1. In der Datei `authors.json` bitte die Matrikelnummern eintragen. So wird das exportierte Archiv automatisch korrekt benannt.
2. Falls Sie bei der Bearbeitung von Bonusaufgaben neue Dateien hinzugefügt haben, die für die Bewertung relevant sind, fügen Sie die Dateien in der Datei `exercise.json` der entsprechenden Aufgabe im `"files"`-Abschnitt hinzu.
3. Den Task `export` ausführen. Das exportierte Archiv befindet sich im Ordner `submissions`.
4. Die Abgabe im [Moodle](https://moodle.hpi3d.de/course/view.php?id=139) hochladen.

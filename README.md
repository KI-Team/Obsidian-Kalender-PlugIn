# MB Calendar 2.0.0 für Obsidian

MB Calendar stellt einen Kalender direkt in einer Markdown-Notiz dar. Die Termine und Aufgaben bleiben als lesbares JSON in der Notiz gespeichert. Monat, Woche, Tag und Agenda sowie Wiederholungen, Suche, Verschieben und Größenänderung sind enthalten. Auf schmalen Mobilansichten stehen Agenda und Tag zur Verfügung.

**Deutsch ist die voreingestellte Sprache.** Englisch und Russisch bleiben verfügbar.

## Herkunft und Lizenz

Dieses Plugin wurde auf Basis des Plugins **MD Calendar 1.8.0 von mrrepac** überarbeitet. Dabei wurden Sicherheits- und Stabilitätskorrekturen vorgenommen und eine **deutsche Sprachversion** ergänzt. Die ursprüngliche **MIT-Lizenz wird unverändert beibehalten**.

Originalprojekt: <https://github.com/mrrepac/obsidian-md-calendar>

Der vollständige Lizenztext steht in `LICENSE`, der Herkunftshinweis zusätzlich in `NOTICE.md` und in den Plugin-Einstellungen. MB Calendar ist eine gesonderte Überarbeitung, keine als offiziell ausgegebene Veröffentlichung des ursprünglichen Autors.

## Installation

1. Bestehende Kalendernotizen sichern; die erste Erprobung vorzugsweise in einer Kopie des Vaults durchführen.
2. **MD Calendar deaktivieren**, falls es installiert ist. Beide Plugins verarbeiten alte `md-calendar`-Blöcke und sollten deshalb nicht gleichzeitig aktiviert sein.
3. Das ZIP entpacken. Den enthaltenen Ordner `mb-calendar` nach `<Vault>/.obsidian/plugins/mb-calendar/` kopieren.
4. Prüfen, dass `main.js`, `manifest.json` und `styles.css` direkt in diesem Ordner liegen, nicht in einem zweiten gleichnamigen Unterordner.
5. Obsidian neu laden und unter **Einstellungen → Community-Plugins** das Plugin **MB Calendar** aktivieren.
6. Über das Kalendersymbol oder den Befehl **MB Calendar: Kalendernotiz öffnen** beginnen. Bei eingeschaltetem Mehrkalender-Modus erstellt der entsprechende Befehl eine neue Kalendernotiz.

Zum Betrieb sind kein Build, kein npm, kein separater Download von Moment.js und keine Internetverbindung nötig. `main.js` enthält die lokalen Hilfsmodule und Übersetzungen bereits. Die Ordner `src`, `scripts` und `tests` dienen der Nachvollziehbarkeit und Weiterentwicklung.

Das Manifest nennt wie die Vorlage Obsidian **ab 1.5.0**. Diese Mindestversion wurde hier nicht mit einer installierten Obsidian-Version überprüft. Die optionale Sprach-API `getLanguage()` wird nur verwendet, wenn sie vorhanden ist.

## Bestehende Kalender übernehmen

Vorhandene, unterstützte `md-calendar`-Blöcke werden weiterhin gelesen und bearbeitet. Eine pauschale Umbenennung in den Notizen ist nicht erforderlich. Neue Kalender verwenden `mb-calendar`. Die Datenformat-Version bleibt **1**; die Plugin-Version ist davon unabhängig **2.0.0**.

Ein leerer neuer Kalender lässt sich so in eine Notiz einsetzen:

````markdown
```mb-calendar
{
  "events": []
}
```
````

Die alte `data.json` ist **nicht im Paket enthalten** und wird nicht automatisch aus MD Calendar übernommen. Globale Einstellungen bitte in MB Calendar neu setzen. Kalenderdaten stehen weiterhin in den vorhandenen Notizen. Beim ersten Bearbeiten können unterstützte Altwerte normalisiert und fehlende IDs ergänzt werden; ein bloßer Sprachwechsel schreibt keine Termine um.

Kalenderblöcke müssen auf der obersten Markdown-Ebene stehen; bis zu drei führende Leerzeichen sind zulässig. Blöcke innerhalb von Zitaten oder Listen werden vom sicheren Schreibparser nicht unterstützt. Einen solchen Block vor dem Bearbeiten auf die oberste Ebene verschieben. Nicht geschlossene oder nicht eindeutig identifizierbare Blöcke werden nicht überschrieben. Kalenderbeispiele innerhalb anderer Codeblöcke werden ignoriert.

Kopierte Kalenderblöcke dürfen in derselben Notiz nicht dieselbe `calId` haben. Bei einer bewussten Kopie in der Quellansicht nur deren `calId` entfernen und die Notiz neu öffnen; beim ersten Speichern erhält die Kopie eine neue ID. Bei mehrdeutigen Blöcken verweigert MB Calendar den Schreibvorgang und behält einen Entwurf.

## Sprache und Anzeige

Unter **Einstellungen → MB Calendar** stehen Deutsch, English, Русский und Automatisch zur Wahl. Nach dem Wechsel das Plugin aus- und wieder einschalten, damit auch Befehle und Dialoge dieselbe Sprache verwenden.

„Automatisch“ folgt der Obsidian-Sprache, wenn die Sprach-API vorhanden ist; andernfalls wird die aktive Moment-Locale als Ersatz verwendet. Nicht unterstützte Sprachen fallen auf Englisch zurück. Wochenanfang und 12-/24-Stunden-Anzeige sind separat einstellbar. Native Datums- und Uhrzeiteingaben können der Sprache des Betriebssystems folgen.

Datumsschlüssel bleiben unabhängig von der Anzeigesprache im Format `YYYY-MM-DD` mit ASCII-Ziffern. Titel, Beschreibungen, IDs, Feldnamen und gespeicherte `HH:mm`-Zeiten werden nicht übersetzt. Arabische, persische, devanagarische und bengalische Ziffern in unterstützten alten Datumswerten können beim Einlesen normalisiert werden. Eine vollständige Oberfläche für RTL-Sprachen ist nicht Bestandteil dieser Version.

## Speicherstatus und Wiederherstellung

Über dem Kalender zeigt **Gespeichert / Wird gespeichert… / Nicht gespeichert** den aktuellen Stand. Bevor eine Notiz geändert wird, prüft das Plugin im atomaren Schreibvorgang, ob der Kalender noch eindeutig existiert und seinem zuletzt eingelesenen Inhalt entspricht. Externe Änderungen oder Änderungen aus einer zweiten Ansicht werden nicht blind überschrieben.

Bei Konflikten oder Schreibfehlern:

1. **Entwurf anzeigen** wählen oder den Entwurf unter **Einstellungen → MB Calendar** öffnen.
2. Den Inhalt kopieren oder als **separate Wiederherstellungsnotiz** sichern.
3. Die ursprüngliche Kalendernotiz neu öffnen und die beiden Fassungen bewusst abgleichen. Es erfolgt keine automatische Zusammenführung.
4. **Speichern wiederholen** nur verwenden, wenn eine vorübergehende Speicherstörung behoben ist. Ein inhaltlicher Konflikt bleibt dadurch absichtlich bestehen.

Entwürfe werden in der eigenen Plugin-Einstellungsdatei gesichert. Wenn auch diese Datei nicht beschreibbar ist, bleibt der Entwurf nur im laufenden Plugin verfügbar: vor dem Schließen kopieren. Ein abruptes Beenden vor Abschluss eines Schreibvorgangs kann weiterhin die allerletzte Änderung verlieren. Die Entwurfsfunktion ersetzt keine Vault-Sicherung.

Kann die vorhandene Einstellungsdatei überhaupt nicht gelesen werden, wird sie nicht durch Defaults überschrieben. In diesem Fall `data.json` sichern, den Lese- oder JSON-Fehler beheben und MB Calendar neu laden. Bei lesbaren, aber ungültigen Einstellungswerten werden sichere Standardwerte verwendet und die Originalwerte beim nächsten erfolgreichen Speichern unter `originalSettings` behalten.

## Schutz beim Bearbeiten

- Ungültige Strukturen, unbekannte Datenversionen und unbekannte Felder werden schreibgeschützt angezeigt. Vor einem ausdrücklich gewünschten Zurücksetzen die vollständigen Originaldaten kopieren.
- Einträge ohne brauchbares Datum bleiben als nicht zugeordnete Datensätze erhalten und können über den Hinweis im Kalender geprüft werden.
- Die Vergangenheitsbereinigung zeigt eine Vorschau. Unerledigte Aufgaben, noch laufende mehrtägige oder nächtliche Termine und weiterhin benötigte Serienausnahmen bleiben erhalten. Serien ohne Enddatum werden vorsichtshalber nicht automatisch bereinigt.
- Beschreibungslinks erlauben extern nur `https`, `http` und `mailto`; andere Protokolle werden blockiert. Die vorhandenen internen Notizlinks bleiben nutzbar. Externe Ziele öffnen sich erst nach einem Klick.
- Es gibt keine Telemetrie, keine automatischen HTTP-Anfragen und kein Nachladen von Übersetzungen oder Programmcode.

Zum Schutz der Oberfläche gelten unter anderem: 2 MiB pro Kalenderblock, 5.000 Datensätze, 2.000 Ausnahmen pro Ausnahmeliste, 2.000 erzeugte Einträge pro dargestelltem Bereich und 500 zeitgebundene Einträge pro Tageslayout. Titel sind auf 1.000, Beschreibungen auf 20.000 Zeichen begrenzt. Die Undo-Historie hat insgesamt ein Budget von 8 MiB; Entwürfe zusammen 12 MiB. Beim Überschreiten werden Daten nicht automatisch abgeschnitten; Bearbeitung bzw. Anzeige wird mit Hinweis begrenzt.

## Prüfung und Grenzen

Die mitgelieferten Regressionstests prüfen die überarbeiteten Quellen in einer isolierten Umgebung mit simulierten Obsidian-APIs. Zusätzliche Chromium-Tests decken echte DOM-Interaktionen, deutsche Ansichten, Speicherfehler, Gestenabbruch, separate Dokumente und schmale Ansichten ab. Netzwerkaufrufe werden dabei blockiert.

**Eine echte Obsidian-Installation, reale Sync-Dienste, ein echtes Pop-out-Fenster und iOS-/Android-Geräte wurden hier nicht getestet.** Das Paket ist keine Sicherheitszertifizierung. Ergebnisse und verbleibende Prüfungen stehen in `PRUEFPROTOKOLL.md`; die Zuordnung zu allen Befunden der ursprünglichen Prüfung steht in `KORREKTUREN.md`.

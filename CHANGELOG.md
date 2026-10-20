# Änderungen

## 2.0.0 — MB Calendar — 19. Oktober 2026

Überarbeitung auf Grundlage des bereitgestellten MD Calendar 1.8.0, unter Beibehaltung seiner MIT-Lizenz.

- Eigene Plugin-ID `mb-calendar`; alte `md-calendar`-Blöcke bleiben unterstützt.
- Vollständige deutsche Oberfläche als Standard; Englisch und Russisch bleiben auswählbar. Sprache, Wochenanfang und Uhrformat getrennt konfigurierbar.
- Lokale Sprachkataloge, `Intl`-Anzeige und Pluralregeln; sprachunabhängige Datumswerte und Unicode-Suche.
- Schreiben nur nach eindeutiger Block- und Basisinhaltsprüfung; Dateiwarteschlange und Revisionskontrolle schützen parallele Änderungen.
- Sichtbarer Speicherstatus, Wiederholungsmöglichkeit und Wiederherstellungsentwürfe mit Kopie oder separater Notiz.
- Vergangenheitsbereinigung mit Vorschau, Schutz unerledigter Aufgaben und Berücksichtigung tatsächlicher Enddaten. Ausnahmen verbleibender Serien werden beibehalten.
- Explizite Linkprotokollfreigabe, sichere Öffnungsparameter und erkennbares externes Ziel.
- Prüfung von Datenstruktur, Version, Intervallen, Wochentagen und Einstellungen; ungültige oder unbekannte Formate bleiben geschützt.
- Getrennte Abbruchhandler für Zeigergesten; dokumentbezogene Ereignisbehandlung für ausgelagerte Kalender; IME-Schutz.
- Gemeinsamer Markdown-Zaunparser für Erkennung, Schreiben, Status und Cursorsteuerung.
- Korrekte Statusberechnung für Mitternacht und Vorabend-Termine.
- Begrenzte Datenmengen, Layoutlast, Undo-Historie und Ansichtszustände.
- Keine persönlichen Einstellungen im Release; eine eigenständig gebündelte Laufzeitdatei plus nachvollziehbare Quellen, Buildskript und Tests.

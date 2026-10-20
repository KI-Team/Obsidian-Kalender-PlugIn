# Umsetzung der ursprünglichen Prüfbefunde

Die Kennungen beziehen sich auf die Quellcodeprüfung des bereitgestellten MD Calendar 1.8.0. Pfade beziehen sich auf den entpackten Ordner `mb-calendar`; `main.js` ist das erzeugte Laufzeitbündel.

| Befund | Änderung | Nachvollziehbarer Quellcode |
|---|---|---|
| F1 / P1: Überschreiben fremder Änderungen, Revisionsrennen | Pro-Datei-Warteschlange, eindeutige Blocksuche, Basisinhaltsvergleich innerhalb von `vault.process`, Revisionsschleife und Entwurfssicherung. Konflikte werden abgebrochen. | `src/core.js`: `replaceCalendar`; `src/main.js`: `persist`, `schedulePersist`, `queueFile`, `captureDraft`, `destroy` |
| F2 / P1: gefährliche Vergangenheitsbereinigung | Unfertige Aufgaben zuerst schützen, tatsächliches Ende einschließlich Überhang berücksichtigen, offene Serien behalten, keine Ausnahmebereinigung bei verbleibender Serie, konkrete Löschvorschau. | `src/main.js`: `eventLastEnd`, `purgePlan`, `purgePast`, `PurgeModal` |
| F3 / P2: beliebige URI-Schemata | URL-Prüfung und Freigabe ausschließlich HTTP(S)/Mailto, Kontrollzeichenprüfung, `noopener,noreferrer`, beschriftetes externes Ziel. | `src/core.js`: `safeExternalURL`; `src/main.js`: `renderNoteText` |
| F4 / P2: unsichtbare Speicherfehler | Speicherstatus und Hinweis, Wiederholen, Kopieren und separate Wiederherstellungsnotiz. Fehler aus asynchronen Einstellungsaktionen werden angezeigt. | `src/main.js`: `updateSaveStatus`, `saveFailed`, `safeAction`; `src/draft-modal.js` |
| F5 / P2: stiller Verlust ungültiger oder unbekannter Daten | Struktur-, Versions-, Feld- und Zahlenprüfung vor Normalisierung; schreibgeschützte Fehleransicht. Validierte Einstellungen; ungültige Originalwerte bleiben erhalten. Eine unlesbare Einstellungsdatei wird nicht überschrieben. | `src/core.js`: `validateCalendar`, `validateSettings`; `src/main.js`: Konstruktor, `renderError`, `onload`, `saveSettings` |
| F6 / P2: `pointercancel` übernimmt Änderungen | Fünf getrennte Cancel-Handler räumen ausschließlich auf; Größenänderungen stellen die Ansicht wieder her. | `src/main.js`: `enableEventDrag`, `enableDrawCreate`, `enableEventResize`, `enableEventResizeTop`, `enableSpanResize` |
| F7 / P2: falsches Fenster/Dokument | Elementbezogenes Dokument und Fenster, passende Konstruktorprüfung, dokumentbezogene Listener und deren Abmeldung. | `src/main.js`: `doc`/`win`, `elementIs`, `armPlaceKeys`, Gestenhandler |
| F8 / P2: localeabhängige Datumswerte | Interne Moment-Instanzen mit explizitem Englisch, kanonische ASCII-Datumswerte, getrennte `Intl`-Anzeige, unterstützte Ziffernnormalisierung beim Einlesen. | `src/main.js`: `moment`, `displayDate`, `displayTime`, `toIsoDate`; `src/core.js`: `asciiDigits` |
| F9 / P2: Kalender in Markdown-Beispielen | Zustandsbehafteter Parser für alle Zäune, passende Abschlussart und Mindestlänge; gemeinsam für Schreiben, Status, Suche und Editorbereiche. | `src/core.js`: `scanBlocks`; `src/main.js`: `calendarBlockRanges`, `extractCalendarBlocks`, `findCalendarNote` |
| P2: Mitternachtsstatus | Tagesende und noch laufende Instanzen vom Vortag einbeziehen. | `src/main.js`: `nextUp`, `segEndMin` |
| P3: Ressourcenverbrauch | Block-/Text-/Datensatzgrenzen, begrenzte Instanzen und Tageslayouts, globales Undo- und Zustandsbudget. | `src/core.js`: `LIMITS`, `trimHistory`; `src/main.js`: `itemsInRange`, `layoutTimedEvents`, `viewState` |
| P3: persönliche Einstellungen im Paket | Kein `data.json` ausgeliefert, deutsche neutrale Defaults. | `manifest.json`, `src/main.js`: `DEFAULT_PLUGIN_SETTINGS` |
| Internationalisierung | EN/DE/RU-Kataloge mit Schlüssel- und Platzhalterprüfung, komplette Wiederholungssätze, `Intl.PluralRules`, Unicode-Suche, IME-Schutz, Sprachwahl mit Fallback. | `src/locales.js`, `src/core.js`: `searchKey`, `chooseLanguage`; `src/main.js`: `configureLocale`, `countLabel`, `repeatInterval` |

## Bewusste Grenzen

- Konflikte werden nicht automatisch zusammengeführt. Der Entwurf wird für den bewussten Abgleich erhalten.
- Kalender in Listen/Zitaten werden vom Schreibparser nicht unterstützt; sie sollten auf der obersten Markdown-Ebene stehen. Mehrdeutige IDs und nicht geschlossene Blöcke werden sicher abgewiesen.
- Unbekannte Datenfelder oder künftige Formatversionen werden nicht automatisch migriert. Zurücksetzen ist eine ausdrücklich bestätigte, destruktive Benutzeraktion.
- Grenzen sollen übermäßige Last begrenzen. Es wurden Grenzfälle geprüft, aber kein vollständiger Last- oder Speicherdauertest durchgeführt.
- Deutsch, Englisch und Russisch sind die ausgelieferten Sprachen. Die Oberfläche bleibt links-nach-rechts ausgerichtet. Eine spätere RTL-Sprache erfordert zusätzliche Layout- und Gestenarbeit.
- Reale Obsidian-, Synchronisations-, Pop-out- und Mobilgerätetests bleiben erforderlich. Die mitgelieferten Tests simulieren die Host-APIs und separate Dokumente.

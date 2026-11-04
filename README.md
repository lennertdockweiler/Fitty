# Ankleide

Ankleide ist eine Outfit-App für den Moment vor dem Schrank. Du gibst den Anlass an (Dresscode von „Sportlich“ bis „Black Tie“), dazu Wetter, Weg und Aktivität, und bekommst drei passende Kombinationen aus deinem eigenen Schrank. Die App läuft komplett im Browser, auf dem Handy und am Rechner, und ist eine einzige Datei: `index.html`.

Auftraggeber: Lennert Dockweiler, Konstanz. Sprache der App: Deutsch, Du-Form.

## Schnellstart

```bash
node build.js
```

Danach `index.html` im Browser öffnen. Es gibt keine Abhängigkeiten außer Node (ab Version 18) für Build und Tests. Die Schriften kommen von Google Fonts. Ohne Netz greifen die hinterlegten Ersatzschriften, alles andere funktioniert offline.

## Bedienung

Unten gibt es vier Tabs. Solange dein eigener Schrank leer ist, zeigt Ankleide einen Beispielschrank mit 44 Teilen, damit du sofort siehst, wie die Vorschläge aussehen.

### Heute

- **Anlass · Dresscode:** Ein Maßband mit sieben Stufen: 0 Sportlich, 1 Entspannt, 2 Casual, 3 Smart Casual, 4 Business Casual, 5 Business/Cocktail, 6 Black Tie. Unter dem Maßband stehen der Name der Stufe und typische Anlässe.
- **Wetter:** Vorlagen (Frost, Kühl, Nass, Mild, Warm, Heiß), ein Regler von −10 bis 38 °C und die Schalter Regen, Schnee, Wind und Sonnig. Darunter steht die gefühlte Temperatur. Die Jahreszeit steht auf „Auto“ oder wird fest gewählt.
- **Unterwegs:** Auto, Bus & Bahn, Fahrrad oder zu Fuß, dazu Faktoren wie „Viel Laufen“ oder „Abends kühler“ und eine Aktivität. Tennis, Joggen, Gym und Wandern stellen die Stufe auf „Sportlich“.
- **Stil:** Sicher, Ausgewogen oder Mutig (wie viel Farbe und Muster erlaubt ist). Dazu der Schalter „Nur Basics“.
- **Das soll rein:** Wunschteile kommen auf jeden Fall ins Outfit. Möglich ist ein bestimmtes Teil (zum Beispiel „Grauer Wollpullover“) oder eine Art, wahlweise mit Farbe (zum Beispiel „eine Jeans“ oder „ein Sakko in Navy“). Accessoires gehen auch.
- **Vorschläge:** Drei Outfit-Etiketten. Jedes hat einen Farbstreifen aus den Teilefarben, einen Wert für die Stimmigkeit (5 bis 99), die Teile mit Vorschau, Accessoires, Begründungen und Warnungen. Warnungen stehen orange und oben, zum Beispiel „Navy Sakko ist für Tennis unpraktisch“. Die Vorschläge aktualisieren sich bei jeder Änderung. „Nochmal würfeln“ zeigt drei andere Kombinationen.
- **Das trage ich** zählt die Teile als getragen (Zähler und Datum) und legt einen Tagebucheintrag an. **Merken** legt das Outfit unter Mehr → Tagebuch ab.

### Schrank

Suche, Bereichs-Chips (Oberteil, Layer, Jacke/Mantel, Hose, Schuhe, Accessoires) und Filter für Lieblinge, Basics, „Nie tragen“ und „In der Wäsche“. Ein Tipp auf ein Teil öffnet das Bearbeiten-Sheet: Name, Art, Farbe, Muster, Dresscode von/bis, Wärme, Komfort, Sporttauglichkeit, Jahreszeiten, die Schalter (wetterfest, Lieblingsteil, Basic, nie tragen, in der Wäsche) und ein Foto. Löschen fragt im Sheet noch einmal nach. „Heute unbedingt tragen“ setzt das Teil als Wunschteil. Mit dem Filter „In der Wäsche“ erscheint der Knopf „Alles wieder sauber“.

### Scan

„Foto aufnehmen“ öffnet auf dem Handy die Kamera, „Foto wählen“ die Galerie. Ankleide verkleinert das Bild auf 400 px und schlägt die Farbe vor. Die Art wählst du aus. Läuft die App als Artifact in claude.ai und hast du die Freigabe erteilt, erkennt Claude Art, Farbe und Muster. Danach gibt es drei Möglichkeiten:

- **Mit Schrank kombinieren:** drei Outfits mit dem gescannten Teil. Wetter und Weg kommen aus „Heute“, die Stufe wählst du innerhalb der Spanne des Teils.
- **Einkaufs-Check:** ein Urteil („Sehr vielseitig …“ bis „Passt aktuell zu fast nichts …“), die Zahl stimmiger Outfits, die Verteilung nach Stufe und die besten Partnerteile.
- **In den Schrank:** speichert das Teil mit Foto.

### Mehr

- **Lücken:** eine Checkliste mit 13 Basics und eine Abdeckungsmatrix (Stufen × Kühl/Mild/Warm/Regen): grün gut, gelb mit Kompromissen, grau Lücke.
- **Staples:** eine Rangliste der vielseitigsten Teile, die mit getragenen Outfits auch die echte Nutzung einrechnet. Dazu „Schläfer“ (vielseitig, aber selten getragen) und die meistgetragenen Teile.
- **Packen:** eine Kapselgarderobe für 1 bis 21 Tage, mit Handgepäck oder Koffer, Temperatur, Regen, Dresscode-Stufen und Aktivität. Ergebnis: die Teile nach Bereich mit der Zahl der Outfits, in denen sie vorkommen, die Gesamtzahl möglicher Outfits, was du am Reisetag trägst, Beispiel-Outfits und Warnungen. Die Häkchen „eingepackt“ dienen nur dem Abhaken beim Packen und werden nicht gespeichert.
- **Woche:** Outfits für 3, 5 oder 7 Tage ab morgen ohne Wiederholung, getrennt nach Werktag und Wochenende.
- **Tagebuch:** gemerkte und getragene Outfits und die meistgetragenen Teile. Entfernst du einen Eintrag, sinkt der Tragezähler wieder.
- **Einstellungen:** Speicherort, Darstellung (nur in der eigenständigen Fassung), Beispielschrank an/aus/übernehmen/entfernen, automatische Wäsche, Export und Import als JSON und „Alle Daten löschen“ mit zweiter Bestätigung.

## Annahmen

Für den Auftrag war niemand zum Rückfragen da. Diese Entscheidungen habe ich selbst getroffen:

1. **Starttemperatur:** Ankleide nutzt keinen Wetterdienst (offline-tauglich, keine externen Abhängigkeiten). Als Startwert dient der typische Tageshöchstwert in Konstanz für den aktuellen Monat (Januar 3 °C bis Juli/August 24 °C). Ab 20 °C ist „Sonnig“ vorgewählt.
2. **Vorschläge rechnen sofort neu,** sobald sich eine Angabe ändert. Beim Temperaturregler passiert das beim Loslassen. „Outfits vorschlagen“ rechnet neu und springt zu den Vorschlägen.
3. **Sportaktivitäten** (Tennis, Joggen, Gym, Wandern) setzen die Stufe auf „Sportlich“. Wechselst du zurück zu einer anderen Aktivität, kehrt die vorherige Stufe zurück.
4. **Ein Wunschteil je Bereich** (außer Accessoires). Ein neuer Wunsch für denselben Bereich ersetzt den alten, mit Hinweis. So taucht die Engine-Meldung „Zwei Wunschteile …“ im Alltag kaum auf.
5. **Beispielschrank:** Wer ein Beispielteil ändert, löscht oder ein Outfit daraus trägt, übernimmt den Beispielschrank als eigenen. Das Banner sagt das vorher. Wer im Beispielmodus ein neues Teil anlegt oder scannt, startet einen eigenen Schrank nur mit diesem Teil, außer „Beispielteile behalten“ ist angehakt. Beispielteile lassen sich in den Einstellungen später entfernen oder ergänzen.
6. **Gemerkte Outfits** liegen in den Einstellungen (`settings.saved`, höchstens 40), weil der vorhandene Speicher nur Teile, Tagebuch und Einstellungen kennt.
7. **Scan ohne Claude:** Die Art wählst du per Hand (laut Brief ist keine Heuristik nötig). Bleibt der Name leer, setzt Ankleide „Art Farbe“ ein, zum Beispiel „Pullover Grün“.
8. **Scan mit Claude:** Der Aufruf geht nur im Artifact (`sample.json` mit `modelTier: 'quick'` und dem Bild). Ankleide prüft das Ergebnis gegen die erlaubten Typ-, Farb- und Muster-IDs. Felder, die du schon geändert hast, überschreibt die Erkennung nicht. Jeder Fehler (zum Beispiel `not_granted`) führt ohne Meldung zur Eingabe per Hand.
9. **Wochenplaner:** Alle Tage haben dieselbe Temperatur. Oberteile bekommen für die zwei folgenden Tage einen deutlichen Abzug, Hosen, Layer und Schuhe am Folgetag einen leichten, Jacken keinen. Dasselbe Outfit kommt im Plan nicht zweimal vor. Fortbewegung und Farbmut kommen aus „Heute“. Der Plan ist ein Vorschlag und wird nicht gespeichert, einzelne Tage kannst du merken.
10. **Wäsche-Rotation:** Optional wandern Oberteile nach „Das trage ich“ automatisch in die Wäsche. Zurück kommen sie über Schrank → „In der Wäsche“ → „Alles wieder sauber“.
11. **Export/Import:** Der Export enthält Teile mit Fotos, Tagebuch und Einstellungen. Der Import ergänzt und überschreibt Teile mit gleicher ID und prüft dabei jedes Feld (gültige Typen, Farben, Zahlenbereiche, Fotos nur als JPEG/PNG/WebP-Data-URI). „Als Datei speichern“ gibt es nur in der eigenständigen Fassung, weil claude.ai Downloads aus Artifacts sperrt. Dort kopierst du den Text.
12. **Zwei Ausgaben:** `build.js` schreibt `index.html` (vollständiges HTML-Dokument) und `dist/artifact.html` (gleicher Inhalt ohne `<!doctype>`, `<head>` und `<body>`, weil claude.ai dieses Gerüst beim Veröffentlichen selbst anlegt).
13. **Branch:** Gearbeitet wird auf dem Branch dieser Cloud-Sitzung (`claude/outfit-app-development-y6kf1s`), nie auf `main`. Derselbe Stand liegt zusätzlich auf `ankleide-v1`, wie im Auftrag verlangt.

## Änderungen an der Engine

Die Engine habe ich nur dort geändert, wo ein Szenario aus der Abnahme oder eine Anforderung sichtbar falsch lief. Alle Änderungen sind in `test3.js` abgesichert.

| Datei | Änderung | Grund |
|---|---|---|
| `engine3.js` | Reine Sportteile (`a = 2` und `fmax ≤ 1`) kommen nur in die Kapsel, wenn eine Sport-Aktivität oder die Stufe „Sportlich“ gewählt ist. Beim Wandern nur wandertaugliche (Laufschuhe). | Bekannte Schwäche 1: Laufshirt in der 10-Tage-Kapsel bei 24 °C |
| `engine2.js` | Bei Black Tie kein Gürtel zum Smoking | Szenario „Black Tie bei 5 °C mit Regen“ |
| `engine.js` | Bei einem Wunsch nach einer Art („eine Jeans“) kommen alle passenden Teile in Frage, das beste zuerst. Vorher wurde immer das erste Teil der Liste genommen. | „Nochmal würfeln“ hat die Jeans nie gewechselt |
| `engine.js`, `engine2.js` | Ein Wunsch nach einer Art kann eine Farbe tragen: `{kind:'type', type:'sakko', color:'navy'}` | Anforderung „ein Navy-Sakko“ |

`ui1.js` habe ich nur ergänzt: Das Sheet schließt mit Escape, der Fokus bleibt im Sheet und kehrt danach zurück, und Bild-URLs werden nach dem Laden freigegeben.

## Bekannte Grenzen

- **Typenliste:** Sie ist auf eine klassische Herrengarderobe zugeschnitten (Hemd, Sakko, Smoking, Krawatte …). Rock, Kleid, Bluse oder Pumps fehlen und lassen sich in `data.js` unter `AK.TYPES` ergänzen.
- **Kein echtes Wetter:** Die Temperatur ist ein Schätzwert, den du einstellst.
- **Farberkennung ohne Claude:** Sie misst die häufigste Farbe in der Bildmitte gegen den Rand. Auf unruhigem Hintergrund oder bei Mustern liegt sie öfter daneben. Das Muster erkennt sie nicht.
- **Speicher:** Der Browserspeicher fasst etwa 5 MB, das reicht für rund 100 Teile mit Foto. Danach meldet die App, dass der Speicher voll ist. Lokaler Speicher und Konto-Speicher (claude.ai) werden nicht abgeglichen.
- **Bewertung:** Stimmigkeit und Einkaufs-Check beruhen auf festen Regeln der Engine (Dresscode-Spanne, Wärme, Farbfamilien, Muster). Geschmack bilden sie nur grob ab. Der Einkaufs-Check rechnet mit drei festen Temperaturen (4, 15 und 25 °C).
- **Black Tie:** Hosenträger und Kummerbund sind nicht modelliert.
- **Kapsel:** Am Reisetag trägt man laut Kapsel die schwersten Teile, Wetterwechsel während der Reise sind nicht berücksichtigt.
- **Tagebuch im Konto:** Jeder Eintrag ist ein eigenes Dokument. claude.ai erlaubt bis zu 25.000 Dokumente je Artifact.

## Aufbau

| Datei | Inhalt |
|---|---|
| `data.js` | Stufen, Slots, Typen, Farben, Muster, Aktivitäten, Beispielschrank (`AK.*`) |
| `engine.js`, `engine2.js`, `engine3.js` | Regel-Engine: Bewertung, Vorschläge, Einkaufs-Check, Lücken, Staples, Kapsel |
| `styles.css` | Design-Tokens (hell/dunkel), Maßband, Chips, Karten, Etiketten, Sheet, Matrix |
| `ui.css` | Ergänzungen: Touchziele 44 px, Listen, Formulare, Layout am Rechner |
| `body.html` | Grundgerüst: Kopf, vier Panels, Tab-Leiste, Sheet und Toast |
| `ui1.js` | Helfer (`h`, `ico`, `toast`, `openSheet`), Speicher (`Store`), Fotos |
| `ui2.js` | Start, Tabs, Statusanzeige, Outfit-Etikett, Tragen und Merken |
| `ui3.js` | Tab „Heute“ |
| `ui4.js` | Tabs „Schrank“ und „Scan“, Bearbeiten-Sheet |
| `ui5.js` | Tab „Mehr“ |
| `build.js` | setzt `index.html` und `dist/artifact.html` zusammen und prüft das Skript mit `node --check` |
| `test.js`, `test2.js` | Ausgabe-Tests der Engine (laufen ohne Fehler durch) |
| `test3.js` | Szenario-Tests der Engine mit Prüfungen |
| `tests/ui-smoke.js` | Smoke-Test der Oberfläche mit Playwright |

Die Reihenfolge im Build ist wichtig: `data.js`, Engine, `ui1.js` bis `ui5.js`, zuletzt der Start (`initApp()` und `Store.init()`).

### Speicher

`Store` (in `ui1.js`) legt alles unter dem Schlüssel `ankleide.v1` im `localStorage` ab. Jeder Zugriff steckt in `try/catch`, die Seite funktioniert auch ohne Speicher. Läuft die Seite als Artifact in claude.ai und ist man angemeldet, landen die Daten stattdessen in der privaten Konto-Datenbank unter `data/users/<id>/` (Teile `g_*`, Tagebuch `d_*`, Einstellungen `settings`). Fotos werden immer als verkleinerte JPEG-Data-URI (400 px) gespeichert, nie als Original.

## Tests

```bash
node test.js
```

```bash
node test2.js
```

```bash
node test3.js
```

```bash
node build.js && node tests/ui-smoke.js
```

Mit npm geht dasselbe über `npm test` (Engine) und `npm run test:ui` (Oberfläche).

- `test.js` und `test2.js` geben Vorschläge aus und laufen ohne Fehler durch.
- `test3.js` prüft 12 Szenarien mit `assert`, darunter die fünf aus der Abnahme: Black Tie bei 5 °C mit Regen, Joggen bei 28 °C, Tennis mit erzwungenem Sakko, Date mit Jogginghose, Wochenende mit Handgepäck bei 12 °C und Regen. Dazu das Laufshirt in der Kapsel und die Wunschteile.
- `tests/ui-smoke.js` braucht Playwright mit Chromium (`npm i -D playwright` und `npx playwright install chromium`). Er läuft bei 400 px und 1000 px, jeweils hell und dunkel, und prüft:
  - App-Start, alle vier Tabs (auch mit den Pfeiltasten)
  - die Abnahme-Szenarien über die Oberfläche
  - Wunschteile setzen, „Nochmal würfeln“, „Das trage ich“ (Zähler und Tagebuch)
  - Teil anlegen, bearbeiten, suchen, löschen
  - Scan mit Foto und Farberkennung, Einkaufs-Check, Kombinieren, Speichern
  - Lücken, Staples, Kapsel ohne Laufshirt, Wochenplaner ohne Wiederholung, Tagebuch
  - Export und Import, zweistufiges Löschen
  - kein horizontales Scrollen, keine Konsolenfehler
  - mit Attrappen von `window.claude` zusätzlich die Erkennung per Claude (erfolgreich und abgelehnt) und den Konto-Speicher

  Screenshots landen in `shots/`. Ohne Screenshots: `SHOTS=0 node tests/ui-smoke.js`.

## Deployment

### GitHub Pages (optional)

`index.html` liegt im Wurzelverzeichnis und braucht keinen Build-Schritt auf dem Server.

1. Bring den Stand nach `main`, zum Beispiel per Pull Request aus `ankleide-v1`. Alternativ veröffentlichst du direkt den Branch.
2. Öffne im Repository auf GitHub **Settings → Pages**.
3. Wähle unter **Build and deployment** als Source **Deploy from a branch**, dann den Branch (`main` oder `ankleide-v1`) und den Ordner **/ (root)**. Speichere.
4. Nach ein bis zwei Minuten ist die App unter `https://lennertdockweiler.github.io/Fitty/` erreichbar.

Die leere Datei `.nojekyll` sorgt dafür, dass GitHub die Dateien unverändert ausliefert. Nach jeder Änderung an den Quelldateien `node build.js` ausführen und die neue `index.html` mit committen.

### Als Artifact in claude.ai

`dist/artifact.html` wird als privates Artifact veröffentlicht, mit Titel „Ankleide“ und den Fähigkeiten `{db:{}, user:{}, sample:{images:true}}`. Dort speichert Ankleide im Konto und kann Fotos von Claude erkennen lassen. Beides fragt beim ersten Gebrauch um Erlaubnis. Ohne Freigabe läuft die App lokal und mit Eingabe per Hand weiter.

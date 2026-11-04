# Ankleide

Ankleide ist eine Outfit-App für den Moment vor dem Schrank. Du wählst den Anlass (Dresscode von „Entspannt“ bis „Business Formal“ und was du vorhast), das Wetter kommt automatisch oder von dir. Ankleide schlägt drei passende Kombinationen aus deinem eigenen Schrank vor, jede mit einer Zeichnung, wie das Outfit ungefähr aussieht. Die App läuft komplett im Browser, auf dem Handy und am Rechner, und ist eine einzige Datei: `index.html`.

Auftraggeber: Lennert Dockweiler, Konstanz. Sprache der App: Deutsch, Du-Form.

## Schnellstart

```bash
node build.js
```

Danach `index.html` im Browser öffnen. Es gibt keine Abhängigkeiten außer Node (ab Version 18) für Build und Tests. Online lädt die App die Schriften (Google Fonts) und das Wetter (Open-Meteo). Ohne Netz greifen Ersatzschriften und das Wetter stellst du selbst ein, alles andere funktioniert offline.

## Bedienung

Unten gibt es vier Tabs. Solange dein eigener Schrank leer ist, zeigt Ankleide einen Beispielschrank mit 46 Teilen. Alle Teile sind gezeichnet, so siehst du sofort, wie die Vorschläge aussehen.

### Heute

- **Anlass:**
  - Ein Maßband mit fünf Dresscode-Stufen:
    1. Entspannt
    2. Casual
    3. Smart Casual
    4. Business Casual: wie Smart Casual, aber strenger, Hemd statt T-Shirt, keine Jeans, keine Krawatte
    5. Business Formal: Anzug mit Krawatte
  - Darunter wählst du, was du vorhast, zum Beispiel Büro, Kundentermin, Date, Theater, Hochzeit (Gast) oder Ausflug. Passt die Stufe nicht zum Vorhaben, stellt Ankleide sie um und sagt das.
- **Wetter:**
  - Du wählst „Heute“ oder „Morgen“, die Temperatur (Tageshöchstwert, mit −/+ oder Regler) und eine Wetterlage (Sonnig, Bewölkt, Regen, Schnee), dazu „Windig“.
  - In der eigenständigen Fassung lädt Ankleide das Wetter automatisch von Open-Meteo (Standard: Konstanz, Ort änderbar). Änderst du selbst etwas, steht dort „eigene Angabe“, und „Live-Wetter nehmen“ holt die Vorhersage zurück.
- **Das soll rein:** Wunschteile kommen auf jeden Fall ins Outfit. Das geht als bestimmtes Teil oder als Art, wahlweise mit Farbe („ein Sakko in Navy“). Beides ist durchsuchbar.
- **Unterwegs & Stil:** Diese Angaben sind eingeklappt: Fortbewegung (Auto, Bus & Bahn, Fahrrad, zu Fuß), Faktoren wie „Viel Laufen“, Farbmut und „Nur Basics“.
- **Vorschläge:**
  - Drei Outfit-Etiketten, jede mit einer Zeichnung an der Schneiderpuppe, den Teilen mit Bild, Accessoires und Warnungen. Die Begründung klappst du unter „Warum dieses Outfit?“ auf.
  - Die Vorschläge aktualisieren sich bei jeder Änderung. Sind sie gerade nicht im Bild, erscheint unten „Vorschläge ansehen“.
  - „Nochmal würfeln“ zeigt drei andere Kombinationen.
- **Foto-Eindruck unter jeder Skizze:** In der eigenständigen Fassung erzeugt Ankleide zu jedem Vorschlag ein KI-Bild, wie das Outfit ungefähr aussieht. Daneben führen „Pinterest“ und „Google Bilder“ zu ähnlichen echten Looks im Web.
- **Pro Outfit:**
  - **Das trage ich** zählt die Teile als getragen und legt einen Tagebucheintrag an.
  - **Merken** legt das Outfit im Tagebuch ab.
  - **Daumen hoch oder runter** bringt Ankleide bei, was dir gefällt.

### Schrank

- **Suche:** Mehrere Wörter, alle müssen passen. „blau hemd“ findet Navy-, Hell- und Indigo-Hemden, „pulli“ findet Pullover, „liebling“ deine Lieblingsteile.
- **Filter:** Bereichs-Chips (Oberteil bis Accessoires) und Filter für Lieblinge, Basics, „Nie tragen“ und „In der Wäsche“.
- **Mehrere Teile per Text:** Über das Listen-Symbol neben „Neu“ schreibst du zum Beispiel „Navy Sakko, 2 weiße T-Shirts, dunkle Jeans, gestreiftes Hemd“. Ankleide erkennt Art, Farbe, Muster und Anzahl und zeigt eine Vorschau mit Zeichnung, die du korrigieren kannst. Was es nicht erkennt, ist markiert. Im Artifact kann Claude die Liste genauer lesen.
- **Ansicht:** Jedes Teil erscheint als Zeichnung in seiner Farbe und seinem Muster. Hast du ein eigenes Foto hinterlegt, siehst du das Foto.
- **Bearbeiten-Sheet:** Name, Art, Farbe, Muster, Dresscode von/bis, Wärme, Komfort, Sporttauglichkeit, Jahreszeiten, Schalter und Foto. Löschen fragt im Sheet noch einmal nach. „Heute unbedingt tragen“ setzt das Teil als Wunschteil.

### Scan

- **Foto:** „Foto aufnehmen“ öffnet auf dem Handy die Kamera, „Foto wählen“ die Galerie. Ankleide verkleinert das Bild auf 400 px und schlägt die Farbe vor. Läuft die App als Artifact in claude.ai, erkennt Claude auch Art und Muster.
- **Mit Schrank kombinieren:** drei Outfits mit dem gescannten Teil, jeweils mit Zeichnung.
- **Einkaufs-Check:** ein Urteil, die Zahl stimmiger Outfits, die Verteilung nach Stufe und die besten Partnerteile.
- **In den Schrank:** speichert das Teil mit Foto.

### Mehr

- **Lücken:** eine Checkliste mit 13 Basics und eine Abdeckungsmatrix (5 Stufen × Kühl/Mild/Warm/Regen).
- **Staples:** die vielseitigsten Teile, „Schläfer“ (vielseitig, aber selten getragen) und die meistgetragenen Teile.
- **Packen:** eine Kapselgarderobe für 1 bis 21 Tage, mit Handgepäck oder Koffer, Temperatur, Regen, Stufen und Aktivität.
- **Woche:** Outfits für 3, 5 oder 7 Tage ab morgen, getrennt nach Werktag und Wochenende. Das Oberteil wechselt jeden Tag.
- **Tagebuch:** gemerkte und getragene Outfits und die meistgetragenen Teile.
- **Einstellungen:**
  - Speicherort und Speicherbelegung
  - Wetter (Live an/aus, Ort suchen, eigener Standort)
  - Bilder (KI-Bild automatisch, auf Knopfdruck oder aus; Personen neutral, Herren oder Damen)
  - Vorlieben (Zahl der Bewertungen, zurücksetzen)
  - Beispielschrank und Wäsche-Automatik
  - Export und Import als JSON, alle Daten löschen

## Annahmen

1. **Dresscode:** Die Engine kennt intern weiter sieben Stufen (0 Sportlich bis 6 Black Tie), damit gespeicherte Teile gültig bleiben. Die Oberfläche bietet nur 1 bis 5 an. Beim Bearbeiten werden Spannen auf 1 bis 5 begrenzt, an den Vorschlägen ändert das nichts.
2. **Aktivitäten:** Sport (Tennis, Joggen, Gym, Wandern) ist entfernt. Neu sind Homeoffice, Kundentermin, Vorstellungsgespräch, Date, Ausflug, Uni, Kino/Konzert, Theater/Oper, Familienfeier, Party und Hochzeit. Jede hat einen üblichen Dresscode-Bereich. Liegt die gewählte Stufe außerhalb, stellt Ankleide sie auf den nächstgelegenen Rand.
3. **Wetter:** Der Temperaturwert ist der Tageshöchstwert. Daraus wird die Wetterlage abgeleitet: Schnee bei Schneefall, Regen ab 60 % Regenwahrscheinlichkeit oder bei Regen im Wettercode, Sonnig bei klarem Himmel, sonst Bewölkt. „Windig“ gilt ab 28 km/h. Ohne Live-Wetter startet Ankleide mit dem typischen Höchstwert in Konstanz für den Monat. Das Live-Wetter wird 30 Minuten zwischengespeichert. Die Jahreszeit ergibt sich aus Temperatur und Datum, eine eigene Auswahl gibt es nicht mehr.
4. **Zeichnungen statt Fotos:** Fotorealistische Bilder kann die App nicht erzeugen, weder offline noch im Artifact gibt es dafür ein Modell. Stattdessen zeichnet Ankleide jedes Teil und jedes Outfit als SVG aus Art, Farbe und Muster (`art.js`). Mäntel, Sakkos und Strickjacken stehen offen, damit die Schichten darunter sichtbar sind.
5. **Vorlieben:**
   - Jede Bewertung zählt für alle Paare von Teilen im Outfit: „Gefällt mir“ +1, „Nicht mein Stil“ −1,5, jedes getragene Outfit +0,3.
   - Die Engine nimmt den Mittelwert über die Paare eines Vorschlags. Genau das gemochte Outfit steigt also stärker als eines, das nur teilweise übereinstimmt.
   - Abgelehnte Kombinationen (gleiches Oberteil, gleiche Hose, gleiche Schuhe) kommen nicht mehr. Bewerten übernimmt den Beispielschrank nicht.
6. **Ein Wunschteil je Bereich** (außer Accessoires). Ein neuer Wunsch ersetzt den alten im selben Bereich.
7. **Beispielschrank:**
   - Wer ein Beispielteil ändert, löscht oder ein Outfit daraus trägt, übernimmt den Beispielschrank als eigenen. Wer im Beispielmodus ein neues Teil anlegt, startet einen eigenen Schrank nur mit diesem Teil, außer „Beispielteile behalten“ ist angehakt.
   - Smoking, Fliege, Laufshirt, Laufhose und Laufschuhe sind ausgemustert. Neu sind Teile für Business Casual und Formal (Feinstrick Navy, Stoffhose Navy, Loafer, gestreifte Krawatte, Einstecktuch, Polo Weiß, Strickjacke).
   - Die Kennungen `demo1` bis `demo51` bleiben fest, damit bereits übernommene Beispielschränke nicht durcheinanderkommen.
8. **Wochenplaner:** Alle Tage haben dieselbe Temperatur. Das Oberteil vom Vortag ruht, solange es eine Alternative gibt. Hosen, Layer und Schuhe bekommen am Folgetag einen leichten Abzug.
9. **Scan mit Claude:** nur im Artifact. Das Ergebnis wird gegen die erlaubten IDs geprüft, jeder Fehler führt still zur Eingabe per Hand.
10. **KI-Bilder und Web-Looks:**
    - Die KI-Bilder kommen vom freien Dienst pollinations.ai, ohne Anmeldung. Ankleide schickt nur eine englische Beschreibung des Outfits (Art, Farbe, Muster der Teile), keine Fotos und keine persönlichen Daten.
    - Gleiches Outfit, gleiches Bild: Der Startwert hängt am Outfit, der Browser kann das Bild zwischenspeichern.
    - Bilder laden nacheinander. Ist der Dienst ausgelastet, versucht Ankleide es nach 11 Sekunden bis zu zweimal erneut.
    - Pinterest und Google Bilder lassen sich nicht einbetten (keine offene Schnittstelle, Einbetten gesperrt), deshalb gibt es Links mit fertigem Suchbegriff („Navy Sakko Weiß Hemd … Outfit“).
    - „Personen“ steht anfangs auf neutral. Die App leitet aus nichts ab, ob Herren- oder Damenbilder passen, du stellst das in den Einstellungen ein.
11. **Text-Import:** Jede Zeile oder jeder Eintrag zwischen Kommas, „und“ oder „;“ wird ein Teil. Gibt es mehrere passende Wörter, zählt das letzte Hauptwort („Oxford-Hemd“ ist ein Hemd, „Jeansjacke“ eine Jacke). Ohne Farbangabe nimmt Ankleide eine typische Farbe und markiert sie als „geschätzt“.
12. **Datensicherung:** Liegt der Schrank nur im Browser und umfasst mindestens 10 Teile, erinnert der Schrank-Tab an einen Export, wenn der letzte länger als 30 Tage her ist.
13. **Zwei Ausgaben:** `build.js` schreibt `index.html` (vollständiges Dokument) und `dist/artifact.html` (ohne Dokumentgerüst, für claude.ai).
14. **Branch:** Gearbeitet wird auf `claude/outfit-app-development-y6kf1s`, derselbe Stand liegt auf `ankleide-v1`. Nie auf `main`.

## Änderungen an der Engine

Alle Änderungen sind in `test3.js` abgesichert.

| Datei | Änderung | Grund |
|---|---|---|
| `data.js` | Stufe 4 und 5 heißen „Business Casual“ und „Business Formal“, `AK.UI_LEVELS`, neue Aktivitäten mit Dresscode-Bereich, Beispielschrank ohne Sport/Black Tie | Wunsch des Auftraggebers |
| `engine.js` | Business Casual: Bonus für Hemd, Abzug für Jeans und T-Shirt | „etwas strenger als Smart Casual“ |
| `engine.js` | Optionale gelernte Vorlieben über `ctx.pairs` | Vorlieben sollen mitwachsen |
| `engine.js` | Ein Wunsch nach einer Art berücksichtigt alle passenden Teile, optional mit Farbe | „eine Jeans“, „ein Navy-Sakko“ |
| `engine2.js` | Hinweis, wenn bei Business Formal die Krawatte fehlt. Hinweis auf Vorlieben. Einkaufs-Check und Lücken nur über die angebotenen Stufen. | Neue Stufen |
| `engine2.js` | Kein Gürtel zum Smoking | Abnahme |
| `engine3.js` | Kapsel nur mit Sportteilen, wenn Sport geplant ist | Bekannte Schwäche 1 |

`ui1.js` habe ich ergänzt: Speicher für Bewertungen (`f_*` im Konto, `feedback` lokal), Escape und Fokus im Sheet.

## Bekannte Grenzen

- **Zeichnungen:** Sie sind Annäherungen. Schnitt, Material und Passform zeigen sie nicht, nur Art, Farbe und Muster. Eigene Fotos erscheinen in Schrank und Teilelisten, die Outfit-Zeichnung bleibt gezeichnet.
- **KI-Bilder:**
  - Sie sind ein ungefährer Eindruck. Das freie Modell trifft Farben und Teile meist, Schnitte und Details nicht immer, Gesichter wirken oft verzerrt. Unten rechts steht ein kleines Wasserzeichen.
  - Der Dienst ist kostenlos, aber nicht garantiert verfügbar. Bessere Modelle bräuchten einen geheimen Schlüssel, der nicht in eine Browser-App gehört. Das ginge nur über einen kleinen Dienst auf dem Pi.
  - Im claude.ai-Artifact gibt es keine KI-Bilder, weil dort Bilder aus dem Netz gesperrt sind. Die Links zu Pinterest und Google funktionieren dort.
- **Live-Wetter nur in der eigenständigen Fassung:** claude.ai blockiert in Artifacts Abrufe ins Internet. Dort stellst du das Wetter selbst ein. Den eigenen Standort gibt es nur über `https` oder `localhost`, auf einem Raspberry Pi über `http` suchst du den Ort per Name.
- **Typenliste:** Sie ist auf eine klassische Herrengarderobe zugeschnitten, Rock, Kleid oder Bluse fehlen (ergänzbar in `data.js`).
- **Speicher im Browser:** etwa 5 MB, das reicht für rund 100 Teile mit Foto. Die Einstellungen zeigen die Belegung. Langfristig ist das Artifact (Konto-Speicher) oder ein Speicher-Dienst auf dem Pi besser.
- **Bewertung:** Stimmigkeit, Einkaufs-Check und Vorlieben beruhen auf festen Regeln. Geschmack bilden sie nur grob ab.

## Aufbau

| Datei | Inhalt |
|---|---|
| `data.js` | Stufen, Slots, Typen, Farben, Muster, Aktivitäten, Beispielschrank (`AK.*`) |
| `engine.js`, `engine2.js`, `engine3.js` | Regel-Engine: Bewertung, Vorschläge, Einkaufs-Check, Lücken, Staples, Kapsel |
| `styles.css` | Design-Tokens (hell/dunkel), Maßband, Chips, Karten, Etiketten, Sheet, Matrix |
| `ui.css` | Ergänzungen: Zeichnungen, Wetter, Suche, Touchziele 44 px, Layout am Rechner |
| `body.html` | Grundgerüst: Kopf, vier Panels, Tab-Leiste, Sheet und Toast |
| `ui1.js` | Helfer (`h`, `ico`, `toast`, `openSheet`), Speicher (`Store`), Fotos |
| `art.js` | Zeichnungen: jedes Teil einzeln, jedes Outfit an der Schneiderpuppe |
| `ui2.js` | Start, Tabs, Status, Suche, Outfit-Etikett mit KI-Bild und Web-Links, Tragen, Merken, Vorlieben |
| `ui3.js` | Tab „Heute“ mit Live-Wetter |
| `ui4.js` | Tabs „Schrank“ und „Scan“, Bearbeiten-Sheet, Text-Import |
| `ui5.js` | Tab „Mehr“ |
| `build.js` | setzt `index.html` und `dist/artifact.html` zusammen und prüft das Skript mit `node --check` |
| `test.js`, `test2.js` | Ausgabe-Tests der Engine aus der Übergabe (laufen ohne Fehler durch) |
| `test3.js` | 12 Szenario-Tests der Engine mit Prüfungen |
| `tests/ui-smoke.js` | Smoke-Test der Oberfläche mit Playwright |

Die Reihenfolge im Build: `data.js`, Engine, `ui1.js`, `art.js`, `ui2.js` bis `ui5.js`, zuletzt der Start.

### Speicher

`Store` (in `ui1.js`) legt alles unter dem Schlüssel `ankleide.v1` im `localStorage` ab. Jeder Zugriff steckt in `try/catch`. Als Artifact in claude.ai mit Anmeldung landen die Daten in der privaten Konto-Datenbank unter `data/users/<id>/`: Teile `g_*`, Tagebuch `d_*`, Bewertungen `f_*` und Einstellungen `settings`. Fotos werden als verkleinerte JPEG-Data-URI (400 px) gespeichert. Das zuletzt geladene Wetter liegt unter `ankleide.wx`.

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

- `test3.js` prüft 12 Szenarien:
  - Business Formal bei 5 °C mit Regen, Business Casual ohne Krawatte und Jeans
  - Date mit Jogginghose, Wochenende mit Handgepäck, 10-Tage-Kapsel ohne Sportteile
  - Wunschteile („eine Jeans“, „ein Navy-Sakko“), Vorlieben, Beispielschrank, leerer Schrank, Einkaufs-Check und Lücken
- `tests/ui-smoke.js` braucht Playwright mit Chromium. Er läuft bei 400 px und 1000 px, jeweils hell und dunkel, mit 71 Prüfungen:
  - Zeichnungen an jedem Outfit und Teil, KI-Bild unter der Skizze (feste Testantwort), Pinterest-Link, fünf Stufen, Aktivitäten ohne Sport
  - Text-Import mit Vorschau, Korrektur und Übernahme; Bild-Einstellungen (aus, Herren)
  - Live-Wetter (mit fester Testantwort, ohne Netz), Morgen, Plus/Minus, Wetterlage
  - Business Formal und Casual, „Hochzeit“ hebt die Stufe, Wunschteil per Suche, Date mit Jogginghose
  - Unterwegs & Stil, Würfeln, Bewerten, Tragen, Merken
  - Teil anlegen, bearbeiten, suchen, löschen; Scan mit Foto, Einkaufs-Check, Kombinieren
  - Mehr (Matrix, Staples, Kapsel, Wochenplan ohne doppeltes Oberteil, Tagebuch), Wetter-Ort, Export/Import, Löschen
  - kein horizontales Scrollen, keine Konsolenfehler
  - mit Attrappen von `window.claude` zusätzlich die Erkennung per Claude und den Konto-Speicher

  Screenshots landen in `shots/`. Ohne Screenshots: `SHOTS=0 node tests/ui-smoke.js`.

## Deployment

### Raspberry Pi oder eigener Rechner

Die App ist eine statische Datei. Jeder Webserver reicht, zum Beispiel nginx:

```bash
sudo apt install -y nginx
```

```bash
sudo cp index.html /var/www/html/index.html
```

Dann im Handy-Browser im selben WLAN `http://<IP-des-Pi>/` öffnen. Der Schrank liegt dabei im Browser des jeweiligen Geräts.

### GitHub Pages (optional)

1. Bring den Stand nach `main`, zum Beispiel per Pull Request aus `ankleide-v1`. Alternativ veröffentlichst du direkt den Branch.
2. Öffne im Repository auf GitHub **Settings → Pages**.
3. Wähle unter **Build and deployment** als Source **Deploy from a branch**, dann den Branch und den Ordner **/ (root)**. Speichere.
4. Nach ein bis zwei Minuten ist die App unter `https://lennertdockweiler.github.io/Fitty/` erreichbar. Über `https` funktioniert dort auch „Meinen Standort verwenden“.

`.nojekyll` sorgt dafür, dass GitHub die Dateien unverändert ausliefert. Nach jeder Änderung `node build.js` ausführen und die neue `index.html` mit committen.

### Als Artifact in claude.ai

`dist/artifact.html` wird als privates Artifact veröffentlicht, mit Titel „Ankleide“ und den Fähigkeiten `{db:{}, user:{}, sample:{images:true}}`. Dort speichert Ankleide im Konto, auf allen Geräten gleich, und Claude kann Fotos erkennen. Live-Wetter gibt es dort nicht.

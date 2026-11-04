# Ankleide: Auftrag für die Cloud-Sitzung

Du setzt eine Outfit-App namens **Ankleide** fertig um. Die Regel-Engine (Dresscode, Wetter, Jahreszeit, Aktivität, Staples, Packliste) steht bereits und ist mit Node-Tests geprüft. Es fehlen die Oberfläche, der Build und die Tests der Oberfläche. Niemand ist zum Rückfragen da: triff sinnvolle Annahmen und schreibe sie in die README.

Sprache der App und aller Texte: **Deutsch, Du-Form**. Auftraggeber ist Lennert Dockweiler (Konstanz).

## 1. Ziel und Ergebnis

Wer ratlos vor dem Schrank steht, gibt Anlass (Dresscode von sportlich bis Black Tie), Wetter und ein paar Rahmenbedingungen an und bekommt mehrere passende Outfit-Kombinationen aus dem eigenen Schrank zur Auswahl.

**Lieferumfang**
1. `index.html`: eine einzige, in sich geschlossene Datei (CSS, JS und Daten inline, Schriften von Google Fonts, sonst keine externen Abhängigkeiten). Läuft auf dem Handy und am Rechner, offline-tauglich außer den Schriften.
2. `build.js`: setzt `index.html` aus den Quelldateien zusammen (siehe Abschnitt 6).
3. `README.md`: Bedienung, Annahmen, bekannte Grenzen, Deployment (GitHub Pages ist optional).
4. Tests: die vorhandenen Node-Tests laufen weiter, dazu ein Smoke-Test der Oberfläche (jsdom oder Playwright, was in der Umgebung verfügbar ist).
5. Alles auf einem Branch `ankleide-v1` committen, nie direkt auf `main`.

## 2. Anforderungen des Nutzers (vollständig)

Kern
- Anlass mit Dresscode in Abstufungen von sportlich bis Black Tie.
- Wetter und weitere Faktoren, zum Beispiel die Art der Fortbewegung (was ist praktisch, was unpraktisch).
- Pieces, die man unbedingt tragen will: ein bestimmtes Teil (zum Beispiel einen bestimmten Pullover) oder eine Art (zum Beispiel „eine Jeans“, „ein Navy-Sakko“), auch Accessoires. Wird berücksichtigt, wenn es angegeben ist.
- Mit oder ohne Vorgaben mehrere Outfit-Kombinationen vorstellen, aus denen man eines wählt.
- Foto-Funktion: ein Kleidungsstück fotografieren, die App erkennt Art und Farbe und kombiniert es mit dem Rest des Schranks. Dazu ein Einkaufs-Check („passt das zu meinem Schrank?“).
- Basics/Staples, Lieblinge, Filter für „das trage ich gern“ und „das keinesfalls“.

Nachträglich ergänzt
- Jahreszeiten (Frühling, Sommer, Herbst, Winter), Regen, Schnee, Wind, Hitze, Kälte.
- Aktivität und Praktikabilität: Dreiteiler beim Tennis oder Jogginghose beim Date sind problematisch und müssen gewarnt oder vermieden werden.
- Staple Pieces, die oft verwendet werden, sollen sich aus der Nutzung heraus erkennen lassen.
- Packen für Reise oder Wochenende: die vielseitigsten Outfits finden, eine Kapselgarderobe für Handgepäck oder Koffer.

## 3. Vorhandene Dateien (alle im Repo-Wurzelverzeichnis)

| Datei | Inhalt |
|---|---|
| `data.js` | `AK.LEVELS`, `AK.SLOTS`, `AK.TYPES`, `AK.SEASONS`, `AK.seasonFor`, `AK.ACTIVITIES`/`AK.ACT`, `AK.normalize`, `AK.COLORS`, `AK.PATTERNS`, `AK.TRANSPORT`, `AK.FACTORS`, `AK.WEATHER_PRESETS`, `AK.DEMO` (rund 45 Beispielteile) |
| `engine.js` | `AK.enumerate`, `AK.pickDiverse`, `AK.comboKey`, Bewertung der Kombinationen |
| `engine2.js` | `AK.buildOutfit`, `AK.suggest`, `AK.shopCheck`, `AK.gaps` |
| `engine3.js` | `AK.staples`, `AK.capsule` |
| `styles.css` | komplettes Design: Tokens (hell/dunkel), Bottom-Tabs, Maßband, Chips, Karten, Outfit-Etiketten, Sheet, Toast, Matrix |
| `ui1.js` | Helfer (`h()`, `ico()`, `toast`, `openSheet`), Speicher (`Store`), Foto-Verarbeitung (`processPhoto`, `detectColor`) |
| `test.js`, `test2.js` | Node-Tests der Engine (`node test.js`, `node test2.js`) |

Die Engine-Dateien sind ES5-Stil und hängen alles an das globale Objekt `AK`. In Node: `require('./data.js')` liefert `AK`, danach die Engine-Dateien laden (siehe `test.js`).

### Datenmodell eines Kleidungsstücks
```
{ id, name, type, slot, color, pattern, fmin, fmax, w, c, water, fav, never, basic,
  avail, photo, wears, last, a, s, demo }
```
- `type`: Schlüssel aus `AK.TYPES` (zum Beispiel `jeans`, `hemd`, `sakko`, `sneaker`, `guertel`). `slot`: `top | mid | outer | bottom | shoes | acc` (Sakko und Smoking sind `mid`, Mäntel `outer`).
- `color`: ID aus `AK.COLORS`. `pattern`: `uni | streifen | karo | print`.
- `fmin`/`fmax`: Dresscode-Spanne 0 bis 6. `w`: Wärme (Dämmwert). `c`: Komfort 1 bis 3. `water`: wetterfest. `a`: Sporttauglichkeit 0 bis 2. `s`: Jahreszeiten-Liste.
- `fav`, `basic`, `never` (nie tragen), `avail` (false = in der Wäsche), `wears` (Zähler), `last` (`YYYY-MM-DD`), `photo` (Data-URI-Vorschaubild oder null), `demo` (Beispielteil).
- Immer `AK.normalize(x)` anwenden, es ergänzt fehlende Felder aus dem Typ.

### Dresscode-Stufen (`AK.LEVELS`)
0 Sportlich, 1 Entspannt, 2 Casual, 3 Smart Casual, 4 Business Casual, 5 Business/Cocktail, 6 Black Tie.

### Engine-Schnittstelle
Kontext `ctx`:
```
{ level, weather:{temp, rain, snow, wind, sun}, transport:'auto|oepnv|rad|fuss',
  factors:[ 'walk'|'sit'|'cool_evening'|'indoor'|'impress' ],
  must:[ {kind:'item', id|item} | {kind:'type', type} ],
  boldness:0|1|2, onlyBasics:boolean, seed:number, today:'YYYY-MM-DD',
  activity:'alltag|buero|stadt|reise|tanzen|tennis|joggen|gym|wandern', season:'fruehling|sommer|herbst|winter' (optional) }
```
- `AK.suggest(W, ctx, {n:3, cap:8, avoid:[keys]})` liefert `{outfits, warns, total, missing}`. Jedes Outfit: `{items:{top,mid,outer,bottom,shoes,acc[]}, score (5 bis 99), notes[], warns[], softs[], key, feels}`. `missing` ist `null` oder eine Liste deutscher Slot-Namen, die im Schrank fehlen.
- `AK.shopCheck(W, item, today)` liefert `{n, tier:'none|low|good|great|acc', verdict, byLevel, partners[]}`.
- `AK.gaps(W, today)` liefert `{basics:[{id,name,why,have}], matrix:{levels, cols, cells}}` (Zelle 0, 1 oder 2).
- `AK.staples(W, today)` liefert `{rows:[{item,vers,wearsN,score}], worn, sleepers, hasUsage}`.
- `AK.capsule(W, {days, luggage:'hand'|'koffer', temp, rain, levels:[…], today, activity, season})` liefert `{pieces:{top,mid,outer,bottom,shoes,acc}, n, usage, samples, travel, warns, caps, total}`. `usage` zählt nur Hauptslots, zeige für Accessoires keine Zahl.
- `W` ist immer die Liste der Teile (`wardrobe()`), gerechnet wird je Aufruf in etwa 30 bis 200 ms.

## 4. Oberfläche, die noch zu bauen ist

`ui1.js` ist fertig, ruft aber `renderSync()` und `onData()` auf, die du definieren musst. Weitere Dateien `ui2.js` bis `ui5.js` (oder eine) und `body.html`. Nutze die vorhandenen CSS-Klassen aus `styles.css`, erweitere sie nur wo nötig. Mobile first (400 px), Bottom-Tabs, hell und dunkel.

**DOM-Vertrag** für `body.html`:
`<header class="top"><div class="brand">Ankleide</div><div class="sync" id="sync"></div></header>`, `<main class="wrap">` mit Panels `#p-today`, `#p-closet`, `#p-scan`, `#p-more` (`class="panel"`, nur eines ohne `hidden`), `<nav class="tabs">` mit vier Buttons (Heute, Schrank, Scan, Mehr; `aria-selected`, Icon plus `.tick`), `<div id="sheet-root"></div>`, `<div id="toast" class="toast" hidden></div>`.

### Tab „Heute“
- Maßband mit sieben Stufen (`.tape`, Buttons mit `aria-pressed`), darunter Name und Hinweis der Stufe. Kurzlabels: Sport, Relaxt, Casual, Smart, Business, Cocktail, Black Tie.
- Wetter: Presets (`AK.WEATHER_PRESETS`) als Chips, Temperatur-Slider von -10 bis 38 °C mit großer Anzeige, Schalter Regen, Schnee, Wind, Sonnig. Jahreszeit: Chips „Auto“ plus vier (Auto nutzt `AK.seasonFor(temp, Monat)`).
- Unterwegs: Segment Auto, Bus & Bahn, Fahrrad, Zu Fuß; Faktoren-Chips (`AK.FACTORS`); Aktivität als Auswahl (`AK.ACTIVITIES`). Sportaktivitäten (tennis, joggen, gym, wandern) setzen die Stufe auf 0.
- Stil: Segment Sicher, Ausgewogen, Mutig (boldness 0, 1, 2); Schalter „Nur Basics“.
- „Das soll rein“: Chips der gewählten Wunschteile mit Entfernen; Button öffnet ein Sheet mit zwei Reitern: bestimmtes Teil (Schrank nach Slot gruppiert) und Typ (`AK.TYPES`).
- Button „Outfits vorschlagen“ (akzentfarben, volle Breite) und „Nochmal würfeln“ (neuer `seed`, bisherige `key`s als `avoid`). Ergebnis: drei Outfit-Karten (`.outfit` mit Farbstreifen-Spine, `.fit`-Balken mit Score, Teile mit Vorschau, `.notes`, Warnungen als `li.w`, Accessoires). Aktionen „Das trage ich“ (erhöht `wears`, setzt `last`, legt Tagebucheintrag an) und „Merken“.
- Hinweise anzeigen: `res.warns`, `res.missing` („Dir fehlen noch: …“), leerer Zustand.

### Tab „Schrank“
- Suche, Slot-Chips, Filter Lieblinge, Basics, Nie tragen, In der Wäsche. Raster `.closet` mit `.gcard` und `.thumb` (Farbe, Muster, Foto, Badges Stern/Basic).
- „+“ legt ein Teil an. Bearbeiten-Sheet: Name, Typ, Farbfelder (`.sw`), Muster, Dresscode von/bis, Wärme, wetterfest, Komfort, Jahreszeiten, Sporttauglichkeit, Schalter Lieblingsteil / Basic / Nie tragen / In der Wäsche, Foto, Löschen (mit zweistufiger Bestätigung im Sheet, kein `confirm()`).
- Solange der eigene Schrank leer ist, zeigt die App den Beispielschrank (`AK.DEMO`) mit Banner „Beispiel übernehmen / Leeren Schrank starten“ (`settings.demoOff`). `wardrobe()` und `isDemo()` in `ui1.js` regeln das.

### Tab „Scan“
- Foto aufnehmen oder wählen (`<input type="file" accept="image/*" capture="environment">`, keine Kamera-API). `processPhoto(file)` liefert Vorschau, Blob und Farbvorschlag.
- Erkennung von Art, Farbe, Muster: Wenn `window.claude` mit `sample` verfügbar ist, `sample.json(prompt, {images:[blob], modelTier:'quick'})` mit den erlaubten Typ-, Farb- und Muster-IDs im Prompt, Ergebnis gegen die erlaubten IDs validieren; Fehler (`not_granted` usw.) führen still zur Handarbeit. Sonst Farbe aus dem Canvas und Art über ein Auswahlfeld.
- Editierbares Formular, dann „Mit Schrank kombinieren“ (Teil als Wunschteil, Outfit-Vorschläge), „Einkaufs-Check“ (`AK.shopCheck`: Urteil, Anzahl Kombis, Verteilung nach Stufe, Partnerteile) und „In den Schrank“.

### Tab „Mehr“
- **Lücken**: Basics-Checkliste (`gaps().basics`) und Abdeckungsmatrix (`.matrix`, Stufen × Kühl/Mild/Warm/Regen).
- **Staples**: Rangliste aus `AK.staples` (Vielseitigkeit und Tragehäufigkeit), „Schläfer“ (vielseitig, aber selten getragen).
- **Packliste / Kapsel**: Tage (1 bis 21), Handgepäck oder Koffer, Temperatur, Regen, Dresscode-Stufen, Aktivität. Ausgabe: Teile nach Slot, Zahl möglicher Outfits, Beispiel-Outfits, „Am Reisetag tragen“, Warnungen.
- **Tagebuch**: Liste getragener Outfits, meistgetragene Teile.
- Einstellungen: Beispielschrank an/aus, Daten löschen (zweistufig).

Tagebucheintrag: `{id, ts, date:'YYYY-MM-DD', level, temp, activity, ids:[…], names:[…]}`.

### Speicherung
`Store` in `ui1.js` nutzt `localStorage` (Schlüssel `ankleide.v1`) und hängt optional an die Konto-Datenbank, wenn `window.claude` vorhanden ist (nur in claude.ai als Artifact). Für die eigenständige Fassung zählt nur der lokale Pfad: jeder Zugriff in `try/catch`, die Seite muss ohne Speicher funktionieren. Fotos als verkleinerte JPEG-Data-URI (400 px), nie als Original.

## 5. Gestaltung

Eigenständig, kein Standard-Look: Maßband-Motiv in Messgelb für den Dresscode, Outfits als Etiketten mit Farbstreifen aus den Teilefarben, DM Mono für Kleinstbeschriftungen. Fonts: `https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,500..900&family=DM+Mono:wght@400;500&family=Instrument+Sans:wght@400..700&display=swap` mit Fallback-Stacks (in `styles.css` schon hinterlegt). Hell/Dunkel über Tokens, Fokus sichtbar, Touchziele mindestens 44 px, `:focus-visible`, Kontraste prüfen. Keine `alert()`/`confirm()`/`prompt()`.

## 6. Build

`build.js` (Node, ohne Abhängigkeiten) schreibt `index.html`: `<title>Ankleide</title>`, `<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">`, Fonts-Link, `<style>` mit `styles.css`, `body.html`, dann ein `<script>` mit `data.js`, `engine.js`, `engine2.js`, `engine3.js`, `ui1.js`, `ui2.js` … und einem Start (`Store.init()` plus erste Darstellung). Die Reihenfolge ist wichtig, `data.js` zuerst. Danach `node --check` auf das zusammengesetzte Skript.

## 7. Abnahme

- `node test.js` und `node test2.js` laufen ohne Fehler.
- Smoke-Test der Oberfläche (jsdom oder Playwright mit Chromium bei 400 px und 1000 px): App startet, alle vier Tabs wechseln, ein Outfit-Vorschlag erscheint mit Beispielschrank, Teil anlegen und bearbeiten, Wunschteil setzen, „Das trage ich“ erhöht `wears`, Einkaufs-Check liefert ein Urteil, Kapsel liefert Teile, kein horizontales Scrollen, keine Konsolenfehler. Screenshots hell und dunkel ansehen und Auffälligkeiten beheben.
- Szenarien, die sich plausibel verhalten müssen: Black Tie bei 5 °C mit Regen; Joggen bei 28 °C; Tennis mit erzwungenem Sakko (Warnung); Date mit Jogginghose (Warnung); Wochenende, Handgepäck, 12 °C, Regen.

## 8. Bekannte Schwächen, bitte angehen

1. Kapsel: In einer 10-Tage-Koffer-Kapsel bei 24 °C taucht ein „Laufshirt“ auf. Reine Sportteile (`a` = 2 und `fmax` ≤ 1) sollen nur in die Kapsel, wenn die Aktivität Sport ist.
2. Beim Scan ohne KI (Standalone) ist die Art-Erkennung nur manuell. Eine einfache Heuristik über das Seitenverhältnis ist nicht nötig.
3. Die Oberfläche ist komplett ungetestet; `ui1.js` ist nur syntaxgeprüft.
4. Optional, wenn Zeit bleibt: Wochenplaner (Outfits für mehrere Tage ohne Wiederholung), Wäsche-Rotation, Export und Import des Schranks als JSON-Datei über Dateiauswahl und Textfeld (Downloads sind im Artifact gesperrt, in der eigenständigen Fassung kein Problem).

## 9. Wenn das Werkzeug „Artifact“ verfügbar ist

Zusätzlich veröffentlichen: privates Artifact, Titel `Ankleide`, Icon-Wort `wardrobe`, Fähigkeiten `{db:{}, user:{}, sample:{images:true}}`, Datei `index.html`. Vorher den Skill `artifact-capabilities` laden. Ohne dieses Werkzeug entfällt der Punkt.

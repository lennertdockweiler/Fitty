#!/usr/bin/env node
/*
 * Smoke-Test der Oberfläche mit Playwright und Chromium.
 *   node build.js && node tests/ui-smoke.js            Screenshots landen in shots/
 *   SHOTS=0 node tests/ui-smoke.js                       ohne Screenshots
 * Prüft bei 400 px und 1000 px, hell und dunkel: Start, Tabs, Vorschläge mit Beispielschrank,
 * Abnahme-Szenarien, Wunschteile, „Das trage ich“, Teil anlegen/bearbeiten/löschen, Scan mit Foto,
 * Einkaufs-Check, Kapsel, Wochenplaner, Tagebuch, Export/Import, kein horizontales Scrollen,
 * keine Konsolenfehler. Dazu die Erkennung per Claude und der Konto-Speicher mit Attrappen von window.claude.
 */
'use strict';
var path = require('path');
var fs = require('fs');
var http = require('http');
var chromium;
try { chromium = require('playwright').chromium; } catch (e) {
  console.error('Playwright fehlt. Installiere es mit „npm i -D playwright“ und „npx playwright install chromium“.');
  process.exit(2);
}

var ROOT = path.join(__dirname, '..');
var SHOTS = process.env.SHOTS !== '0';
var SHOT_DIR = path.join(ROOT, 'shots');
var results = [];

function server() {
  return new Promise(function (resolve) {
    var s = http.createServer(function (req, res) {
      var f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html');
      if (f.indexOf(ROOT) !== 0 || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(ROOT, 'index.html');
      res.writeHead(200, { 'content-type': /\.html$/.test(f) ? 'text/html; charset=utf-8' : 'text/plain' });
      fs.createReadStream(f).pipe(res);
    });
    s.listen(0, '127.0.0.1', function () { resolve(s); });
  });
}
function ok(cond, msg) { if (!cond) throw new Error(msg); }
async function step(label, fn) {
  try { await fn(); results.push({ label: label, ok: true }); console.log('ok   ' + label); }
  catch (e) { results.push({ label: label, ok: false, err: e.message }); console.log('FAIL ' + label + '\n     ' + e.message.split('\n')[0]); }
}
async function newPage(browser, url, opt) {
  var ctx = await browser.newContext({ viewport: { width: opt.w, height: opt.h }, colorScheme: opt.scheme, deviceScaleFactor: 1 });
  if (opt.init) await ctx.addInitScript(opt.init);
  var page = await ctx.newPage();
  page.setDefaultTimeout(5000);
  page.errors = [];
  page.on('console', function (m) {
    if (m.type() !== 'error') return;
    var loc = (m.location() || {}).url || '';
    if (/fonts\.(googleapis|gstatic)\.com/.test(loc + m.text())) return; // offline ohne Schriften ist erlaubt
    page.errors.push(m.text());
  });
  page.on('pageerror', function (e) { page.errors.push('pageerror: ' + e.message); });
  await page.goto(url);
  return page;
}
async function store(page) { return page.evaluate(function () { try { return JSON.parse(localStorage.getItem('ankleide.v1')); } catch (e) { return null; } }); }
async function noHScroll(page, where) {
  var w = await page.evaluate(function () { return [document.documentElement.scrollWidth, window.innerWidth]; });
  ok(w[0] <= w[1], 'horizontales Scrollen in ' + where + ': ' + w[0] + ' > ' + w[1]);
}
async function cardsText(page) { return page.$$eval('#today-results .outfit', function (els) { return els.map(function (e) { return e.innerText; }); }); }
async function waitCards(page, pred, label) {
  try {
    await page.waitForFunction(pred, null, { timeout: 4000 });
  } catch (e) { throw new Error('Vorschläge erfüllen die Bedingung nicht: ' + label + '\n' + (await cardsText(page)).join('\n---\n').slice(0, 600)); }
}
async function shot(page, name) {
  if (!SHOTS) return;
  if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR);
  await page.screenshot({ path: path.join(SHOT_DIR, name + '.png'), fullPage: true });
}
function pngGreenSquare(page) {
  return page.evaluate(function () {
    var c = document.createElement('canvas'); c.width = c.height = 160;
    var g = c.getContext('2d'); g.fillStyle = '#f4f4f2'; g.fillRect(0, 0, 160, 160);
    g.fillStyle = '#2f7a4d'; g.fillRect(36, 30, 88, 100);
    return c.toDataURL('image/png').split(',')[1];
  }).then(function (b64) { return { name: 'pulli.png', mimeType: 'image/png', buffer: Buffer.from(b64, 'base64') }; });
}

async function fullFlow(browser, url, opt) {
  var tag = opt.w + '-' + opt.scheme;
  var page = await newPage(browser, url, opt);
  await step(tag + ': App startet, drei Vorschläge mit Beispielschrank', async function () {
    await page.waitForSelector('#today-results .outfit', { timeout: 8000 });
    ok((await page.$$('#today-results .outfit')).length === 3, 'drei Outfit-Karten erwartet');
    ok(/Auf diesem Gerät/.test(await page.textContent('#sync')), 'Statusanzeige');
    ok(await page.isVisible('#p-today .banner'), 'Banner Beispielschrank');
    await noHScroll(page, 'Heute');
  });
  await shot(page, tag + '-heute');

  await step(tag + ': alle vier Tabs wechseln (Maus und Pfeiltasten)', async function () {
    for (var id of ['closet', 'scan', 'more', 'today']) {
      await page.click('#t-' + id);
      ok(await page.isVisible('#p-' + id), 'Panel ' + id + ' sichtbar');
      ok((await page.getAttribute('#t-' + id, 'aria-selected')) === 'true', 'aria-selected ' + id);
      var hidden = await page.$$eval('main .panel', function (ps) { return ps.filter(function (p) { return !p.hidden; }).length; });
      ok(hidden === 1, 'genau ein Panel sichtbar');
      await noHScroll(page, id);
    }
    await page.focus('#t-today'); await page.keyboard.press('ArrowRight');
    ok((await page.getAttribute('#t-closet', 'aria-selected')) === 'true', 'Pfeil rechts wechselt zu Schrank');
    await page.click('#t-today');
  });

  await step(tag + ': Black Tie bei 5 °C mit Regen', async function () {
    await page.click('.tape button:nth-child(7)');
    await page.fill('#today-temp', '5');
    await page.click('#p-today [aria-label="Wetterlage"] [data-v="rain"]');
    await waitCards(page, function () {
      var c = document.querySelector('#today-results .outfit');
      return c && /Smoking/.test(c.innerText) && /Fliege/.test(c.innerText) && /wetterfest/.test(c.innerText) && document.getElementById('today-temp-out').textContent.indexOf('5') === 0;
    }, 'Smoking, Fliege, Regenhinweis');
    var t = await cardsText(page);
    ok(t.every(function (x) { return !/Gürtel/.test(x); }), 'kein Gürtel zum Smoking');
  });

  await step(tag + ': Joggen bei 28 °C setzt Stufe Sportlich', async function () {
    await page.selectOption('#today-activity', 'joggen');
    await page.fill('#today-temp', '28');
    await page.click('#p-today [aria-label="Wetterlage"] [data-v="rain"]');
    ok((await page.getAttribute('.tape button:nth-child(1)', 'aria-pressed')) === 'true', 'Stufe 0 gewählt');
    await waitCards(page, function () {
      var c = document.querySelector('#today-results .outfit');
      return c && /Laufshirt/.test(c.innerText) && /Laufhose/.test(c.innerText) && /Laufschuhe/.test(c.innerText);
    }, 'Laufshirt, Laufhose, Laufschuhe');
  });

  await step(tag + ': Tennis mit Sakko als Wunschteil warnt', async function () {
    await page.selectOption('#today-activity', 'tennis');
    await page.fill('#today-temp', '18');
    await page.click('#p-today button:has-text("Wunschteil wählen")');
    await page.click('.sheet .pick:has-text("Navy Sakko")');
    ok((await page.getAttribute('.sheet .pick:has-text("Navy Sakko")', 'aria-pressed')) === 'true', 'Auswahl markiert');
    await page.click('.sheet .foot .btn');
    ok(!(await page.$('.sheet')), 'Sheet geschlossen');
    ok(/Navy Sakko/.test(await page.textContent('#p-today .mustchip')), 'Wunsch-Chip');
    await waitCards(page, function () {
      var cs = document.querySelectorAll('#today-results .outfit');
      return cs.length && Array.prototype.every.call(cs, function (c) { return /Navy Sakko ist für Tennis unpraktisch/.test(c.innerText) && /Wunsch/.test(c.innerText); });
    }, 'Warnung Sakko beim Tennis');
  });

  await step(tag + ': Date mit Jogginghose (Art als Wunsch) warnt', async function () {
    await page.selectOption('#today-activity', 'alltag');
    await page.click('.tape button:nth-child(4)');
    await page.click('#p-today .mustchip button');
    ok(!(await page.$('#p-today .mustchip')), 'Wunsch entfernt');
    await page.click('#p-today button:has-text("Wunschteil wählen")');
    await page.click('.sheet .seg button:has-text("Art")');
    await page.click('.sheet [data-k="jogger"]');
    await page.click('.sheet button:has-text("Als Wunsch hinzufügen")');
    await waitCards(page, function () {
      var cs = document.querySelectorAll('#today-results .outfit');
      return cs.length && Array.prototype.every.call(cs, function (c) { return /Jogger Schwarz/.test(c.innerText) && /zu leger, bleibt aber wie gewünscht drin/.test(c.innerText); });
    }, 'Warnung Jogger beim Date');
    await page.click('#p-today .mustchip button');
  });

  await step(tag + ': Nochmal würfeln bringt andere Vorschläge', async function () {
    await page.click('.tape button:nth-child(3)');
    await page.fill('#today-temp', '12');
    await page.waitForTimeout(250);
    var before = await cardsText(page);
    await page.click('#btn-reroll');
    var after = await cardsText(page);
    ok(after.length === 3, 'drei Karten');
    ok(after.every(function (x) { return before.indexOf(x) < 0; }), 'alle drei neu');
  });

  await step(tag + ': „Das trage ich“ erhöht wears und legt Tagebuch an', async function () {
    var names = await page.$$eval('#today-results .outfit:first-of-type .piece .pn', function (els) { return els.map(function (e) { return e.firstChild.textContent; }); });
    ok(!(await store(page)), 'vorher nichts gespeichert');
    await page.click('#today-results .outfit:first-of-type .o-actions .btn:first-child');
    var s = await store(page);
    ok(s && s.items.length === 44, 'Beispielschrank übernommen');
    names.forEach(function (n) {
      var it = s.items.filter(function (x) { return x.name === n; })[0];
      ok(it && it.wears >= 1 && it.last, 'wears erhöht für ' + n);
    });
    ok(s.diary.length === 1 && s.diary[0].ids.length >= names.length, 'Tagebucheintrag');
    ok(/Eingetragen/.test(await page.textContent('#today-results .outfit:first-of-type .o-actions .btn:first-child')), 'Knopf zeigt Eingetragen');
    ok(!(await page.isVisible('#p-today .banner')), 'Banner weg');
    await page.click('#today-results .outfit:nth-of-type(2) .o-actions .btn:last-child');
    s = await store(page);
    ok(s.settings.saved && s.settings.saved.length === 1, 'Gemerkt gespeichert');
  });

  await step(tag + ': Teil anlegen, bearbeiten, suchen, löschen', async function () {
    await page.click('#t-closet');
    ok((await page.$$('#closet-grid .gcard')).length === 44, '44 Teile im Raster');
    await page.click('#btn-add');
    await page.fill('#ed-name', 'Grüner Pullover');
    await page.selectOption('#ed-type', 'pullover');
    await page.click('.sheet .sw[aria-label="Grün"]');
    await page.click('#ed-save');
    var s = await store(page);
    var it = s.items.filter(function (x) { return x.name === 'Grüner Pullover'; })[0];
    ok(it && it.type === 'pullover' && it.slot === 'mid' && it.color === 'gruen' && it.fmin === 1 && it.fmax === 4, 'neues Teil gespeichert');
    await shot(page, tag + '-schrank');
    await page.click('#closet-grid .gcard[aria-label^="Grüner Pullover"]');
    await page.fill('#ed-name', 'Grüner Lieblingspulli');
    await page.check('#ed-fav');
    await page.click('#ed-save');
    s = await store(page);
    it = s.items.filter(function (x) { return x.id === it.id; })[0];
    ok(it.name === 'Grüner Lieblingspulli' && it.fav === true, 'Änderung gespeichert');
    await page.fill('#closet-q', 'lieblingsp');
    ok((await page.$$('#closet-grid .gcard')).length === 1, 'Suche findet ein Teil');
    await page.fill('#closet-q', '');
    await page.click('#closet-grid .gcard[aria-label^="Grüner Lieblingspulli"]');
    if (SHOTS) await page.screenshot({ path: path.join(SHOT_DIR, tag + '-sheet.png') });
    await page.click('.sheet button:has-text("Teil löschen")');
    await page.click('.sheet button:has-text("Ja, löschen")');
    s = await store(page);
    ok(s.items.length === 44 && !s.items.some(function (x) { return x.id === it.id; }), 'gelöscht');
    await noHScroll(page, 'Schrank');
  });

  await step(tag + ': Scan mit Foto, Farbe, Einkaufs-Check, Kombinieren, In den Schrank', async function () {
    await page.click('#t-scan');
    await page.setInputFiles('#scan-pick', await pngGreenSquare(page));
    await page.waitForFunction(function () { var s = document.getElementById('scan-status'); return s && /Farbe erkannt/.test(s.textContent); }, null, { timeout: 5000 });
    ok((await page.getAttribute('#p-scan .sw[aria-label="Grün"]', 'aria-pressed')) === 'true', 'Grün erkannt');
    ok(await page.isDisabled('#scan-shop'), 'ohne Art gesperrt');
    await page.selectOption('#scan-type', 'pullover');
    await page.click('#scan-shop');
    var v = await page.textContent('#scan-out .verdict');
    ok(v && v.length > 10, 'Urteil vorhanden');
    await shot(page, tag + '-scan');
    await page.click('#scan-combine');
    ok((await page.$$('#scan-out .outfit')).length > 0, 'Kombinationen');
    ok(/Wunsch/.test(await page.textContent('#scan-out .outfit')), 'Scan-Teil markiert');
    await page.click('#scan-save');
    var s = await store(page);
    ok(s.items.length === 45 && s.items.some(function (x) { return x.type === 'pullover' && x.color === 'gruen' && /^data:image\/jpeg/.test(x.photo || ''); }), 'mit Foto gespeichert');
    await noHScroll(page, 'Scan');
  });

  await step(tag + ': Mehr: Lücken, Staples, Kapsel, Woche, Tagebuch', async function () {
    await page.click('#t-more');
    ok((await page.$$('#more-body .matrix .c')).length === 28, 'Matrix 7 × 4');
    await shot(page, tag + '-mehr-luecken');
    await page.click('#p-more .subnav [data-v="staples"]');
    ok((await page.$$('#more-body .prow.ranked')).length >= 5, 'Staples-Rangliste');
    await page.click('#p-more .subnav [data-v="pack"]');
    await page.fill('#cap-days', '10');
    await page.click('#p-more .seg button:has-text("Koffer")');
    await page.fill('#cap-temp', '24');
    await page.click('#cap-go');
    var rows = await page.$$eval('#cap-res .prow .pn', function (els) { return els.map(function (e) { return e.firstChild.textContent; }); });
    ok(rows.length >= 8, 'Kapsel liefert Teile');
    ok(rows.indexOf('Laufshirt') < 0, 'kein Laufshirt in der 10-Tage-Kapsel');
    await shot(page, tag + '-mehr-packen');
    await page.click('#p-more .subnav [data-v="week"]');
    await page.click('#pl-go');
    ok((await page.$$('#pl-res .day')).length === 5, 'fünf Tage geplant');
    var tops = await page.$$eval('#pl-res .day .mnames', function (els) { return els.map(function (e) { return e.textContent.split(' · ')[0]; }); });
    for (var i = 1; i < tops.length; i++) ok(tops[i] !== tops[i - 1], 'Oberteil nicht an zwei Tagen hintereinander');
    ok(!/null/.test(await page.textContent('#pl-res')), 'kein „null“ im Plan');
    await page.click('#p-more .subnav [data-v="diary"]');
    ok(/Outfits getragen/.test(await page.textContent('#more-body')), 'Tagebuch');
    ok((await page.$$('#more-body .mini')).length >= 2, 'Gemerkt und Getragen');
    await noHScroll(page, 'Mehr');
  });

  await step(tag + ': Export und Import', async function () {
    await page.click('#p-more .subnav [data-v="settings"]');
    await page.click('#set-export-go');
    var json = JSON.parse(await page.inputValue('#set-export'));
    ok(json.items.length === 45 && json.diary.length === 1, 'Export vollständig');
    var extra = { items: [{ id: 'imp1', name: 'Importierte Chino', type: 'chino', color: 'oliv' }, { id: 'bad', type: 'unbekannt' }] };
    await page.fill('#set-import', JSON.stringify(extra));
    await page.click('#set-import-go');
    var s = await store(page);
    ok(s.items.length === 46 && s.items.some(function (x) { return x.id === 'imp1' && x.slot === 'bottom'; }), 'Import ergänzt');
    await page.fill('#set-import', '{kaputt');
    await page.click('#set-import-go');
    ok(/kein gültiges JSON/.test(await page.textContent('#toast')), 'Fehlermeldung bei kaputtem JSON');
    await shot(page, tag + '-mehr-einstellungen');
  });

  await step(tag + ': Alle Daten löschen (zweistufig) und leerer Zustand', async function () {
    await page.click('#more-body button:has-text("Alle Daten löschen")');
    await page.click('#more-body button:has-text("Ja, alles löschen")');
    var s = await store(page);
    ok(s.items.length === 0 && s.diary.length === 0, 'gelöscht');
    await page.click('#t-today');
    ok(await page.isVisible('#p-today .banner'), 'Beispielschrank wieder sichtbar');
    await page.click('#p-today .banner button:has-text("Leer starten")');
    ok(/Dein Schrank ist noch leer/.test(await page.textContent('#today-results')), 'leerer Zustand');
  });

  await step(tag + ': keine Konsolenfehler', async function () {
    ok(page.errors.length === 0, page.errors.join(' | '));
  });
  await page.context().close();
}

async function aiFlow(browser, url, mode) {
  var init = function (mode) {
    window.__calls = [];
    var sample = function () { return Promise.reject({ code: 'not_granted', message: 'x' }); };
    sample.limits = function () { return Promise.resolve({ maxPromptBytes: 262144, images: { maxCount: 4, maxInputBytes: 2e7, mediaTypes: ['image/jpeg', 'image/png'] } }); };
    sample.json = function (prompt, opts) {
      window.__calls.push({ prompt: prompt, blob: !!(opts && opts.images && opts.images[0] instanceof Blob), tier: opts && opts.modelTier });
      if (mode === 'fail') return Promise.reject({ code: 'not_granted', message: 'nein' });
      return Promise.resolve({ type: 'pullover', color: 'gruen', pattern: 'streifen', name: 'Grüner Ringelpulli', extra: '<b>x</b>' });
    };
    window.claude = { use: function (n) { return Promise.resolve(n === 'sample' ? sample : null); } };
  };
  var page = await newPage(browser, url, { w: 400, h: 860, scheme: 'light', init: '(' + init.toString() + ')(' + JSON.stringify(mode) + ')' });
  await step('Scan mit Claude (' + (mode === 'fail' ? 'abgelehnt, still per Hand' : 'erkannt') + ')', async function () {
    await page.waitForSelector('#today-results .outfit');
    await page.click('#t-scan');
    await page.setInputFiles('#scan-pick', await pngGreenSquare(page));
    if (mode === 'fail') {
      await page.waitForFunction(function () { return window.__calls.length === 1; }, null, { timeout: 5000 });
      await page.waitForFunction(function () { var s = document.getElementById('scan-status'); return s && /Wähle die Art aus/.test(s.textContent) && !s.classList.contains('busy'); }, null, { timeout: 5000 });
      ok((await page.inputValue('#scan-type')) === '', 'Art bleibt leer');
    } else {
      await page.waitForFunction(function () { var s = document.getElementById('scan-status'); return s && /^Erkannt/.test(s.textContent); }, null, { timeout: 5000 });
      ok((await page.inputValue('#scan-type')) === 'pullover', 'Art übernommen');
      ok((await page.inputValue('#scan-name')) === 'Grüner Ringelpulli', 'Name übernommen');
      ok((await page.getAttribute('#p-scan .seg button:has-text("Streifen")', 'aria-pressed')) === 'true', 'Muster übernommen');
    }
    var c = await page.evaluate(function () { return window.__calls[0]; });
    ok(c && c.blob && c.tier === 'quick' && /sakko \(Sakko\)/.test(c.prompt) && /navy \(Navy\)/.test(c.prompt) && /streifen/.test(c.prompt), 'Aufruf mit Bild und erlaubten IDs');
    ok(page.errors.length === 0, page.errors.join(' | '));
  });
  await page.context().close();
}

async function dbFlow(browser, url) {
  var init = function () {
    var docs = {}, subs = [];
    window.__db = docs;
    function snap() { return { docs: Object.keys(docs).map(function (id) { return { id: id, data: function () { return JSON.parse(JSON.stringify(docs[id])); } }; }), metadata: { fromCache: false, hasPendingWrites: false } }; }
    function emit() { var s = snap(); subs.forEach(function (f) { setTimeout(function () { f(s); }, 0); }); }
    var col = {
      doc: function (id) { return { set: function (d) { docs[id] = JSON.parse(JSON.stringify(d)); emit(); return Promise.resolve(); }, delete: function () { delete docs[id]; emit(); return Promise.resolve(); } }; },
      onSnapshot: function (next) { subs.push(next); setTimeout(function () { next(snap()); }, 30); return function () {}; }
    };
    var db = { collection: function (p) { window.__dbPath = p; return col; } };
    var user = { id: function () { return Promise.resolve('u_test'); } };
    window.claude = { use: function (n) { return Promise.resolve(n === 'db' ? db : (n === 'user' ? user : null)); } };
  };
  var page = await newPage(browser, url, { w: 400, h: 860, scheme: 'dark', init: '(' + init.toString() + ')()' });
  await step('Konto-Speicher (db-Attrappe): laden, Teil speichern, tragen', async function () {
    await page.waitForFunction(function () { return /Im Konto gespeichert/.test(document.getElementById('sync').textContent); }, null, { timeout: 5000 });
    await page.waitForSelector('#today-results .outfit');
    ok((await page.evaluate(function () { return window.__dbPath; })) === 'data/users/u_test', 'privater Pfad');
    await page.click('#t-closet');
    await page.click('#btn-add');
    await page.fill('#ed-name', 'Konto-Shirt');
    await page.click('#ed-save');
    await page.waitForTimeout(100);
    var docs = await page.evaluate(function () { return window.__db; });
    var ids = Object.keys(docs);
    ok(ids.filter(function (k) { return /^g_/.test(k); }).length === 1 && docs[ids.filter(function (k) { return /^g_/.test(k); })[0]].name === 'Konto-Shirt', 'Teil im Konto');
    ok((await page.$$('#closet-grid .gcard')).length === 1, 'Raster zeigt nur das eigene Teil');
    await page.click('#t-today');
    ok(/fehlen noch/.test(await page.textContent('#today-results')), 'meldet fehlende Teile');
    ok(page.errors.length === 0, page.errors.join(' | '));
  });
  await page.context().close();
}

(async function main() {
  if (!fs.existsSync(path.join(ROOT, 'index.html'))) { console.error('index.html fehlt, zuerst „node build.js“ ausführen.'); process.exit(2); }
  var srv = await server();
  var url = 'http://127.0.0.1:' + srv.address().port + '/index.html';
  var browser = await chromium.launch();
  try {
    for (var opt of [{ w: 400, h: 860, scheme: 'light' }, { w: 400, h: 860, scheme: 'dark' }, { w: 1000, h: 900, scheme: 'light' }, { w: 1000, h: 900, scheme: 'dark' }]) {
      await fullFlow(browser, url, opt);
    }
    await aiFlow(browser, url, 'ok');
    await aiFlow(browser, url, 'fail');
    await dbFlow(browser, url);
  } finally {
    await browser.close(); srv.close();
  }
  var bad = results.filter(function (r) { return !r.ok; });
  console.log('\n' + (results.length - bad.length) + ' bestanden, ' + bad.length + ' fehlgeschlagen' + (SHOTS ? ' · Screenshots in shots/' : ''));
  process.exit(bad.length ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });

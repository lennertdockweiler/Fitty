#!/usr/bin/env node
/*
 * Smoke-Test der Oberfläche mit Playwright und Chromium.
 *   node build.js && node tests/ui-smoke.js            Screenshots landen in shots/
 *   SHOTS=0 node tests/ui-smoke.js                       ohne Screenshots
 * Prüft bei 400 px und 1000 px, hell und dunkel: Start, Tabs, Vorschläge mit Zeichnung, Live-Wetter (feste Testantwort),
 * Dresscode und Aktivitäten, Wunschteile mit Suche, Bewerten, „Das trage ich“, Teil anlegen/bearbeiten/löschen, Scan mit Foto,
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
  if (opt.net) await opt.net(ctx);
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

var WX_FIXTURE = { daily: { time: ['2026-11-04', '2026-11-05'], temperature_2m_max: [7.4, 11.2], temperature_2m_min: [3.9, 4.2], weather_code: [61, 2],
  precipitation_probability_max: [80, 10], snowfall_sum: [0, 0], wind_speed_10m_max: [31, 6] } };
var GEO_FIXTURE = { results: [{ name: 'Freiburg im Breisgau', latitude: 47.995, longitude: 7.85, admin1: 'Baden-Württemberg', country: 'Deutschland' }] };
var PNG_1PX = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
var IMG_URLS = [];
async function stubNet(ctx) {
  await ctx.route('https://image.pollinations.ai/**', function (r) { IMG_URLS.push(r.request().url()); return r.fulfill({ status: 200, contentType: 'image/png', body: PNG_1PX }); });
  await ctx.route('https://api.open-meteo.com/**', function (r) { return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(WX_FIXTURE) }); });
  await ctx.route('https://geocoding-api.open-meteo.com/**', function (r) { return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(GEO_FIXTURE) }); });
}

async function fullFlow(browser, url, opt) {
  var tag = opt.w + '-' + opt.scheme;
  opt.net = stubNet;
  var page = await newPage(browser, url, opt);
  await step(tag + ': App startet, drei Vorschläge mit Zeichnung, Live-Wetter geladen', async function () {
    await page.waitForSelector('#today-results .outfit', { timeout: 8000 });
    ok((await page.$$('#today-results .outfit')).length === 3, 'drei Outfit-Karten erwartet');
    ok((await page.$$('#today-results .outfit .o-fig svg')).length === 3, 'jede Karte hat eine Zeichnung');
    ok((await page.$$('#today-results .piece .art-wrap svg')).length >= 9, 'Teile mit Zeichnung');
    ok(/Auf diesem Gerät/.test(await page.textContent('#sync')), 'Statusanzeige');
    ok(await page.isVisible('#p-today .banner'), 'Banner Beispielschrank');
    await page.waitForFunction(function () { return /Konstanz/.test(document.querySelector('.wxline').textContent) && /Heute 7/.test(document.querySelector('.wxline').textContent); }, null, { timeout: 4000 });
    ok((await page.textContent('#today-temp-out')).indexOf('7') === 0, 'Temperatur aus dem Live-Wetter');
    ok((await page.getAttribute('.cond[data-v="regen"]', 'aria-pressed')) === 'true', 'Regen aus dem Live-Wetter');
    ok((await page.getAttribute('#today-wind', 'aria-pressed')) === 'true', 'Wind aus dem Live-Wetter');
    ok((await page.$$('.tape button')).length === 5, 'fünf Dresscode-Stufen');
    await page.waitForSelector('#today-results .outfit:first-of-type .ph-frame[data-state="done"] img', { timeout: 6000 });
    var u = decodeURIComponent(IMG_URLS[IMG_URLS.length - 1] || '');
    ok(/Full-body fashion photo of a person/.test(u) && /seed=\d+/.test(u), 'KI-Bild mit Outfit-Beschreibung angefragt: ' + u.slice(0, 120));
    var pin = await page.getAttribute('#today-results .outfit:first-of-type .ph-links a:first-child', 'href');
    ok(/^https:\/\/www\.pinterest\.de\/search\/pins\/\?q=.+Outfit/.test(pin), 'Pinterest-Link: ' + pin);
    ok((await page.getAttribute('#today-results .outfit:first-of-type .ph-links a:first-child', 'target')) === '_blank', 'Link öffnet neuen Tab');
    var labels = await page.$$eval('.tape .l', function (els) { return els.map(function (e) { return e.textContent; }); });
    ok(labels.join('|') === 'Entspannt|Casual|Smart Casual|Business Casual|Business Formal', 'Stufen: ' + labels.join('|'));
    var acts = await page.$$eval('#today-activity option', function (els) { return els.map(function (e) { return e.value; }); });
    ok(acts.indexOf('tennis') < 0 && acts.indexOf('joggen') < 0 && acts.indexOf('hochzeit') >= 0, 'Aktivitäten ohne Sport');
    await noHScroll(page, 'Heute');
  });
  await shot(page, tag + '-heute');

  await step(tag + ': alle vier Tabs wechseln (Maus und Pfeiltasten)', async function () {
    for (var id of ['closet', 'scan', 'more', 'today']) {
      await page.click('#t-' + id);
      ok(await page.isVisible('#p-' + id), 'Panel ' + id + ' sichtbar');
      ok((await page.getAttribute('#t-' + id, 'aria-selected')) === 'true', 'aria-selected ' + id);
      var vis = await page.$$eval('main .panel', function (ps) { return ps.filter(function (p) { return !p.hidden; }).length; });
      ok(vis === 1, 'genau ein Panel sichtbar');
      await noHScroll(page, id);
    }
    await page.focus('#t-today'); await page.keyboard.press('ArrowRight');
    ok((await page.getAttribute('#t-closet', 'aria-selected')) === 'true', 'Pfeil rechts wechselt zu Schrank');
    await page.click('#t-today');
  });

  await step(tag + ': Wetter von Hand: Morgen, Plus/Minus, Wetterlage, Wind', async function () {
    await page.click('.day-seg button:has-text("Morgen")');
    await page.waitForFunction(function () { return document.getElementById('today-temp-out').textContent.indexOf('11') === 0; }, null, { timeout: 3000 });
    ok((await page.getAttribute('.cond[data-v="wolken"]', 'aria-pressed')) === 'true', 'morgen bewölkt');
    await page.click('.day-seg button:has-text("Heute")');
    await page.click('button[aria-label="Ein Grad wärmer"]');
    await page.click('button[aria-label="Ein Grad wärmer"]');
    ok((await page.textContent('#today-temp-out')).indexOf('9') === 0, 'zwei Grad wärmer');
    ok(/eigene Angabe/.test(await page.textContent('.wxline')), 'eigene Angabe markiert');
    await page.click('.cond[data-v="sonne"]');
    await page.click('#today-wind');
    ok((await page.getAttribute('.cond[data-v="sonne"]', 'aria-pressed')) === 'true' && (await page.getAttribute('.cond[data-v="regen"]', 'aria-pressed')) === 'false', 'eine Wetterlage');
    await page.click('#wx-reload');
    await page.waitForFunction(function () { return document.getElementById('today-temp-out').textContent.indexOf('7') === 0; }, null, { timeout: 3000 });
  });

  await step(tag + ': Business Formal bei 5 °C mit Regen', async function () {
    await page.click('.tape button[data-l="5"]');
    await page.fill('#today-temp', '5');
    await page.click('.cond[data-v="regen"]');
    await waitCards(page, function () {
      var cs = document.querySelectorAll('#today-results .outfit');
      return cs.length === 3 && Array.prototype.every.call(cs, function (c) { return /Sakko/.test(c.innerText) && /Krawatte/.test(c.innerText) && /wetterfest/.test(c.innerText); }) &&
        document.getElementById('today-temp-out').textContent.indexOf('5') === 0;
    }, 'Sakko, Krawatte, Regenhinweis');
  });

  await step(tag + ': Business Casual ohne Krawatte, mit Hemd', async function () {
    await page.click('.tape button[data-l="4"]');
    await waitCards(page, function () {
      var cs = document.querySelectorAll('#today-results .outfit');
      return cs.length && document.querySelector('.tape button[data-l="4"]').getAttribute('aria-pressed') === 'true' &&
        Array.prototype.every.call(cs, function (c) { return !/Krawatte/.test(c.innerText) && /Hemd/.test(c.innerText); });
    }, 'keine Krawatte bei Business Casual');
  });

  await step(tag + ': Aktivität „Hochzeit“ hebt Casual auf Business Casual', async function () {
    await page.click('.tape button[data-l="2"]');
    await page.selectOption('#today-activity', 'hochzeit');
    ok((await page.getAttribute('.tape button[data-l="4"]', 'aria-pressed')) === 'true', 'Stufe 4 gewählt');
    ok(/Üblich: Business Casual bis Business Formal/.test(await page.textContent('#p-today')), 'Hinweis auf üblichen Dresscode');
    await page.selectOption('#today-activity', 'alltag');
  });

  await step(tag + ': Wunschteil über die Suche, Ersatz im selben Bereich', async function () {
    await page.click('#btn-must');
    await page.fill('#must-q', 'sakko navy');
    var n = (await page.$$('.sheet .pick')).length;
    ok(n === 1, 'Suche findet genau das Navy Sakko, gefunden: ' + n);
    await page.click('.sheet .pick:has-text("Navy Sakko")');
    await page.fill('#must-q', 'blau');
    ok((await page.$$('.sheet .pick')).length >= 5, 'Farbsuche „blau“ findet Navy, Indigo, Hellblau …');
    await page.click('.sheet .foot .btn');
    ok(/Navy Sakko/.test(await page.textContent('#p-today .mustchip')), 'Wunsch-Chip');
    await waitCards(page, function () {
      var cs = document.querySelectorAll('#today-results .outfit');
      return cs.length && Array.prototype.every.call(cs, function (c) { return /Navy Sakko/.test(c.innerText) && /wunsch/i.test(c.innerText); });
    }, 'Navy Sakko als Wunsch in allen Vorschlägen');
    await page.click('#p-today .mustchip button');
  });

  await step(tag + ': Date mit Jogginghose (Art als Wunsch) warnt', async function () {
    await page.click('.tape button[data-l="3"]');
    await page.click('#btn-must');
    await page.click('.sheet .seg button:has-text("Art")');
    await page.fill('#must-q', 'jogging');
    await page.click('.sheet [data-k="jogger"]');
    await page.click('.sheet button:has-text("Als Wunsch hinzufügen")');
    await waitCards(page, function () {
      var cs = document.querySelectorAll('#today-results .outfit');
      return cs.length && Array.prototype.every.call(cs, function (c) { return /Jogger Schwarz/.test(c.innerText) && /zu leger, bleibt aber wie gewünscht drin/.test(c.innerText); });
    }, 'Warnung Jogger beim Date');
    await page.click('#p-today .mustchip button');
  });

  await step(tag + ': Unterwegs & Stil aufklappen, Nochmal würfeln', async function () {
    await page.click('.tape button[data-l="2"]');
    await page.click('#today-more > summary');
    await page.click('#today-more .seg button:has-text("Fahrrad")');
    ok(/Fahrrad/.test(await page.textContent('#today-more > summary')), 'Zusammenfassung zeigt Fahrrad');
    await page.click('#today-more > summary');
    await page.waitForTimeout(250);
    var before = await cardsText(page);
    await page.click('#btn-reroll');
    var after = await cardsText(page);
    ok(after.length === 3, 'drei Karten');
    ok(after.every(function (x) { return before.indexOf(x) < 0; }), 'alle drei neu');
  });

  await step(tag + ': Bewerten, „Das trage ich“, Merken', async function () {
    ok(!(await store(page)), 'vorher nichts gespeichert');
    await page.click('#today-results .outfit:nth-of-type(1) button[aria-label="Gefällt mir"]');
    await page.click('#today-results .outfit:nth-of-type(2) button[aria-label="Nicht mein Stil"]');
    var s = await store(page);
    ok(s && s.feedback.length === 2 && s.feedback.some(function (f) { return f.v === 1; }) && s.feedback.some(function (f) { return f.v === -1; }), 'zwei Bewertungen gespeichert');
    ok(s.items.length === 0, 'Bewerten übernimmt den Beispielschrank nicht');
    ok((await page.getAttribute('#today-results .outfit:nth-of-type(1) button[aria-label="Gefällt mir"]', 'aria-pressed')) === 'true', 'Daumen markiert');
    var names = await page.$$eval('#today-results .outfit:first-of-type .piece .pn', function (els) { return els.map(function (e) { return e.firstChild.textContent; }); });
    await page.click('#today-results .outfit:first-of-type .o-actions > .btn:nth-child(1)');
    s = await store(page);
    ok(s && s.items.length === 46, 'Beispielschrank übernommen');
    names.forEach(function (n) {
      var it = s.items.filter(function (x) { return x.name === n; })[0];
      ok(it && it.wears >= 1 && it.last, 'wears erhöht für ' + n);
    });
    ok(s.diary.length === 1 && s.diary[0].ids.length >= names.length, 'Tagebucheintrag');
    ok(/Eingetragen/.test(await page.textContent('#today-results .outfit:first-of-type .o-actions > .btn:nth-child(1)')), 'Knopf zeigt Eingetragen');
    ok(!(await page.isVisible('#p-today .banner')), 'Banner weg');
    await page.click('#today-results .outfit:nth-of-type(3) .o-actions > .btn:nth-child(2)');
    s = await store(page);
    ok(s.settings.saved && s.settings.saved.length === 1, 'Gemerkt gespeichert');
    await page.click('#today-results .outfit:first-of-type .o-why summary');
    ok(/Farben:/.test(await page.textContent('#today-results .outfit:first-of-type .o-why')), 'Begründung aufklappbar');
  });

  await step(tag + ': Teil anlegen, bearbeiten, suchen, löschen', async function () {
    await page.click('#t-closet');
    ok((await page.$$('#closet-grid .gcard')).length === 46, '46 Teile im Raster');
    ok((await page.$$('#closet-grid .art-wrap svg')).length === 46, 'jedes Teil gezeichnet');
    await page.click('#btn-add');
    var lv = await page.$$eval('#ed-fmin option', function (els) { return els.map(function (e) { return e.value; }).join(''); });
    ok(lv === '12345', 'Dresscode-Auswahl 1 bis 5');
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
    ok((await page.$$('#closet-grid .gcard')).length === 1, 'Suche nach Name');
    await page.fill('#closet-q', 'blau hemd');
    var hits = await page.$$eval('#closet-grid .gcard', function (els) { return els.map(function (e) { return e.getAttribute('aria-label'); }); });
    ok(hits.length >= 2 && hits.every(function (x) { return /Hemd/.test(x); }), 'Suche „blau hemd“: ' + hits.join(' / '));
    await page.fill('#closet-q', '');
    await page.click('#closet-grid .gcard[aria-label^="Grüner Lieblingspulli"]');
    if (SHOTS) await page.screenshot({ path: path.join(SHOT_DIR, tag + '-sheet.png') });
    await page.click('.sheet button:has-text("Teil löschen")');
    await page.click('.sheet button:has-text("Ja, löschen")');
    s = await store(page);
    ok(s.items.length === 46 && !s.items.some(function (x) { return x.id === it.id; }), 'gelöscht');
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
    var lvls = await page.$$eval('#scan-out .bars .br > span:first-child', function (els) { return els.map(function (e) { return e.textContent; }); });
    ok(lvls.indexOf('Sportlich') < 0 && lvls.indexOf('Black Tie') < 0, 'nur angebotene Stufen: ' + lvls.join(', '));
    await shot(page, tag + '-scan');
    await page.click('#scan-combine');
    ok((await page.$$('#scan-out .outfit .o-fig svg')).length > 0, 'Kombinationen mit Zeichnung');
    ok(/Wunsch/.test(await page.textContent('#scan-out .outfit')), 'Scan-Teil markiert');
    await page.click('#scan-save');
    var s = await store(page);
    ok(s.items.length === 47 && s.items.some(function (x) { return x.type === 'pullover' && x.color === 'gruen' && /^data:image\/jpeg/.test(x.photo || ''); }), 'mit Foto gespeichert');
    await noHScroll(page, 'Scan');
  });

  await step(tag + ': Mehrere Teile per Text hinzufügen', async function () {
    await page.click('#t-closet');
    await page.click('#btn-addtxt');
    await page.fill('#txt-in', 'Navy Sakko, 2 weiße T-Shirts\ndunkle Jeans, Fantasieteil');
    await page.waitForFunction(function () { return document.querySelectorAll('#txt-rows .txt-row').length === 4; }, null, { timeout: 3000 });
    ok((await page.$$('#txt-rows .txt-row.bad')).length === 1, 'unbekannter Eintrag markiert');
    ok((await page.inputValue('#txt-type-1')) === 'tshirt' && (await page.inputValue('#txt-color-1')) === 'weiss', 'T-Shirts weiß erkannt');
    ok((await page.inputValue('#txt-color-2')) === 'indigo', 'dunkle Jeans = Indigo');
    ok(/4 Teile hinzufügen/.test(await page.textContent('#txt-add')), 'Knopf zählt 4 Teile');
    await page.selectOption('#txt-type-3', 'cap');
    ok(/5 Teile hinzufügen/.test(await page.textContent('#txt-add')), 'nach Korrektur 5 Teile');
    await page.click('#txt-add');
    var s = await store(page);
    ok(s.items.length === 52 && s.items.filter(function (x) { return x.type === 'tshirt' && x.color === 'weiss' && x.name === 'T-Shirt Weiß'; }).length === 2, 'Teile aus dem Text im Schrank: ' + s.items.length);
    ok(s.items.some(function (x) { return x.name === 'Navy Sakko' && x.type === 'sakko' && x.id !== 'demo13'; }), 'Navy Sakko angelegt');
    await noHScroll(page, 'Text-Import');
  });

  await step(tag + ': Mehr: Lücken, Staples, Kapsel, Woche, Tagebuch', async function () {
    await page.click('#t-more');
    ok((await page.$$('#more-body .matrix .c')).length === 20, 'Matrix 5 × 4');
    await shot(page, tag + '-mehr-luecken');
    await page.click('#p-more .subnav [data-v="staples"]');
    ok((await page.$$('#more-body .prow.ranked')).length >= 5, 'Staples-Rangliste');
    await page.click('#p-more .subnav [data-v="pack"]');
    ok((await page.$$('#more-body .chips button')).length >= 5, 'Stufen-Chips');
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

  await step(tag + ': Einstellungen: Wetter-Ort, Vorlieben, Export und Import', async function () {
    await page.click('#p-more .subnav [data-v="settings"]');
    ok(/1\s*gefällt mir/.test(await page.textContent('#more-body')), 'Vorlieben gezählt');
    await page.fill('#set-place', 'Freiburg');
    await page.click('#set-place-go');
    await page.click('#set-place-hits .pick:has-text("Freiburg")');
    var s = await store(page);
    ok(s.settings.wxPlace && s.settings.wxPlace.name === 'Freiburg im Breisgau', 'Ort gespeichert');
    await page.click('#set-export-go');
    var json = JSON.parse(await page.inputValue('#set-export'));
    ok(json.items.length === 52 && json.diary.length === 1 && json.feedback.length === 2, 'Export vollständig');
    var extra = { items: [{ id: 'imp1', name: 'Importierte Chino', type: 'chino', color: 'oliv' }, { id: 'bad', type: 'unbekannt' }] };
    await page.fill('#set-import', JSON.stringify(extra));
    await page.click('#set-import-go');
    s = await store(page);
    ok(s.items.length === 53 && s.items.some(function (x) { return x.id === 'imp1' && x.slot === 'bottom'; }), 'Import ergänzt');
    await page.fill('#set-import', '{kaputt');
    await page.click('#set-import-go');
    ok(/kein gültiges JSON/.test(await page.textContent('#toast')), 'Fehlermeldung bei kaputtem JSON');
    await shot(page, tag + '-mehr-einstellungen');
    await page.click('#more-body [aria-label="Personen auf Bildern"] button:has-text("Herren")');
    await page.click('#more-body [aria-label="KI-Bilder"] button:has-text("Aus")');
    await page.click('#t-today');
    await page.waitForSelector('#today-results .outfit .o-photo.nofr');
    ok(!(await page.$('#today-results .ph-frame')), 'KI-Bilder aus');
    ok(/Herren/.test(decodeURIComponent(await page.getAttribute('#today-results .outfit:first-of-type .ph-links a:first-child', 'href'))), 'Suche mit Herren');
    await page.click('#t-more');
  });

  await step(tag + ': Alle Daten löschen (zweistufig) und leerer Zustand', async function () {
    await page.click('#more-body button:has-text("Alle Daten löschen")');
    await page.click('#more-body button:has-text("Ja, alles löschen")');
    var s = await store(page);
    ok(s.items.length === 0 && s.diary.length === 0 && s.feedback.length === 0, 'gelöscht');
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
    ok(!(await page.$('#today-results .ph-frame')) && (await page.$$('#today-results .o-photo.nofr .ph-links a')).length === 6, 'im Artifact nur Links, keine KI-Bilder');
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

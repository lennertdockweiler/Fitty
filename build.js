#!/usr/bin/env node
/*
 * Ankleide: Build ohne Abhängigkeiten.
 *   node build.js            schreibt index.html (eigenständige Fassung, z. B. für GitHub Pages)
 *                            und dist/artifact.html (gleicher Inhalt ohne Dokumentgerüst, für claude.ai)
 * Reihenfolge der Skripte ist wichtig: data.js zuerst, dann Engine, dann Oberfläche, zuletzt der Start.
 * Das zusammengesetzte Skript wird mit `node --check` geprüft (liegt danach in dist/app.js).
 */
'use strict';
var fs = require('fs');
var path = require('path');
var cp = require('child_process');

var ROOT = __dirname;
var DIST = path.join(ROOT, 'dist');
var FONTS = 'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,500..900&family=DM+Mono:wght@400;500&family=Instrument+Sans:wght@400..700&display=swap';
var CSS = ['styles.css', 'ui.css'];
var JS = ['data.js', 'engine.js', 'engine2.js', 'engine3.js', 'ui1.js', 'art.js', 'ui2.js', 'ui3.js', 'ui4.js', 'ui5.js'];
var DESCRIPTION = 'Ankleide schlägt dir Outfits aus deinem eigenen Schrank vor, passend zu Dresscode, Wetter, Weg und Aktivität.';
var BOOT = [
  '/* ---- Start ---- */',
  'initApp();',
  'Promise.resolve().then(function () { return Store.init(); }).catch(function (e) {',
  '  try { console.warn("Ankleide: Speicher nicht verfügbar", e); } catch (x) {}',
  '  S.mode = "local"; S.ready = true; onData();',
  '});'
].join('\n');
var ICON = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#E3B23A"/>' +
  '<path d="M16 10.5a2.6 2.6 0 1 0-2.6-2.6M16 10.5v2.4l9.2 6.6a1.5 1.5 0 0 1-.9 2.7H7.7a1.5 1.5 0 0 1-.9-2.7L16 12.9" fill="none" stroke="#131E2B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>');

function read(f) {
  var p = path.join(ROOT, f);
  if (!fs.existsSync(p)) throw new Error('Datei fehlt: ' + f);
  return fs.readFileSync(p, 'utf8');
}

var css = CSS.map(function (f) { return '/* ---- ' + f + ' ---- */\n' + read(f).trim(); }).join('\n\n');
var body = read('body.html').trim();
var js = JS.map(function (f) { return '/* ---- ' + f + ' ---- */\n' + read(f).trim(); }).join('\n;\n') + '\n;\n' + BOOT + '\n';

// Ein "</script" oder "</style" im Inhalt würde den Block vorzeitig beenden
if (/<\/script/i.test(js)) throw new Error('Skript enthält "</script", bitte maskieren.');
if (/<\/style/i.test(css)) throw new Error('CSS enthält "</style".');

if (!fs.existsSync(DIST)) fs.mkdirSync(DIST);
var appJs = path.join(DIST, 'app.js');
fs.writeFileSync(appJs, js);
try {
  cp.execFileSync(process.execPath, ['--check', appJs], { stdio: 'inherit' });
} catch (e) {
  console.error('node --check ist fehlgeschlagen: ' + appJs);
  process.exit(1);
}

var head = [
  '<title>Ankleide</title>',
  '<meta name="description" content="' + DESCRIPTION + '">',
  '<link rel="preconnect" href="https://fonts.googleapis.com">',
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
  '<link rel="stylesheet" href="' + FONTS + '">',
  '<style>\n' + css + '\n</style>'
].join('\n');
var script = '<script>\n' + js + '</script>';

var standalone = [
  '<!doctype html>',
  '<html lang="de">',
  '<head>',
  '<meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">',
  '<meta name="theme-color" content="#E9EDF1" media="(prefers-color-scheme: light)">',
  '<meta name="theme-color" content="#0D1620" media="(prefers-color-scheme: dark)">',
  '<link rel="icon" href="' + ICON + '">',
  head,
  '</head>',
  '<body>',
  body,
  script,
  '</body>',
  '</html>',
  ''
].join('\n');

// Artifact-Fassung: claude.ai legt Doctype, head und body selbst an
var artifact = [
  '<title>Ankleide</title>',
  '<meta name="claude:viewport-fit-sides" content="cover">',
  '<link rel="stylesheet" href="' + FONTS + '">',
  '<style>\n' + css + '\n</style>',
  body,
  script,
  ''
].join('\n');

fs.writeFileSync(path.join(ROOT, 'index.html'), standalone);
fs.writeFileSync(path.join(DIST, 'artifact.html'), artifact);
function kb(s) { return (Buffer.byteLength(s) / 1024).toFixed(1) + ' KB'; }
console.log('index.html        ' + kb(standalone));
console.log('dist/artifact.html ' + kb(artifact));
console.log('Skript geprüft (node --check), ' + JS.length + ' Dateien.');

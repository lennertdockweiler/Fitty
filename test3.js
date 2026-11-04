/* Szenario-Tests mit Prüfungen (node test3.js). test.js und test2.js geben nur aus, hier wird geprüft. */
var assert = require('assert');
var AK = require('./data.js'); global.AK = AK;
require('./engine.js'); require('./engine2.js'); require('./engine3.js');

var W = AK.DEMO.map(function (x) { return AK.normalize(Object.assign({}, x)); });
var today = '2026-11-04';
var MAIN = ['top', 'mid', 'outer', 'bottom', 'shoes'];
var failed = 0, passed = 0;

function run(name, fn) {
  try { fn(); passed++; console.log('ok   ' + name); }
  catch (e) { failed++; console.log('FAIL ' + name + '\n     ' + e.message); }
}
function suggest(ctx, opts) {
  ctx.today = today; ctx.seed = ctx.seed || 1; ctx.factors = ctx.factors || []; ctx.must = ctx.must || [];
  return AK.suggest(W, ctx, opts || {});
}
function mains(o) { return MAIN.map(function (k) { return o.items[k]; }).filter(Boolean); }
function allWarns(o) { return o.warns.join(' | '); }
function sportOnly(x) { return (x.a || 0) >= 2 && x.fmax <= 1; }
function capItems(cap) { return Object.keys(cap.pieces).reduce(function (a, k) { return a.concat(cap.pieces[k]); }, []); }

run('Black Tie bei 5 °C mit Regen: Smoking, Hemd, Fliege, kein Gürtel, Regenhinweis', function () {
  var r = suggest({ level: 6, weather: { temp: 5, rain: true, snow: false, wind: false, sun: false }, transport: 'oepnv', season: 'herbst' });
  assert.strictEqual(r.outfits.length, 3);
  var o = r.outfits[0];
  assert.strictEqual(o.items.mid.type, 'smoking');
  assert.strictEqual(o.items.top.type, 'hemd');
  assert.ok(o.items.outer, 'Mantel erwartet');
  assert.ok(o.items.acc.some(function (a) { return a.type === 'fliege'; }), 'Fliege erwartet');
  r.outfits.forEach(function (x) {
    assert.ok(!x.items.acc.some(function (a) { return a.type === 'guertel'; }), 'kein Gürtel zum Smoking');
    assert.ok(/wetterfest/.test(allWarns(x)), 'Hinweis auf fehlenden Regenschutz erwartet');
  });
});

run('Joggen bei 28 °C: nur Sportteile, keine Jacke, keine Mittelschicht im Top-Vorschlag', function () {
  var r = suggest({ level: 0, weather: { temp: 28, rain: false, snow: false, wind: false, sun: true }, transport: 'fuss', activity: 'joggen', season: 'sommer' });
  var o = r.outfits[0];
  assert.ok(!o.items.outer && !o.items.mid, 'bei 28 °C keine Zusatzschicht');
  ['top', 'bottom', 'shoes'].forEach(function (k) { assert.ok(o.items[k].a >= 2, k + ' sollte sporttauglich sein: ' + o.items[k].name); });
  assert.strictEqual(o.warns.length, 0, allWarns(o));
});

run('Tennis mit erzwungenem Sakko: jedes Outfit warnt', function () {
  var r = suggest({ level: 0, weather: { temp: 18, sun: true }, transport: 'auto', activity: 'tennis', must: [{ kind: 'type', type: 'sakko' }] });
  assert.ok(r.outfits.length > 0);
  r.outfits.forEach(function (o) {
    assert.strictEqual(o.items.mid.type, 'sakko');
    assert.ok(/Sakko ist für Tennis unpraktisch/.test(allWarns(o)), allWarns(o));
  });
});

run('Date (Smart Casual) mit Jogginghose: jedes Outfit warnt', function () {
  var r = suggest({ level: 3, weather: { temp: 14 }, transport: 'oepnv', must: [{ kind: 'type', type: 'jogger' }] });
  r.outfits.forEach(function (o) {
    assert.strictEqual(o.items.bottom.type, 'jogger');
    assert.ok(/zu leger, bleibt aber wie gewünscht drin/.test(allWarns(o)), allWarns(o));
  });
});

run('Wochenende, Handgepäck, 12 °C, Regen: kleine Kapsel mit Regenschutz', function () {
  var cap = AK.capsule(W, { days: 2, luggage: 'hand', temp: 12, rain: true, levels: [2, 3], today: today, season: 'herbst' });
  var n = capItems(cap).length;
  assert.ok(n <= 15, 'Handgepäck sollte klein bleiben, sind ' + n);
  assert.ok(cap.pieces.outer.some(function (x) { return x.water; }), 'wetterfeste Jacke erwartet');
  assert.ok(cap.n >= 4, 'mindestens vier Outfits erwartet, sind ' + cap.n);
  assert.ok(!capItems(cap).some(sportOnly), 'keine reinen Sportteile');
  assert.strictEqual(cap.warns.length, 0, cap.warns.join(' | '));
});

run('Kapsel 10 Tage Koffer 24 °C: kein Laufshirt und keine anderen reinen Sportteile', function () {
  var cap = AK.capsule(W, { days: 10, luggage: 'koffer', temp: 24, rain: false, levels: [2, 3, 4], today: today, season: 'sommer' });
  var bad = capItems(cap).filter(sportOnly).map(function (x) { return x.name; });
  assert.deepStrictEqual(bad, []);
  assert.ok(cap.pieces.top.length >= 3);
});

run('Kapsel mit Tennis: Sportteile kommen mit', function () {
  var cap = AK.capsule(W, { days: 4, luggage: 'koffer', temp: 18, levels: [0, 2], today: today, activity: 'tennis' });
  assert.ok(capItems(cap).some(sportOnly), 'Sportteile erwartet');
});

run('Kapsel zum Wandern: Laufschuhe ja, Laufshirt nur auf Stufe Sportlich', function () {
  var cap = AK.capsule(W, { days: 3, luggage: 'koffer', temp: 14, levels: [2, 3], today: today, activity: 'wandern' });
  var names = capItems(cap).map(function (x) { return x.name; });
  assert.ok(names.indexOf('Laufshirt') < 0, names.join(', '));
});

run('Wunsch „eine Jeans“ nutzt beide Jeans über mehrere Würfe', function () {
  var seen = {}, avoid = [];
  for (var seed = 1; seed <= 6; seed++) {
    var r = suggest({ level: 2, weather: { temp: 16 }, transport: 'oepnv', seed: seed, must: [{ kind: 'type', type: 'jeans' }] }, { avoid: avoid });
    r.outfits.forEach(function (o) { assert.strictEqual(o.items.bottom.type, 'jeans'); seen[o.items.bottom.id] = 1; avoid.push(o.key); });
  }
  assert.ok(Object.keys(seen).length >= 2, 'beide Jeans erwartet, gesehen: ' + Object.keys(seen).join(', '));
});

run('Wunsch „ein Navy-Sakko“ (Art und Farbe)', function () {
  var r = suggest({ level: 3, weather: { temp: 14 }, transport: 'oepnv', must: [{ kind: 'type', type: 'sakko', color: 'navy' }] });
  r.outfits.forEach(function (o) { assert.strictEqual(o.items.mid.name, 'Navy Sakko'); });
  assert.ok(/Wunschteile drin: Navy Sakko/.test(r.outfits[0].notes.join(' ')));
  var none = suggest({ level: 3, weather: { temp: 14 }, transport: 'oepnv', must: [{ kind: 'type', type: 'sakko', color: 'rot' }] });
  assert.ok(/kein Teil vom Typ Sakko in Rot/.test(none.warns.join(' ')), none.warns.join(' | '));
});

run('Leerer Schrank meldet fehlende Slots', function () {
  var r = AK.suggest([], { level: 2, weather: { temp: 16 }, transport: 'auto', today: today, seed: 1, factors: [], must: [] });
  assert.deepStrictEqual(r.missing, ['Oberteil', 'Hose', 'Schuhe']);
});

run('Einkaufs-Check und Lücken liefern Ergebnisse', function () {
  var sc = AK.shopCheck(W, AK.normalize({ name: 'Grüner Pullover', type: 'pullover', color: 'gruen' }), today);
  assert.ok(['good', 'great'].indexOf(sc.tier) >= 0, sc.tier);
  assert.ok(sc.partners.length > 0);
  var acc = AK.shopCheck(W, AK.normalize({ name: 'Uhr', type: 'uhr', color: 'grau' }), today);
  assert.strictEqual(acc.tier, 'acc');
  var g = AK.gaps(W, today);
  assert.strictEqual(g.matrix.cells.length, 7);
  assert.ok(g.basics.length >= 10);
});

console.log('\n' + passed + ' bestanden, ' + failed + ' fehlgeschlagen');
if (failed) process.exit(1);

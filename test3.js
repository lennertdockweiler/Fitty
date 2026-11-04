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

run('Business Formal bei 5 °C mit Regen: Sakko, Hemd, Krawatte, Mantel, Regenhinweis', function () {
  var r = suggest({ level: 5, weather: { temp: 5, rain: true, snow: false, wind: false, sun: false }, transport: 'oepnv', season: 'herbst' });
  assert.strictEqual(r.outfits.length, 3);
  r.outfits.forEach(function (o) {
    assert.strictEqual(o.items.mid.type, 'sakko', 'Sakko erwartet');
    assert.strictEqual(o.items.top.type, 'hemd', 'Hemd erwartet');
    assert.ok(o.items.outer, 'Mantel oder Jacke erwartet');
    assert.ok(o.items.acc.some(function (a) { return a.type === 'krawatte'; }), 'Krawatte erwartet');
    assert.ok(/wetterfest/.test(allWarns(o)), 'Hinweis auf fehlenden Regenschutz erwartet');
  });
});

run('Business Casual: Hemd, keine Krawatte, keine Jeans', function () {
  var r = suggest({ level: 4, weather: { temp: 14 }, transport: 'oepnv', season: 'herbst' });
  r.outfits.forEach(function (o) {
    assert.strictEqual(o.items.top.type, 'hemd', 'Hemd erwartet: ' + o.items.top.name);
    assert.ok(o.items.bottom.type !== 'jeans', 'keine Jeans: ' + o.items.bottom.name);
    assert.ok(!o.items.acc.some(function (a) { return a.type === 'krawatte' || a.type === 'fliege'; }), 'keine Krawatte');
  });
});

run('Black Tie (nur noch intern) ohne Gürtel zum Smoking', function () {
  var W2 = W.concat([AK.normalize({ id: 'x-smok', name: 'Smoking', type: 'smoking', color: 'schwarz' }), AK.normalize({ id: 'x-fl', name: 'Fliege', type: 'fliege', color: 'schwarz' })]);
  var r = AK.suggest(W2, { level: 6, weather: { temp: 5, rain: true }, transport: 'auto', factors: [], must: [], seed: 1, today: today }, {});
  assert.strictEqual(r.outfits[0].items.mid.type, 'smoking');
  r.outfits.forEach(function (x) { assert.ok(!x.items.acc.some(function (a) { return a.type === 'guertel'; }), 'kein Gürtel zum Smoking'); });
});

run('Beispielschrank: keine Sport- und Black-Tie-Teile, feste Kennungen', function () {
  assert.ok(!W.some(function (x) { return x.type === 'smoking' || x.type === 'fliege' || ((x.a || 0) >= 2 && x.fmax <= 1); }));
  assert.strictEqual(W.filter(function (x) { return x.id === 'demo13'; })[0].name, 'Navy Sakko');
  assert.ok(AK.DEMO_RETIRED.indexOf('demo15') >= 0, 'Smoking ausgemustert');
  assert.ok(!AK.ACTIVITIES.some(function (a) { return a.sport || a.hike; }), 'keine Sport-Aktivitäten');
  assert.deepStrictEqual(AK.UI_LEVELS, [1, 2, 3, 4, 5]);
});

run('Vorlieben: gemochte Paare steigen, abgelehnte sinken', function () {
  var base = { level: 2, weather: { temp: 16 }, transport: 'oepnv' };
  var r0 = suggest(Object.assign({}, base));
  var top = r0.outfits[0], ids = ['top', 'mid', 'outer', 'bottom', 'shoes'].map(function (k) { return top.items[k]; }).filter(Boolean).map(function (x) { return x.id; }).sort();
  var pairs = {};
  for (var i = 0; i < ids.length; i++) for (var j = i + 1; j < ids.length; j++) pairs[ids[i] + '|' + ids[j]] = -3;
  var r1 = suggest(Object.assign({ pairs: pairs }, base));
  assert.ok(r1.outfits.every(function (o) { return o.key !== top.key; }), 'abgelehnte Kombination taucht nicht mehr oben auf');
  var second = r0.outfits[1], ids2 = ['top', 'mid', 'outer', 'bottom', 'shoes'].map(function (k) { return second.items[k]; }).filter(Boolean).map(function (x) { return x.id; }).sort();
  var likes = {};
  for (i = 0; i < ids2.length; i++) for (j = i + 1; j < ids2.length; j++) likes[ids2[i] + '|' + ids2[j]] = 1;
  var r2 = suggest(Object.assign({ pairs: likes }, base));
  assert.strictEqual(r2.outfits[0].key, second.key, 'gemochte Kombination steht vorn');
  assert.ok(/gefallen/.test(r2.outfits[0].notes.join(' ')), 'Hinweis auf Vorliebe');
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
  assert.ok(!(0 in sc.byLevel) && !(6 in sc.byLevel), 'nur angebotene Stufen');
  assert.ok(sc.partners.length > 0);
  var acc = AK.shopCheck(W, AK.normalize({ name: 'Uhr', type: 'uhr', color: 'grau' }), today);
  assert.strictEqual(acc.tier, 'acc');
  var g = AK.gaps(W, today, AK.UI_LEVELS);
  assert.strictEqual(g.matrix.cells.length, 5);
  assert.ok(g.basics.length >= 10);
});

console.log('\n' + passed + ' bestanden, ' + failed + ' fehlgeschlagen');
if (failed) process.exit(1);

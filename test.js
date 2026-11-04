var AK = require('./data.js'); global.AK = AK;
require('./engine.js'); require('./engine2.js');
var W = AK.DEMO;
var today = '2026-11-04';
function show(title, ctx, opts) {
  ctx.today = today; ctx.seed = ctx.seed || 1;
  var t0 = Date.now();
  var r = AK.suggest(W, ctx, opts);
  console.log('\n## ' + title + '  (' + r.total + ' Kombis, ' + (Date.now() - t0) + ' ms)');
  if (r.missing) console.log('  FEHLT: ' + r.missing.join(', '));
  r.warns.forEach(function (w) { console.log('  ! ' + w); });
  r.outfits.forEach(function (o, i) {
    var it = o.items;
    var line = ['top', 'mid', 'outer', 'bottom', 'shoes'].map(function (k) { return it[k] ? it[k].name : '-'; }).join(' | ');
    console.log('  ' + (i + 1) + '. [' + o.score + '] ' + line + '  + ' + it.acc.map(function (a) { return a.name; }).join(', '));
    o.warns.forEach(function (w) { console.log('       ! ' + w); });
    o.softs.forEach(function (w) { console.log('       ~ ' + w); });
  });
}
var mild = { temp: 16, rain: false, snow: false, wind: false, sun: false };
show('Casual, mild, Bus', { level: 2, weather: mild, transport: 'oepnv' });
show('Smart Casual, kühl 8 Grad, Fußweg', { level: 3, weather: { temp: 8, rain: false, snow: false, wind: false, sun: false }, transport: 'fuss' });
show('Business, Regen 10 Grad, Rad', { level: 5, weather: { temp: 10, rain: true, snow: false, wind: true, sun: false }, transport: 'rad' });
show('Black Tie, 2 Grad, Auto', { level: 6, weather: { temp: 2, rain: false, snow: false, wind: false, sun: false }, transport: 'auto' });
show('Sport, 12 Grad', { level: 0, weather: { temp: 12, rain: false, snow: false, wind: false, sun: false }, transport: 'fuss' });
show('Casual, heiß 31 Grad', { level: 2, weather: { temp: 31, rain: false, snow: false, wind: false, sun: true }, transport: 'fuss' });
show('Smart Casual, Muss: Jeans + Navy Sakko', { level: 3, weather: mild, transport: 'oepnv', must: [{ kind: 'type', type: 'jeans' }, { kind: 'item', id: 'demo13' }] });
show('Black Tie mit Muss Jeans (Konflikt)', { level: 6, weather: mild, transport: 'auto', must: [{ kind: 'type', type: 'jeans' }] });
show('Frost -2, Casual', { level: 2, weather: { temp: -2, rain: false, snow: true, wind: false, sun: false }, transport: 'fuss' });

var sc = AK.shopCheck(W, { name: 'Grüner Pullover', type: 'pullover', slot: 'mid', color: 'gruen', pattern: 'uni', fmin: 1, fmax: 4, w: 3, c: 3, water: false }, today);
console.log('\n## Einkaufs-Check Grüner Pullover:', sc.n, sc.tier, sc.verdict, JSON.stringify(sc.byLevel), sc.partners.map(function (p) { return p.name; }).join(', '));
var t0 = Date.now();
var g = AK.gaps(W, today);
console.log('\n## Lücken (' + (Date.now() - t0) + ' ms)');
g.basics.forEach(function (b) { if (!b.have) console.log('  fehlt: ' + b.name); });
g.matrix.cells.forEach(function (row, i) { console.log('  ' + AK.LEVELS[i].name.padEnd(20) + row.join(' ')); });
var empty = AK.suggest([], { level: 2, weather: mild, transport: 'auto', today: today, seed: 1 });
console.log('\n## Leerer Schrank:', JSON.stringify(empty.missing));

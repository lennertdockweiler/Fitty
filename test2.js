var AK = require('./data.js'); global.AK = AK;
require('./engine.js'); require('./engine2.js'); require('./engine3.js');
var W = AK.DEMO.map(function (x) { return AK.normalize(Object.assign({}, x)); });
// Nutzungsdaten simulieren
W.forEach(function (x, i) { x.wears = (x.basic ? 6 : 1) + (i % 4); });
var today = '2026-11-04', mild = { temp: 16, rain: false, snow: false, wind: false, sun: false };
function line(o) { var it = o.items; return ['top','mid','outer','bottom','shoes'].map(function (k) { return it[k] ? it[k].name : '-'; }).join(' | ') + '  + ' + it.acc.map(function (a) { return a.name; }).join(', '); }
function show(t, ctx) { ctx.today = today; ctx.seed = 1; var r = AK.suggest(W, ctx, {}); console.log('\n## ' + t); r.outfits.forEach(function (o, i) { console.log('  ' + (i+1) + '. [' + o.score + '] ' + line(o)); o.warns.forEach(function (w) { console.log('       ! ' + w); }); }); }
show('Tennis, 18 Grad', { level: 0, weather: { temp: 18, sun: true }, transport: 'rad', activity: 'tennis', season: 'sommer' });
show('Dreiteiler beim Tennis (Muss: Sakko)', { level: 0, weather: { temp: 18, sun: true }, transport: 'auto', activity: 'tennis', must: [{ kind: 'type', type: 'sakko' }] });
show('Date (Smart Casual) mit Muss Jogger', { level: 3, weather: mild, transport: 'oepnv', must: [{ kind: 'type', type: 'jogger' }] });
show('Wandern 9 Grad Herbst', { level: 0, weather: { temp: 9 }, transport: 'fuss', activity: 'wandern', season: 'herbst' });
show('Sommer 28 Grad Casual (Saison Sommer)', { level: 2, weather: { temp: 28, sun: true }, transport: 'fuss', season: 'sommer' });
show('Winter 0 Grad Casual (Saison Winter)', { level: 2, weather: { temp: 0, snow: true }, transport: 'fuss', season: 'winter' });
var t0 = Date.now(); var st = AK.staples(W, today);
console.log('\n## Staples (' + (Date.now() - t0) + ' ms)');
st.rows.slice(0, 8).forEach(function (r) { console.log('  ' + r.item.name.padEnd(24) + r.vers.toFixed(2) + ' ' + r.score.toFixed(2)); });
console.log('  oft getragen:', st.worn.map(function (x) { return x.name + ' ' + x.wears; }).join(', '));
console.log('  schlaefer:', st.sleepers.map(function (r) { return r.item.name; }).join(', '));
t0 = Date.now();
var cap = AK.capsule(W, { days: 3, luggage: 'hand', temp: 12, rain: true, levels: [2, 3], today: today, season: 'herbst' });
console.log('\n## Kapsel Wochenende Handgepaeck 12 Grad Regen (' + (Date.now() - t0) + ' ms): ' + cap.total + ' Teile, ' + cap.n + ' Outfits');
Object.keys(cap.pieces).forEach(function (s) { console.log('  ' + s + ': ' + cap.pieces[s].map(function (x) { return x.name + '(' + (cap.usage[x.id] || 0) + ')'; }).join(', ')); });
console.log('  reisetag:', cap.travel.map(function (x) { return x.name; }).join(', '));
cap.warns.forEach(function (w) { console.log('  ! ' + w); });
cap.samples.forEach(function (s) { console.log('  Bsp L' + s.level + ' ' + s.temp + ': ' + line(s.outfit)); });
t0 = Date.now();
var cap2 = AK.capsule(W, { days: 10, luggage: 'koffer', temp: 24, rain: false, levels: [2, 3, 4], today: today, season: 'sommer' });
console.log('\n## Kapsel 10 Tage Koffer 24 Grad (' + (Date.now() - t0) + ' ms): ' + cap2.total + ' Teile, ' + cap2.n + ' Outfits');
Object.keys(cap2.pieces).forEach(function (s) { console.log('  ' + s + ': ' + cap2.pieces[s].map(function (x) { return x.name; }).join(', ')); });

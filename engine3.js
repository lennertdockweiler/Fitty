/* ===== Ankleide: Staples (Vielseitigkeit und Nutzung) und Kapselgarderobe fürs Gepäck ===== */
(function (AK) {
  var MAIN = ['top', 'mid', 'outer', 'bottom', 'shoes'];
  function usable(W) { return W.filter(function (x) { return x.avail !== false && !x.never; }); }
  function key(c) { return MAIN.map(function (s) { return c[s] ? c[s].id : '-'; }).join('|'); }

  /* Welche Teile tauchen in den besten Outfits über viele Anlässe und Wetterlagen auf? */
  AK.staples = function (W, today) {
    var av = usable(W), counts = {}, runs = 0;
    var weathers = [
      { temp: 8, rain: false, snow: false, wind: false, sun: false },
      { temp: 15, rain: false, snow: false, wind: false, sun: false },
      { temp: 24, rain: false, snow: false, wind: false, sun: true }
    ];
    [1, 2, 3, 4].forEach(function (L) {
      weathers.forEach(function (wt) {
        var ctx = { level: L, weather: wt, transport: 'oepnv', factors: [], must: [], boldness: 1, seed: 1, today: today };
        var info = AK.enumerate(av, ctx, { cap: 6 });
        if (info.missing) return;
        runs++;
        info.combos.slice(0, 25).forEach(function (cb, i) {
          MAIN.forEach(function (s) { var p = cb.c[s]; if (p) counts[p.id] = (counts[p.id] || 0) + (25 - i); });
        });
      });
    });
    var max = 1, maxW = 0;
    Object.keys(counts).forEach(function (k) { if (counts[k] > max) max = counts[k]; });
    av.forEach(function (x) { if ((x.wears || 0) > maxW) maxW = x.wears || 0; });
    var rows = av.filter(function (x) { return x.slot !== 'acc'; }).map(function (x) {
      var v = (counts[x.id] || 0) / max, wn = maxW > 0 ? (x.wears || 0) / maxW : 0;
      return { item: x, vers: v, wearsN: wn, score: maxW > 0 ? 0.65 * v + 0.35 * wn : v };
    });
    rows.sort(function (a, b) { return b.score - a.score; });
    var worn = av.filter(function (x) { return (x.wears || 0) > 0; }).sort(function (a, b) { return b.wears - a.wears; }).slice(0, 5);
    var sleepers = rows.filter(function (r) { return r.vers >= 0.35 && (r.item.wears || 0) <= 1 && maxW >= 3; }).slice(0, 4);
    return { rows: rows, worn: worn, sleepers: sleepers, hasUsage: maxW > 0 };
  };

  /* Kapselgarderobe: wenige Teile, möglichst viele gute Outfits */
  AK.capsule = function (W, o) {
    o = o || {};
    var days = Math.max(1, Math.min(21, o.days || 3)), luggage = o.luggage || 'hand';
    var av = usable(W);
    var levels = (o.levels && o.levels.length) ? o.levels : [2, 3];
    var tday = o.temp != null ? o.temp : 16, rain = !!o.rain;
    var weathers = [
      { temp: tday, rain: false, snow: false, wind: false, sun: tday >= 20 },
      { temp: tday - 6, rain: false, snow: false, wind: false, sun: false }
    ];
    if (rain) weathers.push({ temp: tday - 2, rain: true, snow: false, wind: true, sun: false });
    function mk(L, wt) {
      return { level: L, weather: wt, transport: 'oepnv', factors: [], must: [], boldness: 1, seed: 1, today: o.today, activity: o.activity, season: o.season };
    }
    var cands = {};
    levels.forEach(function (L) {
      weathers.forEach(function (wt) {
        var info = AK.enumerate(av, mk(L, wt), { cap: 8 });
        if (info.missing) return;
        info.combos.slice(0, 40).forEach(function (cb) {
          if (cb.total < 0.75) return;
          var k = L + '#' + key(cb.c);
          if (!cands[k] || cands[k].total < cb.total) cands[k] = { c: cb.c, total: cb.total };
        });
      });
    });
    var list = Object.keys(cands).map(function (k) { return cands[k]; });
    var caps = luggage === 'hand'
      ? { top: Math.min(5, Math.max(2, Math.ceil(days / 2) + 1)), mid: 2, outer: 1, bottom: days > 5 ? 3 : 2, shoes: 2, acc: 3 }
      : { top: Math.min(8, Math.max(3, days)), mid: 3, outer: 2, bottom: 4, shoes: 3, acc: 5 };
    var pool = {};
    list.forEach(function (cd) { MAIN.forEach(function (s) { var p = cd.c[s]; if (p) pool[p.id] = p; }); });
    var poolArr = Object.keys(pool).map(function (k) { return pool[k]; });
    var chosen = {}, count = { top: 0, mid: 0, outer: 0, bottom: 0, shoes: 0 };
    function prog() {
      var g = 0;
      list.forEach(function (cd) {
        var need = MAIN.map(function (s) { return cd.c[s]; }).filter(Boolean);
        var inn = need.filter(function (x) { return chosen[x.id]; }).length;
        var fr = inn / need.length;
        g += fr * fr * fr * cd.total;
      });
      return g;
    }
    for (var step = 0; step < 40; step++) {
      var base = prog(), best = null, bestGain = 1e-9;
      for (var i = 0; i < poolArr.length; i++) {
        var p = poolArr[i];
        if (chosen[p.id] || count[p.slot] >= caps[p.slot]) continue;
        chosen[p.id] = p;
        var gain = prog() - base;
        delete chosen[p.id];
        if (gain > bestGain) { bestGain = gain; best = p; }
      }
      if (!best) break;
      chosen[best.id] = best; count[best.slot]++;
    }
    var pieces = { top: [], mid: [], outer: [], bottom: [], shoes: [], acc: [] };
    Object.keys(chosen).forEach(function (k) { pieces[chosen[k].slot].push(chosen[k]); });
    // Accessoires
    var accPool = av.filter(function (x) { return x.slot === 'acc'; });
    var accN = 0;
    function addAcc(it) { if (it && accN < caps.acc && pieces.acc.indexOf(it) < 0) { pieces.acc.push(it); accN++; } }
    var anyBelted = pieces.bottom.some(function (b) { return ['jeans', 'chino', 'stoff', 'anzughose', 'cargo'].indexOf(b.type) >= 0; });
    var shoeCols = pieces.shoes.map(function (s) { return s.color; });
    if (anyBelted) {
      var wantBrown = shoeCols.indexOf('braun') >= 0 || shoeCols.indexOf('camel') >= 0;
      var wantBlack = shoeCols.indexOf('schwarz') >= 0;
      accPool.filter(function (x) { return x.type === 'guertel'; }).forEach(function (b) {
        if ((wantBrown && b.color === 'braun') || (wantBlack && b.color === 'schwarz')) addAcc(b);
      });
    }
    addAcc(accPool.filter(function (x) { return x.type === 'uhr'; })[0]);
    if (tday - 6 < 8) addAcc(accPool.filter(function (x) { return x.type === 'schal'; })[0]);
    if (tday >= 18) addAcc(accPool.filter(function (x) { return x.type === 'sonnenbrille'; })[0]);
    if (levels.indexOf(5) >= 0 || levels.indexOf(6) >= 0) {
      addAcc(accPool.filter(function (x) { return x.type === 'krawatte' || x.type === 'fliege'; })[0]);
    }
    // Wirkung der Auswahl neu messen
    var subset = Object.keys(chosen).map(function (k) { return chosen[k]; }).concat(pieces.acc);
    var seen = {}, usage = {}, n = 0;
    levels.forEach(function (L) {
      weathers.forEach(function (wt) {
        var info = AK.enumerate(subset, mk(L, wt), { cap: 10 });
        if (info.missing) return;
        info.combos.forEach(function (cb) {
          if (cb.total < 0.75) return;
          var k = L + '#' + key(cb.c);
          if (seen[k]) return;
          seen[k] = 1; n++;
          MAIN.forEach(function (s) { var p = cb.c[s]; if (p) usage[p.id] = (usage[p.id] || 0) + 1; });
        });
      });
    });
    // Beispiel-Outfits
    var samples = [], sk = {};
    levels.slice(0, 2).forEach(function (L) {
      weathers.slice(0, 2).forEach(function (wt) {
        var r = AK.suggest(subset, mk(L, wt), { n: 2 });
        r.outfits.forEach(function (of) { if (!sk[of.key]) { sk[of.key] = 1; samples.push({ level: L, temp: wt.temp, outfit: of }); } });
      });
    });
    // Am Reisetag tragen: schwerste Teile, spart Platz im Koffer
    function heaviest(slot) {
      return pieces[slot].slice().sort(function (a, b) { return (b.w || 0) - (a.w || 0); })[0];
    }
    var travel = [heaviest('outer'), heaviest('shoes'), heaviest('mid')].filter(Boolean);
    var warn = [];
    if (n < Math.min(days, 4)) warn.push('Mit dieser Auswahl sind nur ' + n + ' gute Outfits möglich. Dir fehlen passende Kombi-Teile.');
    if (!pieces.top.length || !pieces.bottom.length || !pieces.shoes.length) warn.push('Für eine vollständige Kapsel fehlen Teile im Schrank.');
    return { pieces: pieces, n: n, usage: usage, samples: samples.slice(0, 5), travel: travel, warns: warn, caps: caps, total: Object.keys(chosen).length + pieces.acc.length };
  };
})(typeof AK !== 'undefined' ? AK : (global.AK = require('./data.js')));

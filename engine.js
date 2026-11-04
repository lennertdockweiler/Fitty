/* ===== Ankleide: Kern der Outfit-Engine (Bewertung und Kombination) ===== */
(function (AK) {
  var COLOR = {};
  AK.COLORS.forEach(function (c) { COLOR[c.id] = c; });
  function fam(id) { return COLOR[id] ? COLOR[id].fam : 'neutral'; }

  function mulberry(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function has(arr, x) { return arr && arr.indexOf(x) >= 0; }

  /* gefühlte Temperatur */
  function allF(ctx) { return (ctx.factors || []).concat((AK.ACT[ctx.activity] || {}).f || []); }
  function effTemp(ctx) {
    var w = ctx.weather, t = w.temp, f = allF(ctx);
    if (w.wind) t -= 3;
    if (w.rain) t -= 1;
    if (w.snow) t -= 1;
    if (w.sun) t += 2;
    if (has(f, 'cool_evening')) t -= 4;
    if (has(f, 'indoor')) t += 3;
    if (ctx.transport === 'auto') t += 3;
    return t;
  }
  /* benötigter Wärmewert für Oberkörper-Schichten */
  function needFor(t) { return Math.max(0.8, Math.min(11, 1 + (26 - t) * 0.33)); }

  function daysSince(iso, today) {
    if (!iso) return 999;
    var a = Date.parse(iso), b = Date.parse(today || new Date().toISOString().slice(0, 10));
    if (isNaN(a) || isNaN(b)) return 999;
    return Math.round((b - a) / 86400000);
  }

  function dist(it, level) {
    return level < it.fmin ? it.fmin - level : (level > it.fmax ? level - it.fmax : 0);
  }
  function formFit(d) { return d === 0 ? 1 : (d === 1 ? 0.6 : (d === 2 ? 0.25 : 0)); }

  /* Einzelbewertung eines Teils im Kontext */
  function itemScore(it, ctx, E) {
    var t = AK.TYPES[it.type] || {};
    var s = formFit(dist(it, ctx.level));
    var act = AK.ACT[ctx.activity] || {};
    var f = (ctx.factors || []).concat(act.f || []);
    if (ctx.season && it.s && it.s.length && it.s.indexOf(ctx.season) < 0) s -= 0.4;
    var ath = it.a || 0;
    if (act.sport) {
      if (it.slot === 'top' || it.slot === 'bottom' || it.slot === 'shoes') s -= ath >= 2 ? 0 : (ath === 1 ? 0.2 : 0.45);
      else if (it.slot === 'mid' || it.slot === 'outer') s -= ath >= 1 ? 0 : 0.3;
    }
    if (act.hike) {
      if (it.slot === 'shoes') s -= t.hike ? 0 : 0.4;
      if (it.slot === 'bottom') s -= it.type === 'jeans' ? 0.25 : (t.hike || ath >= 1 ? 0 : 0.1);
      if (it.slot === 'top' && it.type === 'hemd') s -= 0.25;
    }
    if (it.fav) s += has(f, 'impress') ? 0.2 : 0.1;
    var ds = daysSince(it.last, ctx.today);
    if (ds <= 1) s -= 0.3; else if (ds <= 3) s -= 0.12;
    if (ctx.transport === 'rad') {
      if (t.long) s -= 0.45;
      if (it.type === 'oxford') s -= 0.2;
      else if (t.leather) s -= 0.08;
      if (it.type === 'sandalen') s -= 0.2;
    } else if (ctx.transport === 'oepnv' && t.long) s -= 0.05;
    var comfort = it.c || t.c || 2;
    if ((ctx.transport === 'fuss' || has(f, 'walk')) && it.slot === 'shoes') s -= (3 - comfort) * 0.22;
    if (has(f, 'sit') && (it.slot === 'top' || it.slot === 'bottom')) s -= (3 - comfort) * 0.1;
    if (E.snow && it.slot === 'shoes' && !it.water) s -= 0.15;
    return s;
  }

  function colorAdj(c, ctx) {
    var base = [c.top, c.mid, c.outer, c.bottom].filter(Boolean);
    var cl = base.concat([c.shoes]).map(function (x) { return x.color; });
    var bold = ctx.boldness == null ? 1 : ctx.boldness;
    var adj = 0;
    var br = cl.filter(function (x) { return fam(x) === 'bright'; }).length;
    if (br >= 2) adj -= bold === 2 ? 0.12 : 0.4;
    else if (br === 1) adj += bold === 2 ? 0.08 : (bold === 0 ? -0.1 : 0);
    var cb = base.map(function (x) { return x.color; });
    if (has(cb, 'navy') && has(cb, 'schwarz')) adj -= 0.18;
    if (has(cl, 'braun') && has(cl, 'schwarz')) adj -= 0.12;
    if (c.top.color === c.bottom.color && ['schwarz', 'weiss', 'grau', 'anthrazit'].indexOf(c.top.color) < 0) adj -= 0.08;
    if (c.outer && c.outer.type === 'jeansjacke' && c.bottom.type === 'jeans' && c.outer.color === c.bottom.color) adj -= 0.2;
    var pat = base.filter(function (x) { return x.pattern && x.pattern !== 'uni'; }).length;
    if (pat >= 2) adj -= bold === 2 ? 0.1 : 0.28;
    var cool = cl.filter(function (x) { return fam(x) === 'cool'; }).length;
    var earthy = cl.filter(function (x) { return x === 'oliv' || x === 'bordeaux' || x === 'camel'; }).length;
    if (cool && earthy && bold < 2) adj -= 0.06;
    var allNeutral = cl.every(function (x) { return fam(x) === 'neutral' || fam(x) === 'earth'; });
    if (allNeutral) adj += 0.04;
    return adj;
  }

  function scoreCombo(c, ctx, E) {
    var L = ctx.level, pen = 0, bonus = 0;
    var W = { top: 1.2, mid: 0.8, outer: 0.8, bottom: 1.2, shoes: 1.1 };
    var s = 0, ws = 0;
    ['top', 'mid', 'outer', 'bottom', 'shoes'].forEach(function (k) {
      if (c[k]) { s += E.is[c[k].id] * W[k]; ws += W[k]; }
    });
    var item = s / ws;
    var ins = (c.top ? c.top.w : 0) + (c.mid ? c.mid.w : 0) + (c.outer ? c.outer.w : 0);
    var diff = ins - E.need;
    var wea = Math.max(0, diff < 0 ? 1 - 0.2 * (-diff) : 1 - 0.1 * diff);
    if (E.need > 4.3 && !c.outer) pen += ins < E.need - 0.8 ? 0.45 : 0.1;
    if (E.temp >= 23 && c.outer && !(E.rain && c.outer.water)) pen += 0.35;
    if (E.temp >= 26 && c.mid) pen += (c.mid.type === 'sakko' || c.mid.type === 'smoking') ? 0.05 : 0.25;
    if (E.rain) {
      var wp = (c.outer && c.outer.water) || (c.mid && c.mid.water);
      if (!wp) pen += ctx.transport === 'auto' ? 0.08 : (ctx.transport === 'oepnv' ? 0.2 : 0.35);
    }
    if (E.snow && !c.shoes.water) pen += 0.3;
    if (E.temp >= 24) pen += Math.max(-0.05, (c.bottom.w - 1) * 0.1);
    if (c.bottom.type === 'shorts' && E.temp < 18) pen += 0.5;
    if (c.shoes.type === 'sandalen' && E.temp < 16) pen += 0.5;
    if (L >= 5) {
      var m = c.mid && (c.mid.type === 'sakko' || c.mid.type === 'smoking');
      if (!m) pen += 0.6;
      if (L === 6 && !(c.mid && c.mid.type === 'smoking')) pen += 0.4;
      if (c.top.type !== 'hemd') pen += 0.2;
    } else if (L === 4 && c.mid && c.mid.type === 'sakko') bonus += 0.06;
    if (L <= 5 && c.mid && c.mid.type === 'smoking') pen += 1;
    var total = item * 0.55 + wea * 0.25 + 0.2 - pen + bonus + colorAdj(c, ctx) + E.rand() * 0.03;
    return { total: total, ins: ins };
  }

  /* Wunschteile (Muss) in Slots auflösen */
  function resolveMust(W, ctx) {
    var forced = {}, warns = [], used = {};
    (ctx.must || []).forEach(function (m) {
      var list = [];
      if (m.kind === 'item') {
        var it = m.item || W.filter(function (x) { return x.id === m.id; })[0];
        if (it) list = [it];
      } else if (m.kind === 'type') {
        // optional mit Farbe, z. B. „ein Navy-Sakko“: {kind:'type', type:'sakko', color:'navy'}
        list = W.filter(function (x) { return x.type === m.type && (!m.color || x.color === m.color) && x.avail !== false && !x.never; });
        if (!list.length) {
          var cn = m.color ? (AK.COLORS.filter(function (c) { return c.id === m.color; })[0] || { name: m.color }).name : '';
          warns.push('Du hast kein Teil vom Typ ' + (AK.TYPES[m.type] ? AK.TYPES[m.type].label : m.type) + (cn ? ' in ' + cn : '') + ' im Schrank.');
          return;
        }
      }
      if (!list.length) return;
      var slot = list[0].slot;
      if (slot === 'acc') {
        forced.acc = (forced.acc || []).concat(list.slice(0, m.kind === 'item' ? 1 : 1));
        return;
      }
      if (forced[slot]) {
        var prevNames = forced[slot].map(function (x) { return x.name; }).join(', ');
        var same = m.kind === 'item' && forced[slot].some(function (x) { return x.id === list[0].id; });
        if (!same) warns.push('Zwei Wunschteile für ' + AK.SLOTS.filter(function (s) { return s.id === slot; })[0].name + ' (' + prevNames + ' und ' + list[0].name + '). Ich nehme das zuerst gewählte.');
        return;
      }
      forced[slot] = list;
    });
    return { forced: forced, warns: warns };
  }

  /* Alle sinnvollen Kombinationen bewerten */
  AK.enumerate = function (W, ctx, o) {
    o = o || {};
    var cap = o.cap || 8;
    var temp = effTemp(ctx);
    var E = {
      temp: temp, need: needFor(temp), rain: !!ctx.weather.rain, snow: !!ctx.weather.snow,
      is: {}, rand: mulberry((ctx.seed || 1) * 7919 + 13)
    };
    var mr = resolveMust(W, ctx);
    var forced = mr.forced;
    var pool = W.filter(function (x) {
      if (x.avail === false || x.never) return false;
      if (ctx.onlyBasics && !x.basic) return false;
      return true;
    });
    // Teile aus dem Wunschfeld immer zulassen
    Object.keys(forced).forEach(function (k) {
      forced[k].forEach(function (f) { if (pool.indexOf(f) < 0) pool.push(f); });
    });
    pool.forEach(function (x) { E.is[x.id] = itemScore(x, ctx, E); });
    var relaxed = {};
    function candidates(slot, optional) {
      if (forced[slot]) {
        // Wunsch nach einer Art: alle passenden Teile zulassen, das beste zuerst
        return forced[slot].slice().sort(function (a, b) { return E.is[b.id] - E.is[a.id]; }).slice(0, cap);
      }
      var base = pool.filter(function (x) { return x.slot === slot; });
      var list = base.filter(function (x) { return dist(x, ctx.level) <= 1; });
      if (!list.length && !optional) { list = base.filter(function (x) { return dist(x, ctx.level) <= 2; }); if (list.length) relaxed[slot] = true; }
      list.sort(function (a, b) { return E.is[b.id] - E.is[a.id]; });
      return list.slice(0, cap);
    }
    var tops = candidates('top'), bottoms = candidates('bottom'), shoes = candidates('shoes');
    var mids = candidates('mid', true), outers = candidates('outer', true);
    var res = { combos: [], warns: mr.warns.slice(), relaxed: relaxed, E: E, forced: forced };
    if (!tops.length || !bottoms.length || !shoes.length) {
      res.missing = [];
      if (!tops.length) res.missing.push('top');
      if (!bottoms.length) res.missing.push('bottom');
      if (!shoes.length) res.missing.push('shoes');
      return res;
    }
    var midOpts = forced.mid ? mids : [null].concat(mids);
    var outOpts = forced.outer ? outers : [null].concat(outers);
    for (var a = 0; a < tops.length; a++)
      for (var b = 0; b < bottoms.length; b++)
        for (var s = 0; s < shoes.length; s++)
          for (var m = 0; m < midOpts.length; m++)
            for (var u = 0; u < outOpts.length; u++) {
              var c = { top: tops[a], mid: midOpts[m], outer: outOpts[u], bottom: bottoms[b], shoes: shoes[s] };
              var r = scoreCombo(c, ctx, E);
              res.combos.push({ c: c, total: r.total, ins: r.ins });
            }
    res.combos.sort(function (x, y) { return y.total - x.total; });
    return res;
  };

  /* Drei verschiedene Vorschläge auswählen */
  AK.pickDiverse = function (combos, n, avoidKeys) {
    var chosen = [];
    function key(c) { return [c.top.id, c.bottom.id, c.shoes.id].join('|'); }
    function diffCount(a, b) {
      var d = 0;
      ['top', 'bottom', 'shoes'].forEach(function (k) { if (a[k].id !== b[k].id) d++; });
      if ((a.outer && a.outer.id) !== (b.outer && b.outer.id)) d += 0.5;
      return d;
    }
    [2, 1.5, 1, 0.5].forEach(function (need) {
      for (var i = 0; i < combos.length && chosen.length < n; i++) {
        var x = combos[i];
        if (avoidKeys && avoidKeys.indexOf(key(x.c)) >= 0) continue;
        var ok = chosen.every(function (y) { return diffCount(x.c, y.c) >= need; });
        if (ok && chosen.indexOf(x) < 0) chosen.push(x);
      }
    });
    return chosen;
  };
  AK.comboKey = function (c) { return [c.top.id, c.bottom.id, c.shoes.id].join('|'); };
  AK._int = { effTemp: effTemp, needFor: needFor, fam: fam, dist: dist, daysSince: daysSince, has: has, allF: allF };
})(typeof AK !== 'undefined' ? AK : (global.AK = require('./data.js')));

/* ===== Ankleide: Accessoires, Begründungen, Einkaufs-Check, Lückenanalyse ===== */
(function (AK) {
  var I = AK._int;
  var COLORNAME = {};
  AK.COLORS.forEach(function (c) { COLORNAME[c.id] = c.name; });
  function cname(id) { return COLORNAME[id] || id; }
  function leatherFam(col) {
    if (col === 'braun' || col === 'camel' || col === 'bordeaux') return 'brown';
    if (col === 'schwarz' || col === 'anthrazit') return 'black';
    return 'other';
  }
  function slotName(id) { return AK.SLOTS.filter(function (s) { return s.id === id; })[0].name; }

  function pickAcc(pool, kind, ctx, pref) {
    var list = pool.filter(function (x) {
      var t = AK.TYPES[x.type];
      return t && t.acc === kind && I.dist(x, ctx.level) === 0;
    });
    if (pref) list = list.filter(pref).concat(list.filter(function (x) { return !pref(x); }));
    list.sort(function (a, b) { return (b.fav ? 1 : 0) - (a.fav ? 1 : 0); });
    return list.length ? list : [];
  }

  AK.buildOutfit = function (combo, ctx, W, info) {
    var c = combo.c, E = info.E, L = ctx.level, w = ctx.weather;
    var out = { top: c.top, mid: c.mid, outer: c.outer, bottom: c.bottom, shoes: c.shoes, acc: [] };
    var warns = [], notes = [], softs = [];
    var pool = W.filter(function (x) {
      return x.slot === 'acc' && x.avail !== false && !x.never && !(ctx.onlyBasics && !x.basic);
    });
    var forcedAcc = (info.forced.acc || []).slice();
    function addAcc(it) {
      if (it && out.acc.indexOf(it) < 0) out.acc.push(it);
    }
    forcedAcc.forEach(function (x) {
      if (I.dist(x, L) > 0) warns.push(x.name + ' passt eigentlich nicht zu Stufe ' + AK.LEVELS[L].name + ', ist aber wie gewünscht dabei.');
      addAcc(x);
    });
    function kindTaken(kind) {
      return out.acc.some(function (x) { return AK.TYPES[x.type].acc === kind; });
    }
    // Gürtel
    var belted = ['jeans', 'chino', 'stoff', 'anzughose', 'cargo'].indexOf(c.bottom.type) >= 0;
    // Zum Smoking (Black Tie) gehört kein Gürtel
    if (belted && L >= 2 && L < 6 && !kindTaken('belt')) {
      var sf = leatherFam(c.shoes.color);
      var belts = pickAcc(pool, 'belt', ctx, function (x) { return sf === 'other' ? true : leatherFam(x.color) === sf; });
      if (belts.length && (sf === 'other' || leatherFam(belts[0].color) === sf)) addAcc(belts[0]);
      else if (L >= 3) softs.push('Ein Gürtel in der Farbe der Schuhe (' + cname(c.shoes.color) + ') fehlt noch.');
    }
    // Krawatte, Fliege, Einstecktuch
    if (c.top.type === 'hemd') {
      if (L === 6 && !kindTaken('tie')) {
        var bow = pool.filter(function (x) { return x.type === 'fliege'; });
        if (bow.length) addAcc(bow[0]); else softs.push('Zu Black Tie gehört eine Fliege, im Schrank ist keine.');
      } else if (L === 5 && !kindTaken('tie')) {
        var ties = pickAcc(pool, 'tie', ctx, function (x) { return x.color !== c.top.color && (c.top.pattern === 'uni' || x.pattern === 'uni'); });
        if (ties.length) addAcc(ties[0]);
        else softs.push('Zu ' + AK.LEVELS[5].name + ' gehört eine Krawatte, im Schrank ist keine.');
      }
      if (L >= 5 && !kindTaken('pocket')) {
        var pk = pickAcc(pool, 'pocket', ctx);
        if (pk.length) addAcc(pk[0]);
      }
    }
    // Kälte
    var t = E.temp;
    if (t < 6 && !kindTaken('cold')) {
      var sc = pool.filter(function (x) { return x.type === 'schal' && I.dist(x, L) === 0; });
      if (sc.length) addAcc(sc[0]); else softs.push('Bei der Kälte wäre ein Schal gut.');
    }
    if (t < 3) {
      var mu = pool.filter(function (x) { return x.type === 'muetze' && I.dist(x, L) === 0; });
      if (mu.length) addAcc(mu[0]);
    }
    if (t < 0) {
      var hs = pool.filter(function (x) { return x.type === 'handschuhe' && I.dist(x, L) === 0; });
      if (hs.length) addAcc(hs[0]);
    }
    // Sonne
    if (w.sun && w.temp >= 16 && !w.rain && L <= 4) {
      var sg = pool.filter(function (x) { return x.type === 'sonnenbrille'; });
      if (sg.length) addAcc(sg[0]);
    }
    if (w.sun && w.temp >= 22 && !w.rain && L <= 2) {
      var cp = pool.filter(function (x) { return x.type === 'cap'; });
      if (cp.length) addAcc(cp[0]);
    }
    // Uhr
    if (!kindTaken('watch')) {
      var wt = pickAcc(pool, 'watch', ctx);
      if (wt.length) addAcc(wt[0]);
    }

    /* ---- Begründungen ---- */
    var main = ['top', 'mid', 'outer', 'bottom', 'shoes'].map(function (k) { return out[k]; }).filter(Boolean);
    function isWished(x) {
      return (ctx.must || []).some(function (m) { return (m.kind === 'item' && (m.id === x.id || (m.item && m.item.id === x.id))) || (m.kind === 'type' && m.type === x.type && (!m.color || m.color === x.color)); });
    }
    var off = main.filter(function (x) { return I.dist(x, L) > 0; });
    if (!off.length) notes.push('Alle Teile passen zu „' + AK.LEVELS[L].name + '“.');
    else off.forEach(function (x) {
      if ((AK.ACT[ctx.activity] || {}).sport) return;
      warns.push(x.name + ' ist für „' + AK.LEVELS[L].name + '“ ' + (L > x.fmax ? 'eher zu leger' : 'eher zu elegant') + (isWished(x) ? ', bleibt aber wie gewünscht drin.' : ', ist hier ein Kompromiss.'));
    });
    if (L === 6 && !(out.mid && out.mid.type === 'smoking')) softs.push('Zu Black Tie gehört ein Smoking, im Schrank ist keiner.');
    var diff = combo.ins - E.need;
    var feels = Math.round(E.temp);
    if (Math.abs(diff) <= 1.2) notes.push('Wärme passt zu gefühlten ' + feels + ' °C.');
    else if (diff < 0) warns.push('Bei gefühlten ' + feels + ' °C könnte es etwas kühl werden. Eine wärmere Schicht wäre besser.');
    else notes.push('Eher warm bei gefühlten ' + feels + ' °C' + ((out.mid || out.outer) ? ', die oberste Schicht lässt sich ausziehen.' : '.'));
    if (w.rain || w.snow) {
      var wp = [out.outer, out.mid].filter(function (x) { return x && x.water; })[0];
      if (wp) notes.push('Wetterfest durch ' + wp.name + '.');
      else warns.push('Kein wetterfestes Teil dabei. Ein Schirm oder eine andere Jacke wäre sinnvoll.');
      if (w.snow && !c.shoes.water) warns.push('Die Schuhe sind nicht für Schnee gedacht.');
    }
    if (ctx.transport === 'rad') {
      if (out.outer && AK.TYPES[out.outer.type].long) warns.push('Ein langer Mantel ist auf dem Rad unpraktisch.');
      if (L >= 5) warns.push('Auf dem Rad wird ein Anzug schnell unbequem.');
    }
    var walky = ctx.transport === 'fuss' || I.has(I.allF(ctx), 'walk');
    if (walky && (c.shoes.c || 2) >= 3) notes.push('Bequeme Schuhe für viel Laufen.');
    if (walky && (c.shoes.c || 2) <= 1) warns.push('Die Schuhe sind nicht auf lange Strecken ausgelegt.');
    var act = AK.ACT[ctx.activity] || {};
    if (act.sport) {
      main.forEach(function (x) {
        if ((x.slot === 'top' || x.slot === 'bottom' || x.slot === 'shoes') && (x.a || 0) < 2) warns.push(x.name + ' ist für ' + act.name + ' nur bedingt geeignet.');
        else if ((x.slot === 'mid' || x.slot === 'outer') && !(x.a >= 1)) warns.push(x.name + ' ist für ' + act.name + ' unpraktisch.');
      });
      if (L > 1) warns.push('Für ' + act.name + ' passt die Stufe „Sportlich“ am besten.');
      else if (!warns.length) notes.push('Alles sporttauglich für ' + act.name + '.');
    }
    if (act.hike && !AK.TYPES[c.shoes.type].hike) warns.push('Zum Wandern fehlt festes Schuhwerk.');
    if (ctx.season) {
      var offS = main.filter(function (x) { return x.s && x.s.length && x.s.indexOf(ctx.season) < 0; });
      offS.forEach(function (x) { warns.push(x.name + ' ist eigentlich kein ' + AK.SEASONS.filter(function (s) { return s.id === ctx.season; })[0].name + '-Teil.'); });
    }
    if (ctx.transport === 'oepnv' && (out.mid || out.outer)) notes.push('Schichten lassen sich in Bus und Bahn schnell ausziehen.');
    var cols = [];
    main.forEach(function (x) { if (cols.indexOf(x.color) < 0) cols.push(x.color); });
    var brights = cols.filter(function (x) { return I.fam(x) === 'bright'; });
    notes.push('Farben: ' + cols.map(cname).join(', ') + (brights.length === 1 ? ' (Akzent: ' + cname(brights[0]) + ')' : '') + '.');
    var wished = main.concat(out.acc).filter(isWished);
    if (wished.length) notes.unshift('Wunschteile drin: ' + wished.map(function (x) { return x.name; }).join(', ') + '.');
    var favs = main.filter(function (x) { return x.fav; });
    if (favs.length) notes.push('Mit Lieblingsteil: ' + favs.map(function (x) { return x.name; }).join(', ') + '.');
    if (combo.aff >= 0.06) notes.unshift('Passt zu dem, was dir bisher gefallen hat.');
    else if (combo.aff <= -0.09) softs.push('Ähnliche Kombinationen fandest du weniger gut.');

    return {
      items: out, score: Math.min(99, Math.max(5, Math.round((combo.total - 0.25) / 0.9 * 100))),
      notes: notes, warns: warns, softs: softs, key: AK.comboKey(c), feels: feels
    };
  };

  AK.suggest = function (W, ctx, opts) {
    opts = opts || {};
    var info = AK.enumerate(W, ctx, { cap: opts.cap || 8 });
    var res = { outfits: [], warns: info.warns.slice(), total: info.combos.length, missing: null };
    if (info.missing) {
      res.missing = info.missing.map(slotName);
      return res;
    }
    Object.keys(info.relaxed).forEach(function (k) {
      res.warns.push('Für „' + slotName(k) + '“ passt nichts exakt zu Stufe ' + AK.LEVELS[ctx.level].name + '. Ich nehme das Nächstbeste.');
    });
    var picked = AK.pickDiverse(info.combos, opts.n || 3, opts.avoid);
    res.outfits = picked.map(function (p) { return AK.buildOutfit(p, ctx, W, info); });
    return res;
  };

  /* Einkaufs-Check: wie gut lässt sich ein Teil mit dem Schrank kombinieren? */
  AK.shopCheck = function (W, item, today) {
    var it = {}; for (var k in item) it[k] = item[k];
    it.id = it.id || 'scan'; it.avail = true; it.never = false;
    var base = W.filter(function (x) { return x.id !== it.id; });
    if (it.slot === 'acc') return { n: null, tier: 'acc', verdict: 'Accessoires lassen sich meist leicht ergänzen.', byLevel: {}, partners: [] };
    var weathers = [
      { temp: 4, rain: false, snow: false, wind: false, sun: false },
      { temp: 15, rain: false, snow: false, wind: false, sun: false },
      { temp: 25, rain: false, snow: false, wind: false, sun: true }
    ];
    var byLevel = {}, n = 0, seen = {}, partnerCount = {};
    var lo = it.fmin, hi = it.fmax;
    if (AK.UI_LEVELS) { lo = Math.max(lo, AK.UI_LEVELS[0]); hi = Math.min(hi, AK.UI_LEVELS[AK.UI_LEVELS.length - 1]); }
    for (var L = lo; L <= hi; L++) {
      byLevel[L] = 0;
      weathers.forEach(function (wt) {
        var ctx = { level: L, weather: wt, transport: 'oepnv', factors: [], must: [{ kind: 'item', item: it }], boldness: 1, seed: 1, today: today };
        var info = AK.enumerate(base.concat([it]), ctx, { cap: 6 });
        info.combos.forEach(function (cb, i) {
          if (cb.total < 0.85) return;
          var key = L + '|' + AK.comboKey(cb.c) + '|' + (cb.c.mid ? cb.c.mid.id : '') + (cb.c.outer ? cb.c.outer.id : '');
          if (seen[key]) return;
          seen[key] = 1; n++; byLevel[L]++;
          ['top', 'mid', 'outer', 'bottom', 'shoes'].forEach(function (s) {
            var p = cb.c[s];
            if (p && p.id !== it.id) partnerCount[p.id] = (partnerCount[p.id] || 0) + 1;
          });
        });
      });
    }
    var partners = Object.keys(partnerCount).sort(function (a, b) { return partnerCount[b] - partnerCount[a]; }).slice(0, 6)
      .map(function (id) { return base.filter(function (x) { return x.id === id; })[0]; }).filter(Boolean);
    var tier = n === 0 ? 'none' : (n < 6 ? 'low' : (n < 40 ? 'good' : 'great'));
    var verdict = { none: 'Passt aktuell zu fast nichts in deinem Schrank.', low: 'Nur schwer kombinierbar. Dir fehlen passende Partner.',
      good: 'Gut kombinierbar mit mehreren Teilen.', great: 'Sehr vielseitig und mit vielen Teilen kombinierbar.' }[tier];
    return { n: n, tier: tier, verdict: verdict, byLevel: byLevel, partners: partners };
  };

  /* Lückenanalyse: Basics-Checkliste und Abdeckung nach Anlass und Wetter */
  AK.gaps = function (W, today, levelIds) {
    var av = W.filter(function (x) { return x.avail !== false && !x.never; });
    function any(f) { return av.some(f); }
    var dark = ['indigo', 'navy', 'schwarz', 'anthrazit'];
    var basics = [
      { id: 'hemd-w', name: 'Weißes Hemd', why: 'Basis für Business, Dates und Anzug.', have: any(function (x) { return x.type === 'hemd' && x.color === 'weiss'; }) },
      { id: 'hemd-b', name: 'Hellblaues Hemd', why: 'Passt zu fast jedem Sakko und jeder Hose.', have: any(function (x) { return x.type === 'hemd' && x.color === 'hellblau'; }) },
      { id: 'jeans', name: 'Dunkle Jeans', why: 'Von Casual bis Smart Casual einsetzbar.', have: any(function (x) { return x.type === 'jeans' && dark.indexOf(x.color) >= 0; }) },
      { id: 'chino', name: 'Chino', why: 'Die Brücke zwischen Jeans und Stoffhose.', have: any(function (x) { return x.type === 'chino'; }) },
      { id: 'sakko', name: 'Sakko in Navy oder Grau', why: 'Hebt jedes Outfit eine Stufe an.', have: any(function (x) { return x.type === 'sakko' && (x.color === 'navy' || x.color === 'grau' || x.color === 'anthrazit'); }) },
      { id: 'tee', name: 'Zwei Basic-T-Shirts (Weiß, Grau oder Schwarz)', why: 'Grundlage für Layering im Alltag.', have: av.filter(function (x) { return x.type === 'tshirt' && ['weiss', 'grau', 'schwarz'].indexOf(x.color) >= 0; }).length >= 2 },
      { id: 'strick', name: 'Pullover oder Feinstrick in Neutral', why: 'Mittlere Schicht für kühle Tage.', have: any(function (x) { return (x.type === 'pullover' || x.type === 'feinstrick') && I.fam(x.color) === 'neutral'; }) },
      { id: 'sneaker', name: 'Weiße Sneaker', why: 'Funktionieren zu fast allem unter Business.', have: any(function (x) { return x.type === 'sneaker' && x.color === 'weiss'; }) },
      { id: 'leder-b', name: 'Braune Lederschuhe', why: 'Für Smart Casual und Business Casual.', have: any(function (x) { return ['chelsea', 'loafer', 'derby', 'oxford', 'boots'].indexOf(x.type) >= 0 && x.color === 'braun'; }) },
      { id: 'leder-s', name: 'Schwarze Lederschuhe', why: 'Pflicht zum Anzug.', have: any(function (x) { return ['chelsea', 'loafer', 'derby', 'oxford'].indexOf(x.type) >= 0 && x.color === 'schwarz'; }) },
      { id: 'regen', name: 'Regenjacke', why: 'Für Rad, Bahn und Spaziergang bei Regen.', have: any(function (x) { return x.slot === 'outer' && x.water && x.w <= 3.5; }) },
      { id: 'warm', name: 'Warme Winterjacke oder Mantel', why: 'Für Tage unter 5 °C.', have: any(function (x) { return x.slot === 'outer' && x.w >= 5; }) },
      { id: 'belt', name: 'Gürtel in Braun und Schwarz', why: 'Muss zur Farbe der Schuhe passen.', have: any(function (x) { return x.type === 'guertel' && x.color === 'braun'; }) && any(function (x) { return x.type === 'guertel' && x.color === 'schwarz'; }) }
    ];
    var cols = [
      { name: 'Kühl', w: { temp: 8, rain: false, snow: false, wind: false, sun: false } },
      { name: 'Mild', w: { temp: 16, rain: false, snow: false, wind: false, sun: false } },
      { name: 'Warm', w: { temp: 25, rain: false, snow: false, wind: false, sun: true } },
      { name: 'Regen', w: { temp: 10, rain: true, snow: false, wind: true, sun: false } }
    ];
    var lvs = levelIds ? AK.LEVELS.filter(function (lv) { return levelIds.indexOf(lv.id) >= 0; }) : AK.LEVELS;
    var cells = lvs.map(function (lv) {
      return cols.map(function (col) {
        var ctx = { level: lv.id, weather: col.w, transport: 'oepnv', factors: [], must: [], boldness: 1, seed: 1, today: today };
        var info = AK.enumerate(av, ctx, { cap: 5 });
        if (info.missing || !info.combos.length) return 0;
        var best = info.combos[0].total;
        return best >= 0.85 ? 2 : (best >= 0.6 ? 1 : 0);
      });
    });
    return { basics: basics, matrix: { levels: lvs, cols: cols.map(function (c) { return c.name; }), cells: cells } };
  };
})(typeof AK !== 'undefined' ? AK : (global.AK = require('./data.js')));

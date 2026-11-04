/* ===== Ankleide: Oberfläche, Teil 3 (Tab „Heute“) ===== */
/* Annahme: typische Tageshöchstwerte in Konstanz je Monat als Startwert für die Temperatur */
var MONTH_TEMP = [3, 5, 10, 14, 19, 22, 24, 24, 19, 14, 8, 4];

function defaultCtx() {
  var t = MONTH_TEMP[new Date().getMonth()];
  return { level: 2, temp: t, rain: false, snow: false, wind: false, sun: t >= 20, season: 'auto', transport: 'oepnv',
    factors: [], activity: 'alltag', boldness: 1, onlyBasics: false, must: [], seed: 1 };
}
V.ctx = defaultCtx();
V.avoid = [];
V.preSportLevel = null;

function seasonOf(c) { return c.season === 'auto' ? AK.seasonFor(c.temp, new Date().getMonth() + 1) : c.season; }
function engineCtx(c, over) {
  var x = {
    level: c.level, weather: { temp: c.temp, rain: !!c.rain, snow: !!c.snow, wind: !!c.wind, sun: !!c.sun },
    transport: c.transport, factors: c.factors.slice(), must: c.must.map(function (m) { return Object.assign({}, m); }),
    boldness: c.boldness, onlyBasics: !!c.onlyBasics, seed: c.seed, today: todayStr(), activity: c.activity, season: seasonOf(c)
  };
  if (over) for (var k in over) x[k] = over[k];
  return x;
}
function isSportAct(id) { var a = AK.ACT[id] || {}; return a.level === 0; }
function mustLabel(m) {
  if (m.kind === 'item') { var it = m.item || itemById(m.id); return it ? it.name : 'Teil'; }
  return typeLabel(m.type) + (m.color ? ' · ' + cname(m.color) : '');
}
function mustSlot(m) {
  if (m.kind === 'item') { var it = m.item || itemById(m.id); return it ? it.slot : null; }
  return AK.TYPES[m.type] ? AK.TYPES[m.type].slot : null;
}
function isWishedFor(ctx) {
  return function (x) {
    return (ctx.must || []).some(function (m) {
      return (m.kind === 'item' && (m.id === x.id || (m.item && m.item.id === x.id))) ||
        (m.kind === 'type' && m.type === x.type && (!m.color || m.color === x.color));
    });
  };
}
/* Ein Wunsch je Slot (außer Accessoires): ein neuer Wunsch ersetzt den alten im selben Slot */
function addMust(m) {
  var slot = mustSlot(m), replaced = null;
  V.ctx.must = V.ctx.must.filter(function (x) {
    var same = (x.kind === m.kind) && (m.kind === 'item' ? (x.id && x.id === m.id) : (x.type === m.type && (x.color || '') === (m.color || '')));
    if (same) return false;
    if (slot && slot !== 'acc' && mustSlot(x) === slot) { replaced = mustLabel(x); return false; }
    return true;
  });
  V.ctx.must.push(m);
  return replaced;
}
function hasMustItem(id) { return V.ctx.must.some(function (m) { return m.kind === 'item' && m.id === id; }); }
function removeMust(i) { V.ctx.must.splice(i, 1); todayChanged(); }

var TU = [], recalcTimer = null;
function todayChanged(now) {
  V.avoid = [];
  TU.forEach(function (f) { f(); });
  clearTimeout(recalcTimer);
  if (now) recalc(); else recalcTimer = setTimeout(recalc, 120);
}

registerPanel('today', {
  build: function (p) {
    clear(p); TU = [];
    var c = V.ctx;
    var banner = demoBanner(); TU.push(banner.upd);

    /* Dresscode als Maßband */
    var tape = h('div', { class: 'tape', role: 'group', 'aria-label': 'Dresscode-Stufe' });
    AK.LEVELS.forEach(function (lv) {
      tape.append(h('button', { type: 'button', 'aria-pressed': 'false', 'aria-label': 'Stufe ' + lv.id + ': ' + lv.name,
        onclick: function () { c.level = lv.id; if (!isSportAct(c.activity)) V.preSportLevel = null; todayChanged(); } },
        h('span', { class: 'n' }, lv.id), h('span', { class: 'l' }, SHORT[lv.id])));
    });
    var lvName = h('div', { class: 'lvl-name' }), lvHint = h('div', { class: 'muted small lvl-hint' });
    TU.push(function () {
      Array.prototype.forEach.call(tape.children, function (b, i) { b.setAttribute('aria-pressed', i === c.level ? 'true' : 'false'); });
      lvName.textContent = levelName(c.level);
      lvHint.textContent = AK.LEVELS[c.level].hint;
    });

    /* Wetter */
    var presets = h('div', { class: 'chips', role: 'group', 'aria-label': 'Wetter-Vorlagen' });
    AK.WEATHER_PRESETS.forEach(function (w) {
      presets.append(h('button', { class: 'chip', type: 'button', 'aria-pressed': 'false', onclick: function () {
        c.temp = w.temp; c.rain = w.rain; c.snow = w.snow; c.wind = w.wind; c.sun = w.sun; todayChanged();
      } }, w.name, h('span', { class: 'ct' }, fmtT(w.temp))));
    });
    var tempOut = h('output', { class: 'temp', for: 'today-temp', id: 'today-temp-out' });
    var range = h('input', { type: 'range', id: 'today-temp', min: '-10', max: '38', step: '1', 'aria-label': 'Temperatur in Grad Celsius' });
    range.value = String(c.temp);
    range.addEventListener('input', function () { c.temp = Number(range.value); tempOut.textContent = fmtT(c.temp); updFeels(); updPresets(); });
    range.addEventListener('change', function () { c.temp = Number(range.value); todayChanged(); });
    var feels = h('div', { class: 'mono feels' });
    function updFeels() {
      var t = AK._int.effTemp(engineCtx(c));
      feels.textContent = 'Gefühlt ' + fmtT(t) + ' · ' + seasonName(seasonOf(c));
    }
    function updPresets() {
      Array.prototype.forEach.call(presets.children, function (b, i) {
        var w = AK.WEATHER_PRESETS[i];
        b.setAttribute('aria-pressed', (w.temp === c.temp && w.rain === !!c.rain && w.snow === !!c.snow && w.wind === !!c.wind && w.sun === !!c.sun) ? 'true' : 'false');
      });
    }
    var wx = chipGroup([{ id: 'rain', label: 'Regen' }, { id: 'snow', label: 'Schnee' }, { id: 'wind', label: 'Wind' }, { id: 'sun', label: 'Sonnig' }],
      function (k) { return !!c[k]; }, function (k) { c[k] = !c[k]; todayChanged(); }, 'Wetterlage');
    var seasonBtns = chipGroup([{ id: 'auto', label: 'Auto' }].concat(AK.SEASONS.map(function (s) { return { id: s.id, label: s.name }; })),
      function (k) { return c.season === k; }, function (k) { c.season = k; todayChanged(); }, 'Jahreszeit');
    var autoBtn = seasonBtns.firstChild;
    TU.push(function () {
      range.value = String(c.temp); tempOut.textContent = fmtT(c.temp);
      updFeels(); updPresets(); wx.upd(); seasonBtns.upd();
      autoBtn.firstChild.textContent = 'Auto (' + seasonName(AK.seasonFor(c.temp, new Date().getMonth() + 1)) + ')';
    });

    /* Unterwegs */
    var trans = seg(AK.TRANSPORT.map(function (t) { return { id: t.id, label: t.name }; }), function () { return c.transport; },
      function (v) { c.transport = v; todayChanged(); }, 'Fortbewegung');
    var actSel = h('select', { id: 'today-activity', 'aria-label': 'Aktivität' });
    AK.ACTIVITIES.forEach(function (a) { actSel.append(h('option', { value: a.id }, a.name + (a.level === 0 ? ' (Sport)' : ''))); });
    actSel.addEventListener('change', function () {
      var was = c.activity; c.activity = actSel.value;
      if (isSportAct(c.activity) && !isSportAct(was)) { V.preSportLevel = c.level; c.level = 0; toast('Für ' + actName(c.activity) + ' stelle ich auf „Sportlich“.'); }
      else if (!isSportAct(c.activity) && isSportAct(was) && V.preSportLevel != null) { c.level = V.preSportLevel; V.preSportLevel = null; }
      todayChanged();
    });
    var factors = chipGroup(AK.FACTORS.map(function (f) { return { id: f.id, label: f.name }; }),
      function (k) { return c.factors.indexOf(k) >= 0; },
      function (k) { var i = c.factors.indexOf(k); if (i >= 0) c.factors.splice(i, 1); else c.factors.push(k); todayChanged(); }, 'Weitere Faktoren');
    TU.push(function () { trans.upd(); actSel.value = c.activity; factors.upd(); });

    /* Stil */
    var bold = seg([{ id: 0, label: 'Sicher' }, { id: 1, label: 'Ausgewogen' }, { id: 2, label: 'Mutig' }], function () { return c.boldness; },
      function (v) { c.boldness = v; todayChanged(); }, 'Farbmut');
    var basics = checkbox('today-basics', 'Nur Basics', function () { return c.onlyBasics; }, function (v) { c.onlyBasics = v; todayChanged(); });
    TU.push(function () { bold.upd(); basics.upd(); });

    /* Das soll rein */
    var mustBox = h('div', { class: 'chips' });
    TU.push(function () {
      clear(mustBox);
      if (!c.must.length) mustBox.append(h('span', { class: 'muted small' }, 'Kein Wunschteil. Ankleide wählt frei aus deinem Schrank.'));
      c.must.forEach(function (m, i) {
        var lbl = mustLabel(m);
        mustBox.append(h('span', { class: 'chip static mustchip' },
          h('span', { class: 'mono' }, m.kind === 'type' ? 'Art' : (m.item && !itemById(m.item.id) ? 'Scan' : 'Teil')), lbl,
          h('button', { type: 'button', 'aria-label': lbl + ' entfernen', onclick: function () { removeMust(i); } }, ico('x'))));
      });
    });
    var addMustBtn = h('button', { class: 'btn ghost', type: 'button', onclick: openMustSheet }, ico('plus'), 'Wunschteil wählen');

    /* Aktionen und Ergebnis */
    var res = h('div', { class: 'results stack', id: 'today-results', 'aria-live': 'polite' });
    var go = h('button', { class: 'btn accent block', type: 'button', id: 'btn-suggest', onclick: function () { recalc(); scrollToEl(res); } }, 'Outfits vorschlagen');
    var again = h('button', { class: 'btn ghost block', type: 'button', id: 'btn-reroll', onclick: reroll }, ico('dice'), 'Nochmal würfeln');

    p.append(
      banner,
      sec('Anlass · Dresscode', h('div', null, tape, lvName, lvHint)),
      sec('Wetter', h('div', { class: 'stack' }, presets,
        h('div', { class: 'tempbox' }, tempOut, h('div', null, range, h('div', { class: 'range-scale mono', 'aria-hidden': 'true' }, h('span', null, '−10'), h('span', null, '14'), h('span', null, '38'))), feels),
        wx, h('div', { class: 'stack', style: 'gap:6px' }, h('span', { class: 'flabel' }, 'Jahreszeit'), seasonBtns))),
      sec('Unterwegs', h('div', { class: 'stack' }, trans,
        h('label', { class: 'field', for: 'today-activity' }, h('span', null, 'Aktivität'), actSel), factors)),
      sec('Stil', h('div', { class: 'stack' }, bold, basics)),
      sec('Das soll rein', h('div', { class: 'stack' }, mustBox, h('div', null, addMustBtn))),
      h('div', { class: 'sec stack' }, go, again),
      res
    );
    TU.forEach(function (f) { f(); });
    if (S.ready) recalc();
    else res.append(h('div', { class: 'empty' }, 'Dein Schrank wird geladen …'));
  },
  refresh: function () {
    TU.forEach(function (f) { f(); });
    var r = V.results;
    if (S.ready && (!r || V.needsRecalc || r.empty || r.res.missing || !r.res.outfits.length)) recalc();
  }
});

function reroll() {
  if (V.results && V.results.res.outfits.length) {
    V.results.res.outfits.forEach(function (o) { if (V.avoid.indexOf(o.key) < 0) V.avoid.push(o.key); });
  }
  V.ctx.seed++;
  recalc(true);
  scrollToEl($('today-results'));
}

function recalc(keepAvoid) {
  clearTimeout(recalcTimer);
  var box = $('today-results'); if (!box) return;
  V.needsRecalc = false;
  if (!keepAvoid) V.avoid = [];
  var W = wardrobe();
  clear(box);
  if (!W.length) {
    V.results = { empty: true, res: { outfits: [], warns: [], missing: null } };
    box.append(h('div', { class: 'card empty stack' },
      h('h3', null, 'Dein Schrank ist noch leer'),
      h('p', { style: 'margin:0' }, 'Lege ein paar Teile an oder fotografiere sie. Für Vorschläge brauchst du mindestens ein Oberteil, eine Hose und Schuhe.'),
      h('div', { class: 'row', style: 'justify-content:center' },
        h('button', { class: 'btn', type: 'button', onclick: function () { showTab('closet'); openEditor(null); } }, ico('plus'), 'Teil anlegen'),
        h('button', { class: 'btn ghost', type: 'button', onclick: function () { showTab('scan'); } }, ico('cam'), 'Foto scannen'),
        h('button', { class: 'btn ghost', type: 'button', onclick: function () { Store.setSetting('demoOff', false); changed(); } }, 'Beispielschrank zeigen'))));
    return;
  }
  var ctx = engineCtx(V.ctx);
  var r = AK.suggest(W, ctx, { n: 3, cap: 8, avoid: V.avoid });
  if (!r.missing && !r.outfits.length && V.avoid.length) {
    V.avoid = [];
    r = AK.suggest(W, ctx, { n: 3, cap: 8 });
    toast('Alle Varianten gezeigt. Es geht wieder von vorn los.');
  }
  V.results = { res: r, ctx: ctx };
  var summary = [levelName(ctx.level), fmtT(ctx.weather.temp)];
  ['rain', 'snow', 'wind', 'sun'].forEach(function (k) { if (ctx.weather[k]) summary.push({ rain: 'Regen', snow: 'Schnee', wind: 'Wind', sun: 'Sonne' }[k]); });
  summary.push(trName(ctx.transport));
  if (ctx.activity && ctx.activity !== 'alltag') summary.push(actName(ctx.activity));
  box.append(h('div', { class: 'res-head' }, h('h2', { class: 'mono' }, 'Vorschläge'),
    h('span', { class: 'mono' }, r.total ? fmtN(r.total) + ' Kombinationen geprüft' : '')));
  box.append(h('div', { class: 'small muted' }, summary.join(' · ') + (isDemo() ? ' · aus dem Beispielschrank' : '')));
  if (r.missing) {
    box.append(h('div', { class: 'card stack' },
      h('b', null, 'Dir fehlen noch: ' + r.missing.join(', ') + '.'),
      h('span', { class: 'muted small' }, ctx.onlyBasics ? 'Mit „Nur Basics“ bleiben zu wenige Teile übrig. Schalte den Filter aus oder markiere mehr Teile als Basic.'
        : 'Für ein Outfit braucht Ankleide mindestens ein Oberteil, eine Hose und Schuhe, die verfügbar sind (nicht in der Wäsche, nicht „Nie tragen“).'),
      h('div', null, h('button', { class: 'btn', type: 'button', onclick: function () { showTab('closet'); openEditor(null); } }, ico('plus'), 'Teil anlegen'))));
  }
  if (r.warns.length) {
    var ul = h('ul', { class: 'notes' });
    r.warns.forEach(function (w) { ul.append(h('li', { class: 'w' }, w)); });
    box.append(h('div', { class: 'alert' }, ul));
  }
  if (!r.missing && !r.outfits.length) box.append(h('div', { class: 'empty' }, 'Keine passende Kombination gefunden. Ändere die Stufe oder nimm Wunschteile heraus.'));
  var wished = isWishedFor(ctx);
  r.outfits.forEach(function (o, i) { box.append(outfitCard(o, { i: i, ctx: ctx, actions: true, wished: wished })); });
}

/* Sheet „Das soll rein“: bestimmtes Teil oder Art (optional mit Farbe) */
function openMustSheet() {
  openSheet('Das soll rein', function (body, close) {
    var mode = 'item';
    var tabs = seg([{ id: 'item', label: 'Bestimmtes Teil' }, { id: 'type', label: 'Art' }], function () { return mode; },
      function (v) { mode = v; draw(); }, 'Art des Wunsches');
    var box = h('div', { class: 'stack' });
    body.append(tabs, box, h('div', { class: 'foot' }, h('button', { class: 'btn accent block', type: 'button', onclick: close }, 'Fertig')));
    function draw() {
      clear(box);
      if (mode === 'item') drawItems(); else drawTypes();
    }
    function drawItems() {
      var W = wardrobe().filter(function (x) { return !x.never; });
      if (!W.length) { box.append(h('div', { class: 'empty' }, 'Noch keine Teile im Schrank.')); return; }
      AK.SLOTS.forEach(function (sl) {
        var list = W.filter(function (x) { return x.slot === sl.id; });
        if (!list.length) return;
        var g = h('div', { class: 'picks' });
        list.forEach(function (it) {
          var b = h('button', { class: 'pick', type: 'button', 'aria-pressed': hasMustItem(it.id) ? 'true' : 'false' },
            thumbEl(it, { size: 'sm' }),
            h('span', { class: 'pn' }, it.name, h('small', null, typeLabel(it.type) + (it.avail === false ? ' · in der Wäsche' : ''))),
            h('span', { class: 'ck' }));
          function mark() {
            var on = hasMustItem(it.id);
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
            var ck = b.lastChild; clear(ck); if (on) ck.append(ico('check'));
          }
          b.addEventListener('click', function () {
            if (hasMustItem(it.id)) V.ctx.must = V.ctx.must.filter(function (m) { return !(m.kind === 'item' && m.id === it.id); });
            else { var rep = addMust({ kind: 'item', id: it.id }); if (rep) toast('Ersetzt: ' + rep); }
            Array.prototype.forEach.call(box.querySelectorAll('.pick'), function (x) { if (x._mark) x._mark(); });
            todayChanged();
          });
          b._mark = mark; mark();
          g.append(b);
        });
        box.append(h('div', { class: 'stack', style: 'gap:6px' }, h('h3', { class: 'mono' }, sl.name), g));
      });
    }
    function drawTypes() {
      var W = wardrobe();
      var chosen = null, color = '';
      var detail = h('div', { class: 'stack' });
      box.append(h('p', { class: 'muted small', style: 'margin:0' }, 'Zum Beispiel „eine Jeans“ oder „ein Sakko in Navy“. Ankleide nimmt das passendste Teil dieser Art.'));
      AK.SLOTS.forEach(function (sl) {
        var types = Object.keys(AK.TYPES).filter(function (k) { return AK.TYPES[k].slot === sl.id; });
        var g = h('div', { class: 'chips', role: 'group', 'aria-label': sl.name });
        types.forEach(function (k) {
          var n = W.filter(function (x) { return x.type === k && !x.never; }).length;
          var b = h('button', { class: 'chip' + (n ? '' : ' dim'), type: 'button', 'aria-pressed': 'false', 'data-k': k,
            onclick: function () { chosen = k; color = ''; Array.prototype.forEach.call(box.querySelectorAll('[data-k]'), function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-k') === k ? 'true' : 'false'); }); drawDetail(); } },
            AK.TYPES[k].label, h('span', { class: 'ct' }, n));
          g.append(b);
        });
        box.append(h('div', { class: 'stack', style: 'gap:6px' }, h('h3', { class: 'mono' }, sl.name), g));
      });
      box.append(detail);
      function drawDetail() {
        clear(detail);
        if (!chosen) return;
        var cols = [];
        W.forEach(function (x) { if (x.type === chosen && !x.never && cols.indexOf(x.color) < 0) cols.push(x.color); });
        var sw = h('div', { class: 'swatches', role: 'group', 'aria-label': 'Farbe' });
        var anyBtn = h('button', { class: 'chip', type: 'button', 'aria-pressed': 'true', onclick: function () { color = ''; upd(); } }, 'Farbe egal');
        cols.forEach(function (cid) {
          sw.append(h('button', { class: 'sw', type: 'button', style: '--c:' + hex(cid), 'aria-label': cname(cid), title: cname(cid), 'data-c': cid, 'aria-pressed': 'false',
            onclick: function () { color = cid; upd(); } }));
        });
        function upd() {
          anyBtn.setAttribute('aria-pressed', color ? 'false' : 'true');
          Array.prototype.forEach.call(sw.children, function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-c') === color ? 'true' : 'false'); });
        }
        detail.append(h('div', { class: 'card stack' },
          h('b', null, AK.TYPES[chosen].label),
          cols.length ? h('div', { class: 'stack', style: 'gap:8px' }, h('span', { class: 'flabel' }, 'Farbe (optional)'), h('div', { class: 'row' }, anyBtn), sw)
            : h('span', { class: 'muted small' }, 'Davon hast du noch nichts im Schrank. Ankleide meldet das bei den Vorschlägen.'),
          h('button', { class: 'btn', type: 'button', onclick: function () {
            var rep = addMust(color ? { kind: 'type', type: chosen, color: color } : { kind: 'type', type: chosen });
            toast((rep ? 'Ersetzt: ' + rep + '. ' : '') + 'Wunsch hinzugefügt: ' + typeLabel(chosen) + (color ? ' in ' + cname(color) : ''));
            todayChanged(); close();
          } }, ico('plus'), 'Als Wunsch hinzufügen')));
        upd();
      }
    }
    draw();
  });
}

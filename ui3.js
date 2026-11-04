/* ===== Ankleide: Oberfläche, Teil 3 (Tab „Heute“) ===== */
/* Annahme: typische Tageshöchstwerte in Konstanz je Monat als Startwert, solange kein Live-Wetter da ist */
var MONTH_TEMP = [3, 5, 10, 14, 19, 22, 24, 24, 19, 14, 8, 4];
var CONDS = [
  { id: 'sonne', label: 'Sonnig', icon: 'sun' }, { id: 'wolken', label: 'Bewölkt', icon: 'cloud' },
  { id: 'regen', label: 'Regen', icon: 'rain' }, { id: 'schnee', label: 'Schnee', icon: 'snow' }
];

function defaultCtx() {
  var t = MONTH_TEMP[new Date().getMonth()];
  return { level: 2, temp: t, cond: t >= 20 ? 'sonne' : 'wolken', wind: false, day: 0, wxAuto: true, transport: 'oepnv',
    factors: [], activity: 'alltag', boldness: 1, onlyBasics: false, must: [], seed: 1 };
}
V.ctx = defaultCtx();
V.avoid = [];

function ctxDate(c) { return addDays(todayStr(), c.day || 0); }
function seasonOf(c) { return AK.seasonFor(c.temp, Number(ctxDate(c).slice(5, 7))); }
function weatherOf(c) { return { temp: c.temp, rain: c.cond === 'regen', snow: c.cond === 'schnee', wind: !!c.wind, sun: c.cond === 'sonne' }; }
function engineCtx(c, over) {
  var x = {
    level: c.level, weather: weatherOf(c), transport: c.transport, factors: c.factors.slice(),
    must: c.must.map(function (m) { return Object.assign({}, m); }), boldness: c.boldness, onlyBasics: !!c.onlyBasics,
    seed: c.seed, today: ctxDate(c), activity: c.activity, season: seasonOf(c), pairs: prefPairs()
  };
  if (over) for (var k in over) x[k] = over[k];
  return x;
}
function actRange(id) { var a = AK.ACT[id] || {}; return a.range || null; }
function rangeText(r) { return r[0] === r[1] ? levelName(r[0]) : levelName(r[0]) + ' bis ' + levelName(r[1]); }
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
/* Ein Wunsch je Bereich (außer Accessoires): ein neuer Wunsch ersetzt den alten im selben Bereich */
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

/* ---------- Live-Wetter (nur eigenständige Fassung; im Artifact blockiert claude.ai externe Abrufe) ---------- */
var WX = { state: 'idle', days: null, at: 0, place: null };
var DEFAULT_PLACE = { name: 'Konstanz', lat: 47.6603, lon: 9.1758, region: 'Baden-Württemberg, Deutschland' };
function wxEnabled() { return !IN_CLAUDE && typeof fetch === 'function' && S.settings.wxLive !== false; }
function wxPlace() { var p = S.settings.wxPlace; return p && isFinite(p.lat) && isFinite(p.lon) ? p : DEFAULT_PLACE; }
function wxCond(code, pop, snow) {
  if ([71, 73, 75, 77, 85, 86].indexOf(code) >= 0 || snow > 0.5) return 'schnee';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95 || pop >= 60) return 'regen';
  if (code <= 1) return 'sonne';
  return 'wolken';
}
function wxParse(d) {
  var D = d.daily, out = [];
  for (var i = 0; i < Math.min(2, D.time.length); i++) {
    out.push({ date: D.time[i], tmax: Math.round(D.temperature_2m_max[i]), tmin: Math.round(D.temperature_2m_min[i]),
      cond: wxCond(D.weather_code[i], (D.precipitation_probability_max || [])[i] || 0, (D.snowfall_sum || [])[i] || 0),
      wind: ((D.wind_speed_10m_max || [])[i] || 0) >= 28, pop: (D.precipitation_probability_max || [])[i] || 0 });
  }
  return out;
}
function wxLoad(force) {
  if (!wxEnabled()) { WX.state = 'off'; return; }
  var pl = wxPlace(), key = pl.lat.toFixed(3) + ',' + pl.lon.toFixed(3);
  if (!force) {
    try {
      var c = JSON.parse(localStorage.getItem('ankleide.wx') || 'null');
      if (c && c.key === key && Date.now() - c.at < 30 * 60000 && c.days && c.days[0].date === todayStr()) {
        WX.state = 'ok'; WX.days = c.days; WX.at = c.at; WX.place = pl; wxApply(); return;
      }
    } catch (e) {}
  }
  WX.state = 'loading'; wxRender();
  var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + pl.lat + '&longitude=' + pl.lon +
    '&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,snowfall_sum,wind_speed_10m_max&timezone=auto&forecast_days=2';
  fetch(url).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then(function (d) {
    WX.days = wxParse(d); WX.at = Date.now(); WX.place = pl; WX.state = 'ok';
    try { localStorage.setItem('ankleide.wx', JSON.stringify({ key: key, at: WX.at, days: WX.days })); } catch (e) {}
    if (force) V.ctx.wxAuto = true;
    wxApply();
  }).catch(function () { WX.state = 'error'; wxRender(); });
}
function wxApply() {
  var c = V.ctx, d = WX.days && WX.days[c.day || 0];
  if (d && c.wxAuto) {
    var changedW = c.temp !== d.tmax || c.cond !== d.cond || c.wind !== d.wind;
    c.temp = d.tmax; c.cond = d.cond; c.wind = d.wind;
    if (changedW && TU.length) { todayChanged(false, true); return; }
  }
  wxRender();
}
var wxRender = function () {};

var TU = [], recalcTimer = null, jumpTimer = null;
function todayChanged(now, quiet) {
  V.avoid = [];
  TU.forEach(function (f) { f(); });
  clearTimeout(recalcTimer);
  if (now) recalc(); else recalcTimer = setTimeout(function () { recalc(); if (!quiet) showJump(); }, 120);
}
/* Zeigt kurz „Vorschläge ansehen“, wenn die Vorschläge gerade nicht im Blick sind */
function showJump() {
  var res = $('today-results'), j = $('jump');
  if (!res || !j || V.tab !== 'today') return;
  var r = res.getBoundingClientRect();
  if (r.top < window.innerHeight - 140) { j.hidden = true; return; }
  j.hidden = false; clearTimeout(jumpTimer);
  jumpTimer = setTimeout(function () { j.hidden = true; }, 4500);
}

registerPanel('today', {
  build: function (p) {
    clear(p); TU = [];
    var c = V.ctx;
    var banner = demoBanner(); TU.push(banner.upd);

    /* Anlass: Dresscode als Maßband plus Aktivität */
    var tape = h('div', { class: 'tape t5', role: 'group', 'aria-label': 'Dresscode' });
    LV.forEach(function (L) {
      tape.append(h('button', { type: 'button', 'aria-pressed': 'false', 'data-l': String(L), 'aria-label': levelName(L),
        onclick: function () { c.level = L; todayChanged(); } },
        h('span', { class: 'n' }, L), h('span', { class: 'l' }, AK.LEVEL_SHORT[L])));
    });
    var lvName = h('div', { class: 'lvl-name' }), lvHint = h('div', { class: 'muted small lvl-hint' });
    var actSel = h('select', { id: 'today-activity' });
    AK.ACTIVITIES.forEach(function (a) { actSel.append(h('option', { value: a.id }, a.name)); });
    var actHint = h('div', { class: 'muted small' });
    actSel.addEventListener('change', function () {
      c.activity = actSel.value;
      var r = actRange(c.activity);
      if (r && (c.level < r[0] || c.level > r[1])) {
        var to = c.level < r[0] ? r[0] : r[1];
        toast('Für ' + actName(c.activity) + ' passt ' + rangeText(r) + '. Ich stelle auf ' + levelName(to) + '.');
        c.level = to;
      }
      todayChanged();
    });
    TU.push(function () {
      Array.prototype.forEach.call(tape.children, function (b) { b.setAttribute('aria-pressed', Number(b.getAttribute('data-l')) === c.level ? 'true' : 'false'); });
      lvName.textContent = levelName(c.level);
      lvHint.textContent = AK.LEVELS[c.level].hint;
      actSel.value = c.activity;
      var r = actRange(c.activity);
      actHint.textContent = r ? 'Üblich: ' + rangeText(r) + '.' : '';
      actHint.hidden = !r;
    });

    /* Wetter: Tag, Temperatur, Wetterlage, Wind */
    var day = seg([{ id: 0, label: 'Heute' }, { id: 1, label: 'Morgen' }], function () { return c.day; },
      function (v) { c.day = v; if (WX.days) { c.wxAuto = true; var d = WX.days[v]; if (d) { c.temp = d.tmax; c.cond = d.cond; c.wind = d.wind; } } todayChanged(); }, 'Für welchen Tag');
    day.classList.add('day-seg');
    var tempOut = h('output', { class: 'temp', id: 'today-temp-out', for: 'today-temp' });
    var range = h('input', { type: 'range', id: 'today-temp', min: '-10', max: '38', step: '1', 'aria-label': 'Temperatur tagsüber in Grad Celsius' });
    function manual() { c.wxAuto = false; }
    function setTemp(t) { c.temp = Math.max(-10, Math.min(38, t)); manual(); todayChanged(); }
    range.addEventListener('input', function () { c.temp = Number(range.value); tempOut.textContent = fmtT(c.temp); });
    range.addEventListener('change', function () { setTemp(Number(range.value)); });
    var minus = h('button', { class: 'btn ghost icon', type: 'button', 'aria-label': 'Ein Grad kälter', onclick: function () { setTemp(c.temp - 1); } }, ico('minus'));
    var plus = h('button', { class: 'btn ghost icon', type: 'button', 'aria-label': 'Ein Grad wärmer', onclick: function () { setTemp(c.temp + 1); } }, ico('plus'));
    var conds = h('div', { class: 'conds', role: 'group', 'aria-label': 'Wetterlage' });
    CONDS.forEach(function (w) {
      conds.append(h('button', { class: 'cond', type: 'button', 'data-v': w.id, 'aria-pressed': 'false', onclick: function () { c.cond = w.id; manual(); todayChanged(); } },
        ico(w.icon), h('span', null, w.label)));
    });
    var windBtn = h('button', { class: 'cond', type: 'button', id: 'today-wind', 'aria-pressed': 'false', onclick: function () { c.wind = !c.wind; manual(); todayChanged(); } }, ico('wind'), h('span', null, 'Windig'));
    conds.append(windBtn);
    var feels = h('div', { class: 'mono feels' });
    var live = h('div', { class: 'wxline' });
    wxRender = function () {
      clear(live);
      if (!wxEnabled()) {
        live.append(h('span', { class: 'muted small' }, IN_CLAUDE ? 'Stell das Wetter hier selbst ein. Live-Wetter gibt es in der eigenständigen Fassung.' : 'Live-Wetter ist ausgeschaltet (Mehr → Einstellungen).'));
        return;
      }
      var pl = wxPlace(), d = WX.days && WX.days[c.day || 0];
      var info = h('span', { class: 'small' }, ico('pin'), h('b', null, pl.name), ' ');
      if (WX.state === 'loading') info.append(h('span', { class: 'muted' }, 'Wetter wird geladen …'));
      else if (WX.state === 'error') info.append(h('span', { class: 'warn-t' }, 'Wetter nicht abrufbar (offline?). Stell es selbst ein.'));
      else if (d) {
        info.append(h('span', { class: 'muted' }, (c.day ? 'Morgen ' : 'Heute ') + fmtT(d.tmax) + ' / ' + fmtT(d.tmin) + (d.pop >= 30 ? ' · Regen ' + d.pop + ' %' : '')));
        if (!c.wxAuto) info.append(h('span', { class: 'muted' }, ' · eigene Angabe'));
      }
      live.append(info, h('button', { class: 'btn ghost small', type: 'button', id: 'wx-reload', onclick: function () { wxLoad(true); } }, ico('refresh'), c.wxAuto || !WX.days ? 'Neu laden' : 'Live-Wetter nehmen'));
    };
    TU.push(function () {
      day.upd();
      range.value = String(c.temp); tempOut.textContent = fmtT(c.temp);
      Array.prototype.forEach.call(conds.querySelectorAll('[data-v]'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-v') === c.cond ? 'true' : 'false'); });
      windBtn.setAttribute('aria-pressed', c.wind ? 'true' : 'false');
      var t = AK._int.effTemp(engineCtx(c));
      feels.textContent = 'Gefühlt ' + fmtT(t) + ' · ' + seasonName(seasonOf(c)) + (c.day ? ' · ' + deDate(ctxDate(c)) : '');
      wxRender();
    });

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
    var addMustBtn = h('button', { class: 'btn ghost', type: 'button', id: 'btn-must', onclick: openMustSheet }, ico('plus'), 'Wunschteil wählen');

    /* Unterwegs und Stil, eingeklappt */
    var trans = seg(AK.TRANSPORT.map(function (t) { return { id: t.id, label: t.name }; }), function () { return c.transport; },
      function (v) { c.transport = v; todayChanged(); }, 'Fortbewegung');
    var factors = chipGroup(AK.FACTORS.map(function (f) { return { id: f.id, label: f.name }; }),
      function (k) { return c.factors.indexOf(k) >= 0; },
      function (k) { var i = c.factors.indexOf(k); if (i >= 0) c.factors.splice(i, 1); else c.factors.push(k); todayChanged(); }, 'Weitere Faktoren');
    var bold = seg([{ id: 0, label: 'Sicher' }, { id: 1, label: 'Ausgewogen' }, { id: 2, label: 'Mutig' }], function () { return c.boldness; },
      function (v) { c.boldness = v; todayChanged(); }, 'Farbmut');
    var basics = checkbox('today-basics', 'Nur Basics', function () { return c.onlyBasics; }, function (v) { c.onlyBasics = v; todayChanged(); });
    var moreSum = h('span', { class: 'muted small' });
    var more = h('details', { class: 'sec more-opts', id: 'today-more' },
      h('summary', null, h('span', { class: 'mono' }, 'Unterwegs & Stil'), moreSum),
      h('div', { class: 'stack' },
        h('div', { class: 'stack', style: 'gap:6px' }, h('span', { class: 'flabel' }, 'Fortbewegung'), trans),
        h('div', { class: 'stack', style: 'gap:6px' }, h('span', { class: 'flabel' }, 'Außerdem'), factors),
        h('div', { class: 'stack', style: 'gap:6px' }, h('span', { class: 'flabel' }, 'Farbmut'), bold), basics));
    TU.push(function () {
      trans.upd(); factors.upd(); bold.upd(); basics.upd();
      var bits = [trName(c.transport), ['Sicher', 'Ausgewogen', 'Mutig'][c.boldness]];
      if (c.factors.length) bits.push(c.factors.length + ' Faktor' + (c.factors.length > 1 ? 'en' : ''));
      if (c.onlyBasics) bits.push('nur Basics');
      moreSum.textContent = bits.join(' · ');
    });

    var res = h('div', { class: 'results stack', id: 'today-results', 'aria-live': 'polite' });
    var jump = h('button', { class: 'jump', id: 'jump', type: 'button', hidden: true, onclick: function () { jump.hidden = true; scrollToEl(res); } }, 'Vorschläge ansehen', ico('down'));

    p.append(banner, h('div', { class: 'today-form' },
      sec('Anlass', h('div', { class: 'stack', style: 'gap:10px' },
        h('div', null, tape, lvName, lvHint),
        h('label', { class: 'field', for: 'today-activity' }, h('span', null, 'Was hast du vor?'), actSel), actHint)),
      h('section', { class: 'sec' }, h('div', { class: 'res-head' }, h('h2', { class: 'mono' }, 'Wetter'), day),
        h('div', { class: 'stack', style: 'gap:10px' },
          h('div', { class: 'tempbox2' }, minus, tempOut, plus, h('div', { class: 'grow' }, range)),
          conds, feels, live)),
      sec('Das soll rein', h('div', { class: 'stack' }, mustBox, h('div', null, addMustBtn))),
      more),
      h('div', { class: 'today-res sec' }, res), jump);
    TU.forEach(function (f) { f(); });
    if (S.ready) recalc();
    else res.append(h('div', { class: 'empty' }, 'Dein Schrank wird geladen …'));
    wxLoad(false);
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
  var avoid = V.avoid.concat(prefAvoid());
  var r = AK.suggest(W, ctx, { n: 3, cap: 8, avoid: avoid });
  if (!r.missing && !r.outfits.length && V.avoid.length) {
    V.avoid = [];
    r = AK.suggest(W, ctx, { n: 3, cap: 8, avoid: prefAvoid() });
    toast('Alle Varianten gezeigt. Es geht wieder von vorn los.');
  }
  V.results = { res: r, ctx: ctx };
  var summary = [levelName(ctx.level), fmtT(ctx.weather.temp), (CONDS.filter(function (x) { return x.id === V.ctx.cond; })[0] || {}).label];
  if (ctx.weather.wind) summary.push('windig');
  if (V.ctx.day) summary.push('morgen');
  if (ctx.activity && ctx.activity !== 'alltag') summary.push(actName(ctx.activity));
  box.append(h('div', { class: 'res-head' }, h('h2', { class: 'mono' }, 'Vorschläge'),
    h('button', { class: 'btn ghost small', type: 'button', id: 'btn-reroll', onclick: reroll }, ico('dice'), 'Nochmal würfeln')));
  box.append(h('div', { class: 'small muted' }, summary.filter(Boolean).join(' · ') + (r.total ? ' · ' + fmtN(r.total) + ' Kombinationen geprüft' : '') + (isDemo() ? ' · Beispielschrank' : '')));
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

/* Sheet „Das soll rein“: bestimmtes Teil oder Art (optional mit Farbe), beides durchsuchbar */
function openMustSheet() {
  openSheet('Das soll rein', function (body, close) {
    var mode = 'item', q = '';
    var tabs = seg([{ id: 'item', label: 'Bestimmtes Teil' }, { id: 'type', label: 'Art' }], function () { return mode; },
      function (v) { mode = v; draw(); }, 'Art des Wunsches');
    var search = h('input', { type: 'search', id: 'must-q', placeholder: 'Suchen, z. B. „blau Hemd“', autocomplete: 'off', 'aria-label': 'Teile durchsuchen' });
    search.addEventListener('input', function () { q = search.value; draw(); });
    var box = h('div', { class: 'stack' });
    body.append(tabs, h('div', { class: 'searchbox' }, ico('search'), search), box,
      h('div', { class: 'foot' }, h('button', { class: 'btn accent block', type: 'button', onclick: close }, 'Fertig')));
    function draw() {
      clear(box);
      if (mode === 'item') drawItems(); else drawTypes();
    }
    function drawItems() {
      var W = wardrobe().filter(function (x) { return !x.never && matchItem(x, q); });
      if (!wardrobe().length) { box.append(h('div', { class: 'empty' }, 'Noch keine Teile im Schrank.')); return; }
      if (!W.length) { box.append(h('div', { class: 'empty' }, 'Nichts gefunden für „' + q + '“.')); return; }
      AK.SLOTS.forEach(function (sl) {
        var list = W.filter(function (x) { return x.slot === sl.id; });
        if (!list.length) return;
        var g = h('div', { class: 'picks' });
        list.forEach(function (it) {
          var b = h('button', { class: 'pick', type: 'button', 'aria-pressed': 'false' },
            thumbEl(it, { size: 'sm' }),
            h('span', { class: 'pn' }, it.name, h('small', null, typeLabel(it.type) + ' · ' + cname(it.color) + (it.avail === false ? ' · in der Wäsche' : ''))),
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
      var W = wardrobe(), qq = normQ(q).trim();
      var chosen = null, color = '';
      var detail = h('div', { class: 'stack' });
      box.append(h('p', { class: 'muted small', style: 'margin:0' }, 'Zum Beispiel „eine Jeans“ oder „ein Sakko in Navy“. Ankleide nimmt das passendste Teil dieser Art.'));
      var any = false;
      AK.SLOTS.forEach(function (sl) {
        var types = Object.keys(AK.TYPES).filter(function (k) {
          if (AK.TYPES[k].slot !== sl.id || k === 'smoking' || k === 'fliege') return false;
          return !qq || qq.split(/\s+/).every(function (t) { return normQ(AK.TYPES[k].label + ' ' + k + ' ' + (TYPE_SYN[k] || '') + ' ' + sl.name).indexOf(t) >= 0; });
        });
        if (!types.length) return;
        any = true;
        var g = h('div', { class: 'chips', role: 'group', 'aria-label': sl.name });
        types.forEach(function (k) {
          var n = W.filter(function (x) { return x.type === k && !x.never; }).length;
          g.append(h('button', { class: 'chip' + (n ? '' : ' dim'), type: 'button', 'aria-pressed': 'false', 'data-k': k,
            onclick: function () { chosen = k; color = ''; Array.prototype.forEach.call(box.querySelectorAll('[data-k]'), function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-k') === k ? 'true' : 'false'); }); drawDetail(); } },
            AK.TYPES[k].label, h('span', { class: 'ct' }, n)));
        });
        box.append(h('div', { class: 'stack', style: 'gap:6px' }, h('h3', { class: 'mono' }, sl.name), g));
      });
      if (!any) box.append(h('div', { class: 'empty' }, 'Keine Art passt zu „' + q + '“.'));
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
        scrollToEl(detail);
      }
    }
    draw();
  });
}

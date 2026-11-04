/* ===== Ankleide: Oberfläche, Teil 5 (Tab „Mehr“: Lücken, Staples, Packen, Woche, Tagebuch, Einstellungen) ===== */
var MORE_SECS = [
  { id: 'gaps', label: 'Lücken' }, { id: 'staples', label: 'Staples' }, { id: 'pack', label: 'Packen' },
  { id: 'week', label: 'Woche' }, { id: 'diary', label: 'Tagebuch' }, { id: 'settings', label: 'Einstellungen' }
];
V.more = {
  sec: 'gaps',
  cap: { days: 3, luggage: 'hand', temp: null, rain: false, levels: [2, 3], activity: 'alltag', res: null },
  plan: { days: 5, wLevel: 4, wAct: 'buero', eLevel: 2, eAct: 'alltag', temp: null, rain: false, res: null }
};
var MO = {};
registerPanel('more', {
  build: function (p) {
    clear(p);
    MO.nav = chipGroup(MORE_SECS, function (k) { return V.more.sec === k; }, function (k) { V.more.sec = k; drawMore(); }, 'Bereiche in Mehr');
    MO.body = h('div', { id: 'more-body' });
    p.append(h('div', { class: 'subnav' }, MO.nav), MO.body);
    drawMore();
  },
  refresh: function (p) {
    if (p.contains(document.activeElement) && /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) return;
    drawMore();
  }
});
function drawMore() {
  MO.nav.upd();
  clear(MO.body);
  if (!S.ready) { MO.body.append(h('div', { class: 'empty' }, 'Dein Schrank wird geladen …')); return; }
  ({ gaps: drawGaps, staples: drawStaples, pack: drawPack, week: drawWeek, diary: drawDiary, settings: drawSettings })[V.more.sec](MO.body);
}
function needItems(box, what) {
  if (wardrobe().length) return false;
  box.append(h('div', { class: 'card empty sec' }, 'Für ' + what + ' braucht Ankleide Teile im Schrank. Lege welche an oder zeige den Beispielschrank (Einstellungen).'));
  return true;
}
function demoNote() { return isDemo() ? h('div', { class: 'mono' }, 'Berechnet mit dem Beispielschrank') : null; }
function levelChips(get, toggle, label) {
  return chipGroup(AK.LEVELS.map(function (lv) { return { id: lv.id, label: SHORT[lv.id] }; }), get, toggle, label);
}
function levelSelect(id, value, onChange) {
  var s = h('select', { id: id });
  AK.LEVELS.forEach(function (lv) { s.append(h('option', { value: String(lv.id) }, lv.name)); });
  s.value = String(value);
  s.addEventListener('change', function () { onChange(Number(s.value)); });
  return s;
}
function actSelect(id, value, onChange) {
  var s = h('select', { id: id });
  AK.ACTIVITIES.forEach(function (a) { s.append(h('option', { value: a.id }, a.name)); });
  s.value = value;
  s.addEventListener('change', function () { onChange(s.value); });
  return s;
}
function tempRange(id, get, set) {
  var out = h('output', { class: 'temp', for: id });
  var r = h('input', { type: 'range', id: id, min: '-10', max: '38', step: '1', 'aria-label': 'Temperatur in Grad Celsius' });
  r.value = String(get()); out.textContent = fmtT(get());
  r.addEventListener('input', function () { set(Number(r.value)); out.textContent = fmtT(Number(r.value)); });
  return h('div', { class: 'tempbox' }, out, r);
}

/* ---------- Lücken ---------- */
function drawGaps(box) {
  if (needItems(box, 'die Lückenanalyse')) return;
  var g = AK.gaps(wardrobe(), todayStr());
  var have = g.basics.filter(function (b) { return b.have; }).length;
  var list = h('div');
  g.basics.forEach(function (b) {
    list.append(h('div', { class: 'todo' }, h('span', { class: 'dot' + (b.have ? ' ok' : ''), role: 'img', 'aria-label': b.have ? 'vorhanden' : 'fehlt' }),
      h('div', null, h('div', { style: b.have ? null : 'font-weight:600' }, b.name), h('div', { class: 'muted small' }, b.why))));
  });
  var mx = h('div', { class: 'matrix', role: 'img', 'aria-label': 'Abdeckung nach Dresscode und Wetter' });
  mx.append(h('span'));
  g.matrix.cols.forEach(function (c) { mx.append(h('span', { class: 'h' }, c)); });
  var words = ['Lücke', 'mit Kompromissen', 'gut abgedeckt'];
  g.matrix.levels.forEach(function (lv, i) {
    mx.append(h('span', { class: 'lv' }, lv.name));
    g.matrix.cells[i].forEach(function (v, j) {
      var t = lv.name + ', ' + g.matrix.cols[j] + ': ' + words[v];
      mx.append(h('span', { class: 'c g' + v, title: t }, h('span', { class: 'vh' }, t)));
    });
  });
  var holes = [];
  g.matrix.levels.forEach(function (lv, i) { g.matrix.cells[i].forEach(function (v, j) { if (v === 0) holes.push(lv.name + ' bei ' + g.matrix.cols[j]); }); });
  box.append(
    sec('Basics', h('div', { class: 'card stack' }, demoNote(),
      h('div', { class: 'kpi' }, h('div', null, h('b', null, have + ' / ' + g.basics.length), h('span', { class: 'mono' }, 'Basics vorhanden'))),
      list)),
    sec('Abdeckung nach Anlass und Wetter', h('div', { class: 'card stack' },
      h('p', { class: 'muted small', style: 'margin:0' }, 'Wie gut findet Ankleide für jede Stufe ein stimmiges Outfit bei 8 °C, 16 °C, 25 °C und Regen?'),
      h('div', { class: 'matrix-wrap' }, mx),
      h('div', { class: 'legend' }, h('span', null, h('i', { class: 'g2' }), 'gut abgedeckt'), h('span', null, h('i', { class: 'g1' }), 'mit Kompromissen'), h('span', null, h('i'), 'Lücke')),
      holes.length ? h('div', { class: 'small' }, h('b', null, 'Lücken: '), holes.join(', ') + '.') : h('div', { class: 'small' }, 'Keine echten Lücken. Gelb heißt: es geht, aber mit Kompromissen.')))
  );
}

/* ---------- Staples ---------- */
function drawStaples(box) {
  if (needItems(box, 'die Staples')) return;
  var st = AK.staples(wardrobe(), todayStr());
  var top = st.rows.slice(0, 10);
  var rank = h('div', { class: 'plist' });
  top.forEach(function (r, i) {
    var bars = h('div', { class: 'minibars' },
      h('span', null, 'Vielseitig', h('span', { class: 'track' }, h('i', { style: 'width:' + Math.round(r.vers * 100) + '%' }))));
    if (st.hasUsage) bars.append(h('span', null, 'Getragen', h('span', { class: 'track' }, h('i', { class: 'alt', style: 'width:' + Math.round(r.wearsN * 100) + '%' }))));
    rank.append(h('div', { class: 'prow ranked' }, h('span', { class: 'rank' }, pad(i + 1)), thumbEl(r.item, { size: 'sm' }),
      h('div', { class: 'pn' }, r.item.name, h('small', null, typeLabel(r.item.type) + (r.item.wears ? ' · ' + r.item.wears + '× getragen' : '')), bars)));
  });
  box.append(sec('Deine Staples', h('div', { class: 'card stack' }, demoNote(),
    h('p', { class: 'muted small', style: 'margin:0' }, st.hasUsage
      ? 'Rangliste aus Vielseitigkeit (wie oft ein Teil in den besten Outfits von Entspannt bis Business Casual bei 8, 15 und 24 °C vorkommt) und wie oft du es wirklich trägst.'
      : 'Rangliste nach Vielseitigkeit: wie oft ein Teil in den besten Outfits von Entspannt bis Business Casual bei 8, 15 und 24 °C vorkommt. Sobald du Outfits als getragen einträgst, zählt auch deine echte Nutzung.'),
    rank)));
  var sl = h('div', { class: 'plist' });
  if (st.sleepers.length) st.sleepers.forEach(function (r) { sl.append(prow(r.item, (r.item.wears || 0) + '×', 'Vielseitig, aber selten getragen')); });
  box.append(sec('Schläfer', h('div', { class: 'card stack' },
    st.sleepers.length ? h('p', { class: 'muted small', style: 'margin:0' }, 'Diese Teile passen zu vielem, du trägst sie aber kaum. Probier sie mal als Wunschteil.') : null,
    st.sleepers.length ? sl : h('div', { class: 'muted small' }, st.hasUsage ? 'Keine Schläfer. Deine vielseitigen Teile sind auch im Einsatz.' : 'Schläfer erkennt Ankleide, sobald du einige Outfits als getragen eingetragen hast.'))));
  if (st.worn.length) {
    var wl = h('div', { class: 'plist' });
    st.worn.forEach(function (x) { wl.append(prow(x, x.wears + '×')); });
    box.append(sec('Am häufigsten getragen', h('div', { class: 'card' }, wl)));
  }
}

/* ---------- Packen (Kapsel) ---------- */
function drawPack(box) {
  if (needItems(box, 'die Packliste')) return;
  var c = V.more.cap;
  if (c.temp == null) c.temp = V.ctx.temp;
  var days = h('input', { type: 'range', id: 'cap-days', min: '1', max: '21', step: '1', 'aria-label': 'Anzahl Tage' });
  var daysOut = h('output', { class: 'temp', for: 'cap-days' });
  days.value = String(c.days); daysOut.textContent = c.days;
  days.addEventListener('input', function () { c.days = Number(days.value); daysOut.textContent = c.days; });
  var form = h('div', { class: 'card stack' },
    h('div', { class: 'stack', style: 'gap:6px' }, h('label', { class: 'flabel', for: 'cap-days' }, 'Tage'), h('div', { class: 'tempbox' }, daysOut, days)),
    seg([{ id: 'hand', label: 'Handgepäck' }, { id: 'koffer', label: 'Koffer' }], function () { return c.luggage; }, function (v) { c.luggage = v; }, 'Gepäck'),
    h('div', { class: 'stack', style: 'gap:6px' }, h('label', { class: 'flabel', for: 'cap-temp' }, 'Temperatur am Ziel (tagsüber)'),
      tempRange('cap-temp', function () { return c.temp; }, function (v) { c.temp = v; })),
    checkbox('cap-rain', 'Regen möglich', function () { return c.rain; }, function (v) { c.rain = v; }),
    h('div', { class: 'stack', style: 'gap:6px' }, h('span', { class: 'flabel' }, 'Dresscode-Stufen auf der Reise'),
      levelChips(function (k) { return c.levels.indexOf(k) >= 0; }, function (k) {
        var i = c.levels.indexOf(k); if (i >= 0) { if (c.levels.length > 1) c.levels.splice(i, 1); } else { c.levels.push(k); c.levels.sort(); }
      }, 'Dresscode-Stufen')),
    labeled('Aktivität', actSelect('cap-act', c.activity, function (v) { c.activity = v; }), 'cap-act'),
    h('button', { class: 'btn accent block', type: 'button', id: 'cap-go', onclick: function () { runCapsule(); drawMore(); var r = $('cap-res'); scrollToEl(r); } }, ico('bag'), 'Kapsel packen'));
  box.append(sec('Packliste · Kapselgarderobe', h('div', { class: 'stack' },
    h('p', { class: 'muted small', style: 'margin:0' }, 'Wenige Teile, möglichst viele gute Outfits. Ankleide sucht die vielseitigsten Teile für deine Reise.'), form)));
  var res = h('div', { id: 'cap-res', class: 'sec stack' });
  box.append(res);
  if (c.res) drawCapsule(res, c.res);
}
function runCapsule() {
  var c = V.more.cap;
  c.res = AK.capsule(wardrobe(), { days: c.days, luggage: c.luggage, temp: c.temp, rain: c.rain, levels: c.levels.slice(), today: todayStr(),
    activity: c.activity, season: AK.seasonFor(c.temp, new Date().getMonth() + 1) });
  c.res.input = { days: c.days, luggage: c.luggage, temp: c.temp, rain: c.rain, levels: c.levels.slice(), activity: c.activity };
}
function drawCapsule(box, r) {
  var inp = r.input;
  box.append(h('div', { class: 'res-head' }, h('h2', { class: 'mono' }, 'Deine Kapsel'),
    h('span', { class: 'mono' }, inp.days + (inp.days === 1 ? ' Tag' : ' Tage') + ' · ' + (inp.luggage === 'hand' ? 'Handgepäck' : 'Koffer') + ' · ' + fmtT(inp.temp) + (inp.rain ? ' · Regen' : ''))));
  box.append(h('div', { class: 'card' }, h('div', { class: 'kpi' },
    h('div', null, h('b', null, r.total), h('span', { class: 'mono' }, 'Teile')),
    h('div', null, h('b', null, fmtN(r.n)), h('span', { class: 'mono' }, 'mögliche Outfits')),
    h('div', null, h('b', null, r.travel.length), h('span', { class: 'mono' }, 'am Reisetag an')))));
  if (r.warns.length) {
    var ul = h('ul', { class: 'notes' });
    r.warns.forEach(function (w) { ul.append(h('li', { class: 'w' }, w)); });
    box.append(h('div', { class: 'alert' }, ul));
  }
  var travelIds = r.travel.map(function (x) { return x.id; });
  var card = h('div', { class: 'card stack' });
  AK.SLOTS.forEach(function (sl) {
    var list = r.pieces[sl.id];
    if (!list.length) return;
    var pl = h('div', { class: 'plist' });
    list.forEach(function (x) {
      var id = 'pk-' + x.id;
      var sub = typeLabel(x.type) + ' · ' + cname(x.color) + (sl.id !== 'acc' ? ' · in ' + fmtN(r.usage[x.id] || 0) + ' Outfits' : '') + (travelIds.indexOf(x.id) >= 0 ? ' · am Reisetag tragen' : '');
      pl.append(h('div', { class: 'prow' }, thumbEl(x, { size: 'sm' }), h('span', { class: 'pn' }, x.name, h('small', null, sub)),
        h('label', { class: 'check', for: id, title: 'Eingepackt' }, h('input', { type: 'checkbox', id: id }), h('span', { class: 'vh' }, x.name + ' eingepackt'))));
    });
    card.append(h('div', { class: 'stack', style: 'gap:6px' }, h('h3', { class: 'mono' }, sl.name + ' · ' + list.length + (r.caps[sl.id] ? ' von max. ' + r.caps[sl.id] : '')), pl));
  });
  box.append(card);
  if (r.travel.length) {
    var tl = h('div', { class: 'plist' });
    r.travel.forEach(function (x) { tl.append(prow(x)); });
    box.append(sec('Am Reisetag tragen', h('div', { class: 'card stack' }, h('p', { class: 'muted small', style: 'margin:0' }, 'Die schwersten Teile trägst du auf dem Weg, das spart Platz im Gepäck.'), tl)));
  }
  if (r.samples.length) {
    var sm = h('div', { class: 'card' });
    r.samples.forEach(function (s) { sm.append(miniOutfit(outfitList(s.outfit.items), levelName(s.level) + ' · ' + fmtT(s.temp) + ' · Stimmigkeit ' + s.outfit.score)); });
    box.append(sec('Beispiel-Outfits aus der Kapsel', sm));
  }
}

/* ---------- Woche (Planer ohne Wiederholung) ---------- */
var WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
function planWeek(o) {
  var W = wardrobe().map(function (x) { return Object.assign({}, x); });
  var start = addDays(todayStr(), 1), avoid = [], out = [];
  for (var i = 0; i < o.days; i++) {
    var date = addDays(start, i), wd = new Date(date + 'T12:00:00').getDay(), weekend = wd === 0 || wd === 6;
    var L = weekend ? o.eLevel : o.wLevel, act = weekend ? o.eAct : o.wAct;
    if (isSportAct(act)) L = 0;
    var ctx = { level: L, weather: { temp: o.temp, rain: o.rain, snow: false, wind: false, sun: o.temp >= 20 && !o.rain }, transport: V.ctx.transport,
      factors: [], must: [], boldness: V.ctx.boldness, onlyBasics: false, seed: i + 1, today: date, activity: act,
      season: AK.seasonFor(o.temp, Number(date.slice(5, 7))) };
    var r = AK.suggest(W, ctx, { n: 1, avoid: avoid });
    var of = r.outfits[0] || null;
    if (of) {
      avoid.push(of.key);
      // Oberteile zwei Tage ruhen lassen, Hosen, Layer und Schuhe dürfen öfter, Jacken jeden Tag
      ['top', 'mid', 'bottom', 'shoes'].forEach(function (k) {
        var x = of.items[k]; if (!x) return;
        x.last = k === 'top' ? date : addDays(date, -2);
      });
    }
    out.push({ date: date, wd: wd, weekend: weekend, ctx: ctx, outfit: of, missing: r.missing });
  }
  return out;
}
function drawWeek(box) {
  if (needItems(box, 'den Wochenplan')) return;
  var o = V.more.plan;
  if (o.temp == null) o.temp = V.ctx.temp;
  var form = h('div', { class: 'card stack' },
    h('div', { class: 'stack', style: 'gap:6px' }, h('span', { class: 'flabel' }, 'Tage ab morgen'),
      seg([3, 5, 7].map(function (n) { return { id: n, label: n + ' Tage' }; }), function () { return o.days; }, function (v) { o.days = v; }, 'Anzahl Tage')),
    h('div', { class: 'pair', style: 'display:grid;grid-template-columns:1fr 1fr;gap:10px' },
      labeled('Werktags', levelSelect('pl-wl', o.wLevel, function (v) { o.wLevel = v; }), 'pl-wl'),
      labeled('Aktivität', actSelect('pl-wa', o.wAct, function (v) { o.wAct = v; }), 'pl-wa'),
      labeled('Wochenende', levelSelect('pl-el', o.eLevel, function (v) { o.eLevel = v; }), 'pl-el'),
      labeled('Aktivität', actSelect('pl-ea', o.eAct, function (v) { o.eAct = v; }), 'pl-ea')),
    h('div', { class: 'stack', style: 'gap:6px' }, h('label', { class: 'flabel', for: 'pl-temp' }, 'Temperatur (tagsüber)'),
      tempRange('pl-temp', function () { return o.temp; }, function (v) { o.temp = v; })),
    checkbox('pl-rain', 'Regen möglich', function () { return o.rain; }, function (v) { o.rain = v; }),
    h('button', { class: 'btn accent block', type: 'button', id: 'pl-go', onclick: function () { o.res = planWeek(o); drawMore(); scrollToEl($('pl-res')); } }, ico('cal'), 'Woche planen'));
  box.append(sec('Wochenplaner', h('div', { class: 'stack' },
    h('p', { class: 'muted small', style: 'margin:0' }, 'Outfits für mehrere Tage ohne Wiederholung: Oberteile ruhen zwei Tage, Hosen und Schuhe dürfen öfter vorkommen. Fortbewegung und Farbmut kommen aus „Heute“.'), form)));
  var res = h('div', { id: 'pl-res', class: 'sec stack' });
  box.append(res);
  if (!o.res) return;
  add(res, [h('h2', { class: 'mono' }, 'Dein Plan'), demoNote()]);
  var list = h('div', { class: 'daylist' });
  o.res.forEach(function (d) {
    var title = WEEKDAYS[d.wd] + ', ' + d.date.slice(8, 10) + '.' + d.date.slice(5, 7) + '.';
    var meta = levelName(d.ctx.level) + (d.ctx.activity !== 'alltag' ? ' · ' + actName(d.ctx.activity) : '');
    var card = h('div', { class: 'card day stack', style: 'gap:6px' }, h('div', { class: 'res-head' }, h('h3', null, title), h('span', { class: 'mono' }, meta)));
    if (!d.outfit) card.append(h('div', { class: 'muted small' }, d.missing ? 'Dir fehlen noch: ' + d.missing.join(', ') + '.' : 'Kein passendes Outfit gefunden.'));
    else {
      var saveB = h('button', { class: 'btn ghost small', type: 'button' }, ico('bookmark'), isSaved(fullKey(d.outfit.items)) ? 'Gemerkt' : 'Merken');
      saveB.addEventListener('click', function () { toggleSaved(d.outfit.items, d.ctx); saveB.lastChild.textContent = isSaved(fullKey(d.outfit.items)) ? 'Gemerkt' : 'Merken'; });
      card.append(miniOutfit(outfitList(d.outfit.items), 'Stimmigkeit ' + d.outfit.score + (d.outfit.warns.length ? ' · ' + d.outfit.warns.length + ' Hinweis' + (d.outfit.warns.length > 1 ? 'e' : '') : ''), [saveB]));
      if (d.outfit.warns.length) {
        var ul = h('ul', { class: 'notes' });
        d.outfit.warns.forEach(function (w) { ul.append(h('li', { class: 'w' }, w)); });
        card.append(ul);
      }
    }
    list.append(card);
  });
  res.append(list);
  var used = {};
  o.res.forEach(function (d) { if (d.outfit) outfitList(d.outfit.items).forEach(function (x) { used[x.id] = 1; }); });
  res.append(h('div', { class: 'small muted' }, Object.keys(used).length + ' verschiedene Teile im Plan.'));
}

/* ---------- Tagebuch und Gemerkt ---------- */
function resolveIds(ids, names) {
  return (ids || []).map(function (id, i) {
    var x = itemById(id);
    return x || { id: id, name: (names && names[i]) || 'Teil', color: 'grau', slot: 'top', gone: true };
  });
}
function drawDiary(box) {
  var saved = savedList();
  var sv = h('div', { class: 'card' });
  if (!saved.length) sv.append(h('div', { class: 'muted small' }, 'Noch nichts gemerkt. Tippe bei einem Vorschlag auf „Merken“.'));
  saved.forEach(function (s) {
    var items = resolveIds(s.ids, s.names), gone = items.filter(function (x) { return x.gone; }).length;
    var sd = new Date(s.ts), meta = ['gemerkt ' + deDate(sd.getFullYear() + '-' + pad(sd.getMonth() + 1) + '-' + pad(sd.getDate()))];
    if (s.level != null) meta.push(levelName(s.level));
    if (s.temp != null) meta.push(fmtT(s.temp));
    if (gone) meta.push(gone + ' nicht mehr im Schrank');
    sv.append(miniOutfit(items, meta.join(' · '), [
      h('button', { class: 'btn small', type: 'button', onclick: function () { wearOutfit(items.filter(function (x) { return !x.gone; }), { level: s.level, temp: s.temp, activity: s.activity }); } }, ico('check'), 'Heute tragen'),
      h('button', { class: 'btn ghost small', type: 'button', onclick: function () {
        Store.setSetting('saved', savedList().filter(function (x) { return x.id !== s.id; })); toast('Aus „Gemerkt“ entfernt.'); changed();
      } }, ico('x'), 'Entfernen')]));
  });
  box.append(sec('Gemerkt', sv));

  var D = S.diary.slice().sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
  var used = {};
  D.forEach(function (e) { (e.ids || []).forEach(function (id) { used[id] = 1; }); });
  var first = D.length ? D[D.length - 1].date : null;
  var head = h('div', { class: 'kpi' },
    h('div', null, h('b', null, D.length), h('span', { class: 'mono' }, 'Outfits getragen')),
    h('div', null, h('b', null, Object.keys(used).length), h('span', { class: 'mono' }, 'verschiedene Teile')),
    first ? h('div', null, h('b', { style: 'font-size:20px' }, deDate(first)), h('span', { class: 'mono' }, 'erster Eintrag')) : null);
  var dl = h('div');
  if (!D.length) dl.append(h('div', { class: 'muted small' }, 'Noch keine Einträge. Tippe bei einem Vorschlag auf „Das trage ich“.'));
  D.slice(0, 60).forEach(function (e) {
    var items = resolveIds(e.ids, e.names);
    var meta = [deDate(e.date)];
    if (e.level != null) meta.push(levelName(e.level));
    if (e.temp != null) meta.push(fmtT(e.temp));
    if (e.activity && e.activity !== 'alltag') meta.push(actName(e.activity));
    dl.append(miniOutfit(items, meta.join(' · '), [h('button', { class: 'btn ghost small', type: 'button', 'aria-label': 'Eintrag vom ' + deDate(e.date) + ' entfernen', onclick: function () {
      // Tragezähler zurücknehmen
      (e.ids || []).forEach(function (id) {
        var own = S.items.filter(function (y) { return y.id === id; })[0];
        if (own && own.wears > 0) { var c = JSON.parse(JSON.stringify(own)); c.wears--; Store.putItem(c); }
      });
      Store.delDiary(e.id); toast('Eintrag entfernt.'); changed();
    } }, ico('trash'), 'Entfernen')]));
  });
  if (D.length > 60) dl.append(h('div', { class: 'muted small' }, 'Ältere Einträge: ' + (D.length - 60) + ' weitere.'));
  box.append(sec('Getragen', h('div', { class: 'card stack' }, head, dl)));

  var top = wardrobe().filter(function (x) { return x.wears > 0; }).sort(function (a, b) { return b.wears - a.wears; }).slice(0, 8);
  if (top.length) {
    var tl = h('div', { class: 'plist' });
    top.forEach(function (x) { tl.append(prow(x, x.wears + '×', x.last ? 'zuletzt ' + deDate(x.last) : null)); });
    box.append(sec('Meistgetragene Teile', h('div', { class: 'card' }, tl)));
  }
}

/* ---------- Einstellungen, Export, Import ---------- */
function exportData() {
  return JSON.stringify({ app: 'ankleide', version: 1, exported: new Date().toISOString(), items: S.items, diary: S.diary, settings: S.settings }, null, 1);
}
function cleanItem(x) {
  if (!x || typeof x !== 'object' || !AK.TYPES[x.type]) return null;
  var T = AK.TYPES[x.type];
  function num(v, lo, hi, d) { v = Number(v); return isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d; }
  var it = {
    id: String(x.id || uid()).replace(/[^A-Za-z0-9_.~:@+-]/g, '').slice(0, 40) || uid(),
    name: String(x.name || '').replace(/[\u0000-\u001f]/g, '').trim().slice(0, 60),
    type: x.type, slot: T.slot,
    color: AK.COLORS.some(function (c) { return c.id === x.color; }) ? x.color : 'grau',
    pattern: AK.PATTERNS.some(function (p) { return p.id === x.pattern; }) ? x.pattern : 'uni',
    fmin: Math.round(num(x.fmin, 0, 6, T.fmin)), fmax: Math.round(num(x.fmax, 0, 6, T.fmax)),
    w: num(x.w, 0, 11, T.w), c: Math.round(num(x.c, 1, 3, T.c)), a: Math.round(num(x.a, 0, 2, T.a || 0)),
    s: Array.isArray(x.s) ? x.s.filter(function (k) { return AK.SEASONS.some(function (s) { return s.id === k; }); }) : (T.s || []).slice(),
    water: !!x.water, fav: !!x.fav, basic: !!x.basic, never: !!x.never, avail: x.avail !== false,
    photo: typeof x.photo === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(x.photo) && x.photo.length < 400000 ? x.photo : null,
    wears: Math.round(num(x.wears, 0, 100000, 0)), last: typeof x.last === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x.last) ? x.last : null
  };
  if (!it.name) it.name = autoName(it);
  if (it.fmin > it.fmax) { var t = it.fmin; it.fmin = it.fmax; it.fmax = t; }
  return it;
}
function cleanDiary(e) {
  if (!e || typeof e !== 'object' || !Array.isArray(e.ids)) return null;
  var date = typeof e.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(e.date) ? e.date : null;
  if (!date) return null;
  return { id: String(e.id || uid()).replace(/[^A-Za-z0-9_.~:@+-]/g, '').slice(0, 40) || uid(), ts: Number(e.ts) || Date.parse(date) || Date.now(), date: date,
    level: e.level == null ? null : Math.max(0, Math.min(6, Math.round(Number(e.level)) || 0)), temp: e.temp == null || !isFinite(Number(e.temp)) ? null : Number(e.temp),
    activity: AK.ACT[e.activity] ? e.activity : null, ids: e.ids.slice(0, 20).map(String),
    names: Array.isArray(e.names) ? e.names.slice(0, 20).map(function (n) { return String(n).slice(0, 60); }) : [] };
}
function importData(text) {
  var o;
  try { o = JSON.parse(text); } catch (e) { return { err: 'Das ist kein gültiges JSON. Prüfe, ob der Text vollständig kopiert wurde.' }; }
  if (Array.isArray(o)) o = { items: o };
  if (!o || typeof o !== 'object' || !Array.isArray(o.items)) return { err: 'Im JSON fehlt die Liste „items“. Nutze einen Export aus Ankleide.' };
  var items = o.items.map(cleanItem).filter(Boolean);
  var diary = Array.isArray(o.diary) ? o.diary.map(cleanDiary).filter(Boolean) : [];
  if (!items.length && !diary.length) return { err: 'Keine gültigen Teile gefunden.' };
  items.forEach(function (it) { Store.putItem(it); });
  var have = {}; S.diary.forEach(function (e) { have[e.id] = 1; });
  diary.sort(function (a, b) { return a.ts - b.ts; }).forEach(function (e) { if (!have[e.id]) Store.putDiary(e); });
  S.diary.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
  V.needsRecalc = true;
  return { items: items.length, diary: diary.length, skipped: o.items.length - items.length };
}
function wipeAll() {
  S.items.slice().forEach(function (x) { Store.delItem(x.id); });
  S.diary.slice().forEach(function (e) { Store.delDiary(e.id); });
  S.settings = {};
  Store.write('settings', { kind: 's' });
  V.ctx.must = []; V.results = null; V.needsRecalc = true; V.more.cap.res = null; V.more.plan.res = null;
}
function copyText(ta) {
  var done = function () { toast('In die Zwischenablage kopiert.'); };
  var fallback = function () { ta.focus(); ta.select(); toast('Text ist markiert. Kopiere ihn mit Strg+C oder über das Menü.'); };
  try { navigator.clipboard.writeText(ta.value).then(done, fallback); } catch (e) { fallback(); }
}
function drawSettings(box) {
  var where = S.mode === 'db' ? 'Dein Schrank liegt in deinem Claude-Konto und ist auf allen Geräten gleich, auf denen du diese Seite öffnest.'
    : 'Dein Schrank liegt nur im Speicher dieses Browsers. Sichere ihn ab und zu mit dem Export, zum Beispiel bevor du Browserdaten löschst.';
  var st = h('div', { class: 'card stack' }, h('div', null, h('b', null, S.mode === 'db' ? 'Im Konto gespeichert' : 'Auf diesem Gerät gespeichert')), h('div', { class: 'muted small' }, where));
  if (!IN_CLAUDE) {
    st.append(h('div', { class: 'stack', style: 'gap:6px' }, h('span', { class: 'flabel' }, 'Darstellung'),
      seg([{ id: 'auto', label: 'Wie System' }, { id: 'light', label: 'Hell' }, { id: 'dark', label: 'Dunkel' }], themePref, setTheme, 'Darstellung')));
  }
  box.append(sec('Speicher', st));

  var demoIds = S.items.filter(function (x) { return /^demo\d+$/.test(x.id); });
  var demo = h('div', { class: 'card stack' },
    checkbox('set-demo', 'Beispielschrank zeigen, solange mein Schrank leer ist', function () { return !S.settings.demoOff; },
      function (v) { Store.setSetting('demoOff', !v); V.needsRecalc = true; changed(); }));
  if (isDemo()) demo.append(h('button', { class: 'btn ghost', type: 'button', onclick: function () { adoptDemo(); V.needsRecalc = true; changed(); } }, 'Beispielschrank übernehmen'));
  else if (S.items.length && demoIds.length < AK.DEMO.length) demo.append(h('button', { class: 'btn ghost', type: 'button', onclick: function () {
    var n = addDemoItems(); V.needsRecalc = true; toast(n + ' Beispielteile hinzugefügt.'); changed();
  } }, 'Beispielteile zu meinem Schrank hinzufügen'));
  if (demoIds.length) demo.append(confirmBtn('Beispielteile entfernen (' + demoIds.length + ')', 'Alle ' + demoIds.length + ' Teile aus dem Beispielschrank löschen? Deine eigenen Teile bleiben.', 'Ja, entfernen', function () {
    demoIds.forEach(function (x) { Store.delItem(x.id); }); V.needsRecalc = true; toast('Beispielteile entfernt.'); changed();
  }, 'ghost'));
  box.append(sec('Beispielschrank', demo));

  box.append(sec('Wäsche', h('div', { class: 'card stack' },
    checkbox('set-laundry', 'Oberteile nach dem Tragen automatisch in die Wäsche', function () { return !!S.settings.autoLaundry; }, function (v) { Store.setSetting('autoLaundry', v); }),
    h('div', { class: 'muted small' }, 'Teile in der Wäsche schlägt Ankleide nicht vor. Im Schrank holst du sie mit dem Filter „In der Wäsche“ und „Alles wieder sauber“ zurück.'))));

  var exTa = h('textarea', { id: 'set-export', readonly: true, rows: '5', 'aria-label': 'Exportierte Daten als JSON' });
  var exBtns = h('div', { class: 'row' },
    h('button', { class: 'btn ghost small', type: 'button', onclick: function () { copyText(exTa); } }, ico('copy'), 'Kopieren'));
  if (!IN_CLAUDE) exBtns.append(h('button', { class: 'btn ghost small', type: 'button', id: 'set-download', onclick: function () {
    try {
      var url = URL.createObjectURL(new Blob([exTa.value], { type: 'application/json' }));
      var a = h('a', { href: url, download: 'ankleide-schrank-' + todayStr() + '.json' });
      document.body.append(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    } catch (e) { toast('Speichern als Datei klappt hier nicht. Kopiere den Text stattdessen.'); }
  } }, ico('down'), 'Als Datei speichern'));
  var exBox = h('div', { class: 'stack', hidden: true }, exTa, exBtns);
  var ex = h('div', { class: 'card stack' },
    h('div', { class: 'muted small' }, 'Sichert Teile (mit Fotos), Tagebuch und Einstellungen als JSON-Text.' + (IN_CLAUDE ? ' Kopiere den Text und bewahre ihn auf.' : '')),
    h('button', { class: 'btn', type: 'button', id: 'set-export-go', onclick: function () { exTa.value = exportData(); exBox.hidden = false; exTa.focus(); } }, ico('down'), 'Export erstellen'),
    exBox);

  var imTa = h('textarea', { id: 'set-import', rows: '4', placeholder: 'Export-JSON hier einfügen', 'aria-label': 'Daten zum Importieren' });
  var imFile = h('input', { type: 'file', accept: 'application/json,.json,text/plain', id: 'set-import-file', class: 'vh' });
  imFile.addEventListener('change', function () {
    var f = imFile.files && imFile.files[0]; if (!f) return;
    var rd = new FileReader();
    rd.onload = function () { imTa.value = String(rd.result || ''); toast('Datei geladen. Tippe auf „Importieren“.'); };
    rd.onerror = function () { toast('Die Datei ließ sich nicht lesen.'); };
    rd.readAsText(f); imFile.value = '';
  });
  var im = h('div', { class: 'card stack' },
    h('div', { class: 'muted small' }, 'Fügt Teile und Tagebuch aus einem Export hinzu. Teile mit gleicher Kennung werden überschrieben.'),
    h('label', { class: 'btn ghost small filebtn' }, ico('up'), 'Datei wählen', imFile),
    imTa,
    h('button', { class: 'btn', type: 'button', id: 'set-import-go', onclick: function () {
      if (!imTa.value.trim()) { toast('Füge zuerst einen Export ein oder wähle eine Datei.'); return; }
      var r = importData(imTa.value);
      if (r.err) { toast(r.err); return; }
      imTa.value = '';
      toast(r.items + ' Teile und ' + r.diary + ' Tagebucheinträge importiert' + (r.skipped ? ', ' + r.skipped + ' ungültige übersprungen' : '') + '.');
      changed();
    } }, ico('up'), 'Importieren'));
  box.append(sec('Export', ex), sec('Import', im));

  box.append(sec('Daten löschen', h('div', { class: 'card stack' },
    h('div', { class: 'muted small' }, 'Löscht alle Teile, Fotos, das Tagebuch, Gemerktes und Einstellungen ' + (S.mode === 'db' ? 'in deinem Konto.' : 'in diesem Browser.')),
    confirmBtn('Alle Daten löschen', 'Wirklich alles löschen? Das lässt sich nicht rückgängig machen. Exportiere vorher, wenn du etwas behalten willst.', 'Ja, alles löschen', function () {
      wipeAll(); toast('Alle Daten gelöscht.'); changed();
    }))));
}

/* ===== Ankleide: Oberfläche, Teil 4 (Tabs „Schrank“ und „Scan“, Bearbeiten-Sheet) ===== */

/* ---------- gemeinsame Formular-Bausteine ---------- */
function typeSelect(id, value, onChange, placeholder) {
  var sel = h('select', { id: id });
  if (placeholder) sel.append(h('option', { value: '' }, placeholder));
  AK.SLOTS.forEach(function (sl) {
    var g = h('optgroup', { label: sl.name });
    Object.keys(AK.TYPES).forEach(function (k) { if (AK.TYPES[k].slot === sl.id) g.append(h('option', { value: k }, AK.TYPES[k].label)); });
    sel.append(g);
  });
  sel.value = value || '';
  sel.addEventListener('change', function () { if (sel.value) onChange(sel.value); });
  return sel;
}
function applyType(d, t) {
  var T = AK.TYPES[t]; if (!T) return;
  d.type = t; d.slot = T.slot; d.fmin = T.fmin; d.fmax = T.fmax; d.w = T.w; d.c = T.c;
  d.a = T.a || 0; d.s = (T.s || []).slice(); d.water = !!T.water;
}
function colorPicker(get, set, label) {
  var name = h('span', { class: 'muted small' });
  var sw = h('div', { class: 'swatches', role: 'group', 'aria-label': label || 'Farbe' });
  AK.COLORS.forEach(function (c) {
    sw.append(h('button', { class: 'sw', type: 'button', style: '--c:' + c.hex, 'aria-label': c.name, title: c.name, 'data-c': c.id, 'aria-pressed': 'false',
      onclick: function () { set(c.id); wrap.upd(); } }));
  });
  var wrap = h('div', { class: 'stack', style: 'gap:8px' }, h('div', { class: 'row', style: 'justify-content:space-between' }, h('span', { class: 'flabel' }, label || 'Farbe'), name), sw);
  wrap.upd = function () {
    var v = get();
    name.textContent = v ? cname(v) : 'keine';
    Array.prototype.forEach.call(sw.children, function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-c') === v ? 'true' : 'false'); });
  };
  wrap.upd();
  return wrap;
}
function patternSeg(get, set) {
  return seg(AK.PATTERNS.map(function (p) { return { id: p.id, label: p.id === 'print' ? 'Print' : p.name }; }), get, set, 'Muster');
}
function labeled(text, el, forId) {
  return h(forId ? 'label' : 'div', { class: 'field', for: forId || null }, h('span', null, text), el);
}
function warmText(w) { return w < 1 ? 'sehr leicht' : (w < 2 ? 'leicht' : (w < 3 ? 'mittel' : (w < 5 ? 'warm' : 'sehr warm'))); }

/* ---------- Bearbeiten-Sheet ---------- */
function openEditor(item, opt) {
  opt = opt || {};
  var isNew = !item;
  var d = item ? JSON.parse(JSON.stringify(item))
    : AK.normalize({ id: uid(), name: '', type: opt.type || 'tshirt', color: opt.color || 'weiss', pattern: 'uni', fav: false, basic: false, never: false, avail: true, photo: null, wears: 0, last: null });
  var demoAtStart = isDemo(), keepDemo = { v: false }, colorTouched = !isNew;
  openSheet(isNew ? 'Neues Teil' : 'Teil bearbeiten', function (body, close) {
    var ups = [];
    function up() { ups.forEach(function (f) { f(); }); }

    /* Foto */
    var prev = h('div');
    ups.push(function () { clear(prev); prev.append(thumbEl(d, { size: 'lg', label: true })); });
    var file = h('input', { type: 'file', accept: 'image/*', id: 'ed-photo', class: 'vh' });
    var fileTxt = h('span');
    var fileLbl = h('label', { class: 'btn ghost small filebtn' }, ico('img'), fileTxt, file);
    var rm = h('button', { class: 'btn ghost small', type: 'button', onclick: function () { d.photo = null; up(); } }, ico('x'), 'Foto entfernen');
    var status = h('div', { class: 'status', 'aria-live': 'polite' });
    ups.push(function () { fileTxt.textContent = d.photo ? 'Foto ändern' : 'Foto hinzufügen'; rm.hidden = !d.photo; });
    file.addEventListener('change', function () {
      var f = file.files && file.files[0]; if (!f) return;
      status.textContent = 'Foto wird verkleinert …'; status.classList.add('busy');
      processPhoto(f).then(function (r) {
        d.photo = r.thumb;
        if (!colorTouched && r.color) { d.color = r.color; status.textContent = 'Farbe erkannt: ' + cname(r.color) + '. Passe sie an, falls nötig.'; }
        else status.textContent = 'Foto übernommen.';
      }).catch(function () {
        status.textContent = 'Das Bild ließ sich nicht lesen. Versuche ein anderes Foto (JPEG oder PNG).';
      }).then(function () { status.classList.remove('busy'); file.value = ''; up(); });
    });

    /* Name, Art, Farbe, Muster */
    var name = h('input', { type: 'text', id: 'ed-name', maxlength: '60', autocomplete: 'off' });
    name.value = d.name;
    name.addEventListener('input', function () { d.name = name.value; });
    ups.push(function () { name.placeholder = autoName(d); });
    var tsel = typeSelect('ed-type', d.type, function (t) { applyType(d, t); up(); });
    var colors = colorPicker(function () { return d.color; }, function (v) { d.color = v; colorTouched = true; up(); });
    var pat = patternSeg(function () { return d.pattern; }, function (v) { d.pattern = v; up(); });
    ups.push(colors.upd); ups.push(pat.upd);

    /* Dresscode, Wärme, Komfort, Sport, Saison */
    d.fmin = clampLv(d.fmin); d.fmax = clampLv(d.fmax);
    function lvSel(id, key) {
      var s = h('select', { id: id });
      LV.forEach(function (L) { s.append(h('option', { value: String(L) }, L + ' · ' + levelName(L))); });
      s.addEventListener('change', function () {
        d[key] = Number(s.value);
        if (d.fmin > d.fmax) { if (key === 'fmin') d.fmax = d.fmin; else d.fmin = d.fmax; }
        up();
      });
      ups.push(function () { s.value = String(d[key]); });
      return s;
    }
    var fmin = lvSel('ed-fmin', 'fmin'), fmax = lvSel('ed-fmax', 'fmax');
    var warm = h('input', { type: 'range', id: 'ed-warm', min: '0', max: '6', step: '0.5' });
    var warmOut = h('span', { class: 'muted small' });
    warm.addEventListener('input', function () { d.w = Number(warm.value); warmOut.textContent = d.w + ' · ' + warmText(d.w); });
    ups.push(function () { warm.value = String(d.w); warmOut.textContent = d.w + ' · ' + warmText(d.w); });
    var comfort = seg([{ id: 1, label: 'Steif' }, { id: 2, label: 'Normal' }, { id: 3, label: 'Bequem' }], function () { return d.c; }, function (v) { d.c = v; }, 'Komfort');
    var sport = seg([{ id: 0, label: 'Nein' }, { id: 1, label: 'Bedingt' }, { id: 2, label: 'Ja' }], function () { return d.a || 0; }, function (v) { d.a = v; }, 'Sporttauglich');
    var seasons = chipGroup(AK.SEASONS.map(function (s) { return { id: s.id, label: s.name }; }),
      function (k) { return (d.s || []).indexOf(k) >= 0; },
      function (k) { d.s = d.s || []; var i = d.s.indexOf(k); if (i >= 0) d.s.splice(i, 1); else d.s.push(k); }, 'Jahreszeiten');
    ups.push(comfort.upd); ups.push(sport.upd); ups.push(seasons.upd);
    ups.push(function () { tsel.value = d.type; });

    /* Schalter */
    var checks = h('div', { class: 'stack', style: 'gap:2px' },
      checkbox('ed-water', 'Wetterfest (Regen, Schnee)', function () { return d.water; }, function (v) { d.water = v; }),
      checkbox('ed-fav', 'Lieblingsteil', function () { return d.fav; }, function (v) { d.fav = v; up(); }),
      checkbox('ed-basic', 'Basic (lässt sich mit fast allem kombinieren)', function () { return d.basic; }, function (v) { d.basic = v; up(); }),
      checkbox('ed-never', 'Nie tragen (bleibt im Schrank, wird nie vorgeschlagen)', function () { return d.never; }, function (v) { d.never = v; up(); }),
      checkbox('ed-wash', 'In der Wäsche (gerade nicht verfügbar)', function () { return d.avail === false; }, function (v) { d.avail = !v; up(); }));
    Array.prototype.forEach.call(checks.children, function (c) { ups.push(c.upd); });

    var info = null;
    if (!isNew) {
      info = h('div', { class: 'mono' }, (d.wears ? 'Getragen ' + d.wears + '×' + (d.last ? ' · zuletzt ' + deDate(d.last) : '') : 'Noch nicht getragen') + (d.demo ? ' · Beispielteil' : ''));
    }
    var demoChoice = null;
    if (isNew && demoAtStart) {
      demoChoice = h('div', { class: 'banner' },
        h('span', { class: 'small' }, 'Du siehst noch den Beispielschrank. Mit dem Speichern beginnt dein eigener Schrank.'),
        checkbox('ed-keepdemo', 'Beispielteile behalten und mein Teil dazulegen', function () { return keepDemo.v; }, function (v) { keepDemo.v = v; }));
    }

    function save() {
      d.name = (d.name || '').trim() || autoName(d);
      if (d.fmin > d.fmax) { var t = d.fmin; d.fmin = d.fmax; d.fmax = t; }
      var adopted = false;
      if (isDemo()) { if (!isNew || keepDemo.v) adopted = adoptDemo(true); }
      Store.putItem(d);
      V.needsRecalc = true;
      close();
      toast((isNew ? 'Gespeichert: ' + d.name + '.' : 'Änderungen gespeichert.') + (adopted ? ' Der Beispielschrank ist jetzt dein Schrank.' : ''));
      changed();
    }
    var foot = h('div', { class: 'foot' }, h('button', { class: 'btn accent block', type: 'button', id: 'ed-save', onclick: save }, ico('check'), 'Speichern'));
    var extra = null;
    if (!isNew) {
      extra = h('div', { class: 'stack' },
        h('button', { class: 'btn ghost', type: 'button', onclick: function () {
          var rep = addMust({ kind: 'item', id: d.id });
          close(); showTab('today'); todayChanged(true);
          toast((rep ? 'Ersetzt: ' + rep + '. ' : '') + d.name + ' ist als Wunschteil gesetzt.');
        } }, ico('star'), 'Heute unbedingt tragen'),
        confirmBtn('Teil löschen', '„' + d.name + '“ wirklich löschen? Das lässt sich nicht rückgängig machen.', 'Ja, löschen', function () {
          if (isDemo()) adoptDemo(true);
          Store.delItem(d.id);
          V.ctx.must = V.ctx.must.filter(function (m) { return !(m.kind === 'item' && m.id === d.id); });
          V.needsRecalc = true; close(); toast('Gelöscht: ' + d.name); changed();
        }));
    }

    body.append(h('div', { class: 'form' },
      demoChoice,
      h('div', { class: 'photo-row' }, prev, h('div', { class: 'stack' }, fileLbl, rm, status)),
      labeled('Name', name, 'ed-name'),
      labeled('Art', tsel, 'ed-type'),
      colors,
      h('div', { class: 'stack', style: 'gap:8px' }, h('span', { class: 'flabel' }, 'Muster'), pat),
      h('div', { class: 'stack', style: 'gap:8px' }, h('span', { class: 'flabel' }, 'Dresscode'),
        h('div', { class: 'pair' }, labeled('von', fmin, 'ed-fmin'), labeled('bis', fmax, 'ed-fmax')),
        h('span', { class: 'muted small' }, 'Beim Wechsel der Art setzt Ankleide passende Werte, du kannst sie hier anpassen.')),
      h('div', { class: 'field' }, h('div', { class: 'row', style: 'justify-content:space-between' }, h('label', { class: 'flabel', for: 'ed-warm' }, 'Wärme'), warmOut), warm),
      h('div', { class: 'stack', style: 'gap:8px' }, h('span', { class: 'flabel' }, 'Komfort'), comfort),
      h('div', { class: 'stack', style: 'gap:8px' }, h('span', { class: 'flabel' }, 'Sporttauglich'), sport),
      h('div', { class: 'stack', style: 'gap:8px' }, h('span', { class: 'flabel' }, 'Jahreszeiten'), seasons, h('span', { class: 'muted small' }, 'Keine Auswahl heißt: ganzjährig.')),
      checks, info, extra, foot));
    up();
  });
}

/* ---------- Tab „Schrank“ ---------- */
V.closet = { q: '', slot: 'all', f: {} };
var CLOSET_FILTERS = [
  { id: 'fav', label: 'Lieblinge', test: function (x) { return x.fav; } },
  { id: 'basic', label: 'Basics', test: function (x) { return x.basic; } },
  { id: 'never', label: 'Nie tragen', test: function (x) { return x.never; } },
  { id: 'wash', label: 'In der Wäsche', test: function (x) { return x.avail === false; } }
];
function norm(s) { return String(s || '').toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss'); }
var CL = {};
registerPanel('closet', {
  build: function (p) {
    clear(p);
    CL.banner = demoBanner();
    var q = h('input', { type: 'search', id: 'closet-q', placeholder: 'Suchen, z. B. blau Hemd', 'aria-label': 'Schrank durchsuchen', autocomplete: 'off' });
    q.value = V.closet.q;
    q.addEventListener('input', function () { V.closet.q = q.value; drawCloset(); });
    var add = h('button', { class: 'btn accent', type: 'button', id: 'btn-add', 'aria-label': 'Neues Teil anlegen', onclick: function () { openEditor(null); } }, ico('plus'), 'Neu');
    var addTxt = h('button', { class: 'btn ghost icon', type: 'button', id: 'btn-addtxt', 'aria-label': 'Mehrere Teile per Text hinzufügen', title: 'Mehrere Teile per Text hinzufügen', onclick: openTextImport }, ico('list'));
    CL.slots = h('div');
    CL.filters = chipGroup(CLOSET_FILTERS, function (k) { return !!V.closet.f[k]; }, function (k) { V.closet.f[k] = !V.closet.f[k]; drawCloset(); }, 'Filter');
    CL.count = h('div', { class: 'countline' });
    CL.grid = h('div', { class: 'closet', id: 'closet-grid' });
    p.append(CL.banner, h('div', { class: 'sec stack' }, h('div', { class: 'toolbar t3' }, h('div', { class: 'searchbox' }, ico('search'), q), addTxt, add), CL.slots, CL.filters), h('div', { class: 'sec stack' }, CL.count, CL.grid));
    drawCloset();
  },
  refresh: function () { CL.banner.upd(); drawCloset(); }
});
function drawCloset() {
  var W = wardrobe();
  clear(CL.slots);
  var slotOpts = [{ id: 'all', label: 'Alle', count: W.length }].concat(AK.SLOTS.map(function (s) {
    return { id: s.id, label: s.name, count: W.filter(function (x) { return x.slot === s.id; }).length };
  }));
  var sg = chipGroup(slotOpts, function (k) { return V.closet.slot === k; }, function (k) { V.closet.slot = k; drawCloset(); var b = CL.slots.querySelector('[data-v="' + k + '"]'); if (b) b.focus(); }, 'Bereich');
  sg.classList.add('scroll');
  CL.slots.append(sg);
  CL.filters.upd();
  var qq = norm(V.closet.q).trim();
  var order = {}; AK.SLOTS.forEach(function (s, i) { order[s.id] = i; });
  var list = W.filter(function (x) {
    if (V.closet.slot !== 'all' && x.slot !== V.closet.slot) return false;
    for (var i = 0; i < CLOSET_FILTERS.length; i++) if (V.closet.f[CLOSET_FILTERS[i].id] && !CLOSET_FILTERS[i].test(x)) return false;
    if (qq && !matchItem(x, qq)) return false;
    return true;
  }).sort(function (a, b) { return (order[a.slot] - order[b.slot]) || a.name.localeCompare(b.name, 'de'); });
  clear(CL.count); clear(CL.grid);
  var wash = W.filter(function (x) { return x.avail === false; });
  CL.count.append(h('span', { class: 'mono' }, list.length === W.length ? fmtN(W.length) + ' Teile' : fmtN(list.length) + ' von ' + fmtN(W.length) + ' Teilen',
    wash.length ? ' · ' + wash.length + ' in der Wäsche' : ''));
  if (wash.length && V.closet.f.wash) {
    CL.count.append(h('button', { class: 'btn ghost small', type: 'button', onclick: function () {
      wash.forEach(function (x) { var c = JSON.parse(JSON.stringify(x)); c.avail = true; Store.putItem(c); });
      V.needsRecalc = true; toast('Alles wieder sauber: ' + wash.length + ' Teile verfügbar.'); changed();
    } }, ico('wash'), 'Alles wieder sauber'));
  }
  if (!S.ready) { CL.grid.append(h('div', { class: 'empty' }, 'Dein Schrank wird geladen …')); return; }
  // Erinnerung an die Sicherung, solange der Schrank nur im Browser liegt
  var le = S.settings.lastExport;
  if (S.mode !== 'db' && S.items.length >= 10 && (!le || AK._int.daysSince(le, todayStr()) > 30)) {
    CL.grid.append(h('div', { class: 'banner', style: 'grid-column:1/-1' },
      h('span', { class: 'small' }, h('b', null, 'Sichere deinen Schrank. '), le ? 'Der letzte Export ist über einen Monat her.' : 'Er liegt nur in diesem Browser.'),
      h('div', null, h('button', { class: 'btn small', type: 'button', onclick: function () { V.more.sec = 'settings'; showTab('more'); if (PANELS.more.built) drawMore(); } }, ico('down'), 'Jetzt exportieren'))));
  }
  if (!W.length) {
    CL.grid.append(h('div', { class: 'card empty stack', style: 'grid-column:1/-1' },
      h('h3', null, 'Noch keine Teile'),
      h('p', { style: 'margin:0' }, 'Lege dein erstes Teil an oder fotografiere es im Tab „Scan“.'),
      h('div', { class: 'row', style: 'justify-content:center' },
        h('button', { class: 'btn', type: 'button', onclick: function () { openEditor(null); } }, ico('plus'), 'Teil anlegen'),
        h('button', { class: 'btn ghost', type: 'button', onclick: openTextImport }, ico('list'), 'Per Text hinzufügen'),
        h('button', { class: 'btn ghost', type: 'button', onclick: function () { Store.setSetting('demoOff', false); V.needsRecalc = true; changed(); } }, 'Beispielschrank zeigen'))));
    return;
  }
  if (!list.length) { CL.grid.append(h('div', { class: 'empty', style: 'grid-column:1/-1' }, 'Nichts gefunden. Ändere die Suche oder die Filter.')); return; }
  list.forEach(function (x) {
    var off = x.never || x.avail === false;
    var lbl = [x.name, typeLabel(x.type), cname(x.color)];
    if (x.fav) lbl.push('Lieblingsteil'); if (x.basic) lbl.push('Basic');
    if (x.never) lbl.push('nie tragen'); else if (x.avail === false) lbl.push('in der Wäsche');
    CL.grid.append(h('button', { class: 'gcard' + (off ? ' off' : ''), type: 'button', 'aria-label': lbl.join(', '), onclick: function () { openEditor(x); } },
      thumbEl(x, { badges: true, label: true }),
      h('span', { class: 'nm' }, x.name, x.wears ? h('small', null, x.wears + '× getragen') : null)));
  });
}

/* ---------- Tab „Scan“ ---------- */
V.scan = null;
var SC = { token: 0 };
registerPanel('scan', {
  build: function (p) { drawScan(p); },
  refresh: function (p) {
    if (p.contains(document.activeElement) && /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) { V.dirty.scan = true; return; }
    drawScan(p);
  }
});
function newScan(fromPhoto) {
  SC.token++;
  V.scan = { item: { id: 'scan-' + uid(), name: '', type: '', slot: null, color: 'grau', pattern: 'uni', photo: null, fav: false, basic: false, never: false, avail: true, wears: 0, last: null },
    blob: null, status: '', busy: false, out: null, level: null, saved: null, touched: {}, keepDemo: false, fromPhoto: !!fromPhoto };
}
function scanReady() { return V.scan && V.scan.item.type && AK.TYPES[V.scan.item.type]; }
function scanItem() { var it = JSON.parse(JSON.stringify(V.scan.item)); return AK.normalize(it); }
function setScanStatus(txt, busy) {
  if (!V.scan) return;
  V.scan.status = txt; V.scan.busy = !!busy;
  var el = $('scan-status');
  if (el) { el.textContent = txt; el.classList.toggle('busy', !!busy); }
}
function scanPhoto(file) {
  newScan(true);
  var tok = SC.token;
  V.scan.status = 'Foto wird verkleinert …'; V.scan.busy = true;
  drawScan($('p-scan'));
  processPhoto(file).then(function (r) {
    if (tok !== SC.token) return;
    V.scan.item.photo = r.thumb; V.scan.blob = r.blob; V.scan.item.color = r.color || 'grau';
    V.scan.status = 'Farbe erkannt: ' + cname(V.scan.item.color) + '. Wähle die Art aus.'; V.scan.busy = false;
    drawScan($('p-scan'));
    aiDetect(tok);
  }).catch(function () {
    if (tok !== SC.token) return;
    V.scan.status = 'Das Bild ließ sich nicht lesen. Versuche ein anderes Foto (JPEG oder PNG) oder gib das Teil ohne Foto ein.'; V.scan.busy = false;
    drawScan($('p-scan'));
  });
}
/* Erkennung mit Claude, nur im Artifact mit Bildfreigabe. Jeder Fehler führt still zur Eingabe per Hand. */
function aiPrompt() {
  return 'Auf dem Foto ist ein einzelnes Kleidungsstück oder Accessoire. Bestimme Art, Hauptfarbe und Muster.\n' +
    'Antworte nur mit einem JSON-Objekt in genau dieser Form:\n' +
    '{"type":"<type-ID>","color":"<color-ID>","pattern":"<pattern-ID>","name":"<kurzer deutscher Name, höchstens 4 Wörter>"}\n' +
    'Erlaubte type-IDs: ' + Object.keys(AK.TYPES).map(function (k) { return k + ' (' + AK.TYPES[k].label + ')'; }).join(', ') + '\n' +
    'Erlaubte color-IDs: ' + AK.COLORS.map(function (c) { return c.id + ' (' + c.name + ')'; }).join(', ') + '\n' +
    'Erlaubte pattern-IDs: ' + AK.PATTERNS.map(function (p) { return p.id + ' (' + p.name + ')'; }).join(', ') + '\n' +
    'Nimm die nächstliegende erlaubte ID. Ist kein Kleidungsstück zu erkennen, antworte {"type":null}.';
}
function validAI(r) {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return null;
  var o = {};
  if (typeof r.type === 'string' && AK.TYPES[r.type]) o.type = r.type;
  if (typeof r.color === 'string' && AK.COLORS.some(function (c) { return c.id === r.color; })) o.color = r.color;
  if (typeof r.pattern === 'string' && AK.PATTERNS.some(function (p) { return p.id === r.pattern; })) o.pattern = r.pattern;
  if (typeof r.name === 'string') { var n = r.name.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 40); if (n) o.name = n; }
  return (o.type || o.color) ? o : null;
}
function aiDetect(tok) {
  if (!IN_CLAUDE || !V.scan || !V.scan.blob) return;
  var blob = V.scan.blob, sample = null;
  Promise.resolve().then(function () { return window.claude.use('sample'); }).then(function (s) {
    sample = s;
    if (!sample || typeof sample.json !== 'function') return null;
    return sample.limits ? sample.limits().catch(function () { return null; }) : null;
  }).then(function (lim) {
    if (!lim || !lim.images || tok !== SC.token) return null;
    setScanStatus('Claude erkennt Art, Farbe und Muster …', true);
    return sample.json(aiPrompt(), { images: [blob], modelTier: 'quick' });
  }).then(function (r) {
    if (tok !== SC.token || !V.scan) return;
    if (r === null || r === undefined) { if (V.scan.busy) setScanStatus('Farbe erkannt: ' + cname(V.scan.item.color) + '. Wähle die Art aus.', false); return; }
    var o = validAI(r), it = V.scan.item, t = V.scan.touched;
    if (!o) { setScanStatus('Claude war sich nicht sicher. Wähle die Art aus.', false); return; }
    if (o.type && !t.type) { applyType(it, o.type); }
    if (o.color && !t.color) it.color = o.color;
    if (o.pattern && !t.pattern) it.pattern = o.pattern;
    if (o.name && !t.name && !it.name) it.name = o.name;
    V.scan.status = 'Erkannt: ' + [o.type ? typeLabel(o.type) : null, o.color ? cname(o.color) : null, o.pattern ? (AK.PATTERNS.filter(function (p) { return p.id === o.pattern; })[0] || {}).name : null].filter(Boolean).join(', ') + '. Prüfe die Angaben.';
    V.scan.busy = false;
    drawScan($('p-scan'));
  }).catch(function () {
    if (tok !== SC.token || !V.scan) return;
    setScanStatus('Farbe erkannt: ' + cname(V.scan.item.color) + '. Wähle die Art aus.', false);
  });
}

function drawScan(p) {
  if (!p) return;
  clear(p);
  var cam = h('input', { type: 'file', accept: 'image/*', capture: 'environment', id: 'scan-cam', class: 'vh' });
  var pick = h('input', { type: 'file', accept: 'image/*', id: 'scan-pick', class: 'vh' });
  [cam, pick].forEach(function (inp) {
    inp.addEventListener('change', function () { var f = inp.files && inp.files[0]; if (f) scanPhoto(f); inp.value = ''; });
  });
  p.append(sec('Teil scannen', h('div', { class: 'stack' },
    h('p', { style: 'margin:0' }, 'Fotografiere ein Kleidungsstück, am besten flach vor ruhigem Hintergrund. Ankleide erkennt die Farbe, kombiniert das Teil mit deinem Schrank und sagt dir beim Einkaufen, ob es passt.'),
    h('div', { class: 'row' },
      h('label', { class: 'btn accent filebtn grow' }, ico('cam'), 'Foto aufnehmen', cam),
      h('label', { class: 'btn ghost filebtn grow' }, ico('img'), 'Foto wählen', pick)),
    h('div', null, h('button', { class: 'btn ghost small', type: 'button', onclick: function () { newScan(false); V.scan.status = 'Wähle Art und Farbe des Teils.'; drawScan(p); } }, ico('edit'), 'Ohne Foto eingeben')))));
  if (!V.scan) {
    p.append(h('div', { class: 'card empty sec' }, IN_CLAUDE ? 'Mit deiner Freigabe erkennt Claude auch die Art und das Muster.' : 'Die Art wählst du nach dem Foto aus. Die Farbe schlägt Ankleide selbst vor.'));
    return;
  }
  var it = V.scan.item, t = V.scan.touched;
  var tsel = typeSelect('scan-type', it.type, function (v) { applyType(it, v); t.type = true; V.scan.out = null; drawScan(p); }, 'Art wählen …');
  var name = h('input', { type: 'text', id: 'scan-name', maxlength: '60', autocomplete: 'off', placeholder: it.type ? autoName(it) : 'Name (optional)' });
  name.value = it.name;
  name.addEventListener('input', function () { it.name = name.value; t.name = true; });
  var colors = colorPicker(function () { return it.color; }, function (v) { it.color = v; t.color = true; V.scan.out = null; refreshPrev(); drawOut(); });
  var pat = patternSeg(function () { return it.pattern; }, function (v) { it.pattern = v; t.pattern = true; V.scan.out = null; refreshPrev(); drawOut(); });
  var prev = h('div');
  function refreshPrev() { clear(prev); prev.append(thumbEl(scanReady() ? scanItem() : it, { size: 'lg', label: !!it.type })); }
  refreshPrev();
  var ready = !!scanReady();
  var out = h('div', { class: 'stack', id: 'scan-out', 'aria-live': 'polite' });
  var bCombine = h('button', { class: 'btn', type: 'button', id: 'scan-combine', disabled: !ready, onclick: function () { V.scan.out = 'combine'; drawOut(); scrollToEl(out); } }, 'Mit Schrank kombinieren');
  var bShop = h('button', { class: 'btn ghost', type: 'button', id: 'scan-shop', disabled: !ready, onclick: function () { V.scan.out = 'shop'; drawOut(); scrollToEl(out); } }, 'Einkaufs-Check');
  var saveBox = h('div', { class: 'stack' });
  function drawSave() {
    clear(saveBox);
    if (V.scan.saved) {
      saveBox.append(h('div', { class: 'row' }, h('span', { class: 'status' }, 'Im Schrank gespeichert.'),
        h('button', { class: 'btn ghost small', type: 'button', onclick: function () { showTab('closet'); } }, ico('arrow'), 'Zum Schrank')));
      return;
    }
    if (isDemo()) saveBox.append(checkbox('scan-keepdemo', 'Beispielteile behalten', function () { return V.scan.keepDemo; }, function (v) { V.scan.keepDemo = v; }));
    saveBox.append(h('button', { class: 'btn ghost', type: 'button', id: 'scan-save', disabled: !ready, onclick: scanSave }, ico('hanger'), 'In den Schrank'));
  }
  drawSave();
  function scanSave() {
    if (!scanReady()) return;
    var x = scanItem(), oldId = x.id;
    x.id = uid(); x.name = (x.name || '').trim() || autoName(x); delete x.demo;
    if (isDemo() && V.scan.keepDemo) adoptDemo(true);
    Store.putItem(x);
    V.ctx.must.forEach(function (m) { if (m.kind === 'item' && m.item && m.item.id === oldId) { delete m.item; m.id = x.id; } });
    V.scan.saved = x.id; V.needsRecalc = true;
    toast('Gespeichert: ' + x.name);
    changed(); drawSave();
  }
  function drawOut() {
    clear(out);
    if (!V.scan.out || !scanReady()) return;
    var x = scanItem(), W = wardrobe().filter(function (y) { return y.id !== x.id && y.id !== V.scan.saved; });
    if (V.scan.out === 'shop') {
      if (!W.length) { out.append(h('div', { class: 'card' }, 'Dein Schrank ist noch leer. Der Einkaufs-Check vergleicht das Teil mit deinen Teilen, lege also zuerst ein paar an.')); return; }
      var sc = AK.shopCheck(W, x, todayStr());
      var box = h('div', { class: 'card stack' }, h('div', { class: 'mono' }, 'Einkaufs-Check' + (isDemo() ? ' · mit dem Beispielschrank' : '')),
        h('div', { class: 'verdict t-' + sc.tier }, sc.verdict));
      if (sc.tier !== 'acc') {
        box.append(h('div', { class: 'kpi' }, h('div', null, h('b', null, fmtN(sc.n)), h('span', { class: 'mono' }, 'stimmige Outfits')),
          h('div', null, h('b', null, sc.partners.length), h('span', { class: 'mono' }, 'starke Partner'))));
        var max = 1; Object.keys(sc.byLevel).forEach(function (k) { if (sc.byLevel[k] > max) max = sc.byLevel[k]; });
        var bars = h('div', { class: 'bars', role: 'list', 'aria-label': 'Outfits nach Dresscode-Stufe' });
        Object.keys(sc.byLevel).forEach(function (k) {
          var v = sc.byLevel[k];
          bars.append(h('div', { class: 'br', role: 'listitem' }, h('span', null, levelName(Number(k))),
            h('span', { class: 'track', 'aria-hidden': 'true' }, h('i', { style: 'width:' + Math.round(v / max * 100) + '%' })), h('span', { class: 'v' }, fmtN(v))));
        });
        box.append(h('div', { class: 'stack', style: 'gap:6px' }, h('span', { class: 'flabel' }, 'Nach Dresscode-Stufe'), bars));
        if (sc.partners.length) {
          var pl = h('div', { class: 'plist' });
          sc.partners.forEach(function (pp) { pl.append(prow(pp)); });
          box.append(h('div', { class: 'stack', style: 'gap:6px' }, h('span', { class: 'flabel' }, 'Passt besonders zu'), pl));
        }
        box.append(h('p', { class: 'muted small', style: 'margin:0' }, 'Gezählt werden stimmige Outfits bei 4, 15 und 25 °C über alle Dresscode-Stufen, für die das Teil gedacht ist.'));
      }
      out.append(box);
      return;
    }
    /* Kombinieren: Stufe innerhalb der Spanne des Teils, Wetter und Rahmen aus „Heute“ */
    var lo = clampLv(x.fmin), hi = clampLv(x.fmax), L = V.scan.level;
    if (L == null || L < lo || L > hi) L = (V.ctx.level >= lo && V.ctx.level <= hi) ? V.ctx.level : Math.round((lo + hi) / 2);
    V.scan.level = L;
    var lvOpts = [];
    for (var i = lo; i <= hi; i++) lvOpts.push({ id: i, label: AK.LEVEL_SHORT[i] });
    var ctx = engineCtx(V.ctx, { level: L, must: [{ kind: 'item', item: x }] });
    var r = AK.suggest(W, ctx, { n: 3 });
    out.append(h('div', { class: 'res-head' }, h('h2', { class: 'mono' }, 'Mit deinem Schrank'), h('span', { class: 'mono' }, fmtN(r.total) + ' Kombinationen')),
      h('div', { class: 'stack', style: 'gap:6px' }, h('span', { class: 'flabel' }, 'Dresscode'),
        chipGroup(lvOpts, function (k) { return k === V.scan.level; }, function (k) { V.scan.level = k; drawOut(); }, 'Dresscode für die Kombination')),
      h('div', { class: 'small muted' }, fmtT(ctx.weather.temp) + ' · ' + trName(ctx.transport) + ' · Wetter und Rahmen aus „Heute“' + (isDemo() ? ' · Beispielschrank' : '')));
    if (r.missing) out.append(h('div', { class: 'card' }, 'Dir fehlen noch: ' + r.missing.join(', ') + '.'));
    r.warns.forEach(function (w) { out.append(h('div', { class: 'alert small' }, w)); });
    var wished = function (y) { return y.id === x.id; };
    r.outfits.forEach(function (o, i) { out.append(outfitCard(o, { i: i, ctx: ctx, wished: wished })); });
    out.append(h('button', { class: 'btn ghost', type: 'button', onclick: function () {
      var m = V.scan.saved ? { kind: 'item', id: V.scan.saved } : { kind: 'item', item: scanItem() };
      addMust(m); V.ctx.level = L; showTab('today'); todayChanged(true);
      toast('Das gescannte Teil ist als Wunschteil gesetzt.');
    } }, ico('arrow'), 'In „Heute“ weiter anpassen'));
  }
  p.append(sec('Erkannt', h('div', { class: 'stack' },
    h('div', { class: 'scan-preview' }, prev, h('div', { class: 'stack', style: 'gap:8px' },
      h('div', { class: 'status' + (V.scan.busy ? ' busy' : ''), id: 'scan-status', 'aria-live': 'polite' }, V.scan.status),
      labeled('Art', tsel, 'scan-type'))),
    colors,
    h('div', { class: 'stack', style: 'gap:8px' }, h('span', { class: 'flabel' }, 'Muster'), pat),
    labeled('Name', name, 'scan-name'))));
  p.append(h('div', { class: 'sec stack' }, bCombine, bShop, saveBox), h('div', { class: 'sec' }, out));
  drawOut();
}

/* ---------- Mehrere Teile per Text hinzufügen ----------
   Beispiel: „Navy Sakko, 2 weiße T-Shirts, dunkle Jeans, gestreiftes Hemd“. Jede Zeile oder jeder Eintrag
   zwischen Kommas wird ein Teil. Art, Farbe, Muster und Anzahl erkennt ein einfacher Regelsatz;
   im Artifact kann Claude genauer erkennen. */
var TXT_TYPES = [
  ['tshirts?|\\btees?\\b|\\bshirts?\\b', 'tshirt'], ['langarm\\w*|longsleeve', 'langarm'], ['polo\\w*', 'polo'],
  ['hemd\\w*|bluse\\w*', 'hemd'], ['funktionsshirt|laufshirt|sportshirt|sporttop', 'sporttop'],
  ['pullover|pullis?\\b|strickpulli|sweater', 'pullover'], ['feinstrick\\w*|rollkragen\\w*|merino\\w*|rolli\\b', 'feinstrick'],
  ['strickjacke\\w*|cardigan', 'strickjacke'], ['sweatshirt|sweatjacke|\\bsweat\\b', 'sweat'], ['hoodie\\w*|kapuzen\\w*', 'hoodie'], ['fleece\\w*', 'fleece'],
  ['sakko\\w*|blazer|jackett\\w*', 'sakko'], ['smoking', 'smoking'], ['weste\\w*|gilet', 'weste'],
  ['jeansjacke\\w*', 'jeansjacke'], ['lederjacke\\w*', 'lederjacke'], ['bomber\\w*', 'bomber'], ['uebergangsjacke\\w*|\\bjacke\\b|\\bjacken\\b', 'uebergang'],
  ['regenjacke\\w*|regenmantel', 'regenjacke'], ['softshell\\w*', 'softshell'], ['trench\\w*', 'trench'], ['mantel|maentel|wintermantel', 'wintermantel'],
  ['parka\\w*', 'parka'], ['daunenjacke\\w*|steppjacke\\w*|puffer\\w*', 'daune'], ['trainingsjacke\\w*', 'trainingsjacke'],
  ['jeans', 'jeans'], ['chinos?', 'chino'], ['stoffhose\\w*|bundfaltenhose\\w*|\\bhose\\b|\\bhosen\\b', 'stoff'], ['anzughose\\w*', 'anzughose'],
  ['jogginghose\\w*|jogger\\w*', 'jogger'], ['shorts|kurze hose|bermuda\\w*', 'shorts'], ['sporthose\\w*|laufhose\\w*|leggings', 'sporthose'], ['cargo\\w*', 'cargo'],
  ['sneaker\\w*|turnschuh\\w*', 'sneaker'], ['laufschuh\\w*|running', 'laufschuh'], ['boots|stiefel\\w*|stiefelette\\w*', 'boots'],
  ['chelsea ?boots|chelsea', 'chelsea'], ['loafer\\w*|slipper\\w*|mokassin\\w*', 'loafer'], ['derby\\w*|lederschuh\\w*|businessschuh\\w*', 'derby'],
  ['oxfords?\\b|oxfordschuh\\w*', 'oxford'], ['sandale\\w*|flipflops?', 'sandalen'], ['winterstiefel\\w*|schneestiefel\\w*', 'winterstiefel'],
  ['guertel', 'guertel'], ['\\buhr\\b|armbanduhr', 'uhr'], ['schal\\b|schals\\b|\\bschal', 'schal'], ['muetze\\w*|beanie', 'muetze'], ['handschuh\\w*', 'handschuhe'],
  ['krawatte\\w*|schlips', 'krawatte'], ['fliege\\w*', 'fliege'], ['einstecktuch', 'einstecktuch'], ['\\bcaps?\\b|basecap\\w*|kappe\\w*', 'cap'], ['sonnenbrille\\w*', 'sonnenbrille']
];
var TXT_COLORS = [
  ['dunkelblau|marineblau|marine|navy', 'navy'], ['hellblau|babyblau|eisblau', 'hellblau'], ['indigo', 'indigo'], ['denim', 'denim'],
  ['anthrazit|dunkelgrau|graphit', 'anthrazit'], ['bordeaux|weinrot|burgund\\w*|dunkelrot', 'bordeaux'], ['camel|cognac|karamell', 'camel'],
  ['beige|creme|ecru|offwhite', 'beige'], ['khaki|sand', 'sand'], ['oliv\\w*', 'oliv'], ['schwarz', 'schwarz'], ['weiss', 'weiss'],
  ['hellgrau|grau|silber', 'grau'], ['braun|mokka|schoko', 'braun'], ['dunkelgruen|gruen|tanne', 'gruen'], ['lila|violett|flieder', 'lila'],
  ['rosa|pink', 'rosa'], ['orange|rost', 'orange'], ['gelb|senf', 'gelb'], ['royalblau|blau', 'blau'], ['(^|[^a-z])rot', 'rot']
];
var TXT_NUM = { ein: 1, eine: 1, einen: 1, zwei: 2, drei: 3, vier: 4, fuenf: 5, sechs: 6 };
function parseEntry(raw) {
  var txt = raw.replace(/\s+/g, ' ').trim();
  if (!txt) return null;
  var n = 1, m = txt.match(/^(\d{1,2})\s*(x|×|stk\.?|stück|stueck)?\s+/i);
  if (m) { n = Number(m[1]); txt = txt.slice(m[0].length); }
  else {
    var w = normQ(txt).split(' ')[0];
    if (TXT_NUM[w]) { n = TXT_NUM[w]; txt = txt.replace(/^\S+\s+/, ''); }
  }
  txt = txt.replace(/^(mein|meine|meinen)\s+/i, '');
  var q = normQ(txt), best = null;
  TXT_TYPES.forEach(function (tt) {
    var re = new RegExp(tt[0], 'g'), r;
    while ((r = re.exec(q))) {
      var end = r.index + r[0].length;
      if (!best || end > best.end || (end === best.end && r[0].length > best.len)) best = { type: tt[1], end: end, len: r[0].length };
      if (!r[0].length) re.lastIndex++;
    }
  });
  var type = best ? best.type : '';
  var color = '', guessed = false;
  for (var i = 0; i < TXT_COLORS.length; i++) if (new RegExp(TXT_COLORS[i][0]).test(q)) { color = TXT_COLORS[i][1]; break; }
  if (type === 'jeans' && /dunkl|dunkel|raw/.test(q) && (!color || color === 'navy')) color = 'indigo';
  if (type === 'jeans' && /hell/.test(q) && (!color || color === 'hellblau')) color = 'denim';
  if (!color) { guessed = true; color = { jeans: 'indigo', jeansjacke: 'denim', chino: 'beige', trench: 'beige', lederjacke: 'schwarz', sakko: 'navy' }[type] || 'grau'; }
  var pattern = /gestreift|streifen|nadelstreif|ringel/.test(q) ? 'streifen' : (/kariert|karo|glencheck|hahnentritt/.test(q) ? 'karo' : (/print|bedruckt|logo|motiv/.test(q) ? 'print' : 'uni'));
  var fav = /lieblings/.test(q), basic = /\bbasic/.test(q);
  var clean = txt.replace(/\b(lieblings(teil|stück|stueck)?|basic)\b/gi, '').replace(/\s+/g, ' ').trim();
  var name = n > 1 || !clean ? '' : clean.charAt(0).toUpperCase() + clean.slice(1);
  return { raw: raw.trim(), label: clean || txt, n: Math.max(1, Math.min(10, n)), type: type, color: color, guessed: guessed, pattern: pattern, fav: fav, basic: basic, name: name.slice(0, 60) };
}
function parseWardrobeText(text) {
  return String(text || '').split(/\n|,|;|\s+und\s+|\s+sowie\s+|\s\+\s|\s&\s/i).map(parseEntry).filter(Boolean);
}
function rowToItem(r) {
  var it = AK.normalize({ id: uid(), name: '', type: r.type, color: r.color, pattern: r.pattern, fav: !!r.fav, basic: !!r.basic, never: false, avail: true, photo: null, wears: 0, last: null });
  it.name = r.name || autoName(it);
  return it;
}
function openTextImport() {
  openSheet('Teile per Text hinzufügen', function (body, close) {
    var rows = [], keepDemo = { v: false };
    var ta = h('textarea', { id: 'txt-in', rows: '5', placeholder: 'Zum Beispiel:\nNavy Sakko\n2 weiße T-Shirts, dunkle Jeans\ngestreiftes Hemd hellblau, braune Chelsea Boots', 'aria-label': 'Teile, je Zeile oder durch Komma getrennt' });
    var list = h('div', { class: 'stack', id: 'txt-rows', 'aria-live': 'polite' });
    var addBtn = h('button', { class: 'btn accent block', type: 'button', id: 'txt-add', disabled: true }, ico('check'), 'Hinzufügen');
    var aiBtn = h('button', { class: 'btn ghost', type: 'button', id: 'txt-ai', hidden: true }, ico('spark'), 'Mit Claude genauer erkennen');
    var status = h('div', { class: 'status', 'aria-live': 'polite' });
    var timer = null;
    ta.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(function () { rows = parseWardrobeText(ta.value); draw(); }, 200); });
    function count() { return rows.filter(function (r) { return r.type; }).reduce(function (a, r) { return a + r.n; }, 0); }
    function draw() {
      clear(list);
      rows.forEach(function (r, i) {
        var preview = h('span', { class: 'txt-thumb' });
        function updPrev() { clear(preview); if (r.type) preview.append(thumbEl(rowToItem(r), { size: 'sm' })); else preview.append(h('span', { class: 'thumb sm unknown' }, '?')); }
        var tsel = typeSelect('txt-type-' + i, r.type, function (v) { r.type = v; updPrev(); upd(); }, 'Art wählen …');
        tsel.setAttribute('aria-label', 'Art für „' + r.raw + '“');
        var csel = h('select', { id: 'txt-color-' + i, 'aria-label': 'Farbe für „' + r.raw + '“' });
        AK.COLORS.forEach(function (c) { csel.append(h('option', { value: c.id }, c.name)); });
        csel.value = r.color;
        csel.addEventListener('change', function () { r.color = csel.value; r.guessed = false; updPrev(); });
        var rm = h('button', { class: 'btn ghost icon', type: 'button', 'aria-label': '„' + r.raw + '“ entfernen', onclick: function () { rows.splice(i, 1); draw(); } }, ico('x'));
        updPrev();
        list.append(h('div', { class: 'txt-row' + (r.type ? '' : ' bad') }, preview,
          h('div', { class: 'txt-main' },
            h('div', { class: 'small' }, h('b', null, (r.n > 1 ? r.n + ' × ' : '') + (r.name || r.label || r.raw)),
              !r.type ? h('span', { class: 'warn-t' }, ' · Art nicht erkannt') : (r.guessed ? h('span', { class: 'muted' }, ' · Farbe geschätzt') : null)),
            h('div', { class: 'pair' }, tsel, csel)), rm));
      });
      upd();
    }
    function upd() {
      var n = count(), bad = rows.filter(function (r) { return !r.type; }).length;
      addBtn.disabled = !n;
      addBtn.lastChild.textContent = n ? n + (n === 1 ? ' Teil hinzufügen' : ' Teile hinzufügen') : 'Hinzufügen';
      status.textContent = rows.length ? (bad ? bad + ' Eintrag ohne erkannte Art wird übersprungen. Wähle die Art aus.' : '') : '';
    }
    addBtn.addEventListener('click', function () {
      var items = [];
      rows.forEach(function (r) { if (!r.type) return; for (var k = 0; k < r.n; k++) items.push(rowToItem(r)); });
      if (!items.length) return;
      if (isDemo() && keepDemo.v) adoptDemo(true);
      items.forEach(function (it) { Store.putItem(it); });
      V.needsRecalc = true; close();
      toast(items.length + (items.length === 1 ? ' Teil' : ' Teile') + ' im Schrank: ' + items.slice(0, 3).map(function (x) { return x.name; }).join(', ') + (items.length > 3 ? ' …' : ''));
      changed();
    });
    /* Im Artifact: Claude liest den Text, Ergebnis wird gegen die erlaubten IDs geprüft */
    if (IN_CLAUDE) {
      Promise.resolve().then(function () { return window.claude.use('sample'); }).then(function (sample) {
        if (!sample || typeof sample.json !== 'function') return;
        aiBtn.hidden = false;
        aiBtn.addEventListener('click', function () {
          if (!ta.value.trim()) { toast('Schreib zuerst ein paar Teile ins Feld.'); return; }
          aiBtn.disabled = true; status.textContent = 'Claude liest die Liste …'; status.classList.add('busy');
          var prompt = 'Wandle diese Liste von Kleidungsstücken in JSON um. Antworte nur mit einem JSON-Array von Objekten der Form ' +
            '{"name":"<kurzer deutscher Name>","type":"<type-ID>","color":"<color-ID>","pattern":"<pattern-ID>","count":<Anzahl>}.\n' +
            'Erlaubte type-IDs: ' + Object.keys(AK.TYPES).map(function (k) { return k + ' (' + AK.TYPES[k].label + ')'; }).join(', ') + '\n' +
            'Erlaubte color-IDs: ' + AK.COLORS.map(function (c) { return c.id + ' (' + c.name + ')'; }).join(', ') + '\n' +
            'Erlaubte pattern-IDs: uni, streifen, karo, print. Nimm die nächstliegende erlaubte ID.\n\nListe:\n' + ta.value.slice(0, 4000);
          sample.json(prompt, { modelTier: 'quick' }).then(function (arr) {
            if (!Array.isArray(arr)) throw new Error('kein Array');
            var got = arr.slice(0, 60).map(function (x) {
              if (!x || typeof x !== 'object' || !AK.TYPES[x.type]) return null;
              return { raw: String(x.name || x.type).slice(0, 60), n: Math.max(1, Math.min(10, Math.round(Number(x.count) || 1))), type: x.type,
                color: AK.COLORS.some(function (c) { return c.id === x.color; }) ? x.color : 'grau', guessed: false,
                pattern: AK.PATTERNS.some(function (p) { return p.id === x.pattern; }) ? x.pattern : 'uni',
                name: String(x.name || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 60), fav: false, basic: false };
            }).filter(Boolean);
            if (!got.length) throw new Error('leer');
            rows = got; draw(); status.textContent = 'Erkannt von Claude. Prüfe die Liste.';
          }).catch(function () { status.textContent = 'Claude konnte gerade nicht helfen. Die Erkennung oben funktioniert trotzdem.'; })
            .then(function () { aiBtn.disabled = false; status.classList.remove('busy'); });
        });
      }).catch(function () {});
    }
    body.append(
      h('p', { class: 'muted small', style: 'margin:0' }, 'Schreib deine Teile auf, je Zeile oder durch Komma getrennt. Ankleide erkennt Art, Farbe, Muster und Anzahl. Prüfe die Vorschau und passe sie bei Bedarf an.'),
      ta, aiBtn, status, list,
      isDemo() ? checkbox('txt-keepdemo', 'Beispielteile behalten und meine Teile dazulegen', function () { return keepDemo.v; }, function (v) { keepDemo.v = v; }) : null,
      h('div', { class: 'foot' }, addBtn));
    ta.focus();
  });
}

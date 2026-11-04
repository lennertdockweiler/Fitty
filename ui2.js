/* ===== Ankleide: Oberfläche, Teil 2 (Kern: Tabs, Status, Bausteine, Aktionen) ===== */
var TABS = [
  { id: 'today', name: 'Heute' }, { id: 'closet', name: 'Schrank' },
  { id: 'scan', name: 'Scan' }, { id: 'more', name: 'Mehr' }
];
var SHORT = ['Sport', 'Relaxt', 'Casual', 'Smart', 'Business', 'Cocktail', 'Black Tie'];
var MAIN_SLOTS = ['top', 'mid', 'outer', 'bottom', 'shoes'];
var PANELS = {};
V.dirty = {};
V.needsRecalc = false;
var IN_CLAUDE = typeof window !== 'undefined' && !!(window.claude && window.claude.use);

ICONS.trash = '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>';
ICONS.bookmark = '<path d="M7 4h10v16l-5-4-5 4z"/>';
ICONS.copy = '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>';
ICONS.down = '<path d="M12 4v11m-5-5 5 5 5-5M5 20h14"/>';
ICONS.up = '<path d="M12 20V9m-5 5 5-5 5 5M5 4h14"/>';
ICONS.bag = '<rect x="4" y="7" width="16" height="13" rx="2"/><path d="M9 7V4h6v3M4 12h16"/>';
ICONS.cal = '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>';
ICONS.wash = '<path d="M5 4h14v16H5zM5 8h14"/><circle cx="12" cy="14" r="3.2"/>';
ICONS.arrow = '<path d="M5 12h14m-5-5 5 5-5 5"/>';
ICONS.edit = '<path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4"/>';

function registerPanel(id, o) { o.built = false; PANELS[id] = o; }
function levelName(L) { return (AK.LEVELS[L] || {}).name || ''; }
function actName(id) { return (AK.ACT[id] || {}).name || ''; }
function trName(id) { return (AK.TRANSPORT.filter(function (t) { return t.id === id; })[0] || {}).name || ''; }
function seasonName(id) { return (AK.SEASONS.filter(function (s) { return s.id === id; })[0] || {}).name || ''; }
function fmtN(n) { try { return Number(n).toLocaleString('de-DE'); } catch (e) { return String(n); } }
function fmtT(t) { return (t < 0 ? '−' : '') + Math.abs(Math.round(t)) + '\u00a0°C'; }
function itemById(id) { return wardrobe().filter(function (x) { return x.id === id; })[0] || null; }
function lightColor(id) {
  var c = hex(id), r = parseInt(c.slice(1, 3), 16), g = parseInt(c.slice(3, 5), 16), b = parseInt(c.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62;
}
function autoName(it) { return typeLabel(it.type) + ' ' + cname(it.color); }
function addDays(iso, n) {
  var d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n);
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}
function prefersReducedMotion() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
}
function scrollToEl(el) {
  if (!el || !el.scrollIntoView) return;
  try { el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' }); } catch (e) { el.scrollIntoView(); }
}

/* ---------- Start, Tabs, Status ---------- */
function initApp() {
  try { document.documentElement.lang = 'de'; } catch (e) {}
  applyTheme();
  var nav = document.querySelector('nav.tabs');
  Array.prototype.forEach.call(nav.querySelectorAll('button[data-tab]'), function (b) {
    var slot = b.querySelector('.ti');
    if (slot) slot.replaceWith(ico(slot.getAttribute('data-ico')));
    b.addEventListener('click', function () { showTab(b.getAttribute('data-tab')); });
    b.addEventListener('keydown', function (ev) {
      var ids = TABS.map(function (t) { return t.id; }), i = ids.indexOf(b.getAttribute('data-tab')), j = -1;
      if (ev.key === 'ArrowRight') j = (i + 1) % ids.length;
      else if (ev.key === 'ArrowLeft') j = (i + ids.length - 1) % ids.length;
      else if (ev.key === 'Home') j = 0; else if (ev.key === 'End') j = ids.length - 1;
      if (j < 0) return;
      ev.preventDefault(); showTab(ids[j]); $('t-' + ids[j]).focus();
    });
  });
  showTab('today', true);
  renderSync();
}

function showTab(id, initial) {
  var prev = V.tab;
  V.tab = id;
  TABS.forEach(function (t) {
    var b = $('t-' + t.id), p = $('p-' + t.id), on = t.id === id;
    b.setAttribute('aria-selected', on ? 'true' : 'false');
    b.tabIndex = on ? 0 : -1;
    p.hidden = !on;
  });
  var P = PANELS[id], el = $('p-' + id);
  if (P) {
    if (!P.built) { P.build(el); P.built = true; V.dirty[id] = false; }
    else if (V.dirty[id] || (P.always && prev !== id)) { P.refresh(el); V.dirty[id] = false; }
  }
  if (!initial && prev !== id) window.scrollTo(0, 0);
}

function renderSync() {
  var el = $('sync'); if (!el) return;
  var txt;
  if (!S.ready) txt = 'Lädt …';
  else if (S.mode === 'db') txt = S.syncErr ? 'Konto nicht erreichbar' : 'Im Konto gespeichert';
  else txt = 'Auf diesem Gerät';
  el.textContent = txt;
  el.classList.toggle('err', !!S.syncErr);
  el.title = S.mode === 'db' ? 'Dein Schrank wird in deinem Claude-Konto gespeichert.' : 'Dein Schrank wird nur im Speicher dieses Browsers abgelegt.';
}

/* Wird von Store aufgerufen, sobald Daten da sind oder sich geändert haben.
   Im Konto-Modus kommen Snapshots oft in Serien, dann wird einmal gesammelt neu gezeichnet. */
var dataTimer = null;
function onData(now) {
  renderSync();
  clearTimeout(dataTimer);
  if (!now && S.mode === 'db') { dataTimer = setTimeout(function () { onData(true); }, 40); return; }
  if (V.ctx && V.ctx.must) {
    V.ctx.must = V.ctx.must.filter(function (m) { return m.kind !== 'item' || m.item || itemById(m.id); });
  }
  Object.keys(PANELS).forEach(function (k) { V.dirty[k] = true; });
  var P = PANELS[V.tab];
  if (P && P.built) { P.refresh($('p-' + V.tab)); V.dirty[V.tab] = false; }
}
/* nach eigenen Änderungen: im lokalen Modus ruft Store kein onData auf */
function changed() { onData(true); }

/* Hell / Dunkel: nur in der eigenständigen Fassung wählbar, im Artifact entscheidet claude.ai */
function themePref() { try { return localStorage.getItem('ankleide.theme') || 'auto'; } catch (e) { return 'auto'; } }
function applyTheme(v) {
  if (IN_CLAUDE) return;
  v = v || themePref();
  try { if (v === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', v); } catch (e) {}
}
function setTheme(v) { try { localStorage.setItem('ankleide.theme', v); } catch (e) {} applyTheme(v); }

/* ---------- Beispielschrank ---------- */
/* Wer ein Beispielteil ändert oder trägt, übernimmt den Beispielschrank als eigenen */
function adoptDemo(silent) {
  if (!isDemo()) return false;
  AK.DEMO.forEach(function (x) { Store.putItem(JSON.parse(JSON.stringify(x))); });
  if (!silent) toast('Beispielschrank übernommen. Du kannst jedes Teil ändern oder löschen.');
  return true;
}
function addDemoItems() {
  var have = {};
  S.items.forEach(function (x) { have[x.id] = 1; });
  var n = 0;
  AK.DEMO.forEach(function (x) { if (!have[x.id]) { Store.putItem(JSON.parse(JSON.stringify(x))); n++; } });
  return n;
}
function demoBanner(where) {
  var box = h('div', { class: 'banner', role: 'note' });
  function upd() {
    clear(box);
    box.hidden = !(S.ready && isDemo());
    if (box.hidden) return;
    box.append(
      h('div', { class: 'small' }, h('b', null, 'Beispielschrank. '),
        h('span', { class: 'muted' }, 'So arbeitet Ankleide mit gefülltem Schrank. Änderst du ein Teil oder trägst ein Outfit, wird er zu deinem.')),
      h('div', { class: 'row' },
        h('button', { class: 'btn small', type: 'button', onclick: function () { adoptDemo(); changed(); } }, 'Übernehmen'),
        h('button', { class: 'btn ghost small', type: 'button', onclick: function () { Store.setSetting('demoOff', true); V.needsRecalc = true; changed(); toast('Leerer Schrank. Lege dein erstes Teil an.'); } }, 'Leer starten'))
    );
  }
  box.upd = upd; upd();
  return box;
}

/* ---------- Bausteine ---------- */
function thumbEl(it, o) {
  o = o || {};
  var cls = 'thumb' + (it.pattern && it.pattern !== 'uni' ? ' ' + it.pattern : '') + (lightColor(it.color) ? ' light' : '') + (o.size ? ' ' + o.size : '');
  var t = h('span', { class: cls, style: '--c:' + hex(it.color) });
  if (it.photo) t.append(h('img', { src: it.photo, alt: '', loading: 'lazy' }));
  if (o.badges) {
    var b = h('span', { class: 'badges' });
    if (it.fav) b.append(h('span', { class: 'badge star', title: 'Lieblingsteil' }, '★'));
    if (it.basic) b.append(h('span', { class: 'badge', title: 'Basic' }, 'Basic'));
    if (it.never) b.append(h('span', { class: 'badge', title: 'Nie tragen' }, 'Nie'));
    else if (it.avail === false) b.append(h('span', { class: 'badge', title: 'In der Wäsche' }, 'Wäsche'));
    if (b.firstChild) t.append(b);
  }
  if (o.label) t.append(h('span', { class: 'tl' }, typeLabel(it.type)));
  return t;
}
function prow(it, end, sub) {
  return h('div', { class: 'prow' }, thumbEl(it, { size: 'sm' }),
    h('span', { class: 'pn' }, it.name, h('small', null, sub || (typeLabel(it.type) + ' · ' + cname(it.color)))),
    end != null ? h('span', { class: 'end' }, end) : h('span'));
}
function itemsOf(o) { return MAIN_SLOTS.map(function (k) { return o[k]; }).filter(Boolean); }
function spineColors(o) { return ['outer', 'mid', 'top', 'bottom', 'shoes'].map(function (k) { return o[k]; }).filter(Boolean).map(function (x) { return hex(x.color); }); }
function outfitTitle(o) {
  var lead = o.outer || o.mid || o.top;
  return lead && o.bottom ? typeLabel(lead.type) + ' & ' + typeLabel(o.bottom.type) : 'Outfit';
}
function fullKey(o) { return MAIN_SLOTS.map(function (k) { return o[k] ? o[k].id : '-'; }).join('|'); }

/* Segment-Schalter: opts = [{id, label}], get() liefert den aktiven Wert */
function seg(opts, get, set, label) {
  var el = h('div', { class: 'seg', role: 'group', 'aria-label': label });
  opts.forEach(function (o) {
    el.append(h('button', { type: 'button', 'data-v': String(o.id), 'aria-pressed': 'false', title: o.title || null,
      onclick: function () { set(o.id); el.upd(); } }, o.label));
  });
  el.upd = function () {
    var v = String(get());
    Array.prototype.forEach.call(el.children, function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-v') === v ? 'true' : 'false'); });
  };
  el.upd();
  return el;
}
/* Chip-Gruppe zum Umschalten (einzeln oder mehrfach) */
function chipGroup(opts, isOn, toggle, label) {
  var el = h('div', { class: 'chips', role: 'group', 'aria-label': label });
  opts.forEach(function (o) {
    el.append(h('button', { class: 'chip', type: 'button', 'data-v': String(o.id), 'aria-pressed': 'false',
      onclick: function () { toggle(o.id); el.upd(); } }, o.label, o.count != null ? h('span', { class: 'ct' }, o.count) : null));
  });
  el.upd = function () {
    Array.prototype.forEach.call(el.children, function (b, i) { b.setAttribute('aria-pressed', isOn(opts[i].id) ? 'true' : 'false'); });
  };
  el.upd();
  return el;
}
function checkbox(id, label, get, set) {
  var inp = h('input', { type: 'checkbox', id: id });
  inp.checked = !!get();
  inp.addEventListener('change', function () { set(inp.checked); });
  var el = h('label', { class: 'check', for: id }, inp, h('span', null, label));
  el.upd = function () { inp.checked = !!get(); };
  return el;
}
function sec(title, content, id) {
  return h('section', { class: 'sec', id: id || null }, h('h2', { class: 'mono' }, title), content);
}
/* Zweistufige Bestätigung im Seiteninhalt (kein confirm()) */
function confirmBtn(label, question, yesLabel, onYes, cls) {
  var wrap = h('div', { class: 'stack' });
  function idle() {
    clear(wrap);
    wrap.append(h('button', { class: 'btn ' + (cls || 'danger'), type: 'button', onclick: ask }, label));
  }
  function ask() {
    clear(wrap);
    var yes = h('button', { class: 'btn danger', type: 'button', onclick: function () { onYes(); } }, yesLabel);
    wrap.append(h('div', { class: 'confirm', role: 'alertdialog', 'aria-label': question },
      h('div', null, question),
      h('div', { class: 'row' }, yes, h('button', { class: 'btn ghost', type: 'button', onclick: idle }, 'Abbrechen'))));
    yes.focus();
  }
  idle();
  return wrap;
}

/* Outfit-Etikett. o = Ergebnis von AK.buildOutfit, opt = {i, ctx, actions, wished(it)} */
function outfitCard(o, opt) {
  opt = opt || {};
  var it = o.items, main = itemsOf(it);
  var spine = h('div', { class: 'spine', 'aria-hidden': 'true' });
  spineColors(it).forEach(function (c) { spine.append(h('i', { style: '--c:' + c })); });
  var sub = ['Nr. ' + pad((opt.i || 0) + 1)];
  if (opt.ctx) sub.push(levelName(opt.ctx.level));
  var head = h('div', { class: 'o-head' },
    h('div', null, h('div', { class: 'mono o-sub' }, sub.join(' · ')), h('h3', { class: 'o-title' }, outfitTitle(it))),
    h('div', { class: 'fit', title: 'Wie gut das Outfit zu deinen Angaben passt (5 bis 99)' },
      h('b', { class: 'num' }, o.score),
      h('div', { class: 'bar', 'aria-hidden': 'true' }, h('i', { style: 'width:' + o.score + '%' })),
      h('span', { class: 'mono' }, 'Stimmigkeit')));
  var pieces = h('div', { class: 'pieces' });
  ['top', 'mid', 'outer', 'bottom', 'shoes'].forEach(function (k) {
    var x = it[k]; if (!x) return;
    pieces.append(h('div', { class: 'piece' }, thumbEl(x),
      h('div', null, h('div', { class: 'pn' }, x.name, opt.wished && opt.wished(x) ? h('span', { class: 'tag' }, 'Wunsch') : null),
        h('span', { class: 'mono pmeta' }, slotName(k) + ' · ' + cname(x.color)))));
  });
  var acc = null;
  if (it.acc && it.acc.length) {
    acc = h('div', { class: 'acc', 'aria-label': 'Accessoires' });
    it.acc.forEach(function (a) { acc.append(h('span', null, h('i', { style: '--c:' + hex(a.color) }), a.name)); });
  }
  var notes = h('ul', { class: 'notes' });
  o.warns.forEach(function (w) { notes.append(h('li', { class: 'w' }, h('span', { class: 'vh' }, 'Achtung: '), w)); });
  o.notes.forEach(function (w) { notes.append(h('li', null, w)); });
  (o.softs || []).forEach(function (w) { notes.append(h('li', { class: 's' }, w)); });
  var body = h('div', { class: 'o-body' }, head, pieces, acc, notes);
  if (opt.actions) {
    var wearBtn = h('button', { class: 'btn', type: 'button' }, ico('check'), 'Das trage ich');
    var saveBtn = h('button', { class: 'btn ghost', type: 'button' }, ico('bookmark'), 'Merken');
    var key = fullKey(it);
    function updSave() {
      var on = isSaved(key);
      saveBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      saveBtn.lastChild.textContent = on ? 'Gemerkt' : 'Merken';
    }
    wearBtn.addEventListener('click', function () {
      if (wearBtn.disabled) return;
      wearOutfit(it, opt.ctx || {});
      wearBtn.disabled = true; wearBtn.classList.add('done'); wearBtn.lastChild.textContent = 'Eingetragen';
    });
    saveBtn.addEventListener('click', function () { toggleSaved(it, opt.ctx || {}); updSave(); });
    updSave();
    body.append(h('div', { class: 'o-actions' }, wearBtn, saveBtn));
  }
  return h('article', { class: 'outfit', 'aria-label': 'Vorschlag ' + ((opt.i || 0) + 1) + ': ' + main.map(function (x) { return x.name; }).join(', ') }, spine, body);
}

/* Kompakte Zeile: Farbstreifen plus Namen */
function miniOutfit(items, meta, actions) {
  var all = items.filter(Boolean);
  var sp = h('div', { class: 'mspine', 'aria-hidden': 'true' });
  all.filter(function (x) { return x.slot !== 'acc'; }).forEach(function (x) { sp.append(h('i', { style: '--c:' + hex(x.color) })); });
  return h('div', { class: 'mini' }, sp, h('div', { class: 'mbody' },
    meta ? h('div', { class: 'mono' }, meta) : null,
    h('div', { class: 'mnames' }, all.map(function (x) { return x.name; }).join(' · ')),
    actions && actions.length ? h('div', { class: 'mact' }, actions) : null));
}
function outfitList(o) { return itemsOf(o).concat(o.acc || []); }

/* ---------- Aktionen ---------- */
function wearOutfit(items, ctx) {
  var wasDemo = adoptDemo(true);
  var list = Array.isArray(items) ? items : outfitList(items);
  var today = todayStr(), ids = [], names = [], laundry = [];
  list.forEach(function (x) {
    var own = S.items.filter(function (y) { return y.id === x.id; })[0];
    if (!own) return;
    var c = JSON.parse(JSON.stringify(own));
    c.wears = (c.wears || 0) + 1; c.last = today;
    if (S.settings.autoLaundry && c.slot === 'top') { c.avail = false; laundry.push(c.name); }
    Store.putItem(c);
    ids.push(c.id); names.push(c.name);
  });
  if (!ids.length) { toast('Diese Teile sind nicht mehr in deinem Schrank.'); return; }
  var w = ctx.weather || {};
  Store.putDiary({ id: uid(), ts: Date.now(), date: today, level: ctx.level != null ? ctx.level : null,
    temp: w.temp != null ? w.temp : (ctx.temp != null ? ctx.temp : null), activity: ctx.activity || null, ids: ids, names: names });
  var msg = wasDemo ? 'Eingetragen. Der Beispielschrank ist jetzt dein Schrank.' : 'Eingetragen. Viel Freude damit!';
  if (laundry.length) msg += ' In der Wäsche: ' + laundry.join(', ') + '.';
  toast(msg);
  changed();
}
function savedList() { return Array.isArray(S.settings.saved) ? S.settings.saved : []; }
function isSaved(key) { return savedList().some(function (s) { return s.key === key; }); }
function toggleSaved(items, ctx) {
  var key = fullKey(items), list = savedList().slice();
  if (isSaved(key)) {
    list = list.filter(function (s) { return s.key !== key; });
    Store.setSetting('saved', list); toast('Nicht mehr gemerkt.');
  } else {
    var all = outfitList(items), w = ctx.weather || {};
    list.unshift({ id: uid(), ts: Date.now(), key: key, level: ctx.level != null ? ctx.level : null, temp: w.temp != null ? w.temp : null,
      activity: ctx.activity || null, ids: all.map(function (x) { return x.id; }), names: all.map(function (x) { return x.name; }) });
    Store.setSetting('saved', list.slice(0, 40)); toast('Gemerkt. Du findest es unter Mehr → Tagebuch.');
  }
  V.dirty.more = true;
}

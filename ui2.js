/* ===== Ankleide: Oberfläche, Teil 2 (Kern: Tabs, Status, Bausteine, Aktionen) ===== */
var TABS = [
  { id: 'today', name: 'Heute' }, { id: 'closet', name: 'Schrank' },
  { id: 'scan', name: 'Scan' }, { id: 'more', name: 'Mehr' }
];
var SHORT = ['Sport', 'Entspannt', 'Casual', 'Smart Casual', 'Business Casual', 'Business Formal', 'Black Tie'];
var LV = AK.UI_LEVELS;
function clampLv(L) { return Math.max(LV[0], Math.min(LV[LV.length - 1], L)); }
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
ICONS.up1 = '<path d="M7 11v9H4v-9zM7 11l4-7c1.5 0 2.5 1 2.2 2.6L12.6 10H18a2 2 0 0 1 2 2.3l-1.2 6A2 2 0 0 1 16.8 20H7"/>';
ICONS.down1 = '<path d="M7 13V4H4v9zM7 13l4 7c1.5 0 2.5-1 2.2-2.6L12.6 14H18a2 2 0 0 0 2-2.3l-1.2-6A2 2 0 0 0 16.8 4H7"/>';
ICONS.cloud = '<path d="M7 18h10a4 4 0 0 0 .6-8A6 6 0 0 0 6 9.5 4.3 4.3 0 0 0 7 18z"/>';
ICONS.rain = '<path d="M7 14h10a4 4 0 0 0 .6-8A6 6 0 0 0 6 5.5 4.3 4.3 0 0 0 7 14zM8 17l-1 3M12 17l-1 3M16 17l-1 3"/>';
ICONS.snow = '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5"/>';
ICONS.wind = '<path d="M3 9h11a3 3 0 1 0-3-3M3 15h15a3 3 0 1 1-3 3M3 12h8"/>';
ICONS.search = '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>';
ICONS.pin = '<path d="M12 21s-6.5-6.2-6.5-11A6.5 6.5 0 0 1 18.5 10c0 4.8-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>';
ICONS.refresh = '<path d="M20 11a8 8 0 0 0-14.6-4.5M4 4v4h4M4 13a8 8 0 0 0 14.6 4.5M20 20v-4h-4"/>';
ICONS.minus = '<path d="M5 12h14"/>';
ICONS.ext = '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>';
ICONS.list = '<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>';
ICONS.spark = '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>';

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
  var art = !it.photo && typeof ART !== 'undefined' && !!AK.TYPES[it.type];
  var cls = 'thumb' + (art ? ' art-tile' : (it.pattern && it.pattern !== 'uni' ? ' ' + it.pattern : '') + (lightColor(it.color) ? ' light' : '')) + (o.size ? ' ' + o.size : '');
  var t = h('span', { class: cls, style: '--c:' + hex(it.color) });
  if (it.photo) t.append(h('img', { src: it.photo, alt: '', loading: 'lazy' }));
  else if (art) { var w = h('span', { class: 'art-wrap', 'aria-hidden': 'true' }); w.innerHTML = ART.item(it); t.append(w); }
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
  var lead = o.mid || o.top;
  return lead && o.bottom ? typeLabel(lead.type) + ' & ' + typeLabel(o.bottom.type) : 'Outfit';
}
function fullKey(o) { return MAIN_SLOTS.map(function (k) { return o[k] ? o[k].id : '-'; }).join('|'); }

/* ---------- Suche über Teile: alle Wörter müssen passen (Name, Art, Bereich, Farbe, Muster, Merkmale, Synonyme) ---------- */
var TYPE_SYN = { tshirt: 'shirt tee oberteil', langarm: 'longsleeve shirt', polo: 'poloshirt', hemd: 'shirt bluse business', sporttop: 'sport shirt',
  pullover: 'pulli strick sweater', feinstrick: 'pulli strick rollkragen', strickjacke: 'cardigan strick', sweat: 'sweater pulli', hoodie: 'kapuze pulli',
  fleece: 'pulli', sakko: 'blazer jackett anzug', smoking: 'anzug', weste: 'gilet anzug', jeansjacke: 'jacke', lederjacke: 'jacke', bomber: 'jacke',
  uebergang: 'jacke', regenjacke: 'jacke regen', softshell: 'jacke', trench: 'mantel', wintermantel: 'mantel', parka: 'jacke mantel winter', daune: 'jacke winter puffer',
  trainingsjacke: 'jacke', jeans: 'hose denim', chino: 'hose', stoff: 'hose anzughose', anzughose: 'hose anzug', jogger: 'hose jogginghose', shorts: 'kurze hose',
  sporthose: 'hose', cargo: 'hose', sneaker: 'schuhe turnschuh', laufschuh: 'schuhe turnschuh', boots: 'schuhe stiefel', chelsea: 'schuhe stiefel boots',
  loafer: 'schuhe slipper', derby: 'schuhe lederschuh', oxford: 'schuhe lederschuh', sandalen: 'schuhe', winterstiefel: 'schuhe stiefel',
  guertel: 'accessoire', uhr: 'accessoire', schal: 'accessoire', muetze: 'accessoire beanie', handschuhe: 'accessoire', krawatte: 'accessoire schlips',
  fliege: 'accessoire', einstecktuch: 'accessoire', cap: 'accessoire kappe', sonnenbrille: 'accessoire brille' };
var COLOR_SYN = { navy: 'blau dunkelblau', indigo: 'blau dunkelblau', denim: 'blau hellblau', blau: 'blau', hellblau: 'blau', anthrazit: 'grau dunkelgrau',
  grau: 'grau', weiss: 'hell', beige: 'hell creme', sand: 'beige', camel: 'braun beige', braun: 'braun', oliv: 'gruen khaki', gruen: 'gruen',
  bordeaux: 'rot weinrot', rot: 'rot', rosa: 'pink', schwarz: 'dunkel', lila: 'violett', gelb: 'gelb', orange: 'orange' };
function normQ(s) { return String(s || '').toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/-/g, ''); }
function hay(it) {
  var p = (AK.PATTERNS.filter(function (x) { return x.id === it.pattern; })[0] || {}).name || '';
  return normQ([it.name, typeLabel(it.type), it.type, slotName(it.slot), cname(it.color), it.color, COLOR_SYN[it.color] || '', p,
    TYPE_SYN[it.type] || '', it.fav ? 'liebling lieblingsteil favorit' : '', it.basic ? 'basic' : '', it.never ? 'nie' : '',
    it.avail === false ? 'waesche wäsche' : ''].join(' '));
}
function matchItem(it, q) {
  var toks = normQ(q).split(/\s+/).filter(Boolean);
  if (!toks.length) return true;
  var hs = hay(it);
  return toks.every(function (t) { return hs.indexOf(t) >= 0; });
}

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
  if (it.outer) sub.push('mit ' + typeLabel(it.outer.type));
  var head = h('div', { class: 'o-head' },
    h('div', null, h('div', { class: 'mono o-sub' }, sub.join(' · ')), h('h3', { class: 'o-title' }, outfitTitle(it))),
    h('div', { class: 'fit', title: 'Wie gut das Outfit zu deinen Angaben passt (5 bis 99)' },
      h('b', { class: 'num' }, o.score),
      h('div', { class: 'bar', 'aria-hidden': 'true' }, h('i', { style: 'width:' + o.score + '%' })),
      h('span', { class: 'mono' }, 'Stimmigkeit')));
  var pieces = h('div', { class: 'pieces' });
  ['outer', 'mid', 'top', 'bottom', 'shoes'].forEach(function (k) {
    var x = it[k]; if (!x) return;
    pieces.append(h('div', { class: 'piece' }, thumbEl(x, { size: 'md' }),
      h('div', null, h('div', { class: 'pn' }, x.name, opt.wished && opt.wished(x) ? h('span', { class: 'tag' }, 'Wunsch') : null),
        h('span', { class: 'mono pmeta' }, slotName(k)))));
  });
  var fig = null;
  if (typeof ART !== 'undefined') {
    fig = h('div', { class: 'o-fig', role: 'img', 'aria-label': 'Zeichnung des Outfits' });
    fig.innerHTML = ART.outfit(it, '');
    fig.firstChild.setAttribute('aria-hidden', 'true');
  }
  var acc = null;
  if (it.acc && it.acc.length) {
    acc = h('div', { class: 'acc', 'aria-label': 'Accessoires' });
    it.acc.forEach(function (a) { acc.append(h('span', null, h('i', { style: '--c:' + hex(a.color) }), a.name)); });
  }
  var warns = null;
  if (o.warns.length) {
    warns = h('ul', { class: 'notes' });
    o.warns.forEach(function (w) { warns.append(h('li', { class: 'w' }, h('span', { class: 'vh' }, 'Achtung: '), w)); });
  }
  var notes = h('ul', { class: 'notes' });
  o.notes.forEach(function (w) { notes.append(h('li', null, w)); });
  (o.softs || []).forEach(function (w) { notes.append(h('li', { class: 's' }, w)); });
  var why = h('details', { class: 'o-why' }, h('summary', null, 'Warum dieses Outfit?'), notes);
  var body = h('div', { class: 'o-body' }, head, h('div', { class: 'o-main' + (fig ? '' : ' nofig') }, fig, pieces), opt.noPhoto ? null : photoBlock(it), acc, warns, why);
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
    var likeBtn = h('button', { class: 'btn ghost icon', type: 'button', 'aria-label': 'Gefällt mir', title: 'Gefällt mir' }, ico('up1'));
    var nopeBtn = h('button', { class: 'btn ghost icon', type: 'button', 'aria-label': 'Nicht mein Stil', title: 'Nicht mein Stil' }, ico('down1'));
    function updFb() {
      var v = feedbackFor(key);
      likeBtn.setAttribute('aria-pressed', v > 0 ? 'true' : 'false');
      nopeBtn.setAttribute('aria-pressed', v < 0 ? 'true' : 'false');
    }
    likeBtn.addEventListener('click', function () { rateOutfit(it, 1); updFb(); });
    nopeBtn.addEventListener('click', function () { rateOutfit(it, -1); updFb(); });
    updFb();
    body.append(h('div', { class: 'o-actions' }, wearBtn, saveBtn, h('div', { class: 'rate', role: 'group', 'aria-label': 'Bewerten' }, likeBtn, nopeBtn)));
  }
  return h('article', { class: 'outfit', 'aria-label': 'Vorschlag ' + ((opt.i || 0) + 1) + ': ' + main.map(function (x) { return x.name; }).join(', ') }, spine, body);
}

/* ---------- Foto-Eindruck: KI-Bild (nur eigenständige Fassung) und Links zu ähnlichen Looks im Web ---------- */
var EN_TYPE = { tshirt: 't-shirt', langarm: 'long-sleeve t-shirt', polo: 'polo shirt', hemd: 'button-down dress shirt', sporttop: 'sports t-shirt',
  pullover: 'crew-neck wool sweater', feinstrick: 'fine-knit sweater', strickjacke: 'cardigan', sweat: 'sweatshirt', hoodie: 'hoodie', fleece: 'fleece pullover',
  sakko: 'blazer', smoking: 'tuxedo jacket', weste: 'waistcoat', jeansjacke: 'denim jacket', lederjacke: 'leather jacket', bomber: 'bomber jacket',
  uebergang: 'light jacket', regenjacke: 'rain jacket', softshell: 'softshell jacket', trench: 'trench coat', wintermantel: 'wool overcoat', parka: 'parka',
  daune: 'down jacket', trainingsjacke: 'track jacket', jeans: 'jeans', chino: 'chinos', stoff: 'wool trousers', anzughose: 'suit trousers', jogger: 'joggers',
  shorts: 'shorts', sporthose: 'sports leggings', cargo: 'cargo pants', sneaker: 'sneakers', laufschuh: 'running shoes', boots: 'leather boots',
  chelsea: 'chelsea boots', loafer: 'loafers', derby: 'derby shoes', oxford: 'oxford shoes', sandalen: 'sandals', winterstiefel: 'winter boots',
  guertel: 'leather belt', schal: 'scarf', muetze: 'beanie', krawatte: 'tie', fliege: 'bow tie', einstecktuch: 'pocket square', cap: 'baseball cap', sonnenbrille: 'sunglasses' };
var EN_COLOR = { schwarz: 'black', anthrazit: 'charcoal', grau: 'grey', weiss: 'white', navy: 'navy', indigo: 'dark indigo', denim: 'light blue', beige: 'beige',
  sand: 'sand-colored', camel: 'camel', braun: 'brown', oliv: 'olive green', bordeaux: 'burgundy', blau: 'blue', hellblau: 'light blue', gruen: 'green',
  lila: 'purple', rot: 'red', orange: 'orange', gelb: 'mustard yellow', rosa: 'pink' };
var EN_PAT = { streifen: 'striped', karo: 'checked', print: 'graphic print' };
function imgMode() { return IN_CLAUDE ? 'off' : (S.settings.imgMode || 'auto'); }
function personWord(lang) { var p = S.settings.imgPerson || 'neutral'; return lang === 'de' ? ({ herren: 'Herren', damen: 'Damen' }[p] || '') : ({ herren: 'man', damen: 'woman' }[p] || 'person'); }
function aiPromptFor(o) {
  function d(x) { return [EN_PAT[x.pattern], EN_COLOR[x.color], EN_TYPE[x.type] || x.type].filter(Boolean).join(' '); }
  var wear = [];
  if (o.outer) wear.push('an open ' + d(o.outer));
  if (o.mid) wear.push((o.mid.type === 'sakko' ? 'an open ' : 'a ') + d(o.mid));
  if (o.top) wear.push('a ' + d(o.top));
  if (o.bottom) wear.push(d(o.bottom));
  if (o.shoes) wear.push(d(o.shoes));
  var acc = (o.acc || []).filter(function (a) { return EN_TYPE[a.type]; }).map(function (a) { return 'a ' + d(a); });
  return 'Full-body fashion photo of a ' + personWord('en') + ' standing straight, front view, wearing ' + wear.join(', ') +
    (acc.length ? ', with ' + acc.join(', ') : '') + '. Plain light grey studio background, natural light, realistic, sharp focus';
}
function seedOf(s) { var x = 7; for (var i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) % 1000003; return x; }
function aiUrl(o) {
  return 'https://image.pollinations.ai/prompt/' + encodeURIComponent(aiPromptFor(o)) + '?width=512&height=768&nologo=true&private=true&seed=' + seedOf(fullKey(o) + (S.settings.imgPerson || ''));
}
function webQuery(o) {
  var q = ['outer', 'mid', 'top', 'bottom', 'shoes'].map(function (k) { return o[k]; }).filter(Boolean).map(function (x) { return cname(x.color) + ' ' + typeLabel(x.type); });
  return q.join(' ') + ' Outfit' + (personWord('de') ? ' ' + personWord('de') : '');
}
/* Bilder nacheinander laden, damit der freie Dienst nicht überlastet; ausgelastet = später erneut versuchen */
var IMGQ = { list: [], cur: null, timer: null };
function queueImg(frame, url) {
  if (IMGQ.cur && !IMGQ.cur.frame.isConnected) { IMGQ.cur.img.src = ''; IMGQ.cur = null; }
  IMGQ.list.push({ frame: frame, url: url, tries: 0 });
  clearTimeout(IMGQ.timer); IMGQ.timer = setTimeout(pumpImg, 900);
}
function frameState(frame, state, txt) {
  frame.setAttribute('data-state', state);
  var st = frame.querySelector('.ph-status');
  if (st) { st.textContent = txt || ''; st.classList.toggle('busy', state === 'loading' || state === 'retry'); }
}
function pumpImg() {
  if (IMGQ.cur) return;
  var job = IMGQ.list.shift();
  while (job && !job.frame.isConnected) job = IMGQ.list.shift();
  if (!job) return;
  var img = new Image();
  job.img = img; IMGQ.cur = job;
  frameState(job.frame, 'loading', job.tries ? 'Neuer Versuch …' : 'KI-Bild wird erzeugt …');
  function next() { if (IMGQ.cur === job) IMGQ.cur = null; pumpImg(); }
  img.onload = function () {
    img.alt = 'KI-Bild des Outfits (ungefährer Eindruck)';
    var f = job.frame.querySelector('.ph-img'); clear(f); f.append(img);
    frameState(job.frame, 'done', ''); next();
  };
  img.onerror = function () {
    if (!job.frame.isConnected) { next(); return; }
    job.tries++;
    if (job.tries < 3) {
      frameState(job.frame, 'retry', 'Dienst ausgelastet, neuer Versuch in ein paar Sekunden …');
      IMGQ.cur = null;
      setTimeout(function () { IMGQ.list.unshift(job); pumpImg(); }, 11000);
    } else { frameState(job.frame, 'error', 'Gerade kein Bild verfügbar (Dienst ausgelastet oder offline).'); next(); }
  };
  img.referrerPolicy = 'no-referrer';
  img.src = job.url;
}
function photoBlock(it) {
  var mode = imgMode(), q = webQuery(it);
  var links = h('div', { class: 'ph-links' },
    h('a', { class: 'btn ghost small', href: 'https://www.pinterest.de/search/pins/?q=' + encodeURIComponent(q), target: '_blank', rel: 'noopener noreferrer' }, ico('ext'), 'Pinterest'),
    h('a', { class: 'btn ghost small', href: 'https://www.google.com/search?tbm=isch&q=' + encodeURIComponent(q), target: '_blank', rel: 'noopener noreferrer' }, ico('ext'), 'Google Bilder'));
  var side = h('div', { class: 'ph-side' }, h('span', { class: 'mono' }, 'Ähnliche Looks im Web'), links);
  if (mode === 'off') {
    if (IN_CLAUDE) side.append(h('span', { class: 'muted small' }, 'KI-Bilder gibt es in der eigenständigen Fassung, claude.ai sperrt Bilder aus dem Netz.'));
    return h('div', { class: 'o-photo nofr' }, side);
  }
  var frame = h('div', { class: 'ph-frame', 'data-state': 'idle' }, h('div', { class: 'ph-img' }), h('div', { class: 'ph-status', 'aria-live': 'polite' }));
  var url = aiUrl(it);
  if (mode === 'auto') queueImg(frame, url);
  else {
    frame.querySelector('.ph-img').append(h('button', { class: 'btn small', type: 'button', onclick: function (ev) { ev.currentTarget.remove(); queueImg(frame, url); } }, ico('spark'), 'KI-Bild erzeugen'));
  }
  side.insertBefore(h('span', { class: 'muted small' }, 'KI-Bild, nur ein ungefährer Eindruck. Farben und Schnitte können abweichen.'), links);
  return h('div', { class: 'o-photo' }, frame, side);
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
/* ---------- Vorlieben lernen ----------
   Jede Bewertung zählt für alle Paare von Teilen im Outfit: gefällt +1, nicht mein Stil −1,5,
   jedes getragene Outfit +0,3. Die Engine verrechnet das über ctx.pairs. */
var PREF = { sig: null, pairs: null, avoid: [] };
function prefSig() { return S.feedback.length + ':' + ((S.feedback[0] || {}).id || '') + ':' + S.diary.length + ':' + ((S.diary[0] || {}).id || ''); }
function buildPrefs() {
  var sig = prefSig();
  if (PREF.sig === sig) return PREF;
  var p = {}, avoid = [];
  function addAll(ids, w) {
    ids = (ids || []).slice().sort();
    for (var i = 0; i < ids.length; i++) for (var j = i + 1; j < ids.length; j++) { var k = ids[i] + '|' + ids[j]; p[k] = (p[k] || 0) + w; }
  }
  S.feedback.forEach(function (f) { addAll(f.ids, f.v > 0 ? 1 : -1.5); if (f.v < 0 && f.ck) avoid.push(f.ck); });
  S.diary.forEach(function (d) { addAll(d.ids, 0.3); });
  PREF = { sig: sig, pairs: Object.keys(p).length ? p : null, avoid: avoid };
  return PREF;
}
function prefPairs() { return buildPrefs().pairs; }
function prefAvoid() { return buildPrefs().avoid; }
function feedbackFor(key) { var f = S.feedback.filter(function (x) { return x.key === key; })[0]; return f ? f.v : 0; }
function rateOutfit(items, v) {
  var key = fullKey(items), old = S.feedback.filter(function (x) { return x.key === key; })[0];
  if (old) Store.delFeedback(old.id);
  if (old && old.v === v) { toast('Bewertung zurückgenommen.'); V.dirty.more = true; return; }
  Store.putFeedback({ id: uid(), ts: Date.now(), v: v, key: key, ck: AK.comboKey(items), ids: itemsOf(items).map(function (x) { return x.id; }) });
  if (S.feedback.length > 600) S.feedback.slice(600).forEach(function (f) { Store.delFeedback(f.id); });
  toast(v > 0 ? 'Gemerkt: Das gefällt dir. Ähnliches schlage ich öfter vor.' : 'Verstanden. Diese Kombination zeige ich nicht mehr, Ähnliches seltener.');
  V.dirty.more = true;
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

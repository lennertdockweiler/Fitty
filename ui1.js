/* ===== Ankleide: Oberfläche, Teil 1 (Helfer, Speicher, Fotos) ===== */
var S = { items: [], diary: [], settings: {}, ready: false, mode: 'boot', syncErr: false };
var V = { tab: 'today', results: null, scan: null };
var $ = function (id) { return document.getElementById(id); };

function h(tag, a) {
  var e = document.createElement(tag);
  if (a) for (var k in a) {
    var v = a[k];
    if (k === 'class') e.className = v;
    else if (k === 'style') e.style.cssText = v;
    else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
    else if (v === true) e.setAttribute(k, '');
    else if (v !== false && v != null) e.setAttribute(k, v);
  }
  for (var i = 2; i < arguments.length; i++) add(e, arguments[i]);
  return e;
}
function add(e, c) {
  if (c == null || c === false) return;
  if (Array.isArray(c)) { c.forEach(function (x) { add(e, x); }); return; }
  e.append(c.nodeType ? c : document.createTextNode(String(c)));
}
function clear(e) { while (e.firstChild) e.removeChild(e.firstChild); return e; }
function pad(n) { return n < 10 ? '0' + n : '' + n; }
function todayStr() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function hex(id) { var c = AK.COLORS.filter(function (x) { return x.id === id; })[0]; return c ? c.hex : '#888'; }
function cname(id) { var c = AK.COLORS.filter(function (x) { return x.id === id; })[0]; return c ? c.name : id; }
function typeLabel(t) { return AK.TYPES[t] ? AK.TYPES[t].label : t; }
function slotName(id) { return AK.SLOTS.filter(function (s) { return s.id === id; })[0].name; }
function deDate(iso) {
  try { return new Date(iso + 'T12:00:00').toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' }); } catch (e) { return iso; }
}

var ICONS = {
  sun: '<path d="M12 4V2m0 20v-2m8-8h2M2 12h2m13.7-5.7 1.4-1.4M4.9 19.1l1.4-1.4m0-11.4L4.9 4.9m14.2 14.2-1.4-1.4"/><circle cx="12" cy="12" r="4"/>',
  hanger: '<path d="M12 7a2.5 2.5 0 1 0-2.5-2.5M12 7v2.5l9 6.5a1.5 1.5 0 0 1-.9 2.7H3.9A1.5 1.5 0 0 1 3 16l9-6.5"/>',
  cam: '<path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.6"/>',
  more: '<path d="M4 6h16M4 12h16M4 18h10"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="15" r="1"/><circle cx="15" cy="9" r="1"/><circle cx="9" cy="15" r="1"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  img: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m4 18 5-5 4 4 3-3 4 4"/>'
};
function ico(n) {
  var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor');
  s.setAttribute('stroke-width', '1.8'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round');
  s.setAttribute('aria-hidden', 'true'); s.innerHTML = ICONS[n] || '';
  return s;
}

var toastTimer = null;
function toast(msg) {
  var t = $('toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 3200);
}

/* Sheet: Overlay von unten (Escape schließt, Fokus bleibt im Sheet und kehrt danach zurück) */
var sheetKeys = null;
function openSheet(title, build) {
  var root = $('sheet-root');
  var prev = root.firstChild ? null : document.activeElement;
  if (sheetKeys) document.removeEventListener('keydown', sheetKeys);
  var closed = false;
  var close = function () {
    if (closed) return; closed = true;
    document.removeEventListener('keydown', keys); if (sheetKeys === keys) sheetKeys = null;
    clear(root); document.body.style.overflow = '';
    if (prev && prev.focus && document.contains(prev)) prev.focus();
  };
  var keys = function (ev) {
    if (ev.key === 'Escape') { ev.preventDefault(); close(); return; }
    if (ev.key !== 'Tab') return;
    var f = Array.prototype.filter.call(sheet.querySelectorAll('button, input, select, textarea, a[href], [tabindex="0"]'), function (x) { return !x.disabled && x.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (ev.shiftKey && (document.activeElement === first || document.activeElement === sheet)) { ev.preventDefault(); last.focus(); }
    else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
  };
  var sheet = h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': title, tabindex: '-1' });
  var head = h('div', { class: 'sheet-head' }, h('h2', null, title),
    h('button', { class: 'btn ghost small', type: 'button', 'aria-label': 'Schließen', onclick: close }, ico('x')));
  var body = h('div', { class: 'stack' });
  sheet.append(head, body);
  var back = h('div', { class: 'backdrop', onclick: function (ev) { if (ev.target === back) close(); } }, sheet);
  if (root.firstChild && root._prev) prev = root._prev;
  root._prev = prev;
  clear(root); root.append(back); document.body.style.overflow = 'hidden';
  sheetKeys = keys; document.addEventListener('keydown', keys);
  build(body, close);
  try { sheet.focus({ preventScroll: true }); } catch (e) { sheet.focus(); }
  return close;
}

/* ---------- Speicher: Konto-Datenbank, sonst lokal ---------- */
var Store = {
  mode: 'local', col: null, chains: {}, timer: null,
  load: function () {
    try {
      var raw = localStorage.getItem('ankleide.v1');
      if (raw) { var o = JSON.parse(raw); S.items = (o.items || []).map(AK.normalize); S.diary = o.diary || []; S.settings = o.settings || {}; }
    } catch (e) {}
  },
  saveLocal: function () {
    try { localStorage.setItem('ankleide.v1', JSON.stringify({ items: S.items, diary: S.diary, settings: S.settings })); }
    catch (e) { toast('Lokaler Speicher voll. Lösche Teile oder nutze kleinere Fotos.'); }
  },
  write: function (id, data) {
    if (this.mode !== 'db') { this.saveLocal(); return; }
    var self = this;
    data = JSON.parse(JSON.stringify(data));
    this.chains[id] = (this.chains[id] || Promise.resolve()).then(function () { return self.col.doc(id).set(data); }).catch(function (e) { self.fail(e); });
  },
  remove: function (id) {
    if (this.mode !== 'db') { this.saveLocal(); return; }
    var self = this;
    this.chains[id] = (this.chains[id] || Promise.resolve()).then(function () { return self.col.doc(id).delete(); }).catch(function (e) { self.fail(e); });
  },
  fail: function (e) {
    S.syncErr = true; renderSync();
    toast('Das Speichern im Konto hat nicht geklappt. Änderungen sind nur auf diesem Gerät sichtbar.');
  },
  putItem: function (it) {
    it = AK.normalize(it); it.demo = false;
    var i = S.items.findIndex(function (x) { return x.id === it.id; });
    if (i < 0) S.items.push(it); else S.items[i] = it;
    this.write('g_' + it.id, Object.assign({ kind: 'g' }, it));
  },
  delItem: function (id) {
    S.items = S.items.filter(function (x) { return x.id !== id; });
    this.remove('g_' + id);
  },
  putDiary: function (e) {
    S.diary.unshift(e);
    this.write('d_' + e.id, Object.assign({ kind: 'd' }, e));
  },
  delDiary: function (id) {
    S.diary = S.diary.filter(function (x) { return x.id !== id; });
    this.remove('d_' + id);
  },
  setSetting: function (k, v) {
    S.settings[k] = v;
    this.write('settings', Object.assign({ kind: 's' }, S.settings));
  },
  init: async function () {
    var user = null, db = null, id = null;
    if (window.claude && window.claude.use) {
      try { user = await window.claude.use('user'); } catch (e) {}
      try { db = await window.claude.use('db'); } catch (e) {}
      try { id = user ? await user.id() : null; } catch (e) {}
    }
    if (db && id) {
      this.mode = 'db'; S.mode = 'db';
      this.col = db.collection('data/users/' + id);
      var self = this;
      this.timer = setTimeout(function () { S.syncErr = true; renderSync(); }, 10000);
      this.col.onSnapshot(function (snap) {
        var items = [], diary = [], settings = {};
        snap.docs.forEach(function (d) {
          var v = d.data(); if (!v) return;
          var o = Object.assign({}, v); delete o.kind;
          if (d.id.indexOf('g_') === 0) items.push(AK.normalize(o));
          else if (d.id.indexOf('d_') === 0) diary.push(o);
          else if (d.id === 'settings') settings = o;
        });
        diary.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
        S.items = items; S.diary = diary; S.settings = settings;
        if (!snap.metadata.fromCache) { clearTimeout(self.timer); S.syncErr = false; }
        S.ready = true; onData();
      }, function (e) { self.fail(e); S.ready = true; onData(); });
    } else {
      this.mode = 'local'; S.mode = 'local'; this.load(); S.ready = true; onData();
    }
  }
};

/* Aktiver Schrank: eigene Teile, sonst Beispiel-Schrank */
function wardrobe() {
  if (S.items.length) return S.items;
  if (S.settings.demoOff) return [];
  return AK.DEMO;
}
function isDemo() { return !S.items.length && !S.settings.demoOff; }

/* ---------- Fotos ---------- */
function loadImg(file) {
  return new Promise(function (res, rej) {
    var url = URL.createObjectURL(file), im = new Image();
    im.onload = function () { URL.revokeObjectURL(url); res(im); };
    im.onerror = function () { URL.revokeObjectURL(url); rej(new Error('Bild nicht lesbar')); };
    im.src = url;
  });
}
var RGB = null;
function palette() {
  if (!RGB) RGB = AK.COLORS.map(function (c) { return { id: c.id, r: parseInt(c.hex.slice(1, 3), 16), g: parseInt(c.hex.slice(3, 5), 16), b: parseInt(c.hex.slice(5, 7), 16) }; });
  return RGB;
}
function nearestColor(r, g, b) {
  var best = null, bd = 1e12;
  palette().forEach(function (c) {
    var d = 2 * (r - c.r) * (r - c.r) + 4 * (g - c.g) * (g - c.g) + 3 * (b - c.b) * (b - c.b);
    if (d < bd) { bd = d; best = c.id; }
  });
  return best;
}
function detectColor(cv) {
  var w = cv.width, hh = cv.height, d = cv.getContext('2d').getImageData(0, 0, w, hh).data;
  var bg = [0, 0, 0], n = 0, i, k;
  function acc(x, y) { k = (y * w + x) * 4; bg[0] += d[k]; bg[1] += d[k + 1]; bg[2] += d[k + 2]; n++; }
  for (i = 0; i < w; i++) { acc(i, 0); acc(i, hh - 1); }
  for (i = 0; i < hh; i++) { acc(0, i); acc(w - 1, i); }
  bg = bg.map(function (v) { return v / n; });
  var votes = {}, any = 0;
  for (var y = Math.floor(hh * 0.18); y < hh * 0.82; y++) for (var x = Math.floor(w * 0.18); x < w * 0.82; x++) {
    k = (y * w + x) * 4;
    var dr = d[k] - bg[0], dg = d[k + 1] - bg[1], db = d[k + 2] - bg[2];
    if (dr * dr + dg * dg + db * db < 1500) continue;
    var id = nearestColor(d[k], d[k + 1], d[k + 2]);
    votes[id] = (votes[id] || 0) + 1; any++;
  }
  if (!any) return nearestColor(bg[0], bg[1], bg[2]);
  return Object.keys(votes).sort(function (a, b) { return votes[b] - votes[a]; })[0];
}
async function processPhoto(file) {
  var im = await loadImg(file);
  function draw(max) {
    var sc = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(im.naturalWidth * sc)); c.height = Math.max(1, Math.round(im.naturalHeight * sc));
    c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
    return c;
  }
  var big = draw(900), small = draw(400), tiny = draw(64);
  var blob = await new Promise(function (r) { big.toBlob(r, 'image/jpeg', 0.82); });
  return { thumb: small.toDataURL('image/jpeg', 0.7), blob: blob, color: detectColor(tiny) };
}

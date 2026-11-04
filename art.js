/* ===== Ankleide: Zeichnungen (jedes Teil als Bild, jedes Outfit an der Schneiderpuppe) =====
   Alles wird als SVG aus Typ, Farbe und Muster erzeugt. Eigene Fotos haben in der Teile-Ansicht Vorrang.
   Die Figur steht in einem 200 × 380 großen Koordinatensystem, Mitte x = 100. */
var ART = (function () {
  var N = 0;
  function nid() { return 'ak' + (++N); }

  /* ---------- Farben ---------- */
  function rgb(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  function toHex(c) { return '#' + c.map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
  function mix(a, b, t) { var x = rgb(a), y = rgb(b); return toHex([0, 1, 2].map(function (i) { return x[i] + (y[i] - x[i]) * t; })); }
  function lum(h) { var c = rgb(h); return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255; }
  function edge(col) { return lum(col) < 0.2 ? mix(col, '#ffffff', 0.32) : mix(col, '#000000', 0.42); }
  function shade(col, t) { return lum(col) < 0.2 ? mix(col, '#ffffff', t * 0.8) : mix(col, '#000000', t); }
  function colOf(it) { return (typeof hex === 'function') ? hex(it.color) : '#888888'; }

  /* ---------- Pfade spiegeln (nur absolute M, L, Q, C, Z) ---------- */
  function mir(d) {
    return d.replace(/([MLQC])([^MLQCZ]*)/g, function (m, cmd, nums) {
      var n = nums.trim().split(/[\s,]+/).filter(Boolean).map(Number), out = [];
      for (var i = 0; i < n.length; i += 2) out.push((200 - n[i]) + ' ' + n[i + 1]);
      return cmd + out.join(' ') + ' ';
    });
  }
  function both(d) { return d + ' ' + mir(d); }

  /* ---------- Muster ---------- */
  function patternFill(S, col, pattern) {
    if (!pattern || pattern === 'uni') return null;
    var id = nid(), light = lum(col) > 0.62, ink = light ? 'rgba(25,40,80,.34)' : 'rgba(255,255,255,.36)';
    if (pattern === 'streifen') S.defs.push('<pattern id="' + id + '" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="1.6" height="5" fill="' + ink + '"/></pattern>');
    else if (pattern === 'karo') S.defs.push('<pattern id="' + id + '" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="1.6" fill="' + ink + '"/><rect width="1.6" height="8" fill="' + ink + '"/></pattern>');
    else S.defs.push('<pattern id="' + id + '" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.4" fill="' + ink + '"/><circle cx="8" cy="8" r="1.4" fill="' + ink + '"/></pattern>');
    return 'url(#' + id + ')';
  }
  /* Ein Kleidungsstück: Fläche, Muster, Kontur, Details */
  function piece(S, d, col, pattern, details, o) {
    o = o || {};
    var e = edge(col), s = '<path d="' + d + '" fill="' + col + '" stroke="' + e + '" stroke-width="' + (o.sw || 1.1) + '" stroke-linejoin="round"/>';
    var pf = o.noPattern ? null : patternFill(S, col, pattern);
    if (pf) s += '<path d="' + d + '" fill="' + pf + '"/>';
    if (details) s += '<g fill="none" stroke="' + e + '" stroke-width="' + (o.dw || 0.9) + '" stroke-linecap="round" stroke-linejoin="round" opacity=".85">' + details + '</g>';
    return s;
  }
  function solid(d, fill, stroke, sw) { return '<path d="' + d + '" fill="' + fill + '"' + (stroke ? ' stroke="' + stroke + '" stroke-width="' + (sw || 1) + '" stroke-linejoin="round"' : '') + '/>'; }
  function dots(pts, r, fill) { return pts.map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + r + '" fill="' + fill + '"/>'; }).join(''); }

  /* ---------- Schneiderpuppe ---------- */
  var MQ = 'fill:var(--mq,#d5dbe2);stroke:var(--mq-line,#aab3bd);stroke-width:1';
  function mq(d) { return '<path d="' + d + '" style="' + MQ + '"/>'; }
  var BODY = {
    torso: 'M70 62 Q100 56 130 62 L134 70 L131 104 L127 146 L131 178 L69 178 L73 146 L69 104 L66 70 Z',
    arm: 'M67 66 Q60 67 58 74 L52 128 L47 184 L56 186 L62 132 L70 92 Z',
    leg: 'M70 176 L99 176 L99 192 L96 350 L80 350 L72 256 Z'
  };
  function mannequin() {
    return mq(BODY.leg) + mq(mir(BODY.leg)) + mq(BODY.arm) + mq(mir(BODY.arm)) + mq(BODY.torso) +
      '<ellipse cx="51" cy="194" rx="6" ry="9" style="' + MQ + '"/><ellipse cx="149" cy="194" rx="6" ry="9" style="' + MQ + '"/>' +
      mq('M94 46 L94 62 L106 62 L106 46 Z') + '<ellipse cx="100" cy="32" rx="14" ry="17" style="' + MQ + '"/>';
  }

  /* ---------- Oberteile ---------- */
  var TOP = {
    body: 'M86 57 Q100 69 114 57 L134 64 L130 94 L127 146 L129 168 L71 168 L73 146 L70 94 L66 64 Z',
    tucked: 'M86 57 Q100 69 114 57 L134 64 L130 94 L127 146 L128 154 L72 154 L73 146 L70 94 L66 64 Z',
    sShort: 'M66 64 Q58 66 55 76 L51 104 L66 108 L70 94 Z',
    sLong: 'M66 64 Q58 66 56 76 L50 130 L45 184 L57 186 L63 134 L70 96 Z'
  };
  function shirtCollar(col) {
    var c = 'M87 55 L99 69 L92 76 L83 61 Z';
    return piece({ defs: [] }, both(c), col, 'uni', null, { noPattern: true });
  }
  function drawTop(S, it) {
    var col = colOf(it), t = it.type, nm = (it.name || '').toLowerCase();
    var tucked = t === 'hemd';
    var short = t === 'tshirt' || t === 'polo' || t === 'sporttop' || /kurzarm/.test(nm);
    var d = (tucked ? TOP.tucked : TOP.body) + ' ' + both(short ? TOP.sShort : TOP.sLong);
    var det = '';
    if (t === 'hemd') {
      det += 'M100 70 L100 152';
      if (!short) det += ' M47 176 L56 177 ' + mir('M47 176 L56 177');
    } else if (t === 'polo') det += 'M100 68 L100 92';
    else det += 'M88 58 Q100 73 112 58';
    if (t === 'sporttop') det += ' M86 58 L72 92 ' + mir('M86 58 L72 92');
    var s = piece(S, d, col, it.pattern, det);
    if (t === 'hemd') s += dots([[100, 84], [100, 98], [100, 112], [100, 126], [100, 140]], 1.1, edge(col)) + shirtCollar(col);
    if (t === 'polo') s += dots([[100, 76], [100, 85]], 1.1, edge(col)) + piece(S, both('M88 56 L99 67 L93 72 L84 61 Z'), col, 'uni', null, { noPattern: true });
    if (it.pattern === 'print' && t !== 'hemd') s += '<circle cx="100" cy="108" r="9" fill="' + shade(col, 0.35) + '" opacity=".7"/><rect x="92" y="121" width="16" height="3" rx="1.5" fill="' + shade(col, 0.35) + '" opacity=".7"/>';
    return { svg: s, tucked: tucked, collar: t === 'hemd' || t === 'polo' };
  }

  /* ---------- Mittelschicht ---------- */
  var KNIT = {
    body: 'M85 56 Q100 70 115 56 L135 64 L131 96 L128 146 L131 172 L69 172 L72 146 L69 96 L65 64 Z',
    vbody: 'M86 56 L100 86 L114 56 L135 64 L131 96 L128 146 L131 172 L69 172 L72 146 L69 96 L65 64 Z',
    sleeve: 'M65 64 Q57 66 55 76 L49 130 L44 186 L58 188 L64 136 L69 98 Z',
    cardL: 'M86 56 L98 104 L98 172 L69 172 L72 146 L69 96 L65 64 Z'
  };
  var JACKET = {
    panel: 'M86 56 L99 128 L100 134 Q99 166 93 184 L68 184 L70 146 L68 96 L64 62 Z',
    closed: 'M86 56 L99 128 L100 134 L100 184 L68 184 L70 146 L68 96 L64 62 Z',
    sleeve: 'M64 62 Q56 64 54 74 L48 130 L43 187 L58 189 L63 136 L69 98 Z',
    lapel: 'M86 56 L79 66 L85 72 L82 77 L99 126 L91 84 L90 62 Z'
  };
  function drawMid(S, it, top, solo) {
    var col = colOf(it), t = it.type, nm = (it.name || '').toLowerCase(), s = '', det;
    if (t === 'sakko' || t === 'smoking') {
      var panel = solo ? JACKET.closed : JACKET.panel;
      s += piece(S, both(panel) + ' ' + both(JACKET.sleeve), col, it.pattern,
        'M74 98 L86 97 M70 152 L88 152 ' + mir('M70 152 L88 152') + ' M47 178 L58 180 ' + mir('M47 178 L58 180'));
      if (solo) s += solid('M86 56 L100 128 L114 56 Q100 62 86 56 Z', shade(col, 0.28));
      s += piece(S, both(JACKET.lapel), t === 'smoking' ? shade(col, 0.25) : col, it.pattern, null, { noPattern: t === 'smoking' });
      s += dots([[100, 136]], 1.8, edge(col));
      return s;
    }
    if (t === 'weste') {
      var vd = 'M86 56 L100 106 L114 56 L131 66 L128 146 L131 166 L106 174 L100 168 L94 174 L69 166 L72 146 L69 66 Z';
      s += piece(S, vd, col, it.pattern, 'M78 120 L88 120 ' + mir('M78 120 L88 120'));
      s += dots([[100, 116], [100, 128], [100, 140], [100, 152]], 1.3, edge(col));
      return s;
    }
    if (t === 'strickjacke') {
      var cd = solo ? 'M86 56 L100 100 L114 56 L135 64 L131 96 L128 146 L131 172 L69 172 L72 146 L69 96 L65 64 Z' : both(KNIT.cardL);
      s += piece(S, cd + ' ' + both(KNIT.sleeve), col, it.pattern, 'M69 165 L131 165 M44 180 L58 182 ' + mir('M44 180 L58 182'));
      s += dots([[solo ? 100 : 96, 112], [solo ? 100 : 96, 126], [solo ? 100 : 96, 140], [solo ? 100 : 96, 154]], 1.4, edge(col));
      return s;
    }
    var v = t === 'feinstrick' && !/roll/.test(nm);
    if (t === 'hoodie') s += piece(S, 'M78 64 Q80 44 100 44 Q120 44 122 64 Q112 56 100 56 Q88 56 78 64 Z', col, 'uni', null, { noPattern: true });
    det = 'M69 164 L131 164 M44 180 L58 182 ' + mir('M44 180 L58 182');
    if (!v) det += ' M86 57 Q100 72 114 57';
    if (t === 'hoodie') det += ' M80 138 L120 138 L124 164 M80 138 L76 164 M96 64 L95 90 M104 64 L105 90';
    if (t === 'fleece') det += ' M100 52 L100 104';
    if (t === 'pullover' && /zopf/.test(nm)) det += ' M86 80 Q90 100 86 120 Q82 140 86 160 ' + mir('M86 80 Q90 100 86 120 Q82 140 86 160');
    s += piece(S, (v ? KNIT.vbody : KNIT.body) + ' ' + both(KNIT.sleeve), col, it.pattern, det);
    if (t === 'feinstrick' && !v) s += piece(S, 'M88 44 L112 44 L114 60 Q100 64 86 60 Z', col, 'uni', 'M88 50 L112 50', { noPattern: true });
    if (t === 'fleece') s += piece(S, 'M88 46 L112 46 L114 60 L100 62 L86 60 Z', col, 'uni', 'M100 47 L100 62', { noPattern: true });
    if (top && top.collar && !v && t !== 'fleece' && !(t === 'feinstrick')) s += shirtCollar(top.col);
    if (it.pattern === 'print') s += '<circle cx="100" cy="110" r="9" fill="' + shade(col, 0.35) + '" opacity=".7"/>';
    return s;
  }

  /* ---------- Jacken und Mäntel ---------- */
  var OUTER_LEN = { jeansjacke: 178, lederjacke: 180, bomber: 176, uebergang: 194, regenjacke: 192, softshell: 186, trench: 270, wintermantel: 276, parka: 214, daune: 196, trainingsjacke: 176 };
  function drawOuter(S, it, solo) {
    var col = colOf(it), t = it.type, H = OUTER_LEN[t] || 190, gx = solo ? 100 : 94, s = '';
    var panel = 'M86 54 Q74 56 62 61 L66 96 L68 146 L65 ' + H + ' L' + gx + ' ' + H + ' L' + gx + ' 70 Q92 60 86 54 Z';
    var sleeve = 'M62 61 Q53 63 51 74 L46 130 L41 188 L58 190 L63 138 L68 98 Z';
    var hooded = t === 'parka' || t === 'regenjacke';
    if (hooded) s += piece(S, 'M76 64 Q78 40 100 40 Q122 40 124 64 Q112 54 100 54 Q88 54 76 64 Z', shade(col, 0.08), 'uni', 'M84 58 Q100 48 116 58', { noPattern: true });
    var det = 'M41 182 L58 184 ' + mir('M41 182 L58 184');
    if (solo) det += ' M100 64 L100 ' + H;
    else det += ' M' + (gx - 2) + ' 72 L' + (gx - 2) + ' ' + H + ' ' + mir('M' + (gx - 2) + ' 72 L' + (gx - 2) + ' ' + H);
    if (t === 'jeansjacke') det += ' M70 84 L86 84 L86 92 L78 96 L70 92 Z ' + mir('M70 84 L86 84 L86 92 L78 96 L70 92 Z') + ' M78 96 L78 ' + (H - 6) + ' ' + mir('M78 96 L78 ' + (H - 6)) + ' M66 ' + (H - 7) + ' L' + gx + ' ' + (H - 7) + ' ' + mir('M66 ' + (H - 7) + ' L' + gx + ' ' + (H - 7));
    if (t === 'bomber') det += ' M66 ' + (H - 8) + ' L' + gx + ' ' + (H - 8) + ' ' + mir('M66 ' + (H - 8) + ' L' + gx + ' ' + (H - 8)) + ' M42 176 L58 178 ' + mir('M42 176 L58 178') + ' M74 120 L80 104';
    if (t === 'uebergang' || t === 'softshell') det += ' M70 150 L76 136 ' + mir('M70 150 L76 136');
    if (t === 'parka') det += ' M70 170 L88 170 L88 186 L70 186 Z ' + mir('M70 170 L88 170 L88 186 L70 186 Z') + ' M66 146 L' + gx + ' 146 ' + mir('M66 146 L' + gx + ' 146');
    if (t === 'regenjacke') det += ' M66 ' + (H - 6) + ' L' + gx + ' ' + (H - 6) + ' ' + mir('M66 ' + (H - 6) + ' L' + gx + ' ' + (H - 6));
    if (t === 'daune') for (var y = 84; y < H - 4; y += 14) det += ' M64 ' + y + ' L' + gx + ' ' + y + ' ' + mir('M64 ' + y + ' L' + gx + ' ' + y) + ' M' + (55 - (y - 84) * 0.1) + ' ' + y + ' L' + (67 - (y - 84) * 0.05) + ' ' + (y + 2) + ' ' + mir('M' + (55 - (y - 84) * 0.1) + ' ' + y + ' L' + (67 - (y - 84) * 0.05) + ' ' + (y + 2));
    s += piece(S, both(panel) + ' ' + both(sleeve), col, it.pattern, det);
    if (t === 'trainingsjacke') s += '<path d="' + both('M56 66 L49 130 L44 184 M60 68 L53 130 L48 184') + '" fill="none" stroke="#f3f3f0" stroke-width="1.6"/>';
    if (t === 'trench' || t === 'wintermantel' || t === 'lederjacke') {
      var lap = 'M86 54 L76 62 L83 70 L78 76 L' + gx + ' 120 L' + gx + ' 68 Z';
      s += piece(S, solo ? lap : both(lap), shade(col, 0.06), it.pattern, null, { noPattern: true });
      if (solo) s += piece(S, mir(lap), shade(col, 0.06), it.pattern, null, { noPattern: true });
    } else if (t === 'jeansjacke') {
      s += piece(S, both('M86 54 L94 70 L84 72 L77 60 Z'), col, 'uni', null, { noPattern: true });
    } else if (!hooded) {
      s += piece(S, 'M86 47 L100 51 L114 47 L115 58 L100 62 L85 58 Z', t === 'bomber' ? shade(col, 0.18) : col, 'uni', null, { noPattern: true });
    }
    if (t === 'trench') s += solid('M64 144 L' + gx + ' 144 L' + gx + ' 152 L64 152 Z ' + mir('M64 144 L' + gx + ' 144 L' + gx + ' 152 L64 152 Z'), shade(col, 0.12), edge(col), 0.8) + dots([[84, 100], [84, 118], [116, 100], [116, 118]], 1.6, edge(col));
    if (t === 'wintermantel') s += dots([[solo ? 100 : 90, 132], [solo ? 100 : 90, 156], [solo ? 100 : 90, 180]], 1.8, edge(col));
    return s;
  }

  /* ---------- Hosen ---------- */
  function drawBottom(S, it) {
    var col = colOf(it), t = it.type, d, det = 'M70 154 L130 154';
    if (t === 'shorts') d = 'M70 146 L130 146 L134 182 L132 236 L103 236 L100 198 L97 236 L68 236 L66 182 Z';
    else if (t === 'jogger' || t === 'sporthose') d = 'M70 146 L130 146 L133 180 L125 344 L104 346 L100 194 L96 346 L75 344 L67 180 Z';
    else d = 'M70 146 L130 146 L133 180 L128 348 L103 348 L100 194 L97 348 L72 348 L67 180 Z';
    if (t === 'jeans') det += ' M100 154 Q106 172 101 186 M72 156 Q80 160 82 170 ' + mir('M72 156 Q80 160 82 170') + ' M84 182 L85 348 ' + mir('M84 182 L85 348');
    else if (t === 'chino' || t === 'cargo' || t === 'shorts') det += ' M100 154 L100 184 M72 156 L80 172 ' + mir('M72 156 L80 172');
    else if (t === 'stoff' || t === 'anzughose') det += ' M100 154 L100 184 M85 156 L85 348 ' + mir('M85 156 L85 348') + ' M72 158 L79 170 ' + mir('M72 158 L79 170');
    if (t === 'jogger') det += ' M96 150 L94 166 M104 150 L106 166 M75 336 L96 338 ' + mir('M75 336 L96 338');
    if (t === 'cargo') det += ' M67 212 L80 212 L80 236 L68 236 Z ' + mir('M67 212 L80 212 L80 236 L68 236 Z');
    if (t === 'shorts') det += ' M68 230 L97 230 ' + mir('M68 230 L97 230');
    var s = piece(S, d, col, it.pattern, det);
    if (t === 'jeans') s += '<path d="' + 'M86 184 L87 348 ' + mir('M86 184 L87 348') + '" fill="none" stroke="#d9a35b" stroke-width=".6" opacity=".6"/>';
    return s;
  }

  /* ---------- Schuhe (Seitenansicht, Spitze nach rechts, Boden y = 0) ---------- */
  function shoeParts(it) {
    var col = colOf(it), t = it.type, e = edge(col), p = [];
    var white = lum(col) > 0.8, soleLight = white ? '#cfcfc8' : '#f1f0ea', soleDark = '#2a2622';
    if (t === 'sneaker' || t === 'laufschuh') {
      p.push(solid('M0 0 L46 0 Q50 0 50 -4 L50 -7 L0 -7 Z', soleLight, '#a9a79f', 0.8));
      p.push(solid('M1 -7 L1 -17 Q6 -21 14 -19 L22 -16 Q36 -15 46 -11 Q50 -9 49 -7 Z', col, e, 1));
      p.push('<path d="M17 -16 L20 -14 M21 -17 L24 -15 M25 -16 L28 -14" stroke="' + e + '" stroke-width=".9" fill="none"/>');
      if (t === 'laufschuh') p.push('<path d="M12 -10 Q26 -7 41 -14" stroke="' + (white ? '#3b6fb6' : '#f3f3f0') + '" stroke-width="1.6" fill="none"/>');
    } else if (t === 'boots' || t === 'winterstiefel') {
      var top = t === 'winterstiefel' ? -38 : -32;
      p.push(solid('M0 0 L48 0 Q51 0 51 -3 L51 -6 L0 -6 Z', soleDark));
      p.push(solid('M1 -6 L1 ' + top + ' L17 ' + top + ' L18 -18 Q34 -15 46 -10 Q50 -8 49 -6 Z', col, e, 1));
      if (t === 'winterstiefel') p.push(solid('M-1 ' + (top - 3) + ' L19 ' + (top - 3) + ' L19 ' + (top + 6) + ' L-1 ' + (top + 6) + ' Z', '#efe9df', '#cfc7b8', 0.8));
      else p.push('<path d="M14 -28 L17 -26 M14 -23 L17 -21 M15 -18 L19 -17" stroke="' + e + '" stroke-width=".9" fill="none"/>');
    } else if (t === 'chelsea') {
      p.push(solid('M0 0 L47 0 Q49 0 49 -2 L49 -3 L0 -3 Z', soleDark));
      p.push(solid('M0 0 L10 0 L10 -5 L0 -5 Z', soleDark));
      p.push(solid('M1 -4 L1 -32 L15 -32 L16 -14 Q32 -11 46 -6 Q48 -4 47 -3 Z', col, e, 1));
      p.push(solid('M3 -30 L12 -30 L12 -14 L4 -14 Z', shade(col, 0.3)));
    } else if (t === 'sandalen') {
      p.push(solid('M0 0 L46 0 Q49 0 49 -3 L0 -3 Z', col, e, 0.8));
      p.push('<path d="M2 -3 L2 -12 Q10 -16 20 -12 L44 -6 Q47 -5 46 -3 Z" style="' + MQ + '"/>');
      p.push('<path d="M12 -3 Q14 -15 22 -12 M30 -3 Q32 -10 37 -8" stroke="' + col + '" stroke-width="3" fill="none" stroke-linecap="round"/>');
    } else {
      var low = t === 'loafer';
      p.push(solid('M0 0 L46 0 Q48 0 48 -2 L48 -3 L0 -3 Z', soleDark));
      p.push(solid('M0 0 L10 0 L10 -5 L0 -5 Z', soleDark));
      p.push(solid(low ? 'M1 -4 L1 -12 Q6 -14 14 -13 L28 -11 Q40 -9 46 -5 Q48 -4 47 -3 Z' : 'M1 -4 L1 -14 Q5 -16 12 -15 L24 -12 Q38 -10 46 -6 Q48 -4 47 -3 Z', col, e, 1));
      p.push(low ? '<path d="M24 -11 Q32 -12 38 -7 M20 -12 L26 -9" stroke="' + e + '" stroke-width=".9" fill="none"/>'
        : '<path d="M14 -14 L22 -12 M15 -12 L18 -14 M18 -11 L21 -13" stroke="' + e + '" stroke-width=".8" fill="none"/>');
    }
    return p.join('');
  }
  function drawShoes(it) {
    var p = shoeParts(it);
    return '<g transform="translate(104 360) scale(.9)">' + p + '</g><g transform="translate(96 360) scale(-.9 .9)">' + p + '</g>';
  }

  /* ---------- Accessoires ---------- */
  function drawAccOn(S, it, layer) {
    var col = colOf(it), e = edge(col), t = it.type;
    if (layer === 'waist' && t === 'guertel') return solid('M70 147 L130 147 L130 154 L70 154 Z', col, e, 0.8) + '<rect x="95" y="146" width="10" height="9" rx="1" fill="none" stroke="#b9b6aa" stroke-width="1.6"/>';
    if (layer === 'neck') {
      if (t === 'krawatte') return solid('M97 67 L103 67 L102 74 L98 74 Z M98 74 L102 74 L105 136 L100 142 L95 136 Z', col, e, 0.8) + (it.pattern !== 'uni' ? '<path d="M98 82 L103 78 M97 96 L104 90 M96 110 L104 104 M96 124 L105 118" stroke="' + edge(col) + '" stroke-width=".8" opacity=".6"/>' : '');
      if (t === 'fliege') return solid('M90 65 L98 69 L90 74 Z M110 65 L102 69 L110 74 Z', col, e, 0.8) + solid('M97 67 L103 67 L103 72 L97 72 Z', shade(col, 0.15));
      return '';
    }
    if (layer === 'chest' && t === 'einstecktuch') return solid('M77 97 L79 90 L82 94 L84 89 L87 97 Z', col, e, 0.7);
    if (layer === 'top') {
      if (t === 'schal') return solid('M84 50 Q100 60 116 50 L118 62 Q100 72 82 62 Z', col, e, 0.9) + solid('M86 60 L80 128 L92 129 L95 66 Z', col, e, 0.9) + '<path d="M80 129 L80 134 M84 129 L84 134 M88 129 L88 134 M92 129 L92 134" stroke="' + e + '" stroke-width=".9"/>' + (it.pattern === 'karo' ? '' : '');
      if (t === 'muetze') return solid('M85 30 Q85 10 100 10 Q115 10 115 30 Z', col, e, 0.9) + solid('M84 25 L116 25 L116 32 L84 32 Z', shade(col, 0.1), e, 0.9);
      if (t === 'cap') return solid('M86 28 Q86 13 100 13 Q114 13 114 28 Z', col, e, 0.9) + solid('M84 27 Q100 35 118 27 Q100 31 84 27 Z', shade(col, 0.15), e, 0.9);
      if (t === 'sonnenbrille') return '<ellipse cx="94" cy="33" rx="5.2" ry="3.6" fill="' + col + '"/><ellipse cx="106" cy="33" rx="5.2" ry="3.6" fill="' + col + '"/><path d="M99 32 L101 32" stroke="' + col + '" stroke-width="1.2"/>';
      if (t === 'handschuhe') return '<ellipse cx="51" cy="195" rx="7" ry="10" fill="' + col + '" stroke="' + e + '"/><ellipse cx="149" cy="195" rx="7" ry="10" fill="' + col + '" stroke="' + e + '"/>';
      if (t === 'uhr') return solid('M44 175 L57 177 L56 183 L43 181 Z', col, e, 0.7) + '<circle cx="50" cy="179" r="3.6" fill="#f4f3ee" stroke="#9c9a92" stroke-width="1"/>';
    }
    return '';
  }
  /* Accessoire als eigenes Bild, 100 × 100 */
  function accSolo(it) {
    var col = colOf(it), e = edge(col), t = it.type;
    switch (t) {
      case 'guertel': return solid('M6 44 L94 44 L94 56 L6 56 Z', col, e) + '<rect x="18" y="41" width="15" height="18" rx="2" fill="none" stroke="#b9b6aa" stroke-width="3"/>' + dots([[56, 50], [66, 50], [76, 50]], 1.6, e);
      case 'uhr': return solid('M42 6 L58 6 L58 94 L42 94 Z', col, e) + '<circle cx="50" cy="50" r="17" fill="#f4f3ee" stroke="#9c9a92" stroke-width="4"/><path d="M50 50 L50 39 M50 50 L58 54" stroke="#3b4047" stroke-width="2" stroke-linecap="round"/>';
      case 'schal': return solid('M30 8 L54 8 L60 84 L36 86 Z', col, e) + solid('M50 8 L72 10 L66 62 L54 58 Z', shade(col, 0.1), e) + '<path d="M36 86 L36 94 M42 86 L42 94 M48 85 L48 93 M54 85 L54 93" stroke="' + e + '" stroke-width="2"/>';
      case 'muetze': return solid('M22 70 Q22 18 50 18 Q78 18 78 70 Z', col, e) + solid('M20 62 L80 62 L80 78 L20 78 Z', shade(col, 0.1), e) + '<circle cx="50" cy="16" r="7" fill="' + col + '" stroke="' + e + '"/>';
      case 'cap': return solid('M24 62 Q24 26 50 26 Q76 26 76 62 Z', col, e) + solid('M70 56 Q90 58 96 66 L74 66 Z', shade(col, 0.15), e) + '<circle cx="50" cy="27" r="2.5" fill="' + e + '"/>';
      case 'sonnenbrille': return '<path d="M10 40 L90 40" stroke="' + col + '" stroke-width="3"/><path d="M14 40 L44 40 L42 56 Q30 64 18 56 Z M56 40 L86 40 L82 56 Q70 64 58 56 Z" fill="' + col + '" stroke="' + e + '" stroke-width="1.5"/>';
      case 'handschuhe': return solid('M20 90 L20 40 Q20 28 28 28 L30 20 Q32 14 36 20 L38 26 L42 18 Q46 14 48 22 L48 90 Z', col, e) + solid('M54 90 L54 36 Q54 26 62 26 L64 18 Q66 12 70 18 L72 24 L76 18 Q80 14 82 22 L82 90 Z', shade(col, 0.1), e);
      case 'krawatte': return solid('M43 8 L57 8 L55 22 L45 22 Z M45 22 L55 22 L62 84 L50 96 L38 84 Z', col, e) + (it.pattern !== 'uni' ? '<path d="M45 34 L56 28 M43 50 L58 42 M41 66 L60 58 M40 80 L61 72" stroke="' + e + '" stroke-width="2" opacity=".55"/>' : '');
      case 'fliege': return solid('M14 34 L46 46 L46 54 L14 66 Z M86 34 L54 46 L54 54 L86 66 Z', col, e) + solid('M44 42 L56 42 L56 58 L44 58 Z', shade(col, 0.15), e);
      case 'einstecktuch': return solid('M20 70 L32 30 L44 52 L56 26 L68 52 L80 32 L84 70 Z', col, e) + solid('M14 64 L86 64 L86 78 L14 78 Z', 'var(--mq,#d5dbe2)', 'var(--mq-line,#aab3bd)');
      default: return '<circle cx="50" cy="50" r="30" fill="' + col + '" stroke="' + e + '"/>';
    }
  }

  function wrap(S, vb, inner, cls, label) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '" class="' + cls + '" role="img" aria-label="' + (label || '').replace(/"/g, '') + '" preserveAspectRatio="xMidYMid meet">' +
      (S.defs.length ? '<defs>' + S.defs.join('') + '</defs>' : '') + inner + '</svg>';
  }

  /* Ein einzelnes Teil */
  function item(it) {
    var S = { defs: [] }, t = AK.TYPES[it.type] || {}, slot = it.slot || t.slot, label = it.name || '';
    if (slot === 'acc') return wrap(S, '0 0 100 100', accSolo(it), 'art art-item', label);
    if (slot === 'shoes') {
      var p = shoeParts(it), tall = it.type === 'boots' || it.type === 'winterstiefel' || it.type === 'chelsea';
      return wrap(S, tall ? '-8 -50 66 60' : '-8 -42 66 52', '<g transform="translate(8 -9) scale(.92)" opacity=".85">' + p + '</g><g>' + p + '</g>', 'art art-item', label);
    }
    if (slot === 'bottom') return wrap(S, it.type === 'shorts' ? '46 138 108 104' : '42 138 116 216', drawBottom(S, it), 'art art-item', label);
    if (slot === 'top') return wrap(S, '28 44 144 148', drawTop(S, it).svg, 'art art-item', label);
    if (slot === 'mid') return wrap(S, '28 36 144 158', drawMid(S, it, null, true), 'art art-item', label);
    var H = OUTER_LEN[it.type] || 190;
    return wrap(S, H > 220 ? '20 34 160 ' + (H - 26) : '24 34 152 162', drawOuter(S, it, true), 'art art-item', label);
  }

  /* Ein ganzes Outfit an der Schneiderpuppe. o = {top, mid, outer, bottom, shoes, acc[]} */
  function outfit(o, label) {
    var S = { defs: [] }, acc = o.acc || [], parts = [];
    parts.push('<ellipse cx="100" cy="362" rx="62" ry="7" style="fill:var(--mq-line,#aab3bd)" opacity=".35"/>');
    parts.push(mannequin());
    var top = o.top ? drawTop(S, o.top) : null;
    if (top) top.col = colOf(o.top);
    var bottomSvg = o.bottom ? drawBottom(S, o.bottom) : '';
    var waist = acc.map(function (a) { return drawAccOn(S, a, 'waist'); }).join('');
    if (top && top.tucked) parts.push(top.svg, bottomSvg, waist);
    else parts.push(bottomSvg, waist, top ? top.svg : '');
    if (o.shoes) parts.push(drawShoes(o.shoes));
    parts.push(acc.map(function (a) { return drawAccOn(S, a, 'neck'); }).join(''));
    if (o.mid) parts.push(drawMid(S, o.mid, top, false));
    if (o.mid && (o.mid.type === 'sakko' || o.mid.type === 'smoking')) parts.push(acc.map(function (a) { return drawAccOn(S, a, 'chest'); }).join(''));
    if (o.outer) parts.push(drawOuter(S, o.outer, false));
    parts.push(acc.map(function (a) { return drawAccOn(S, a, 'top'); }).join(''));
    return wrap(S, '20 4 160 368', parts.join(''), 'art art-outfit', label);
  }

  return { item: item, outfit: outfit, _mir: mir };
})();

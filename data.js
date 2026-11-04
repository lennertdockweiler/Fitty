/* ===== Ankleide: Daten (Typen, Farben, Dresscode, Beispiel-Schrank) ===== */
var AK = (typeof AK !== 'undefined') ? AK : {};

AK.LEVELS = [
  { id: 0, name: 'Sportlich', hint: 'Training, Laufen, Outdoor-Sport' },
  { id: 1, name: 'Entspannt', hint: 'Zuhause, Spaziergang, Couch-Tag' },
  { id: 2, name: 'Casual', hint: 'Alltag, Freunde, Uni, Café' },
  { id: 3, name: 'Smart Casual', hint: 'Date, Restaurant, Feier unter Freunden' },
  { id: 4, name: 'Business Casual', hint: 'Büro, Kundentermin, Vorstellungsgespräch' },
  { id: 5, name: 'Business / Cocktail', hint: 'Anzug, Hochzeit, Empfang' },
  { id: 6, name: 'Black Tie', hint: 'Gala, Oper, Abendveranstaltung' }
];

AK.SLOTS = [
  { id: 'top', name: 'Oberteil' },
  { id: 'mid', name: 'Layer' },
  { id: 'outer', name: 'Jacke / Mantel' },
  { id: 'bottom', name: 'Hose' },
  { id: 'shoes', name: 'Schuhe' },
  { id: 'acc', name: 'Accessoires' }
];

/* Typen: fmin/fmax = Dresscode-Spanne, w = Wärme, c = Komfort 1-3, water = wetterfest */
AK.TYPES = {
  tshirt:      { label: 'T-Shirt',        slot: 'top',    fmin: 1, fmax: 3, w: 1,   c: 3 },
  langarm:     { label: 'Langarmshirt',   slot: 'top',    fmin: 1, fmax: 3, w: 1.5, c: 3 },
  polo:        { label: 'Polo',           slot: 'top',    fmin: 2, fmax: 4, w: 1.2, c: 3 },
  hemd:        { label: 'Hemd',           slot: 'top',    fmin: 3, fmax: 6, w: 1.5, c: 2 },
  sporttop:    { label: 'Sport-Shirt',    slot: 'top',    fmin: 0, fmax: 1, w: 0.8, c: 3 },

  pullover:    { label: 'Pullover',       slot: 'mid',    fmin: 1, fmax: 4, w: 3,   c: 3 },
  feinstrick:  { label: 'Feinstrick',     slot: 'mid',    fmin: 2, fmax: 5, w: 2.5, c: 3 },
  strickjacke: { label: 'Strickjacke',    slot: 'mid',    fmin: 2, fmax: 4, w: 2.5, c: 3 },
  sweat:       { label: 'Sweatshirt',     slot: 'mid',    fmin: 1, fmax: 2, w: 3,   c: 3 },
  hoodie:      { label: 'Hoodie',         slot: 'mid',    fmin: 0, fmax: 2, w: 3,   c: 3 },
  fleece:      { label: 'Fleece',         slot: 'mid',    fmin: 0, fmax: 2, w: 3,   c: 3 },
  sakko:       { label: 'Sakko',          slot: 'mid',    fmin: 3, fmax: 5, w: 2,   c: 2 },
  smoking:     { label: 'Smoking',        slot: 'mid',    fmin: 6, fmax: 6, w: 2,   c: 2 },
  weste:       { label: 'Weste',          slot: 'mid',    fmin: 3, fmax: 5, w: 1,   c: 2 },

  jeansjacke:  { label: 'Jeansjacke',     slot: 'outer',  fmin: 1, fmax: 3, w: 2,   c: 3 },
  lederjacke:  { label: 'Lederjacke',     slot: 'outer',  fmin: 2, fmax: 4, w: 2.5, c: 2 },
  bomber:      { label: 'Bomber',         slot: 'outer',  fmin: 1, fmax: 3, w: 2.5, c: 3 },
  uebergang:   { label: 'Übergangsjacke', slot: 'outer',  fmin: 1, fmax: 4, w: 2,   c: 3 },
  regenjacke:  { label: 'Regenjacke',     slot: 'outer',  fmin: 0, fmax: 3, w: 2,   c: 3, water: true },
  softshell:   { label: 'Softshell',      slot: 'outer',  fmin: 0, fmax: 3, w: 3,   c: 3, water: true },
  trench:      { label: 'Trenchcoat',     slot: 'outer',  fmin: 3, fmax: 5, w: 3.5, c: 2, water: true, long: true },
  wintermantel:{ label: 'Wintermantel',   slot: 'outer',  fmin: 3, fmax: 6, w: 6,   c: 2, long: true },
  parka:       { label: 'Parka',          slot: 'outer',  fmin: 1, fmax: 3, w: 6,   c: 3, water: true },
  daune:       { label: 'Daunenjacke',    slot: 'outer',  fmin: 0, fmax: 3, w: 6,   c: 3, water: true },
  trainingsjacke:{ label: 'Trainingsjacke', slot: 'outer', fmin: 0, fmax: 2, w: 2,  c: 3 },

  jeans:       { label: 'Jeans',          slot: 'bottom', fmin: 1, fmax: 4, w: 2,   c: 2 },
  chino:       { label: 'Chino',          slot: 'bottom', fmin: 2, fmax: 4, w: 1.5, c: 2 },
  stoff:       { label: 'Stoffhose',      slot: 'bottom', fmin: 4, fmax: 5, w: 1.5, c: 2 },
  anzughose:   { label: 'Anzughose',      slot: 'bottom', fmin: 5, fmax: 6, w: 1.5, c: 2 },
  jogger:      { label: 'Jogger',         slot: 'bottom', fmin: 0, fmax: 2, w: 1.5, c: 3 },
  shorts:      { label: 'Shorts',         slot: 'bottom', fmin: 1, fmax: 2, w: 0.5, c: 3 },
  sporthose:   { label: 'Sporthose',      slot: 'bottom', fmin: 0, fmax: 1, w: 1,   c: 3 },
  cargo:       { label: 'Cargohose',      slot: 'bottom', fmin: 1, fmax: 3, w: 1.5, c: 3 },

  sneaker:     { label: 'Sneaker',        slot: 'shoes',  fmin: 1, fmax: 3, w: 0.5, c: 3 },
  laufschuh:   { label: 'Laufschuhe',     slot: 'shoes',  fmin: 0, fmax: 1, w: 0.5, c: 3 },
  boots:       { label: 'Boots',          slot: 'shoes',  fmin: 2, fmax: 4, w: 1.5, c: 2, water: true },
  chelsea:     { label: 'Chelsea Boots',  slot: 'shoes',  fmin: 3, fmax: 5, w: 1,   c: 2, leather: true },
  loafer:      { label: 'Loafer',         slot: 'shoes',  fmin: 3, fmax: 5, w: 0.5, c: 2, leather: true },
  derby:       { label: 'Derby',          slot: 'shoes',  fmin: 4, fmax: 5, w: 0.5, c: 2, leather: true },
  oxford:      { label: 'Oxford',         slot: 'shoes',  fmin: 5, fmax: 6, w: 0.5, c: 1, leather: true },
  sandalen:    { label: 'Sandalen',       slot: 'shoes',  fmin: 1, fmax: 2, w: 0,   c: 3 },
  winterstiefel:{ label: 'Winterstiefel', slot: 'shoes',  fmin: 0, fmax: 3, w: 2,   c: 2, water: true },

  guertel:     { label: 'Gürtel',         slot: 'acc',    fmin: 1, fmax: 6, w: 0,   c: 3, acc: 'belt' },
  uhr:         { label: 'Uhr',            slot: 'acc',    fmin: 0, fmax: 6, w: 0,   c: 3, acc: 'watch' },
  schal:       { label: 'Schal',          slot: 'acc',    fmin: 0, fmax: 6, w: 1,   c: 3, acc: 'cold' },
  muetze:      { label: 'Mütze',          slot: 'acc',    fmin: 0, fmax: 3, w: 1,   c: 3, acc: 'cold' },
  handschuhe:  { label: 'Handschuhe',     slot: 'acc',    fmin: 0, fmax: 5, w: 1,   c: 3, acc: 'cold' },
  krawatte:    { label: 'Krawatte',       slot: 'acc',    fmin: 4, fmax: 6, w: 0,   c: 2, acc: 'tie' },
  fliege:      { label: 'Fliege',         slot: 'acc',    fmin: 5, fmax: 6, w: 0,   c: 2, acc: 'tie' },
  einstecktuch:{ label: 'Einstecktuch',   slot: 'acc',    fmin: 4, fmax: 6, w: 0,   c: 3, acc: 'pocket' },
  cap:         { label: 'Cap',            slot: 'acc',    fmin: 0, fmax: 2, w: 0,   c: 3, acc: 'sun' },
  sonnenbrille:{ label: 'Sonnenbrille',   slot: 'acc',    fmin: 0, fmax: 4, w: 0,   c: 3, acc: 'sun' }
};

/* Zusatzeigenschaften je Typ: s = Saisons (leer = ganzjährig), a = Sport-Eignung 0-2, hike = wandertauglich */
AK.EXTRA = {
  tshirt: { a: 1 }, langarm: { a: 1 }, sporttop: { a: 2 },
  sweat: { a: 1 }, hoodie: { a: 1, s: ['fruehling', 'herbst', 'winter'] },
  fleece: { a: 1, hike: 1, s: ['fruehling', 'herbst', 'winter'] },
  trainingsjacke: { a: 2 }, regenjacke: { a: 1, hike: 1 },
  softshell: { a: 1, hike: 1, s: ['fruehling', 'herbst', 'winter'] },
  daune: { s: ['herbst', 'winter'] }, parka: { s: ['herbst', 'winter'] }, wintermantel: { s: ['herbst', 'winter'] },
  trench: { s: ['fruehling', 'herbst'] }, jeansjacke: { s: ['fruehling', 'sommer', 'herbst'] },
  bomber: { s: ['fruehling', 'herbst'] }, uebergang: { s: ['fruehling', 'herbst'] }, lederjacke: { s: ['fruehling', 'herbst'] },
  jogger: { a: 1 }, sporthose: { a: 2 }, shorts: { a: 1, s: ['fruehling', 'sommer'] }, cargo: { hike: 1 },
  sneaker: { a: 1 }, laufschuh: { a: 2, hike: 1 }, boots: { hike: 1, s: ['fruehling', 'herbst', 'winter'] },
  sandalen: { s: ['sommer'] }, winterstiefel: { hike: 1, s: ['winter'] },
  schal: { s: ['herbst', 'winter'] }, muetze: { s: ['herbst', 'winter'] }, handschuhe: { s: ['winter'] },
  cap: { s: ['fruehling', 'sommer', 'herbst'] }
};
Object.keys(AK.EXTRA).forEach(function (k) {
  for (var p in AK.EXTRA[k]) AK.TYPES[k][p] = AK.EXTRA[k][p];
});

AK.SEASONS = [
  { id: 'fruehling', name: 'Frühling' }, { id: 'sommer', name: 'Sommer' },
  { id: 'herbst', name: 'Herbst' }, { id: 'winter', name: 'Winter' }
];
AK.seasonFor = function (temp, month) {
  if (temp <= 3) return 'winter';
  if (temp >= 21) return 'sommer';
  if (month === 12 || month <= 2) return 'winter';
  if (month <= 5) return 'fruehling';
  if (month <= 8) return 'sommer';
  return 'herbst';
};

/* Aktivitäten: f = Zusatzfaktoren, sport = Sportkleidung nötig, hike = festes Schuhwerk, level = passender Dresscode */
AK.ACTIVITIES = [
  { id: 'alltag', name: 'Alltag' },
  { id: 'buero', name: 'Büro / Sitzen', f: ['sit'] },
  { id: 'stadt', name: 'Stadtbummel', f: ['walk'] },
  { id: 'reise', name: 'Reisetag', f: ['sit', 'walk'] },
  { id: 'tanzen', name: 'Party / Tanzen', f: ['indoor'] },
  { id: 'tennis', name: 'Tennis', sport: 1, level: 0 },
  { id: 'joggen', name: 'Joggen', sport: 1, level: 0 },
  { id: 'gym', name: 'Gym', sport: 1, level: 0 },
  { id: 'wandern', name: 'Wandern', hike: 1, level: 0, f: ['walk'] }
];
AK.ACT = {};
AK.ACTIVITIES.forEach(function (a) { AK.ACT[a.id] = a; });

/* fehlende Felder eines gespeicherten Teils ergänzen */
AK.normalize = function (x) {
  var t = AK.TYPES[x.type];
  if (!t) return x;
  if (x.slot == null) x.slot = t.slot;
  if (x.fmin == null) x.fmin = t.fmin;
  if (x.fmax == null) x.fmax = t.fmax;
  if (x.w == null) x.w = t.w;
  if (x.c == null) x.c = t.c;
  if (x.a == null) x.a = t.a || 0;
  if (!x.s) x.s = (t.s || []).slice();
  if (x.water == null) x.water = !!t.water;
  if (!x.pattern) x.pattern = 'uni';
  if (x.avail == null) x.avail = true;
  if (x.wears == null) x.wears = 0;
  return x;
};

/* Farben: fam = neutral | earth | cool | bright */
AK.COLORS = [
  { id: 'schwarz',  name: 'Schwarz',   hex: '#1c1c1f', fam: 'neutral' },
  { id: 'anthrazit',name: 'Anthrazit', hex: '#3b4047', fam: 'neutral' },
  { id: 'grau',     name: 'Grau',      hex: '#8b9097', fam: 'neutral' },
  { id: 'weiss',    name: 'Weiß',      hex: '#f3f3f0', fam: 'neutral' },
  { id: 'navy',     name: 'Navy',      hex: '#1f2f55', fam: 'neutral' },
  { id: 'indigo',   name: 'Indigo',    hex: '#2c3e5e', fam: 'neutral' },
  { id: 'denim',    name: 'Denim hell',hex: '#7d9cc0', fam: 'neutral' },
  { id: 'beige',    name: 'Beige',     hex: '#d9c7a3', fam: 'earth' },
  { id: 'sand',     name: 'Sand',      hex: '#c3b08a', fam: 'earth' },
  { id: 'camel',    name: 'Camel',     hex: '#b58850', fam: 'earth' },
  { id: 'braun',    name: 'Braun',     hex: '#6b4a2f', fam: 'earth' },
  { id: 'oliv',     name: 'Oliv',      hex: '#5f6b3a', fam: 'earth' },
  { id: 'bordeaux', name: 'Bordeaux',  hex: '#6d1f2f', fam: 'earth' },
  { id: 'blau',     name: 'Blau',      hex: '#3b6fb6', fam: 'cool' },
  { id: 'hellblau', name: 'Hellblau',  hex: '#a7c5e6', fam: 'cool' },
  { id: 'gruen',    name: 'Grün',      hex: '#2f7a4d', fam: 'cool' },
  { id: 'lila',     name: 'Lila',      hex: '#6c4a8f', fam: 'cool' },
  { id: 'rot',      name: 'Rot',       hex: '#b3262e', fam: 'bright' },
  { id: 'orange',   name: 'Orange',    hex: '#d9772b', fam: 'bright' },
  { id: 'gelb',     name: 'Gelb',      hex: '#e2b93b', fam: 'bright' },
  { id: 'rosa',     name: 'Rosa',      hex: '#e3a1b4', fam: 'bright' }
];

AK.PATTERNS = [
  { id: 'uni', name: 'Uni' },
  { id: 'streifen', name: 'Streifen' },
  { id: 'karo', name: 'Karo' },
  { id: 'print', name: 'Print / Logo' }
];

AK.TRANSPORT = [
  { id: 'auto', name: 'Auto' },
  { id: 'oepnv', name: 'Bus & Bahn' },
  { id: 'rad', name: 'Fahrrad' },
  { id: 'fuss', name: 'Zu Fuß' }
];

AK.FACTORS = [
  { id: 'walk', name: 'Viel Laufen' },
  { id: 'sit', name: 'Lange sitzen' },
  { id: 'cool_evening', name: 'Abends kühler' },
  { id: 'indoor', name: 'Meist drinnen' },
  { id: 'impress', name: 'Eindruck wichtig' }
];

AK.WEATHER_PRESETS = [
  { name: 'Frost', temp: -2, rain: false, snow: false, wind: false, sun: false },
  { name: 'Kühl', temp: 8, rain: false, snow: false, wind: false, sun: false },
  { name: 'Nass', temp: 10, rain: true, snow: false, wind: true, sun: false },
  { name: 'Mild', temp: 16, rain: false, snow: false, wind: false, sun: false },
  { name: 'Warm', temp: 23, rain: false, snow: false, wind: false, sun: true },
  { name: 'Heiß', temp: 31, rain: false, snow: false, wind: false, sun: true }
];

/* Beispiel-Schrank (ohne Fotos), wird nur angezeigt, solange der eigene Schrank leer ist */
(function () {
  var n = 0;
  function g(type, name, color, o) {
    o = o || {};
    var t = AK.TYPES[type];
    n++;
    return {
      id: 'demo' + n, demo: true, name: name, type: type, slot: t.slot, color: color,
      pattern: o.pattern || 'uni', fmin: o.fmin != null ? o.fmin : t.fmin, fmax: o.fmax != null ? o.fmax : t.fmax,
      w: o.w != null ? o.w : t.w, c: o.c != null ? o.c : t.c, water: o.water != null ? o.water : !!t.water,
      fav: !!o.fav, never: !!o.never, basic: !!o.basic, avail: true, photo: null, wears: o.wears || 0, last: null,
      a: t.a || 0, s: (t.s || []).slice()
    };
  }
  AK.DEMO = [
    g('tshirt', 'Weißes T-Shirt', 'weiss', { basic: true }),
    g('tshirt', 'Graues T-Shirt', 'grau', { basic: true }),
    g('langarm', 'Navy Langarmshirt', 'navy', { basic: true }),
    g('polo', 'Polo Piqué', 'navy', { fav: true }),
    g('hemd', 'Weißes Hemd', 'weiss', { basic: true, fmax: 6 }),
    g('hemd', 'Hellblaues Hemd', 'hellblau', { basic: true }),
    g('hemd', 'Oxford-Hemd', 'blau', { pattern: 'streifen', fmin: 2, fmax: 4 }),
    g('sporttop', 'Laufshirt', 'schwarz'),
    g('pullover', 'Grauer Wollpullover', 'grau', { fav: true, basic: true }),
    g('pullover', 'Oliver Strickpullover', 'oliv'),
    g('feinstrick', 'Feinstrick-Rollkragen', 'anthrazit', { fmax: 5 }),
    g('hoodie', 'Hoodie Anthrazit', 'anthrazit'),
    g('sakko', 'Navy Sakko', 'navy', { fav: true, basic: true }),
    g('sakko', 'Graues Sakko', 'grau', { pattern: 'karo' }),
    g('smoking', 'Smoking', 'schwarz'),
    g('shorts', 'Shorts Beige', 'beige'),
    g('uebergang', 'Beige Übergangsjacke', 'beige'),
    g('lederjacke', 'Lederjacke', 'schwarz', { fav: true }),
    g('regenjacke', 'Regenjacke', 'schwarz'),
    g('wintermantel', 'Wintermantel', 'anthrazit', { fmin: 3, fmax: 6 }),
    g('parka', 'Parka', 'oliv'),
    g('jeans', 'Dunkle Jeans', 'indigo', { fav: true, basic: true, fmax: 4 }),
    g('jeans', 'Helle Jeans', 'denim', { fmax: 2 }),
    g('chino', 'Chino Beige', 'beige', { basic: true }),
    g('chino', 'Chino Navy', 'navy'),
    g('stoff', 'Stoffhose Grau', 'grau'),
    g('anzughose', 'Anzughose Schwarz', 'schwarz'),
    g('jogger', 'Jogger Schwarz', 'schwarz'),
    g('sporthose', 'Laufhose', 'schwarz'),
    g('sneaker', 'Weiße Sneaker', 'weiss', { fav: true, basic: true, fmax: 3 }),
    g('sneaker', 'Schwarze Sneaker', 'schwarz'),
    g('laufschuh', 'Laufschuhe', 'grau'),
    g('boots', 'Braune Boots', 'braun', { water: true }),
    g('chelsea', 'Chelsea Boots', 'braun'),
    g('derby', 'Derby Schwarz', 'schwarz'),
    g('oxford', 'Oxford Schwarz', 'schwarz'),
    g('guertel', 'Gürtel Braun', 'braun', { basic: true }),
    g('guertel', 'Gürtel Schwarz', 'schwarz', { basic: true }),
    g('uhr', 'Uhr', 'grau', { basic: true }),
    g('schal', 'Wollschal', 'grau'),
    g('muetze', 'Mütze', 'schwarz'),
    g('krawatte', 'Krawatte Navy', 'navy'),
    g('fliege', 'Fliege Schwarz', 'schwarz'),
    g('sonnenbrille', 'Sonnenbrille', 'schwarz')
  ];
})();

if (typeof module !== 'undefined') module.exports = AK;

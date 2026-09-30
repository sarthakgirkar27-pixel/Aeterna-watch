/* AETERNA — the catalogue. One source of truth for every page, the search, the
   cart and the filters. Plain global, no modules, so a page can use it with a
   single <script src>.

   Every reference carries the same movement: Calibre 312. The case is the choice.
   Editions: 9 titanium x 26 + 2 rose gold x 34 + 1 king gold x 10 = 312 pieces. */
(function () {
'use strict';

const MOVEMENT = {
  name: 'Calibre 312',
  type: 'Skeleton chronograph, hand wound',
  frequency: '4 Hz, 28,800 beats an hour',
  reserve: '72 hours',
  parts: '312 parts, 37 jewels',
  finish: 'Bridges chamfered and black-polished by hand',
};

const CASES = {
  titanium: {
    id: 'titanium',
    label: 'Titanium',
    price: 18500,
    material: 'Grade 5 titanium, forged carbon bezel',
    swatch: '#8e9196',
    blurb: 'Grade 5 titanium, brushed by hand, with a forged carbon bezel whose marbling is different on every watch.',
  },
  rose: {
    id: 'rose',
    label: 'Rose gold',
    price: 34000,
    material: '18k rose gold, forged carbon bezel',
    swatch: '#c08659',
    blurb: '18k rose gold, cast in our own foundry and hallmarked inside the caseback. No plating anywhere on the watch.',
  },
  king: {
    id: 'king',
    label: 'King gold',
    price: 41000,
    material: '18k king gold, forged carbon bezel',
    swatch: '#d9a441',
    blurb: '18k king gold, an alloy with five percent platinum that holds a deeper red and resists dulling. Cast for us alone.',
  },
};

/* tone: how the dial reads across a room. Bright, Deep, Precious. */
const WATCHES = [
  {
    slug: 'forest', name: 'Forest', ref: 'AE-R01', order: 3,
    case: 'rose', tone: 'deep', edition: 34, stock: 6,
    dial: 'Forest green', dialHex: '#2f4a33',
    strap: 'Green alligator over green rubber, rose gold folding clasp',
    tagline: 'Rose gold, forest green, and nothing else in the room.',
    story: 'The green is lacquered over a sunburst base and cut away in the same pattern as the bridges beneath it, so the dial and the movement read as one drawing. Against rose gold it goes almost black in shadow and opens to bottle green in daylight.',
  },
  {
    slug: 'scarlet', name: 'Scarlet', ref: 'AE-T01', order: 6,
    case: 'titanium', tone: 'bright', edition: 26, stock: 11,
    dial: 'Scarlet', dialHex: '#96231f',
    strap: 'Black alligator over scarlet rubber, titanium folding clasp',
    tagline: 'The loudest watch we make, and it still whispers.',
    story: 'Scarlet is the hardest colour to get right on a skeleton dial: too warm and it turns orange under tungsten, too cool and it goes pink. Ours is mixed with a trace of black and sprayed in eleven passes.',
  },
  {
    slug: 'glacier', name: 'Glacier', ref: 'AE-T02', order: 2,
    case: 'titanium', tone: 'bright', edition: 26, stock: 7,
    dial: 'Ice blue', dialHex: '#5f9ec2',
    strap: 'Navy alligator over blue rubber, titanium folding clasp',
    tagline: 'Cold light on a cold metal.',
    story: 'Ice blue over brushed titanium is the closest this collection comes to a tool watch. The chapter ring is printed rather than applied, which keeps the dial thin enough to show the whole going train.',
  },
  {
    slug: 'citrine', name: 'Citrine', ref: 'AE-T03', order: 9,
    case: 'titanium', tone: 'bright', edition: 26, stock: 14,
    dial: 'Citrine yellow', dialHex: '#d4a017',
    strap: 'Black alligator with yellow stitch over black rubber, titanium clasp',
    tagline: 'Yellow, used the way a watchmaker uses it: sparingly, and on purpose.',
    story: 'The yellow lives on the flange, the hands and the counters. Everything else stays graphite. Take the colour away and the watch still works as a drawing, which is how we know the colour is doing something.',
  },
  {
    slug: 'ember', name: 'Ember', ref: 'AE-T04', order: 8,
    case: 'titanium', tone: 'bright', edition: 26, stock: 9,
    dial: 'Ember orange', dialHex: '#c15a1e',
    strap: 'Black alligator over orange rubber, titanium folding clasp',
    tagline: 'Warm metal, warmer dial.',
    story: 'Ember runs a half tone darker than a safety orange so it sits down rather than jumping forward. The lining of the strap is the same orange, which you only see when the watch is off your wrist.',
  },
  {
    slug: 'lagoon', name: 'Lagoon', ref: 'AE-T05', order: 5,
    case: 'titanium', tone: 'bright', edition: 26, stock: 7,
    dial: 'Lagoon teal', dialHex: '#1f8a8c',
    strap: 'Navy alligator with teal stitch over navy rubber, titanium clasp',
    tagline: 'A green that argues it is a blue.',
    story: 'Teal shifts further under different light than any other colour in the collection: green indoors, blue outside, almost grey at dusk. We stopped trying to stabilise it and started selecting for it.',
  },
  {
    slug: 'umber', name: 'Umber', ref: 'AE-R02', order: 4,
    case: 'rose', tone: 'deep', edition: 34, stock: 9,
    dial: 'Burnt umber', dialHex: '#6b4a34',
    strap: 'Brown alligator over taupe rubber, rose gold folding clasp',
    tagline: 'The quietest way to wear gold.',
    story: 'Umber is the reference we build for people who do not want to be asked about their watch. Brown on rose gold reads as one warm material from any distance over a metre, and resolves into two only up close.',
  },
  {
    slug: 'nocturne', name: 'Nocturne', ref: 'AE-T06', order: 7,
    case: 'titanium', tone: 'deep', edition: 26, stock: 8,
    dial: 'Nocturne violet', dialHex: '#3b3a6b',
    strap: 'Navy alligator over navy rubber, titanium folding clasp',
    tagline: 'Blue until you look twice.',
    story: 'A violet this deep needs a warm hand set or it turns cold and synthetic, so the hands and indices are rose gold even on a titanium case. It is the only reference where the two metals meet.',
  },
  {
    slug: 'lime', name: 'Lime', ref: 'AE-T07', order: 11,
    case: 'titanium', tone: 'bright', edition: 26, stock: 12,
    dial: 'Lime', dialHex: '#7fa621',
    strap: 'Black alligator with lime stitch over black rubber, titanium clasp',
    tagline: 'Built to be legible at a glance and from an angle.',
    story: 'Lime against graphite is the highest contrast pairing in the collection, which makes this the easiest of the twelve to read at speed. That was the brief, and the colour followed from it.',
  },
  {
    slug: 'garnet', name: 'Garnet', ref: 'AE-T08', order: 10,
    case: 'titanium', tone: 'deep', edition: 26, stock: 0,
    dial: 'Garnet', dialHex: '#6d2b35',
    strap: 'Burgundy alligator over grey rubber, titanium folding clasp',
    tagline: 'Deep red with rose gold hands, and no other warmth.',
    story: 'Garnet took four years to release because the first three attempts read as brown at arm’s length. The version that shipped has a violet base under the red, which holds the colour as the light falls.',
  },
  {
    slug: 'sovereign', name: 'Sovereign', ref: 'AE-K01', order: 1,
    case: 'king', tone: 'precious', edition: 10, stock: 2,
    dial: 'Gold skeleton on blue', dialHex: '#1e3566',
    strap: 'Blue alligator over navy rubber, king gold folding clasp',
    tagline: 'Ten pieces. The only king gold we cast.',
    story: 'Sovereign is the reference the whole collection is measured against: king gold case, blue forged carbon bezel, and a movement gilded rather than rhodium plated, so the gold runs through the watch instead of around it.',
  },
  {
    slug: 'frost', name: 'Frost', ref: 'AE-T09', order: 12,
    case: 'titanium', tone: 'precious', edition: 26, stock: 10,
    dial: 'Frost silver', dialHex: '#c9ccce',
    strap: 'White alligator over white rubber, titanium folding clasp',
    tagline: 'Every part visible, nothing to hide behind.',
    story: 'A white dial on a skeleton chronograph leaves the movement nowhere to hide: every bridge edge, every screw slot and every jewel setting is on show. It is the reference our own watchmakers wear.',
  },
];

/* Derived fields, computed once so no page has to. */
const CURRENCY = { code: 'USD', symbol: '$' };
function money(n) { return CURRENCY.symbol + n.toLocaleString('en-US'); }

WATCHES.forEach(function (w) {
  const c = CASES[w.case];
  w.caseLabel = c.label;
  w.caseMaterial = c.material;
  w.caseSwatch = c.swatch;
  w.caseBlurb = c.blurb;
  w.price = c.price;
  w.priceText = money(c.price);
  w.title = 'Chronographe 312 — ' + w.name;
  w.url = 'product.html?ref=' + w.slug;
  w.images = [1, 2, 3, 4].map(function (i) { return 'assets/watches/' + w.slug + '-' + i + '.jpg'; });
  w.thumbs = [1, 2].map(function (i) { return 'assets/watches/' + w.slug + '-' + i + '-sm.jpg'; });
  w.zoom = 'assets/watches/' + w.slug + '-zoom.jpg';
  w.alts = [
    w.name + ' on its strap, three quarter view',
    w.name + ' dial in close up, showing the skeleton chronograph and the Aeterna signature',
    w.name + ' case profile, showing the crown and the two chronograph pushers',
    w.name + ' strap and clasp in close up',
  ];
  w.availability = w.stock === 0 ? 'waitlist' : (w.stock <= 4 ? 'low' : 'in');
  w.availabilityText = w.stock === 0
    ? 'Fully allocated — join the waitlist'
    : (w.stock <= 4 ? 'Final ' + w.stock + ' of ' + w.edition : 'Made to order — about 5 months');
  w.specShort = w.caseLabel + ' · ' + w.dial + ' · 44 mm';
  w.search = [w.name, w.ref, w.caseLabel, w.dial, w.tone, w.strap, w.tagline].join(' ').toLowerCase();
});

const SPEC_ROWS = function (w) {
  return [
    ['Reference', w.ref],
    ['Case', '44 mm, ' + w.caseMaterial + ', 12.9 mm thick'],
    ['Dial', w.dial + ', open worked, rhodium and gold applied indices'],
    ['Movement', MOVEMENT.name + ', ' + MOVEMENT.type.toLowerCase()],
    ['Frequency', MOVEMENT.frequency],
    ['Power reserve', MOVEMENT.reserve],
    ['Components', MOVEMENT.parts],
    ['Finishing', MOVEMENT.finish],
    ['Crystal', 'Sapphire, anti reflective on both sides, sapphire caseback'],
    ['Water resistance', '100 metres'],
    ['Strap', w.strap],
    ['Edition', w.edition + ' pieces, each numbered'],
    ['Warranty', 'Five years, transferable'],
  ];
};

const FILTERS = {
  case: [
    { id: 'titanium', label: 'Titanium', swatch: CASES.titanium.swatch },
    { id: 'rose', label: 'Rose gold', swatch: CASES.rose.swatch },
    { id: 'king', label: 'King gold', swatch: CASES.king.swatch },
  ],
  tone: [
    { id: 'bright', label: 'Bright' },
    { id: 'deep', label: 'Deep' },
    { id: 'precious', label: 'Precious' },
  ],
  availability: [
    { id: 'in', label: 'Available now' },
    { id: 'low', label: 'Final pieces' },
    { id: 'waitlist', label: 'Waitlist' },
  ],
};

const SORTS = [
  { id: 'featured', label: 'Featured', fn: function (a, b) { return a.order - b.order; } },
  { id: 'price-asc', label: 'Price, low to high', fn: function (a, b) { return a.price - b.price || a.order - b.order; } },
  { id: 'price-desc', label: 'Price, high to low', fn: function (a, b) { return b.price - a.price || a.order - b.order; } },
  { id: 'rarest', label: 'Rarest first', fn: function (a, b) { return a.edition - b.edition || a.order - b.order; } },
  { id: 'name', label: 'A to Z', fn: function (a, b) { return a.name.localeCompare(b.name); } },
];

window.AETERNA = {
  watches: WATCHES,
  cases: CASES,
  movement: MOVEMENT,
  filters: FILTERS,
  sorts: SORTS,
  currency: CURRENCY,
  money: money,
  specRows: SPEC_ROWS,
  bySlug: function (slug) { return WATCHES.find(function (w) { return w.slug === slug; }) || null; },
  featured: function (n) { return WATCHES.slice().sort(function (a, b) { return a.order - b.order; }).slice(0, n || 4); },
  related: function (slug, n) {
    const w = window.AETERNA.bySlug(slug);
    if (!w) return WATCHES.slice(0, n || 3);
    return WATCHES
      .filter(function (o) { return o.slug !== slug; })
      .sort(function (a, b) {
        const score = function (o) { return (o.case === w.case ? 0 : 2) + (o.tone === w.tone ? 0 : 1); };
        return score(a) - score(b) || a.order - b.order;
      })
      .slice(0, n || 3);
  },
};
})();

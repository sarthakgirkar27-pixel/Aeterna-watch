/* AETERNA — product detail page. One file, one page, twelve references, chosen
   by ?ref=<slug>. Everything reference-specific is written from catalogue.js so
   a price, an edition or a dial name can never go out of step with the register.

   The structure, the ownership copy and the twelve colourway links live in the
   HTML, which is why this file only fills slots. With scripting off the whole
   article is hidden and the <noscript> block takes over.

   The zoom honours what we actually hold: <slug>-zoom.jpg is 1144 x 1430 and it
   is the three quarter view, photograph one. There is no second high resolution
   file, so magnification is offered on photograph one and nowhere else, and the
   Zoom control takes you back there rather than pretending. */
(function () {
'use strict';

const A = window.AETERNA;
const UI = window.AeternaUI;
if (!A || !UI) { renderBroken(); return; }
const $ = UI.$, $$ = UI.$$;

/* catalogue.js or site.js did not arrive. The article is a set of empty slots
   without them, and <noscript> does not render while scripting is on, so say
   what happened and give the visitor somewhere to go. */
function renderBroken() {
  const shell = document.getElementById('pdp');
  if (shell) shell.remove();
  const main = document.getElementById('main');
  if (!main) return;
  const box = document.createElement('section');
  box.className = 'sec pdp-error';
  box.innerHTML = '<div class="wrap-wide"><div class="state">' +
      '<p class="eyebrow">Something did not load</p>' +
      '<h1 class="h2 pdp-error__h">This reference will not open.</h1>' +
      '<p class="lede">Part of this page failed to reach your browser, so we cannot show you the watch you asked for. Reloading usually fixes it. If it does not, the collection lists all twelve and we will answer any question by email.</p>' +
      '<p class="flow-row">' +
        '<a class="btn btn--primary" href="collection.html">Browse all twelve</a>' +
        '<a class="btn btn--secondary" href="contact.html#order">Ask the atelier</a>' +
      '</p></div></div>';
  main.appendChild(box);
  document.title = 'This reference will not open | Aeterna';
}

/* DEPLOY STEP: the same origin as the absolute URLs in the <head> of product.html */
const ORIGIN = 'https://example.com';

/* the zoom plate, as shipped */
const ZOOM_W = 1144, ZOOM_H = 1430;
/* the four gallery plates, as shipped */
const PLATE_W = 572, PLATE_H = 715;

const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.7 5.8 6.3.8-4.6 4.4 1.2 6.3L12 17.3 6.4 20.3l1.2-6.3L3 9.6l6.3-.8Z"/></svg>';

/* ----------------------------------------------------------------- owners --
   Written per reference, so no two pages carry the same words. Counts never
   exceed the number of pieces that have actually shipped (edition minus stock),
   and the average and the star bar are both computed from the distribution
   below rather than typed twice. dist is [5 star, 4, 3, 2, 1]. */
const OWNERS = {
  sovereign: { dist: [7, 0, 0, 0, 0], items: [
    { who: 'Rafael Sinclair-Okonjo', no: 3, stars: 5, text: 'Seven months, and two telephone calls from the bench in the middle of them. The movement is gilded rather than plated, so in low light the whole watch reads as one piece of gold.' },
    { who: 'Anneke Vos', no: 6, stars: 5, text: 'I own three gold watches and this is the only one that does not go yellow indoors. The five percent platinum is not a story, you can see it the moment you lay them side by side.' },
    { who: 'Hiroshi Tanabe', no: 10, stars: 5, text: 'The last of ten. They said so on the telephone before I paid and then printed it on the certificate. Gold scratches, and mine already has one at the lug. I knew that going in.' },
  ] },
  glacier: { dist: [13, 1, 0, 0, 0], items: [
    { who: 'Petra Halloran', no: 52, stars: 5, text: 'Ice blue reads grey at a desk and blue outdoors. At 44 mm it should be too much watch for a 16.5 cm wrist, and somehow it is not.' },
    { who: 'Nils Aaberg', no: 61, stars: 5, text: 'The chapter ring is printed instead of applied, so the going train stays visible right out to the edge. I can set it to the second without a loupe.' },
    { who: 'Camille Duverger', no: 77, stars: 4, text: 'Nothing wrong with the watch. The strap ran three weeks behind the case and nobody mentioned it until I asked, which is the one thing they got wrong with me.' },
  ] },
  forest: { dist: [19, 2, 0, 0, 0], items: [
    { who: 'Ezra Lindgren', no: 112, stars: 5, text: 'The cut away green follows the bridges underneath it, so the dial and the movement read as one drawing. You cannot see that in a photograph and it is the whole watch.' },
    { who: 'Sofia Marchetti', no: 128, stars: 5, text: 'Bottle green at a window, almost black in a restaurant. Two watches for one price, and both of them quiet.' },
    { who: 'Dominic Achebe', no: 141, stars: 4, text: 'Rose gold marks. Mine picked up a hairline on the caseback inside a month. The free refinish at every service is the only reason that does not bother me.' },
  ] },
  umber: { dist: [15, 3, 0, 0, 0], items: [
    { who: 'Margarethe Klein', no: 95, stars: 5, text: 'Not one person has asked me about it, which was the entire brief. From a metre it is one warm material. Up close it turns into two.' },
    { who: 'Yusuf Demirel', no: 103, stars: 5, text: 'It goes with a brown shoe and nothing argues. The taupe rubber under the alligator came through a week in Lagos without a mark.' },
    { who: 'Beatrix Nordahl', no: 118, stars: 4, text: 'Beautiful, and honest about itself. At this price I would have liked a second strap in the box, and they said no rather than pretend it was coming.' },
  ] },
  lagoon: { dist: [11, 2, 0, 0, 0], items: [
    { who: 'Aurelio Ferrante', no: 160, stars: 5, text: 'Green in the office, blue on the water, grey at dusk. They warned me the colour would not sit still before I bought it. They were right, and it is the best part of owning it.' },
    { who: 'Ingrid Solberg', no: 171, stars: 5, text: 'Teal stitching on navy alligator is a small decision that took me a week to notice and that I now cannot stop seeing.' },
    { who: 'Kwame Boateng', no: 182, stars: 4, text: 'Faultless watch, slow email. Four days for an answer in August. Everything else, the delivery date included, landed exactly where they said it would.' },
  ] },
  scarlet: { dist: [8, 3, 0, 0, 0], items: [
    { who: 'Lucia Ferreira dos Santos', no: 205, stars: 5, text: 'Eleven passes of paint and you can tell. Under tungsten it stays red instead of sliding into orange, which is the only reason I chose it over the Ember.' },
    { who: 'Erik Sandholm', no: 212, stars: 5, text: 'Loud on paper, restrained on the wrist. The black alligator does the work of calming it down and the scarlet lining does the rest.' },
    { who: 'Farrah Nazir', no: 223, stars: 4, text: 'The red is right. The scarlet rubber lining marked the cuff of a white shirt once in eighteen months, so I keep it off starched sleeves.' },
  ] },
  nocturne: { dist: [13, 1, 0, 0, 0], items: [
    { who: 'Sebastian Ruiz Otero', no: 231, stars: 5, text: 'Navy across a table, violet at arm’s length. Rose gold hands on a titanium case is the one place they let two metals meet, and it is the right place.' },
    { who: 'Johanna Bergqvist', no: 240, stars: 5, text: 'I bought it for the hands. Warm gold is what stops the violet turning cold and synthetic under office light.' },
    { who: 'Tomasz Wierzbicki', no: 248, stars: 4, text: 'Difficult to photograph, which I take as a compliment. Nothing I have sent to a friend looks like the watch actually looks.' },
  ] },
  ember: { dist: [10, 2, 0, 0, 0], items: [
    { who: 'Noor Al-Sabah', no: 256, stars: 5, text: 'Half a tone below a safety orange, so it sits back instead of shouting. I did not expect an orange dial to be the discreet choice in a collection of twelve.' },
    { who: 'Gerald Mwangi', no: 262, stars: 5, text: 'The strap lining is the same orange as the dial and you only see it when the watch is off. That is the sort of decision I am paying for.' },
    { who: 'Elin Kvist', no: 269, stars: 4, text: 'Orange is not an every day colour and I knew that when I ordered. Three days a week it is the best thing I own.' },
  ] },
  citrine: { dist: [7, 1, 1, 0, 0], items: [
    { who: 'Rupert Delacroix-Byrne', no: 274, stars: 5, text: 'Yellow on the flange, the hands and the counters, graphite everywhere else. Cover the yellow and the watch still works as a drawing. That is discipline.' },
    { who: 'Mei-Ling Chou', no: 279, stars: 5, text: 'Legible at a glance in a dark car. The counters resolve before I have finished turning my wrist.' },
    { who: 'Harald Brekke', no: 283, stars: 3, text: 'A very good watch and the wrong dial for me. They took it back inside thirty days, refunded in full and never asked why, so I ordered the Frost instead.' },
  ] },
  garnet: { dist: [19, 3, 0, 0, 0], items: [
    { who: 'Annabelle Rousseau', no: 287, stars: 5, text: 'Four years of failed attempts and you can see why they waited. The violet under the red holds as the light goes, where every other deep red I own turns brown by six o’clock.' },
    { who: 'Idris Coulibaly', no: 292, stars: 5, text: 'Rose gold hands, burgundy alligator, and no other warmth anywhere on the watch. It is the most finished looking thing I have worn.' },
    { who: 'Greta Lindeberg', no: 298, stars: 4, text: 'I waited fourteen months and they wrote every quarter with an honest position in the queue. Fourteen months is still fourteen months.' },
  ] },
  lime: { dist: [7, 2, 1, 0, 0], items: [
    { who: 'Oscar Viteri', no: 301, stars: 5, text: 'The highest contrast dial they make and the easiest of the twelve to read at speed. I bought it to use and it has not once complained.' },
    { who: 'Saoirse Kavanagh', no: 305, stars: 5, text: 'Lime against graphite, from an angle, inside a helmet, at dusk. That was the brief they set themselves and they met it.' },
    { who: 'Marcus Thorne', no: 308, stars: 3, text: 'Build quality is beyond argument. The colour sits further from a photograph than anything else in the collection, so see one in daylight before you order.' },
  ] },
  frost: { dist: [12, 1, 0, 0, 0], items: [
    { who: 'Hélène Dubois-Kaufmann', no: 33, stars: 5, text: 'A white dial leaves the movement nowhere to hide. Every bridge edge and every jewel setting is on show, and after a year I have not found a bad one.' },
    { who: 'Ravi Shankaran', no: 47, stars: 5, text: 'Their own watchmakers wear this reference, which they only mention if you ask. That sold it to me better than any photograph did.' },
    { who: 'Louise Petersen', no: 58, stars: 4, text: 'White alligator and a white dial both want care. Mine has been perfect for two years, but I would not wear it to paint a wall.' },
  ] },
};

const AVAIL_LD = {
  'in': 'https://schema.org/InStock',
  'low': 'https://schema.org/LimitedAvailability',
  'waitlist': 'https://schema.org/OutOfStock',
};

/* ----------------------------------------------------------------- helpers */
function esc(s) {
  return String(s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}
function pad3(n) { return ('00' + n).slice(-3); }
function setMeta(name, content) {
  let el = document.querySelector('meta[name="' + name + '"]');
  if (!el) { el = document.createElement('meta'); el.setAttribute('name', name); document.head.appendChild(el); }
  el.setAttribute('content', content);
}
function setProp(prop, content) {
  const el = document.querySelector('meta[property="' + prop + '"]');
  if (el) el.setAttribute('content', content);
}
function addLD(data) {
  const s = document.createElement('script');
  s.type = 'application/ld+json';
  s.textContent = JSON.stringify(data);
  document.head.appendChild(s);
}
function starsHTML(value) {
  const shown = Number.isInteger(value) ? String(value) : value.toFixed(1);
  const row = STAR + STAR + STAR + STAR + STAR;
  return '<span class="pdp-stars" style="--pct:' + (value / 5 * 100).toFixed(1) + '" role="img" aria-label="Rated ' + shown + ' out of 5">' +
      '<span class="pdp-stars__row pdp-stars__base" aria-hidden="true">' + row + '</span>' +
      '<span class="pdp-stars__row pdp-stars__fill" aria-hidden="true">' + row + '</span>' +
    '</span>';
}
function twelveHTML() {
  return A.watches.slice().sort(function (a, b) { return a.order - b.order; }).map(function (w) {
    return '<li><a href="' + w.url + '">' + esc(w.title) + '</a>' +
      '<span>' + esc(w.caseLabel) + ' &middot; ' + esc(w.dial) + ' &middot; ' + w.edition + ' pieces &middot; ' +
      (w.availability === 'waitlist' ? 'fully allocated' : esc(w.priceText)) + '</span></li>';
  }).join('');
}

/* -------------------------------------------------------------- the choice */
const asked = (new URLSearchParams(location.search).get('ref') || '').trim().toLowerCase();
const watch = asked ? A.bySlug(asked) : null;

if (!watch) { renderMissing(asked); return; }

/* ------------------------------------------------------------------- head */
const canonical = ORIGIN + '/product.html?ref=' + watch.slug;
const description = watch.tagline + ' ' + watch.caseLabel + ' case, ' + watch.dial.toLowerCase() +
  ' dial, 44 mm, Calibre 312. ' + watch.priceText + ' delivered, duties paid. Edition of ' +
  watch.edition + ' pieces, each one numbered.';

document.title = watch.title + ', ' + watch.caseLabel + ' | Aeterna';
setMeta('description', description);
const canonEl = document.querySelector('link[rel=canonical]');
if (canonEl) canonEl.setAttribute('href', canonical);
setProp('og:title', watch.title);
setProp('og:description', description);
setProp('og:url', canonical);
setProp('og:image', ORIGIN + '/' + watch.images[0]);

const owners = OWNERS[watch.slug];
const ownerTotal = owners.dist.reduce(function (n, v) { return n + v; }, 0);
const ownerAvg = owners.dist.reduce(function (sum, n, i) { return sum + n * (5 - i); }, 0) / ownerTotal;

addLD({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: watch.title,
  sku: watch.ref,
  mpn: watch.ref,
  brand: { '@type': 'Brand', name: 'Aeterna' },
  image: watch.images.map(function (p) { return ORIGIN + '/' + p; }),
  description: description,
  color: watch.dial,
  material: watch.caseMaterial,
  offers: {
    '@type': 'Offer',
    url: canonical,
    price: watch.price,
    priceCurrency: A.currency.code,
    availability: AVAIL_LD[watch.availability],
    itemCondition: 'https://schema.org/NewCondition',
    seller: { '@type': 'Organization', name: 'Aeterna' },
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: ownerAvg.toFixed(1),
    reviewCount: ownerTotal,
    bestRating: 5,
    worstRating: 1,
  },
  disambiguatingDescription: 'Aeterna, the Calibre 312 and this reference are invented for a design demonstration. Nothing here can be bought.',
});
addLD({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: ORIGIN + '/' },
    { '@type': 'ListItem', position: 2, name: 'Watches', item: ORIGIN + '/collection.html' },
    { '@type': 'ListItem', position: 3, name: watch.name, item: canonical },
  ],
});

/* ------------------------------------------------------------ the buy box */
$('#pdp-crumb').textContent = watch.name;
$('#pdp-ref').textContent = 'Reference ' + watch.ref;
$('#pdp-title').textContent = watch.title;
$('#pdp-tagline').textContent = watch.tagline;
$('#pdp-price').textContent = watch.priceText;
$('#pdp-avail').setAttribute('data-state', watch.availability);
$('#pdp-avail-text').textContent = watch.availabilityText;
/* One line, and it adds to the availability rather than repeating it. The
   shipping accordion carries the detail; this is the promise. */
$('#pdp-lead').textContent = watch.availability === 'waitlist'
  ? 'Nothing to order today. A place still takes about five months to build.'
  : (watch.case === 'king'
    ? 'About seven months from order, and you get a date in the first week.'
    : (watch.availability === 'low'
      ? 'About five months from order, and you get a date in the first week.'
      : 'You get a date in the first week, not a range.'));
$('#pdp-case').textContent = watch.caseBlurb;

$$('#pdp-ways .pdp-ways__item').forEach(function (a) {
  const w = A.bySlug(a.getAttribute('data-slug'));
  if (!w) return;
  $('.pdp-ways__dot', a).style.background = w.dialHex;
  a.setAttribute('aria-label', w.name + ', ' + w.dial.toLowerCase() + ' dial on a ' + w.caseLabel.toLowerCase() + ' case' +
    (w.slug === watch.slug ? ', the reference on this page' : ''));
  if (w.slug === watch.slug) a.setAttribute('aria-current', 'page');
});

function wishHTML() {
  return '<button class="pdp-wish" type="button" data-wish-toggle="' + watch.slug + '" aria-pressed="false">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5 4.2 12.9a4.8 4.8 0 0 1 6.8-6.8l1 1 1-1a4.8 4.8 0 0 1 6.8 6.8Z"/></svg>' +
      '<span data-wish-text>Save ' + esc(watch.name) + ' to your wishlist</span>' +
    '</button>';
}
$('#pdp-actions').innerHTML = watch.availability === 'waitlist'
  ? '<a class="btn btn--primary btn--block" href="contact.html#order">Join the waitlist</a>' +
    '<button class="btn btn--secondary btn--block" type="button" disabled aria-describedby="pdp-soldout">Add to bag</button>' +
    '<p class="pdp-buy__note" id="pdp-soldout">All ' + watch.edition + ' ' + esc(watch.name) +
      ' pieces are spoken for, so there is nothing to put in a bag. The waitlist runs in the order requests reach us and we write the day a place opens, which is usually because somebody sent one back inside their thirty days.</p>' +
    wishHTML()
  : '<button class="btn btn--primary btn--block" type="button" data-add-to-cart="' + watch.slug + '">Add to bag</button>' +
    '<a class="btn btn--secondary btn--block" href="contact.html#order">Request this reference</a>' +
    wishHTML();

/* The visible label is copied from the aria-label site.js maintains, so the
   accessible name and the words on screen are the same string, always. */
const wishText = $('[data-wish-text]');
const wishBtn = $('.pdp-wish');
function syncWish() {
  UI.paintWishlist();
  if (wishBtn && wishText) wishText.textContent = wishBtn.getAttribute('aria-label') || wishText.textContent;
}
syncWish();
document.addEventListener('click', function (e) {
  if (e.target.closest('[data-wish-toggle]')) syncWish();
});

/* ---------------------------------------------------------------- gallery */
const rail = $('#pdp-rail'), frames = $('#pdp-frames'), stage = $('#pdp-stage');
const lens = $('#pdp-lens'), zoomBtn = $('#pdp-zoom');
const N = watch.images.length;

rail.setAttribute('aria-label', watch.name + ', four photographs');
frames.innerHTML = watch.images.map(function (src, i) {
  return '<img' + (i === 0 ? ' class="is-on"' : '') + ' src="' + src + '" alt="' + esc(watch.alts[i]) + '"' +
    ' width="' + PLATE_W + '" height="' + PLATE_H + '"' +
    (i === 0 ? ' loading="eager" fetchpriority="high"' : ' loading="lazy" aria-hidden="true"') +
    ' decoding="async">';
}).join('');
rail.innerHTML = watch.images.map(function (src, i) {
  return '<button class="pdp-gal__thumb" type="button" role="tab" id="pdp-tab-' + i + '"' +
      ' aria-controls="pdp-stage" aria-selected="' + (i === 0) + '" tabindex="' + (i === 0 ? '0' : '-1') + '"' +
      ' aria-label="Photograph ' + (i + 1) + ' of ' + N + ', ' + esc(watch.alts[i]) + '">' +
      '<img src="' + src + '" alt="" width="' + PLATE_W + '" height="' + PLATE_H + '" loading="lazy" decoding="async">' +
    '</button>';
}).join('');

const frameEls = $$('img', frames);
const tabEls = $$('.pdp-gal__thumb', rail);
const hintFine = $('.pdp-gal__hint--fine');
const hintCoarse = $('.pdp-gal__hint--coarse');
let cur = 0;

function paintHint() {
  hintFine.textContent = cur === 0
    ? 'Hover the photograph to magnify it at 2×, or open the full file at ' + ZOOM_W + ' × ' + ZOOM_H + '. That is every pixel we hold of this reference.'
    : 'Magnification belongs to the three quarter view: it is the one photograph we hold at ' + ZOOM_W + ' × ' + ZOOM_H + '. Zoom takes you back to it.';
  hintCoarse.textContent = cur === 0
    ? 'Tap Zoom to open this photograph at ' + ZOOM_W + ' × ' + ZOOM_H + ', then drag to move around it. That is every pixel we hold of this reference.'
    : 'Zoom opens the three quarter view at ' + ZOOM_W + ' × ' + ZOOM_H + '. It is the one photograph we hold at that size.';
  /* the accessible name opens with the word on the button, so the two agree */
  zoomBtn.setAttribute('aria-label', cur === 0
    ? 'Zoom ' + watch.name + ' to ' + ZOOM_W + ' by ' + ZOOM_H
    : 'Zoom to the three quarter view of ' + watch.name + ' at ' + ZOOM_W + ' by ' + ZOOM_H);
}

function select(i, moveFocus) {
  i = (i % N + N) % N;
  cur = i;
  frameEls.forEach(function (el, n) {
    el.classList.toggle('is-on', n === i);
    if (n === i) el.removeAttribute('aria-hidden'); else el.setAttribute('aria-hidden', 'true');
  });
  tabEls.forEach(function (el, n) {
    el.setAttribute('aria-selected', String(n === i));
    el.setAttribute('tabindex', n === i ? '0' : '-1');
  });
  stage.setAttribute('aria-labelledby', 'pdp-tab-' + i);
  if (lens) lens.classList.remove('is-on');
  paintHint();
  if (moveFocus) tabEls[i].focus();
}
select(0);

const STEP = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
tabEls.forEach(function (btn, i) {
  btn.addEventListener('click', function () { select(i); });
});
rail.addEventListener('keydown', function (e) {
  if (Object.prototype.hasOwnProperty.call(STEP, e.key)) { e.preventDefault(); select(cur + STEP[e.key], true); }
  else if (e.key === 'Home') { e.preventDefault(); select(0, true); }
  else if (e.key === 'End') { e.preventDefault(); select(N - 1, true); }
});
stage.addEventListener('keydown', function (e) {
  if (e.key === 'ArrowRight') { e.preventDefault(); select(cur + 1); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); select(cur - 1); }
});

/* The rail runs down the side of the plate on wide screens and under it on
   narrow ones, so the announced orientation has to follow the layout. */
const sideMQ = window.matchMedia('(min-width: 961px)');
function orient() { rail.setAttribute('aria-orientation', sideMQ.matches ? 'vertical' : 'horizontal'); }
sideMQ.addEventListener('change', orient);
orient();

/* ------------------------------------------------------------------- zoom --
   Nothing here fetches the 1144 x 1430 file until somebody hovers the plate on
   a fine pointer or opens the lightbox. */
const zoomBox = $('#zoom-lightbox'), zoomStage = $('#zoom-stage'), zoomTitle = $('#zoom-title');
let zoomImg = null, lensLoaded = false;

function openZoom(trigger) {
  if (cur !== 0) select(0);
  if (!zoomImg) {
    zoomImg = new Image(ZOOM_W, ZOOM_H);
    zoomImg.decoding = 'async';
    zoomStage.appendChild(zoomImg);
  }
  zoomImg.alt = watch.alts[0];
  if (zoomImg.getAttribute('src') !== watch.zoom) zoomImg.src = watch.zoom;
  zoomTitle.textContent = watch.title + ', three quarter view';
  UI.openPanelEl(zoomBox, trigger);
}
zoomBtn.addEventListener('click', function () { openZoom(zoomBtn); });
stage.addEventListener('click', function (e) {
  if (e.target.closest('button')) return;
  openZoom(zoomBtn);
});

const fineMQ = window.matchMedia('(pointer: fine) and (hover: hover)');
let lensSize = 0;
stage.addEventListener('mousemove', function (e) {
  if (!fineMQ.matches || cur !== 0) return;
  const r = stage.getBoundingClientRect();
  const x = e.clientX - r.left, y = e.clientY - r.top;
  if (x < 0 || y < 0 || x > r.width || y > r.height) { lens.classList.remove('is-on'); return; }
  if (!lensLoaded) { lens.style.backgroundImage = 'url("' + watch.zoom + '")'; lensLoaded = true; }
  if (!lensSize) lensSize = lens.getBoundingClientRect().width;
  const size = lensSize;
  /* exactly twice what is on screen, which is still inside the real file */
  lens.style.backgroundSize = (r.width * 2) + 'px ' + (r.height * 2) + 'px';
  lens.style.backgroundPosition = (size / 2 - x * 2) + 'px ' + (size / 2 - y * 2) + 'px';
  lens.style.setProperty('--lx', (x - size / 2) + 'px');
  lens.style.setProperty('--ly', (y - size / 2) + 'px');
  lens.classList.add('is-on');
});
stage.addEventListener('mouseleave', function () { lens.classList.remove('is-on'); });

/* ------------------------------------------------------------------ story */
$('#pdp-story-h').textContent = 'Why ' + watch.name + ' looks like this.';
$('#pdp-story-text').textContent = watch.story;
$('#pdp-story-more').textContent = 'Underneath, nothing changes. The same Calibre 312 runs in all twelve references: 312 parts, 37 jewels, 4 Hz, seventy-two hours from a single barrel, wound by hand. ' +
  watch.name + ' takes the ' + watch.caseLabel.toLowerCase() + ' case and a ' + watch.dial.toLowerCase() +
  ' dial, in an edition of ' + watch.edition + ' pieces, each numbered inside the caseback and entered in the register the day it is signed.';
$('#pdp-story-img').innerHTML = '<img src="' + watch.images[1] + '" alt="' + esc(watch.alts[1]) + '" width="' +
  PLATE_W + '" height="' + PLATE_H + '" loading="lazy" decoding="async">';
$('#pdp-story-cap').textContent = 'The ' + watch.dial.toLowerCase() + ' dial, photographed on the bench in Plainpalais before the crystal went on.';

/* ------------------------------------------------------------ the numbers */
$('#pdp-spec').innerHTML = A.specRows(watch).map(function (row) {
  return '<div><dt>' + esc(row[0]) + '</dt><dd>' + esc(row[1]) + '</dd></div>';
}).join('');

/* ---------------------------------------------------------------- owners */
$('#pdp-rev-summary').innerHTML = starsHTML(ownerAvg) +
  '<span class="pdp-reviews__score">' + ownerAvg.toFixed(1) + '</span>' +
  '<span class="meta">from ' + ownerTotal + ' of the ' + (watch.edition - watch.stock) + ' ' + esc(watch.name) +
  ' pieces delivered so far</span>';

$('#pdp-rev-dist').innerHTML = owners.dist.map(function (n, i) {
  const pct = ownerTotal ? (n / ownerTotal * 100) : 0;
  return '<li><span class="pdp-dist__k">' + (5 - i) + ' star</span>' +
    '<span class="pdp-dist__bar" aria-hidden="true"><i style="--w:' + pct.toFixed(1) + '%"></i></span>' +
    '<span class="pdp-dist__n">' + n + '</span></li>';
}).join('');

$('#pdp-rev-grid').innerHTML = owners.items.map(function (r) {
  return '<figure class="pdp-review">' + starsHTML(r.stars) +
      '<blockquote>' + esc(r.text) + '</blockquote>' +
      '<figcaption>' +
        '<span class="pdp-review__who">' + esc(r.who) + '</span>' +
        '<span class="pdp-review__what">Owner, No. ' + pad3(r.no) + ' &middot; ' + esc(watch.name) + ' &middot; Verified purchase</span>' +
      '</figcaption>' +
    '</figure>';
}).join('');

/* --------------------------------------------------------------- related */
UI.mountCards('#pdp-related', A.related(watch.slug, 3), { compact: true });

/* ------------------------------------------------------------- accordion --
   editorial.css leaves every panel open when there is no scripting, so the
   collapsing belongs here and nowhere in the markup. */
$$('#pdp-own .accordion__btn').forEach(function (btn, i) {
  const panel = document.getElementById(btn.getAttribute('aria-controls'));
  if (!panel) return;
  function set(open) {
    btn.setAttribute('aria-expanded', String(open));
    panel.classList.toggle('is-open', open);
    if (open) panel.removeAttribute('aria-hidden');
    else panel.setAttribute('aria-hidden', 'true');
  }
  set(i === 0);
  btn.addEventListener('click', function () { set(btn.getAttribute('aria-expanded') !== 'true'); });
});

/* A colourway link carries #buy, so arriving from another reference lands on
   the box rather than the top of the page. The browser has already done this
   by the time we get here in most cases; this makes it true in all of them. */
if (location.hash === '#buy') {
  const box = document.getElementById('buy');
  if (box) requestAnimationFrame(function () { box.scrollIntoView({ behavior: 'auto', block: 'start' }); });
}

/* --------------------------------------------------------- nothing found -- */
function renderMissing(ref) {
  const shell = document.getElementById('pdp');
  if (shell) shell.remove();
  const main = document.getElementById('main');
  if (!main) return;

  const box = document.createElement('section');
  box.className = 'sec pdp-error';
  box.setAttribute('aria-labelledby', 'pdp-err-h');
  box.innerHTML = '<div class="wrap-wide">' +
      '<div class="state">' +
        '<p class="eyebrow">Not in the register</p>' +
        '<h1 class="h2 pdp-error__h" id="pdp-err-h">We could not find that reference.</h1>' +
        '<p class="lede">' + (ref
          ? 'Nothing in the register answers to &ldquo;' + esc(ref) + '&rdquo;. The link may be old, or the name may have been mistyped.'
          : 'This page shows one reference at a time and the address did not name one.') +
        ' There are twelve in all, and every one of them is below.</p>' +
        '<p class="flow-row">' +
          '<a class="btn btn--primary" href="collection.html">Browse all twelve</a>' +
          '<a class="btn btn--secondary" href="contact.html#order">Ask the atelier</a>' +
        '</p>' +
      '</div>' +
      '<ul class="pdp-ns__list">' + twelveHTML() + '</ul>' +
    '</div>';
  main.appendChild(box);

  document.title = 'Reference not found | Aeterna';
  setMeta('description', 'That reference is not in the Aeterna register. All twelve Chronographe 312 references are listed here, with the case, the dial and the price.');
  setMeta('robots', 'noindex, follow');
}
})();

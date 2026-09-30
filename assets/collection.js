/* AETERNA — the collection page. Five jobs, in this order of importance:
     1. filter and sort the twelve cards that are already in the document
     2. keep every one of those choices in the query string, so a view is a link
     3. quick view, handed to site.js's panel controller
     4. the deck, a filmstrip in a frame that exists only while it is engaged
     5. the filter panel, a modal at every width once armPanel() runs
   Nothing here renders a product card. The twelve are static HTML so a crawler,
   and a visitor with no script, sees all twelve and every link works. */
(function () {
'use strict';

const UI = window.AeternaUI;
const A = window.AETERNA;
if (!UI || !A) return;
const $ = UI.$, $$ = UI.$$;

const grid = $('#grid');
if (!grid) return;

const GROUPS = ['case', 'tone', 'availability'];
const DEFAULT_SORT = A.sorts[0].id;
const TOTAL = 12;

/* The card elements, paired once with their catalogue records. */
const cards = $$('.pcard', grid)
  .map(function (el) { return { el: el, w: A.bySlug(el.getAttribute('data-slug')) }; })
  .filter(function (c) { return c.w; });

const state = { case: [], tone: [], availability: [], sort: DEFAULT_SORT, view: 'grid' };

/* ------------------------------------------------------------ the query --
   Reads ?case=titanium&case=rose and ?case=titanium,rose alike, because the
   footer links carry one value and a form GET repeats the name. Anything not
   in AETERNA.filters is dropped rather than trusted. */
function readURL() {
  const p = new URLSearchParams(location.search);
  GROUPS.forEach(function (g) {
    const valid = A.filters[g].map(function (o) { return o.id; });
    state[g] = p.getAll(g).join(',').split(',')
      .map(function (s) { return s.trim(); })
      .filter(function (s) { return valid.indexOf(s) >= 0; })
      .filter(function (s, i, all) { return all.indexOf(s) === i; });
  });
  const sort = p.get('sort');
  state.sort = A.sorts.some(function (s) { return s.id === sort; }) ? sort : DEFAULT_SORT;
  state.view = p.get('view') === 'deck' ? 'deck' : 'grid';
}

function writeURL(push) {
  const p = new URLSearchParams();
  GROUPS.forEach(function (g) { state[g].forEach(function (v) { p.append(g, v); }); });
  if (state.sort !== DEFAULT_SORT) p.set('sort', state.sort);
  if (state.view !== 'grid') p.set('view', state.view);
  const q = p.toString();
  const url = location.pathname + (q ? '?' + q : '') + location.hash;
  try {
    if (push) history.pushState(null, '', url);
    else history.replaceState(null, '', url);
  } catch (e) { /* a sandboxed or file:// context keeps the state in memory */ }
}

/* --------------------------------------------------------- the controls -- */
function syncSortOptions() {
  const sel = $('#sort');
  if (!sel) return;
  const want = A.sorts.map(function (s) { return s.id + '|' + s.label; }).join('~');
  const have = $$('option', sel).map(function (o) { return o.value + '|' + o.textContent; }).join('~');
  if (want === have) return;      /* the static list already matches; leave it */
  sel.innerHTML = A.sorts.map(function (s) {
    return '<option value="' + s.id + '">' + s.label + '</option>';
  }).join('');
}

function syncControls() {
  $$('#filters input[type=checkbox]').forEach(function (i) {
    i.checked = (state[i.name] || []).indexOf(i.value) >= 0;
  });
  const sel = $('#sort');
  if (sel) sel.value = state.sort;
  $$('.view-toggle__btn').forEach(function (b) {
    b.setAttribute('aria-pressed', String(b.getAttribute('data-view') === state.view));
  });
  /* Where the thumb sits. On the container rather than read off the buttons
     with :has(), which this file deliberately avoids elsewhere, and named
     data-active rather than data-view so a bare [data-view=deck] still means
     exactly one thing: the button. */
  const tog = $('.view-toggle');
  if (tog) tog.setAttribute('data-active', state.view);
}

/* ---------------------------------------------------------- the filtering -- */
function matches(w) {
  return GROUPS.every(function (g) {
    return !state[g].length || state[g].indexOf(w[g]) >= 0;
  });
}

function countLine(n) {
  if (!n) return 'No references';
  if (n === TOTAL) return 'All twelve references';
  return n === 1 ? 'One of twelve references' : n + ' of twelve references';
}

function headLine(list) {
  if (!list.length) return 'No reference matches those filters.';
  const prices = list.map(function (c) { return c.w.price; });
  const lo = Math.min.apply(null, prices), hi = Math.max.apply(null, prices);
  const money = lo === hi ? 'at ' + A.money(lo) : 'from ' + A.money(lo) + ' to ' + A.money(hi);
  if (list.length === TOTAL) {
    return 'Twelve references, ' + money + ', delivered with duties paid.';
  }
  const pieces = list.reduce(function (n, c) { return n + c.w.edition; }, 0);
  const head = list.length === 1 ? 'One reference' : list.length + ' references';
  return head + ' ' + money + ', delivered with duties paid. ' + pieces + ' of the 312 pieces.';
}

/* How many references each option would leave, with the other two groups as
   they stand. A zero is worth showing: it is the reason the grid is empty. */
function paintFacets() {
  GROUPS.forEach(function (g) {
    A.filters[g].forEach(function (opt) {
      const n = cards.filter(function (c) {
        return GROUPS.every(function (h) {
          if (h === g) return c.w[h] === opt.id;
          return !state[h].length || state[h].indexOf(c.w[h]) >= 0;
        });
      }).length;
      const el = $('[data-facet="' + g + ':' + opt.id + '"]');
      if (!el) return;
      el.textContent = String(n);
      el.setAttribute('data-n', String(n));
    });
  });
}

function apply() {
  const sortFn = (A.sorts.filter(function (s) { return s.id === state.sort; })[0] || A.sorts[0]).fn;
  const shown = cards.filter(function (c) { return matches(c.w); });
  const hidden = cards.filter(function (c) { return shown.indexOf(c) < 0; });
  shown.sort(function (a, b) { return sortFn(a.w, b.w); });

  cards.forEach(function (c) { c.el.hidden = hidden.indexOf(c) >= 0; });

  /* Reorder the DOM rather than the visual order, so Tab follows the eye. Only
     when it actually changed: moving a node drops focus out of it. */
  const ordered = shown.concat(hidden);
  const current = $$('.pcard', grid);
  const same = ordered.length === current.length && ordered.every(function (c, i) { return c.el === current[i]; });
  if (!same) {
    const frag = document.createDocumentFragment();
    ordered.forEach(function (c) { frag.appendChild(c.el); });
    grid.appendChild(frag);
  }

  const n = shown.length;
  const count = $('#result-count');
  if (count) count.textContent = countLine(n);
  const head = $('#head-count');
  if (head) head.textContent = headLine(shown);

  const empty = $('#grid-empty');
  if (empty) empty.hidden = n > 0 || state.view === 'deck';
  grid.hidden = n === 0 || state.view === 'deck';

  const active = GROUPS.reduce(function (sum, g) { return sum + state[g].length; }, 0);
  const clear = $('#clear-all');
  if (clear) clear.hidden = active === 0;
  const sheetClear = $('#filters-clear');
  if (sheetClear) sheetClear.hidden = active === 0;
  const badge = $('#filter-badge');
  if (badge) { badge.hidden = active === 0; badge.textContent = '(' + active + ')'; }

  const done = $('#filters-done');
  if (done) {
    done.textContent = n === 0 ? 'Close filters'
      : (n === TOTAL ? 'Show all twelve' : 'Show ' + n + (n === 1 ? ' watch' : ' watches'));
  }

  paintFacets();
}

function clearAll(push) {
  GROUPS.forEach(function (g) { state[g] = []; });
  syncControls();
  writeURL(push !== false);
  apply();
}

/* ------------------------------------------------------------- the views --
   Grid and deck are exclusive. Leaving deck view destroys the frame, which is
   the only way to be certain it leaves no tab stops behind. */
/* Throwing the toggle swaps the panes behind a short slide. The commit is one
   function so the animated path and the instant one cannot drift apart. */
function commitView(view, push) {
  state.view = view === 'deck' ? 'deck' : 'grid';
  const deckView = $('#deck-view');
  if (deckView) deckView.hidden = state.view !== 'deck';
  if (state.view === 'deck') engageDeck(false); else releaseDeck();
  syncControls();
  if (push) writeURL(true);
  apply();
}

const NO_MOTION = matchMedia('(prefers-reduced-motion: reduce)');

function setView(view, push) {
  const next = view === 'deck' ? 'deck' : 'grid';
  const host = $('#views');
  if (!host || next === state.view || NO_MOTION.matches) { commitView(next, push); return; }

  const dir = next === 'deck' ? 'fwd' : 'back';
  host.setAttribute('data-dir', dir);
  host.classList.add('is-leaving');

  setTimeout(function () {
    commitView(next, push);
    host.classList.remove('is-leaving');
    host.classList.add('is-entering');
    /* one frame displaced with no transition, then let it run home */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        host.classList.remove('is-entering');
        host.removeAttribute('data-dir');
      });
    });
  }, 170);
}

let deck = null;
function engageDeck(focusFrame) {
  const stage = $('#deck-stage');
  const view = $('#deck-view');
  if (!stage || !view || deck || !window.ThreeUICarousel) return;
  view.classList.add('is-live');
  deck = window.ThreeUICarousel.mountCharacterCarousel(stage, {
    variant: 'filmstrip',
    src: 'assets/collection-filmstrip.html',
  });
  deck.iframe.title = 'Aeterna collection filmstrip, twelve references';
  /* Hand the keyboard over once the frame's document exists, not on the next
     frame: focus given before the load commits does not survive it, and the
     Escape listener that hands the keyboard back lives in that document.
     Only when asked: the deck now starts from the view toggle, and pulling
     focus into the frame because someone pressed Deck would be a theft. */
  if (!focusFrame) return;
  let handed = false;
  const hand = function () {
    if (handed || !deck) return;
    handed = true;
    try { deck.iframe.focus(); } catch (e) { /* frame went away */ }
  };
  deck.iframe.addEventListener('load', hand, { once: true });
  setTimeout(hand, 1500);
}

/* Only ever called because the view changed: the frame goes with the view. */
function releaseDeck() {
  const view = $('#deck-view');
  if (deck) { deck.dispose(); deck = null; }
  if (view) view.classList.remove('is-live');
}

/* The frame reports Escape back to its host, so the keyboard comes home. It
   hands back focus only: tearing the frame down here would leave the visitor
   in deck view staring at an empty stage, with the Start button gone. */
window.addEventListener('message', function (e) {
  if (!e.data || e.data.type !== 'character-carousel-release') return;
  if (!deck || e.source !== deck.iframe.contentWindow) return;
  const btn = $('.view-toggle__btn[data-view=deck]');
  if (btn) btn.focus();
});

/* ----------------------------------------------------------- quick view --
   The availability and lead-time sentences are composed here from stock,
   edition and case rather than reused from availabilityText, so the page keeps
   the house punctuation. The facts are the catalogue's. */
function availLine(w) {
  if (w.availability === 'waitlist') return 'Fully allocated, join the waitlist';
  if (w.availability === 'low') return 'Final ' + w.stock + ' of ' + w.edition;
  return w.case === 'king'
    ? 'Made to order, about seven months'
    : 'Made to order, about five months';
}

const QV_ROWS = ['Reference', 'Case', 'Dial', 'Movement', 'Power reserve', 'Strap', 'Edition'];
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function openQuick(slug, trigger) {
  const panel = $('#quick-view');
  const body = $('#qv-body');
  const w = A.bySlug(slug);
  if (!panel || !body || !w) return;

  $('#qv-eyebrow').textContent = w.ref + ' · ' + w.caseLabel;
  $('#qv-title').textContent = w.title;

  const rows = A.specRows(w).filter(function (r) { return QV_ROWS.indexOf(r[0]) >= 0; });
  body.innerHTML = '' +
    '<div class="qv">' +
      '<div class="qv__media">' +
        '<img src="' + w.images[0] + '" alt="' + esc(w.alts[0]) + '" width="572" height="715" loading="lazy" decoding="async">' +
        '<img src="' + w.images[1] + '" alt="' + esc(w.alts[1]) + '" width="572" height="715" loading="lazy" decoding="async">' +
      '</div>' +
      '<div class="qv__info">' +
        '<p class="qv__avail" data-avail="' + w.availability + '">' + esc(availLine(w)) + '</p>' +
        '<p class="qv__price">' + w.priceText +
          '<span class="meta">Delivered and insured, duties paid. Nothing is added at the door.</span></p>' +
        '<p class="body">' + esc(w.tagline) + '</p>' +
        '<dl class="dl-spec">' +
          rows.map(function (r) {
            return '<div><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>';
          }).join('') +
        '</dl>' +
        '<div class="qv__actions">' +
          '<button class="btn btn--primary" type="button" data-add-to-cart="' + w.slug + '">Add to bag</button>' +
          '<button class="btn btn--secondary qv__wish" type="button" data-wish-toggle="' + w.slug + '" aria-pressed="false">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5 4.2 12.9a4.8 4.8 0 0 1 6.8-6.8l1 1 1-1a4.8 4.8 0 0 1 6.8 6.8Z"/></svg>' +
            'Save' +
          '</button>' +
        '</div>' +
        '<p class="qv__link"><a class="btn btn--secondary btn--block btn--sm" href="' + w.url + '">' +
          'The full reference</a></p>' +
      '</div>' +
    '</div>';

  UI.paintWishlist();
  UI.openPanelEl(panel, trigger);
}

/* ----------------------------------------------------------- the panel --
   The filters are a modal panel at every width. The roles are set here rather
   than in the markup because they are only true once this script is running:
   with no script the same element is a static block above the grid, and
   calling that a dialog would be a lie. The class is what the drawer geometry
   in collection.css hangs off, so the panel cannot be left parked off-canvas
   in the window between first paint and this line. */
function armPanel() {
  const f = $('#filters');
  if (!f) return;
  f.setAttribute('role', 'dialog');
  f.setAttribute('aria-modal', 'true');
  /* The drawer geometry is already on .js from first paint. This only turns
     the slide back on, a frame later, so opening it animates but arriving on
     the page never does. */
  requestAnimationFrame(function () {
    document.documentElement.classList.add('filters-armed');
  });
}

/* --------------------------------------------------------- the sort menu --
   The shared listbox from site.js, wearing the toolbar's secondary button so
   it sits beside Filter as the same species of control. */
function buildSortMenu() {
  const sel = $('#sort');
  if (sel) UI.enhanceSelect(sel, { triggerClass: 'btn btn--secondary btn--sm sortmenu__btn' });
}

/* ------------------------------------------------------------- listeners -- */
const filters = $('#filters');
if (filters) {
  filters.addEventListener('change', function (e) {
    const box = e.target.closest('input[type=checkbox]');
    if (!box || GROUPS.indexOf(box.name) < 0) return;
    const list = state[box.name];
    const at = list.indexOf(box.value);
    if (box.checked && at < 0) list.push(box.value);
    if (!box.checked && at >= 0) list.splice(at, 1);
    writeURL(true);
    apply();
  });
}

const sortSel = $('#sort');
if (sortSel) {
  sortSel.addEventListener('change', function () {
    state.sort = sortSel.value;
    writeURL(true);
    apply();
  });
}

const form = $('#browse');
if (form) {
  /* With a script the controls are live, so a submit would only reload. */
  form.addEventListener('submit', function (e) { e.preventDefault(); apply(); });
}

document.addEventListener('click', function (e) {
  const quick = e.target.closest('[data-quick]');
  if (quick) { e.preventDefault(); openQuick(quick.getAttribute('data-quick'), quick); return; }

  const clear = e.target.closest('#clear-all, [data-clear]');
  if (clear) {
    e.preventDefault();
    clearAll(true);
    if (clear.id === 'filters-clear') {
      const first = $('#filters input[type=checkbox]');
      if (first) first.focus();
    }
    return;
  }

  const view = e.target.closest('.view-toggle__btn');
  if (view) { e.preventDefault(); setView(view.getAttribute('data-view'), true); return; }

});

window.addEventListener('popstate', function () {
  readURL();
  const deckView = $('#deck-view');
  if (deckView) deckView.hidden = state.view !== 'deck';
  if (state.view === 'deck') engageDeck(false); else releaseDeck();
  syncControls();
  apply();
});


/* ------------------------------------------------------------------ boot -- */
syncSortOptions();
readURL();
armPanel();
buildSortMenu();
const deckView = $('#deck-view');
if (deckView) deckView.hidden = state.view !== 'deck';
if (state.view === 'deck') engageDeck(false);
syncControls();
writeURL(false);          /* normalise whatever arrived in the address bar */
apply();
})();

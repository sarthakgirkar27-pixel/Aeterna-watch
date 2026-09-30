/* AETERNA — shared behaviour for every page.
   Header, mobile menu, search, cart, wishlist, reveals, toasts.
   No framework, no build step. Everything degrades: with JS off the pages are
   complete documents and every link still works. */
(function () {
'use strict';

const $ = function (s, r) { return (r || document).querySelector(s); };
const $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
const A = window.AETERNA;
const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ------------------------------------------------------------- storage --
   localStorage can throw outright in a locked-down browser, so every read and
   write is guarded and the site works with none of it. */
function readStore(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) { return fallback; }
}
function writeStore(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode: state stays in memory */ }
}

/* ---------------------------------------------------------------- toast -- */
let toastEl = null, toastTimer = 0;
function toast(message, actionLabel, actionHref) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    toastEl.setAttribute('role', 'status');
    toastEl.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastEl);
  }
  toastEl.innerHTML = '<span></span>';
  $('span', toastEl).textContent = message;
  if (actionLabel && actionHref) {
    const a = document.createElement('a');
    a.href = actionHref; a.textContent = actionLabel;
    /* "View bag" points at #cart-drawer, and a drawer is position:fixed and
       only ever opened by the panel controller -- so as a plain hash link this
       set location.hash and did nothing else. The panels are not wired by
       delegation either: wirePanelTriggers binds the [data-panel] buttons that
       exist at boot, and this anchor is made long afterwards. */
    const panel = actionHref.charAt(0) === '#' && document.getElementById(actionHref.slice(1));
    if (panel && panel.getAttribute('role') === 'dialog') {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        hideToast();
        /* Opened from the toast, but focus belongs to the header control for
           that panel when it closes: the toast has usually timed out and gone
           by then, and returning focus to something invisible is the bug this
           file already fixed once. */
        const owner = $('[data-panel="' + panel.id + '"]') || a;
        openPanelEl(panel, owner);
      });
    }
    toastEl.appendChild(a);
  }
  requestAnimationFrame(function () { toastEl.classList.add('is-open'); });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, 4200);
}

function hideToast() {
  clearTimeout(toastTimer);
  if (toastEl) toastEl.classList.remove('is-open');
}

/* ------------------------------------------------------------ overlays --
   One controller for the menu, the two drawers and the search panel: they are
   mutually exclusive, they all trap focus, they all close on Escape, and they
   all hand focus back to whatever opened them. */
const scrim = (function () {
  let el = $('.scrim');
  if (!el) { el = document.createElement('div'); el.className = 'scrim'; document.body.appendChild(el); }
  return el;
})();

let openPanel = null, lastFocus = null, scrollLock = 0;
/* True only while closePanel is handing focus back. Restoring focus is not the
   same as navigating to something, and the card treats the two differently. */
let restoringFocus = false;

/* Can this actually be seen? opacity:0 still has layout and still takes focus,
   which is how a hover-only control ends up holding an invisible focus ring. */
function perceivable(el) {
  if (!el || !el.getClientRects().length) return false;
  for (let n = el; n && n !== document.body; n = n.parentElement) {
    const cs = getComputedStyle(n);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
  }
  return true;
}

function focusables(root) {
  return $$('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])', root)
    .filter(function (el) {
      if (el === document.activeElement) return true;
      if (el.closest('[hidden]')) return false;
      const cs = getComputedStyle(el);
      if (cs.display === 'none') return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 || r.height > 0;
    });
}

function onPanelKeydown(e) {
  if (!openPanel) return;
  if (e.key === 'Escape') { e.preventDefault(); closePanel(); return; }
  if (e.key !== 'Tab') return;
  const list = focusables(openPanel);
  if (!list.length) return;
  const first = list[0], last = list[list.length - 1];
  /* If focus has somehow left the panel -- a stray programmatic focus, a
     browser quirk -- the two end checks below never match and Tab walks the
     whole page behind the scrim. Pull it back before that can happen. */
  if (!openPanel.contains(document.activeElement)) { e.preventDefault(); first.focus(); return; }
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

function openPanelEl(el, trigger) {
  if (openPanel === el) { closePanel(); return; }
  if (openPanel) closePanel(true);
  lastFocus = trigger || document.activeElement;
  openPanel = el;
  scrollLock = window.scrollY;
  document.body.style.top = '-' + scrollLock + 'px';
  document.body.classList.add('is-locked');
  el.classList.add('is-open');
  if (!el.classList.contains('mobile-menu')) scrim.classList.add('is-open');
  el.removeAttribute('inert');
  if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
  if (trigger) trigger.setAttribute('aria-expanded', 'true');
  document.addEventListener('keydown', onPanelKeydown);
  /* Focus has to land inside the panel, but the panel is mid-transition on the
     frame it opens and a hidden subtree refuses focus. Try now, then again once
     the transition has run, and verify rather than assume. */
  const target = el.getAttribute('data-autofocus') ? $(el.getAttribute('data-autofocus'), el) : null;
  const land = function () {
    const want = target || focusables(el)[0] || el;
    if (!want) return;
    want.focus({ preventScroll: true });
  };
  land();
  requestAnimationFrame(land);
  setTimeout(function () { if (openPanel === el && !el.contains(document.activeElement)) land(); }, 90);
}

function closePanel(silent) {
  if (!openPanel) return;
  const el = openPanel;
  openPanel = null;
  el.classList.remove('is-open');
  scrim.classList.remove('is-open');
  document.removeEventListener('keydown', onPanelKeydown);
  $$('[aria-controls="' + el.id + '"]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
  document.body.classList.remove('is-locked');
  document.body.style.top = '';
  window.scrollTo(0, scrollLock);
  if (!silent && lastFocus && document.contains(lastFocus)) {
    /* The trigger may only exist on hover -- Quick view lives inside the card
       and is gone the moment the pointer is elsewhere. Handing focus to it
       would park an invisible focus ring there and hold the card open, so fall
       back to the nearest thing in the same card that can be seen. */
    let back = lastFocus;
    if (!perceivable(back)) {
      const host = back.closest('.pcard, li, article') || document.body;
      /* focusables() matches a[href] whether or not it is a tab stop, and a
         card's photograph is a link carrying tabindex="-1" and aria-hidden --
         deliberately out of both the tab order and the accessibility tree.
         Handing focus there would announce nothing. Take the first thing that
         is genuinely reachable, which on a card is the product's own name. */
      back = focusables(host).filter(function (el) {
        return perceivable(el)
          && el.getAttribute('tabindex') !== '-1'
          && el.getAttribute('aria-hidden') !== 'true'
          && !el.closest('[aria-hidden="true"]');
      })[0] || lastFocus;
    }
    restoringFocus = true;
    back.focus({ preventScroll: true });
    /* One turn only: the next genuine focusin should count again. */
    setTimeout(function () { restoringFocus = false; }, 0);
  }
}
scrim.addEventListener('click', function () { closePanel(); });

function wirePanelTriggers() {
  $$('[data-panel]').forEach(function (btn) {
    const el = document.getElementById(btn.getAttribute('data-panel'));
    if (!el) return;
    btn.setAttribute('aria-controls', el.id);
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', function (e) { e.preventDefault(); openPanelEl(el, btn); });
  });
  $$('[data-panel-close]').forEach(function (btn) {
    btn.addEventListener('click', function (e) { e.preventDefault(); closePanel(); });
  });
}

/* ------------------------------------------------------------- header --
   Two modes. "over" is transparent light-on-dark for a page that opens on a
   dark hero; "solid" is the ivory bar. A page opts in with
   data-header="auto" and the flip happens past its own hero. */
/* initHeader keeps `away` in a closure, and that is deliberate: removing
   .is-away by hand leaves the flag saying the bar is retracted, apply() then
   sees next === away and never toggles the class back, and the header refuses
   to hide for the rest of the gesture. So this is the one door in. Returns
   true only if it actually moved the bar, which is what the caller times off. */
let revealHeader = function () { return false; };

function initHeader() {
  const header = $('.site-header');
  if (!header) return;
  const auto = header.getAttribute('data-header') === 'auto';
  const watched = auto ? $('[data-header-watch]') : null;
  let lastY = window.scrollY, away = false, raf = 0, travel = 0, mode = auto ? 'over' : 'solid';
  header.setAttribute('data-mode', mode);

  function apply() {
    raf = 0;
    const y = window.scrollY;
    const dy = y - lastY;
    lastY = y;
    if (auto) {
      const limit = watched ? watched.offsetTop + watched.offsetHeight - 90 : window.innerHeight;
      const next = y > limit ? 'solid' : 'over';
      if (next !== mode) { mode = next; header.setAttribute('data-mode', next); }
    }
    /* Never retract while an overlay is open, and never in the first screen.
       Direction is accumulated rather than read per event: a 6px threshold made
       the bar flip five times in twenty-five wheel notches. */
    if (dy > 0) travel = Math.max(0, travel) + dy; else travel = Math.min(0, travel) + dy;
    const shouldHide = !openPanel && y > 400 && travel > 90;
    const shouldShow = travel < -70 || y < 200;
    const next = shouldHide ? true : (shouldShow ? false : away);
    if (next !== away) { away = next; travel = 0; header.classList.toggle('is-away', away); }
  }
  window.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(apply); }, { passive: true });
  /* Tabbing into a retracted header brings it back rather than leaving focus
     on something the user cannot see. */
  header.addEventListener('focusin', function () {
    if (away) { away = false; header.classList.remove('is-away'); }
  });
  /* Same principle, for a click that lands outside the bar but changes
     something inside it. travel is zeroed exactly as apply() does when it
     flips the flag, so the next scroll gesture starts its 90px again rather
     than snapping the bar straight back up. */
  revealHeader = function () {
    if (!away) return false;
    away = false; travel = 0;
    header.classList.remove('is-away');
    return true;
  };
  apply();

  /* The five tabs carry a static aria-current in the markup, so 8a's anchor
     resolves at first paint and the view transition has a participant on both
     sides of a navigation. This still marks the mobile list, which has none,
     and is idempotent over the tabs. */
  const here = location.pathname.split('/').pop() || 'index.html';
  $$('.nav a, .mobile-menu__list a').forEach(function (a) {
    const target = a.getAttribute('href').split('?')[0].split('#')[0];
    if (target && target === here) a.setAttribute('aria-current', 'page');
  });

  initNavIndicator(header);
}

/* ------------------------------------------------------- nav indicator --
   The five tabs share one 1px rule that travels between them. site.css 8a
   anchors it to the tab carrying aria-current, so it is already under the right
   tab at first paint with nothing measured here.

   This is only the departure. Clicking a tab is a real cross-document
   navigation, so no single document sees both ends of the move: the rule starts
   travelling in the page being left, while the next one loads, and the view
   transition in 11b interpolates that to where the arriving page draws its own.
   The motion fills navigation latency instead of adding any.

   Moving the anchor rather than animating anything is what keeps this covered
   by the global reduced-motion block -- it is a CSS transition on left/right,
   and an element.animate() would not be. */
function initNavIndicator(header) {
  const nav = $('.nav', header);
  if (!nav) return;

  nav.addEventListener('click', function (e) {
    /* Only a plain left click navigates this tab. A modified or middle click
       opens a new one and this page stays put, so moving the rule would leave
       it pointing at a page the visitor is still not on. */
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a');
    if (!a || !nav.contains(a) || a.target === '_blank') return;
    if (a.getAttribute('aria-current') === 'page') return;
    $$('a[data-going]', nav).forEach(function (o) { o.removeAttribute('data-going'); });
    a.setAttribute('data-going', '');
  });

  /* The attribute survives into the back/forward cache, so a page restored from
     it would come back with the rule under the tab the visitor left for rather
     than the one they are on. */
  window.addEventListener('pageshow', function () {
    $$('a[data-going]', nav).forEach(function (o) { o.removeAttribute('data-going'); });
  });
}

/* ----------------------------------------------------- page transitions --
   site.css 11b does the whole animation. This only decides the few cases where
   it should not run. It lives on the OUTGOING document, which booted long ago,
   so unlike the pagereveal half -- which has to be armed from the head because
   it fires before a script at the end of the body has run -- this is safe here.
   Mutations made inside pageswap are captured, so a class set here lands in the
   snapshot the other document animates from. */
function initPageTransition() {
  if (!('onpageswap' in window)) return;

  window.addEventListener('pageswap', function (e) {
    const v = e.viewTransition;
    if (!v) return;

    /* Two collection states not worth snapshotting. The deck mounts a
       same-origin iframe running its own animation; the grid/deck swap spends
       its whole length with the pane faded out, so a click landing in that
       window would capture a page with a hole in it.

       The swap is read off the pane's own opacity rather than off .is-leaving,
       or any other class it passes through. Those classes come and go a frame
       or two before the opacity transition they started has finished -- at
       220ms into a swap the pane was measured still at opacity 0 with every
       class already removed -- so anything keyed on them leaves a window open.
       What matters is only whether the pane is see-through right now. */
    const views = $('.browse__views');
    if ($('.deck.is-live') || (views && parseFloat(getComputedStyle(views).opacity) < 1)) {
      v.skipTransition();
      return;
    }

    /* An open overlay: a named element always paints above root, so the rule
       would stand in front of the sheet for the whole transition. It gives the
       name up instead. The retracted header needs the same thing and gets it in
       site.css 8a, off the class the header is already carrying here. */
    if (openPanel) {
      document.documentElement.classList.add('vt-plain');
    }
  });

  /* A pageswap mutation survives into the back/forward cache, so a restored
     page would come back with this class still on. Clear it on the way in. */
  window.addEventListener('pageshow', function () {
    document.documentElement.classList.remove('vt-plain');
  });
}

/* -------------------------------------------------------------- reveal --
   The site has exactly one entrance: fade plus an 18px rise. Elements opt in
   with .reveal or .reveal-group. Delays are retired after the run so a hover
   on a staggered child never inherits the stagger. */
function initReveal() {
  const items = $$('.reveal, .reveal-group');
  if (!items.length) return;
  if (reduceMQ.matches) { items.forEach(function (el) { el.classList.add('is-in', 'is-done'); }); return; }
  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('is-in');
      setTimeout(function () { el.classList.add('is-done'); }, 1400);
      io.unobserve(el);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  items.forEach(function (el) { io.observe(el); });
}

/* ---------------------------------------------------------------- cart -- */
const CART_KEY = 'aeterna.cart.v1';
const WISH_KEY = 'aeterna.wishlist.v1';
let cart = readStore(CART_KEY, []);
let wishlist = readStore(WISH_KEY, []);

function cartTotal() {
  return cart.reduce(function (sum, line) {
    const w = A.bySlug(line.slug);
    return sum + (w ? w.price * line.qty : 0);
  }, 0);
}
function cartCount() { return cart.reduce(function (n, l) { return n + l.qty; }, 0); }

function addToCart(slug, qty, btn) {
  const w = A.bySlug(slug);
  if (!w) return;
  const existing = cart.find(function (l) { return l.slug === slug; });
  if (existing) existing.qty += (qty || 1);
  else cart.push({ slug: slug, qty: qty || 1 });
  writeStore(CART_KEY, cart);
  paintCart();
  confirmAdd(btn);
  toast(w.title + ' added to your bag.', 'View bag', '#cart-drawer');
}

/* The confirmation, in three registers and one breath: the button answers
   where the cursor already is, the bar comes back so the count is somewhere it
   can be seen, the badge answers, and the words arrive last in the toast.

   Nothing travels between the button and the bag, on purpose. The flight below
   is right for a wishlist row because the row genuinely leaves -- here the
   photograph stays on the page, it is a third of the viewport rather than a
   76px thumbnail, and the bag is frequently not even on screen: measured on
   the PDP at scrollY 700 the header is retracted and the bag button sits at
   top:-63. A flight would throw the plate out of the top of the window at
   nothing. The saved-watch flight never hits that because a drawer is open and
   apply() will not retract the bar while a panel is. */
const SEAL_HOLD = 760;
function confirmAdd(btn) {
  /* A held state rather than pop(): the mark has to stay struck for a beat,
     and it must survive reduced motion, where an animation collapses to
     nothing but a transition still lands on the class's value. */
  if (btn) {
    if (btn._sealT) clearTimeout(btn._sealT);
    btn.classList.add('is-sealing');
    btn._sealT = setTimeout(function () {
      btn.classList.remove('is-sealing');
      btn._sealT = 0;
    }, SEAL_HOLD);
  }
  const moved = revealHeader();
  const bump = function () {
    $$('[data-cart-count]').forEach(function (el) { pop(el, 'is-bumped'); });
    /* The badge says how many; the ring says it landed HERE. On a first add
       the badge appears out of nothing, which is a change but not a direction
       -- the ring is what carries the eye to the bag. Same gesture the
       wishlist heart throws when it takes something in. */
    $$('[data-panel="cart-drawer"]').forEach(function (el) { pop(el, 'is-landed'); });
  };
  /* One --d1 of stagger, and only when the bar actually had to come back, so
     the badge answers as the header arrives instead of peaking while it is
     still sliding. Every other path -- including moveToCart, where the flight
     is already the lead-in -- bumps on the same frame as before. */
  if (moved && !MOTION_OFF.matches) setTimeout(bump, 160); else bump();
}
/* Close the row, then mutate. The other order deletes the row out from under
   its own animation -- and on the last line it is worse than that, because the
   repaint swaps in an empty-state placeholder where the closing row was. */
function closeRow(btn, isWish) {
  const slug = btn.getAttribute('data-slug');
  const row = btn.closest('.line-item');
  if (btn.disabled) return;
  btn.disabled = true;

  const drop = isWish ? removeFromWishlist : removeFromCart;
  const paint = isWish ? paintWishlist : paintCart;

  if (!row || MOTION_OFF.matches) { drop(slug); return; }

  /* Height has to be a number before it can animate to zero; auto does not
     interpolate. The reflow between the two writes is what makes the measured
     value the from-state rather than something to animate towards. */
  row.style.height = row.offsetHeight + 'px';
  void row.offsetHeight;
  row.classList.add('is-leaving', 'is-out');
  row.style.height = '0px';

  /* The line is out of the bag the moment it starts leaving, so the badge, the
     hearts on the cards and the total go with it. Only the list rebuild waits:
     rebuilding now would delete the closing row out from under its animation.
     The wait is the height transition (--d2) plus a frame or two of slack. */
  drop(slug, true);
  setTimeout(function () { paint(); }, 360);
}

/* keepList is for closeRow: take the line out and bring the numbers up to
   date, but leave the list standing while the row it is in finishes closing. */
function removeFromCart(slug, keepList) {
  cart = cart.filter(function (l) { return l.slug !== slug; });
  writeStore(CART_KEY, cart);
  paintCart(keepList);
}
function removeFromWishlist(slug, keepList) {
  wishlist = wishlist.filter(function (s) { return s !== slug; });
  writeStore(WISH_KEY, wishlist);
  paintWishlist(keepList);
}
function toggleWishlist(slug) {
  const w = A.bySlug(slug);
  const at = wishlist.indexOf(slug);
  const saving = at < 0;
  if (at >= 0) { wishlist.splice(at, 1); toast((w ? w.name : 'Watch') + ' removed from your wishlist.'); }
  else { wishlist.push(slug); toast((w ? w.name : 'Watch') + ' saved to your wishlist.'); }
  writeStore(WISH_KEY, wishlist);
  paintWishlist();
  /* Only the save is marked. Removing something is not an achievement, and a
     card that threw the same flourish on the way out would read as a bug. */
  if (saving) {
    $$('[data-wish-toggle="' + slug + '"]').forEach(function (btn) { pop(btn, 'is-saved'); });
  }
  return saving;
}

/* Retire a one-shot class when its animation ends, so the same button can play
   it again the next time. A timeout as well as the event, because an animation
   on a hidden element never fires animationend and the class would stick. */
function pop(el, cls) {
  if (!el) return;
  /* Re-entry has to dismantle the last run first. Two of these inside 900ms
     used to leave the earlier backstop and the earlier listener alive, and
     whichever fired first retired the class out from under the animation that
     was still playing. */
  if (el._popT) { clearTimeout(el._popT); el._popT = 0; }
  if (el._popDone) { el.removeEventListener('animationend', el._popDone); }
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
  const done = function () {
    el.classList.remove(cls);
    if (el._popT) { clearTimeout(el._popT); el._popT = 0; }
    el.removeEventListener('animationend', done);
    el._popDone = null;
  };
  el._popDone = done;
  el.addEventListener('animationend', done);
  /* A backstop as well as the event: an animation on a hidden element never
     fires animationend and the class would stick for good. */
  el._popT = setTimeout(done, 900);
}

const MOTION_OFF = window.matchMedia('(prefers-reduced-motion: reduce)');

/* The thumbnail flies to the bag. Two nested elements on purpose: the outer one
   carries X on an easing that leaves quickly, the inner one carries Y on one
   that arrives quickly, and the sum of the two is an arc. One element could
   only travel in a straight line. */
function flyToBag(img) {
  if (MOTION_OFF.matches || !img) return;
  const target = $('[data-panel="cart-drawer"]');
  if (!target) return;
  const a = img.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  if (!a.width || !b.width) return;

  const outer = document.createElement('span');
  outer.className = 'fly';
  outer.style.left = a.left + 'px';
  outer.style.top = a.top + 'px';
  outer.style.width = a.width + 'px';
  outer.style.height = a.height + 'px';
  const inner = document.createElement('span');
  inner.className = 'fly__i';
  inner.style.backgroundImage = "url('" + img.currentSrc + "')";
  outer.appendChild(inner);
  /* A copy of something already on the page, carrying no text of its own. */
  outer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(outer);
  /* The reflow is the whole trick. Without it the append and the transform
     below land in one style recalculation, there is no from-state, and the
     clone is simply drawn at the destination -- measured as
     getAnimations().length === 0 with the tile already on the bag. The next
     rAF is not a substitute; only reading layout flushes it. */
  void outer.offsetWidth;

  const dx = (b.left + b.width / 2) - (a.left + a.width / 2);
  const dy = (b.top + b.height / 2) - (a.top + a.height / 2);
  requestAnimationFrame(function () {
    outer.style.transform = 'translateX(' + dx + 'px)';
    inner.style.transform = 'translateY(' + dy + 'px) scale(.18)';
    inner.style.opacity = '0';
  });
  setTimeout(function () { outer.remove(); }, 760);
}

/* Move a saved watch into the bag: the picture leaves, the row closes behind
   it, and only then does the list repaint -- repainting first would delete the
   row out from under its own animation. */
function moveToCart(slug, btn) {
  const row = btn ? btn.closest('.line-item') : null;
  if (btn) btn.disabled = true;

  /* The badge bump used to be spelled out here. It lives in confirmAdd now, so
     that "the badge answers when something lands in it" is written once and
     every path gets it; addToCart is called with no button, so no seal. */
  const commit = function () {
    addToCart(slug, 1);
    wishlist = wishlist.filter(function (x) { return x !== slug; });
    writeStore(WISH_KEY, wishlist);
    paintWishlist();
  };

  if (!row || MOTION_OFF.matches) { commit(); return; }

  flyToBag($('img', row));
  /* Height has to be a number before it can be animated to zero; auto does not
     interpolate. The reflow between the two writes is what makes the measured
     value the from-state rather than something to animate towards. */
  row.style.height = row.offsetHeight + 'px';
  void row.offsetHeight;
  row.classList.add('is-leaving');
  row.style.height = '0px';
  setTimeout(commit, 420);
}

function lineItemHTML(w, opts) {
  return '' +
    '<li class="line-item">' +
      '<img src="' + w.thumbs[0] + '" alt="" width="76" height="95" loading="lazy" decoding="async">' +
      '<div>' +
        '<p class="line-item__name">' + w.title + '</p>' +
        '<p class="line-item__meta">' + w.ref + ' &middot; ' + w.caseLabel + (opts && opts.qty > 1 ? ' &middot; Qty ' + opts.qty : '') + '</p>' +
        '<p class="line-item__acts">' +
          (opts && opts.kind === 'wish'
            ? '<button class="line-item__move" type="button" data-move-to-cart="' + w.slug + '">' +
                '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.4 7.8h13.2l-1 12.2H6.4Z"/><path d="M9 7.8V6.4a3 3 0 0 1 6 0v1.4"/></svg>' +
                'Move to bag</button>'
            : '') +
          '<button class="line-item__remove" type="button" data-remove="' + (opts && opts.kind === 'wish' ? 'wish' : 'cart') + '" data-slug="' + w.slug + '">Remove</button>' +
        '</p>' +
      '</div>' +
      '<span class="line-item__price">' + w.priceText + '</span>' +
    '</li>';
}

function paintCart(keepList) {
  const count = cartCount();
  $$('[data-cart-count]').forEach(function (el) {
    el.textContent = count ? String(count) : '';
    el.setAttribute('data-count', String(count));
  });
  $$('[data-cart-label]').forEach(function (el) {
    el.setAttribute('aria-label', count === 0 ? 'Bag, empty' : 'Bag, ' + count + (count === 1 ? ' watch' : ' watches'));
  });
  const body = $('#cart-items'), foot = $('#cart-foot');
  if (!body) return;
  if (keepList) {
    /* Only the total is left to move. On the last line there is nothing
       honest to show -- the whole footer is about to go -- so it keeps the
       figure it has rather than blinking $0 on its way out. */
    if (foot && cart.length) { const t = $('#cart-total'); if (t) t.textContent = A.money(cartTotal()); }
    return;
  }
  if (!cart.length) {
    body.innerHTML = '<div class="drawer__empty"><p class="h3">Your bag is empty.</p>' +
      '<p class="meta">Twelve references, one movement. Start with the collection.</p>' +
      '<a class="btn btn--secondary" href="collection.html">Browse the collection</a></div>';
    if (foot) foot.hidden = true;
    return;
  }
  /* Same list class as the wishlist: the gap rides on the rows, so a row that
     closes takes its own spacing with it instead of leaving a hole the list
     then snaps shut. */
  body.innerHTML = '<ul class="line-list">' +
    cart.map(function (l) {
      const w = A.bySlug(l.slug);
      return w ? lineItemHTML(w, { qty: l.qty, kind: 'cart' }) : '';
    }).join('') + '</ul>';
  if (foot) {
    foot.hidden = false;
    const t = $('#cart-total');
    if (t) t.textContent = A.money(cartTotal());
  }
}

function paintWishlist(keepList) {
  const count = wishlist.length;
  $$('[data-wish-count]').forEach(function (el) {
    el.textContent = count ? String(count) : '';
    el.setAttribute('data-count', String(count));
  });
  $$('[data-wish-label]').forEach(function (el) {
    el.setAttribute('aria-label', count === 0 ? 'Wishlist, empty' : 'Wishlist, ' + count + (count === 1 ? ' watch saved' : ' watches saved'));
  });
  $$('[data-wish-toggle]').forEach(function (btn) {
    const on = wishlist.indexOf(btn.getAttribute('data-wish-toggle')) >= 0;
    btn.setAttribute('aria-pressed', String(on));
    const w = A.bySlug(btn.getAttribute('data-wish-toggle'));
    btn.setAttribute('aria-label', (on ? 'Remove ' : 'Save ') + (w ? w.name : 'watch') + (on ? ' from' : ' to') + ' your wishlist');
  });
  const body = $('#wish-items');
  if (!body || keepList) return;
  if (!wishlist.length) {
    body.innerHTML = '<div class="drawer__empty"><p class="h3">Nothing saved yet.</p>' +
      '<p class="meta">Tap the heart on any reference to keep it here while you decide.</p>' +
      '<a class="btn btn--secondary" href="collection.html">Browse the collection</a></div>';
    return;
  }
  /* The gap moved onto the rows themselves: a row that collapses to nothing
     still leaves a grid gap behind it, and the list closes up with a jump. */
  body.innerHTML = '<ul class="line-list">' +
    wishlist.map(function (slug) {
      const w = A.bySlug(slug);
      return w ? lineItemHTML(w, { kind: 'wish' }) : '';
    }).join('') + '</ul>';
}

document.addEventListener('click', function (e) {
  const add = e.target.closest('[data-add-to-cart]');
  if (add) { e.preventDefault(); addToCart(add.getAttribute('data-add-to-cart'), 1, add); return; }
  const move = e.target.closest('[data-move-to-cart]');
  if (move) { e.preventDefault(); moveToCart(move.getAttribute('data-move-to-cart'), move); return; }
  const wish = e.target.closest('[data-wish-toggle]');
  if (wish) { e.preventDefault(); toggleWishlist(wish.getAttribute('data-wish-toggle')); return; }
  const rm = e.target.closest('[data-remove]');
  if (rm) {
    e.preventDefault();
    closeRow(rm, rm.getAttribute('data-remove') === 'wish');
  }
});

/* -------------------------------------------------------------- search -- */
function initSearch() {
  const panel = $('#search-panel');
  if (!panel) return;
  const input = $('#search-input', panel);
  const results = $('#search-results', panel);
  const empty = $('#search-empty', panel);
  const count = $('#search-count', panel);
  let timer = 0;

  function run() {
    const q = input.value.trim().toLowerCase();
    if (!q) {
      results.innerHTML = A.featured(4).map(function (w) { return cardHTML(w, { compact: true }); }).join('');
      count.textContent = 'Popular references';
      empty.hidden = true;
      return;
    }
    const hits = A.watches.filter(function (w) { return w.search.indexOf(q) >= 0; });
    results.innerHTML = hits.map(function (w) { return cardHTML(w, { compact: true }); }).join('');
    empty.hidden = hits.length > 0;
    count.textContent = hits.length
      ? hits.length + (hits.length === 1 ? ' reference' : ' references')
      : '';
    if (!hits.length) $('#search-term').textContent = input.value.trim();
  }
  input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(run, 120); });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const first = $('a', results);
      if (first) location.href = first.getAttribute('href');
    }
  });
  run();
}

/* --------------------------------------------------- product card markup --
   One renderer, so a card looks identical on the home page, the collection,
   the search panel and the related rail. */
const CARD_SIZES = '(max-width:560px) 45vw, (max-width:1080px) 46vw, 23vw';
function cardHTML(w, opts) {
  opts = opts || {};
  const flag = w.availability === 'waitlist'
    ? '<span class="pcard__flag">Waitlist</span>'
    : (w.availability === 'low' ? '<span class="pcard__flag">Final pieces</span>' : '');
  return '' +
  '<article class="pcard" data-slug="' + w.slug + '" data-case="' + w.case + '" data-tone="' + w.tone + '" data-avail="' + w.availability + '" data-price="' + w.price + '">' +
    '<a class="pcard__media" href="' + w.url + '" tabindex="-1" aria-hidden="true">' +
      '<img class="is-main" src="' + w.images[0] + '" srcset="' + w.thumbs[0] + ' 340w, ' + w.images[0] + ' 572w" sizes="' + CARD_SIZES + '" alt="" width="572" height="715" loading="lazy" decoding="async">' +
      '<img class="is-alt" src="' + w.images[1] + '" srcset="' + w.thumbs[1] + ' 340w, ' + w.images[1] + ' 572w" sizes="' + CARD_SIZES + '" alt="" width="572" height="715" loading="lazy" decoding="async">' +
    '</a>' +
    flag +
    '<button class="pcard__wish" type="button" data-wish-toggle="' + w.slug + '" aria-pressed="false" aria-label="Save ' + w.name + ' to your wishlist">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5 4.2 12.9a4.8 4.8 0 0 1 6.8-6.8l1 1 1-1a4.8 4.8 0 0 1 6.8 6.8Z"/></svg>' +
    '</button>' +
    (opts.compact ? '' : '<div class="pcard__quick"><button class="btn btn--sm btn--block" type="button" data-quick="' + w.slug + '">Quick view</button></div>') +
    '<div class="pcard__body">' +
      '<h3 class="pcard__name"><a href="' + w.url + '">' + w.title + '</a></h3>' +
      '<p class="pcard__spec">' + w.specShort + '</p>' +
      '<p class="pcard__price">' + w.priceText + '</p>' +
    '</div>' +
  '</article>';
}

function mountCards(sel, list, opts) {
  const host = $(sel);
  if (!host) return;
  host.innerHTML = list.map(function (w) { return cardHTML(w, opts); }).join('');
  paintWishlist();
  initCards();
}

/* ---------------------------------------------------------- the cards --
   Two jobs, both owed to the hover gate in site.css section 7.

   WARMING. The gate hides the second photograph with clip-path, and an element
   clipped to nothing has no rendered area, so Chrome's lazy-loader never fires
   for it -- measured, 0 of 16 alt photographs had loaded long after the grid
   was in view, and the first hover then sat waiting on a ~900ms fetch. Marking
   them eager in the markup would fix it by making sixteen extra photographs
   part of the initial load, which is the opposite of what the rest of this
   page spends its effort on. So they stay lazy and are warmed here instead,
   once the card is near the viewport and the browser has nothing better to do.

   LIGHTING. The gate answers the pointer through :hover. It also has to answer
   a keyboard reaching the card, but NOT focus being handed back to a control
   inside the card when a panel closes -- that left the card run with the
   pointer elsewhere. The card's own link is the thing a keyboard arrives at,
   so that is what lights it. */
function initCards() {
  const cards = $$('.pcard');
  if (!cards.length) return;

  const warm = function (card) {
    const alt = $('.is-alt', card);
    if (!alt || alt.dataset.warm) return;
    alt.dataset.warm = '1';
    alt.loading = 'eager';
    /* decode() as well as the fetch: arriving undecoded only moves the stall
       from the network to the first frame that tries to paint it. */
    if (alt.decode) alt.decode().catch(function () {});
  };
  const idle = window.requestIdleCallback || function (fn) { return setTimeout(fn, 200); };

  if (window.IntersectionObserver) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        idle(function () { warm(e.target); });
      });
      /* A generous margin so the warming happens while the card is still
         below the fold, not as it arrives under the pointer. */
    }, { rootMargin: '500px 0px' });
    cards.forEach(function (card) {
      if (card.dataset.cardInit) return;
      io.observe(card);
    });
  } else {
    cards.forEach(warm);
  }

  cards.forEach(function (card) {
    if (card.dataset.cardInit) return;
    card.dataset.cardInit = '1';
    /* focusin on the card rather than focus on the link, so tabbing from the
       wishlist heart to Quick view to the name keeps the card lit the whole
       way through instead of going dark between two of its own controls. */
    card.addEventListener('focusin', function (e) {
      if (restoringFocus) return;
      if (e.target.matches(':focus-visible')) card.classList.add('pcard--lit');
    });
    card.addEventListener('focusout', function (e) {
      /* Only when focus has genuinely left this card. */
      if (!e.relatedTarget || !card.contains(e.relatedTarget)) card.classList.remove('pcard--lit');
    });
  });
}

/* ------------------------------------------------------- wide tables --
   A data table can be wider than the page column. Wrapping it in a focusable
   scroller keeps every cell reachable by finger and by keyboard, instead of
   letting `overflow-x: clip` hide the last columns. */
function wrapTables() {
  $$('main table').forEach(function (t) {
    const parent = t.parentElement;
    if (!parent || parent.classList.contains('table-scroll')) return;
    const cap = t.querySelector('caption');
    const box = document.createElement('div');
    box.className = 'table-scroll';
    box.setAttribute('role', 'region');
    box.setAttribute('tabindex', '0');
    /* a caption can be a paragraph; the region needs a name, not the whole thing */
    const name = cap ? cap.textContent.trim().split(/[.:]/)[0].slice(0, 70) : 'Table';
    box.setAttribute('aria-label', name + ', scrollable');
    parent.insertBefore(box, t);
    box.appendChild(t);
  });
}

/* ------------------------------------------------------------- newsletter */
function initNewsletter() {
  $$('form[data-newsletter]').forEach(function (form) {
    const input = $('input[type=email]', form);
    const msg = $('.field-msg', form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const v = input.value.trim();
      if (!v || !input.validity.valid) {
        input.setAttribute('aria-invalid', 'true');
        if (msg) msg.textContent = 'Please check the email address.';
        input.focus();
        return;
      }
      input.removeAttribute('aria-invalid');
      if (msg) msg.textContent = '';
      form.innerHTML = '<p class="h4">Thank you. We will write when the next reference is ready.</p>' +
        '<p class="field-hint">Demonstration site: nothing was sent and no address was stored.</p>';
    });
  });
}

/* ------------------------------------------------------------------ boot */
function boot() {
  wirePanelTriggers();
  wrapTables();
  initCards();
  initHeader();
  initPageTransition();
  initReveal();
  initSearch();
  initNewsletter();
  paintCart();
  paintWishlist();
  reduceMQ.addEventListener('change', function (e) {
    if (e.matches) $$('.reveal, .reveal-group').forEach(function (el) { el.classList.add('is-in', 'is-done'); });
  });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

/* ------------------------------------------------------- the select menu --
   Stands a listbox in front of a native <select>. The select keeps the value,
   keeps firing change and keeps being validated, so nothing downstream knows
   the difference; it is simply hidden once this runs, and is the whole control
   if this never runs.

   opts.triggerClass  classes for the button, so a caller can make it look like
                      a form field or like a secondary button.
   opts.placeholder   shown when the selected option has an empty value. */
function enhanceSelect(sel, opts) {
  opts = opts || {};
  if (!sel || sel.dataset.selectmenu) return null;
  sel.dataset.selectmenu = '1';

  const host = document.createElement('div');
  host.className = 'selectmenu';
  sel.parentNode.insertBefore(host, sel);
  host.appendChild(sel);

  const id = sel.id || ('sm-' + Math.round(performance.now()));
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'selectmenu__btn ' + (opts.triggerClass || '');
  btn.setAttribute('aria-haspopup', 'listbox');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', id + '-list');
  const lab = sel.labels && sel.labels[0];
  if (lab) { if (!lab.id) lab.id = id + '-label'; btn.setAttribute('aria-labelledby', lab.id + ' ' + id + '-value'); }
  btn.innerHTML = '<span class="selectmenu__value" id="' + id + '-value"></span>'
    + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9.5 12 15.5 18 9.5"/></svg>';

  const list = document.createElement('ul');
  list.className = 'selectmenu__list';
  list.id = id + '-list';
  list.setAttribute('role', 'listbox');
  if (lab) list.setAttribute('aria-labelledby', lab.id);
  list.hidden = true;

  host.append(btn, list);
  sel.hidden = true;
  /* the validator focuses the control it flagged; that has to reach the
     trigger now, or focus lands on a hidden element and goes nowhere */
  sel.focus = function () { btn.focus(); };

  const value = $('.selectmenu__value', btn);
  if (opts.placeholder) value.setAttribute('data-placeholder', opts.placeholder);

  function options() { return $$('[role=option]', list); }

  function build() {
    const html = [];
    const opt = function (o) {
      return '<li class="selectmenu__opt" role="option" tabindex="-1" data-value="' +
             o.value.replace(/"/g, '&quot;') + '" aria-selected="false">' + o.textContent + '</li>';
    };
    [].forEach.call(sel.children, function (node) {
      if (node.tagName === 'OPTGROUP') {
        /* a listbox may contain groups, and a group carries its own options */
        html.push('<li class="selectmenu__group" role="group" aria-label="' +
                  node.label.replace(/"/g, '&quot;') + '">' +
                  '<span class="selectmenu__grouplabel" aria-hidden="true">' + node.label + '</span>' +
                  [].map.call(node.children, opt).join('') + '</li>');
      } else if (node.tagName === 'OPTION') {
        html.push(opt(node));
      }
    });
    list.innerHTML = html.join('');
  }

  function paint() {
    const cur = sel.options[sel.selectedIndex];
    value.textContent = (cur && cur.value) ? cur.textContent : (opts.placeholder ? '' : (cur ? cur.textContent : ''));
    options().forEach(function (li) {
      li.setAttribute('aria-selected', String(li.dataset.value === sel.value));
    });
    const bad = sel.getAttribute('aria-invalid');
    if (bad) btn.setAttribute('aria-invalid', bad); else btn.removeAttribute('aria-invalid');
  }

  function open() {
    if (host.classList.contains('is-open')) return;
    list.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    /* the class lands a frame later so the transition has somewhere to move
       from, and focus waits for it: until then the list is visibility:hidden
       and a hidden element cannot take focus */
    requestAnimationFrame(function () {
      host.classList.add('is-open');
      const on = options().filter(function (l) { return l.getAttribute('aria-selected') === 'true'; })[0];
      const go = on || options()[0];
      if (go) { go.focus(); go.scrollIntoView({ block: 'nearest' }); }
    });
  }

  function close(toButton) {
    if (!host.classList.contains('is-open')) return;
    host.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
    setTimeout(function () { if (!host.classList.contains('is-open')) list.hidden = true; }, 320);
    if (toButton) btn.focus();
  }

  function choose(li) {
    if (!li) return;
    sel.value = li.dataset.value;
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    paint();
    close(true);
  }

  btn.addEventListener('click', function () {
    host.classList.contains('is-open') ? close(true) : open();
  });
  list.addEventListener('click', function (e) {
    const li = e.target.closest('[role=option]');
    if (li) choose(li);
  });

  let typed = '', typeTimer = 0;
  list.addEventListener('keydown', function (e) {
    const opts2 = options();
    const i = opts2.indexOf(document.activeElement);
    if (e.key === 'Escape') { e.preventDefault(); close(true); return; }
    if (e.key === 'Tab') { close(false); return; }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(opts2[i]); return; }
    let next = -1;
    if (e.key === 'ArrowDown') next = (i + 1) % opts2.length;
    else if (e.key === 'ArrowUp') next = (i - 1 + opts2.length) % opts2.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = opts2.length - 1;
    else if (e.key.length === 1 && /\S/.test(e.key)) {
      /* type-ahead: a list of forty countries is unusable without it */
      clearTimeout(typeTimer);
      typed += e.key.toLowerCase();
      typeTimer = setTimeout(function () { typed = ''; }, 700);
      for (let n = 0; n < opts2.length; n++) {
        if (opts2[n].textContent.toLowerCase().indexOf(typed) === 0) { next = n; break; }
      }
    }
    if (next < 0) return;
    e.preventDefault();
    opts2[next].focus();
    opts2[next].scrollIntoView({ block: 'nearest' });
  });

  document.addEventListener('pointerdown', function (e) {
    if (!host.contains(e.target)) close(false);
  });

  /* the value and the invalid flag can both change from outside */
  sel.addEventListener('change', paint);
  new MutationObserver(paint).observe(sel, { attributes: true, attributeFilter: ['aria-invalid'] });

  build();
  paint();
  return { host: host, button: btn, refresh: function () { build(); paint(); } };
}

window.AeternaUI = {
  cardHTML: cardHTML,
  mountCards: mountCards,
  addToCart: addToCart,
  toggleWishlist: toggleWishlist,
  paintWishlist: paintWishlist,
  toast: toast,
  openPanelEl: openPanelEl,
  closePanel: closePanel,
  isWished: function (slug) { return wishlist.indexOf(slug) >= 0; },
  enhanceSelect: enhanceSelect,
  $: $, $$: $$,
};

/* The head arms a failsafe that strips .js if this file never arrives. It is
   armed before we are, so on a slow connection it fires while site.js is still
   in flight, and nothing used to put the class back: the page then sat in the
   no-script layout for good, filters as a full-width block and every js-only
   control gone. AeternaUI exists now, so disarm it and assert the class,
   whichever way the race went. */
clearTimeout(window.__aeternaBoot);
document.documentElement.classList.add('js');
})();

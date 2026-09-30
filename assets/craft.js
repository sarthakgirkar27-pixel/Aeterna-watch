/* AETERNA — craftsmanship page only. Three jobs:
     1. the scroll-scrubbed assembly film (seven beats, 700svh, gated)
     2. the chapter rail, drawn over the film and only there
     3. Wind it: press and hold the crown
   plus the sticky index for the eight components. Everything else on the page
   is static HTML plus site.js, and the page is complete with none of this. */
(function () {
'use strict';

const $ = window.AeternaUI.$;
const $$ = window.AeternaUI.$$;
const clamp = function (v, lo, hi) { return Math.min(hi, Math.max(lo, v)); };
const smoothstep = function (p, e0, e1) { const t = clamp((p - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ------------------------------------------------------- assembly film --
   The engineering is the home hero's, beat for beat: stream the file as a Blob
   (hosts without HTTP Range break plain seeking), ease the displayed time in a
   rAF loop that rests, never issue overlapping seeks, and write to the DOM only
   when a value actually changed. Only the band count differs. */
(function film() {
  const track = $('#film-track');
  const stage = $('#film-stage');
  const video = $('#film-video');
  const poster = $('.film__poster');
  const dockHost = $('#film-dock');
  if (!track || !stage || !video) return;

  const VIDEO_URL = 'assets/hero-scrub.mp4';
  const VIDEO_BYTES = 3400987;
  const POSTER_URL = 'assets/hero-poster.jpg';

  const bands = $$('.film__band').map(function (el, i, all) {
    return {
      el: el,
      a: parseFloat(el.getAttribute('data-a')),
      b: parseFloat(el.getAttribute('data-b')),
      ramp: parseFloat(el.getAttribute('data-ramp')) || 0.06,
      first: i === 0,
      last: i === all.length - 1,
      op: -1, k: -1, on: null,
    };
  });

  function progress() {
    const range = track.offsetHeight - window.innerHeight;
    if (range <= 0) return 0;
    return clamp(-track.getBoundingClientRect().top / range, 0, 1);
  }

  /* -- gated seeks: one in flight, newest target wins, errors never deadlock */
  let seekBusy = false, pendingTime = null;
  function requestSeek(t) {
    if (!video.duration) return;
    if (seekBusy) { pendingTime = t; return; }
    seekBusy = true;
    video.currentTime = t;
  }
  video.addEventListener('seeked', function () {
    seekBusy = false;
    if (pendingTime !== null) { const t = pendingTime; pendingTime = null; requestSeek(t); }
  });
  video.addEventListener('error', function () { seekBusy = false; pendingTime = null; failVideo(); });

  /* -- the drive loop: frame-rate independent easing, rests when converged */
  let target = 0, shown = 0, rafId = null, lastTick = 0, onScreen = true, armed = false;
  function tick(now) {
    const dt = Math.min(100, now - (lastTick || now));
    lastTick = now;
    shown += (target - shown) * (1 - Math.pow(1 - 0.16, dt / 16.667));
    if (Math.abs(target - shown) < 0.0005) { shown = target; rafId = null; lastTick = 0; }
    else rafId = requestAnimationFrame(tick);
    if (video.duration) requestSeek(shown * video.duration);
    paint(shown);
  }
  function onScroll() {
    target = progress();
    if (rafId === null && onScreen) rafId = requestAnimationFrame(tick);
  }
  /* Off screen the loop stops. The dock leaves the tab order only once the film
     is above the reader: tabbing forward into it is fine, tabbing backwards up
     into a film already passed is not. */
  new IntersectionObserver(function (es) {
    onScreen = es[0].isIntersecting;
    if (dockHost) dockHost.toggleAttribute('inert', track.getBoundingClientRect().bottom <= 0);
    /* The rail arrives when the film does, not when the page loads. Mounting
       happens at arm(), which runs while the reader is still on the hero, so
       revealing there spends the whole entrance a screenful above the fold. */
    if (onScreen && rail) rail.reveal();
    if (onScreen && armed) onScroll();
  }).observe(track);

  /* -- beat one assembles once on load, then hands over to the scroll */
  let loadK = 0, loadStart = null;
  function loadRamp(now) {
    if (loadStart === null) loadStart = now;
    const t = clamp((now - loadStart - 260) / 1300, 0, 1);
    loadK = t * t * (3 - 2 * t);
    paint(shown);
    if (loadK < 1) requestAnimationFrame(loadRamp);
  }

  let cuePast = null, liveBeat = -1;
  function paint(p) {
    let live = 0;
    for (let i = 0; i < bands.length; i++) {
      const b = bands[i];
      const len = b.b - b.a;
      const f = Math.min(0.05, len / 3);
      const op = (b.first ? 1 : smoothstep(p, b.a, b.a + f)) * (b.last ? 1 : 1 - smoothstep(p, b.b - f, b.b));
      let k = clamp((p - b.a) / b.ramp, 0, 1);
      if (b.first) k = Math.max(k, loadK);
      if (Math.abs(op - b.op) > 0.004 || (op === 0) !== (b.op === 0) || (op === 1) !== (b.op === 1)) {
        b.op = op; b.el.style.opacity = op.toFixed(3);
      }
      const on = op > 0.001;
      if (on !== b.on) { b.on = on; b.el.classList.toggle('is-on', on); }
      if (Math.abs(k - b.k) > 0.008 || (k === 1) !== (b.k === 1) || (k === 0) !== (b.k === 0)) {
        b.k = k; b.el.style.setProperty('--k', k.toFixed(3));
      }
      if (p >= b.a) live = i;
    }
    if (rail) rail.paint(p);
    if (live !== liveBeat) { liveBeat = live; if (markRail) markRail(live); }
    const past = p > 0.04;
    if (past !== cuePast) { cuePast = past; stage.classList.toggle('is-past', past); }
  }

  /* -- the streamed Blob, behind an honest ring, poster first */
  let started = false, failed = false, inited = false;
  function initOnce() {
    if (inited) return;
    inited = true;
    if (poster) poster.style.backgroundImage = "url('" + POSTER_URL + "')";
    const start = function () { if (started) return; started = true; load().catch(failVideo); };
    const img = new Image();
    img.onload = start; img.onerror = start; img.src = POSTER_URL;
    setTimeout(start, 4000);
    requestAnimationFrame(loadRamp);
  }
  async function load() {
    const ring = $('.film__ring circle');
    const ctrl = new AbortController();
    let watchdog = setTimeout(function () { ctrl.abort(); }, 20000);
    const res = await fetch(VIDEO_URL, { priority: 'low', signal: ctrl.signal });
    if (!res.ok || !res.body) throw new Error('video ' + res.status);
    const total = Number(res.headers.get('Content-Length')) || VIDEO_BYTES;
    const reader = res.body.getReader();
    const chunks = [];
    let got = 0, lastRing = 0;
    for (;;) {
      const r = await reader.read();
      if (r.done) break;
      clearTimeout(watchdog);
      watchdog = setTimeout(function () { ctrl.abort(); }, 20000);
      chunks.push(r.value); got += r.value.length;
      const frac = Math.min(1, got / total);
      const now = performance.now();
      if (ring && (now - lastRing > 100 || frac === 1)) {
        lastRing = now;
        ring.style.setProperty('--ld', Math.round(126 * (1 - frac)));
      }
    }
    clearTimeout(watchdog);
    if (ring) ring.style.setProperty('--ld', 0);
    video.src = URL.createObjectURL(new Blob(chunks, { type: 'video/mp4' }));
    video.load();
    video.addEventListener('canplay', function () {
      requestSeek(progress() * video.duration);
      stage.classList.add('is-ready');
    }, { once: true });
  }
  /* The film is never load bearing: without it the poster stays, the seven
     beats still scrub over it, and the chapter list below is the same words. */
  function failVideo() {
    if (failed) return;
    failed = true;
    stage.classList.add('is-failed');
    const ring = $('.film__ring');
    if (ring) ring.remove();
  }

  /* --------------------------------------------- the chapter rail ------
     Seven medallions on a lit rail, one per beat of the film, built here
     rather than mounted from the vendored dock. What that buys: labels and
     numbers under the artwork, a rail that passes behind them, a tick on each
     cell division and a roundel at each end -- none of which the dock's row of
     pills could hold, and all of which its controller would have fought, since
     it wrote width, height and transform onto every item from a spring on
     every frame.

     What it costs is the proximity magnification. That was a pointer readout:
     it said where your hand was, not where you were in the film, and on a
     scrubbed film it competed with the one thing this bar exists to report.
     What replaces it is a 2px lift and a halo on the medallion nearest the
     pointer -- one number per chapter, both compositor properties -- and the
     rail head itself, which is a continuous readout the spring could never
     give because the spring was never driven by the scroll. */
  const RAIL_ITEMS = [
    /* These names are the page's own chapter list, word for word: see the
       .chapter__num / <h3> pairs in .film__static. The dock they replace said
       CASE over the beat whose caption reads "Twenty-six screws hold it
       together", and skipped the movement and the crown entirely. */
    { id: 'screws',   label: 'SCREWS',   beat: 0 },
    { id: 'wheels',   label: 'WHEELS',   beat: 1 },
    { id: 'movement', label: 'MOVEMENT', beat: 2 },
    { id: 'crown',    label: 'CROWN',    beat: 3 },
    { id: 'dial',     label: 'DIAL',     beat: 4 },
    { id: 'bezel',    label: 'BEZEL',    beat: 5 },
    { id: 'crystal',  label: 'CRYSTAL',  beat: 6 },
  ];

  /* Seven drawings, one per part, at 32 units square and read at 28px. Drawn
     at a true hairline: stroke-width 1.1 over 32 units shown at 28px is 0.96
     device pixels, the weight of every other rule on the page. The gear teeth
     and the screw, tick and flute spacings are computed geometry rather than
     eyeballed -- a wheel with uneven teeth is the one thing a watch house
     cannot ship. */
  const RAIL_ART = {
    /* three bridge screws falling, slot and all. Not a case: the caption under
       this beat counts screws. The slot stops short of the rim on each, because
       a slot drawn straight through turns the head into a button. */
    screws:
      '<path d="M16 5.4a4.2 4.2 0 1 0 .01 0Z"/><path d="M13.9 5.4h4.2"/>' +
      '<path d="M14.9 9.6h2.2l-.5 7.4h-1.2Z"/>' +
      '<path d="M7.4 15.2a3.1 3.1 0 1 0 .01 0Z"/><path d="M5.85 15.2h3.1"/>' +
      '<path d="M6.6 18.3h1.6l-.35 5.4h-.9Z"/>' +
      '<path d="M24.3 18.1a2.6 2.6 0 1 0 .01 0Z"/><path d="M23 18.1h2.6"/>' +
      '<path d="M23.55 20.7h1.5l-.3 4.6h-.9Z"/>',
    /* a ten tooth wheel driving an eight tooth pinion, on pitch. The teeth are
       individual radial strokes off a clean rim rather than one scalloped
       outline, which turns to mush at 28px. */
    wheels:
      '<circle cx="12.6" cy="13.4" r="6.1"/><circle cx="12.6" cy="13.4" r="1.7"/>' +
      '<path d="M12.6 7.3V5.1M15.65 8.12l1.1-1.9M17.88 10.35l1.9-1.1M18.7 13.4h2.2M17.88 16.45l1.9 1.1' +
      'M15.65 18.68l1.1 1.9M12.6 19.5v2.2M9.55 18.68l-1.1 1.9M7.32 16.45l-1.9 1.1M6.5 13.4H4.3' +
      'M7.32 10.35l-1.9-1.1M9.55 8.12l-1.1-1.9"/>' +
      '<path d="M12.6 9.9v-.9M15.1 11.3l.78-.45M15.1 15.5l.78.45M12.6 16.9v.9M10.1 15.5l-.78.45M10.1 11.3l-.78-.45"/>' +
      '<circle cx="21.6" cy="20.6" r="3.5"/><circle cx="21.6" cy="20.6" r="1"/>' +
      '<path d="M21.6 17.1v-1.5M24.07 19.13l1.3-.75M24.07 22.07l1.3.75M21.6 24.1v1.5' +
      'M19.13 22.07l-1.3.75M19.13 19.13l-1.3-.75"/>',
    /* the movement: a bridge plate, jewelled. The one silhouette in the set
       that is not a circle, which is what makes it findable at 28px. */
    movement:
      '<path d="M8.6 9.2h9.2c2.6 0 4.2 1.3 5.1 3.3l1.6 3.6c.6 1.4.2 2.9-1 3.8l-2.6 1.9' +
      'c-1 .7-2.1 1-3.3 1H9.4c-1.5 0-2.7-1.1-2.9-2.6l-.9-7.1C5.4 11.3 6.7 9.2 8.6 9.2Z"/>' +
      '<circle cx="11.2" cy="13.4" r="1.35"/><circle cx="18.4" cy="14.6" r="1.35"/>' +
      '<circle cx="13.6" cy="19.4" r="1.35"/>' +
      '<path d="M8.6 16.6h3.2M20.4 18.8l2.2-1.1"/>',
    /* the crown, fluted, on its stem, against the flank of the case */
    crown:
      '<path d="M5.6 7.4c1.7 4.2 1.7 13 0 17.2"/>' +
      '<path d="M8.9 14.6h4.7v2.8H8.9Z"/>' +
      '<path d="M16.1 10.6h6.2c1.5 0 2.7 1.2 2.7 2.7v5.4c0 1.5-1.2 2.7-2.7 2.7h-6.2' +
      'c-1.4 0-2.5-1.1-2.5-2.5v-5.8c0-1.4 1.1-2.5 2.5-2.5Z"/>' +
      '<path d="M17.1 11.1v9.8M18.9 10.9v10.2M20.7 10.9v10.2M22.5 11.1v9.8"/>',
    /* the dial, twelve markers, hands at ten past ten */
    dial:
      '<circle cx="16" cy="16" r="11.4"/>' +
      '<path d="M16 5.8L16 8M21.1 7.17L20.45 8.29M24.83 10.9L23.71 11.55M26.2 16L24 16' +
      'M24.83 21.1L23.71 20.45M21.1 24.83L20.45 23.71M16 26.2L16 24M10.9 24.83L11.55 23.71' +
      'M7.17 21.1L8.29 20.45M5.8 16L8 16M7.17 10.9L8.29 11.55M10.9 7.17L11.55 8.29"/>' +
      '<path d="M16 16L11.32 13.3M16 16L22.75 12.1M16 16L17.1 17.9"/>' +
      '<circle cx="16" cy="16" r="1"/>',
    /* the bezel: two rings, the six screws the copy counts, a pip at twelve */
    bezel:
      '<circle cx="16" cy="16" r="11.4"/><circle cx="16" cy="16" r="7.8"/>' +
      '<circle cx="20.8" cy="7.69" r="1.45"/><circle cx="25.6" cy="16" r="1.45"/>' +
      '<circle cx="20.8" cy="24.31" r="1.45"/><circle cx="11.2" cy="24.31" r="1.45"/>' +
      '<circle cx="6.4" cy="16" r="1.45"/><circle cx="11.2" cy="7.69" r="1.45"/>' +
      '<path d="M19.64 7.69L21.96 7.69M25.02 15L26.18 17M21.38 23.31L20.22 25.32' +
      'M12.36 24.31L10.04 24.31M6.98 17L5.82 15M10.62 8.69L11.78 6.68"/>' +
      '<path d="M16 6.1L17.55 9.1H14.45Z"/>',
    /* sapphire in profile, seated in its bezel, with the polish on it */
    crystal:
      '<path d="M5.4 19.4C5.4 11.6 9.8 7.2 16 7.2C22.2 7.2 26.6 11.6 26.6 19.4"/>' +
      '<path d="M4.2 19.4H27.8"/>' +
      '<path d="M6.4 19.4V22.6C6.4 23.4 7 24 7.8 24H24.2C25 24 25.6 23.4 25.6 22.6V19.4"/>' +
      '<path d="M9.6 17.6C10.5 13.6 12.9 10.9 16.4 10.3"/>',
  };

  /* A small dial at each end of the capsule. Twelve indices and two hands, so
     it reads as a dial at 24px rather than as a generic gauge -- and the hand
     on the far one is live: it sweeps 240 degrees across the film, which turns
     an ornament into a power reserve. */
  function roundel(live) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="10.4"/>' +
      '<path d="M12 2.4L12 4.4M16.8 3.69L16.25 4.64M20.31 7.2L19.36 7.75M21.6 12L19.6 12' +
      'M20.31 16.8L19.36 16.25M16.8 20.31L16.25 19.36M12 21.6L12 19.6M7.2 20.31L7.75 19.36' +
      'M3.69 16.8L4.64 16.25M2.4 12L4.4 12M3.69 7.2L4.64 7.75M7.2 3.69L7.75 4.64"/>' +
      (live
        ? '<path class="rail__hand" d="M12 12L12 4.9"/>'
        : '<path d="M12 12L12 6.4" transform="rotate(-38 12 12)"/>' +
          '<path d="M12 12L15.6 12" transform="rotate(-38 12 12)"/>') +
      '<circle cx="12" cy="12" r=".9"/></svg>';
  }

  /* The tapered end, 78 wide by the capsule's height. 78 because a point needs
     room: taper a 96px bar over 30px and the flanks are near vertical, which is
     a rounded rectangle wearing a hat. One path serves twice -- stroked for the
     hairline, filled for the frost's mask -- so the outline and the glass can
     never drift apart. It is left open along the seam with the middle: a fill
     closes it there, a stroke does not draw it. */
  const CAP_W = 78;
  function capPath(h) {
    const m = h / 2, nose = 2.4, sh = +(h * 0.1875).toFixed(1);
    return 'M' + CAP_W + ' .5H44C26 .5 17 5 11 ' + sh +
      'L3.2 ' + (m - nose) + 'A' + nose + ' ' + nose + ' 0 0 0 3.2 ' + (m + nose) +
      'L11 ' + (h - sh) + 'C17 ' + (h - 5) + ' 26 ' + (h - .5) + ' 44 ' + (h - .5) + 'H' + CAP_W;
  }
  function capMask(h, flip) {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + CAP_W + ' ' + h + '">' +
      '<path d="' + capPath(h) + 'Z" fill="#000"' +
      (flip ? ' transform="translate(' + CAP_W + ',0) scale(-1,1)"' : '') + '/></svg>';
    return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
  }

  const fineMQ = window.matchMedia('(hover: hover) and (pointer: fine)');
  let rail = null, markRail = null, railMarked = -1;

  function goToBeat(index) {
    const b = bands[index];
    if (!b) return;
    const range = track.offsetHeight - window.innerHeight;
    if (range <= 0) return;
    const top = track.getBoundingClientRect().top + window.scrollY;
    /* land a little inside the beat, past its fade, so the caption is already up */
    window.scrollTo({ top: Math.round(top + (b.a + 0.045) * range), behavior: reduceMQ.matches ? 'auto' : 'smooth' });
  }

  function mountRail() {
    if (rail || !dockHost || !fineMQ.matches) return;

    const nav = document.createElement('div');
    nav.className = 'rail-nav';
    /* A toolbar, not a list of seven tab stops dropped into the middle of a
       700svh film: one stop to reach it, arrow keys to move inside it. */
    nav.setAttribute('role', 'toolbar');
    nav.setAttribute('aria-label', 'Film chapters');
    nav.setAttribute('aria-orientation', 'horizontal');

    let html = '<div class="rail__shell" aria-hidden="true">' +
      '<i class="rail__frost"></i>' +
      '<svg class="rail__cap rail__cap--s" aria-hidden="true"><path/></svg>' +
      '<i class="rail__mid"></i>' +
      '<svg class="rail__cap rail__cap--e" aria-hidden="true"><path/></svg>' +
      '</div>' +
      '<div class="rail__wire" aria-hidden="true">' +
      '<i class="rail__base"></i><i class="rail__glow"></i><i class="rail__hot"></i><i class="rail__tip"></i>' +
      '</div><div class="rail__row">' +
      '<span class="rail__roundel rail__roundel--s">' + roundel(false) + '</span>';
    RAIL_ITEMS.forEach(function (it, i) {
      const n = ('0' + (i + 1)).slice(-2);
      const word = it.label.charAt(0) + it.label.slice(1).toLowerCase();
      /* The number under the label is for the eye; the accessible name carries
         the word, which is what voice control types against. */
      html += '<button type="button" class="rail__item" data-beat="' + it.beat + '"' +
        ' tabindex="' + (i === 0 ? '0' : '-1') + '"' +
        ' aria-label="' + word + ', chapter ' + (i + 1) + ' of ' + RAIL_ITEMS.length + '">' +
        '<span class="rail__disc"><svg class="rail__art" viewBox="0 0 32 32" aria-hidden="true">' +
        RAIL_ART[it.id] + '</svg></span>' +
        '<span class="rail__label">' + it.label + '</span>' +
        '<span class="rail__n" aria-hidden="true">' + n + '</span></button>';
    });
    html += '<span class="rail__roundel rail__roundel--e">' + roundel(true) + '</span></div>';
    nav.innerHTML = html;
    dockHost.appendChild(nav);

    const items = Array.prototype.slice.call(nav.querySelectorAll('.rail__item'));
    const discs = items.map(function (b) { return b.querySelector('.rail__disc'); });
    /* The four elements that READ --rail-p, written individually. It is
       declared inherits:false in craft.css so a write cannot invalidate the
       rail's whole subtree on every painted frame -- which also means writing
       it on their parent gives them the initial value and nothing else. */
    const heads = Array.prototype.slice.call(
      nav.querySelectorAll('.rail__hot,.rail__glow,.rail__tip,.rail__hand'));
    const caps = Array.prototype.slice.call(nav.querySelectorAll('.rail__cap'));

    /* -- the measured lengths, and the anchor per chapter ------------------
       Hard-coding these would mean hard-coding the webfont's metrics: the
       labels set the row's height, and a font that arrives after first paint
       moves the line the rail is drawn on. Measured on mount, on resize, and
       once more when the fonts are in. */
    const anchors = [];
    let centres = [], railLen = 0, shellH = 0;

    /* The capsule steps down a height at the 1080px breakpoint, and the ends
       are drawn rather than stretched, so they are redrawn when it does. */
    function setShell(h) {
      if (h === shellH || !h) return;
      shellH = h;
      const d = capPath(h);
      caps.forEach(function (svg) {
        svg.setAttribute('viewBox', '0 0 ' + CAP_W + ' ' + h);
        svg.firstChild.setAttribute('d', d);
      });
      nav.style.setProperty('--cap-s', capMask(h, false));
      nav.style.setProperty('--cap-e', capMask(h, true));
    }

    function measure() {
      const navBox = nav.getBoundingClientRect();
      if (!navBox.width) return;
      setShell(Math.round(navBox.height));
      const end = nav.querySelector('.rail__roundel--e').getBoundingClientRect();
      centres = discs.map(function (d) {
        const r = d.getBoundingClientRect();
        return r.left - navBox.left + r.width / 2;
      });
      const x0 = centres[0];
      const y0 = discs[0].getBoundingClientRect();
      railLen = (end.left - navBox.left + end.width / 2) - x0;
      if (railLen <= 0) return;
      anchors.length = 0;
      for (let i = 0; i < centres.length; i++) anchors.push((centres[i] - x0) / railLen);
      anchors.push(1);                     /* the far roundel: where the outro lands */
      nav.style.setProperty('--rail-x0', x0.toFixed(2) + 'px');
      nav.style.setProperty('--rail-len', railLen.toFixed(2) + 'px');
      nav.style.setProperty('--rail-y', (y0.top - navBox.top + y0.height / 2).toFixed(2) + 'px');
      /* The live segment's ORIGIN is measured too, not only its head: without
         this the lit run keeps a stale start across any layout change. */
      if (railMarked >= 0 && anchors[railMarked] !== undefined) {
        nav.style.setProperty('--rail-a', anchors[railMarked].toFixed(4));
      }
      paintRail(lastP, true);
    }

    /* -- where the light has reached --------------------------------------
       The medallions are evenly spaced and the beats are not quite, so the
       film's progress is remapped piecewise: inside a beat the head travels
       from that chapter's medallion to the next, and over the outro -- the
       crystal's beat runs to the end of the scroll -- it carries on to the far
       roundel. The head therefore sits exactly on a medallion at the moment
       that chapter begins, which is the whole point of a scale.

       --rail-p is written on the three elements that read it, never on the
       nav: it is declared non-inheriting in craft.css, and writing it at the
       top of a ~105 node subtree on every painted frame of a scrubbing film
       is the one thing this design must not do. */
    const BEATS = RAIL_ITEMS.map(function (it) { return bands[it.beat] ? bands[it.beat].a : 0; });
    let lastP = 0, lastU = -1;
    function paintRail(p, force) {
      lastP = p;
      if (!anchors.length) return;
      let i = 0;
      while (i < BEATS.length - 1 && p >= BEATS[i + 1]) i++;
      const a0 = BEATS[i], a1 = (i + 1 < BEATS.length) ? BEATS[i + 1] : 1;
      const t = a1 > a0 ? clamp((p - a0) / (a1 - a0), 0, 1) : 0;
      const u = anchors[i] + (anchors[i + 1] - anchors[i]) * t;
      if (!force && Math.abs(u - lastU) < 0.0008) return;
      lastU = u;
      const v = u.toFixed(4);
      heads.forEach(function (h) { h.style.setProperty('--rail-p', v); });
    }

    /* -- the chapter you are in -------------------------------------------
       Nearest rather than last-passed. With one medallion per beat that is an
       identity, but the table above is the authority on which beats are
       chapters, and dropping one must not silently leave the rail a beat
       behind. aria-current, not aria-pressed: these navigate, they do not
       toggle. --rail-a is where the live segment starts; it steps, and the
       transition on .rail__hot carries it. */
    markRail = function (beat) {
      let at = 0, best = Infinity;
      for (let i = 0; i < RAIL_ITEMS.length; i++) {
        const d = Math.abs(beat - RAIL_ITEMS[i].beat);
        if (d < best) { best = d; at = i; }
      }
      if (at === railMarked) return;
      /* Only latch once there is an anchor to go with it: measure() can bail
         before anchors exist, and a latched index with no origin leaves the
         lit run starting from the wrong chapter until the next change. */
      if (!anchors.length) return;
      railMarked = at;
      items.forEach(function (btn, i) {
        if (i === at) btn.setAttribute('aria-current', 'true');
        else btn.removeAttribute('aria-current');
      });
      nav.style.setProperty('--rail-a', anchors[at].toFixed(4));
    };

    /* -- moving through it ------------------------------------------------- */
    items.forEach(function (btn, i) {
      btn.addEventListener('click', function () { goToBeat(parseInt(btn.dataset.beat, 10)); });
      btn.addEventListener('keydown', function (e) {
        const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1
          : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1
            : e.key === 'Home' ? -items.length : e.key === 'End' ? items.length : 0;
        if (!step) return;
        e.preventDefault();
        const to = Math.min(Math.max(i + step, 0), items.length - 1);
        items.forEach(function (b, n) { b.setAttribute('tabindex', n === to ? '0' : '-1'); });
        items[to].focus();
      });
    });

    /* -- what is left of the proximity spring ------------------------------
       One number per chapter, from a smoothstepped distance falloff, driving a
       2px lift and a halo ring -- both compositor properties. The vendor wrote
       width, height and transform on every item every frame, and a bar whose
       cells resize is a bar whose tick marks move. This reads the pointer
       without moving the scale. Focus drives it too, so a keyboard gets the
       same affordance a pointer does. */
    let px = -1, moveRaf = null;
    function setNear(i, v) { discs[i].style.setProperty('--near', v); }
    function applyNear() {
      moveRaf = null;
      const navBox = nav.getBoundingClientRect();
      const x = px - navBox.left;
      for (let i = 0; i < discs.length; i++) {
        const d = Math.abs(x - centres[i]) / 132;
        setNear(i, (d >= 1 ? 0 : smoothstep(1 - d, 0, 1)).toFixed(3));
      }
    }
    function clearNear() {
      if (moveRaf) { cancelAnimationFrame(moveRaf); moveRaf = null; }
      discs.forEach(function (d) { d.style.setProperty('--near', '0'); });
    }
    if (fineMQ.matches && !reduceMQ.matches) {
      nav.addEventListener('pointermove', function (e) {
        if (e.pointerType === 'touch') return;
        px = e.clientX;
        if (moveRaf === null) moveRaf = requestAnimationFrame(applyNear);
      });
      nav.addEventListener('pointerleave', clearNear);
    }
    nav.addEventListener('focusin', function (e) {
      const i = items.indexOf(e.target);
      if (i >= 0) { clearNear(); setNear(i, '1'); }
    });
    nav.addEventListener('focusout', function (e) {
      if (!nav.contains(e.relatedTarget)) clearNear();
    });

    rail = { paint: paintRail, reveal: function () { dockHost.classList.add('is-in'); } };

    measure();
    markRail(liveBeat < 0 ? 0 : liveBeat);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    let sizeRaf = null;
    window.addEventListener('resize', function () {
      if (sizeRaf === null) sizeRaf = requestAnimationFrame(function () { sizeRaf = null; measure(); });
    }, { passive: true });
  }
  fineMQ.addEventListener('change', function () { if (armed) mountRail(); });

  /* -- the five gates, character for character identical to craft.css, kept
        live so a rotation or a preference flip re-arms or disarms cleanly */
  const GATES = [
    '(max-width: 820px)',
    '(orientation: portrait) and (max-width: 1024px)',
    '(orientation: portrait) and (pointer: coarse)',
    '(orientation: landscape) and (pointer: coarse) and (max-height: 560px)',
    '(prefers-reduced-motion: reduce)'
  ];
  function arm() {
    if (armed) return;
    armed = true;
    initOnce();
    mountRail();
    window.addEventListener('scroll', onScroll, { passive: true });
    bands.forEach(function (b) { b.op = -1; b.k = -1; b.on = null; });
    paint(progress());
    onScroll();
  }
  function disarm() {
    if (!armed) return;
    armed = false;
    window.removeEventListener('scroll', onScroll);
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; lastTick = 0; }
  }
  function applyMode() {
    if (GATES.some(function (q) { return window.matchMedia(q).matches; })) disarm();
    else arm();
  }
  const MQLS = GATES.map(function (q) { return window.matchMedia(q); });
  MQLS.forEach(function (m) { m.addEventListener('change', applyMode); });
  applyMode();

  /* Pause every loop while the tab is hidden. */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) disarm(); else applyMode();
  });
})();

/* ------------------------------------------------------------ wind it --
   Press and hold the crown: progress builds, letting go early eases it back,
   completing it brings up the movement's four numbers in sequence. Mouse,
   finger and keyboard all drive the same two calls. */
(function windIt() {
  const wind = $('#wind');
  const crown = $('.crown', wind || document);
  const status = $('#wind-status');
  const label = $('.crown__label', wind || document);
  if (!wind || !crown || !status || !label) return;

  /* Winding rates, not CSS: 2.6 s of holding fills it, and a release drains it
     in half that. Both are the feel of the control, measured on the bench. */
  const RATE_UP = 1 / 2600, RATE_DOWN = 1 / 1300;
  let p = 0, holding = false, wound = false, raf = null, last = 0, pinned = false;
  let lastText = '', lastAt = 0;

  function setStatus(text, force) {
    const now = performance.now();
    if (!force && now - lastAt < 100) return;
    if (text === lastText) return;
    lastText = text; lastAt = now;
    status.textContent = text;
  }
  function complete() {
    wound = true;
    wind.classList.add('is-wound');
    label.textContent = 'Fully wound';
    setStatus('Power reserve · 72 h', true);
    setTimeout(function () { wind.classList.add('is-settled'); }, 1500);
  }
  function loop(now) {
    const dt = Math.min(64, now - (last || now));
    last = now;
    p = clamp(p + dt * (holding ? RATE_UP : -RATE_DOWN), 0, 1);
    crown.style.setProperty('--p', p.toFixed(3));
    if (p >= 1 && !wound) { complete(); raf = null; last = 0; return; }
    if (!holding && p <= 0) { raf = null; last = 0; setStatus('', true); return; }
    setStatus('Power reserve · ' + Math.round(p * 72) + ' h');
    raf = requestAnimationFrame(loop);
  }
  function startHold() {
    if (wound || holding) return;
    holding = true;
    crown.classList.add('is-holding');
    label.textContent = 'Winding';
    if (raf === null) raf = requestAnimationFrame(loop);
  }
  function endHold() {
    if (!holding) return;
    holding = false;
    crown.classList.remove('is-holding');
    if (!wound) label.textContent = 'Hold the crown';
  }
  /* preventDefault stops the text selection and the drag, and with it the
     focus a mouse press would otherwise take: a ring belongs to the keyboard. */
  crown.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    try { crown.setPointerCapture(e.pointerId); } catch (_) { /* older pens */ }
    startHold();
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (t) {
    crown.addEventListener(t, endHold);
  });
  crown.addEventListener('keydown', function (e) {
    if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); startHold(); }
  });
  crown.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') endHold(); });
  crown.addEventListener('blur', endHold);
  crown.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  /* Reduced motion gets the finished state at once, and gets it back if the
     preference flips the other way inside the same visit. */
  function pin() {
    if (wound) return;
    p = 1;
    crown.style.setProperty('--p', 1);
    complete();
    wind.classList.add('is-settled');
    pinned = true;
  }
  function unpin() {
    if (!pinned) return;
    pinned = false; wound = false; p = 0;
    wind.classList.remove('is-wound', 'is-settled');
    crown.style.setProperty('--p', 0);
    label.textContent = 'Hold the crown';
    setStatus('', true);
  }
  reduceMQ.addEventListener('change', function (e) { if (e.matches) pin(); else unpin(); });
  if (reduceMQ.matches) pin();
})();

/* --------------------------------------------------- the eight parts --
   The sticky index marks the row the reader is in. One observer, no per-frame
   scroll handler, and the anchors work with none of it. */
(function partsIndex() {
  const links = $$('.parts__index a');
  const rows = $$('.parts__list .part-row');
  if (!links.length || !rows.length) return;

  let current = -1;
  function mark(i) {
    if (i === current) return;
    current = i;
    links.forEach(function (a, n) {
      if (n === i) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    /* The row is marked too, not just the index entry: the callout on its
       photograph draws itself from that class, so the leader arrives with the
       row rather than being on from the start. */
    rows.forEach(function (row, n) { row.classList.toggle('is-live', n === i); });
  }
  const io = new IntersectionObserver(function () {
    const line = window.innerHeight * 0.38;
    let at = -1;
    rows.forEach(function (row, n) {
      if (row.getBoundingClientRect().top <= line) at = n;
    });
    if (at >= 0) mark(at);
  }, { threshold: [0, 0.2, 0.5, 0.8, 1], rootMargin: '-10% 0px -40% 0px' });
  rows.forEach(function (row) { io.observe(row); });
})();
})();

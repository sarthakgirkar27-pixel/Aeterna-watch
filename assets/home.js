/* AETERNA — home page only. Two jobs:
     1. the scroll-scrubbed hero film (two beats, 250vh, gated to capable screens)
     2. the sticky brand-story plate
   Everything else on the page is static HTML plus site.js. The twelve
   references are static markup now, per the SEO rule in DESIGN-SYSTEM.md:
   they used to be injected here, which left an empty div for a crawler. */
(function () {
'use strict';

const $ = window.AeternaUI.$;
const $$ = window.AeternaUI.$$;
const clamp = function (v, lo, hi) { return Math.min(hi, Math.max(lo, v)); };
const smoothstep = function (p, e0, e1) { const t = clamp((p - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };

/* -------------------------------------------------------- brand story --
   One observer, three chapters, three plates. No per-frame scroll handler:
   the chapter nearest the reading line owns the plate. */
(function story() {
  const chapters = $$('#story-chapters .story__chapter');
  const plates = $$('#story-plate img');
  if (!chapters.length || !plates.length) return;

  let current = -1;
  function show(i) {
    if (i === current) return;
    current = i;
    plates.forEach(function (p, n) { p.classList.toggle('is-on', n === i); });
    chapters.forEach(function (c, n) { c.classList.toggle('is-live', n === i); });
  }
  show(0);

  if (window.matchMedia('(max-width: 900px)').matches) {
    chapters.forEach(function (c) { c.classList.add('is-live'); });
    plates.forEach(function (p, n) { p.classList.toggle('is-on', n === 0); });
  }

  const io = new IntersectionObserver(function (entries) {
    /* pick the visible chapter closest to the middle of the screen */
    let best = null, bestDist = Infinity;
    chapters.forEach(function (c, n) {
      const r = c.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      const dist = Math.abs((r.top + r.height / 2) - window.innerHeight / 2);
      if (dist < bestDist) { bestDist = dist; best = n; }
    });
    if (best !== null) show(best);
  }, { threshold: [0, 0.25, 0.5, 0.75, 1], rootMargin: '-10% 0px -10% 0px' });
  chapters.forEach(function (c) { io.observe(c); });
})();

/* --------------------------------------------------------- hero film --
   Proven scrub engineering: stream the file as a Blob (hosts without HTTP
   Range break plain seeking), ease the displayed time in a rAF loop that
   rests, never issue overlapping seeks, and write to the DOM only on change. */
(function hero() {
  const hero = $('.hero');
  const stage = $('.hero__stage');
  const video = $('#hero-video');
  const poster = $('.hero__poster');
  if (!hero || !stage || !video) return;

  const VIDEO_URL = 'assets/hero-scrub.mp4';
  const VIDEO_BYTES = 3400987;
  const POSTER_URL = 'assets/hero-poster.jpg';

  /* Split the two display lines into words so the settle can rise word by word. */
  $$('.hero__band .split').forEach(function (el) {
    const text = el.textContent.replace(/\s+/g, ' ').trim();
    const words = text.split(' ');
    const sr = document.createElement('span');
    sr.className = 'sr'; sr.textContent = text;
    const vis = document.createElement('span');
    vis.setAttribute('aria-hidden', 'true');
    words.forEach(function (word, i) {
      const s = document.createElement('span');
      s.className = 'w';
      s.textContent = word;
      s.style.setProperty('--th', (i / words.length * 0.5).toFixed(3));
      vis.appendChild(s);
      if (i < words.length - 1) vis.appendChild(document.createTextNode(' '));
    });
    el.replaceChildren(sr, vis);
  });

  const bands = $$('.hero__band').map(function (el, i) {
    return {
      el: el,
      a: parseFloat(el.getAttribute('data-a')),
      b: parseFloat(el.getAttribute('data-b')),
      ramp: parseFloat(el.getAttribute('data-ramp')) || 0.16,
      first: i === 0,
      last: i === 1,
      op: -1, k: -1, on: null,
    };
  });

  function progress() {
    const range = hero.offsetHeight - window.innerHeight;
    if (range <= 0) return 0;
    return clamp(-hero.getBoundingClientRect().top / range, 0, 1);
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
  let scrollPending = false;
  function readScroll() {
    scrollPending = false;
    target = progress();
    if (rafId === null && onScreen) rafId = requestAnimationFrame(tick);
  }
  function onScroll() {
    /* progress() forces layout, so it runs once per frame, never once per event */
    if (scrollPending) return;
    scrollPending = true;
    requestAnimationFrame(readScroll);
  }
  const bandHost = $('.hero__bands');
  new IntersectionObserver(function (es) {
    onScreen = es[0].isIntersecting;
    if (bandHost) bandHost.hidden = !onScreen;   /* no tab stops on a film you have left */
    if (onScreen && armed) onScroll();
  }).observe(hero);

  /* -- beat one assembles once on load, then hands over to the scroll */
  let loadK = 0, loadStart = null;
  function loadRamp(now) {
    if (loadStart === null) loadStart = now;
    const t = clamp((now - loadStart - 260) / 1300, 0, 1);
    loadK = t * t * (3 - 2 * t);
    paint(shown);
    if (loadK < 1) requestAnimationFrame(loadRamp);
  }

  let cuePast = null;
  function paint(p) {
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
    }
    const past = p > 0.08;
    if (past !== cuePast) { cuePast = past; stage.classList.toggle('is-past', past); }
  }

  /* -- the streamed Blob, behind an honest ring, poster first */
  let started = false, failed = false, inited = false;
  function initOnce() {
    if (inited) return;
    inited = true;
    poster.style.backgroundImage = "url('" + POSTER_URL + "')";
    const start = function () { if (started) return; started = true; load().catch(failVideo); };
    const img = new Image();
    img.onload = start; img.onerror = start; img.src = POSTER_URL;
    setTimeout(start, 4000);
    requestAnimationFrame(loadRamp);
  }
  async function load() {
    const ring = $('.hero__ring circle');
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
  function failVideo() {
    if (failed) return;
    failed = true;
    stage.classList.add('is-failed');
    const ring = $('.hero__ring');
    if (ring) ring.remove();
  }

  /* -- the five gates, character for character identical to home.css, kept
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
})();

/* ThreeUI AnimatedTopDock, Sable variant. Port of src/shaders/animated-top-dock/topDockController.ts
   (SHA-256 506ab23d…) and the Sable branch of AnimatedTopDock.tsx (SHA-256 50ddbba7…) to plain
   JavaScript: the controller is the same code with the type annotations removed, the mount builds
   the same DOM the React branch renders. Nothing here is restyled; the site's overrides live in
   style.css and main.js. */
(function () {
'use strict';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function createTopDockController(root, getOptions) {
  const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const precisionQuery = window.matchMedia("(hover:hover) and (pointer:fine)");
  const items = Array.from(root.querySelectorAll("[data-dock-item]")).map((element) => ({
    element,
    baseWidth: 0,
    baseHeight: 0,
    value: 0,
    velocity: 0,
    target: 0,
  }));

  let enabled = false;
  let pointerActive = false;
  let dirty = false;
  let frame = 0;

  const canAnimate = () => !reducedQuery.matches && root.clientWidth > 0 && window.innerWidth > 600 && precisionQuery.matches;

  const measure = () => {
    enabled = canAnimate();
    /* released first, so the rest width is measured against the track's own
       content rather than against the width the last measurement pinned */
    if (getOptions().lockTrack) root.style.width = "";
    for (const state of items) {
      state.element.style.width = "";
      state.element.style.height = "";
      state.element.style.transform = "";
      state.element.dataset.dockNear = "false";
    }
    for (const state of items) {
      const rect = state.element.getBoundingClientRect();
      state.baseWidth = rect.width;
      state.baseHeight = rect.height;
      state.value = 0;
      state.velocity = 0;
      state.target = 0;
    }
    pointerActive = false;
    dirty = false;
    /* a distributed strip has to fill its track even when the spring never runs
       — reduced motion, a coarse pointer, or a narrow viewport */
    if (getOptions().distribute) applyLayout();
    if (getOptions().lockTrack) root.style.width = `${root.getBoundingClientRect().width.toFixed(2)}px`;
    root.dataset.dockState = enabled ? "idle" : "static";
    root.dataset.dockMax = "0.00";
  };

  const setTargets = (clientX, clientY) => {
    if (!enabled) return;
    const options = getOptions();
    const vertical = options.axis === "y";
    const pointer = vertical ? clientY : clientX;
    const rects = items.map((state) => state.element.getBoundingClientRect());
    for (let index = 0; index < items.length; index += 1) {
      const rect = rects[index];
      const center = vertical ? rect.top + rect.height * 0.5 : rect.left + rect.width * 0.5;
      const proximity = clamp(1 - Math.abs(pointer - center) / Math.max(1, options.proximity), 0, 1);
      const influence = proximity * proximity * (3 - 2 * proximity);
      items[index].target = influence;
      items[index].element.dataset.dockNear = influence > 0.08 ? "true" : "false";
    }
    pointerActive = true;
    dirty = true;
    root.dataset.dockState = "active";
  };

  const focusItem = (item) => {
    if (!enabled) return;
    const index = items.findIndex((state) => state.element === item);
    if (index < 0) return;
    items.forEach((state, itemIndex) => {
      state.target = itemIndex === index ? 1 : Math.abs(itemIndex - index) === 1 ? 0.24 : 0;
      state.element.dataset.dockNear = state.target > 0.08 ? "true" : "false";
    });
    pointerActive = false;
    dirty = true;
    root.dataset.dockState = "focus";
  };

  const reset = () => {
    pointerActive = false;
    dirty = true;
    items.forEach((state) => {
      state.target = 0;
      state.element.dataset.dockNear = "false";
    });
  };

  /* the only place item geometry is written, so the three fits stay one
     behaviour with three ways of spending the same spring value */
  const applyLayout = () => {
    const options = getOptions();
    if (options.distribute && options.axis !== "y") {
      const weights = items.map((state) => state.baseWidth + options.widthGrowth * clamp(state.value, 0, 1.08));
      const total = weights.reduce((sum, weight) => sum + weight, 0);
      const natural = items.reduce((sum, state) => sum + state.baseWidth, 0);
      /* squeezed below its own natural width the strip would clip every label,
         so it stops filling the track rather than crushing the cells */
      const track = root.clientWidth >= natural ? root.clientWidth : 0;
      items.forEach((state, index) => {
        state.element.style.width = track ? `${(track * weights[index] / total).toFixed(2)}px` : "";
        state.element.style.height = "";
        state.element.style.transform = "";
      });
      return;
    }
    for (const state of items) {
      const value = clamp(state.value, 0, 1.08);
      if (options.axis === "y") {
        state.element.style.width = "";
        state.element.style.height = `${(state.baseHeight + options.heightGrowth * value).toFixed(2)}px`;
        state.element.style.transform = `translateX(${(value * options.drop).toFixed(2)}px)`;
        continue;
      }
      const isLogo = state.element.classList.contains("animated-top-dock__logo");
      const extraWidth = isLogo ? options.widthGrowth * (14 / 17) : Math.min(options.widthGrowth, state.baseWidth * 0.24);
      const extraHeight = isLogo ? options.heightGrowth * (14 / 16) : options.heightGrowth;
      state.element.style.width = `${(state.baseWidth + extraWidth * value).toFixed(2)}px`;
      state.element.style.height = `${(state.baseHeight + extraHeight * value).toFixed(2)}px`;
      state.element.style.transform = `translateY(${(value * options.drop).toFixed(2)}px)`;
    }
  };

  const draw = () => {
    if (enabled && dirty) {
      const options = getOptions();
      let moving = false;
      let maxValue = 0;
      for (const state of items) {
        state.velocity += (state.target - state.value) * options.spring;
        state.velocity *= options.damping;
        state.value += state.velocity;
        if (Math.abs(state.target - state.value) < 0.001 && Math.abs(state.velocity) < 0.001) {
          state.value = state.target;
          state.velocity = 0;
        } else {
          moving = true;
        }
        maxValue = Math.max(maxValue, clamp(state.value, 0, 1.08));
      }
      applyLayout();
      root.dataset.dockMax = maxValue.toFixed(2);
      if (!moving) {
        dirty = false;
        if (items.every((state) => state.target === 0)) root.dataset.dockState = "idle";
      }
    }
    frame = requestAnimationFrame(draw);
  };

  const onPointerMove = (event) => setTargets(event.clientX, event.clientY);
  const onWindowPointerMove = (event) => {
    if (!pointerActive) return;
    const rootRect = root.getBoundingClientRect();
    const itemRects = items.map((state) => state.element.getBoundingClientRect());
    const bottom = Math.max(rootRect.bottom, ...itemRects.map((rect) => rect.bottom));
    const outside = event.clientX < rootRect.left || event.clientX > rootRect.right || event.clientY < rootRect.top || event.clientY > bottom;
    if (outside) reset();
  };
  const onFocusIn = (event) => {
    const item = event.target?.closest("[data-dock-item]");
    if (item) focusItem(item);
  };
  const onFocusOut = () => requestAnimationFrame(() => {
    if (!root.contains(document.activeElement)) reset();
  });
  const onKeyDown = (event) => {
    const item = event.target?.closest("[data-dock-item]");
    if (item && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      item.click();
    }
  };
  const onClick = () => reset();

  /* the spring writes an explicit pixel width onto every item, so the base
     measurement has to happen after the label font is available — measured
     against a fallback face, a variant with auto-width items locks in a box its
     own text then overflows */
  let released = false;
  const remeasure = () => { if (!released) measure(); };
  document.fonts?.ready.then(remeasure);

  /* re-measuring on the parent works for a dock inside a fixed bar, but a rail
     whose height follows its own items would resize its parent as it grows and
     cancel the spring on the next frame. A shell can opt out of that feedback
     loop by marking a box the dock cannot resize. */
  const resizeObserver = new ResizeObserver(measure);
  resizeObserver.observe(root.closest("[data-dock-frame]") ?? root.parentElement ?? root);
  root.addEventListener("pointermove", onPointerMove);
  root.addEventListener("pointerleave", reset);
  root.addEventListener("focusin", onFocusIn);
  root.addEventListener("focusout", onFocusOut);
  root.addEventListener("keydown", onKeyDown);
  root.addEventListener("click", onClick);
  window.addEventListener("pointermove", onWindowPointerMove, { passive: true });
  reducedQuery.addEventListener("change", measure);
  precisionQuery.addEventListener("change", measure);
  measure();
  frame = requestAnimationFrame(draw);

  return () => {
    released = true;
    root.style.width = "";
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    root.removeEventListener("pointermove", onPointerMove);
    root.removeEventListener("pointerleave", reset);
    root.removeEventListener("focusin", onFocusIn);
    root.removeEventListener("focusout", onFocusOut);
    root.removeEventListener("keydown", onKeyDown);
    root.removeEventListener("click", onClick);
    window.removeEventListener("pointermove", onWindowPointerMove);
    reducedQuery.removeEventListener("change", measure);
    precisionQuery.removeEventListener("change", measure);
  };
}

/* AnimatedTopDock.tsx: defaults and the Sable item glyphs, verbatim */
const ANIMATED_TOP_DOCK_DEFAULTS = {
  variant: "sable",
  proximity: 122,
  spring: 0.19,
  damping: 0.7,
  widthGrowth: 17,
  heightGrowth: 16,
  drop: 3.5,
};

const SABLE_ICONS = {
  system: '<rect x="2.25" y="2.25" width="4.5" height="4.5" rx=".8" /><rect x="9.25" y="2.25" width="4.5" height="4.5" rx=".8" /><rect x="2.25" y="9.25" width="4.5" height="4.5" rx=".8" /><rect x="9.25" y="9.25" width="4.5" height="4.5" rx=".8" />',
  method: '<circle cx="3" cy="8" r="1.5" /><circle cx="12.5" cy="3.5" r="1.5" /><circle cx="12.5" cy="12.5" r="1.5" /><path d="M4.5 7.3 11 4.2M4.5 8.7l6.5 3.1" />',
  work: '<rect x="2" y="3" width="12" height="10" rx="1.5" /><path d="M2 6h12M5 4.5h.01M7 4.5h.01" />',
  access: '<circle cx="5.2" cy="6.2" r="2.7" /><path d="m7.2 8.2 5.9 5.1M10.2 10.8l1.5-1.5M12 12.4l1.4-1.4" />',
  notes: '<path d="M4 2.25h5.4L12 4.85v8.9H4z" /><path d="M9.25 2.25V5h2.7M6 8h4M6 10.5h4" />',
};

/* The Sable branch of AnimatedTopDock: a nav with the logo button and one button per item.
   `items` carries the site's own labels and targets in place of the demo's SYSTEM/METHOD/WORK/
   ACCESS/NOTES, each keeping its authored glyph; `logoMarkup` replaces the demo brand mark. */
function mountAnimatedTopDock(host, config) {
  const options = { ...ANIMATED_TOP_DOCK_DEFAULTS, ...(config.props || {}) };
  const items = config.items;
  const component = document.createElement("div");
  component.className = "animated-top-dock-component" + (config.className ? ` ${config.className}` : "");
  const nav = document.createElement("nav");
  nav.className = "animated-top-dock__nav";
  nav.setAttribute("aria-label", config.ariaLabel || "Animated top dock");
  nav.dataset.dockState = "idle";
  nav.dataset.dockMax = "0.00";

  const logo = document.createElement("button");
  logo.className = "animated-top-dock__item animated-top-dock__logo";
  logo.dataset.dockItem = "";
  logo.type = "button";
  logo.setAttribute("aria-label", "Home");
  logo.innerHTML = config.logoMarkup;
  nav.appendChild(logo);

  const buttons = items.map((item) => {
    const button = document.createElement("button");
    button.className = "animated-top-dock__item animated-top-dock__link";
    button.dataset.dockItem = "";
    button.dataset.target = item.target;
    button.type = "button";
    button.setAttribute("aria-pressed", "false");
    button.innerHTML = `<span class="animated-top-dock__icon" aria-hidden="true"><svg viewBox="0 0 16 16">${SABLE_ICONS[item.icon]}</svg></span><span>${item.label}</span>`;
    nav.appendChild(button);
    return button;
  });

  component.appendChild(nav);
  host.appendChild(component);

  let activeId = items[0].id;
  const setActive = (id) => {
    activeId = id;
    buttons.forEach((button, index) => button.setAttribute("aria-pressed", String(items[index].id === id)));
  };
  setActive(activeId);
  logo.addEventListener("click", () => { setActive(items[0].id); config.onNavigate?.(config.homeTarget || items[0].target); });
  buttons.forEach((button, index) => button.addEventListener("click", () => { setActive(items[index].id); config.onNavigate?.(items[index].target); }));

  const dispose = createTopDockController(nav, () => ({ ...options, axis: "x", distribute: false, lockTrack: false }));
  return { component, nav, buttons, setActive, dispose };
}

window.ThreeUIDock = { createTopDockController, mountAnimatedTopDock, ANIMATED_TOP_DOCK_DEFAULTS };
})();

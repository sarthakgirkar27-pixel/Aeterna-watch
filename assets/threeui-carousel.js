/* ThreeUI CharacterCarousel, Filmstrip variant. Port of src/shaders/character-carousel/
   CharacterCarousel.tsx (SHA-256 3bc9c80e…) to plain JavaScript. The React component builds a
   focused document from the canonical filmstrip source (focus styles plus a virtual-clock
   controls script injected before </head>) and renders it in a sandboxed iframe, posting
   `character-carousel-controls` on load, on visibility changes and on every prop change. Here
   the focused document is the file assets/collection-filmstrip.html (same injection, the twelve
   colourways in place of the demo portraits) and the same messages drive it. */
(function () {
'use strict';

const CHARACTER_CAROUSEL_DEFAULTS = {
  variant: "filmstrip",
  speed: 1,
  scale: 1,
  opacity: 1,
  hue: 0,
  saturation: 1,
  brightness: 1,
};

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function mountCharacterCarousel(host, props) {
  const { variant, speed, scale, opacity, hue, saturation, brightness, className, src } = { ...CHARACTER_CAROUSEL_DEFAULTS, className: "", ...props };
  const isFilmstrip = variant === "filmstrip";
  const safeSpeed = clamp(speed, 0, 2.5);
  const safeScale = clamp(scale, 0.7, 1.3);
  let hostVisible = true;
  let documentVisible = typeof document === "undefined" || !document.hidden;

  const wrapper = document.createElement("div");
  wrapper.className = `threeui-background character-carousel character-carousel--${variant}${className ? ` ${className}` : ""}`;
  /* site change: the deck ground is night, so there is no cream flash before
     the frame paints. The wave variant is untouched. */
  wrapper.style.background = isFilmstrip ? "#121013" : "#121212";
  wrapper.style.pointerEvents = "auto";

  const iframe = document.createElement("iframe");
  iframe.title = isFilmstrip ? "Interactive character filmstrip" : "Interactive character wave";
  iframe.src = src;
  iframe.setAttribute("sandbox", "allow-scripts");
  Object.assign(iframe.style, {
    position: "absolute",
    inset: "0",
    display: "block",
    width: "100%",
    height: "100%",
    border: "0",
    /* site change: night, as above. An inline background on the iframe can
       otherwise only be beaten from CSS with !important. */
    background: isFilmstrip ? "#121013" : "#121212",
    opacity: String(clamp(opacity, 0.05, 1)),
    filter: `hue-rotate(${clamp(hue, -180, 180)}deg) saturate(${clamp(saturation, 0, 2)}) brightness(${clamp(brightness, 0.35, 1.65)})`,
  });

  const postControls = () => {
    const paused = !hostVisible || !documentVisible || safeSpeed === 0;
    iframe.contentWindow?.postMessage({
      type: "character-carousel-controls",
      controls: { speed: safeSpeed, scale: safeScale, paused },
    }, "*");
  };

  iframe.addEventListener("load", postControls);
  wrapper.appendChild(iframe);
  host.appendChild(wrapper);

  let observer = null;
  if (typeof IntersectionObserver !== "undefined") {
    observer = new IntersectionObserver(([entry]) => { hostVisible = entry?.isIntersecting ?? true; postControls(); });
    observer.observe(iframe);
  }
  const onVisibility = () => { documentVisible = !document.hidden; postControls(); };
  document.addEventListener("visibilitychange", onVisibility);
  postControls();

  return {
    wrapper,
    iframe,
    postControls,
    dispose() {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      wrapper.remove();
    },
  };
}

window.ThreeUICarousel = { mountCharacterCarousel, CHARACTER_CAROUSEL_DEFAULTS };
})();

/* Seeker Of SoundZ v4.13.2 — account-aware page transition controller. */
(() => {
  "use strict";

  const MODES = new Set(["stellar", "fade", "aperture", "warp", "scan", "cubes", "minimal"]);
  const DURATIONS = {
    stellar: 680,
    fade: 420,
    aperture: 640,
    warp: 660,
    scan: 560,
    cubes: 720,
    minimal: 90
  };

  let navigating = false;

  function selectedMode() {
    const saved = window.SOSExperience?.get?.()?.transition;
    if (MODES.has(saved)) return saved;
    const className = [...document.documentElement.classList]
      .find(name => name.startsWith("sos-transition-"));
    const fromClass = className?.replace("sos-transition-", "");
    return MODES.has(fromClass) ? fromClass : "stellar";
  }

  function overlay() {
    const node = document.getElementById("cubeTransition");
    if (!node) return null;
    node.setAttribute("aria-hidden", "true");
    return node;
  }

  function clearTransition() {
    const node = overlay();
    if (!node) return;
    node.classList.remove("active", "sos-transition-running");
    node.removeAttribute("data-transition-mode");
    document.documentElement.classList.remove("sos-page-leaving");
    document.body?.classList.remove("page-transitioning");
    navigating = false;
  }

  function isEligible(anchor, event) {
    if (!anchor || event.defaultPrevented || event.button !== 0) return false;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    if (anchor.target && anchor.target !== "_self") return false;
    if (anchor.hasAttribute("download") || anchor.dataset.noTransition != null) return false;

    const raw = anchor.getAttribute("href") || "";
    if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:") || raw.startsWith("javascript:")) return false;

    const destination = new URL(anchor.href, location.href);
    if (destination.origin !== location.origin) return false;
    if (destination.href === location.href) return false;
    return destination;
  }

  function begin(destination) {
    if (navigating) return;
    navigating = true;

    const mode = selectedMode();
    const node = overlay();
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const effectiveMode = reduceMotion ? "minimal" : mode;
    const duration = DURATIONS[effectiveMode] ?? DURATIONS.stellar;

    sessionStorage.setItem("sos_transition_arrival", effectiveMode);
    document.documentElement.classList.add("sos-page-leaving");

    if (!node || effectiveMode === "minimal") {
      setTimeout(() => location.assign(destination.href), duration);
      return;
    }

    node.classList.remove("active", "sos-transition-running");
    node.dataset.transitionMode = effectiveMode;
    // Force a clean animation restart without moving any page content.
    void node.offsetWidth;
    node.classList.add("active", "sos-transition-running");
    document.body?.classList.add("page-transitioning");

    setTimeout(() => location.assign(destination.href), duration);
  }

  // Capture phase intentionally owns internal navigation before the original
  // legacy bubble listener can force the cube transition.
  document.addEventListener("click", event => {
    const anchor = event.target.closest?.("a[href]");
    const destination = isEligible(anchor, event);
    if (!destination) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    begin(destination);
  }, true);

  function arrival() {
    clearTransition();
    const mode = sessionStorage.getItem("sos_transition_arrival");
    if (!mode) return;
    sessionStorage.removeItem("sos_transition_arrival");

    // A subtle opacity settle avoids the old vertical page/logo jump.
    document.documentElement.dataset.sosArrival = mode;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.documentElement.classList.add("sos-page-arrived");
      setTimeout(() => {
        document.documentElement.classList.remove("sos-page-arrived");
        delete document.documentElement.dataset.sosArrival;
      }, 360);
    }));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", arrival, { once: true });
  } else {
    arrival();
  }

  addEventListener("pageshow", clearTransition);
  addEventListener("pagehide", () => { navigating = false; });

  window.SOSTransitions = {
    getMode: selectedMode,
    play(destination) {
      begin(new URL(destination, location.href));
    },
    reset: clearTransition
  };
})();

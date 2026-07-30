/* Seeker Of SoundZ v4.8 — transition decoration and safe cleanup.
   Link navigation remains owned by app-shell.js to prevent duplicate handlers. */
(() => {
  "use strict";

  function decorateTransition() {
    const scene = document.querySelector("#cubeTransition .cubeScene");
    if (!scene || scene.querySelector(".transitionGalaxy")) return;

    const galaxy = document.createElement("div");
    galaxy.className = "transitionGalaxy";
    galaxy.setAttribute("aria-hidden", "true");

    const stars = document.createElement("div");
    stars.className = "transitionStarCloud";
    stars.setAttribute("aria-hidden", "true");

    const fragment = document.createDocumentFragment();
    for (let index = 0; index < 34; index++) {
      const star = document.createElement("i");
      star.style.setProperty("--x", `${(Math.random() * 100).toFixed(2)}%`);
      star.style.setProperty("--y", `${(Math.random() * 100).toFixed(2)}%`);
      star.style.setProperty("--s", `${(0.7 + Math.random() * 1.5).toFixed(2)}px`);
      star.style.setProperty("--d", `${(Math.random() * 1.8).toFixed(2)}s`);
      fragment.appendChild(star);
    }
    stars.appendChild(fragment);
    scene.prepend(galaxy, stars);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", decorateTransition, { once: true });
  } else {
    decorateTransition();
  }

  addEventListener("pageshow", () => {
    document.getElementById("cubeTransition")?.classList.remove("active");
    document.body.classList.remove("page-transitioning");
  });
})();

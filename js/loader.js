/* Seeker Of SoundZ v4.8 — cinematic signal ignition loader */
(() => {
  "use strict";
  const loader = document.getElementById("loader");
  const progressBar = document.querySelector(".loaderProgress");
  const percentText = document.querySelector(".loaderPercent");
  if (!loader || !progressBar || !percentText) {
    console.warn("Loader markup is missing on this page.");
    return;
  }

  if (!loader.querySelector(".loaderCosmos")) {
    const cosmos = document.createElement("div");
    cosmos.className = "loaderCosmos";
    cosmos.setAttribute("aria-hidden", "true");
    cosmos.innerHTML = '<div class="loaderNebula loaderNebulaA"></div><div class="loaderNebula loaderNebulaB"></div><div class="loaderGalaxyBand"></div><div class="loaderHorizon"></div><div class="loaderStarField"></div>';
    loader.prepend(cosmos);

    const field = cosmos.querySelector(".loaderStarField");
    const count = matchMedia("(max-width:640px)").matches ? 52 : 92;
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < count; index++) {
      const star = document.createElement("span");
      star.style.setProperty("--x", `${(Math.random() * 100).toFixed(2)}%`);
      star.style.setProperty("--y", `${(Math.random() * 100).toFixed(2)}%`);
      star.style.setProperty("--size", `${(0.55 + Math.random() * 1.55).toFixed(2)}px`);
      star.style.setProperty("--alpha", `${(0.28 + Math.random() * 0.68).toFixed(2)}`);
      star.style.setProperty("--delay", `${(Math.random() * 3.5).toFixed(2)}s`);
      star.style.setProperty("--speed", `${(2.4 + Math.random() * 3.8).toFixed(2)}s`);
      fragment.appendChild(star);
    }
    field.appendChild(fragment);
  }

  const hasLoaded = sessionStorage.getItem("sos_loaded");
  if (hasLoaded) {
    loader.classList.add("loaded");
    return;
  }

  let progress = 0;
  const loading = setInterval(() => {
    progress += 1;
    progressBar.style.width = `${progress}%`;
    percentText.textContent = `${progress}%`;
    loader.style.setProperty("--loader-progress", `${progress / 100}`);

    if (progress >= 100) {
      clearInterval(loading);
      sessionStorage.setItem("sos_loaded", "true");
      loader.classList.add("loaderComplete");
      setTimeout(() => loader.classList.add("loaded"), 900);
    }
  }, 22);
})();

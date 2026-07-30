/* Seeker Of SoundZ v4.8.1 — visible, lightweight reactive starfield */
(() => {
  "use strict";
  const canvas = document.getElementById("snowCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
  if (!ctx) return;

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = matchMedia("(max-width: 760px)").matches;
  const collaboration = document.body.classList.contains("collaborationPage");
  const performanceMode = document.documentElement.classList.contains("performance-mode");

  let width = 1, height = 1, dpr = 1;
  let stars = [], shootingStars = [];
  let rafId = 0, lastFrame = 0, nextShotAt = 0;
  let scrollTarget = 0, scrollValue = 0;

  const pointer = {
    px: -9999, py: -9999,
    nx: 0, ny: 0,
    smoothX: 0, smoothY: 0,
    active: false
  };

  function buildStars() {
    const areaScale = Math.min(1.22, Math.max(.82, (width * height) / 1200000));
    let base = mobile ? 92 : 150;
    if (collaboration) base *= .66;
    if (performanceMode) base *= .62;
    const count = Math.max(54, Math.round(base * areaScale));

    stars = Array.from({ length: count }, (_, index) => {
      const bright = index < Math.max(14, Math.round(count * .15));
      const depth = .18 + Math.random() * .82;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        radius: bright ? .9 + Math.random() * 1.05 : .34 + Math.random() * .68,
        alpha: bright ? .72 + Math.random() * .25 : .34 + Math.random() * .48,
        phase: Math.random() * Math.PI * 2,
        speed: .00038 + Math.random() * .00072,
        twinkle: bright || Math.random() < .34,
        depth,
        tint: Math.random(),
        drift: (Math.random() - .5) * .005
      };
    });
  }

  function resize() {
    width = Math.max(1, innerWidth);
    height = Math.max(1, innerHeight);
    dpr = Math.min(devicePixelRatio || 1, mobile ? 1 : 1.25);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildStars();
    nextShotAt = performance.now() + 6000 + Math.random() * 7000;
  }

  function spawnShot(now) {
    if (reducedMotion || shootingStars.length || (collaboration && Math.random() < .55)) {
      nextShotAt = now + 10000 + Math.random() * 11000;
      return;
    }
    const fromLeft = Math.random() > .5;
    const length = 70 + Math.random() * 82;
    shootingStars.push({
      x: fromLeft ? -length : width + length,
      y: height * (.08 + Math.random() * .48),
      vx: (fromLeft ? 1 : -1) * (5.2 + Math.random() * 1.9),
      vy: .85 + Math.random() * 1.05,
      length,
      age: 0,
      maxAge: 74 + Math.random() * 22
    });
    nextShotAt = now + 10000 + Math.random() * 13000;
  }

  function drawStar(star, now) {
    star.x += star.drift;
    if (star.x < -4) star.x = width + 4;
    if (star.x > width + 4) star.x = -4;

    const twinkle = star.twinkle ? .72 + .28 * Math.sin(now * star.speed + star.phase) : 1;
    const px = star.x + pointer.smoothX * star.depth * 4.2;
    const rawY = star.y + pointer.smoothY * star.depth * 3.2 - scrollValue * star.depth * .009;
    const py = ((rawY % height) + height) % height;
    const distance = pointer.active ? Math.hypot(px - pointer.px, py - pointer.py) : 9999;
    const proximity = Math.max(0, 1 - distance / 145);
    const alpha = Math.min(1, star.alpha * twinkle + proximity * .34);
    const radius = star.radius + proximity * .48;

    if (radius > .95 || proximity > .08) {
      ctx.shadowBlur = 4 + proximity * 10;
      ctx.shadowColor = star.tint > .86 ? "rgba(190,215,255,.72)" : "rgba(238,217,255,.72)";
    } else {
      ctx.shadowBlur = 0;
    }

    const color = star.tint > .86 ? "213,231,255" : star.tint < .1 ? "236,214,255" : "255,253,255";
    ctx.fillStyle = `rgba(${color},${alpha})`;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function render(now) {
    rafId = requestAnimationFrame(render);
    if (document.hidden || document.documentElement.classList.contains("sos-animations-paused")) return;
    const frameGap = mobile || collaboration || performanceMode ? 33 : 24;
    if (now - lastFrame < frameGap) return;
    lastFrame = now;

    pointer.smoothX += (pointer.nx - pointer.smoothX) * .045;
    pointer.smoothY += (pointer.ny - pointer.smoothY) * .045;
    scrollValue += (scrollTarget - scrollValue) * .04;

    ctx.clearRect(0, 0, width, height);
    for (const star of stars) drawStar(star, now);
    ctx.shadowBlur = 0;

    if (now > nextShotAt) spawnShot(now);
    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const shot = shootingStars[i];
      shot.x += shot.vx; shot.y += shot.vy; shot.age++;
      const fade = Math.sin(Math.min(1, shot.age / shot.maxAge) * Math.PI);
      const endX = shot.x - (shot.vx > 0 ? shot.length : -shot.length);
      const endY = shot.y - shot.length * .17;
      const gradient = ctx.createLinearGradient(endX, endY, shot.x, shot.y);
      gradient.addColorStop(0, "rgba(255,255,255,0)");
      gradient.addColorStop(1, `rgba(238,222,255,${.72 * fade})`);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1.05;
      ctx.beginPath(); ctx.moveTo(endX, endY); ctx.lineTo(shot.x, shot.y); ctx.stroke();
      if (shot.age > shot.maxAge || shot.x > width + shot.length * 2 || shot.x < -shot.length * 2) shootingStars.splice(i, 1);
    }
  }

  addEventListener("pointermove", event => {
    pointer.px = event.clientX;
    pointer.py = event.clientY;
    pointer.nx = ((event.clientX / width) - .5) * 2;
    pointer.ny = ((event.clientY / height) - .5) * 2;
    pointer.active = true;
  }, { passive: true });
  addEventListener("pointerout", event => {
    if (!event.relatedTarget) pointer.active = false;
  }, { passive: true });
  addEventListener("scroll", () => { scrollTarget = scrollY; }, { passive: true });
  addEventListener("resize", resize, { passive: true });
  addEventListener("pagehide", () => cancelAnimationFrame(rafId), { once: true });

  resize();
  rafId = requestAnimationFrame(render);
})();

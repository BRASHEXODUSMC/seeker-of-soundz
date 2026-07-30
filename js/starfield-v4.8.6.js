/* Seeker Of SoundZ v4.8.6 — standalone twinkling particle stars */
(() => {
  'use strict';

  const removeOldFields = () => {
    document.querySelectorAll('#snowCanvas,#sosStarfield,#sosParticleStars,#sosTwinkleField').forEach((node) => node.remove());
  };

  const start = () => {
    removeOldFields();

    const canvas = document.createElement('canvas');
    canvas.id = 'sosTwinkleField';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    if (!ctx) {
      canvas.remove();
      return;
    }

    const mobileQuery = matchMedia('(max-width: 760px)');
    const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
    const collaborationPage = document.body.classList.contains('collaborationPage');

    let width = 1;
    let height = 1;
    let dpr = 1;
    let stars = [];
    let shootingStars = [];
    let animationId = 0;
    let lastFrame = 0;
    let nextShootingStar = 0;
    let scrollYTarget = window.scrollY || 0;
    let scrollYSmooth = scrollYTarget;

    const pointer = {
      x: -10000,
      y: -10000,
      normalizedX: 0,
      normalizedY: 0,
      smoothX: 0,
      smoothY: 0,
      active: false
    };

    const randomBetween = (min, max) => min + Math.random() * (max - min);

    function starCount() {
      let count = mobileQuery.matches ? 105 : 175;
      if (collaborationPage) count = Math.round(count * 0.68);
      if (document.documentElement.classList.contains('performance-mode')) count = Math.round(count * 0.72);
      return count;
    }

    function createStar(index, total) {
      const bright = index < Math.max(10, Math.round(total * 0.1));
      const medium = index < Math.round(total * 0.46);
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        radius: bright ? randomBetween(1.05, 1.75) : medium ? randomBetween(0.58, 1.05) : randomBetween(0.28, 0.62),
        alpha: bright ? randomBetween(0.68, 0.98) : medium ? randomBetween(0.44, 0.76) : randomBetween(0.26, 0.56),
        depth: bright ? randomBetween(0.72, 1) : medium ? randomBetween(0.38, 0.72) : randomBetween(0.12, 0.38),
        phase: Math.random() * Math.PI * 2,
        twinkleSpeed: randomBetween(0.00045, 0.00135),
        twinkles: bright || Math.random() < 0.48,
        drift: randomBetween(-0.0018, 0.0018),
        tone: Math.random()
      };
    }

    function rebuildStars() {
      const count = starCount();
      stars = Array.from({ length: count }, (_, index) => createStar(index, count));
    }

    function resize() {
      width = Math.max(1, window.innerWidth);
      height = Math.max(1, window.innerHeight);
      dpr = Math.min(window.devicePixelRatio || 1, mobileQuery.matches ? 1 : 1.25);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rebuildStars();
      nextShootingStar = performance.now() + randomBetween(6500, 11500);
      draw(performance.now());
    }

    function starColor(tone, alpha) {
      if (tone < 0.12) return `rgba(226,218,255,${alpha})`;
      if (tone > 0.9) return `rgba(210,232,255,${alpha})`;
      return `rgba(255,255,255,${alpha})`;
    }

    function drawStar(star, now) {
      star.x += star.drift;
      if (star.x < -4) star.x = width + 4;
      if (star.x > width + 4) star.x = -4;

      const twinkle = star.twinkles ? 0.7 + 0.3 * Math.sin(now * star.twinkleSpeed + star.phase) : 1;
      const x = star.x + pointer.smoothX * star.depth * 5;
      const shiftedY = star.y + pointer.smoothY * star.depth * 3.5 - scrollYSmooth * star.depth * 0.008;
      const y = ((shiftedY % height) + height) % height;

      const distance = pointer.active ? Math.hypot(x - pointer.x, y - pointer.y) : 99999;
      const reaction = Math.max(0, 1 - distance / 145);
      const alpha = Math.min(1, star.alpha * twinkle + reaction * 0.24);
      const radius = star.radius + reaction * 0.32;

      ctx.shadowBlur = radius > 0.9 ? 4 + reaction * 6 : 0;
      ctx.shadowColor = star.tone > 0.9 ? 'rgba(194,224,255,.65)' : 'rgba(235,220,255,.58)';
      ctx.fillStyle = starColor(star.tone, alpha);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      if (radius > 1.45 && alpha > 0.72) {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = starColor(star.tone, alpha * 0.3);
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x - radius * 2.1, y);
        ctx.lineTo(x + radius * 2.1, y);
        ctx.moveTo(x, y - radius * 2.1);
        ctx.lineTo(x, y + radius * 2.1);
        ctx.stroke();
      }
    }

    function spawnShootingStar(now) {
      if (reducedQuery.matches || shootingStars.length > 0) {
        nextShootingStar = now + randomBetween(9000, 15000);
        return;
      }
      const leftToRight = Math.random() > 0.5;
      const length = randomBetween(65, 120);
      const speed = randomBetween(4.7, 6.4);
      shootingStars.push({
        x: leftToRight ? -length : width + length,
        y: height * randomBetween(0.08, 0.48),
        vx: leftToRight ? speed : -speed,
        vy: randomBetween(0.45, 0.9),
        length,
        age: 0,
        lifetime: randomBetween(65, 90)
      });
      nextShootingStar = now + randomBetween(9500, 16000);
    }

    function drawShootingStar(star) {
      star.x += star.vx;
      star.y += star.vy;
      star.age += 1;
      const fade = Math.sin(Math.min(1, star.age / star.lifetime) * Math.PI);
      const tailX = star.x - Math.sign(star.vx) * star.length;
      const tailY = star.y - star.length * 0.12;
      const gradient = ctx.createLinearGradient(tailX, tailY, star.x, star.y);
      gradient.addColorStop(0, 'rgba(255,255,255,0)');
      gradient.addColorStop(0.72, `rgba(220,215,255,${0.22 * fade})`);
      gradient.addColorStop(1, `rgba(255,255,255,${0.88 * fade})`);
      ctx.shadowBlur = 4;
      ctx.shadowColor = 'rgba(225,220,255,.5)';
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(star.x, star.y);
      ctx.stroke();
      return star.age > star.lifetime || star.x > width + star.length * 2 || star.x < -star.length * 2;
    }

    function draw(now) {
      ctx.clearRect(0, 0, width, height);
      stars.forEach((star) => drawStar(star, now));
      ctx.shadowBlur = 0;

      if (now >= nextShootingStar) spawnShootingStar(now);
      for (let index = shootingStars.length - 1; index >= 0; index -= 1) {
        if (drawShootingStar(shootingStars[index])) shootingStars.splice(index, 1);
      }
    }

    function frame(now) {
      animationId = requestAnimationFrame(frame);
      if (document.hidden || document.documentElement.classList.contains('sos-animations-paused')) return;

      const performanceMode = document.documentElement.classList.contains('performance-mode');
      const frameDelay = mobileQuery.matches || collaborationPage || performanceMode ? 33 : 24;
      if (now - lastFrame < frameDelay) return;
      lastFrame = now;

      pointer.smoothX += (pointer.normalizedX - pointer.smoothX) * 0.045;
      pointer.smoothY += (pointer.normalizedY - pointer.smoothY) * 0.045;
      scrollYSmooth += (scrollYTarget - scrollYSmooth) * 0.03;
      draw(now);
    }

    window.addEventListener('pointermove', (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.normalizedX = (event.clientX / width - 0.5) * 2;
      pointer.normalizedY = (event.clientY / height - 0.5) * 2;
      pointer.active = true;
    }, { passive: true });

    window.addEventListener('pointerleave', () => { pointer.active = false; }, { passive: true });
    window.addEventListener('scroll', () => { scrollYTarget = window.scrollY || 0; }, { passive: true });
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pagehide', () => cancelAnimationFrame(animationId), { once: true });

    resize();
    animationId = requestAnimationFrame(frame);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();

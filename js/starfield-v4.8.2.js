/* Seeker Of SoundZ v4.8.2 — independent visible particle starfield */
(() => {
  'use strict';

  const oldCanvas = document.getElementById('snowCanvas');
  if (oldCanvas) oldCanvas.remove();

  const canvas = document.createElement('canvas');
  canvas.id = 'sosStarfield';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
  if (!ctx) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = matchMedia('(max-width: 760px)').matches;
  const collab = document.body.classList.contains('collaborationPage');

  let w = 1, h = 1, dpr = 1;
  let stars = [];
  let meteors = [];
  let last = 0;
  let nextMeteor = 0;
  let scrollYNow = window.scrollY || 0;
  let scrollSmooth = scrollYNow;
  let raf = 0;

  const mouse = { x:-9999, y:-9999, tx:0, ty:0, sx:0, sy:0, active:false };

  function randomStar(i, count) {
    const foreground = i < Math.round(count * .18);
    const mid = i < Math.round(count * .58);
    const depth = foreground ? .82 + Math.random() * .18 : mid ? .42 + Math.random() * .38 : .12 + Math.random() * .28;
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      baseR: foreground ? .95 + Math.random() * 1.15 : mid ? .52 + Math.random() * .65 : .25 + Math.random() * .38,
      baseA: foreground ? .68 + Math.random() * .28 : mid ? .42 + Math.random() * .35 : .24 + Math.random() * .28,
      depth,
      phase: Math.random() * Math.PI * 2,
      twinkleSpeed: .00045 + Math.random() * .00105,
      twinkles: foreground || Math.random() < .34,
      drift: (Math.random() - .5) * .003,
      hue: Math.random()
    };
  }

  function rebuild() {
    const perf = document.documentElement.classList.contains('performance-mode');
    const area = Math.min(1.25, Math.max(.78, (w * h) / 1150000));
    let count = mobile ? 105 : 175;
    if (collab) count = Math.round(count * .68);
    if (perf) count = Math.round(count * .65);
    count = Math.max(64, Math.round(count * area));
    stars = Array.from({length:count}, (_, i) => randomStar(i, count));
  }

  function resize() {
    w = Math.max(1, innerWidth);
    h = Math.max(1, innerHeight);
    dpr = Math.min(devicePixelRatio || 1, mobile ? 1 : 1.35);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    rebuild();
    nextMeteor = performance.now() + 5500 + Math.random() * 6500;
  }

  function starColor(hue, alpha) {
    if (hue < .12) return `rgba(222,205,255,${alpha})`;
    if (hue > .9) return `rgba(202,225,255,${alpha})`;
    return `rgba(255,255,255,${alpha})`;
  }

  function drawStar(s, now) {
    s.x += s.drift;
    if (s.x < -5) s.x = w + 5;
    else if (s.x > w + 5) s.x = -5;

    const twinkle = s.twinkles ? .72 + .28 * Math.sin(now * s.twinkleSpeed + s.phase) : 1;
    const px = s.x + mouse.sx * s.depth * 6;
    const shiftedY = s.y + mouse.sy * s.depth * 4 - scrollSmooth * s.depth * .012;
    const py = ((shiftedY % h) + h) % h;
    const distance = mouse.active ? Math.hypot(px - mouse.x, py - mouse.y) : 9999;
    const react = Math.max(0, 1 - distance / 175);
    const alpha = Math.min(1, s.baseA * twinkle + react * .28);
    const radius = s.baseR + react * .42;

    if (radius > .85 || react > .08) {
      ctx.shadowBlur = 5 + react * 9;
      ctx.shadowColor = s.hue > .9 ? 'rgba(190,220,255,.65)' : 'rgba(225,198,255,.65)';
    } else ctx.shadowBlur = 0;

    ctx.fillStyle = starColor(s.hue, alpha);
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();

    if (radius > 1.45 && alpha > .72) {
      ctx.shadowBlur = 0;
      ctx.strokeStyle = starColor(s.hue, alpha * .35);
      ctx.lineWidth = .55;
      ctx.beginPath();
      ctx.moveTo(px - radius * 2.2, py); ctx.lineTo(px + radius * 2.2, py);
      ctx.moveTo(px, py - radius * 2.2); ctx.lineTo(px, py + radius * 2.2);
      ctx.stroke();
    }
  }

  function spawnMeteor(now) {
    if (reducedMotion || meteors.length >= 2) {
      nextMeteor = now + 9000 + Math.random() * 10000;
      return;
    }
    const leftToRight = Math.random() >= .5;
    const speed = 5 + Math.random() * 2;
    const length = 65 + Math.random() * 85;
    meteors.push({
      x:leftToRight ? -length : w + length,
      y:h * (.08 + Math.random() * .5),
      vx:leftToRight ? speed : -speed,
      vy:.7 + Math.random() * 1.05,
      length,
      life:0,
      max:70 + Math.random() * 26
    });
    nextMeteor = now + 9000 + Math.random() * 12000;
  }

  function drawMeteor(m) {
    m.x += m.vx; m.y += m.vy; m.life++;
    const fade = Math.sin(Math.min(1, m.life / m.max) * Math.PI);
    const tailX = m.x - Math.sign(m.vx) * m.length;
    const tailY = m.y - m.length * .15;
    const grad = ctx.createLinearGradient(tailX,tailY,m.x,m.y);
    grad.addColorStop(0,'rgba(255,255,255,0)');
    grad.addColorStop(.72,`rgba(208,192,255,${.22 * fade})`);
    grad.addColorStop(1,`rgba(255,255,255,${.88 * fade})`);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(tailX,tailY); ctx.lineTo(m.x,m.y); ctx.stroke();
    return m.life > m.max || m.x > w + m.length * 2 || m.x < -m.length * 2;
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (document.hidden || document.documentElement.classList.contains('sos-animations-paused')) return;
    const perf = document.documentElement.classList.contains('performance-mode');
    const gap = mobile || collab || perf ? 33 : 22;
    if (now - last < gap) return;
    last = now;

    mouse.sx += (mouse.tx - mouse.sx) * .045;
    mouse.sy += (mouse.ty - mouse.sy) * .045;
    scrollSmooth += (scrollYNow - scrollSmooth) * .035;

    ctx.clearRect(0,0,w,h);
    stars.forEach(s => drawStar(s, now));
    ctx.shadowBlur = 0;

    if (now >= nextMeteor) spawnMeteor(now);
    for (let i = meteors.length - 1; i >= 0; i--) if (drawMeteor(meteors[i])) meteors.splice(i,1);
  }

  addEventListener('pointermove', e => {
    mouse.x = e.clientX; mouse.y = e.clientY;
    mouse.tx = (e.clientX / w - .5) * 2;
    mouse.ty = (e.clientY / h - .5) * 2;
    mouse.active = true;
  }, {passive:true});
  addEventListener('pointerleave', () => { mouse.active = false; }, {passive:true});
  addEventListener('scroll', () => { scrollYNow = window.scrollY || 0; }, {passive:true});
  addEventListener('resize', resize, {passive:true});
  addEventListener('pagehide', () => cancelAnimationFrame(raf), {once:true});

  resize();
  raf = requestAnimationFrame(frame);
})();

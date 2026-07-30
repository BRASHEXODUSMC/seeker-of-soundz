(() => {
  'use strict';

  function enhanceTransition() {
    if (window.SOSTransitions || window.__SOS_TRANSITION_V4135__) return;
    const transition = document.getElementById('cubeTransition');
    const scene = transition?.querySelector('.cubeScene');
    if (!transition || !scene || scene.querySelector('.transitionStarTunnel')) return;

    const lock = document.createElement('span');
    lock.className = 'transitionSignalLock';
    lock.setAttribute('aria-hidden', 'true');

    const ringA = document.createElement('span');
    ringA.className = 'transitionOrbitRing transitionOrbitRingA';
    ringA.setAttribute('aria-hidden', 'true');

    const ringB = document.createElement('span');
    ringB.className = 'transitionOrbitRing transitionOrbitRingB';
    ringB.setAttribute('aria-hidden', 'true');

    const sweep = document.createElement('span');
    sweep.className = 'transitionFrequencySweep';
    sweep.setAttribute('aria-hidden', 'true');

    const tunnel = document.createElement('span');
    tunnel.className = 'transitionStarTunnel';
    tunnel.setAttribute('aria-hidden', 'true');
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < 30; index += 1) {
      const star = document.createElement('i');
      star.style.setProperty('--angle', `${index * 12 + Math.random() * 8}deg`);
      star.style.setProperty('--distance', `${115 + Math.random() * 105}px`);
      star.style.setProperty('--size', `${0.8 + Math.random() * 1.8}px`);
      star.style.setProperty('--delay', `${Math.random() * -0.34}s`);
      fragment.appendChild(star);
    }
    tunnel.appendChild(fragment);

    const label = document.createElement('span');
    label.className = 'transitionDestination';
    label.setAttribute('aria-live', 'polite');
    label.textContent = 'Following the frequency';

    scene.prepend(tunnel, ringA, ringB, lock, sweep);
    scene.append(label);

    document.addEventListener('click', event => {
      const anchor = event.target.closest('a[href]');
      if (!anchor) return;
      const href = anchor.getAttribute('href') || '';
      if (!href || href.startsWith('#') || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      const text = (anchor.dataset.transitionLabel || anchor.textContent || '').replace(/\s+/g, ' ').trim();
      label.textContent = text ? `Tuning to ${text}` : 'Following the frequency';
    }, true);
  }

  function syncDrawerAndNoticeLayers() {
    const cart = document.getElementById('cartDrawer');
    const account = document.getElementById('accountDrawer');
    if (!cart || !account) return;

    const update = () => {
      const open = cart.classList.contains('open') || account.classList.contains('open');
      document.documentElement.classList.toggle('sos-drawer-open', open);
      if (open) document.querySelector('.sosNoticeCenter')?.classList.remove('open');
    };

    document.addEventListener('click', event => {
      if (event.target.closest('#cartButton,#accountButton,.drawerClose')) requestAnimationFrame(update);
    });

    const observer = new MutationObserver(update);
    observer.observe(cart, { attributes: true, attributeFilter: ['class'] });
    observer.observe(account, { attributes: true, attributeFilter: ['class'] });
    update();
  }

  function enhanceLoader() {
    if (window.__SOS_LOADER_V4135__) return;
    const loader = document.getElementById('loader');
    const stage = loader?.querySelector('.loaderLogoStage');
    if (!loader || !stage) return;

    // Use the exact live star canvas as the loader background, frame for frame.
    let mirror = loader.querySelector('.loaderSeamlessStars');
    if (!mirror) {
      mirror = document.createElement('canvas');
      mirror.className = 'loaderSeamlessStars';
      mirror.setAttribute('aria-hidden', 'true');
      loader.prepend(mirror);
    }
    const mirrorCtx = mirror.getContext('2d', { alpha: true, desynchronized: true });
    let raf = 0;
    const copyStars = () => {
      if (!loader.isConnected || loader.classList.contains('loaded')) {
        cancelAnimationFrame(raf);
        return;
      }
      const source = document.getElementById('sosTwinkleField');
      const dpr = Math.min(devicePixelRatio || 1, 1.25);
      const width = Math.max(1, innerWidth);
      const height = Math.max(1, innerHeight);
      if (mirror.width !== Math.round(width * dpr) || mirror.height !== Math.round(height * dpr)) {
        mirror.width = Math.round(width * dpr);
        mirror.height = Math.round(height * dpr);
        mirror.style.width = `${width}px`;
        mirror.style.height = `${height}px`;
      }
      if (mirrorCtx) {
        mirrorCtx.setTransform(1, 0, 0, 1, 0, 0);
        mirrorCtx.clearRect(0, 0, mirror.width, mirror.height);
        if (source && source.width && source.height && getComputedStyle(source).display !== 'none') {
          mirrorCtx.drawImage(source, 0, 0, mirror.width, mirror.height);
        }
      }
      raf = requestAnimationFrame(copyStars);
    };
    copyStars();

    if (!stage.querySelector('.loaderMiniCube')) {
      for (let index = 0; index < 6; index += 1) {
        const cube = document.createElement('i');
        cube.className = 'loaderMiniCube';
        cube.style.setProperty('--i', index);
        cube.setAttribute('aria-hidden', 'true');
        stage.append(cube);
      }
      const gate = document.createElement('i');
      gate.className = 'loaderFrequencyGate';
      gate.setAttribute('aria-hidden', 'true');
      stage.append(gate);
    }

    const status = loader.querySelector('.loaderStatus span:first-child');
    const percent = loader.querySelector('.loaderPercent');
    let lastPhase = '';
    const phaseWatcher = setInterval(() => {
      if (!loader.isConnected || loader.classList.contains('loaded')) {
        clearInterval(phaseWatcher);
        return;
      }
      const value = Number.parseInt(percent?.textContent || '0', 10) || 0;
      let phase = 'Scanning deep-space signal';
      if (value >= 25) phase = 'Resolving SOS identity';
      if (value >= 50) phase = 'Synchronizing frequency';
      if (value >= 72) phase = 'Orbit system online';
      if (value >= 90) phase = 'Signal lock acquired';
      if (phase !== lastPhase && status) {
        status.textContent = phase;
        lastPhase = phase;
      }
      loader.classList.toggle('loaderCubesActive', value >= 58);
      loader.classList.toggle('loaderSignalLock', value >= 88);
    }, 90);
  }

  function init() {
    enhanceTransition();
    syncDrawerAndNoticeLayers();
    enhanceLoader();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();

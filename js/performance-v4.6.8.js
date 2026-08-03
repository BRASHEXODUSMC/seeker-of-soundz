/* Seeker Of SoundZ v4.6.8 — lightweight diagnostics, storage and performance mode */
(() => {
  'use strict';
  const KEY = 'sos_performance_mode_v1';
  const state = {
    timers: new Set(), intervals: new Set(), listeners: 0,
    fps: 0, frameTime: 0, animationPaused: false
  };

  // Instrument only app activity created after this file loads. Keep native behavior intact.
  const nativeSetTimeout = window.setTimeout.bind(window);
  const nativeClearTimeout = window.clearTimeout.bind(window);
  const nativeSetInterval = window.setInterval.bind(window);
  const nativeClearInterval = window.clearInterval.bind(window);
  // Do not monkey-patch EventTarget.addEventListener/removeEventListener.
  // Some site modules intentionally call a saved listener function without a bound
  // EventTarget. Instrumenting the prototype caused Firefox to pass `undefined` as
  // a WeakMap key and stopped registration scripts from initializing.

  window.setTimeout = function(fn, delay, ...args) {
    let id;
    const wrapped = typeof fn === 'function' ? function(...inner) {
      state.timers.delete(id);
      return fn.apply(this, inner);
    } : fn;
    id = nativeSetTimeout(wrapped, delay, ...args);
    state.timers.add(id);
    return id;
  };
  window.clearTimeout = function(id) { state.timers.delete(id); return nativeClearTimeout(id); };
  window.setInterval = function(fn, delay, ...args) {
    const id = nativeSetInterval(fn, delay, ...args);
    state.intervals.add(id);
    return id;
  };
  window.clearInterval = function(id) { state.intervals.delete(id); return nativeClearInterval(id); };

  // Listener totals are intentionally left at zero. Preserving native browser
  // event behavior is more important than diagnostic listener counting.


  function bytes(value) {
    const n = Number(value) || 0;
    if (n < 1024) return `${n} B`;
    if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
    if (n < 1073741824) return `${(n / 1048576).toFixed(1)} MB`;
    return `${(n / 1073741824).toFixed(2)} GB`;
  }
  function localStorageBytes() {
    let total = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i) || '';
        total += (key.length + (localStorage.getItem(key) || '').length) * 2;
      }
    } catch (_) {}
    return total;
  }
  async function storageEstimate() {
    try { return await navigator.storage?.estimate?.() || {}; } catch (_) { return {}; }
  }
  function memoryInfo() {
    const m = performance.memory;
    return m ? { used: m.usedJSHeapSize, total: m.totalJSHeapSize, limit: m.jsHeapSizeLimit } : null;
  }
  function setPerformanceMode(enabled) {
    localStorage.setItem(KEY, enabled ? '1' : '0');
    document.documentElement.classList.toggle('performance-mode', enabled);
    document.body?.classList.toggle('performance-mode', enabled);
    window.dispatchEvent(new CustomEvent('sos:performance-mode', { detail: { enabled } }));
  }
  function pauseAnimations(paused) {
    state.animationPaused = !!paused;
    document.documentElement.classList.toggle('sos-animations-paused', state.animationPaused);
    window.dispatchEvent(new CustomEvent('sos:animation-pause', { detail: { paused: state.animationPaused } }));
  }
  async function getStats() {
    const estimate = await storageEstimate();
    const mem = memoryInfo();
    return {
      fps: state.fps,
      frameTime: state.frameTime,
      dom: document.getElementsByTagName('*').length,
      localBytes: localStorageBytes(),
      storageUsed: estimate.usage || 0,
      storageQuota: estimate.quota || 0,
      memory: mem,
      timers: state.timers.size,
      intervals: state.intervals.size,
      listeners: state.listeners,
      images: document.images.length,
      audio: document.querySelectorAll('audio').length,
      video: document.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"]').length,
      animations: document.getAnimations ? document.getAnimations().filter(a => a.playState === 'running').length : 0,
      performanceMode: localStorage.getItem(KEY) === '1',
      animationPaused: state.animationPaused
    };
  }
  async function exportData() {
    const payload = { version: '4.6.8', exportedAt: new Date().toISOString(), localStorage: {} };
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i); payload.localStorage[key] = localStorage.getItem(key);
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `seeker-browser-data-${new Date().toISOString().slice(0,10)}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  async function importData(file) {
    const data = JSON.parse(await file.text());
    if (!data || typeof data.localStorage !== 'object') throw new Error('Invalid Seeker browser-data file.');
    Object.entries(data.localStorage).forEach(([k,v]) => localStorage.setItem(k, String(v)));
  }
  async function clearTemporary() {
    const protectedPrefixes = ['sos_users','sos_session','sos_posts','sos_catalog','sos_music','sos_gallery','sos_videos','sos_events','sos_announcements','sos_collab'];
    const remove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || '';
      if ((/cache|temp|draft|preview|seen/i.test(k)) && !protectedPrefixes.some(p => k.startsWith(p))) remove.push(k);
    }
    remove.forEach(k => localStorage.removeItem(k));
    if ('caches' in window) for (const k of await caches.keys()) await caches.delete(k);
    return remove.length;
  }
  async function clearOldAudio() {
    const dbs = await indexedDB.databases?.() || [];
    const audioDbs = dbs.filter(db => /audio|collab|seeker/i.test(db.name || ''));
    for (const db of audioDbs) indexedDB.deleteDatabase(db.name);
    return audioDbs.length;
  }

  let frames = 0, last = performance.now();
  function fpsLoop(now) {
    frames++;
    const elapsed = now - last;
    if (elapsed >= 1000) {
      state.fps = Math.round(frames * 1000 / elapsed);
      state.frameTime = state.fps ? 1000 / state.fps : 0;
      frames = 0; last = now;
    }
    requestAnimationFrame(fpsLoop);
  }
  requestAnimationFrame(fpsLoop);

  setPerformanceMode(localStorage.getItem(KEY) === '1');
  window.SOSPerformance = { state, bytes, getStats, setPerformanceMode, pauseAnimations, exportData, importData, clearTemporary, clearOldAudio };
})();

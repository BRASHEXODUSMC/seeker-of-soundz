(() => {
  'use strict';
  const panel = document.getElementById('adminPanel');
  if (!panel || !window.SOSPerformance) return;
  let refreshId = 0;
  const $ = id => document.getElementById(id);
  const safe = value => String(value ?? '—');

  async function refresh() {
    if (!document.getElementById('performanceDashboard')) return;
    const s = await SOSPerformance.getStats();
    const put = (id, value) => { const el = $(id); if (el) el.textContent = value; };
    put('perfFps', `${s.fps} FPS`); put('perfFrame', `${s.frameTime.toFixed(1)} ms`);
    put('perfDom', s.dom.toLocaleString()); put('perfLocal', SOSPerformance.bytes(s.localBytes));
    put('perfIndexed', SOSPerformance.bytes(Math.max(0, s.storageUsed - s.localBytes)));
    put('perfStorage', `${SOSPerformance.bytes(s.storageUsed)} / ${SOSPerformance.bytes(s.storageQuota)}`);
    put('perfListeners', s.listeners.toLocaleString()); put('perfTimers', `${s.timers} timeouts • ${s.intervals} intervals`);
    put('perfMedia', `${s.images} images • ${s.audio} audio • ${s.video} video`); put('perfAnimations', s.animations);
    put('perfMemory', s.memory ? `${SOSPerformance.bytes(s.memory.used)} used / ${SOSPerformance.bytes(s.memory.total)} allocated` : 'Unavailable in this browser');
    const toggle = $('performanceModeToggle'); if (toggle) toggle.checked = s.performanceMode;
    const pause = $('pauseAnimationsButton'); if (pause) pause.textContent = s.animationPaused ? 'Resume Background Animations' : 'Pause Background Animations';
  }
  function start() { clearInterval(refreshId); refresh(); refreshId = setInterval(refresh, 1500); }
  document.addEventListener('click', async e => {
    if (e.target.closest('[data-panel="performance"]')) setTimeout(start, 180);
    const b = e.target.closest('[data-perf-action]'); if (!b) return;
    const action = b.dataset.perfAction;
    try {
      if (action === 'refresh') await refresh();
      if (action === 'pause') SOSPerformance.pauseAnimations(!SOSPerformance.state.animationPaused);
      if (action === 'export') await SOSPerformance.exportData();
      if (action === 'clear-temp') { const n = await SOSPerformance.clearTemporary(); alert(`Cleared ${n} temporary browser-storage items and cache entries.`); }
      if (action === 'clear-audio' && confirm('Delete locally stored collaboration audio databases? This cannot be undone.')) { const n = await SOSPerformance.clearOldAudio(); alert(`Requested deletion of ${n} audio/collaboration database(s).`); }
      if (action === 'download-report') {
        const report = await SOSPerformance.getStats();
        const blob = new Blob([JSON.stringify({ generatedAt:new Date().toISOString(), url:location.href, userAgent:navigator.userAgent, ...report }, null, 2)], {type:'application/json'});
        const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='seeker-performance-report.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
      }
      await refresh();
    } catch (err) { alert(err.message || 'That action could not be completed.'); }
  });
  document.addEventListener('change', async e => {
    if (e.target.id === 'performanceModeToggle') { SOSPerformance.setPerformanceMode(e.target.checked); await refresh(); }
    if (e.target.id === 'browserDataImport' && e.target.files?.[0]) {
      if (!confirm('Import this browser-data backup and overwrite matching saved values?')) return;
      try { await SOSPerformance.importData(e.target.files[0]); alert('Browser data imported. Reload the site to apply all restored settings.'); }
      catch (err) { alert(err.message || 'Import failed.'); }
      e.target.value = '';
    }
  });
})();

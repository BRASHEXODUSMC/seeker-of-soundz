/* Seeker Of SoundZ v4.16.2 — early loader preferences */
(()=>{
'use strict';
try{
 const saved=JSON.parse(localStorage.getItem('sos_loader_visual_preferences_v4162')||'{}');
 const root=document.documentElement;
 root.classList.toggle('sos-loader-swipe-enabled',saved.loaderSwipe===true);
 const style=['bar','waveform','dual','minimal'].includes(saved.loaderProgressStyle)?saved.loaderProgressStyle:'bar';
 ['bar','waveform','dual','minimal'].forEach(value=>root.classList.toggle(`sos-loader-progress-${value}`,value===style));
 root.classList.toggle('sos-loader-hide-logo',saved.loaderShowLogo===false);
 root.classList.toggle('sos-loader-hide-orbits',saved.loaderShowOrbits===false);
 root.classList.toggle('sos-loader-hide-brand',saved.loaderShowBrand===false);
 root.classList.toggle('sos-loader-hide-subtitle',saved.loaderShowSubtitle===false);
 root.classList.toggle('sos-loader-hide-status',saved.loaderShowStatus===false);
 root.classList.toggle('sos-loader-hide-percent',saved.loaderShowPercent===false);
}catch{}
})();
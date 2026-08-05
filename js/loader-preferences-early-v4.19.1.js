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
 const logoMotion=['pulse','spin','coin','tilt','float','glitch','none'].includes(saved.loaderLogoMotion)?saved.loaderLogoMotion:'pulse';
 const backgroundStyle=['cosmic','void','violet','blue','crimson','emerald','monochrome','aurora','grid'].includes(saved.loaderBackgroundStyle)?saved.loaderBackgroundStyle:'cosmic';
 const backgroundMotion=['still','drift','pulse','rotate','waves'].includes(saved.loaderBackgroundMotion)?saved.loaderBackgroundMotion:'drift';
 const speed=['slow','normal','fast'].includes(saved.loaderLogoSpeed)?saved.loaderLogoSpeed:'normal';
 ['pulse','spin','coin','tilt','float','glitch','none'].forEach(value=>root.classList.toggle(`sos-loader-logo-${value}`,value===logoMotion));
 ['cosmic','void','violet','blue','crimson','emerald','monochrome','aurora','grid'].forEach(value=>root.classList.toggle(`sos-loader-bg-${value}`,value===backgroundStyle));
 ['still','drift','pulse','rotate','waves'].forEach(value=>root.classList.toggle(`sos-loader-bg-motion-${value}`,value===backgroundMotion));
 root.style.setProperty('--sos-loader-logo-duration',speed==='slow'?'8s':speed==='fast'?'2.2s':'4.5s');
}catch{}
})();
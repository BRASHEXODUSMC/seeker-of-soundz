/* Seeker Of SoundZ v4.16.2 — early loader preferences */
(()=>{
'use strict';
try{
 let saved=JSON.parse(localStorage.getItem('sos_loader_visual_preferences_v4162')||'{}');
 const migrationKey='sos_loader_clean_baseline_v4195';
 if(!localStorage.getItem(migrationKey)){
  saved={loader:'signal',loaderSwipe:false,loaderProgressStyle:'bar',loaderBarAnimation:'pulse',loaderShowLogo:true,loaderShowOrbits:true,loaderShowGlow:true,loaderShowParticles:false,loaderShowBrand:true,loaderShowSubtitle:true,loaderShowStatus:true,loaderShowPercent:true,loaderLogoMotion:'pulse',loaderBackgroundStyle:'cosmic',loaderBackgroundMotion:'drift',loaderLogoSpeed:'slow',loaderBrandFont:'modern',loaderCenterEffect:'cubes'};
  localStorage.setItem('sos_loader_visual_preferences_v4162',JSON.stringify(saved));
 }
 const root=document.documentElement;
 root.classList.toggle('sos-loader-swipe-enabled',saved.loaderSwipe===true);
 const style=['bar','waveform','dual','minimal'].includes(saved.loaderProgressStyle)?saved.loaderProgressStyle:'bar';
 ['bar','waveform','dual','minimal'].forEach(value=>root.classList.toggle(`sos-loader-progress-${value}`,value===style));
 root.classList.toggle('sos-loader-hide-logo',saved.loaderShowLogo===false);
 root.classList.toggle('sos-loader-hide-orbits',saved.loaderShowOrbits===false);
 root.classList.toggle('sos-loader-hide-glow',saved.loaderShowGlow===false);
 root.classList.toggle('sos-loader-hide-particles',saved.loaderShowParticles!==true);
 root.classList.toggle('sos-loader-hide-brand',saved.loaderShowBrand===false);
 root.classList.toggle('sos-loader-hide-subtitle',saved.loaderShowSubtitle===false);
 root.classList.toggle('sos-loader-hide-status',saved.loaderShowStatus===false);
 root.classList.toggle('sos-loader-hide-percent',saved.loaderShowPercent===false);
 const logoMotion=['pulse','spin','coin','tilt','float','glitch','none'].includes(saved.loaderLogoMotion)?saved.loaderLogoMotion:'pulse';
 const backgroundStyle=['cosmic','void','violet','blue','crimson','emerald','monochrome','aurora','grid'].includes(saved.loaderBackgroundStyle)?saved.loaderBackgroundStyle:'cosmic';
 const backgroundMotion=['still','drift','pulse','rotate','waves'].includes(saved.loaderBackgroundMotion)?saved.loaderBackgroundMotion:'drift';
 const speed=['slow','normal','fast'].includes(saved.loaderLogoSpeed)?saved.loaderLogoSpeed:'slow';
 const barAnimation=['fill','pulse','scanner','segments','bounce','spectrum','retro','minimal'].includes(saved.loaderBarAnimation)?saved.loaderBarAnimation:'pulse';
 const brandFont=['modern','retro','arcade','digital','mono','wide','serif'].includes(saved.loaderBrandFont)?saved.loaderBrandFont:'modern';
 const centerEffect=['none','cubes','circlewave','orbitdots','radar','equalizer','pulsehalo','sparkorbit','hexring','vinyl'].includes(saved.loaderCenterEffect)?saved.loaderCenterEffect:'cubes';
 ['fill','pulse','scanner','segments','bounce','spectrum','retro','minimal'].forEach(value=>root.classList.toggle(`sos-loader-bar-${value}`,value===barAnimation));
 ['modern','retro','arcade','digital','mono','wide','serif'].forEach(value=>root.classList.toggle(`sos-loader-font-${value}`,value===brandFont));
 ['none','cubes','circlewave','orbitdots','radar','equalizer','pulsehalo','sparkorbit','hexring','vinyl'].forEach(value=>root.classList.toggle(`sos-loader-center-${value}`,value===centerEffect));

 ['pulse','spin','coin','tilt','float','glitch','none'].forEach(value=>root.classList.toggle(`sos-loader-logo-${value}`,value===logoMotion));
 ['cosmic','void','violet','blue','crimson','emerald','monochrome','aurora','grid'].forEach(value=>root.classList.toggle(`sos-loader-bg-${value}`,value===backgroundStyle));
 ['still','drift','pulse','rotate','waves'].forEach(value=>root.classList.toggle(`sos-loader-bg-motion-${value}`,value===backgroundMotion));
 root.style.setProperty('--sos-loader-logo-duration',speed==='slow'?'8s':speed==='fast'?'2.2s':'4.5s');
}catch{}
})();
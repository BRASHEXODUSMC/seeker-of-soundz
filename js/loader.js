/* Seeker Of SoundZ v4.13.5 — stable once-per-session loader */
(()=>{
  'use strict';
  window.__SOS_LOADER_V4135__=true;
  const KEY='sos_loader_seen_v4_13_5';
  const loader=document.getElementById('loader');
  if(!loader)return;

  const hideImmediately=()=>{
    loader.classList.add('loaded');
    loader.setAttribute('aria-hidden','true');
  };

  if(sessionStorage.getItem(KEY)==='1'){
    hideImmediately();
    return;
  }

  // Mark this session immediately so page-to-page navigation never flashes the loader.
  sessionStorage.setItem(KEY,'1');
  document.documentElement.classList.add('sosLoaderRunning');
  loader.classList.remove('loaded','loaderComplete');
  loader.setAttribute('aria-hidden','false');

  const bar=loader.querySelector('.loaderProgress');
  const percent=loader.querySelector('.loaderPercent');
  const logo=loader.querySelector('.loaderLogoImage');
  const duration=1250;
  const started=performance.now();
  let finished=false;

  function setProgress(value){
    const n=Math.max(0,Math.min(100,Math.round(value)));
    if(bar)bar.style.width=n+'%';
    if(percent)percent.textContent=n+'%';
    loader.style.setProperty('--loader-progress',String(n/100));
  }

  function finish(){
    if(finished)return;
    finished=true;
    setProgress(100);
    loader.classList.add('loaderComplete');
    setTimeout(()=>{
      loader.classList.add('loaded');
      loader.setAttribute('aria-hidden','true');
      document.documentElement.classList.remove('sosLoaderRunning');
    },220);
  }

  function frame(now){
    if(finished)return;
    const elapsed=now-started;
    const linear=Math.min(1,elapsed/duration);
    const eased=1-Math.pow(1-linear,3);
    setProgress(eased*100);
    if(linear>=1)finish(); else requestAnimationFrame(frame);
  }

  // Decode the logo before animating where supported; fixed dimensions prevent layout movement.
  if(logo?.decode)logo.decode().catch(()=>{}).finally(()=>requestAnimationFrame(frame));
  else requestAnimationFrame(frame);
  setTimeout(finish,2200);
})();

/* Seeker Of SoundZ v4.13.5 — exclusive, logo-free page transitions */
(()=>{
  'use strict';
  window.__SOS_TRANSITION_V4135__=true;
  const MODES=new Set(['stellar','fade','aperture','warp','scan','cubes','minimal']);
  const DURATIONS={stellar:360,fade:250,aperture:360,warp:390,scan:330,cubes:380,minimal:0};
  let busy=false;
  let navTimer=0;

  function selectedMode(){
    const saved=window.SOSExperience?.get?.()?.transition;
    const mode=MODES.has(saved)?saved:'stellar';
    return matchMedia('(prefers-reduced-motion: reduce)').matches?'minimal':mode;
  }

  function removeLegacyLayers(){
    document.querySelectorAll('#cubeTransition,.cubeTransition,.pageTransition,.transitionOverlay').forEach(el=>el.remove());
    document.body?.classList.remove('page-transitioning');
    document.documentElement.classList.remove('sosNavigating');
  }

  function getOverlay(){
    let el=document.getElementById('sosPageTransition');
    if(!el){
      el=document.createElement('div');
      el.id='sosPageTransition';
      el.setAttribute('aria-hidden','true');
      document.body.appendChild(el);
    }
    return el;
  }

  function effectMarkup(mode){
    switch(mode){
      case 'fade': return '<div class="sosFx sosFxFade"></div>';
      case 'aperture': return '<div class="sosFx sosFxAperture"><i></i><i></i></div>';
      case 'warp': return '<div class="sosFx sosFxWarp"><i></i><i></i><i></i><i></i><i></i><i></i></div>';
      case 'scan': return '<div class="sosFx sosFxScan"><i></i></div>';
      case 'cubes': return '<div class="sosFx sosFxCubes"><i></i><i></i><i></i><i></i></div>';
      case 'stellar':
      default: return '<div class="sosFx sosFxStellar"><i class="ring one"></i><i class="ring two"></i><i class="core"></i></div>';
    }
  }

  function reset(){
    clearTimeout(navTimer);
    busy=false;
    removeLegacyLayers();
    const el=document.getElementById('sosPageTransition');
    if(el){
      el.className='';
      el.removeAttribute('data-mode');
      el.replaceChildren();
    }
  }

  function eligible(anchor,event){
    if(!anchor||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return null;
    if(anchor.target&&anchor.target!=='_self'||anchor.hasAttribute('download')||anchor.dataset.noTransition!==undefined)return null;
    const href=anchor.getAttribute('href')||'';
    if(!href||href.startsWith('#')||/^(mailto:|tel:|javascript:)/i.test(href))return null;
    const url=new URL(anchor.href,location.href);
    if(url.origin!==location.origin||url.href===location.href)return null;
    return url;
  }

  function navigate(url){
    if(busy)return;
    busy=true;
    removeLegacyLayers();
    const mode=selectedMode();
    if(mode==='minimal'){
      location.assign(url.href);
      return;
    }
    const overlay=getOverlay();
    overlay.className='';
    overlay.dataset.mode=mode;
    overlay.innerHTML=effectMarkup(mode);
    document.documentElement.classList.add('sosNavigating');
    // Force exactly one clean animation cycle.
    void overlay.offsetWidth;
    requestAnimationFrame(()=>{
      overlay.classList.add('isActive');
      navTimer=setTimeout(()=>location.assign(url.href),DURATIONS[mode]||360);
    });
  }

  document.addEventListener('click',event=>{
    const anchor=event.target.closest?.('a[href]');
    const url=eligible(anchor,event);
    if(!url)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    navigate(url);
  },true);

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{removeLegacyLayers();getOverlay();},{once:true});
  else {removeLegacyLayers();getOverlay();}
  addEventListener('pageshow',reset);
  addEventListener('pagehide',()=>{busy=false;});
  window.SOSTransitions={getMode:selectedMode,play:value=>navigate(new URL(value,location.href)),reset};
})();

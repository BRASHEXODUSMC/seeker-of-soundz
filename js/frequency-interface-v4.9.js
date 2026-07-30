/* Seeker Of SoundZ v4.9 — The Frequency Interface */
(() => {
  'use strict';

  const root = document.documentElement;
  const page = (location.pathname.split('/').pop() || 'index.html').replace('.html','').replace(/[^a-z0-9-]/gi,'');
  document.body.classList.add(`fi-page-${page === 'index' ? 'home' : page}`);

  const performanceMode = () => root.classList.contains('performance-mode');
  const pointer = { x: innerWidth / 2, y: innerHeight / 2, active: false };
  addEventListener('pointermove', e => { pointer.x=e.clientX; pointer.y=e.clientY; pointer.active=true; }, {passive:true});
  addEventListener('pointerleave', () => pointer.active=false, {passive:true});

  function makeCanvas(host, className, height=90) {
    const canvas=document.createElement('canvas');
    canvas.className=className;
    canvas.setAttribute('aria-hidden','true');
    host.appendChild(canvas);
    const ctx=canvas.getContext('2d',{alpha:true,desynchronized:true});
    if(!ctx) return null;
    const state={canvas,ctx,width:1,height,dpr:1,phase:Math.random()*10,level:0};
    const resize=()=>{
      const rect=canvas.getBoundingClientRect();
      state.width=Math.max(1,rect.width||innerWidth); state.height=Math.max(1,rect.height||height);
      state.dpr=Math.min(devicePixelRatio||1,1.25);
      canvas.width=Math.round(state.width*state.dpr); canvas.height=Math.round(state.height*state.dpr);
      ctx.setTransform(state.dpr,0,0,state.dpr,0,0);
    };
    resize(); addEventListener('resize',resize,{passive:true});
    return state;
  }

  const waves=[];
  function addWave(host,className,height,kind='line'){
    const state=makeCanvas(host,className,height); if(!state)return;
    state.kind=kind; waves.push(state);
  }

  const hero=document.getElementById('hero') || document.querySelector('.pageHero');
  if(hero){
    const stage=document.createElement('div'); stage.className='frequencyStage'; hero.prepend(stage);
    addWave(stage,'frequencyLineCanvas',110,'hero');
  }
  if(document.getElementById('hero')){
    const ring=document.createElement('div'); ring.className='heroFrequencyRing';
    document.getElementById('hero').prepend(ring); addWave(ring,'heroFrequencyRingCanvas',650,'ring');
  }
  const nav=document.getElementById('mainNav'); if(nav)addWave(nav,'navFrequencyCanvas',22,'nav');
  [...document.querySelectorAll('.section')].forEach((section,index)=>{
    if(index%2!==0 || index>12)return;
    addWave(section,'sectionFrequencyCanvas',60,'section');
  });
  document.querySelectorAll('.primaryButton,.secondaryButton,.smallAction,.navIconButton').forEach(el=>el.classList.add('signalButton'));

  let last=0,raf=0;
  function drawWave(state,now){
    const {ctx,width,height,kind}=state; ctx.clearRect(0,0,width,height);
    const audio=Number(getComputedStyle(root).getPropertyValue('--fi-audio-level'))||0;
    const rect=state.canvas.getBoundingClientRect();
    const near=pointer.active && pointer.y>=rect.top-90 && pointer.y<=rect.bottom+90;
    const proximity=near?Math.max(0,1-Math.abs(pointer.y-(rect.top+rect.height/2))/160):0;
    const amp=(kind==='ring'?9:kind==='hero'?7:kind==='nav'?1.7:2.5) + proximity*(kind==='hero'?8:3) + audio*(kind==='ring'?15:7);
    const alpha=(kind==='nav'?.16:kind==='hero'?.22:.12)+proximity*.12+audio*.12;
    ctx.lineWidth=kind==='ring'?.65:.7;
    ctx.strokeStyle=`rgba(190,155,211,${alpha})`;
    ctx.shadowBlur=6+audio*8; ctx.shadowColor='rgba(147,91,177,.25)';
    ctx.beginPath();
    if(kind==='ring'){
      const cx=width/2,cy=height/2,r=Math.min(width,height)*.405,points=180;
      for(let i=0;i<=points;i++){
        const a=(i/points)*Math.PI*2;
        const pulse=Math.sin(a*7+now*.0014+state.phase)*amp + Math.sin(a*13-now*.0008)*amp*.28;
        const rr=r+pulse;
        const x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr;
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      ctx.closePath();
    }else{
      for(let x=0;x<=width;x+=3){
        const norm=x/width;
        const envelope=Math.sin(Math.PI*norm);
        const y=height/2 + (Math.sin(x*.035+now*.00125+state.phase)*amp + Math.sin(x*.081-now*.0007)*amp*.28)*envelope;
        x?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
    }
    ctx.stroke(); ctx.shadowBlur=0;
  }
  function frame(now){
    raf=requestAnimationFrame(frame); if(performanceMode()||document.hidden||now-last<33)return; last=now;
    waves.forEach(w=>drawWave(w,now));
  }
  raf=requestAnimationFrame(frame);
  addEventListener('pagehide',()=>cancelAnimationFrame(raf),{once:true});

  // Consistent reveal vocabulary.
  const textSelectors='h1,h2,.sectionHeading,.pageHeroContent,.heroContent';
  const cardSelectors='.card,.authCard,.forumPost,.forumTopicCard,.musicFeatureCard,.releaseCard,.musicCommerceCard,.videoFeature,.videoCard,.merchCard,.productCard,.memberCard,.profileCard,.collabCard,.collabProjectCard,.adminCard,.adminPanel,.eventCard,.featuredEvent,.producerHeroCard';
  const mediaSelectors='.featuredTrackArtwork,.musicFeatureArtwork,.videoFrame,.fullGalleryItem,.galleryItem,.featuredEventImage';
  document.querySelectorAll(textSelectors).forEach(el=>el.classList.add('fi-reveal-text'));
  document.querySelectorAll(cardSelectors).forEach(el=>el.classList.add('fi-reveal-card'));
  document.querySelectorAll(mediaSelectors).forEach(el=>el.classList.add('fi-reveal-media'));
  const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add('fi-visible');revealObserver.unobserve(entry.target)}
  }),{threshold:.08,rootMargin:'0px 0px -4%'});
  document.querySelectorAll('.fi-reveal-text,.fi-reveal-card,.fi-reveal-media').forEach(el=>revealObserver.observe(el));

  // Audio-reactive mode. Uses real amplitude when available, graceful pulse fallback otherwise.
  let audioCtx=null, analyser=null, data=null, currentAudio=null, audioRaf=0, fallbackPhase=0;
  function stopAudioReactive(){
    root.classList.remove('audio-reactive'); root.style.setProperty('--fi-audio-level','0');
    currentAudio=null; cancelAnimationFrame(audioRaf);
  }
  function updateAudio(){
    if(!currentAudio || currentAudio.paused || currentAudio.ended || performanceMode()){stopAudioReactive();return}
    let level=.16+.1*Math.sin(fallbackPhase+=.08);
    if(analyser&&data){
      analyser.getByteFrequencyData(data);
      let total=0; for(let i=0;i<data.length;i++) total+=data[i];
      level=Math.min(1,(total/data.length)/110);
    }
    root.style.setProperty('--fi-audio-level',level.toFixed(3));
    window.dispatchEvent(new CustomEvent('sos:audio-level',{detail:{level}}));
    audioRaf=requestAnimationFrame(updateAudio);
  }
  async function startAudioReactive(audio){
    if(performanceMode())return;
    currentAudio=audio; root.classList.add('audio-reactive');
    try{
      audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();
      await audioCtx.resume();
      if(!audio.__sosSource){audio.__sosSource=audioCtx.createMediaElementSource(audio);analyser=audioCtx.createAnalyser();analyser.fftSize=128;audio.__sosSource.connect(analyser);analyser.connect(audioCtx.destination);data=new Uint8Array(analyser.frequencyBinCount)}
    }catch(_){analyser=null;data=null}
    cancelAnimationFrame(audioRaf); updateAudio();
  }
  document.addEventListener('play',e=>{if(e.target instanceof HTMLAudioElement)startAudioReactive(e.target)},{capture:true});
  document.addEventListener('pause',e=>{if(e.target===currentAudio)stopAudioReactive()},{capture:true});
  document.addEventListener('ended',e=>{if(e.target===currentAudio)stopAudioReactive()},{capture:true});
  addEventListener('sos:performance-mode',e=>{if(e.detail?.enabled)stopAudioReactive()});

  // Loader signal acquisition, preserving existing loader mechanics.
  const loader=document.getElementById('loader');
  if(loader){
    const scene=document.createElement('div'); scene.className='loaderSignalAcquisition';
    scene.innerHTML='<div class="loaderSignalLine"></div><div class="loaderSignalSweep"></div><div class="loaderLockNode"></div>';
    loader.prepend(scene); addWave(scene.querySelector('.loaderSignalLine'),'loaderSignalCanvas',90,'loader');
    const status=loader.querySelector('.loaderStatus span:first-child');
    const sequence=[['Searching for signal',120],['Resolving SOS identity',620],['Synchronizing frequency',1180],['Signal locked',1760]];
    sequence.forEach(([text,delay],index)=>setTimeout(()=>{
      if(loader.classList.contains('loaded'))return;
      if(status)status.textContent=text;
      if(index===2)loader.classList.add('loaderCubesActive');
      if(index===3)loader.classList.add('loaderSignalLock');
    },delay));
  }
})();

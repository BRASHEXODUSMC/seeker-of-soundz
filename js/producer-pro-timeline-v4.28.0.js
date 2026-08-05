/* Seeker Of SoundZ v4.25.0 — Pro Timeline and true beat-synced camera motion */
(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const hub=$('#producerHubV4190');
const timeline=$('.producerTimelineV4190');
const viewport=$('#timelineViewportV4250');
const content=$('#timelineContentV4250');
const tracks=$('#timelineTracksV4190');
const ruler=$('#timelineRulerV4190');
const playhead=$('#timelinePlayheadV4190');
const zoomInput=$('#timelineZoomV4190');
const zoomLabel=$('#timelineZoomLabelV4250');
const video=$('#composerPreviewVideoV4180');
if(!hub||!timeline||!viewport||!content||!tracks||!ruler||!playhead)return;

const duration=()=>window.SOSVideoClipsV4240?.totalDuration?.()||Number(video?.duration||60)||60;
const globalTime=()=>window.SOSVideoClipsV4240?.globalTime?.()||Number(video?.currentTime||0);
let zoom=Number(zoomInput?.value||1);
let inertialVelocity=0;
let inertialFrame=0;
let selectedBeat=null;
let cameraRegions=[];
let autosyncEffectRegions=[];
let pendingAutoSync=false;

function resizeTimeline(){
 const hubRect=hub.getBoundingClientRect();
 timeline.style.setProperty('--producer-hub-width',`${Math.max(320,hubRect.width)}px`);
 timeline.style.maxWidth=`${Math.max(320,hubRect.width)}px`;
 viewport.style.maxWidth='100%';
 requestAnimationFrame(renderRulerAligned);
}
new ResizeObserver(resizeTimeline).observe(hub);
window.addEventListener('resize',resizeTimeline);
resizeTimeline();

/* Lane height resizing */
$$('.laneResizeHandleV4250').forEach(handle=>{
 const article=handle.closest('article');
 let startY=0,startHeight=0;
 handle.addEventListener('pointerdown',event=>{
  event.preventDefault();startY=event.clientY;startHeight=article.getBoundingClientRect().height;
  handle.setPointerCapture?.(event.pointerId);article.classList.add('isResizingV4250');
 });
 handle.addEventListener('pointermove',event=>{
  if(!article.classList.contains('isResizingV4250'))return;
  const next=Math.max(48,Math.min(300,startHeight+event.clientY-startY));
  article.style.setProperty('--lane-height',`${next}px`);
 });
 const finish=()=>article.classList.remove('isResizingV4250');
 handle.addEventListener('pointerup',finish);handle.addEventListener('pointercancel',finish);
});

/* Zoom around playhead instead of left edge */
function playheadFraction(){return Math.max(0,Math.min(1,globalTime()/Math.max(.01,duration())))}
function applyZoom(next,anchorFraction=playheadFraction()){
 const oldWidth=content.scrollWidth||viewport.clientWidth;
 const viewAnchor=viewport.clientWidth*.5;
 const timelineX=viewport.scrollLeft+viewAnchor;
 const logical=oldWidth?timelineX/oldWidth:anchorFraction;
 zoom=Math.max(1,Math.min(8,next));
 if(zoomInput)zoomInput.value=String(zoom);
 content.style.width=`${zoom*100}%`;ruler.style.width='100%';tracks.style.width='100%';
 if(zoomLabel)zoomLabel.textContent=`${Math.round(zoom*100)}%`;
 requestAnimationFrame(()=>{
  const newWidth=content.scrollWidth;
  const preferred=Math.max(anchorFraction,logical);
  viewport.scrollLeft=Math.max(0,preferred*newWidth-viewAnchor);
  renderRulerAligned();
 });
}
zoomInput?.addEventListener('input',event=>applyZoom(Number(event.target.value)));
$('#timelineZoomInV4190')?.addEventListener('click',event=>{event.stopImmediatePropagation();applyZoom(zoom+.25)},true);
$('#timelineZoomOutV4190')?.addEventListener('click',event=>{event.stopImmediatePropagation();applyZoom(zoom-.25)},true);
$('#timelineFitV4250')?.addEventListener('click',()=>applyZoom(1,0));
applyZoom(zoom);

/* Two-axis timeline scrolling.
   Normal wheel scrolls vertically through lanes.
   Shift+wheel and horizontal trackpads scroll sideways.
   Ctrl+wheel zooms around the playhead. */
let verticalVelocity=0;
viewport.addEventListener('wheel',event=>{
 if(Math.abs(event.deltaX)<1&&Math.abs(event.deltaY)<1)return;
 if(event.ctrlKey||event.metaKey){
  event.preventDefault();
  applyZoom(zoom+(event.deltaY<0?.25:-.25));
  return;
 }
 const horizontal=event.shiftKey||Math.abs(event.deltaX)>Math.abs(event.deltaY);
 if(horizontal){
  event.preventDefault();
  inertialVelocity+=(Math.abs(event.deltaX)>Math.abs(event.deltaY)?event.deltaX:event.deltaY)*.72;
 }else{
  event.preventDefault();
  verticalVelocity+=event.deltaY*.72;
 }
 cancelAnimationFrame(inertialFrame);
 const glide=()=>{
  if(Math.abs(inertialVelocity)>.25){viewport.scrollLeft+=inertialVelocity;inertialVelocity*=.86}else inertialVelocity=0;
  if(Math.abs(verticalVelocity)>.25){viewport.scrollTop+=verticalVelocity;verticalVelocity*=.86}else verticalVelocity=0;
  if(inertialVelocity||verticalVelocity)inertialFrame=requestAnimationFrame(glide);
 };
 inertialFrame=requestAnimationFrame(glide);
},{passive:false});

/* Middle-mouse pan for large timelines. */
let middlePan=null;
viewport.addEventListener('pointerdown',event=>{
 if(event.button!==1)return;
 event.preventDefault();
 middlePan={x:event.clientX,y:event.clientY,left:viewport.scrollLeft,top:viewport.scrollTop,pointer:event.pointerId};
 viewport.classList.add('isMiddlePanningV4251');
 viewport.setPointerCapture?.(event.pointerId);
});
viewport.addEventListener('pointermove',event=>{
 if(!middlePan||event.pointerId!==middlePan.pointer)return;
 viewport.scrollLeft=middlePan.left-(event.clientX-middlePan.x);
 viewport.scrollTop=middlePan.top-(event.clientY-middlePan.y);
});
function stopMiddlePan(event){
 if(!middlePan)return;
 if(event&&event.pointerId!==undefined&&event.pointerId!==middlePan.pointer)return;
 middlePan=null;viewport.classList.remove('isMiddlePanningV4251');
}
viewport.addEventListener('pointerup',stopMiddlePan);
viewport.addEventListener('pointercancel',stopMiddlePan);
viewport.addEventListener('auxclick',event=>{if(event.button===1)event.preventDefault()});

/* Ruler and beat markers remain visually aligned */
function renderRulerAligned(){
 const total=Math.max(1,duration()),visibleWidth=Math.max(viewport.clientWidth,content.scrollWidth);
 const targetTicks=Math.max(10,Math.min(160,Math.round(visibleWidth/75)));
 ruler.innerHTML=Array.from({length:targetTicks+1},(_,index)=>{
  const time=total*index/targetTicks;
  const major=index%5===0;
  return `<span class="${major?'isMajorV4250':''}" style="left:${index/targetTicks*100}%"><i></i><b>${format(time)}</b></span>`;
 }).join('');
 snapBeatMarkers();
}
function format(seconds){const m=Math.floor(seconds/60),s=Math.floor(seconds%60);return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
function snapBeatMarkers(){
 const total=Math.max(.01,duration());
 $$('[data-marker-time]').forEach(marker=>{
  const time=Number(marker.dataset.markerTime)||0;
  marker.style.left=`${time/total*100}%`;
  marker.style.setProperty('--marker-time',String(time));
 });
}
new MutationObserver(()=>{snapBeatMarkers();bindBeatSelection()}).observe($('#timelineMarkerLaneV4190'),{childList:true,subtree:true});
renderRulerAligned();

function bindBeatSelection(){
 $$('[data-marker-time]').forEach(marker=>{
  if(marker.dataset.proBound==='1')return;marker.dataset.proBound='1';
  marker.addEventListener('click',event=>{
   selectedBeat=Number(marker.dataset.markerTime);
   $$('[data-marker-time]').forEach(item=>item.classList.toggle('isSelectedV4250',item===marker));
   const lane=marker.closest('[data-track="markers"]')||marker.parentElement;
   lane?.scrollIntoView?.({block:'nearest',inline:'nearest'});
   const button=$('#placeEffectOnBeatV4250');if(button)button.disabled=!$('#timelineEffectSelectV4240')?.value;
   event.stopPropagation();
  });
 });
}
bindBeatSelection();
$('#timelineEffectSelectV4240')?.addEventListener('change',()=>{
 const button=$('#placeEffectOnBeatV4250');if(button)button.disabled=!(selectedBeat!==null&&$('#timelineEffectSelectV4240').value);
});
$('#placeEffectOnBeatV4250')?.addEventListener('click',()=>{
 const effect=$('#timelineEffectSelectV4240')?.value;if(!effect||selectedBeat===null)return;
 const length=Number($('#timelineBeatEffectDurationV4250')?.value||.25);
 const input=$(`[data-effect="${CSS.escape(effect)}"]`);
 const name=input?.closest('label')?.querySelector('strong')?.textContent?.trim()||effect;
 window.SOSTimedEffectsV4240?.addRegion?.({effect,name,start:Math.max(0,selectedBeat-length*.18),end:Math.min(duration(),selectedBeat+length*.82),auto:false,beat:true});
});

/* True camera-motion regions generated by Auto-Sync */
const cameraPatterns={
 balanced:['auto-impact','auto-zoom-in','auto-shake','auto-rotate-right','auto-zoom-out','auto-rotate-left'],
 heavy:['auto-impact','auto-shake','auto-zoom-in','auto-shake','auto-impact','auto-zoom-out'],
 cinematic:['auto-zoom-in','auto-rotate-right','auto-zoom-out','auto-rotate-left'],
 chaos:['auto-shake','auto-rotate-left','auto-impact','auto-rotate-right','auto-zoom-in','auto-shake']
};
const visualPatterns={
 balanced:['beatZoom','dropFlash','glow','rgb','reactiveParticles','bassSparks'],
 heavy:['dropFlash','shake','beatZoom','strobe','impactExplosion','bassSparks','dropConfetti'],
 cinematic:['lightLeaks','horizonGlow','beatZoom','glow','audioTrails','frequencyOrbs'],
 chaos:['glitchBars','rgb','shake','dropFlash','reactiveParticles','fireBurst','purpleSmoke']
};
const effectPools={
 glitch:['glitchBars','rgb','heavyStatic','vhs','signalTear','chromaticPulse'],
 light:['dropFlash','glow','lightLeaks','horizonGlow','strobe','laserGrid'],
 particles:['reactiveParticles','bassSparks','beatDust','frequencyOrbs','dropConfetti','audioTrails','particles','sparkles'],
 fire:['drawnFire','fireBurst','emberStorm','cartoonExplosion','impactExplosion','shockwave','fireSmokeCombo'],
 smoke:['rollingSmoke','smokeSwipeLeft','smokeSwipeRight','smokeRise','purpleSmoke'],
 waveform:['waveform','audioBars','oscilloscope','circleSpectrum']
};
function selectedAutoSyncEffects(pattern){
 const selected=$$('[data-autosync-pool]:checked').flatMap(input=>effectPools[input.dataset.autosyncPool]||[]);
 const fallback=visualPatterns[pattern]||visualPatterns.balanced;
 return [...new Set([...fallback,...selected])];
}
function beatRows(){
 return $$('[data-marker-time]').map((marker,index)=>({time:Number(marker.dataset.markerTime),drop:marker.classList.contains('isDrop'),index})).filter(row=>Number.isFinite(row.time));
}
function generateAutoSync(){
 const beats=beatRows();
 if(!beats.length){$('#autoSyncStatusV4250').textContent='Analyze Beats first so Auto-Sync has marker locations.';return false}
 const pattern=$('#autoSyncPatternV4250')?.value||'balanced';
 const density=Math.max(1,Number($('#autoSyncDensityV4250')?.value||4));
 const strength=Number($('#autoSyncCameraStrengthV4250')?.value||.9);
 const motions=cameraPatterns[pattern]||cameraPatterns.balanced;
 const visuals=selectedAutoSyncEffects(pattern);
 const overlap=Math.max(1,Math.min(4,Number($('#autoSyncOverlapV4280')?.value||2)));
 cameraRegions=[];window.SOSTimedEffectsV4240?.clearAuto?.();autosyncEffectRegions=[];
 beats.forEach((beat,index)=>{
  if(index%density!==0&&!beat.drop)return;
  const next=beats[index+1]?.time??Math.min(duration(),beat.time+.65);
  const baseLength=Math.max(.12,Math.min(1.5,(next-beat.time)*.95));
  if($('#autoSyncAddCameraV4250')?.checked){
   cameraRegions.push({start:beat.time,end:Math.min(duration(),beat.time+baseLength),motion:motions[(index/density|0)%motions.length],strength:beat.drop?strength*1.35:strength,auto:true});
  }
  if($('#autoSyncAddVisualsV4250')?.checked&&visuals.length){
   for(let layer=0;layer<overlap;layer++){
    const effect=visuals[(index*overlap+layer*3)%visuals.length];
    const input=$(`[data-effect="${CSS.escape(effect)}"]`);
    const name=input?.closest('label')?.querySelector('strong')?.textContent?.trim()||effect;
    const stagger=Math.min(.08,baseLength*.12)*layer;
    const length=Math.max(.1,baseLength*(1-layer*.08));
    const region={effect,name,start:Math.max(0,beat.time-stagger),end:Math.min(duration(),beat.time+length),auto:true,beat:true,layer};
    autosyncEffectRegions.push(region);window.SOSTimedEffectsV4240?.addRegion?.(region);
   }
  }
 });
 renderCameraRegions();
 $('#autoSyncStatusV4250').textContent=`Generated ${cameraRegions.length} true camera moves and ${autosyncEffectRegions.length} overlapping overlay regions from ${beats.length} beat markers.`;
 return true;
}
function renderCameraRegions(){
 let lane=$('#timelineCameraLaneV4250');
 if(!lane){
  const effectsArticle=$('[data-track="effects"]');
  lane=document.createElement('div');lane.id='timelineCameraLaneV4250';lane.className='timelineCameraLaneV4250';
  effectsArticle?.appendChild(lane);
 }
 const total=Math.max(.01,duration());
 lane.innerHTML=cameraRegions.map(region=>`<article style="left:${region.start/total*100}%;width:${(region.end-region.start)/total*100}%" title="${region.motion}"><strong>${region.motion.replace('auto-','').replaceAll('-',' ')}</strong></article>`).join('');
}
window.SOSAutoCameraV4250={
 state(time){
  const region=cameraRegions.find(item=>time>=item.start&&time<=item.end);
  if(!region)return null;
  return {...region,progress:(time-region.start)/Math.max(.01,region.end-region.start)};
 },
 regions:()=>cameraRegions.map(item=>({...item})),
 clear(){cameraRegions=[];renderCameraRegions()}
};
window.SOSProducerAutoSyncV4270={
 generate:generateAutoSync,
 refreshBeats:()=>{renderRulerAligned();bindBeatSelection();return beatRows()},
 beatRows
};
$('#autoSyncEffectsV4190')?.addEventListener('click',event=>{
 event.preventDefault();
 if(!beatRows().length){pendingAutoSync=true;$('#analyzeBeatsV4190')?.click();$('#autoSyncStatusV4250').textContent='Analyzing beats… Auto-Sync will continue automatically.';return}
 pendingAutoSync=false;generateAutoSync();
 window.SOS?.toast?.('True camera motion and timed effects were synchronized to the beat.',{title:'Auto-Sync',icon:'✓'});
},true);
window.addEventListener('sos:beat-analysis-complete',()=>{
 setTimeout(()=>{
  renderRulerAligned();bindBeatSelection();
  if(pendingAutoSync){pendingAutoSync=false;generateAutoSync();window.SOS?.toast?.('Beat analysis finished and true camera motion was generated.',{title:'Auto-Sync',icon:'✓'})}
 },80);
});
$('#clearAutoSyncV4250')?.addEventListener('click',()=>{
 cameraRegions=[];autosyncEffectRegions=[];window.SOSTimedEffectsV4240?.clearAuto?.();renderCameraRegions();$('#autoSyncStatusV4250').textContent='Auto-Sync regions cleared.';
});

/* Clip transition drawing on the real canvas */
window.SOSClipTransitionsV4250={
 draw(ctx,w,h,time){
  const api=window.SOSVideoClipsV4240,clips=api?.clipsRef?.();if(!clips?.length)return;
  let offset=0;
  for(let index=0;index<clips.length-1;index++){
   const clip=clips[index],end=offset+clip.duration,d=Math.max(.15,Number(clip.transitionDuration||.5)),start=end-d;
   if(time>=start&&time<=end&&clip.transitionAfter&&clip.transitionAfter!=='none'){
    const p=(time-start)/d;ctx.save();
    if(clip.transitionAfter==='crossfade'||clip.transitionAfter==='dip-black'){ctx.fillStyle=`rgba(0,0,0,${clip.transitionAfter==='dip-black'?Math.sin(p*Math.PI):p*.65})`;ctx.fillRect(0,0,w,h)}
    if(clip.transitionAfter==='flash'){ctx.fillStyle=`rgba(255,255,255,${Math.sin(p*Math.PI)})`;ctx.fillRect(0,0,w,h)}
    if(clip.transitionAfter==='wipe'){ctx.fillStyle='#000';ctx.fillRect(w*p,0,w*(1-p),h)}
    if(clip.transitionAfter==='glitch'){for(let i=0;i<12;i++){const y=Math.random()*h,bh=3+Math.random()*24;ctx.globalAlpha=.5;ctx.drawImage(ctx.canvas,0,y,w,bh,(Math.random()-.5)*70,y,w,bh)}}
    if(clip.transitionAfter==='zoom'){ctx.fillStyle=`rgba(255,255,255,${Math.sin(p*Math.PI)*.18})`;ctx.fillRect(0,0,w,h)}
    if(clip.transitionAfter==='spin'){ctx.fillStyle=`rgba(0,0,0,${Math.sin(p*Math.PI)*.22})`;ctx.fillRect(0,0,w,h)}
    ctx.restore();
   }
   offset=end;
  }
 }
};
})();

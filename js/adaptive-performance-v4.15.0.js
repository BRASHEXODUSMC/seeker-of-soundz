/* Seeker Of SoundZ v4.15.0 — adaptive performance coordinator */
(()=>{
'use strict';
const root=document.documentElement;
let frames=0,start=0,lastChange=0,raf=0;
const coarse=matchMedia('(pointer:coarse)').matches;
const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
const saved=localStorage.getItem('sos_adaptive_performance_v415');
let low=saved==='low'||reduced;

function apply(next,reason){
 if(low===next&&root.classList.contains('sos-adaptive-ready'))return;
 low=next;
 root.classList.toggle('sos-adaptive-low',low);
 root.classList.add('sos-adaptive-ready');
 root.dataset.performanceReason=reason||'automatic';
 localStorage.setItem('sos_adaptive_performance_v415',low?'low':'balanced');
 window.dispatchEvent(new CustomEvent('sos:adaptive-performance',{detail:{low,reason}}));
}
function sample(now){
 if(!start)start=now;
 frames++;
 const elapsed=now-start;
 if(elapsed>=3500){
  const fps=frames*1000/elapsed;
  // Enter a lighter mode only when the browser is genuinely struggling.
  if(fps<46&&now-lastChange>7000){apply(true,'measured-low-fps');lastChange=now}
  else if(fps>56&&low&&!reduced&&!coarse&&now-lastChange>14000){apply(false,'measured-recovery');lastChange=now}
  frames=0;start=now;
 }
 raf=requestAnimationFrame(sample);
}
function visibility(){
 root.classList.toggle('sos-page-hidden',document.hidden);
 if(document.hidden)root.classList.add('sos-animations-paused');
 else root.classList.remove('sos-animations-paused');
}
function pruneDuplicateEffects(){
 const selectors=['#snowCanvas','#sosStarfield','#sosParticleStars','#sosTwinkleField'];
 const nodes=selectors.flatMap(s=>[...document.querySelectorAll(s)]);
 if(nodes.length>1)nodes.slice(0,-1).forEach(n=>n.remove());
}
function boot(){
 apply(low||coarse,'startup');
 pruneDuplicateEffects();
 document.addEventListener('visibilitychange',visibility,{passive:true});
 window.addEventListener('pageshow',pruneDuplicateEffects,{once:true});
 visibility();
 raf=requestAnimationFrame(sample);
 window.addEventListener('pagehide',()=>cancelAnimationFrame(raf),{once:true});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
})();
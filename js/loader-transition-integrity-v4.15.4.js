/* Seeker Of SoundZ v4.15.4 — loader and transition integrity */
(()=>{
'use strict';
const root=document.documentElement;
function apply(){
 const settings=window.SOSExperience?.get?.()||{};
 root.classList.toggle('sos-loader-swipe-enabled',!!settings.loaderSwipe);
 const loader=document.getElementById('loader');
 if(loader){
  loader.dataset.loaderMode=settings.loader||'signal';
  loader.classList.toggle('loaderSwipeOptIn',!!settings.loaderSwipe);
 }
 const transition=document.getElementById('cubeTransition');
 if(transition){
  transition.dataset.transitionMode=settings.transition||'stellar';
 }
}
function cleanup(){
 document.querySelectorAll('#loader').forEach((node,index)=>{if(index>0)node.remove()});
 document.querySelectorAll('#cubeTransition').forEach((node,index)=>{if(index>0)node.remove()});
 apply();
}
window.addEventListener('sos:experience-applied',apply);
window.addEventListener('pageshow',cleanup);
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',cleanup,{once:true}):cleanup();
})();
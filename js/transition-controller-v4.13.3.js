/* Seeker Of SoundZ v4.13.3 — single-owner, member-selected page transitions. */
(()=>{
'use strict';
const MODES=new Set(['stellar','fade','aperture','warp','scan','cubes','minimal']);
const COVER_MS={stellar:360,fade:240,aperture:360,warp:380,scan:330,cubes:400,minimal:40};
let locked=false,timer=0;
function mode(){const saved=window.SOSExperience?.get?.()?.transition;return MODES.has(saved)?saved:'stellar'}
function node(){return document.getElementById('cubeTransition')}
function reset(){clearTimeout(timer);const n=node();if(n){n.classList.remove('active','sos-transition-running');n.removeAttribute('data-transition-mode')}document.documentElement.classList.remove('sos-page-leaving');document.body?.classList.remove('page-transitioning');locked=false}
function eligible(a,e){if(!a||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return null;if(a.target&&a.target!=='_self'||a.hasAttribute('download')||a.dataset.noTransition!=null)return null;const raw=a.getAttribute('href')||'';if(!raw||raw.startsWith('#')||/^(mailto:|tel:|javascript:)/i.test(raw))return null;const u=new URL(a.href,location.href);if(u.origin!==location.origin||u.href===location.href)return null;return u}
function go(url){if(locked)return;locked=true;const chosen=matchMedia('(prefers-reduced-motion: reduce)').matches?'minimal':mode(),n=node(),ms=COVER_MS[chosen]||360;sessionStorage.setItem('sos_transition_arrival_v4133','1');if(!n||chosen==='minimal'){timer=setTimeout(()=>location.assign(url.href),ms);return}n.classList.remove('active','sos-transition-running');n.dataset.transitionMode=chosen;document.documentElement.classList.add('sos-page-leaving');document.body?.classList.add('page-transitioning');requestAnimationFrame(()=>{requestAnimationFrame(()=>{n.classList.add('active','sos-transition-running');timer=setTimeout(()=>location.assign(url.href),ms)})})}
document.addEventListener('click',e=>{const u=eligible(e.target.closest?.('a[href]'),e);if(!u)return;e.preventDefault();e.stopImmediatePropagation();go(u)},true);
function arrival(){reset();if(sessionStorage.getItem('sos_transition_arrival_v4133')){sessionStorage.removeItem('sos_transition_arrival_v4133');document.documentElement.classList.add('sos-page-ready');requestAnimationFrame(()=>document.documentElement.classList.remove('sos-page-ready'))}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',arrival,{once:true});else arrival();
addEventListener('pageshow',reset);addEventListener('pagehide',()=>{locked=false});
window.SOSTransitions={getMode:mode,play:u=>go(new URL(u,location.href)),reset};
})();

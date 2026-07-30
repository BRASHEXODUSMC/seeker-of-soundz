/* Seeker Of SoundZ v4.13.4 — isolated, non-jumpy member transitions */
(()=>{
'use strict';
const allowed=new Set(['stellar','fade','aperture','warp','scan','cubes','minimal']);
let busy=false,timer=0;
function mode(){const value=window.SOSExperience?.get?.()?.transition;return allowed.has(value)?value:'stellar'}
function overlay(){let el=document.getElementById('sosPageTransition');if(el)return el;el=document.createElement('div');el.id='sosPageTransition';el.setAttribute('aria-hidden','true');el.innerHTML='<div class="sosTransitionBackdrop"></div><div class="sosTransitionVisual"><span class="sosTransitionRing r1"></span><span class="sosTransitionRing r2"></span><span class="sosTransitionCore"></span><span class="sosTransitionScan"></span><i class="sosTransitionCube c1"></i><i class="sosTransitionCube c2"></i><i class="sosTransitionCube c3"></i><i class="sosTransitionCube c4"></i></div>';document.body.appendChild(el);return el}
function reset(){clearTimeout(timer);busy=false;const el=document.getElementById('sosPageTransition');if(el){el.className='';el.removeAttribute('data-mode')}document.documentElement.classList.remove('sosNavigating')}
function eligible(a,e){if(!a||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return null;if(a.target&&a.target!=='_self'||a.hasAttribute('download')||a.dataset.noTransition!=null)return null;const raw=a.getAttribute('href')||'';if(!raw||raw.startsWith('#')||/^(mailto:|tel:|javascript:)/i.test(raw))return null;const u=new URL(a.href,location.href);if(u.origin!==location.origin||u.href===location.href)return null;return u}
function play(url){if(busy)return;busy=true;const selected=matchMedia('(prefers-reduced-motion: reduce)').matches?'minimal':mode();if(selected==='minimal'){location.assign(url.href);return}const el=overlay();el.dataset.mode=selected;document.documentElement.classList.add('sosNavigating');requestAnimationFrame(()=>{el.classList.add('isActive');timer=setTimeout(()=>location.assign(url.href),selected==='warp'?420:360)})}
document.addEventListener('click',e=>{const u=eligible(e.target.closest?.('a[href]'),e);if(!u)return;e.preventDefault();e.stopImmediatePropagation();play(u)},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',overlay,{once:true});else overlay();
addEventListener('pageshow',reset);addEventListener('pagehide',()=>{busy=false});
window.SOSTransitions={getMode:mode,play:u=>play(new URL(u,location.href)),reset};
})();

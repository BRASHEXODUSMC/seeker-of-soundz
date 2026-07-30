/* Seeker Of SoundZ v4.13.7 — cinematic EDM ignition loader, once per tab session */
(()=>{'use strict';const KEY='sos_loader_seen_v4_13_7',loader=document.getElementById('loader');if(!loader)return;
const instant=()=>{loader.classList.add('loaded');loader.setAttribute('aria-hidden','true');document.documentElement.classList.add('sosLoaderSeen')};
try{if(sessionStorage.getItem(KEY)==='1'){instant();return}sessionStorage.setItem(KEY,'1')}catch(e){}
loader.classList.remove('loaded','loaderComplete');loader.setAttribute('aria-hidden','false');document.documentElement.classList.add('sosLoaderRunning');
if(!loader.querySelector('.loaderEqualizer')){const eq=document.createElement('div');eq.className='loaderEqualizer';eq.setAttribute('aria-hidden','true');eq.innerHTML=Array.from({length:28},(_,i)=>`<i style="--i:${i}"></i>`).join('');loader.querySelector('.loaderLogoStage')?.append(eq)}
if(!loader.querySelector('.loaderPulseRing')){const r=document.createElement('div');r.className='loaderPulseRing';loader.querySelector('.loaderLogoStage')?.prepend(r)}
const bar=loader.querySelector('.loaderProgress'),pct=loader.querySelector('.loaderPercent'),status=loader.querySelector('.loaderStatus span');const labels=['Tuning frequencies','Syncing the signal','Charging the soundstage','Opening the frequency'];let start=performance.now(),done=false;
function set(v){const n=Math.min(100,Math.max(0,Math.round(v)));if(bar)bar.style.width=n+'%';if(pct)pct.textContent=n+'%';if(status)status.textContent=labels[Math.min(labels.length-1,Math.floor(n/26))]}
function finish(){if(done)return;done=true;set(100);loader.classList.add('loaderComplete');setTimeout(()=>{loader.classList.add('loaded');loader.setAttribute('aria-hidden','true');document.documentElement.classList.remove('sosLoaderRunning');document.documentElement.classList.add('sosLoaderSeen')},650)}
function frame(now){const p=Math.min(1,(now-start)/1850),e=1-Math.pow(1-p,3);set(e*100);if(p<1)requestAnimationFrame(frame);else finish()}
requestAnimationFrame(frame);setTimeout(finish,3200);
})();
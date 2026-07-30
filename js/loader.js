/* Seeker Of SoundZ v4.13.8 — dubstep waveform loader, once per tab session */
(()=>{'use strict';
const KEY='sos_loader_seen_v4_13_8',loader=document.getElementById('loader');if(!loader)return;
const html=document.documentElement;
const instant=()=>{loader.classList.add('loaded');loader.setAttribute('aria-hidden','true');html.classList.add('sosLoaderSeen');html.classList.remove('sosLoaderRunning')};
try{if(sessionStorage.getItem(KEY)==='1'){instant();return}sessionStorage.setItem(KEY,'1')}catch(e){}
loader.classList.remove('loaded','loaderComplete');loader.setAttribute('aria-hidden','false');html.classList.add('sosLoaderRunning');
const stage=loader.querySelector('.loaderLogoStage');
if(stage&&!stage.querySelector('.loaderWaveformRing')){const ring=document.createElement('div');ring.className='loaderWaveformRing';ring.setAttribute('aria-hidden','true');ring.innerHTML=Array.from({length:72},(_,i)=>`<i style="--i:${i};--r:${(i%12)}"></i>`).join('');stage.prepend(ring)}
if(!loader.querySelector('.loaderBassPulse')){const bass=document.createElement('div');bass.className='loaderBassPulse';bass.setAttribute('aria-hidden','true');stage?.append(bass)}
const bar=loader.querySelector('.loaderProgress'),pct=loader.querySelector('.loaderPercent'),status=loader.querySelector('.loaderStatus span'),brand=loader.querySelector('.loaderBrandName');
const phrases=[
 [0,'Waking the sub frequencies'],[12,'Charging the bass reactor'],[25,'Synchronizing dubstep waveforms'],[39,'Locking onto the rhythm grid'],[54,'Opening the cosmic soundstage'],[69,'Amplifying the Seeker signal'],[83,'Preparing the final drop'],[96,'Seeker Of SoundZ']
];
let start=performance.now(),done=false,last='';
function set(v){const n=Math.max(0,Math.min(100,Math.round(v)));if(bar)bar.style.width=n+'%';if(pct)pct.textContent=n+'%';let text=phrases[0][1];for(const [at,label] of phrases)if(n>=at)text=label;if(text!==last){last=text;if(status){status.classList.remove('statusPulse');void status.offsetWidth;status.textContent=text;status.classList.add('statusPulse')}}if(n>=96&&brand)brand.classList.add('brandFinal')}
function finish(){if(done)return;done=true;set(100);loader.classList.add('loaderComplete');setTimeout(()=>{loader.classList.add('loaded');loader.setAttribute('aria-hidden','true');html.classList.remove('sosLoaderRunning');html.classList.add('sosLoaderSeen')},900)}
function frame(now){const p=Math.min(1,(now-start)/5200);const e=p<.88?(1-Math.pow(1-p/.88,2))*.93:.93+((p-.88)/.12)*.07;set(e*100);if(p<1)requestAnimationFrame(frame);else finish()}
requestAnimationFrame(frame);setTimeout(finish,7200);
})();
